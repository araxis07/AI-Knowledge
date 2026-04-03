function startCase(input: string) {
  return input
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

const actionLabels: Record<string, string> = {
  "conversation.question_asked": "Question asked",
  "document.archived": "Document archived",
  "document.deleted": "Document deleted",
  "document.ingested": "Document indexed",
  "document.ingestion_failed": "Ingestion failed",
  "document.reprocess_queued": "Reprocess queued",
  "document.uploaded": "Document uploaded",
  "search.performed": "Search performed",
  "workspace.member_removed": "Member removed",
  "workspace.member_role_updated": "Member role updated",
  "workspace.settings_updated": "Workspace settings updated",
};

const entityLabels: Record<string, string> = {
  conversation: "Conversation",
  document: "Document",
  member: "Member",
  workspace: "Workspace",
};

export function formatActivityActionLabel(action: string) {
  return actionLabels[action] ?? startCase(action);
}

export function formatActivityEntityLabel(entityType: string) {
  return entityLabels[entityType] ?? startCase(entityType);
}
