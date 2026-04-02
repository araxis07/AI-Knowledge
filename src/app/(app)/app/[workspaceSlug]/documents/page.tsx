import Link from "next/link";

import { DocumentActionForms } from "@/components/documents/document-action-forms";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { DocumentUploadPanel } from "@/components/documents/document-upload-panel";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ActivityIcon,
  ArrowUpRightIcon,
  CheckCircleIcon,
  ClockIcon,
  FileStackIcon,
  UploadIcon,
} from "@/components/ui/icons";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import {
  getDocumentKindLabel,
  listWorkspaceDocuments,
} from "@/lib/documents";
import { asRoute } from "@/lib/utils/as-route";
import { formatBytes } from "@/lib/utils/format-bytes";
import { getSearchParamValue } from "@/lib/utils/search-param-value";
import { hasMinimumWorkspaceRole, requireWorkspaceAccess } from "@/lib/workspaces";

type WorkspaceDocumentsPageProps = {
  params: Promise<{
    workspaceSlug: string;
  }>;
  searchParams: Promise<{
    documents?: string | string[];
  }>;
};

const documentNotices: Record<string, string> = {
  archived: "The document was archived and active processing jobs were cancelled.",
  "delete-error": "The document record could not be deleted right now.",
  "delete-storage-error": "The document file could not be removed from storage right now.",
  deleted: "The document was deleted from storage and removed from the library.",
  forbidden: "Your role does not allow document mutations in this workspace.",
  "not-found": "That document no longer exists in this workspace.",
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getDocumentStatusNote() {
  return "Uploads write metadata to Postgres immediately and keep the original file in the private workspace bucket.";
}

export default async function WorkspaceDocumentsPage({
  params,
  searchParams,
}: WorkspaceDocumentsPageProps) {
  const { workspaceSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const access = await requireWorkspaceAccess(workspaceSlug, "viewer");
  const documents = await listWorkspaceDocuments(access.workspace.id);
  const canManageDocuments = hasMinimumWorkspaceRole(access.role, "editor");
  const noticeKey = getSearchParamValue(resolvedSearchParams.documents);
  const notice = noticeKey ? documentNotices[noticeKey] : null;
  const readyCount = documents.filter((document) => document.displayStatus === "ready").length;
  const processingCount = documents.filter(
    (document) => document.displayStatus === "processing",
  ).length;
  const failedCount = documents.filter((document) => document.displayStatus === "failed").length;
  const totalBytes = documents.reduce((sum, document) => sum + document.sizeBytes, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          canManageDocuments ? (
            <Badge className="border-cyan-200 bg-cyan-50 text-cyan-700">
              Editor access enabled
            </Badge>
          ) : (
            <Badge>Viewer access</Badge>
          )
        }
        description="Keep the source corpus private per workspace, register every upload in Postgres, and make document state visible before chunking and retrieval layers arrive."
        eyebrow="Document library"
        title={`${access.workspace.name} library`}
      />

      {notice ? (
        <Card className="border-amber-200 bg-amber-50/80 p-5 text-sm text-amber-900">
          {notice}
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<FileStackIcon />}
          label="Documents"
          note="Rows persisted in the workspace library."
          tone="tint"
          value={String(documents.length)}
        />
        <MetricCard
          icon={<CheckCircleIcon />}
          label="Ready"
          note="Indexed documents surface as ready."
          value={String(readyCount)}
        />
        <MetricCard
          icon={<ClockIcon />}
          label="Processing"
          note="Queued or running ingestion activity."
          value={String(processingCount)}
        />
        <MetricCard
          icon={<ActivityIcon />}
          label="Storage footprint"
          note={failedCount > 0 ? `${failedCount} document(s) need attention.` : getDocumentStatusNote()}
          value={formatBytes(totalBytes)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        {canManageDocuments ? (
          <DocumentUploadPanel workspaceSlug={access.workspace.slug} />
        ) : (
          <Card className="p-6 sm:p-7">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Uploads are role-gated
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Viewers can browse the workspace corpus but cannot add, archive, or delete source
              files. Upgrade to editor access or higher to manage the library.
            </p>
            <div className="mt-6 rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-panel-muted)] p-5 text-sm leading-6 text-slate-600">
              The current role for this workspace is{" "}
              <span className="font-semibold text-slate-950">{access.role}</span>.
            </div>
          </Card>
        )}

        <Card className="p-6 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                Corpus inventory
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Every row below is backed by the `documents` table and scoped by workspace RLS.
              </p>
            </div>
            <Badge className="border-slate-200 bg-slate-100 text-slate-700">
              {documents.length} total
            </Badge>
          </div>

          {documents.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                actions={
                  canManageDocuments ? (
                    <p className="text-sm leading-6 text-slate-500">
                      Upload the first file to create a real document row and storage object for
                      this workspace.
                    </p>
                  ) : undefined
                }
                description="The library is still empty. Once documents are uploaded, this page will show storage-backed metadata, processing state, and links into document detail views."
                eyebrow="Empty library"
                icon={<UploadIcon />}
                title={`No documents are registered in ${access.workspace.name} yet.`}
              />
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {documents.map((document) => (
                <Card
                  className="border-[var(--app-border)] bg-white/85 p-5 transition hover:-translate-y-0.5 hover:border-[var(--app-border-strong)]"
                  key={document.id}
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          className="text-lg font-semibold tracking-tight text-slate-950 transition hover:text-teal-800"
                          href={asRoute(`/app/${access.workspace.slug}/documents/${document.id}`)}
                        >
                          {document.title}
                        </Link>
                        <DocumentStatusBadge status={document.displayStatus} />
                        <Badge>{getDocumentKindLabel(document.kind)}</Badge>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {document.description ??
                          "No manual description has been added for this document yet."}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                        <span>{formatBytes(document.sizeBytes)}</span>
                        <span>Updated {formatTimestamp(document.updatedAt)}</span>
                        {document.pageCount ? <span>{document.pageCount} pages</span> : null}
                        {document.latestJob?.status ? (
                          <span>Latest job: {document.latestJob.status}</span>
                        ) : null}
                      </div>

                      {document.latestJob?.errorMessage ? (
                        <p className="mt-3 rounded-[1rem] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                          {document.latestJob.errorMessage}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-3 xl:items-end">
                      <Link
                        className={buttonStyles({ size: "sm", variant: "secondary" })}
                        href={asRoute(`/app/${access.workspace.slug}/documents/${document.id}`)}
                      >
                        Open detail
                        <ArrowUpRightIcon />
                      </Link>

                      {canManageDocuments ? (
                        <DocumentActionForms
                          className="flex flex-wrap gap-2 xl:justify-end"
                          documentId={document.id}
                          status={document.displayStatus}
                          workspaceId={access.workspace.id}
                          workspaceSlug={access.workspace.slug}
                        />
                      ) : null}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
