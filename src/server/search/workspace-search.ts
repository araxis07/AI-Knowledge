import "server-only";

import { logRouteError } from "@/lib/errors/api";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  WorkspaceSearchDocumentOption,
  WorkspaceSearchFilterOptions,
  WorkspaceSearchInput,
  WorkspaceSearchResponse,
  WorkspaceSearchResult,
  WorkspaceSearchTagOption,
} from "@/lib/types/search";
import { createEmbeddingProvider, toPgvectorLiteral } from "@/server/ingestion/embeddings";

type SearchResultRow = {
  chunk_id: string;
  chunk_index: number;
  document_created_at: string;
  document_description: string | null;
  document_id: string;
  document_summary: string | null;
  document_title: string;
  document_updated_at: string;
  heading: string | null;
  hybrid_score: number | null;
  keyword_rank: number | null;
  matched_keyword: boolean;
  matched_semantic: boolean;
  page_number: number | null;
  semantic_score: number | null;
  snippet: string;
  tag_names: string[] | null;
};

type SearchableDocumentRow = {
  chunk_count: number | null;
  id: string;
  title: string;
  updated_at: string;
};

type SearchTagRow = {
  color: string | null;
  id: string;
  name: string;
  slug: string;
};

function normalizeSearchErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Search failed.";
}

function mapSearchResult(row: SearchResultRow, index: number): WorkspaceSearchResult {
  return {
    chunkId: row.chunk_id,
    chunkIndex: row.chunk_index,
    documentCreatedAt: row.document_created_at,
    documentDescription: row.document_description,
    documentId: row.document_id,
    documentSummary: row.document_summary,
    documentTitle: row.document_title,
    documentUpdatedAt: row.document_updated_at,
    heading: row.heading,
    hybridScore: row.hybrid_score,
    keywordRank: row.keyword_rank,
    matchedKeyword: row.matched_keyword,
    matchedSemantic: row.matched_semantic,
    pageNumber: row.page_number,
    rank: index + 1,
    semanticScore: row.semantic_score,
    snippet: row.snippet,
    tagNames: row.tag_names ?? [],
  };
}

export async function listWorkspaceSearchFilterOptions(
  workspaceId: string,
): Promise<WorkspaceSearchFilterOptions> {
  const supabase = await createServerSupabaseClient();

  const [documentsResult, tagsResult] = await Promise.all([
    supabase
      .from("documents")
      .select("id, title, chunk_count, updated_at")
      .eq("workspace_id", workspaceId)
      .eq("status", "indexed")
      .order("updated_at", {
        ascending: false,
      }),
    supabase
      .from("document_tags")
      .select("id, name, slug, color")
      .eq("workspace_id", workspaceId)
      .order("name", {
        ascending: true,
      }),
  ]);

  if (documentsResult.error) {
    throw new Error(`Unable to load searchable documents: ${documentsResult.error.message}`);
  }

  if (tagsResult.error) {
    throw new Error(`Unable to load document tags: ${tagsResult.error.message}`);
  }

  return {
    documents: (documentsResult.data ?? []).map(
      (document): WorkspaceSearchDocumentOption => ({
        chunkCount: (document as SearchableDocumentRow).chunk_count,
        id: (document as SearchableDocumentRow).id,
        title: (document as SearchableDocumentRow).title,
        updatedAt: (document as SearchableDocumentRow).updated_at,
      }),
    ),
    tags: (tagsResult.data ?? []).map(
      (tag): WorkspaceSearchTagOption => ({
        color: (tag as SearchTagRow).color,
        id: (tag as SearchTagRow).id,
        name: (tag as SearchTagRow).name,
        slug: (tag as SearchTagRow).slug,
      }),
    ),
  };
}

export async function searchWorkspace(
  workspaceId: string,
  input: WorkspaceSearchInput,
): Promise<WorkspaceSearchResponse> {
  if (!input.query) {
    return {
      effectiveMode: input.mode,
      latencyMs: 0,
      notice: null,
      query: "",
      requestedMode: input.mode,
      results: [],
      total: 0,
    };
  }

  const startedAt = performance.now();
  const supabase = await createServerSupabaseClient();
  let effectiveMode = input.mode;
  let notice: string | null = null;
  let queryEmbedding: string | null = null;

  if (input.mode !== "keyword") {
    try {
      const embeddingProvider = createEmbeddingProvider();
      const [queryVector] = await embeddingProvider.embedTexts([input.query]);

      if (!queryVector) {
        throw new Error("No embedding vector was returned for the search query.");
      }

      queryEmbedding = toPgvectorLiteral(queryVector);
    } catch (error) {
      effectiveMode = "keyword";
      notice =
        input.mode === "hybrid"
          ? "Semantic ranking is unavailable right now, so these results are using keyword search only."
          : "Semantic search is unavailable right now, so the query was routed through keyword search instead.";

      logRouteError("Unable to build the semantic search query embedding.", error, {
        error: normalizeSearchErrorMessage(error),
        workspaceId,
      });
    }
  }

  const { data, error } = await supabase.rpc("search_workspace_chunks", {
    filter_created_from: input.dateFrom,
    filter_created_to: input.dateTo,
    filter_document_id: input.documentId,
    filter_tag_id: input.tagId,
    match_count: input.limit,
    query_embedding: queryEmbedding,
    query_text: input.query,
    search_mode: effectiveMode,
    target_workspace_id: workspaceId,
  });

  if (error) {
    throw new Error(`Unable to run workspace search: ${error.message}`);
  }

  const results = ((data ?? []) as SearchResultRow[]).map(mapSearchResult);

  return {
    effectiveMode,
    latencyMs: Math.max(1, Math.round(performance.now() - startedAt)),
    notice,
    query: input.query,
    requestedMode: input.mode,
    results,
    total: results.length,
  };
}
