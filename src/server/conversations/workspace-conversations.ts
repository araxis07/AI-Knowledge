import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import type {
  ConversationCitationSummary,
  ConversationContextReviewed,
  ConversationMessageRole,
  ConversationMessageSummary,
  WorkspaceConversationSummary,
  WorkspaceConversationThread,
} from "@/lib/types/conversations";
import type { ConversationVisibility } from "@/lib/types/workspaces";

type ConversationMessageRow = {
  content: string;
  created_at: string;
  id: string;
  metadata: Record<string, unknown> | null;
  model_key: string | null;
  provider_key: string | null;
  retrieval_snapshot: Record<string, unknown> | null;
  role: ConversationMessageRole;
  conversation_id: string;
};

type CitationRow = {
  citation_index: number;
  conversation_message_id: string;
  document_chunk_id: string | null;
  document_id: string | null;
  id: string;
  metadata: Record<string, unknown> | null;
  page_number: number | null;
  quote_text: string;
  relevance_score: number | null;
  snippet_text: string | null;
};

type DocumentLookupRow = {
  id: string;
  title: string;
};

type ChunkLookupRow = {
  content: string;
  heading: string | null;
  id: string;
};

type ConversationInsertRow = {
  created_at: string;
  id: string;
  last_message_at: string;
  status: string;
  title: string;
  visibility: ConversationVisibility;
};

type InsertedMessageRow = {
  id: string;
};

function clipPreview(content: string, maxLength = 180) {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function getContextReviewed(
  retrievalSnapshot: Record<string, unknown> | null,
): ConversationContextReviewed[] {
  const snapshot = asRecord(retrievalSnapshot);
  const sources = snapshot?.sources;

  if (!Array.isArray(sources)) {
    return [];
  }

  return sources.flatMap((source) => {
    const sourceRecord = asRecord(source);

    if (!sourceRecord) {
      return [];
    }

    const chunkId = typeof sourceRecord.chunkId === "string" ? sourceRecord.chunkId : null;
    const documentId =
      typeof sourceRecord.documentId === "string" ? sourceRecord.documentId : null;
    const documentTitle =
      typeof sourceRecord.documentTitle === "string" ? sourceRecord.documentTitle : null;
    const snippet = typeof sourceRecord.snippet === "string" ? sourceRecord.snippet : null;
    const sourceId = typeof sourceRecord.sourceId === "string" ? sourceRecord.sourceId : null;
    const rank = typeof sourceRecord.rank === "number" ? sourceRecord.rank : null;

    if (!chunkId || !documentId || !documentTitle || !snippet || !sourceId || !rank) {
      return [];
    }

    return [
      {
        chunkId,
        documentId,
        documentTitle,
        heading: typeof sourceRecord.heading === "string" ? sourceRecord.heading : null,
        pageNumber:
          typeof sourceRecord.pageNumber === "number" ? sourceRecord.pageNumber : null,
        rank,
        sourceId,
        snippet,
      },
    ];
  });
}

function getMessageInsufficientContext(metadata: Record<string, unknown> | null) {
  const record = asRecord(metadata);

  return record?.insufficientContext === true;
}

function getCitationHeading(metadata: Record<string, unknown> | null) {
  const record = asRecord(metadata);

  return typeof record?.heading === "string" ? record.heading : null;
}

export function buildConversationTitle(question: string) {
  const normalized = question.replace(/\s+/g, " ").trim();

  if (normalized.length <= 80) {
    return normalized;
  }

  return `${normalized.slice(0, 79).trimEnd()}…`;
}

export async function listWorkspaceConversationSummaries(
  workspaceId: string,
  currentUserId: string,
): Promise<WorkspaceConversationSummary[]> {
  const supabase = await createServerSupabaseClient();
  const { data: conversations, error: conversationsError } = await supabase
    .from("conversations")
    .select("id, created_by, title, visibility, status, created_at, last_message_at")
    .eq("workspace_id", workspaceId)
    .order("last_message_at", {
      ascending: false,
    })
    .limit(24);

  if (conversationsError) {
    throw new Error(`Unable to load conversations: ${conversationsError.message}`);
  }

  if (!conversations || conversations.length === 0) {
    return [];
  }

  const conversationIds = conversations.map((conversation) => conversation.id);
  const { data: messages, error: messagesError } = await supabase
    .from("conversation_messages")
    .select("conversation_id, content, created_at")
    .eq("workspace_id", workspaceId)
    .in("conversation_id", conversationIds)
    .order("created_at", {
      ascending: false,
    });

  if (messagesError) {
    throw new Error(`Unable to load conversation previews: ${messagesError.message}`);
  }

  const previewByConversation = new Map<string, string>();
  const messageCountByConversation = new Map<string, number>();

  for (const message of messages ?? []) {
    const count = messageCountByConversation.get(message.conversation_id) ?? 0;
    messageCountByConversation.set(message.conversation_id, count + 1);

    if (!previewByConversation.has(message.conversation_id)) {
      previewByConversation.set(message.conversation_id, clipPreview(message.content, 140));
    }
  }

  return conversations.map((conversation) => ({
    createdAt: conversation.created_at,
    id: conversation.id,
    isOwnedByCurrentUser: conversation.created_by === currentUserId,
    lastMessageAt: conversation.last_message_at,
    messageCount: messageCountByConversation.get(conversation.id) ?? 0,
    preview: previewByConversation.get(conversation.id) ?? null,
    status: conversation.status,
    title: conversation.title,
    visibility: conversation.visibility as ConversationVisibility,
  }));
}

export async function getAccessibleWorkspaceConversation(
  workspaceId: string,
  conversationId: string,
): Promise<WorkspaceConversationThread | null> {
  const supabase = await createServerSupabaseClient();
  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id, title, visibility, status, created_at, last_message_at")
    .eq("workspace_id", workspaceId)
    .eq("id", conversationId)
    .maybeSingle();

  if (conversationError) {
    throw new Error(`Unable to load the conversation: ${conversationError.message}`);
  }

  if (!conversation) {
    return null;
  }

  const { data: messages, error: messagesError } = await supabase
    .from("conversation_messages")
    .select(
      "id, conversation_id, role, content, model_key, provider_key, metadata, retrieval_snapshot, created_at",
    )
    .eq("workspace_id", workspaceId)
    .eq("conversation_id", conversationId)
    .order("sort_order", {
      ascending: true,
    });

  if (messagesError) {
    throw new Error(`Unable to load conversation messages: ${messagesError.message}`);
  }

  const assistantMessageIds = (messages ?? [])
    .filter((message) => message.role === "assistant")
    .map((message) => message.id);

  let citations: CitationRow[] = [];
  let documentsById = new Map<string, DocumentLookupRow>();
  let chunksById = new Map<string, ChunkLookupRow>();

  if (assistantMessageIds.length > 0) {
    const { data: citationRows, error: citationsError } = await supabase
      .from("citations")
      .select(
        "id, conversation_message_id, citation_index, document_id, document_chunk_id, quote_text, snippet_text, page_number, relevance_score, metadata",
      )
      .eq("workspace_id", workspaceId)
      .in("conversation_message_id", assistantMessageIds)
      .order("citation_index", {
        ascending: true,
      });

    if (citationsError) {
      throw new Error(`Unable to load message citations: ${citationsError.message}`);
    }

    citations = (citationRows ?? []) as CitationRow[];

    const documentIds = Array.from(
      new Set(
        citations
          .map((citation) => citation.document_id)
          .filter((value): value is string => typeof value === "string"),
      ),
    );
    const chunkIds = Array.from(
      new Set(
        citations
          .map((citation) => citation.document_chunk_id)
          .filter((value): value is string => typeof value === "string"),
      ),
    );

    if (documentIds.length > 0) {
      const { data: documentRows, error: documentsError } = await supabase
        .from("documents")
        .select("id, title")
        .eq("workspace_id", workspaceId)
        .in("id", documentIds);

      if (documentsError) {
        throw new Error(`Unable to load citation documents: ${documentsError.message}`);
      }

      documentsById = new Map(
        (documentRows ?? []).map((document) => [
          document.id,
          document as DocumentLookupRow,
        ]),
      );
    }

    if (chunkIds.length > 0) {
      const { data: chunkRows, error: chunksError } = await supabase
        .from("document_chunks")
        .select("id, content, heading")
        .eq("workspace_id", workspaceId)
        .in("id", chunkIds);

      if (chunksError) {
        throw new Error(`Unable to load citation chunks: ${chunksError.message}`);
      }

      chunksById = new Map(
        (chunkRows ?? []).map((chunk) => [chunk.id, chunk as ChunkLookupRow]),
      );
    }
  }

  const citationsByMessageId = new Map<string, ConversationCitationSummary[]>();

  for (const citation of citations) {
    const document = citation.document_id
      ? documentsById.get(citation.document_id) ?? null
      : null;
    const chunk = citation.document_chunk_id
      ? chunksById.get(citation.document_chunk_id) ?? null
      : null;

    const summary: ConversationCitationSummary = {
      citationIndex: citation.citation_index,
      chunkPreview: citation.snippet_text ?? clipPreview(chunk?.content ?? citation.quote_text),
      documentChunkId: citation.document_chunk_id,
      documentId: citation.document_id,
      documentTitle: document?.title ?? null,
      heading: chunk?.heading ?? getCitationHeading(citation.metadata),
      id: citation.id,
      pageNumber: citation.page_number,
      quoteText: citation.quote_text,
      relevanceScore: citation.relevance_score,
      snippetText: citation.snippet_text,
    };

    const current = citationsByMessageId.get(citation.conversation_message_id) ?? [];
    current.push(summary);
    citationsByMessageId.set(citation.conversation_message_id, current);
  }

  const threadMessages: ConversationMessageSummary[] = ((messages ?? []) as ConversationMessageRow[])
    .map((message) => ({
      citations: citationsByMessageId.get(message.id) ?? [],
      content: message.content,
      contextReviewed: getContextReviewed(message.retrieval_snapshot),
      createdAt: message.created_at,
      id: message.id,
      insufficientContext: getMessageInsufficientContext(message.metadata),
      modelKey: message.model_key,
      providerKey: message.provider_key,
      role: message.role,
    }));

  return {
    createdAt: conversation.created_at,
    id: conversation.id,
    lastMessageAt: conversation.last_message_at,
    messages: threadMessages,
    status: conversation.status,
    title: conversation.title,
    visibility: conversation.visibility as ConversationVisibility,
  };
}

export async function createWorkspaceConversation(input: {
  createdBy: string;
  title: string;
  visibility: ConversationVisibility;
  workspaceId: string;
}) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      created_by: input.createdBy,
      title: input.title,
      visibility: input.visibility,
      workspace_id: input.workspaceId,
    })
    .select("id, title, visibility, status, created_at, last_message_at")
    .single();

  if (error || !data) {
    throw new Error(`Unable to create the conversation: ${error?.message ?? "Unknown error"}`);
  }

  return data as ConversationInsertRow;
}

export async function insertWorkspaceConversationMessage(input: {
  completionTokens?: number | null;
  content: string;
  conversationId: string;
  createdBy?: string | null;
  metadata?: Record<string, unknown>;
  modelKey?: string | null;
  promptTokens?: number | null;
  providerKey?: string | null;
  retrievalSnapshot?: Record<string, unknown>;
  role: ConversationMessageRole;
  workspaceId: string;
}) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("conversation_messages")
    .insert({
      completion_tokens: input.completionTokens ?? null,
      content: input.content,
      conversation_id: input.conversationId,
      created_by: input.createdBy ?? null,
      metadata: input.metadata ?? {},
      model_key: input.modelKey ?? null,
      prompt_tokens: input.promptTokens ?? null,
      provider_key: input.providerKey ?? null,
      retrieval_snapshot: input.retrievalSnapshot ?? {},
      role: input.role,
      workspace_id: input.workspaceId,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(
      `Unable to save the conversation message: ${error?.message ?? "Unknown error"}`,
    );
  }

  return (data as InsertedMessageRow).id;
}

export async function replaceConversationMessageCitations(input: {
  citations: Array<{
    citationIndex: number;
    documentChunkId: string;
    documentId: string;
    heading: string | null;
    pageNumber: number | null;
    quoteText: string;
    relevanceScore: number | null;
    snippetText: string;
  }>;
  conversationMessageId: string;
  workspaceId: string;
}) {
  const supabase = createServiceRoleSupabaseClient();
  await supabase
    .from("citations")
    .delete()
    .eq("workspace_id", input.workspaceId)
    .eq("conversation_message_id", input.conversationMessageId);

  if (input.citations.length === 0) {
    return;
  }

  const { error } = await supabase.from("citations").insert(
    input.citations.map((citation) => ({
      citation_index: citation.citationIndex,
      conversation_message_id: input.conversationMessageId,
      document_chunk_id: citation.documentChunkId,
      document_id: citation.documentId,
      metadata: {
        heading: citation.heading,
      },
      page_number: citation.pageNumber,
      quote_text: citation.quoteText,
      relevance_score: citation.relevanceScore,
      snippet_text: citation.snippetText,
      workspace_id: input.workspaceId,
    })),
  );

  if (error) {
    throw new Error(`Unable to save message citations: ${error.message}`);
  }
}

export async function listRecentConversationHistoryForAnswering(input: {
  conversationId: string;
  limit?: number;
  workspaceId: string;
}) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("conversation_messages")
    .select("role, content")
    .eq("workspace_id", input.workspaceId)
    .eq("conversation_id", input.conversationId)
    .in("role", ["user", "assistant"])
    .order("sort_order", {
      ascending: false,
    })
    .limit(input.limit ?? 8);

  if (error) {
    throw new Error(`Unable to load recent conversation history: ${error.message}`);
  }

  return (data ?? [])
    .map((message) => ({
      content: message.content,
      role: message.role as "assistant" | "user",
    }))
    .reverse();
}
