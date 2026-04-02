import "server-only";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { getOptionalSupabaseServiceRoleConfig } from "@/lib/supabase/config";
import { readServerEnv } from "@/lib/env";
import { buildChunks } from "@/server/ingestion/chunking";
import { createEmbeddingProvider, toPgvectorLiteral } from "@/server/ingestion/embeddings";
import { extractDocumentText } from "@/server/ingestion/extract";
import {
  createChunkSources,
  createDocumentSummary,
  normalizeExtractedText,
} from "@/server/ingestion/normalize";

const INGESTION_STEPS_TOTAL = 7;
const EMBEDDING_BATCH_SIZE = 24;

type ProcessingJobRow = {
  document_id: string;
  id: string;
  job_kind: string;
  payload: Record<string, unknown> | null;
  workspace_id: string;
};

type ProcessingDocumentRow = {
  description: string | null;
  file_extension: string | null;
  id: string;
  mime_type: string;
  size_bytes: number;
  status: string;
  storage_bucket: string;
  storage_path: string;
  title: string;
  workspace_id: string;
};

type WorkerAvailability =
  | { ready: true }
  | { message: string; ready: false };

type ChunkInsertRow = {
  chunk_index: number;
  content: string;
  document_id: string;
  embedding: string;
  embedding_dimensions: number;
  embedding_model: string;
  heading: string | null;
  metadata: Record<string, unknown>;
  page_number: number | null;
  token_count: number;
  workspace_id: string;
};

function normalizeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown ingestion failure.";
}

function deriveErrorCode(error: unknown) {
  const message = normalizeErrorMessage(error).toLowerCase();

  if (message.includes("openai_api_key")) {
    return "missing_openai_api_key";
  }

  if (message.includes("embedding")) {
    return "embedding_failed";
  }

  if (message.includes("pdf")) {
    return "pdf_extraction_failed";
  }

  if (message.includes("storage")) {
    return "storage_download_failed";
  }

  return "ingestion_failed";
}

export function getIngestionWorkerAvailability(): WorkerAvailability {
  if (!getOptionalSupabaseServiceRoleConfig()) {
    return {
      message: "Queued for processing. Add SUPABASE_SERVICE_ROLE_KEY to enable the ingestion worker.",
      ready: false,
    };
  }

  const env = readServerEnv();

  if (!env.OPENAI_API_KEY) {
    return {
      message: "Queued for processing. Add OPENAI_API_KEY to generate embeddings.",
      ready: false,
    };
  }

  return {
    ready: true,
  };
}

async function updateJobProgress(input: {
  jobId: string;
  message: string;
  progressMetadata?: Record<string, unknown>;
  stepsCompleted: number;
}) {
  const supabase = createServiceRoleSupabaseClient();

  await supabase
    .from("ingestion_jobs")
    .update({
      last_heartbeat_at: new Date().toISOString(),
      progress_message: input.message,
      progress_metadata: input.progressMetadata ?? {},
      steps_completed: input.stepsCompleted,
      steps_total: INGESTION_STEPS_TOTAL,
    })
    .eq("id", input.jobId);
}

async function markJobFailed(input: {
  documentId: string;
  error: unknown;
  jobId: string;
  workspaceId: string;
}) {
  const supabase = createServiceRoleSupabaseClient();
  const finishedAt = new Date().toISOString();
  const errorMessage = normalizeErrorMessage(input.error);

  await supabase
    .from("ingestion_jobs")
    .update({
      error_code: deriveErrorCode(input.error),
      error_message: errorMessage,
      finished_at: finishedAt,
      last_heartbeat_at: finishedAt,
      progress_metadata: {
        errorCode: deriveErrorCode(input.error),
      },
      progress_message: "Processing failed.",
      status: "failed",
    })
    .eq("id", input.jobId);

  await supabase
    .from("documents")
    .update({
      status: "failed",
    })
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.documentId);

  await supabase.from("activity_logs").insert({
    action: "document.ingestion_failed",
    actor_type: "system",
    entity_id: input.documentId,
    entity_type: "document",
    payload: {
      errorCode: deriveErrorCode(input.error),
      errorMessage,
      jobId: input.jobId,
    },
    workspace_id: input.workspaceId,
  });
}

async function claimQueuedJob(jobId: string): Promise<ProcessingJobRow | null> {
  const supabase = createServiceRoleSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("ingestion_jobs")
    .update({
      attempt_count: 1,
      error_code: null,
      error_message: null,
      last_heartbeat_at: now,
      progress_message: "Starting background processing.",
      started_at: now,
      status: "running",
      steps_completed: 0,
      steps_total: INGESTION_STEPS_TOTAL,
      updated_at: now,
      worker_ref: `next-after:${jobId}`,
    })
    .eq("id", jobId)
    .eq("status", "queued")
    .select("id, document_id, workspace_id, job_kind, payload")
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to claim ingestion job: ${error.message}`);
  }

  return (data as ProcessingJobRow | null) ?? null;
}

async function loadDocumentForJob(
  workspaceId: string,
  documentId: string,
): Promise<ProcessingDocumentRow> {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("documents")
    .select(
      "id, workspace_id, title, description, storage_bucket, storage_path, mime_type, file_extension, size_bytes, status",
    )
    .eq("workspace_id", workspaceId)
    .eq("id", documentId)
    .single();

  if (error || !data) {
    throw new Error(`Unable to load document for ingestion: ${error?.message ?? "Unknown error"}`);
  }

  return data as ProcessingDocumentRow;
}

async function downloadDocumentBuffer(input: {
  bucket: string;
  jobId: string;
  path: string;
}) {
  await updateJobProgress({
    jobId: input.jobId,
    message: "Downloading source file.",
    stepsCompleted: 1,
  });

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase.storage.from(input.bucket).download(input.path);

  if (error || !data) {
    throw new Error(`Unable to download storage object: ${error?.message ?? "Unknown error"}`);
  }

  return Buffer.from(await data.arrayBuffer());
}

async function insertDocumentChunks(input: {
  chunks: ReturnType<typeof buildChunks>;
  documentId: string;
  embeddingModel: string;
  embeddingProvider: string;
  embeddings: number[][];
  jobId: string;
  workspaceId: string;
}) {
  const supabase = createServiceRoleSupabaseClient();
  await updateJobProgress({
    jobId: input.jobId,
    message: "Writing chunks to the database.",
    progressMetadata: {
      chunkCount: input.chunks.length,
    },
    stepsCompleted: 6,
  });

  await supabase
    .from("document_chunks")
    .delete()
    .eq("workspace_id", input.workspaceId)
    .eq("document_id", input.documentId);

  for (let start = 0; start < input.chunks.length; start += EMBEDDING_BATCH_SIZE) {
    const slice = input.chunks.slice(start, start + EMBEDDING_BATCH_SIZE);
    const rows: ChunkInsertRow[] = slice.map((chunk) => {
      const embedding = input.embeddings[chunk.chunkIndex];

      if (!embedding) {
        throw new Error(`Missing embedding for chunk ${chunk.chunkIndex}.`);
      }

      return {
        chunk_index: chunk.chunkIndex,
        content: chunk.content,
        document_id: input.documentId,
        embedding: toPgvectorLiteral(embedding),
        embedding_dimensions: embedding.length,
        embedding_model: input.embeddingModel,
        heading: chunk.heading,
        metadata: {
          ...chunk.metadata,
          embeddingProvider: input.embeddingProvider,
        },
        page_number: chunk.pageNumber,
        token_count: chunk.tokenCount,
        workspace_id: input.workspaceId,
      };
    });

    const { error } = await supabase.from("document_chunks").insert(rows);

    if (error) {
      throw new Error(`Unable to insert document chunks: ${error.message}`);
    }
  }
}

export async function runQueuedIngestionJob(jobId: string) {
  const claimedJob = await claimQueuedJob(jobId);

  if (!claimedJob) {
    return;
  }

  const supabase = createServiceRoleSupabaseClient();

  try {
    const document = await loadDocumentForJob(claimedJob.workspace_id, claimedJob.document_id);

    await supabase
      .from("documents")
      .update({
        status: "processing",
      })
      .eq("workspace_id", claimedJob.workspace_id)
      .eq("id", document.id);

    const buffer = await downloadDocumentBuffer({
      bucket: document.storage_bucket,
      jobId: claimedJob.id,
      path: document.storage_path,
    });

    await updateJobProgress({
      jobId: claimedJob.id,
      message: "Extracting text from the source file.",
      stepsCompleted: 2,
    });

    const { extracted, kind } = await extractDocumentText({
      buffer,
      fileExtension: document.file_extension,
      mimeType: document.mime_type,
    });
    const normalizedText = normalizeExtractedText(extracted.text);

    if (!normalizedText) {
      throw new Error("The document did not produce any extractable text.");
    }

    await updateJobProgress({
      jobId: claimedJob.id,
      message: "Normalizing extracted text.",
      progressMetadata: {
        extractedCharacters: normalizedText.length,
        pageCount: extracted.pageCount,
      },
      stepsCompleted: 3,
    });

    const chunkSources = createChunkSources({
      kind,
      pages: extracted.pages.map((page) => ({
        pageNumber: page.pageNumber,
        text: normalizeExtractedText(page.text),
      })),
      text: normalizedText,
    });
    const chunks = buildChunks(chunkSources);

    if (chunks.length === 0) {
      throw new Error("The document could not be split into chunks.");
    }

    await updateJobProgress({
      jobId: claimedJob.id,
      message: "Splitting the document into chunks.",
      progressMetadata: {
        chunkCount: chunks.length,
      },
      stepsCompleted: 4,
    });

    const embeddingProvider = createEmbeddingProvider();
    const embeddings: number[][] = [];

    await supabase
      .from("ingestion_jobs")
      .update({
        provider_key: embeddingProvider.key,
      })
      .eq("id", claimedJob.id);

    await updateJobProgress({
      jobId: claimedJob.id,
      message: "Generating embeddings for chunks.",
      progressMetadata: {
        chunkCount: chunks.length,
        embeddingModel: embeddingProvider.model,
        embeddingProvider: embeddingProvider.key,
      },
      stepsCompleted: 5,
    });

    for (let start = 0; start < chunks.length; start += EMBEDDING_BATCH_SIZE) {
      const batch = chunks.slice(start, start + EMBEDDING_BATCH_SIZE);
      const batchVectors = await embeddingProvider.embedTexts(batch.map((chunk) => chunk.content));
      embeddings.push(...batchVectors);

      await updateJobProgress({
        jobId: claimedJob.id,
        message: "Generating embeddings for chunks.",
        progressMetadata: {
          chunkCount: chunks.length,
          embeddedChunks: embeddings.length,
          embeddingModel: embeddingProvider.model,
          embeddingProvider: embeddingProvider.key,
        },
        stepsCompleted: 5,
      });
    }

    await insertDocumentChunks({
      chunks,
      documentId: document.id,
      embeddingModel: embeddingProvider.model,
      embeddingProvider: embeddingProvider.key,
      embeddings,
      jobId: claimedJob.id,
      workspaceId: claimedJob.workspace_id,
    });

    await updateJobProgress({
      jobId: claimedJob.id,
      message: "Finalizing document metadata.",
      progressMetadata: {
        chunkCount: chunks.length,
        embeddedChunks: embeddings.length,
      },
      stepsCompleted: 7,
    });

    const totalTokenCount = chunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0);
    const finishedAt = new Date().toISOString();
    const summary = createDocumentSummary(normalizedText);

    const { error: documentUpdateError } = await supabase
      .from("documents")
      .update({
        chunk_count: chunks.length,
        embedding_model: embeddingProvider.model,
        embedding_provider: embeddingProvider.key,
        extracted_char_count: normalizedText.length,
        indexed_at: finishedAt,
        last_ingested_at: finishedAt,
        page_count: extracted.pageCount,
        status: "indexed",
        summary,
        token_count: totalTokenCount,
      })
      .eq("workspace_id", claimedJob.workspace_id)
      .eq("id", document.id);

    if (documentUpdateError) {
      throw new Error(`Unable to finalize document metadata: ${documentUpdateError.message}`);
    }

    const { error: jobUpdateError } = await supabase
      .from("ingestion_jobs")
      .update({
        finished_at: finishedAt,
        last_heartbeat_at: finishedAt,
        progress_message: "Document is ready.",
        progress_metadata: {
          chunkCount: chunks.length,
          embeddedChunks: embeddings.length,
          extractedCharacters: normalizedText.length,
          pageCount: extracted.pageCount,
        },
        result: {
          chunkCount: chunks.length,
          embeddingModel: embeddingProvider.model,
          embeddingProvider: embeddingProvider.key,
          extractedCharacters: normalizedText.length,
          kind,
          pageCount: extracted.pageCount,
          tokenCount: totalTokenCount,
        },
        status: "completed",
        steps_completed: INGESTION_STEPS_TOTAL,
        steps_total: INGESTION_STEPS_TOTAL,
      })
      .eq("id", claimedJob.id);

    if (jobUpdateError) {
      throw new Error(`Unable to finalize ingestion job: ${jobUpdateError.message}`);
    }

    await supabase.from("activity_logs").insert({
      action: "document.ingested",
      actor_type: "system",
      entity_id: document.id,
      entity_type: "document",
      payload: {
        chunkCount: chunks.length,
        embeddingModel: embeddingProvider.model,
        embeddingProvider: embeddingProvider.key,
        jobId: claimedJob.id,
        tokenCount: totalTokenCount,
      },
      workspace_id: claimedJob.workspace_id,
    });
  } catch (error) {
    await markJobFailed({
      documentId: claimedJob.document_id,
      error,
      jobId: claimedJob.id,
      workspaceId: claimedJob.workspace_id,
    });
  }
}
