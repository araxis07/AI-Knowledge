import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { redactSensitiveText, redactSensitiveValue } from "@/lib/security/redact-secrets";

type JsonErrorOptions = {
  code?: string;
  headers?: HeadersInit;
  requestId?: string;
};

export function createRequestId() {
  return randomUUID();
}

export function jsonError(
  message: string,
  status: number,
  options: JsonErrorOptions = {},
) {
  return NextResponse.json(
    {
      ...(options.code ? { code: options.code } : {}),
      message,
      ...(options.requestId ? { requestId: options.requestId } : {}),
    },
    {
      headers: {
        "Cache-Control": "no-store",
        ...options.headers,
      },
      status,
    },
  );
}

export function logRouteError(
  event: string,
  error: unknown,
  context?: Record<string, unknown>,
) {
  console.error(event, {
    context: redactSensitiveValue(context ?? {}),
    error: redactSensitiveValue(error),
  });
}

export function toSafeErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const sanitized = redactSensitiveText(error.message).trim();
  return sanitized.length > 0 ? sanitized : fallback;
}
