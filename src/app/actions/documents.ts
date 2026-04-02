"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";

import {
  insertDocumentActivityLog,
  insertDocumentIngestionJob,
} from "@/lib/documents";
import { requireAuthenticatedUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { asRoute } from "@/lib/utils/as-route";
import { formDataString } from "@/lib/action-utils";
import { mutateDocumentSchema } from "@/lib/validation/documents";
import { findWorkspaceAccessBySlug, hasMinimumWorkspaceRole } from "@/lib/workspaces";
import {
  getIngestionWorkerAvailability,
  runQueuedIngestionJob,
} from "@/server/ingestion/run-job";

function documentRedirectPath(workspaceSlug: string, documentId?: string) {
  if (documentId) {
    return `/app/${workspaceSlug}/documents/${documentId}`;
  }

  return `/app/${workspaceSlug}/documents`;
}

async function requireEditableWorkspaceDocument(formData: FormData) {
  const user = await requireAuthenticatedUser("/app");
  const parsed = mutateDocumentSchema.safeParse({
    documentId: formDataString(formData, "documentId"),
    workspaceId: formDataString(formData, "workspaceId"),
    workspaceSlug: formDataString(formData, "workspaceSlug"),
  });

  if (!parsed.success) {
    redirect(asRoute("/app"));
  }

  const access = await findWorkspaceAccessBySlug(parsed.data.workspaceSlug, user.id);

  if (!access || access.workspace.id !== parsed.data.workspaceId) {
    redirect(asRoute("/app"));
  }

  if (!hasMinimumWorkspaceRole(access.role, "editor")) {
    redirect(asRoute(`${documentRedirectPath(parsed.data.workspaceSlug)}?documents=forbidden`));
  }

  const supabase = await createServerSupabaseClient();
  const { data: document, error } = await supabase
    .from("documents")
    .select("id, title, status, storage_bucket, storage_path")
    .eq("workspace_id", parsed.data.workspaceId)
    .eq("id", parsed.data.documentId)
    .maybeSingle();

  if (error || !document) {
    redirect(asRoute(`${documentRedirectPath(parsed.data.workspaceSlug)}?documents=not-found`));
  }

  return {
    access,
    document,
    parsed: parsed.data,
    supabase,
    user,
  };
}

export async function archiveDocumentAction(formData: FormData) {
  const context = await requireEditableWorkspaceDocument(formData);
  const nextPath = documentRedirectPath(context.parsed.workspaceSlug, context.document.id);

  if (context.document.status !== "archived") {
    const now = new Date().toISOString();

    const { error: documentError } = await context.supabase
      .from("documents")
      .update({
        status: "archived",
      })
      .eq("workspace_id", context.parsed.workspaceId)
      .eq("id", context.document.id);

    if (documentError) {
      redirect(asRoute(`${nextPath}?documents=archive-error`));
    }

    await context.supabase
      .from("ingestion_jobs")
      .update({
        finished_at: now,
        status: "cancelled",
      })
      .eq("workspace_id", context.parsed.workspaceId)
      .eq("document_id", context.document.id)
      .in("status", ["queued", "running"]);

    await insertDocumentActivityLog({
      action: "document.archived",
      actorUserId: context.user.id,
      entityId: context.document.id,
      payload: {
        title: context.document.title,
      },
      workspaceId: context.parsed.workspaceId,
    });
  }

  revalidatePath(`/app/${context.parsed.workspaceSlug}`);
  revalidatePath(`/app/${context.parsed.workspaceSlug}/documents`);
  revalidatePath(nextPath);
  redirect(asRoute(`${nextPath}?documents=archived`));
}

export async function deleteDocumentAction(formData: FormData) {
  const context = await requireEditableWorkspaceDocument(formData);
  const documentsPath = documentRedirectPath(context.parsed.workspaceSlug);

  const { error: storageError } = await context.supabase.storage
    .from(context.document.storage_bucket)
    .remove([context.document.storage_path]);

  if (storageError && !storageError.message.toLowerCase().includes("not found")) {
    redirect(asRoute(`${documentsPath}?documents=delete-storage-error`));
  }

  const { error: deleteError } = await context.supabase
    .from("documents")
    .delete()
    .eq("workspace_id", context.parsed.workspaceId)
    .eq("id", context.document.id);

  if (deleteError) {
    redirect(asRoute(`${documentsPath}?documents=delete-error`));
  }

  await insertDocumentActivityLog({
    action: "document.deleted",
    actorUserId: context.user.id,
    entityId: context.document.id,
    payload: {
      title: context.document.title,
    },
    workspaceId: context.parsed.workspaceId,
  });

  revalidatePath(`/app/${context.parsed.workspaceSlug}`);
  revalidatePath(documentsPath);
  redirect(asRoute(`${documentsPath}?documents=deleted`));
}

export async function reprocessDocumentAction(formData: FormData) {
  const context = await requireEditableWorkspaceDocument(formData);
  const nextPath = documentRedirectPath(context.parsed.workspaceSlug, context.document.id);
  const workerAvailability = getIngestionWorkerAvailability();
  const queuedProgressMessage = workerAvailability.ready ? null : workerAvailability.message;

  if (context.document.status === "archived") {
    redirect(asRoute(`${nextPath}?documents=archived-readonly`));
  }

  const { data: activeJob, error: activeJobError } = await context.supabase
    .from("ingestion_jobs")
    .select("id")
    .eq("workspace_id", context.parsed.workspaceId)
    .eq("document_id", context.document.id)
    .in("status", ["queued", "running"])
    .limit(1)
    .maybeSingle();

  if (activeJobError) {
    redirect(asRoute(`${nextPath}?documents=job-error`));
  }

  if (activeJob) {
    redirect(asRoute(`${nextPath}?documents=already-processing`));
  }

  const jobKind = context.document.status === "indexed" ? "reindex" : "extract";
  const { data: queuedJob, error: jobError } = await insertDocumentIngestionJob({
    documentId: context.document.id,
    jobKind,
    payload: {
      source: "manual-reprocess",
      storagePath: context.document.storage_path,
      title: context.document.title,
    },
    ...(queuedProgressMessage ? { progressMessage: queuedProgressMessage } : {}),
    requestedBy: context.user.id,
    workspaceId: context.parsed.workspaceId,
  });

  if (jobError) {
    redirect(asRoute(`${nextPath}?documents=queue-error`));
  }

  await context.supabase
    .from("documents")
    .update({
      status: "queued",
    })
    .eq("workspace_id", context.parsed.workspaceId)
    .eq("id", context.document.id);

  const backgroundProcessingStarted = Boolean(queuedJob && workerAvailability.ready);

  if (backgroundProcessingStarted && queuedJob) {
    after(async () => {
      try {
        await runQueuedIngestionJob(queuedJob.id);
      } catch (error) {
        console.error("Failed to execute queued reprocessing job.", {
          error,
          jobId: queuedJob.id,
        });
      }
    });
  }

  await insertDocumentActivityLog({
    action: "document.reprocess_queued",
    actorUserId: context.user.id,
    entityId: context.document.id,
    payload: {
      dispatchStatus: backgroundProcessingStarted ? "started" : "queued",
      jobKind,
      title: context.document.title,
    },
    workspaceId: context.parsed.workspaceId,
  });

  revalidatePath(`/app/${context.parsed.workspaceSlug}`);
  revalidatePath(`/app/${context.parsed.workspaceSlug}/documents`);
  revalidatePath(nextPath);
  redirect(asRoute(`${nextPath}?documents=queued`));
}
