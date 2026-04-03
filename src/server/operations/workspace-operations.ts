import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayName } from "@/lib/utils/display-name";

type ActivityLogRow = {
  action: string;
  actor_type: "system" | "user";
  actor_user_id: string | null;
  created_at: string;
  entity_id: string | null;
  entity_type: string;
  id: string;
  payload: Record<string, unknown> | null;
};

type SearchHistoryRow = {
  actor_user_id: string;
  created_at: string;
  filters: Record<string, unknown> | null;
  id: string;
  latency_ms: number | null;
  mode: "hybrid" | "keyword" | "semantic";
  query_text: string;
  results_count: number;
};

type IngestionJobRow = {
  created_at: string;
  document_id: string;
  error_message: string | null;
  finished_at: string | null;
  id: string;
  job_kind: string;
  progress_message: string | null;
  started_at: string | null;
  status: string;
  steps_completed: number | null;
  steps_total: number | null;
  updated_at: string;
};

type ProfileRow = {
  avatar_url: string | null;
  email: string | null;
  full_name: string | null;
  id: string;
};

type DocumentRow = {
  id: string;
  title: string;
};

export type WorkspaceUsageOverview = {
  activeJobsCount: number;
  archivedDocumentsCount: number;
  chunkCount: number;
  conversationCount: number;
  failedJobsCount: number;
  lastActivityAt: string | null;
  memberCount: number;
  processingDocumentsCount: number;
  readyDocumentsCount: number;
  totalDocumentsCount: number;
  visibleActivityCount: number;
  visibleSearchCount: number;
};

export type WorkspaceActivityEvent = {
  action: string;
  actorAvatarUrl: string | null;
  actorEmail: string | null;
  actorName: string;
  actorType: "system" | "user";
  createdAt: string;
  entityId: string | null;
  entityType: string;
  id: string;
  payload: Record<string, unknown>;
};

export type WorkspaceRecentSearch = {
  actorName: string;
  createdAt: string;
  filters: Record<string, unknown>;
  id: string;
  latencyMs: number | null;
  mode: "hybrid" | "keyword" | "semantic";
  query: string;
  resultsCount: number;
};

export type WorkspaceOperationalJob = {
  createdAt: string;
  documentId: string;
  documentTitle: string;
  errorMessage: string | null;
  finishedAt: string | null;
  id: string;
  jobKind: string;
  progressMessage: string | null;
  startedAt: string | null;
  status: string;
  stepsCompleted: number | null;
  stepsTotal: number | null;
  updatedAt: string;
};

function asCount(value: number | null) {
  return value ?? 0;
}

async function listProfilesByIds(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, ProfileRow>();
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url")
    .in("id", userIds);

  if (error) {
    throw new Error(`Unable to load user profiles: ${error.message}`);
  }

  return new Map((data ?? []).map((profile) => [profile.id, profile as ProfileRow]));
}

export async function getWorkspaceUsageOverview(
  workspaceId: string,
): Promise<WorkspaceUsageOverview> {
  const supabase = await createServerSupabaseClient();
  const [documentsTotal, documentsReady, documentsProcessing, documentsArchived, chunks, conversations, members, searches, activities, activeJobs, failedJobs, latestActivity] =
    await Promise.all([
      supabase.from("documents").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
      supabase.from("documents").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("status", "indexed"),
      supabase.from("documents").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).in("status", ["queued", "processing"]),
      supabase.from("documents").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("status", "archived"),
      supabase.from("document_chunks").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
      supabase.from("conversations").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
      supabase.from("workspace_members").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
      supabase.from("search_history").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
      supabase.from("activity_logs").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
      supabase.from("ingestion_jobs").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).in("status", ["queued", "running"]),
      supabase.from("ingestion_jobs").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("status", "failed"),
      supabase.from("activity_logs").select("created_at").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

  const errors = [
    documentsTotal.error,
    documentsReady.error,
    documentsProcessing.error,
    documentsArchived.error,
    chunks.error,
    conversations.error,
    members.error,
    searches.error,
    activities.error,
    activeJobs.error,
    failedJobs.error,
    latestActivity.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(`Unable to load workspace overview: ${errors[0]?.message ?? "Unknown error"}`);
  }

  return {
    activeJobsCount: asCount(activeJobs.count),
    archivedDocumentsCount: asCount(documentsArchived.count),
    chunkCount: asCount(chunks.count),
    conversationCount: asCount(conversations.count),
    failedJobsCount: asCount(failedJobs.count),
    lastActivityAt: latestActivity.data?.created_at ?? null,
    memberCount: asCount(members.count),
    processingDocumentsCount: asCount(documentsProcessing.count),
    readyDocumentsCount: asCount(documentsReady.count),
    totalDocumentsCount: asCount(documentsTotal.count),
    visibleActivityCount: asCount(activities.count),
    visibleSearchCount: asCount(searches.count),
  };
}

export async function listWorkspaceActivityEvents(
  workspaceId: string,
  limit = 24,
): Promise<WorkspaceActivityEvent[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("activity_logs")
    .select("id, action, actor_type, actor_user_id, entity_type, entity_id, payload, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Unable to load activity logs: ${error.message}`);
  }

  const rows = (data ?? []) as ActivityLogRow[];
  const profilesById = await listProfilesByIds(
    Array.from(
      new Set(
        rows
          .map((row) => row.actor_user_id)
          .filter((value): value is string => typeof value === "string"),
      ),
    ),
  );

  return rows.map((row) => {
    const profile = row.actor_user_id ? profilesById.get(row.actor_user_id) ?? null : null;

    return {
      action: row.action,
      actorAvatarUrl: profile?.avatar_url ?? null,
      actorEmail: profile?.email ?? null,
      actorName: row.actor_type === "system" ? "System" : getDisplayName(
        profile
          ? {
              avatarUrl: profile.avatar_url,
              email: profile.email,
              fullName: profile.full_name,
              id: profile.id,
            }
          : null,
        profile?.email ?? null,
      ),
      actorType: row.actor_type,
      createdAt: row.created_at,
      entityId: row.entity_id,
      entityType: row.entity_type,
      id: row.id,
      payload: row.payload ?? {},
    };
  });
}

export async function listWorkspaceRecentSearches(
  workspaceId: string,
  limit = 8,
): Promise<WorkspaceRecentSearch[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("search_history")
    .select("id, actor_user_id, mode, query_text, filters, results_count, latency_ms, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Unable to load recent searches: ${error.message}`);
  }

  const rows = (data ?? []) as SearchHistoryRow[];
  const profilesById = await listProfilesByIds(
    Array.from(new Set(rows.map((row) => row.actor_user_id))),
  );

  return rows.map((row) => {
    const profile = profilesById.get(row.actor_user_id) ?? null;

    return {
      actorName: getDisplayName(
        profile
          ? {
              avatarUrl: profile.avatar_url,
              email: profile.email,
              fullName: profile.full_name,
              id: profile.id,
            }
          : null,
        profile?.email ?? null,
      ),
      createdAt: row.created_at,
      filters: row.filters ?? {},
      id: row.id,
      latencyMs: row.latency_ms,
      mode: row.mode,
      query: row.query_text,
      resultsCount: row.results_count,
    };
  });
}

export async function listWorkspaceOperationalJobs(
  workspaceId: string,
  limit = 8,
): Promise<WorkspaceOperationalJob[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("ingestion_jobs")
    .select(
      "id, document_id, job_kind, status, progress_message, error_message, steps_completed, steps_total, started_at, finished_at, created_at, updated_at",
    )
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Unable to load operational jobs: ${error.message}`);
  }

  const rows = (data ?? []) as IngestionJobRow[];
  const documentIds = Array.from(new Set(rows.map((row) => row.document_id)));
  let documentsById = new Map<string, DocumentRow>();

  if (documentIds.length > 0) {
    const { data: documentRows, error: documentsError } = await supabase
      .from("documents")
      .select("id, title")
      .eq("workspace_id", workspaceId)
      .in("id", documentIds);

    if (documentsError) {
      throw new Error(`Unable to load job documents: ${documentsError.message}`);
    }

    documentsById = new Map(
      ((documentRows ?? []) as DocumentRow[]).map((document) => [document.id, document]),
    );
  }

  return rows.map((row) => ({
    createdAt: row.created_at,
    documentId: row.document_id,
    documentTitle: documentsById.get(row.document_id)?.title ?? "Document",
    errorMessage: row.error_message,
    finishedAt: row.finished_at,
    id: row.id,
    jobKind: row.job_kind,
    progressMessage: row.progress_message,
    startedAt: row.started_at,
    status: row.status,
    stepsCompleted: row.steps_completed,
    stepsTotal: row.steps_total,
    updatedAt: row.updated_at,
  }));
}
