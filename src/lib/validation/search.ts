import { z } from "zod";

import type { SearchMode } from "@/lib/types/workspaces";
import type { WorkspaceSearchInput } from "@/lib/types/search";

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function emptyStringToUndefined(value: unknown) {
  return typeof value === "string" && value.trim().length === 0 ? undefined : value;
}

function pickFirstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const workspaceSearchSchema = z
  .object({
    dateFrom: z.preprocess(
      emptyStringToUndefined,
      z.string().regex(isoDatePattern, "Invalid date.").optional(),
    ),
    dateTo: z.preprocess(
      emptyStringToUndefined,
      z.string().regex(isoDatePattern, "Invalid date.").optional(),
    ),
    documentId: z.preprocess(emptyStringToUndefined, z.string().uuid().optional()),
    limit: z.preprocess(emptyStringToUndefined, z.coerce.number().int().min(1).max(20).optional()),
    mode: z.preprocess(
      emptyStringToUndefined,
      z.enum(["keyword", "semantic", "hybrid"]).optional(),
    ),
    query: z.preprocess(emptyStringToUndefined, z.string().trim().min(2).max(300).optional()),
    tagId: z.preprocess(emptyStringToUndefined, z.string().uuid().optional()),
  })
  .superRefine((value, context) => {
    if (value.dateFrom && value.dateTo && value.dateFrom > value.dateTo) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "The end date must be on or after the start date.",
        path: ["dateTo"],
      });
    }
  });

export function parseWorkspaceSearchParams(
  input: {
    dateFrom?: string | string[] | undefined;
    dateTo?: string | string[] | undefined;
    document?: string | string[] | undefined;
    limit?: string | string[] | undefined;
    mode?: string | string[] | undefined;
    q?: string | string[] | undefined;
    tag?: string | string[] | undefined;
  },
  defaultMode: SearchMode,
): WorkspaceSearchInput {
  const parsed = workspaceSearchSchema.safeParse({
    dateFrom: pickFirstValue(input.dateFrom),
    dateTo: pickFirstValue(input.dateTo),
    documentId: pickFirstValue(input.document),
    limit: pickFirstValue(input.limit),
    mode: pickFirstValue(input.mode),
    query: pickFirstValue(input.q),
    tagId: pickFirstValue(input.tag),
  });

  if (!parsed.success) {
    return {
      dateFrom: null,
      dateTo: null,
      documentId: null,
      limit: 10,
      mode: defaultMode,
      query: null,
      tagId: null,
    };
  }

  return {
    dateFrom: parsed.data.dateFrom ?? null,
    dateTo: parsed.data.dateTo ?? null,
    documentId: parsed.data.documentId ?? null,
    limit: parsed.data.limit ?? 10,
    mode: parsed.data.mode ?? defaultMode,
    query: parsed.data.query ?? null,
    tagId: parsed.data.tagId ?? null,
  };
}
