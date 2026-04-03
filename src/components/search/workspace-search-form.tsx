"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchIcon, SparkIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { WorkspaceSearchFilterOptions, WorkspaceSearchInput } from "@/lib/types/search";
import { asRoute } from "@/lib/utils/as-route";
import { cn } from "@/lib/utils/cn";

type WorkspaceSearchFormProps = {
  currentSearch: WorkspaceSearchInput;
  filters: WorkspaceSearchFilterOptions;
  workspaceName: string;
};

export function WorkspaceSearchForm({
  currentSearch,
  filters,
  workspaceName,
}: WorkspaceSearchFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(currentSearch.query ?? "");
  const [mode, setMode] = useState(currentSearch.mode);
  const [documentId, setDocumentId] = useState(currentSearch.documentId ?? "");
  const [tagId, setTagId] = useState(currentSearch.tagId ?? "");
  const [dateFrom, setDateFrom] = useState(currentSearch.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(currentSearch.dateTo ?? "");

  function navigate(nextValues?: Partial<WorkspaceSearchInput>) {
    const params = new URLSearchParams();
    const nextQuery = (nextValues?.query ?? query)?.trim() ?? "";
    const nextMode = nextValues?.mode ?? mode;
    const nextDocumentId = nextValues?.documentId ?? (documentId || null);
    const nextTagId = nextValues?.tagId ?? (tagId || null);
    const nextDateFrom = nextValues?.dateFrom ?? (dateFrom || null);
    const nextDateTo = nextValues?.dateTo ?? (dateTo || null);

    if (nextQuery) {
      params.set("q", nextQuery);
    }

    if (nextMode) {
      params.set("mode", nextMode);
    }

    if (nextDocumentId) {
      params.set("document", nextDocumentId);
    }

    if (nextTagId) {
      params.set("tag", nextTagId);
    }

    if (nextDateFrom) {
      params.set("dateFrom", nextDateFrom);
    }

    if (nextDateTo) {
      params.set("dateTo", nextDateTo);
    }

    startTransition(() => {
      router.replace(
        asRoute(params.size > 0 ? `${pathname}?${params.toString()}` : pathname),
      );
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate();
  }

  function clearFilters() {
    setQuery("");
    setDocumentId("");
    setTagId("");
    setDateFrom("");
    setDateTo("");

    startTransition(() => {
      router.replace(asRoute(pathname));
    });
  }

  const hasActiveFilters =
    Boolean(query.trim()) ||
    Boolean(documentId) ||
    Boolean(tagId) ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  return (
    <Card className="overflow-hidden p-6 sm:p-7">
      <div className="app-shell-glow left-[-3rem] top-[-2rem] h-36 w-36 bg-teal-500/14" />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="border-teal-200 bg-teal-50 text-teal-700">
            Workspace filter locked
          </Badge>
          <span className="text-sm leading-6 text-slate-600">
            Searching inside <span className="font-semibold text-slate-950">{workspaceName}</span>
          </span>
        </div>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.32fr]">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-800">Search query</span>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-11 pr-4 text-base"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search topics, phrases, product notes, or exact keywords"
                  value={query}
                />
              </div>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-800">Mode</span>
              <Select onChange={(event) => setMode(event.target.value as WorkspaceSearchInput["mode"])} value={mode}>
                <option value="hybrid">Hybrid</option>
                <option value="semantic">Semantic</option>
                <option value="keyword">Keyword</option>
              </Select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-800">Document</span>
              <Select onChange={(event) => setDocumentId(event.target.value)} value={documentId}>
                <option value="">All indexed documents</option>
                {filters.documents.map((document) => (
                  <option key={document.id} value={document.id}>
                    {document.title}
                  </option>
                ))}
              </Select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-800">Tag</span>
              <Select onChange={(event) => setTagId(event.target.value)} value={tagId}>
                <option value="">All tags</option>
                {filters.tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </Select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-800">Uploaded from</span>
              <Input onChange={(event) => setDateFrom(event.target.value)} type="date" value={dateFrom} />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-800">Uploaded to</span>
              <Input onChange={(event) => setDateTo(event.target.value)} type="date" value={dateTo} />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button className="min-w-36" size="lg" type="submit" variant="accent">
              <SparkIcon />
              {isPending ? "Updating..." : "Run search"}
            </Button>

            <button
              className={cn(buttonStyles({ size: "lg", variant: "secondary" }), "min-w-32")}
              onClick={clearFilters}
              type="button"
            >
              Clear filters
            </button>

            <p className="text-sm leading-6 text-slate-500">
              {hasActiveFilters
                ? "Filters stay in the URL so this search state is easy to revisit or share."
                : "Start with hybrid mode for the best mix of semantic recall and exact keyword matches."}
            </p>
          </div>
        </form>
      </div>
    </Card>
  );
}
