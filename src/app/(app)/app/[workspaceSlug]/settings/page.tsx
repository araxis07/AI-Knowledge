import { WorkspaceJobStatusSync } from "@/components/realtime/workspace-job-status-sync";
import { MemberRemoveForm } from "@/components/workspaces/member-remove-form";
import { MemberRoleForm } from "@/components/workspaces/member-role-form";
import { RoleBadge } from "@/components/workspaces/role-badge";
import { WorkspaceSettingsForm } from "@/components/workspaces/workspace-settings-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { ActivityIcon, RefreshIcon, SettingsIcon, UserIcon } from "@/components/ui/icons";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getSearchParamValue } from "@/lib/utils/search-param-value";
import {
  hasMinimumWorkspaceRole,
  listWorkspaceMembers,
  requireWorkspaceAccess,
} from "@/lib/workspaces";
import {
  formatWorkspaceRoleLabel,
} from "@/lib/utils/workspace-labels";
import {
  getWorkspaceUsageOverview,
  listWorkspaceOperationalJobs,
} from "@/server/operations/workspace-operations";

type WorkspaceSettingsPageProps = {
  params: Promise<{
    workspaceSlug: string;
  }>;
  searchParams: Promise<{
    members?: string | string[];
    saved?: string | string[];
  }>;
};

const memberNotices: Record<string, string> = {
  forbidden: "You do not have permission to manage that member.",
  invalid: "The member action could not be validated.",
  "not-found": "That workspace member no longer exists.",
  "owner-protected": "Owner memberships are protected here. Transfer ownership explicitly in a later phase instead.",
  removed: "The member was removed from this workspace.",
  "remove-error": "The member could not be removed right now.",
  saved: "The member role was updated.",
  self: "You cannot change or remove your own membership from this screen.",
};

const savedNotices: Record<string, string> = {
  workspace: "Workspace settings were updated.",
};

export default async function WorkspaceSettingsPage({
  params,
  searchParams,
}: WorkspaceSettingsPageProps) {
  const { workspaceSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const [user, access] = await Promise.all([
    requireAuthenticatedUser(`/app/${workspaceSlug}/settings`),
    requireWorkspaceAccess(workspaceSlug, "admin"),
  ]);
  const [members, usageOverview, operationalJobs] = await Promise.all([
    listWorkspaceMembers(access.workspace.id, user.id),
    getWorkspaceUsageOverview(access.workspace.id),
    listWorkspaceOperationalJobs(access.workspace.id, 6),
  ]);
  const memberNoticeKey = getSearchParamValue(resolvedSearchParams.members);
  const savedNoticeKey = getSearchParamValue(resolvedSearchParams.saved);
  const memberNotice = memberNoticeKey ? memberNotices[memberNoticeKey] : null;
  const savedNotice = savedNoticeKey ? savedNotices[savedNoticeKey] : null;

  return (
    <div className="grid gap-6">
      <WorkspaceJobStatusSync
        active={usageOverview.activeJobsCount > 0}
        workspaceId={access.workspace.id}
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<SettingsIcon />}
          label="Ready documents"
          note="Documents already indexed and searchable."
          tone="tint"
          value={`${usageOverview.readyDocumentsCount}`}
        />
        <MetricCard
          icon={<RefreshIcon />}
          label="Active jobs"
          note="Queued or running ingestion work right now."
          value={`${usageOverview.activeJobsCount}`}
        />
        <MetricCard
          icon={<UserIcon />}
          label="Members"
          note="People currently attached to this workspace."
          value={`${members.length}`}
        />
        <MetricCard
          icon={<ActivityIcon />}
          label="Visible searches"
          note="Logged queries visible in your current permission scope."
          value={`${usageOverview.visibleSearchCount}`}
        />
      </section>

      {savedNotice ? (
        <Card className="border-cyan-200 bg-cyan-50/85 p-5 text-sm text-cyan-900">
          {savedNotice}
        </Card>
      ) : null}

      {memberNotice ? (
        <Card className="border-amber-200 bg-amber-50/85 p-5 text-sm text-amber-900">
          {memberNotice}
        </Card>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-7 sm:p-8">
          <h2 className="text-[var(--text-title)] leading-tight text-slate-950">
            Workspace settings
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Keep the workspace identity clear and choose sensible defaults for search, chats, and citations.
          </p>
          <div className="mt-6">
            <WorkspaceSettingsForm workspace={access.workspace} workspaceId={access.workspace.id} />
          </div>
        </Card>

        <Card className="p-7 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[var(--text-title)] leading-tight text-slate-950">
                Members and roles
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Owners can manage everyone. Admins can manage editors and viewers. The database enforces the same rules.
              </p>
            </div>
            <Badge className="border-slate-300 bg-white text-slate-700">
              {formatWorkspaceRoleLabel(access.role)} access
            </Badge>
          </div>

          {members.length > 0 ? (
            <div className="mt-6 grid gap-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="rounded-[1.5rem] border border-[var(--app-border)] bg-white/84 p-5"
                  data-testid={`workspace-member-row-${member.userId}`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-lg font-semibold text-slate-950">
                          {member.fullName ?? member.email ?? "Workspace member"}
                        </p>
                        <RoleBadge role={member.role} />
                        {member.isCurrentUser && (
                          <Badge className="border-slate-300 bg-slate-50 text-slate-600">
                            You
                          </Badge>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{member.email ?? "No email"}</p>
                    </div>

                    {hasMinimumWorkspaceRole(access.role, "admin") ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <MemberRoleForm
                          currentRole={access.role}
                          member={member}
                          workspaceId={access.workspace.id}
                          workspaceSlug={access.workspace.slug}
                        />
                        <MemberRemoveForm
                          currentRole={access.role}
                          member={member}
                          workspaceId={access.workspace.id}
                          workspaceSlug={access.workspace.slug}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6">
              <EmptyState
                description="Only the current workspace owner is attached right now."
                eyebrow="Members"
                icon={<UserIcon />}
                title="No collaborators have been added yet."
              />
            </div>
          )}
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-7 sm:p-8">
          <h2 className="text-[var(--text-title)] leading-tight text-slate-950">
            Usage overview
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            This is the operational baseline for the workspace. Counts reflect what your current role can audit.
          </p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.35rem] border border-[var(--app-border)] bg-white/84 p-4">
              <dt className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Total documents
              </dt>
              <dd className="mt-2 text-sm font-medium text-slate-950">
                {usageOverview.totalDocumentsCount}
              </dd>
            </div>
            <div className="rounded-[1.35rem] border border-[var(--app-border)] bg-white/84 p-4">
              <dt className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Processing documents
              </dt>
              <dd className="mt-2 text-sm font-medium text-slate-950">
                {usageOverview.processingDocumentsCount}
              </dd>
            </div>
            <div className="rounded-[1.35rem] border border-[var(--app-border)] bg-white/84 p-4">
              <dt className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Stored chunks
              </dt>
              <dd className="mt-2 text-sm font-medium text-slate-950">
                {usageOverview.chunkCount}
              </dd>
            </div>
            <div className="rounded-[1.35rem] border border-[var(--app-border)] bg-white/84 p-4">
              <dt className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Conversations
              </dt>
              <dd className="mt-2 text-sm font-medium text-slate-950">
                {usageOverview.conversationCount}
              </dd>
            </div>
            <div className="rounded-[1.35rem] border border-[var(--app-border)] bg-white/84 p-4">
              <dt className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Archived documents
              </dt>
              <dd className="mt-2 text-sm font-medium text-slate-950">
                {usageOverview.archivedDocumentsCount}
              </dd>
            </div>
            <div className="rounded-[1.35rem] border border-[var(--app-border)] bg-white/84 p-4">
              <dt className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Visible activity
              </dt>
              <dd className="mt-2 text-sm font-medium text-slate-950">
                {usageOverview.visibleActivityCount}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="p-7 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[var(--text-title)] leading-tight text-slate-950">
                Operational status
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Review ingestion pressure, recent failures, and the most recent background work touching this workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                {usageOverview.activeJobsCount} active
              </Badge>
              <Badge className="border-rose-200 bg-rose-50 text-rose-700">
                {usageOverview.failedJobsCount} failed
              </Badge>
            </div>
          </div>

          {operationalJobs.length > 0 ? (
            <div className="mt-6 grid gap-3">
              {operationalJobs.map((job) => (
                <div
                  className="rounded-[1.35rem] border border-[var(--app-border)] bg-white/84 p-4"
                  key={job.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{job.documentTitle}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {job.progressMessage ?? "No progress message yet."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{job.jobKind}</Badge>
                      <Badge
                        className={
                          job.status === "failed"
                            ? "border-rose-200 bg-rose-50 text-rose-700"
                          : job.status === "completed"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                        }
                      >
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-[var(--app-border-strong)] bg-[var(--app-panel-muted)] p-5 text-sm leading-7 text-slate-600">
              No recent operational jobs are visible right now.
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
