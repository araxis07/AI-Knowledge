import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SearchIcon } from "@/components/ui/icons";
import { formatSearchModeLabel } from "@/lib/utils/workspace-labels";
import type { WorkspaceRecentSearch } from "@/server/operations/workspace-operations";

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function RecentSearchList({
  searches,
  limitedToOwnSearches,
}: {
  searches: WorkspaceRecentSearch[];
  limitedToOwnSearches: boolean;
}) {
  return (
    <Card className="p-6 sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">Recent searches</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {limitedToOwnSearches
              ? "These are your recent logged searches in this workspace."
              : "Search history is recorded in the database with mode, latency, and result counts."}
          </p>
        </div>
        <Badge className="border-slate-200 bg-slate-100 text-slate-700">
          {searches.length} visible
        </Badge>
      </div>

      {searches.length === 0 ? (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-[var(--app-border-strong)] bg-[var(--app-panel-muted)] p-5 text-sm leading-7 text-slate-600">
          No searches have been logged in the visible scope yet.
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {searches.map((search) => (
            <div
              className="rounded-[1.5rem] border border-[var(--app-border)] bg-white/84 p-4"
              key={search.id}
            >
              <div className="flex items-start gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-panel-muted)] text-slate-900">
                  <SearchIcon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-950">{search.query}</p>
                    <Badge>{formatSearchModeLabel(search.mode)}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {search.actorName} · {formatTimestamp(search.createdAt)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                    <span>{search.resultsCount} result{search.resultsCount === 1 ? "" : "s"}</span>
                    {search.latencyMs !== null ? <span>{search.latencyMs} ms</span> : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
