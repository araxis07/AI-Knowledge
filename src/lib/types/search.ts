import type { SearchMode } from "@/lib/types/workspaces";

export type WorkspaceSearchInput = {
  dateFrom: string | null;
  dateTo: string | null;
  documentId: string | null;
  limit: number;
  mode: SearchMode;
  query: string | null;
  tagId: string | null;
};

export type WorkspaceSearchDocumentOption = {
  chunkCount: number | null;
  id: string;
  title: string;
  updatedAt: string;
};

export type WorkspaceSearchTagOption = {
  color: string | null;
  id: string;
  name: string;
  slug: string;
};

export type WorkspaceSearchFilterOptions = {
  documents: WorkspaceSearchDocumentOption[];
  tags: WorkspaceSearchTagOption[];
};

export type WorkspaceSearchResult = {
  chunkId: string;
  chunkIndex: number;
  documentCreatedAt: string;
  documentDescription: string | null;
  documentId: string;
  documentSummary: string | null;
  documentTitle: string;
  documentUpdatedAt: string;
  heading: string | null;
  hybridScore: number | null;
  keywordRank: number | null;
  matchedKeyword: boolean;
  matchedSemantic: boolean;
  pageNumber: number | null;
  rank: number;
  semanticScore: number | null;
  snippet: string;
  tagNames: string[];
};

export type WorkspaceSearchResponse = {
  effectiveMode: SearchMode;
  latencyMs: number;
  notice: string | null;
  query: string;
  requestedMode: SearchMode;
  results: WorkspaceSearchResult[];
  total: number;
};
