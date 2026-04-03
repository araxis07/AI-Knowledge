import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChatIcon } from "@/components/ui/icons";
import type { WorkspaceConversationSummary } from "@/lib/types/conversations";
import { asRoute } from "@/lib/utils/as-route";
import { cn } from "@/lib/utils/cn";
import { formatConversationVisibilityLabel } from "@/lib/utils/workspace-labels";

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ConversationList({
  conversations,
  selectedConversationId,
  workspaceSlug,
}: {
  conversations: WorkspaceConversationSummary[];
  selectedConversationId: string | null;
  workspaceSlug: string;
}) {
  return (
    <Card className="p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">Saved threads</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Reopen grounded answers, keep follow-up questions in one place, and switch to a new thread when the topic changes.
          </p>
        </div>
        <Link className={buttonStyles({ size: "sm", variant: "secondary" })} href={asRoute(`/app/${workspaceSlug}/conversations`)}>
          New thread
        </Link>
      </div>

      {conversations.length === 0 ? (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-[var(--app-border-strong)] bg-[var(--app-panel-muted)] p-5 text-sm leading-7 text-slate-600">
          No grounded conversations have been saved in this workspace yet.
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {conversations.map((conversation) => {
            const isActive = selectedConversationId === conversation.id;

            return (
              <Link
                className={cn(
                  "rounded-[1.5rem] border p-4 transition",
                  isActive
                    ? "border-cyan-300 bg-cyan-50/90 shadow-[0_14px_32px_-24px_rgba(8,145,178,0.5)]"
                    : "border-[var(--app-border)] bg-white/80 hover:border-[var(--app-border-strong)] hover:bg-white",
                )}
                href={asRoute(`/app/${workspaceSlug}/conversations?conversation=${encodeURIComponent(conversation.id)}`)}
                key={conversation.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex size-8 items-center justify-center rounded-full border border-[var(--app-border)] bg-white/84 text-slate-900">
                        <ChatIcon className="size-4" />
                      </span>
                      <h3 className="truncate text-base font-semibold text-slate-950">
                        {conversation.title}
                      </h3>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {conversation.preview ?? "Open this thread to see the latest grounded answer."}
                    </p>
                  </div>
                  {conversation.isOwnedByCurrentUser ? (
                    <Badge className="border-cyan-200 bg-cyan-50 text-cyan-700">Yours</Badge>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge>{formatConversationVisibilityLabel(conversation.visibility)}</Badge>
                  <Badge className="border-slate-200 bg-slate-100 text-slate-700">
                    {conversation.messageCount} message{conversation.messageCount === 1 ? "" : "s"}
                  </Badge>
                </div>

                <p className="mt-4 text-xs font-medium tracking-[0.14em] text-slate-500 uppercase">
                  Last activity {formatTimestamp(conversation.lastMessageAt)}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}
