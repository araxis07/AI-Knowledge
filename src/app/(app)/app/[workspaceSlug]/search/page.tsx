import { SearchResultCard } from "@/components/search/search-result-card";
import { WorkspaceSearchForm } from "@/components/search/workspace-search-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchIcon, SparkIcon } from "@/components/ui/icons";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { formatSearchModeLabel } from "@/lib/utils/workspace-labels";
import { parseWorkspaceSearchParams } from "@/lib/validation/search";
import { requireWorkspaceAccess } from "@/lib/workspaces";
import {
  listWorkspaceSearchFilterOptions,
  searchWorkspace,
} from "@/server/search/workspace-search";

type WorkspaceSearchPageProps = {
  params: Promise<{
    workspaceSlug: string;
  }>;
  searchParams: Promise<{
    dateFrom?: string | string[];
    dateTo?: string | string[];
    document?: string | string[];
    limit?: string | string[];
    mode?: string | string[];
    q?: string | string[];
    tag?: string | string[];
  }>;
};

function activeFilterCount(input: {
  dateFrom: string | null;
  dateTo: string | null;
  documentId: string | null;
  query: string | null;
  tagId: string | null;
}) {
  return [input.query, input.documentId, input.tagId, input.dateFrom, input.dateTo].filter(Boolean)
    .length;
}

export default async function WorkspaceSearchPage({
  params,
  searchParams,
}: WorkspaceSearchPageProps) {
  const { workspaceSlug } = await params;
  const access = await requireWorkspaceAccess(workspaceSlug, "viewer");
  const resolvedSearchParams = await searchParams;
  const search = parseWorkspaceSearchParams(
    resolvedSearchParams,
    access.workspace.settings.defaultSearchMode,
  );
  const filters = await listWorkspaceSearchFilterOptions(access.workspace.id);
  const response = search.query
    ? await searchWorkspace(access.workspace.id, search)
    : null;
  const totalSearchableChunks = filters.documents.reduce(
    (sum, document) => sum + (document.chunkCount ?? 0),
    0,
  );
  const filterCount = activeFilterCount(search);
  const searchFormKey = [
    search.query ?? "",
    search.mode,
    search.documentId ?? "",
    search.tagId ?? "",
    search.dateFrom ?? "",
    search.dateTo ?? "",
  ].join("|");

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Badge className="border-teal-200 bg-teal-50 text-teal-700">
            Workspace: {access.workspace.name}
          </Badge>
        }
        description="Search across indexed chunks with hybrid retrieval, narrow the result set with document and tag filters, and open the source document straight from the result card."
        eyebrow="Search workspace"
        kicker={
          <>
            <Badge>{formatSearchModeLabel(search.mode)} mode</Badge>
            <Badge>{filters.documents.length} indexed documents</Badge>
            <Badge>{filters.tags.length} tags</Badge>
          </>
        }
        title={`Search inside ${access.workspace.name}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<SearchIcon />}
          label="Indexed documents"
          note="Documents ready to return searchable chunks."
          tone="tint"
          value={String(filters.documents.length)}
        />
        <MetricCard
          icon={<SparkIcon />}
          label="Indexed chunks"
          note="The current retrieval surface runs against stored document chunks."
          value={String(totalSearchableChunks)}
        />
        <MetricCard
          icon={<SearchIcon />}
          label="Active filters"
          note="Query text, document, tag, and date filters all count here."
          value={String(filterCount)}
        />
        <MetricCard
          icon={<SparkIcon />}
          label="Latest mode"
          note="This follows the current page state, not just the workspace default."
          value={formatSearchModeLabel(response?.effectiveMode ?? search.mode)}
        />
      </div>

      <WorkspaceSearchForm
        currentSearch={search}
        filters={filters}
        key={searchFormKey}
        workspaceName={access.workspace.name}
      />

      {response?.notice ? (
        <Card className="border-amber-200 bg-amber-50/85 p-5 text-sm leading-6 text-amber-900">
          {response.notice}
        </Card>
      ) : null}

      {!search.query ? (
        <EmptyState
          actions={
            <p className="text-sm leading-6 text-slate-500">
              Start with a natural-language question or an exact keyword phrase. Hybrid mode is the safest default.
            </p>
          }
          description="This workspace search blends vector similarity and PostgreSQL full-text ranking. Add a query above, then narrow the search by document, tag, or upload date when needed."
          eyebrow="Ready to search"
          icon={<SearchIcon />}
          title={`Search ${filters.documents.length} indexed document(s) in ${access.workspace.name}.`}
        />
      ) : response && response.total === 0 ? (
        <EmptyState
          actions={
            <p className="text-sm leading-6 text-slate-500">
              Try hybrid mode, remove one filter, or search with a shorter phrase.
            </p>
          }
          description="No chunks matched this query in the current workspace. The filters may be too narrow, or the documents may not contain the phrase or semantic concept you searched for."
          eyebrow="No results"
          icon={<SparkIcon />}
          title={`No results for "${response.query}".`}
        />
      ) : response ? (
        <Card className="p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                Search results
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {response.total} result(s) in {response.latencyMs} ms using{" "}
                <span className="font-semibold text-slate-950">
                  {formatSearchModeLabel(response.effectiveMode)}
                </span>{" "}
                retrieval.
              </p>
            </div>
            <Badge className="border-slate-200 bg-slate-100 text-slate-700">
              Query: {response.query}
            </Badge>
          </div>

          <div className="mt-6 grid gap-4">
            {response.results.map((result) => (
              <SearchResultCard
                key={result.chunkId}
                result={result}
                workspaceSlug={access.workspace.slug}
              />
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
