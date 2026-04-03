"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function getPresenceLabel(count: number) {
  if (count <= 1) {
    return "1 live member";
  }

  return `${count} live members`;
}

export function WorkspacePresenceBadge({
  userId,
  workspaceId,
}: {
  userId: string;
  workspaceId: string;
}) {
  const [presenceCount, setPresenceCount] = useState(1);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const channel = supabase.channel(`workspace-presence:${workspaceId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setPresenceCount(Object.keys(state).length || 1);
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") {
          return;
        }

        await channel.track({
          onlineAt: new Date().toISOString(),
        });
      });

    return () => {
      void channel.untrack();
      void supabase.removeChannel(channel);
    };
  }, [userId, workspaceId]);

  return (
    <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
      {getPresenceLabel(presenceCount)}
    </Badge>
  );
}
