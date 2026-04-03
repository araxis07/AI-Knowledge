import { removeWorkspaceMemberAction } from "@/app/actions/workspaces";
import { Button } from "@/components/ui/button";
import type { WorkspaceMemberSummary, WorkspaceRole } from "@/lib/types/workspaces";

type MemberRemoveFormProps = {
  currentRole: WorkspaceRole;
  member: WorkspaceMemberSummary;
  workspaceId: string;
  workspaceSlug: string;
};

function canRemoveMember(currentRole: WorkspaceRole, targetRole: WorkspaceRole) {
  if (targetRole === "owner") {
    return false;
  }

  if (currentRole === "owner") {
    return true;
  }

  return currentRole === "admin" && ["viewer", "editor"].includes(targetRole);
}

export function MemberRemoveForm({
  currentRole,
  member,
  workspaceId,
  workspaceSlug,
}: MemberRemoveFormProps) {
  const isDisabled = member.isCurrentUser || !canRemoveMember(currentRole, member.role);

  return (
    <form action={removeWorkspaceMemberAction}>
      <input name="membershipId" type="hidden" value={member.id} />
      <input name="workspaceId" type="hidden" value={workspaceId} />
      <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
      <Button
        className="border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
        disabled={isDisabled}
        size="sm"
        type="submit"
        variant="ghost"
      >
        Remove member
      </Button>
    </form>
  );
}
