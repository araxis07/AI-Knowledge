import type {
  ConversationVisibility,
  SearchMode,
  WorkspaceRole,
} from "@/lib/types/workspaces";

const workspaceRoleLabels: Record<WorkspaceRole, string> = {
  admin: "Admin",
  editor: "Editor",
  owner: "Owner",
  viewer: "Viewer",
};

const searchModeLabels: Record<SearchMode, string> = {
  hybrid: "Hybrid",
  keyword: "Keyword",
  semantic: "Semantic",
};

const conversationVisibilityLabels: Record<ConversationVisibility, string> = {
  private: "Private",
  workspace: "Workspace",
};

export function formatWorkspaceRoleLabel(role: WorkspaceRole) {
  return workspaceRoleLabels[role];
}

export function formatSearchModeLabel(mode: SearchMode) {
  return searchModeLabels[mode];
}

export function formatConversationVisibilityLabel(visibility: ConversationVisibility) {
  return conversationVisibilityLabels[visibility];
}
