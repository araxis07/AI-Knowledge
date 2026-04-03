import type { ConversationVisibility, SearchMode } from "@/lib/types/workspaces";

export type ConversationMessageRole = "assistant" | "system" | "user";

export type ConversationContextReviewed = {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  heading: string | null;
  pageNumber: number | null;
  rank: number;
  sourceId: string;
  snippet: string;
};

export type ConversationCitationSummary = {
  citationIndex: number;
  chunkPreview: string;
  documentChunkId: string | null;
  documentId: string | null;
  documentTitle: string | null;
  heading: string | null;
  id: string;
  pageNumber: number | null;
  quoteText: string;
  relevanceScore: number | null;
  snippetText: string | null;
};

export type ConversationMessageSummary = {
  citations: ConversationCitationSummary[];
  content: string;
  contextReviewed: ConversationContextReviewed[];
  createdAt: string;
  id: string;
  insufficientContext: boolean;
  modelKey: string | null;
  providerKey: string | null;
  role: ConversationMessageRole;
};

export type WorkspaceConversationSummary = {
  createdAt: string;
  id: string;
  isOwnedByCurrentUser: boolean;
  lastMessageAt: string;
  messageCount: number;
  preview: string | null;
  status: string;
  title: string;
  visibility: ConversationVisibility;
};

export type WorkspaceConversationThread = {
  createdAt: string;
  id: string;
  lastMessageAt: string;
  messages: ConversationMessageSummary[];
  status: string;
  title: string;
  visibility: ConversationVisibility;
};

export type WorkspaceAskQuestionInput = {
  conversationId: string | null;
  question: string;
};

export type WorkspaceAskQuestionResponse = {
  assistantMessageId: string;
  conversationId: string;
  retrievalCount: number;
};

export type RetrievedConversationChunk = {
  chunkId: string;
  chunkIndex: number;
  content: string;
  documentId: string;
  documentTitle: string;
  heading: string | null;
  hybridScore: number | null;
  keywordRank: number | null;
  matchedKeyword: boolean;
  matchedSemantic: boolean;
  pageNumber: number | null;
  rank: number;
  semanticScore: number | null;
  snippet: string;
  sourceId: string;
};

export type ConversationRetrievalSnapshot = {
  effectiveMode: SearchMode;
  notice: string | null;
  query: string;
  requestedMode: SearchMode;
  resultCount: number;
  sources: ConversationContextReviewed[];
};
