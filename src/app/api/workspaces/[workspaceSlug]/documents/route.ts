import { Buffer } from "node:buffer";

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import {
  computeSha256Checksum,
  createDocumentStoragePath,
  deriveDocumentTitle,
  DOCUMENT_BUCKET,
  findExistingWorkspaceDocumentByChecksum,
  insertDocumentActivityLog,
  insertDocumentIngestionJob,
  maxDocumentUploadSizeBytes,
  newDocumentId,
  validateDocumentFile,
} from "@/lib/documents";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { findWorkspaceAccessBySlug, hasMinimumWorkspaceRole } from "@/lib/workspaces";
import { uploadDocumentSchema } from "@/lib/validation/documents";

type UploadRouteContext = {
  params: Promise<{
    workspaceSlug: string;
  }>;
};

function jsonError(message: string, status: number) {
  return NextResponse.json(
    {
      message,
    },
    {
      status,
    },
  );
}

export async function POST(request: Request, { params }: UploadRouteContext) {
  const { workspaceSlug } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return jsonError("You need an active session to upload documents.", 401);
  }

  const access = await findWorkspaceAccessBySlug(workspaceSlug, user.id);

  if (!access) {
    return jsonError("Workspace not found.", 404);
  }

  if (!hasMinimumWorkspaceRole(access.role, "editor")) {
    return jsonError("Your role cannot upload documents in this workspace.", 403);
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonError("Choose a supported file before uploading.", 400);
  }

  if (file.size === 0) {
    return jsonError("The selected file is empty.", 400);
  }

  if (file.size > maxDocumentUploadSizeBytes) {
    return jsonError("Files must be 25 MB or smaller for this phase.", 400);
  }

  const supportedFile = validateDocumentFile(file.name, file.type);

  if (!supportedFile) {
    return jsonError("Only PDF, Markdown, and plain-text files are supported right now.", 400);
  }

  const parsed = uploadDocumentSchema.safeParse({
    description: formData.get("description"),
    title: formData.get("title"),
  });

  if (!parsed.success) {
    return jsonError(parsed.error.flatten().formErrors[0] ?? "The document details are invalid.", 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const checksumSha256 = computeSha256Checksum(buffer);
  const existingDocument = await findExistingWorkspaceDocumentByChecksum(
    access.workspace.id,
    checksumSha256,
  );

  if (existingDocument) {
    return NextResponse.json(
      {
        documentId: existingDocument.id,
        message: `“${existingDocument.title}” is already stored in this workspace.`,
      },
      {
        status: 409,
      },
    );
  }

  const documentId = newDocumentId();
  const storagePath = createDocumentStoragePath(
    access.workspace.id,
    documentId,
    supportedFile.extension,
  );
  const title = parsed.data.title || deriveDocumentTitle(file.name);
  const description = parsed.data.description || null;
  const contentType = file.type || supportedFile.contentType;
  const { error: uploadError } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .upload(storagePath, buffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    return jsonError(`Unable to upload this file: ${uploadError.message}`, 500);
  }

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .insert({
      checksum_sha256: checksumSha256,
      description,
      file_extension: supportedFile.extension,
      language_code: "en",
      metadata: {
        originalFileName: file.name,
        uploadSource: "app",
      },
      mime_type: contentType,
      size_bytes: file.size,
      source_type: "upload",
      storage_bucket: DOCUMENT_BUCKET,
      storage_path: storagePath,
      title,
      uploaded_by: user.id,
      workspace_id: access.workspace.id,
    })
    .select("id, title")
    .single();

  if (documentError || !document) {
    await supabase.storage.from(DOCUMENT_BUCKET).remove([storagePath]);
    return jsonError(`Unable to save document metadata: ${documentError?.message ?? "Unknown error"}`, 500);
  }

  const { error: queueError } = await insertDocumentIngestionJob({
    documentId: document.id,
    jobKind: "extract",
    payload: {
      checksumSha256,
      contentType,
      fileName: file.name,
      sizeBytes: file.size,
      storagePath,
      title,
    },
    requestedBy: user.id,
    workspaceId: access.workspace.id,
  });

  await insertDocumentActivityLog({
    action: "document.uploaded",
    actorUserId: user.id,
    entityId: document.id,
    payload: {
      fileName: file.name,
      jobQueued: !queueError,
      sizeBytes: file.size,
      title,
    },
    workspaceId: access.workspace.id,
  });

  revalidatePath(`/app/${access.workspace.slug}`);
  revalidatePath(`/app/${access.workspace.slug}/documents`);

  return NextResponse.json(
    {
      documentId: document.id,
      message: queueError
        ? "The document uploaded successfully, but automatic processing was not queued yet."
        : "The document uploaded successfully and was queued for processing.",
      title: document.title,
    },
    {
      status: 201,
    },
  );
}
