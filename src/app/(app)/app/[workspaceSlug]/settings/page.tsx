import { MemberRoleForm } from "@/components/workspaces/member-role-form";
import { RoleBadge } from "@/components/workspaces/role-badge";
import { WorkspaceSettingsForm } from "@/components/workspaces/workspace-settings-form";
import { Card } from "@/components/ui/card";
import { requireAuthenticatedUser } from "@/lib/auth";
import {
  hasMinimumWorkspaceRole,
  listWorkspaceMembers,
  requireWorkspaceAccess,
} from "@/lib/workspaces";

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
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="p-7">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
          Workspace settings
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Update the stable workspace identity and configure defaults that later retrieval
          and grounded-answer features will inherit.
        </p>
        <div className="mt-6">
          <WorkspaceSettingsForm workspace={access.workspace} workspaceId={access.workspace.id} />
        </div>
      </Card>

      <Card className="p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Members and roles
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Roles are enforced by RLS in the database and mirrored here with server-side
              guards. Admins can manage viewers and editors. Owners have full control.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="rounded-[1.5rem] border border-[var(--app-border)] bg-white p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-lg font-semibold text-slate-950">
                      {member.fullName ?? member.email ?? "Workspace member"}
                    </p>
                    <RoleBadge role={member.role} />
                    {member.isCurrentUser && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-slate-600 uppercase">
                        You
                      </span>
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
      </Card>
    </div>
  );
}
