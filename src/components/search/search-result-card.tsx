import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowUpRightIcon, SearchIcon, SparkIcon } from "@/components/ui/icons";
import type { WorkspaceSearchResult } from "@/lib/types/search";
import { asRoute } from "@/lib/utils/as-route";

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function SearchResultCard({
  result,
  workspaceSlug,
}: {
  result: WorkspaceSearchResult;
  workspaceSlug: string;
}) {
  return (
    <Card
      className="border-[var(--app-border)] bg-white/88 p-5 transition hover:-translate-y-0.5 hover:border-[var(--app-border-strong)]"
      data-testid="workspace-search-result-card"
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              className="text-lg font-semibold tracking-tight text-slate-950 transition hover:text-teal-800"
              href={asRoute(`/app/${workspaceSlug}/documents/${result.documentId}`)}
            >
              {result.documentTitle}
            </Link>
            {result.pageNumber ? <Badge>Page {result.pageNumber}</Badge> : null}
            <Badge className="border-slate-200 bg-slate-100 text-slate-700">
              Chunk {result.chunkIndex + 1}
            </Badge>
            {result.matchedSemantic ? (
              <Badge className="border-teal-200 bg-teal-50 text-teal-700">
                <SparkIcon className="size-[14px]" />
                Semantic
              </Badge>
            ) : null}
            {result.matchedKeyword ? (
              <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                <SearchIcon className="size-[14px]" />
                Keyword
              </Badge>
            ) : null}
          </div>

          {result.heading ? (
            <p className="mt-3 text-sm font-medium text-slate-700">Section: {result.heading}</p>
          ) : null}

          <p className="mt-4 max-w-4xl text-base leading-7 text-slate-700">{result.snippet}</p>

          {result.documentSummary ? (
            <p className="mt-3 text-sm leading-6 text-slate-500">{result.documentSummary}</p>
          ) : null}

          {result.tagNames.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {result.tagNames.map((tagName) => (
                <Badge
                  className="border-[var(--app-border)] bg-white text-slate-600"
                  key={`${result.chunkId}-${tagName}`}
                >
                  {tagName}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
            <span>Updated {formatTimestamp(result.documentUpdatedAt)}</span>
            <span>Uploaded {formatTimestamp(result.documentCreatedAt)}</span>
            {typeof result.keywordRank === "number" ? (
              <span>Keyword score {result.keywordRank.toFixed(3)}</span>
            ) : null}
            {typeof result.semanticScore === "number" ? (
              <span>Semantic score {result.semanticScore.toFixed(3)}</span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:items-end">
          <Badge className="border-slate-200 bg-slate-100 text-slate-700">
            Result #{result.rank}
          </Badge>
          <Link
            className={buttonStyles({ size: "sm", variant: "secondary" })}
            href={asRoute(`/app/${workspaceSlug}/documents/${result.documentId}`)}
          >
            Open document
            <ArrowUpRightIcon />
          </Link>
        </div>
      </div>
    </Card>
  );
}
