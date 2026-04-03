import "server-only";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { readServerEnv } from "@/lib/env";
import {
  getOptionalSupabasePublicConfig,
  getOptionalSupabaseServiceRoleConfig,
} from "@/lib/supabase/config";

type HealthState = "degraded" | "error" | "ok";

type HealthCheck = {
  latencyMs?: number;
  message?: string;
  status: HealthState;
};

type QueueMetrics = {
  activeJobs: number;
  failedJobs: number;
  processingDocuments: number;
  readyDocuments: number;
  staleJobs: number;
};

export type SystemStatusReport = {
  capabilities: {
    aiAnsweringReady: boolean;
    embeddingsReady: boolean;
    presenceAvailable: boolean;
    rateLimitingAvailable: boolean;
    realtimeAvailable: boolean;
    serviceRoleConfigured: boolean;
  };
  checks: {
    aiChat: HealthCheck;
    aiEmbeddings: HealthCheck;
    database: HealthCheck;
    realtime: HealthCheck;
    serviceRole: HealthCheck;
    supabasePublicConfig: HealthCheck;
  };
  queue: QueueMetrics | null;
  service: string;
  status: HealthState;
  timestamp: string;
  uptimeSeconds: number;
};

function combineHealthStates(...states: HealthState[]): HealthState {
  if (states.includes("error")) {
    return "error";
  }

  if (states.includes("degraded")) {
    return "degraded";
  }

  return "ok";
}

function asCount(value: number | null) {
  return value ?? 0;
}

async function getQueueMetrics(): Promise<{
  check: HealthCheck;
  queue: QueueMetrics | null;
}> {
  if (!getOptionalSupabaseServiceRoleConfig()) {
    return {
      check: {
        message: "SUPABASE_SERVICE_ROLE_KEY is missing, so readiness can only perform public checks.",
        status: "degraded",
      },
      queue: null,
    };
  }

  const staleBefore = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const supabase = createServiceRoleSupabaseClient();
  const startedAt = performance.now();
  const [
    workspaceProbe,
    activeJobs,
    failedJobs,
    staleJobsMissingHeartbeat,
    staleJobsOldHeartbeat,
    processingDocuments,
    readyDocuments,
  ] =
    await Promise.all([
      supabase.from("workspaces").select("id", { count: "exact", head: true }).limit(1),
      supabase
        .from("ingestion_jobs")
        .select("id", { count: "exact", head: true })
        .in("status", ["queued", "running"]),
      supabase
        .from("ingestion_jobs")
        .select("id", { count: "exact", head: true })
        .eq("status", "failed"),
      supabase
        .from("ingestion_jobs")
        .select("id", { count: "exact", head: true })
        .eq("status", "running")
        .is("last_heartbeat_at", null),
      supabase
        .from("ingestion_jobs")
        .select("id", { count: "exact", head: true })
        .eq("status", "running")
        .lt("last_heartbeat_at", staleBefore),
      supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .in("status", ["queued", "processing"]),
      supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("status", "indexed"),
    ]);

  const latencyMs = Math.round(performance.now() - startedAt);
  const firstError = [
    workspaceProbe.error,
    activeJobs.error,
    failedJobs.error,
    staleJobsMissingHeartbeat.error,
    staleJobsOldHeartbeat.error,
    processingDocuments.error,
    readyDocuments.error,
  ].find(Boolean);

  if (firstError) {
    return {
      check: {
        latencyMs,
        message: firstError.message,
        status: "error",
      },
      queue: null,
    };
  }

  return {
    check: {
      latencyMs,
      status: "ok",
    },
    queue: {
      activeJobs: asCount(activeJobs.count),
      failedJobs: asCount(failedJobs.count),
      processingDocuments: asCount(processingDocuments.count),
      readyDocuments: asCount(readyDocuments.count),
      staleJobs:
        asCount(staleJobsMissingHeartbeat.count) + asCount(staleJobsOldHeartbeat.count),
    },
  };
}

export async function getSystemStatusReport(): Promise<SystemStatusReport> {
  const publicConfig = getOptionalSupabasePublicConfig();
  const serviceRoleConfig = getOptionalSupabaseServiceRoleConfig();
  const env = readServerEnv();
  const { check: database, queue } = await getQueueMetrics();

  const checks = {
    aiChat: env.OPENAI_API_KEY && env.AI_CHAT_PROVIDER
      ? {
          status: "ok" as const,
        }
      : {
          message: "AI answering is disabled until OPENAI_API_KEY and AI_CHAT_PROVIDER are configured.",
          status: "degraded" as const,
        },
    aiEmbeddings: env.OPENAI_API_KEY && env.AI_EMBEDDING_PROVIDER
      ? {
          status: "ok" as const,
        }
      : {
          message: "Embedding generation is disabled until OPENAI_API_KEY and AI_EMBEDDING_PROVIDER are configured.",
          status: "degraded" as const,
        },
    database,
    realtime: publicConfig
      ? {
          status: "ok" as const,
        }
      : {
          message: "Realtime requires public Supabase configuration in the browser environment.",
          status: "degraded" as const,
        },
    serviceRole: serviceRoleConfig
      ? {
          status: "ok" as const,
        }
      : {
          message: "Server-side operational features are degraded until SUPABASE_SERVICE_ROLE_KEY is configured.",
          status: "degraded" as const,
        },
    supabasePublicConfig: publicConfig
      ? {
          status: "ok" as const,
        }
      : {
          message: "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required.",
          status: "error" as const,
        },
  };

  return {
    capabilities: {
      aiAnsweringReady: checks.aiChat.status === "ok",
      embeddingsReady: checks.aiEmbeddings.status === "ok",
      presenceAvailable: Boolean(publicConfig),
      rateLimitingAvailable: Boolean(serviceRoleConfig),
      realtimeAvailable: Boolean(publicConfig),
      serviceRoleConfigured: Boolean(serviceRoleConfig),
    },
    checks,
    queue,
    service: "ai-knowledge-base",
    status: combineHealthStates(
      checks.supabasePublicConfig.status,
      checks.database.status,
      checks.serviceRole.status,
      checks.aiChat.status,
      checks.aiEmbeddings.status,
      checks.realtime.status,
    ),
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  };
}

export async function getReadinessReport() {
  const report = await getSystemStatusReport();
  const readinessStatus = combineHealthStates(
    report.checks.supabasePublicConfig.status,
    report.checks.database.status,
  );

  return {
    ...report,
    status: readinessStatus === "ok" ? report.status : readinessStatus,
  };
}
