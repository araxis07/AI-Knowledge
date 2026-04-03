import "server-only";

import { NextResponse } from "next/server";

import { logRouteError } from "@/lib/errors/api";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { getOptionalSupabaseServiceRoleConfig } from "@/lib/supabase/config";

type RateLimitPolicy = {
  limit: number;
  scope: string;
  windowSeconds: number;
};

type RateLimitRpcRow = {
  allowed: boolean;
  remaining: number;
  request_count: number;
  reset_at: string;
};

export type RateLimitResult = {
  allowed: boolean;
  enforced: boolean;
  limit: number;
  remaining: number | null;
  resetAt: string | null;
  retryAfterSeconds: number | null;
  scope: string;
  windowSeconds: number;
};

export const RATE_LIMIT_POLICIES = {
  documentReprocess: {
    limit: 20,
    scope: "document-reprocess",
    windowSeconds: 15 * 60,
  },
  documentUpload: {
    limit: 10,
    scope: "document-upload",
    windowSeconds: 15 * 60,
  },
  workspaceAsk: {
    limit: 12,
    scope: "workspace-ask",
    windowSeconds: 5 * 60,
  },
  workspaceSearch: {
    limit: 30,
    scope: "workspace-search",
    windowSeconds: 60,
  },
} satisfies Record<string, RateLimitPolicy>;

function buildRateLimitKey(input: {
  identifier: string;
  policy: RateLimitPolicy;
  workspaceId?: string;
}) {
  return [input.policy.scope, input.workspaceId ?? "global", input.identifier].join(":");
}

function getRetryAfterSeconds(resetAt: string | null) {
  if (!resetAt) {
    return null;
  }

  return Math.max(0, Math.ceil((new Date(resetAt).getTime() - Date.now()) / 1000));
}

function createUnenforcedRateLimitResult(policy: RateLimitPolicy): RateLimitResult {
  return {
    allowed: true,
    enforced: false,
    limit: policy.limit,
    remaining: null,
    resetAt: null,
    retryAfterSeconds: null,
    scope: policy.scope,
    windowSeconds: policy.windowSeconds,
  };
}

export async function enforceRateLimit(input: {
  identifier: string;
  policy: RateLimitPolicy;
  workspaceId?: string;
}): Promise<RateLimitResult> {
  if (!getOptionalSupabaseServiceRoleConfig()) {
    return createUnenforcedRateLimitResult(input.policy);
  }

  const supabase = createServiceRoleSupabaseClient();
  const rateKey = buildRateLimitKey(input);
  const { data, error } = await supabase
    .rpc("take_rate_limit", {
      p_limit: input.policy.limit,
      p_rate_key: rateKey,
      p_window_seconds: input.policy.windowSeconds,
    })
    .single();

  if (error || !data) {
    logRouteError("Rate limit enforcement failed.", error ?? "Missing rate limit response.", {
      rateKey,
      scope: input.policy.scope,
      workspaceId: input.workspaceId,
    });

    return createUnenforcedRateLimitResult(input.policy);
  }

  const row = data as RateLimitRpcRow;
  const resetAt = row.reset_at ?? null;

  return {
    allowed: row.allowed,
    enforced: true,
    limit: input.policy.limit,
    remaining: typeof row.remaining === "number" ? row.remaining : null,
    resetAt,
    retryAfterSeconds: getRetryAfterSeconds(resetAt),
    scope: input.policy.scope,
    windowSeconds: input.policy.windowSeconds,
  };
}

export function applyRateLimitHeaders<T extends NextResponse>(
  response: T,
  result: RateLimitResult,
) {
  if (!result.enforced) {
    return response;
  }

  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set(
    "X-RateLimit-Remaining",
    String(result.remaining ?? 0),
  );
  response.headers.set(
    "X-RateLimit-Window",
    String(result.windowSeconds),
  );

  if (result.resetAt) {
    response.headers.set(
      "X-RateLimit-Reset",
      String(Math.ceil(new Date(result.resetAt).getTime() / 1000)),
    );
  }

  if (!result.allowed && result.retryAfterSeconds !== null) {
    response.headers.set("Retry-After", String(result.retryAfterSeconds));
  }

  return response;
}

export function createRateLimitErrorResponse(
  result: RateLimitResult,
  message: string,
) {
  const response = NextResponse.json(
    {
      message,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
      status: 429,
    },
  );

  return applyRateLimitHeaders(response, result);
}
