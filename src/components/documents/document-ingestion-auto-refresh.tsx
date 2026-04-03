"use client";

import { WorkspaceJobStatusSync } from "@/components/realtime/workspace-job-status-sync";

export function DocumentIngestionAutoRefresh({
  active,
  documentId,
  intervalMs = 4000,
  workspaceId,
}: {
  active: boolean;
  documentId?: string;
  intervalMs?: number;
  workspaceId: string;
}) {
  return (
    <WorkspaceJobStatusSync
      active={active}
      fallbackIntervalMs={intervalMs}
      workspaceId={workspaceId}
      {...(documentId ? { documentId } : {})}
    />
  );
}
