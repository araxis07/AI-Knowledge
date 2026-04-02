import { FeatureEmptyState } from "@/components/workspaces/feature-empty-state";
import { requireWorkspaceAccess } from "@/lib/workspaces";

type ConversationsPageProps = {
  params: Promise<{
    workspaceSlug: string;
  }>;
};

export default async function WorkspaceConversationsPage({
  params,
}: ConversationsPageProps) {
  const { workspaceSlug } = await params;
  const access = await requireWorkspaceAccess(workspaceSlug, "viewer");

  return (
    <FeatureEmptyState
      actionHref={`/app/${access.workspace.slug}`}
      actionLabel="Open workspace overview"
      description="Conversation history will appear here once grounded assistant answers, citations, and retrieval snapshots are implemented. The shell is ready for it, but this phase stays frontend-only."
      eyebrow="Conversation history"
      title={`Assistant threads for ${access.workspace.name} will land in the AI Q&A phase.`}
      workspaceSlug={access.workspace.slug}
    />
  );
}
