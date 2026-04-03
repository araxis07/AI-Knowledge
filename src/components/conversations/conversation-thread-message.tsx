import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChatIcon, FileStackIcon, SparkIcon, UserIcon } from "@/components/ui/icons";
import type { ConversationMessageSummary } from "@/lib/types/conversations";
import { asRoute } from "@/lib/utils/as-route";
import { cn } from "@/lib/utils/cn";

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ConversationThreadMessage({
  message,
  workspaceSlug,
}: {
  message: ConversationMessageSummary;
  workspaceSlug: string;
}) {
  const isUser = message.role === "user";
  const hasFallbackContext = message.citations.length === 0 && message.contextReviewed.length > 0;

  return (
    <div
      className={cn(
        "flex",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div className={cn("max-w-4xl min-w-0", isUser ? "w-full xl:w-[82%]" : "w-full")}>
        <Card
          className={cn(
            "p-5 sm:p-6",
            isUser
              ? "border-slate-900/16 bg-[linear-gradient(135deg,rgba(15,23,42,0.06),rgba(15,23,42,0.02))]"
              : "bg-white/88",
          )}
        >
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "inline-flex size-10 items-center justify-center rounded-full border",
                isUser
                  ? "border-slate-900/10 bg-slate-900 text-white"
                  : "border-cyan-200 bg-cyan-50 text-cyan-700",
              )}
            >
              {isUser ? <UserIcon className="size-4" /> : <SparkIcon className="size-4" />}
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-950">
                {isUser ? "You" : "Grounded assistant"}
              </p>
              <p className="text-xs text-slate-500">{formatTimestamp(message.createdAt)}</p>
            </div>
            {!isUser && message.modelKey ? (
              <Badge className="border-slate-200 bg-slate-100 text-slate-700">
                {message.modelKey}
              </Badge>
            ) : null}
            {!isUser && message.insufficientContext ? (
              <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                Not enough context
              </Badge>
            ) : null}
          </div>

          <div className="mt-5 text-sm leading-7 whitespace-pre-wrap text-slate-800">
            {message.content}
          </div>

          {!isUser && message.citations.length > 0 ? (
            <div className="mt-6 grid gap-3">
              <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Citations
              </p>
              {message.citations.map((citation) => (
                <div
                  className="rounded-[1.35rem] border border-[var(--app-border)] bg-[var(--app-panel-muted)] p-4"
                  data-testid="conversation-citation-card"
                  key={citation.id}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border-cyan-200 bg-cyan-50 text-cyan-700">
                      Source {citation.citationIndex}
                    </Badge>
                    {citation.pageNumber ? <Badge>Page {citation.pageNumber}</Badge> : null}
                    {citation.heading ? (
                      <Badge className="border-slate-200 bg-slate-100 text-slate-700">
                        {citation.heading}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-950">
                    {citation.documentTitle ?? "Document"}
                  </p>
                  <p className="mt-2 rounded-[1rem] border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-700">
                    “{citation.quoteText}”
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{citation.chunkPreview}</p>
                  {citation.documentId ? (
                    <div className="mt-4">
                      <Link
                        className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-800 hover:text-cyan-900"
                        href={asRoute(`/app/${workspaceSlug}/documents/${citation.documentId}`)}
                      >
                        <FileStackIcon className="size-4" />
                        Open cited document
                      </Link>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {!isUser && hasFallbackContext ? (
            <div className="mt-6 grid gap-3">
              <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Context reviewed
              </p>
              {message.contextReviewed.slice(0, 3).map((source) => (
                <div
                  className="rounded-[1.35rem] border border-amber-200 bg-amber-50/80 p-4"
                  key={`${message.id}-${source.sourceId}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border-amber-200 bg-white text-amber-700">
                      {source.sourceId}
                    </Badge>
                    {source.pageNumber ? <Badge>Page {source.pageNumber}</Badge> : null}
                    {source.heading ? (
                      <Badge className="border-slate-200 bg-white text-slate-700">
                        {source.heading}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-950">
                    {source.documentTitle}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{source.snippet}</p>
                  <div className="mt-4">
                    <Link
                      className="inline-flex items-center gap-2 text-sm font-semibold text-amber-800 hover:text-amber-900"
                      href={asRoute(`/app/${workspaceSlug}/documents/${source.documentId}`)}
                    >
                      <ChatIcon className="size-4" />
                      Review this source
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
