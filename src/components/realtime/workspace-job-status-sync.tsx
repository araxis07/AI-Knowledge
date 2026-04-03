"use client";

import { startTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type WorkspaceJobStatusSyncProps = {
  active: boolean;
  documentId?: string;
  fallbackIntervalMs?: number;
  workspaceId: string;
};

export function WorkspaceJobStatusSync({
  active,
  documentId,
  fallbackIntervalMs = 8000,
  workspaceId,
}: WorkspaceJobStatusSyncProps) {
  const router = useRouter();
  const refreshTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      return;
    }

    const scheduleRefresh = () => {
      if (refreshTimeoutRef.current !== null) {
        return;
      }

      refreshTimeoutRef.current = window.setTimeout(() => {
        refreshTimeoutRef.current = null;

        startTransition(() => {
          router.refresh();
        });
      }, 180);
    };

    const supabase = createBrowserSupabaseClient();
    const channel = supabase.channel(
      `workspace-jobs:${workspaceId}:${documentId ?? "all"}`,
    );

    channel
      .on("postgres_changes", {
        event: "*",
        filter: documentId ? `document_id=eq.${documentId}` : `workspace_id=eq.${workspaceId}`,
        schema: "public",
        table: "ingestion_jobs",
      }, scheduleRefresh)
      .on("postgres_changes", {
        event: "*",
        filter: documentId ? `id=eq.${documentId}` : `workspace_id=eq.${workspaceId}`,
        schema: "public",
        table: "documents",
      }, scheduleRefresh)
      .subscribe();

    const timer = window.setInterval(() => {
      scheduleRefresh();
    }, fallbackIntervalMs);

    return () => {
      window.clearInterval(timer);

      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      void supabase.removeChannel(channel);
    };
  }, [active, documentId, fallbackIntervalMs, router, workspaceId]);

  return null;
}
