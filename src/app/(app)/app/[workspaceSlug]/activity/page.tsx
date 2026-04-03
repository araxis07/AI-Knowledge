import { ActivityFeed } from "@/components/activity/activity-feed";
import { WorkspaceJobStatusSync } from "@/components/realtime/workspace-job-status-sync";
import { OperationalStatusPanel } from "@/components/activity/operational-status-panel";
import { RecentSearchList } from "@/components/activity/recent-search-list";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { ActivityIcon, RefreshIcon, SearchIcon, SparkIcon } from "@/components/ui/icons";
import { requireWorkspaceAccess } from "@/lib/workspaces";
import {
  getWorkspaceUsageOverview,
  listWorkspaceActivityEvents,
  listWorkspaceOperationalJobs,
  listWorkspaceRecentSearches,
} from "@/server/operations/workspace-operations";

type ActivityPageProps = {
  params: Promise<{
    workspaceSlug: string;
  }>;
};

export default async function WorkspaceActivityPage({ params }: ActivityPageProps) {
  const { workspaceSlug } = await params;
  const access = await requireWorkspaceAccess(workspaceSlug, "viewer");
  const [usageOverview, events, recentSearches, operationalJobs] = await Promise.all([
    getWorkspaceUsageOverview(access.workspace.id),
    listWorkspaceActivityEvents(access.workspace.id, 24),
    listWorkspaceRecentSearches(access.workspace.id, 8),
    listWorkspaceOperationalJobs(access.workspace.id, 8),
  ]);
  const limitedToOwnScope = access.role !== "admin" && access.role !== "owner";

  return (
    <div className="grid gap-6">
      <WorkspaceJobStatusSync
        active={usageOverview.activeJobsCount > 0}
        workspaceId={access.workspace.id}
      />
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge className="border-teal-200 bg-teal-50 text-teal-700">
              Workspace: {access.workspace.name}
            </Badge>
            {limitedToOwnScope ? (
              <Badge className="border-slate-200 bg-slate-100 text-slate-700">
                Personal visibility
              </Badge>
            ) : (
              <Badge className="border-cyan-200 bg-cyan-50 text-cyan-700">
                Full workspace audit
              </Badge>
            )}
          </div>
        }
        description="Operational visibility for searches, document processing, settings changes, and grounded assistant usage."
        eyebrow="Activity log"
        title={`Operational feed for ${access.workspace.name}`}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<ActivityIcon />}
          label="Visible activity"
          note="Events you can audit with your current role."
          tone="tint"
          value={`${usageOverview.visibleActivityCount}`}
        />
        <MetricCard
          icon={<SearchIcon />}
          label="Visible searches"
          note="Search history recorded in the database."
          value={`${usageOverview.visibleSearchCount}`}
        />
        <MetricCard
          icon={<RefreshIcon />}
          label="Active jobs"
          note="Queued or running ingestion work."
          value={`${usageOverview.activeJobsCount}`}
        />
        <MetricCard
          icon={<SparkIcon />}
          label="Failed jobs"
          note="Operational failures that may need intervention."
          value={`${usageOverview.failedJobsCount}`}
        />
      </section>

      {limitedToOwnScope ? (
        <Card className="border-amber-200 bg-amber-50/85 p-5 text-sm text-amber-900">
          Your role can view your own user-generated search and activity records here. Admins and owners can audit the full workspace feed.
        </Card>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.62fr_0.38fr]">
        <ActivityFeed events={events} limitedToOwnEvents={limitedToOwnScope} />
        <div className="grid gap-6">
          <RecentSearchList
            limitedToOwnSearches={limitedToOwnScope}
            searches={recentSearches}
          />
          <OperationalStatusPanel
            jobs={operationalJobs}
            workspaceSlug={access.workspace.slug}
          />
        </div>
      </section>
    </div>
  );
}
