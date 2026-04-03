import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  ConversationRetrievalSnapshot,
  RetrievedConversationChunk,
  WorkspaceAskQuestionResponse,
} from "@/lib/types/conversations";
import type { WorkspaceAccess } from "@/lib/types/workspaces";
import { searchWorkspace } from "@/server/search/workspace-search";
import { createChatProvider } from "@/server/ai/chat";
import {
  buildConversationTitle,
  createWorkspaceConversation,
  insertWorkspaceConversationMessage,
  listRecentConversationHistoryForAnswering,
  replaceConversationMessageCitations,
} from "@/server/conversations/workspace-conversations";

const RETRIEVAL_LIMIT = 6;
const MAX_SOURCE_CHARS = 2_000;

type RetrievedChunkRow = {
  content: string;
  document_id: string;
  heading: string | null;
  id: string;
  page_number: number | null;
};

type AskGroundedWorkspaceQuestionInput = {
  conversationId: string | null;
  question: string;
  userId: string;
  workspaceAccess: WorkspaceAccess;
};

function normalizeContextText(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (normalized.length <= MAX_SOURCE_CHARS) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_SOURCE_CHARS).trimEnd()}…`;
}

function createInsufficientContextAnswer(hasReviewedSources: boolean) {
  return hasReviewedSources
    ? "I found nearby passages in this workspace, but they do not support a reliable answer yet. Review the retrieved context below, narrow the question, or upload a more specific source."
    : "I couldn’t answer that from the documents currently indexed in this workspace. Try rephrasing the question, waiting for processing to finish, or uploading a more relevant source.";
}

function buildRetrievalSnapshot(input: {
  effectiveMode: WorkspaceAccess["workspace"]["settings"]["defaultSearchMode"];
  notice: string | null;
  query: string;
  requestedMode: WorkspaceAccess["workspace"]["settings"]["defaultSearchMode"];
  retrievedChunks: RetrievedConversationChunk[];
}) {
  const snapshot: ConversationRetrievalSnapshot = {
    effectiveMode: input.effectiveMode,
    notice: input.notice,
    query: input.query,
    requestedMode: input.requestedMode,
    resultCount: input.retrievedChunks.length,
    sources: input.retrievedChunks.map((chunk) => ({
      chunkId: chunk.chunkId,
      documentId: chunk.documentId,
      documentTitle: chunk.documentTitle,
      heading: chunk.heading,
      pageNumber: chunk.pageNumber,
      rank: chunk.rank,
      sourceId: chunk.sourceId,
      snippet: chunk.snippet,
    })),
  };

  return snapshot;
}

async function loadRetrievedChunks(input: {
  query: string;
  workspaceAccess: WorkspaceAccess;
}): Promise<{
  notice: string | null;
  requestedMode: WorkspaceAccess["workspace"]["settings"]["defaultSearchMode"];
  retrievedChunks: RetrievedConversationChunk[];
  searchMode: WorkspaceAccess["workspace"]["settings"]["defaultSearchMode"];
}> {
  const searchMode = input.workspaceAccess.workspace.settings.defaultSearchMode;
  const response = await searchWorkspace(input.workspaceAccess.workspace.id, {
    dateFrom: null,
    dateTo: null,
    documentId: null,
    limit: RETRIEVAL_LIMIT,
    mode: searchMode,
    query: input.query,
    tagId: null,
  });

  if (response.results.length === 0) {
    return {
      notice: response.notice,
      requestedMode: response.requestedMode,
      retrievedChunks: [],
      searchMode: response.effectiveMode,
    };
  }

  const chunkIds = response.results.map((result) => result.chunkId);
  const supabase = await createServerSupabaseClient();
  const { data: chunkRows, error } = await supabase
    .from("document_chunks")
    .select("id, document_id, content, heading, page_number")
    .eq("workspace_id", input.workspaceAccess.workspace.id)
    .in("id", chunkIds);

  if (error) {
    throw new Error(`Unable to load retrieved chunk content: ${error.message}`);
  }

  const chunksById = new Map(
    ((chunkRows ?? []) as RetrievedChunkRow[]).map((chunk) => [chunk.id, chunk]),
  );
  const retrievedChunks = response.results.flatMap((result, index) => {
    const chunk = chunksById.get(result.chunkId);

    if (!chunk) {
      return [];
    }

    return [
      {
        chunkId: result.chunkId,
        chunkIndex: result.chunkIndex,
        content: normalizeContextText(chunk.content),
        documentId: result.documentId,
        documentTitle: result.documentTitle,
        heading: chunk.heading ?? result.heading,
        hybridScore: result.hybridScore,
        keywordRank: result.keywordRank,
        matchedKeyword: result.matchedKeyword,
        matchedSemantic: result.matchedSemantic,
        pageNumber: chunk.page_number ?? result.pageNumber,
        rank: result.rank,
        semanticScore: result.semanticScore,
        snippet: result.snippet,
        sourceId: `S${index + 1}`,
      },
    ];
  });

  return {
    notice: response.notice,
    requestedMode: response.requestedMode,
    retrievedChunks,
    searchMode: response.effectiveMode,
  };
}

async function insertInsufficientContextAssistantMessage(input: {
  conversationId: string;
  modelKey?: string | null;
  providerKey?: string | null;
  promptTokens?: number | null;
  question: string;
  retrievalSnapshot: ConversationRetrievalSnapshot;
  workspaceId: string;
}) {
  return insertWorkspaceConversationMessage({
    completionTokens: null,
    content: createInsufficientContextAnswer(input.retrievalSnapshot.sources.length > 0),
    conversationId: input.conversationId,
    metadata: {
      insufficientContext: true,
      reason:
        input.retrievalSnapshot.sources.length > 0
          ? "retrieved_context_insufficient"
          : "no_retrieved_context",
    },
    modelKey: input.modelKey ?? null,
    promptTokens: input.promptTokens ?? null,
    providerKey: input.providerKey ?? null,
    retrievalSnapshot: input.retrievalSnapshot,
    role: "assistant",
    workspaceId: input.workspaceId,
  });
}

export async function askGroundedWorkspaceQuestion(
  input: AskGroundedWorkspaceQuestionInput,
): Promise<WorkspaceAskQuestionResponse> {
  const workspace = input.workspaceAccess.workspace;
  const conversation =
    input.conversationId === null
      ? await createWorkspaceConversation({
          createdBy: input.userId,
          title: buildConversationTitle(input.question),
          visibility: workspace.settings.defaultConversationVisibility,
          workspaceId: workspace.id,
        })
      : {
          id: input.conversationId,
          title: buildConversationTitle(input.question),
          visibility: workspace.settings.defaultConversationVisibility,
        };

  await insertWorkspaceConversationMessage({
    content: input.question,
    conversationId: conversation.id,
    createdBy: input.userId,
    metadata: {
      source: "workspace_chat",
    },
    role: "user",
    workspaceId: workspace.id,
  });

  const retrieval = await loadRetrievedChunks({
    query: input.question,
    workspaceAccess: input.workspaceAccess,
  });
  const retrievalSnapshot = buildRetrievalSnapshot({
    effectiveMode: retrieval.searchMode,
    notice: retrieval.notice,
    query: input.question,
    requestedMode: retrieval.requestedMode,
    retrievedChunks: retrieval.retrievedChunks,
  });

  if (retrieval.retrievedChunks.length === 0) {
    const assistantMessageId = await insertInsufficientContextAssistantMessage({
      conversationId: conversation.id,
      question: input.question,
      retrievalSnapshot,
      workspaceId: workspace.id,
    });

    return {
      assistantMessageId,
      conversationId: conversation.id,
      retrievalCount: 0,
    };
  }

  const history = await listRecentConversationHistoryForAnswering({
    conversationId: conversation.id,
    workspaceId: workspace.id,
  });
  const chatProvider = createChatProvider();
  const providerResponse = await chatProvider.generateGroundedAnswer({
    history,
    question: input.question,
    sources: retrieval.retrievedChunks.map((chunk) => ({
      content: chunk.content,
      documentTitle: chunk.documentTitle,
      heading: chunk.heading,
      pageNumber: chunk.pageNumber,
      sourceId: chunk.sourceId,
    })),
  });

  const sourcesById = new Map(
    retrieval.retrievedChunks.map((chunk) => [chunk.sourceId, chunk]),
  );
  const seenSourceIds = new Set<string>();
  const usableCitations = providerResponse.citations.flatMap((citation, index) => {
    const source = sourcesById.get(citation.sourceId);

    if (!source || seenSourceIds.has(source.sourceId)) {
      return [];
    }

    seenSourceIds.add(source.sourceId);

    return [
      {
        citationIndex: index + 1,
        documentChunkId: source.chunkId,
        documentId: source.documentId,
        heading: source.heading,
        pageNumber: source.pageNumber,
        quoteText: citation.quote,
        relevanceScore: source.hybridScore ?? source.semanticScore ?? source.keywordRank,
        snippetText: source.snippet,
      },
    ];
  });

  if (
    providerResponse.insufficientContext ||
    providerResponse.answer.length === 0 ||
    usableCitations.length === 0
  ) {
    const assistantMessageId = await insertInsufficientContextAssistantMessage({
      conversationId: conversation.id,
      modelKey: providerResponse.model,
      promptTokens: providerResponse.promptTokens,
      providerKey: providerResponse.provider,
      question: input.question,
      retrievalSnapshot,
      workspaceId: workspace.id,
    });

    return {
      assistantMessageId,
      conversationId: conversation.id,
      retrievalCount: retrieval.retrievedChunks.length,
    };
  }

  const assistantMessageId = await insertWorkspaceConversationMessage({
    completionTokens: providerResponse.completionTokens,
    content: providerResponse.answer,
    conversationId: conversation.id,
    metadata: {
      insufficientContext: false,
      sourceCount: usableCitations.length,
    },
    modelKey: providerResponse.model,
    promptTokens: providerResponse.promptTokens,
    providerKey: providerResponse.provider,
    retrievalSnapshot,
    role: "assistant",
    workspaceId: workspace.id,
  });

  await replaceConversationMessageCitations({
    citations: usableCitations,
    conversationMessageId: assistantMessageId,
    workspaceId: workspace.id,
  });

  return {
    assistantMessageId,
    conversationId: conversation.id,
    retrievalCount: retrieval.retrievedChunks.length,
  };
}
