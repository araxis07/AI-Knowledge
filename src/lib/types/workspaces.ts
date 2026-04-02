export const workspaceRoles = ["viewer", "editor", "admin", "owner"] as const;

export type WorkspaceRole = (typeof workspaceRoles)[number];

export type SearchMode = "keyword" | "semantic" | "hybrid";
export type ConversationVisibility = "private" | "workspace";

export type WorkspaceSettings = {
  citationsRequired: boolean;
  defaultConversationVisibility: ConversationVisibility;
  defaultSearchMode: SearchMode;
};

export type WorkspaceSummary = {
  createdAt: string;
  description: string | null;
  id: string;
  name: string;
  role: WorkspaceRole;
  settings: WorkspaceSettings;
  slug: string;
  updatedAt: string;
};

export type WorkspaceAccess = {
  membershipId: string;
  role: WorkspaceRole;
  workspace: WorkspaceSummary & {
    createdBy: string;
  };
};

export type WorkspaceMemberSummary = {
  avatarUrl: string | null;
  createdAt: string;
  email: string | null;
  fullName: string | null;
  id: string;
  isCurrentUser: boolean;
  role: WorkspaceRole;
  updatedAt: string;
  userId: string;
};

export type ProfileSummary = {
  avatarUrl: string | null;
  email: string | null;
  fullName: string | null;
  id: string;
};
