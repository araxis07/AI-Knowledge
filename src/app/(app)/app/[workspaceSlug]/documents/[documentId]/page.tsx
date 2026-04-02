import Link from "next/link";
import { notFound } from "next/navigation";

import { DocumentActionForms } from "@/components/documents/document-action-forms";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DownloadIcon, FileStackIcon, RefreshIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { getWorkspaceDocumentDetail, getDocumentKindLabel } from "@/lib/documents";
import { asRoute } from "@/lib/utils/as-route";
import { formatBytes } from "@/lib/utils/format-bytes";
import { getSearchParamValue } from "@/lib/utils/search-param-value";
import { hasMinimumWorkspaceRole, requireWorkspaceAccess } from "@/lib/workspaces";

type DocumentDetailPageProps = {
  params: Promise<{
    documentId: string;
    workspaceSlug: string;
  }>;
  searchParams: Promise<{
    documents?: string | string[];
  }>;
};

const detailNotices: Record<string, string> = {
  "already-processing": "A processing job is already queued or running for this document.",
  archived: "The document was archived successfully.",
  "archived-readonly": "Archived documents cannot be reprocessed until they are restored in a later phase.",
  "archive-error": "The document could not be archived right now.",
  "job-error": "The current ingestion job state could not be loaded.",
  queued: "A new processing job was queued for this document.",
  "queue-error": "The reprocess job could not be queued right now.",
};

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function DocumentDetailPage({
  params,
  searchParams,
}: DocumentDetailPageProps) {
  const { documentId, workspaceSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const access = await requireWorkspaceAccess(workspaceSlug, "viewer");
  const document = await getWorkspaceDocumentDetail(access.workspace.id, documentId);
  const canManageDocuments = hasMinimumWorkspaceRole(access.role, "editor");
  const noticeKey = getSearchParamValue(resolvedSearchParams.documents);
  const notice = noticeKey ? detailNotices[noticeKey] : null;

  if (!document) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              className={buttonStyles({ size: "sm", variant: "secondary" })}
              href={asRoute(`/app/${access.workspace.slug}/documents`)}
            >
              Back to library
            </Link>
            {document.downloadUrl ? (
              <a
                className={buttonStyles({ size: "sm" })}
                href={document.downloadUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open original
                <DownloadIcon />
              </a>
            ) : null}
          </div>
        }
        description={
          document.description ??
          "This detail view is backed by the `documents` row plus the latest ingestion job and signed storage access."
        }
        eyebrow="Document detail"
        kicker={
          <>
            <DocumentStatusBadge status={document.displayStatus} />
            <Badge>{getDocumentKindLabel(document.kind)}</Badge>
            <Badge>{formatBytes(document.sizeBytes)}</Badge>
          </>
        }
        title={document.title}
      />

      {notice ? (
        <Card className="border-cyan-200 bg-cyan-50/80 p-5 text-sm text-cyan-900">{notice}</Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="inline-flex size-11 items-center justify-center rounded-full border border-[var(--app-border)] bg-white/84 text-slate-900">
              <FileStackIcon />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                Stored metadata
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Database-backed attributes persisted at upload time.
              </p>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.35rem] border border-[var(--app-border)] bg-white/84 p-4">
              <dt className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                File type
              </dt>
              <dd className="mt-2 text-sm font-medium text-slate-950">
                {getDocumentKindLabel(document.kind)}
              </dd>
            </div>
            <div className="rounded-[1.35rem] border border-[var(--app-border)] bg-white/84 p-4">
              <dt className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Uploaded
              </dt>
              <dd className="mt-2 text-sm font-medium text-slate-950">
                {formatTimestamp(document.createdAt)}
              </dd>
            </div>
            <div className="rounded-[1.35rem] border border-[var(--app-border)] bg-white/84 p-4">
              <dt className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Last updated
              </dt>
              <dd className="mt-2 text-sm font-medium text-slate-950">
                {formatTimestamp(document.updatedAt)}
              </dd>
            </div>
            <div className="rounded-[1.35rem] border border-[var(--app-border)] bg-white/84 p-4">
              <dt className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Original size
              </dt>
              <dd className="mt-2 text-sm font-medium text-slate-950">
                {formatBytes(document.sizeBytes)}
              </dd>
            </div>
            <div className="rounded-[1.35rem] border border-[var(--app-border)] bg-white/84 p-4 sm:col-span-2">
              <dt className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Storage object
              </dt>
              <dd className="mt-2 break-all font-mono text-xs text-slate-700">
                {document.storageBucket}/{document.storagePath}
              </dd>
            </div>
            {document.checksumSha256 ? (
              <div className="rounded-[1.35rem] border border-[var(--app-border)] bg-white/84 p-4 sm:col-span-2">
                <dt className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                  SHA-256 checksum
                </dt>
                <dd className="mt-2 break-all font-mono text-xs text-slate-700">
                  {document.checksumSha256}
                </dd>
              </div>
            ) : null}
          </dl>
        </Card>

        <Card className="p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="inline-flex size-11 items-center justify-center rounded-full border border-[var(--app-border)] bg-white/84 text-slate-900">
              <RefreshIcon />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                Processing foundation
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Upload and reprocess actions create ingestion job rows that later phases can
                consume.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="rounded-[1.35rem] border border-[var(--app-border)] bg-white/84 p-4">
              <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Latest job
              </p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {document.latestJob
                  ? `${document.latestJob.jobKind} · ${document.latestJob.status}`
                  : "No processing job has been recorded yet."}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Started: {formatTimestamp(document.latestJob?.startedAt ?? null)}
                <br />
                Finished: {formatTimestamp(document.latestJob?.finishedAt ?? null)}
              </p>
              {document.latestJob?.errorMessage ? (
                <p className="mt-3 rounded-[1rem] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {document.latestJob.errorMessage}
                </p>
              ) : null}
            </div>

            {canManageDocuments ? (
              <div className="rounded-[1.35rem] border border-[var(--app-border)] bg-[var(--app-panel-muted)] p-4">
                <p className="text-sm font-semibold text-slate-950">Document actions</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Archive stops active jobs. Delete removes both the storage object and database row.
                </p>
                <DocumentActionForms
                  allowDelete
                  className="mt-4 flex flex-wrap gap-3"
                  documentId={document.id}
                  status={document.displayStatus}
                  workspaceId={access.workspace.id}
                  workspaceSlug={access.workspace.slug}
                />
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      <Card className="p-6 sm:p-7">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          Content preview
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Text-like files render a direct preview here. PDFs stay private in storage and open from
          the signed original link above.
        </p>

        {document.previewContent ? (
          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[var(--app-border)] bg-slate-950">
            <div className="border-b border-white/10 px-4 py-3 text-xs font-semibold tracking-[0.18em] text-slate-300 uppercase">
              {document.previewLabel}
            </div>
            <pre className="max-h-[32rem] overflow-auto p-4 text-sm leading-7 whitespace-pre-wrap text-slate-100">
              {document.previewContent}
            </pre>
          </div>
        ) : (
          <div className="mt-6 rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-panel-muted)] p-5 text-sm leading-7 text-slate-600">
            {document.kind === "pdf"
              ? "PDF preview stays outside this page for now. Use the signed original link to open the uploaded file."
              : "This document is too large for an inline preview in the current phase."}
          </div>
        )}
      </Card>
    </div>
  );
}
