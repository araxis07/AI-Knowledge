import { MemberRoleForm } from "@/components/workspaces/member-role-form";
import { RoleBadge } from "@/components/workspaces/role-badge";
import { WorkspaceSettingsForm } from "@/components/workspaces/workspace-settings-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { SettingsIcon, UserIcon } from "@/components/ui/icons";
import { requireAuthenticatedUser } from "@/lib/auth";
import {
  hasMinimumWorkspaceRole,
  listWorkspaceMembers,
  requireWorkspaceAccess,
} from "@/lib/workspaces";
import {
  formatConversationVisibilityLabel,
  formatSearchModeLabel,
  formatWorkspaceRoleLabel,
} from "@/lib/utils/workspace-labels";

type WorkspaceSettingsPageProps = {
  params: Promise<{
    workspaceSlug: string;
  }>;
};

export default async function WorkspaceSettingsPage({
  params,
}: WorkspaceSettingsPageProps) {
  const { workspaceSlug } = await params;
  const [user, access] = await Promise.all([
    requireAuthenticatedUser(`/app/${workspaceSlug}/settings`),
    requireWorkspaceAccess(workspaceSlug, "admin"),
  ]);
  const members = await listWorkspaceMembers(access.workspace.id, user.id);

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<SettingsIcon />}
          label="Search default"
          note="How search behaves here by default."
          tone="tint"
          value={formatSearchModeLabel(access.workspace.settings.defaultSearchMode)}
        />
        <MetricCard
          icon={<UserIcon />}
          label="Chat visibility"
          note="Who can see new chats by default."
          value={formatConversationVisibilityLabel(
            access.workspace.settings.defaultConversationVisibility,
          )}
        />
        <MetricCard
          icon={<UserIcon />}
          label="Members"
          note="People currently attached to this workspace."
          value={`${members.length}`}
        />
        <MetricCard
          icon={<SettingsIcon />}
          label="Citations"
          note="Whether answers should cite sources by default."
          value={access.workspace.settings.citationsRequired ? "On" : "Off"}
        />
      </section>

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

                    {hasMinimumWorkspaceRole(access.role, "admin") && (
                      <MemberRoleForm
                        currentRole={access.role}
                        member={member}
                        workspaceId={access.workspace.id}
                        workspaceSlug={access.workspace.slug}
                      />
                    )}
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
    </div>
  );
}
