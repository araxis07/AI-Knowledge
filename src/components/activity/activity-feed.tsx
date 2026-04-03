import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ActivityIcon, FileStackIcon, SearchIcon, SettingsIcon, SparkIcon, UserIcon } from "@/components/ui/icons";
import { formatActivityActionLabel, formatActivityEntityLabel } from "@/lib/utils/activity-labels";
import type { WorkspaceActivityEvent } from "@/server/operations/workspace-operations";

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getActivityIcon(action: string) {
  if (action.startsWith("document.")) {
    return <FileStackIcon className="size-4" />;
  }

  if (action.startsWith("search.")) {
    return <SearchIcon className="size-4" />;
  }

  if (action.startsWith("workspace.member")) {
    return <UserIcon className="size-4" />;
  }

  if (action.startsWith("workspace.")) {
    return <SettingsIcon className="size-4" />;
  }

  if (action.startsWith("conversation.")) {
    return <SparkIcon className="size-4" />;
  }

  return <ActivityIcon className="size-4" />;
}

function getActivitySummary(event: WorkspaceActivityEvent) {
  if (typeof event.payload.title === "string" && event.payload.title.trim()) {
    return event.payload.title;
  }

  if (typeof event.payload.query === "string" && event.payload.query.trim()) {
    return event.payload.query;
  }

  if (
    typeof event.payload.previousRole === "string" &&
    typeof event.payload.nextRole === "string"
  ) {
    return `${event.payload.previousRole} -> ${event.payload.nextRole}`;
  }

  if (
    typeof event.payload.documentTitle === "string" &&
    event.payload.documentTitle.trim()
  ) {
    return event.payload.documentTitle;
  }

  return null;
}

export function ActivityFeed({
  events,
  limitedToOwnEvents,
}: {
  events: WorkspaceActivityEvent[];
  limitedToOwnEvents: boolean;
}) {
  return (
    <Card className="p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">Activity log</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {limitedToOwnEvents
              ? "Your role can see your own user-triggered events here. Admins and owners can audit the full workspace feed."
              : "This feed comes from database-backed activity logs and system events, not from client-only state."}
          </p>
        </div>
        <Badge className="border-slate-200 bg-slate-100 text-slate-700">
          {events.length} visible event{events.length === 1 ? "" : "s"}
        </Badge>
      </div>

      {events.length === 0 ? (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-[var(--app-border-strong)] bg-[var(--app-panel-muted)] p-5 text-sm leading-7 text-slate-600">
          No activity has been recorded in the visible scope yet.
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {events.map((event) => {
            const summary = getActivitySummary(event);

            return (
              <div
                className="rounded-[1.5rem] border border-[var(--app-border)] bg-white/84 p-4"
                key={event.id}
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-panel-muted)] text-slate-900">
                    {getActivityIcon(event.action)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-950">
                        {formatActivityActionLabel(event.action)}
                      </p>
                      <Badge>{formatActivityEntityLabel(event.entityType)}</Badge>
                      {event.actorType === "system" ? (
                        <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                          System
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {event.actorName} · {formatTimestamp(event.createdAt)}
                    </p>
                    {summary ? (
                      <p className="mt-3 text-sm leading-6 text-slate-700">{summary}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
