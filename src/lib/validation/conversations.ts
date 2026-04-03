import { z } from "zod";

import type { WorkspaceAskQuestionInput } from "@/lib/types/conversations";

function emptyStringToUndefined(value: unknown) {
  return typeof value === "string" && value.trim().length === 0 ? undefined : value;
}

export const workspaceAskQuestionSchema = z.object({
  conversationId: z.preprocess(emptyStringToUndefined, z.string().uuid().optional()),
  question: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(3, "Ask a question with at least 3 characters.").max(3000),
  ),
});

export function parseWorkspaceAskQuestionInput(input: unknown): WorkspaceAskQuestionInput {
  const parsed = workspaceAskQuestionSchema.parse(input);

  return {
    conversationId: parsed.conversationId ?? null,
    question: parsed.question,
  };
}

export function parseConversationSearchParam(
  value: string | string[] | undefined,
): string | null {
  const candidate = typeof value === "string" ? value : value?.[0];
  const parsed = z.string().uuid().safeParse(candidate);

  return parsed.success ? parsed.data : null;
}
