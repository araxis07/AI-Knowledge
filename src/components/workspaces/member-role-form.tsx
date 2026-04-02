import { updateWorkspaceMemberRoleAction } from "@/app/actions/workspaces";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { WorkspaceMemberSummary, WorkspaceRole } from "@/lib/types/workspaces";
import { formatWorkspaceRoleLabel } from "@/lib/utils/workspace-labels";

type MemberRoleFormProps = {
  currentRole: WorkspaceRole;
  member: WorkspaceMemberSummary;
  workspaceId: string;
  workspaceSlug: string;
};

function getRoleOptions(currentRole: WorkspaceRole, targetRole: WorkspaceRole) {
  if (currentRole === "owner") {
    return ["viewer", "editor", "admin", "owner"] as const;
  }

  if (currentRole === "admin" && ["viewer", "editor"].includes(targetRole)) {
    return ["viewer", "editor"] as const;
  }

  return [] as const;
}

export function MemberRoleForm({
  currentRole,
  member,
  workspaceId,
  workspaceSlug,
}: MemberRoleFormProps) {
  const options = getRoleOptions(currentRole, member.role);
  const isDisabled = member.isCurrentUser || options.length === 0;

  return (
    <form action={updateWorkspaceMemberRoleAction} className="flex flex-col gap-3 sm:flex-row">
      <input name="membershipId" type="hidden" value={member.id} />
      <input name="workspaceId" type="hidden" value={workspaceId} />
      <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
      <Select defaultValue={member.role} disabled={isDisabled} name="role">
        {options.length > 0 ? (
          options.map((roleOption) => (
            <option key={roleOption} value={roleOption}>
              {formatWorkspaceRoleLabel(roleOption)}
            </option>
          ))
        ) : (
          <option value={member.role}>{formatWorkspaceRoleLabel(member.role)}</option>
        )}
      </Select>
      <Button disabled={isDisabled} size="sm" type="submit" variant="secondary">
        Save role
      </Button>
    </form>
  );
}
