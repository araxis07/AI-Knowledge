import { FeatureEmptyState } from "@/components/workspaces/feature-empty-state";
import { requireWorkspaceAccess } from "@/lib/workspaces";

type DocumentsPageProps = {
  params: Promise<{
    workspaceSlug: string;
  }>;
};

export default async function WorkspaceDocumentsPage({ params }: DocumentsPageProps) {
  const { workspaceSlug } = await params;
  const access = await requireWorkspaceAccess(workspaceSlug, "viewer");

  return (
    <FeatureEmptyState
      actionHref={`/app/${access.workspace.slug}/settings`}
      actionLabel="Review workspace defaults"
      description="Document upload, extraction, chunking, and indexing will land in a dedicated ingestion phase. This page is intentionally a polished empty state instead of a toy upload demo."
      eyebrow="Document corpus"
      title={`No indexed corpus is connected to ${access.workspace.name} yet.`}
      workspaceSlug={access.workspace.slug}
    />
  );
}
