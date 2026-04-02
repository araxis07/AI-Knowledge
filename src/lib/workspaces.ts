import { notFound, redirect } from "next/navigation";

import { requireAuthenticatedUser } from "@/lib/auth";
import type {
  WorkspaceAccess,
  WorkspaceMemberSummary,
  WorkspaceRole,
  WorkspaceSettings,
  WorkspaceSummary,
} from "@/lib/types/workspaces";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { asRoute } from "@/lib/utils/as-route";
import { getDisplayName } from "@/lib/utils/display-name";
import { workspaceSettingsSchema } from "@/lib/validation/workspace";

const workspaceRoleRank: Record<WorkspaceRole, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
  owner: 3,
};

const defaultWorkspaceSettings: WorkspaceSettings = {
  citationsRequired: true,
  defaultConversationVisibility: "private",
  defaultSearchMode: "hybrid",
};

function parseWorkspaceSettings(value: unknown): WorkspaceSettings {
  const parsed = workspaceSettingsSchema.partial().safeParse(value);

  if (!parsed.success) {
    return defaultWorkspaceSettings;
  }

  return {
    citationsRequired:
      parsed.data.citationsRequired ?? defaultWorkspaceSettings.citationsRequired,
    defaultConversationVisibility:
      parsed.data.defaultConversationVisibility ??
      defaultWorkspaceSettings.defaultConversationVisibility,
    defaultSearchMode:
      parsed.data.defaultSearchMode ?? defaultWorkspaceSettings.defaultSearchMode,
  };
}

function mapWorkspaceSummary(row: Record<string, unknown>, role: WorkspaceRole): WorkspaceSummary {
  return {
    createdAt: String(row.created_at),
    description: typeof row.description === "string" ? row.description : null,
    id: String(row.id),
    name: String(row.name),
    role,
    settings: parseWorkspaceSettings(row.settings),
    slug: String(row.slug),
    updatedAt: String(row.updated_at),
  };
}

export function hasMinimumWorkspaceRole(
  role: WorkspaceRole,
  minimumRole: WorkspaceRole,
): boolean {
  return workspaceRoleRank[role] >= workspaceRoleRank[minimumRole];
}

export async function listCurrentUserWorkspaces(): Promise<WorkspaceSummary[]> {
  const user = await requireAuthenticatedUser("/app");
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select(
      `
        role,
        workspaces!inner (
          id,
          slug,
          name,
          description,
          created_by,
          settings,
          created_at,
          updated_at
        )
      `,
    )
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`Unable to load workspaces: ${error.message}`);
  }

  return (data ?? [])
    .map((row) => {
      const workspace =
        row.workspaces && !Array.isArray(row.workspaces)
          ? (row.workspaces as Record<string, unknown>)
          : null;

      if (!workspace) {
        return null;
      }

      return mapWorkspaceSummary(workspace, row.role as WorkspaceRole);
    })
    .filter((workspace): workspace is WorkspaceSummary => workspace !== null)
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function getWorkspaceAccessBySlug(
  workspaceSlug: string,
  minimumRole: WorkspaceRole = "viewer",
): Promise<WorkspaceAccess> {
  const user = await requireAuthenticatedUser(`/app/${workspaceSlug}`);
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select(
      `
        id,
        slug,
        name,
        description,
        created_by,
        settings,
        created_at,
        updated_at,
        workspace_members!inner (
          id,
          user_id,
          role,
          created_at,
          updated_at
        )
      `,
    )
    .eq("slug", workspaceSlug)
    .eq("workspace_members.user_id", user.id)
    .single();

  if (error || !data) {
    notFound();
  }

  const membership = Array.isArray(data.workspace_members)
    ? data.workspace_members[0]
    : data.workspace_members;

  if (!membership) {
    notFound();
  }

  const role = membership.role as WorkspaceRole;

  if (!hasMinimumWorkspaceRole(role, minimumRole)) {
    redirect(asRoute(`/app/${workspaceSlug}`));
  }

  return {
    membershipId: String(membership.id),
    role,
    workspace: {
      ...mapWorkspaceSummary(data as Record<string, unknown>, role),
      createdBy: String(data.created_by),
    },
  };
}

export const requireWorkspaceAccess = getWorkspaceAccessBySlug;

export async function listWorkspaceMembers(
  workspaceId: string,
  currentUserId: string,
): Promise<WorkspaceMemberSummary[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select(
      `
        id,
        user_id,
        role,
        created_at,
        updated_at,
        profiles (
          id,
          email,
          full_name,
          avatar_url
        )
      `,
    )
    .eq("workspace_id", workspaceId)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw new Error(`Unable to load workspace members: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const profile =
      row.profiles && !Array.isArray(row.profiles)
        ? (row.profiles as Record<string, unknown>)
        : null;

    return {
      avatarUrl: profile && typeof profile.avatar_url === "string" ? profile.avatar_url : null,
      createdAt: String(row.created_at),
      email: profile && typeof profile.email === "string" ? profile.email : null,
      fullName: profile && typeof profile.full_name === "string" ? profile.full_name : null,
      id: String(row.id),
      isCurrentUser: String(row.user_id) === currentUserId,
      role: row.role as WorkspaceRole,
      updatedAt: String(row.updated_at),
      userId: String(row.user_id),
    };
  });
}

export function getWorkspaceRoleCopy(role: WorkspaceRole): string {
  switch (role) {
    case "owner":
      return "Full control including roles and workspace settings.";
    case "admin":
      return "Can manage settings and most collaborator actions.";
    case "editor":
      return "Can create and maintain workspace content.";
    case "viewer":
      return "Read-only access inside the workspace.";
  }
}

export { getDisplayName };
