import { FeatureEmptyState } from "@/components/workspaces/feature-empty-state";
import { requireWorkspaceAccess } from "@/lib/workspaces";

type ActivityPageProps = {
  params: Promise<{
    workspaceSlug: string;
  }>;
};

export default async function WorkspaceActivityPage({ params }: ActivityPageProps) {
  const { workspaceSlug } = await params;
  const access = await requireWorkspaceAccess(workspaceSlug, "viewer");

  return (
    <FeatureEmptyState
      actionHref={`/app/${access.workspace.slug}/settings`}
      actionLabel="Open workspace settings"
      description="Audit trails and operator events already have schema foundations. This page becomes useful once ingestion, search, and assistant actions start emitting real activity records."
      eyebrow="Activity log"
      title={`Operational telemetry for ${access.workspace.name} is waiting on later phases.`}
      workspaceSlug={access.workspace.slug}
    />
  );
}
