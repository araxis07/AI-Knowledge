import { createHash, randomUUID } from "node:crypto";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  deriveDocumentTitle,
  deriveLibraryDocumentStatus,
  getDocumentKind,
  getDocumentKindLabel,
  validateDocumentFile,
  createDocumentStoragePath,
  documentAcceptAttribute,
  maxDocumentUploadSizeBytes,
  normalizeFileExtension,
  supportedDocumentMimeLabels,
} from "@/lib/document-format";
import type {
  DocumentJobSummary,
  IngestionJobKind,
  IngestionJobStatus,
  RawDocumentStatus,
  WorkspaceDocumentDetail,
  WorkspaceDocumentSummary,
} from "@/lib/types/documents";

const DOCUMENT_BUCKET = "documents";
const TEXT_PREVIEW_MAX_BYTES = 1024 * 1024;

type DocumentRow = {
  checksum_sha256: string | null;
  chunk_count: number | null;
  created_at: string;
  description: string | null;
  embedding_model: string | null;
  embedding_provider: string | null;
  extracted_char_count: number | null;
  file_extension: string | null;
  id: string;
  indexed_at: string | null;
  last_ingested_at: string | null;
  metadata: Record<string, unknown> | null;
  mime_type: string;
  page_count: number | null;
  size_bytes: number;
  status: RawDocumentStatus;
  storage_bucket: string;
  storage_path: string;
  summary: string | null;
  title: string;
  token_count: number | null;
  updated_at: string;
};

type IngestionJobRow = {
  created_at: string;
  document_id: string;
  error_code: string | null;
  error_message: string | null;
  finished_at: string | null;
  id: string;
  job_kind: IngestionJobKind;
  progress_message: string | null;
  progress_metadata: Record<string, unknown> | null;
  started_at: string | null;
  status: IngestionJobStatus;
  steps_completed: number | null;
  steps_total: number | null;
  updated_at: string;
};

type InsertedJobRow = {
  created_at: string;
  document_id: string;
  id: string;
  status: IngestionJobStatus;
};

export type QueuedIngestionJob = {
  createdAt: string;
  documentId: string;
  id: string;
  status: IngestionJobStatus;
};

export function computeSha256Checksum(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export function newDocumentId() {
  return randomUUID();
}

function mapDocumentJob(row: IngestionJobRow): DocumentJobSummary {
  return {
    createdAt: row.created_at,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    finishedAt: row.finished_at,
    id: row.id,
    jobKind: row.job_kind,
    progressMessage: row.progress_message,
    progressMetadata: row.progress_metadata ?? {},
    startedAt: row.started_at,
    status: row.status,
    stepsCompleted: row.steps_completed ?? 0,
    stepsTotal: row.steps_total ?? 0,
    updatedAt: row.updated_at,
  };
}

function selectPreferredLatestJob(rows: IngestionJobRow[]): DocumentJobSummary | null {
  if (rows.length === 0) {
    return null;
  }

  const activeJob = rows.find((row) => row.status === "queued" || row.status === "running");

  return mapDocumentJob(activeJob ?? rows[0]!);
}

function mapDocumentSummary(
  row: DocumentRow,
  latestJob: DocumentJobSummary | null,
): WorkspaceDocumentSummary {
  const kind = getDocumentKind(row.file_extension, row.mime_type);

  return {
    checksumSha256: row.checksum_sha256,
    chunkCount: row.chunk_count,
    createdAt: row.created_at,
    description: row.description,
    displayStatus: deriveLibraryDocumentStatus(row.status, latestJob),
    embeddingModel: row.embedding_model,
    embeddingProvider: row.embedding_provider,
    extractedCharCount: row.extracted_char_count,
    fileExtension: row.file_extension,
    id: row.id,
    indexedAt: row.indexed_at,
    kind,
    lastIngestedAt: row.last_ingested_at,
    latestJob,
    mimeType: row.mime_type,
    pageCount: row.page_count,
    sizeBytes: row.size_bytes,
    status: row.status,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    summary: row.summary,
    title: row.title,
    tokenCount: row.token_count,
    updatedAt: row.updated_at,
  };
}

export async function listWorkspaceDocuments(
  workspaceId: string,
): Promise<WorkspaceDocumentSummary[]> {
  const supabase = await createServerSupabaseClient();
  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select(
      "id, title, description, summary, storage_bucket, storage_path, mime_type, file_extension, size_bytes, checksum_sha256, page_count, token_count, chunk_count, extracted_char_count, embedding_provider, embedding_model, indexed_at, last_ingested_at, status, metadata, created_at, updated_at",
    )
    .eq("workspace_id", workspaceId)
    .order("updated_at", {
      ascending: false,
    });

  if (documentsError) {
    throw new Error(`Unable to load documents: ${documentsError.message}`);
  }

  if (!documents || documents.length === 0) {
    return [];
  }

  const documentIds = documents.map((document) => document.id);
  const { data: jobs, error: jobsError } = await supabase
    .from("ingestion_jobs")
    .select(
      "id, document_id, job_kind, status, error_code, error_message, progress_message, progress_metadata, steps_completed, steps_total, started_at, finished_at, created_at, updated_at",
    )
    .eq("workspace_id", workspaceId)
    .in("document_id", documentIds)
    .order("created_at", {
      ascending: false,
    });

  if (jobsError) {
    throw new Error(`Unable to load ingestion jobs: ${jobsError.message}`);
  }

  const jobsByDocumentId = new Map<string, IngestionJobRow[]>();

  for (const job of jobs ?? []) {
    const documentJobs = jobsByDocumentId.get(job.document_id) ?? [];
    documentJobs.push(job as IngestionJobRow);
    jobsByDocumentId.set(job.document_id, documentJobs);
  }

  return documents.map((document) =>
    mapDocumentSummary(
      document as DocumentRow,
      selectPreferredLatestJob(jobsByDocumentId.get(document.id) ?? []),
    ),
  );
}

export async function getWorkspaceDocument(
  workspaceId: string,
  documentId: string,
): Promise<WorkspaceDocumentSummary | null> {
  const supabase = await createServerSupabaseClient();
  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select(
      "id, title, description, summary, storage_bucket, storage_path, mime_type, file_extension, size_bytes, checksum_sha256, page_count, token_count, chunk_count, extracted_char_count, embedding_provider, embedding_model, indexed_at, last_ingested_at, status, metadata, created_at, updated_at",
    )
    .eq("workspace_id", workspaceId)
    .eq("id", documentId)
    .maybeSingle();

  if (documentError) {
    throw new Error(`Unable to load document: ${documentError.message}`);
  }

  if (!document) {
    return null;
  }

  const { data: jobs, error: jobsError } = await supabase
    .from("ingestion_jobs")
    .select(
      "id, document_id, job_kind, status, error_code, error_message, progress_message, progress_metadata, steps_completed, steps_total, started_at, finished_at, created_at, updated_at",
    )
    .eq("workspace_id", workspaceId)
    .eq("document_id", documentId)
    .order("created_at", {
      ascending: false,
    });

  if (jobsError) {
    throw new Error(`Unable to load document jobs: ${jobsError.message}`);
  }

  return mapDocumentSummary(
    document as DocumentRow,
    selectPreferredLatestJob((jobs ?? []) as IngestionJobRow[]),
  );
}

export async function getWorkspaceDocumentDetail(
  workspaceId: string,
  documentId: string,
): Promise<WorkspaceDocumentDetail | null> {
  const document = await getWorkspaceDocument(workspaceId, documentId);

  if (!document) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const { data: signedUrlData } = await supabase.storage
    .from(document.storageBucket)
    .createSignedUrl(document.storagePath, 60 * 10, {
      download: false,
    });

  let previewContent: string | null = null;
  let previewLabel: string | null = null;

  if (document.kind !== "pdf" && document.sizeBytes <= TEXT_PREVIEW_MAX_BYTES) {
    const { data: blob, error } = await supabase.storage
      .from(document.storageBucket)
      .download(document.storagePath);

    if (!error && blob) {
      previewContent = (await blob.text()).slice(0, 12000);
      previewLabel =
        document.kind === "markdown" ? "Markdown preview" : "Plain-text preview";
    }
  }

  return {
    ...document,
    downloadUrl: signedUrlData?.signedUrl ?? null,
    previewContent,
    previewLabel,
  };
}

export async function findExistingWorkspaceDocumentByChecksum(
  workspaceId: string,
  checksumSha256: string,
) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, title, status")
    .eq("workspace_id", workspaceId)
    .eq("checksum_sha256", checksumSha256)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to check duplicate documents: ${error.message}`);
  }

  return data;
}

export async function insertDocumentActivityLog(input: {
  action: string;
  actorUserId: string;
  entityId: string;
  payload?: Record<string, unknown>;
  workspaceId: string;
}) {
  const supabase = await createServerSupabaseClient();

  await supabase.from("activity_logs").insert({
    action: input.action,
    actor_type: "user",
    actor_user_id: input.actorUserId,
    entity_id: input.entityId,
    entity_type: "document",
    payload: input.payload ?? {},
    workspace_id: input.workspaceId,
  });
}

export async function insertDocumentIngestionJob(input: {
  documentId: string;
  jobKind: IngestionJobKind;
  payload?: Record<string, unknown>;
  progressMessage?: string;
  requestedBy: string;
  stepsTotal?: number;
  workspaceId: string;
}): Promise<{ data: QueuedIngestionJob | null; error: { message: string } | null }> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("ingestion_jobs")
    .insert({
      document_id: input.documentId,
      job_kind: input.jobKind,
      payload: input.payload ?? {},
      progress_message: input.progressMessage ?? "Queued for processing.",
      requested_by: input.requestedBy,
      status: "queued",
      steps_completed: 0,
      steps_total: input.stepsTotal ?? 7,
      workspace_id: input.workspaceId,
    })
    .select("id, document_id, status, created_at")
    .single();

  return {
    data: data
      ? {
          createdAt: (data as InsertedJobRow).created_at,
          documentId: (data as InsertedJobRow).document_id,
          id: (data as InsertedJobRow).id,
          status: (data as InsertedJobRow).status,
        }
      : null,
    error: error ? { message: error.message } : null,
  };
}

export { DOCUMENT_BUCKET };
export {
  createDocumentStoragePath,
  deriveDocumentTitle,
  documentAcceptAttribute,
  getDocumentKindLabel,
  maxDocumentUploadSizeBytes,
  normalizeFileExtension,
  supportedDocumentMimeLabels,
  validateDocumentFile,
};
