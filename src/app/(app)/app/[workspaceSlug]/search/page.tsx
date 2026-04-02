import { FeatureEmptyState } from "@/components/workspaces/feature-empty-state";
import { requireWorkspaceAccess } from "@/lib/workspaces";

type SearchPageProps = {
  params: Promise<{
    workspaceSlug: string;
  }>;
};

export default async function WorkspaceSearchPage({ params }: SearchPageProps) {
  const { workspaceSlug } = await params;
  const access = await requireWorkspaceAccess(workspaceSlug, "viewer");

  return (
    <FeatureEmptyState
      actionHref={`/app/${access.workspace.slug}`}
      actionLabel="Return to workspace overview"
      description="The search surface will eventually combine hybrid retrieval, result snippets, and grounded answer launch points. For now, this route exists so the shell can feel complete without shipping fake search results."
      eyebrow="Search foundation"
      title={`Semantic search for ${access.workspace.name} is staged next.`}
      workspaceSlug={access.workspace.slug}
    />
  );
}
