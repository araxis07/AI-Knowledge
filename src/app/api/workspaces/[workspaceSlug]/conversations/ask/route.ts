import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createRequestId, jsonError, logRouteError } from "@/lib/errors/api";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { parseWorkspaceAskQuestionInput } from "@/lib/validation/conversations";
import { findWorkspaceAccessBySlug } from "@/lib/workspaces";
import { askGroundedWorkspaceQuestion } from "@/server/ai/grounded-answer";
import { getAccessibleWorkspaceConversation } from "@/server/conversations/workspace-conversations";
import {
  applyRateLimitHeaders,
  createRateLimitErrorResponse,
  enforceRateLimit,
  RATE_LIMIT_POLICIES,
} from "@/server/rate-limit";

type WorkspaceConversationAskRouteContext = {
  params: Promise<{
    workspaceSlug: string;
  }>;
};

function normalizeRouteErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Grounded answering failed.";
}

export async function POST(
  request: Request,
  { params }: WorkspaceConversationAskRouteContext,
) {
  const requestId = createRequestId();
  const { workspaceSlug } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return jsonError("You need an active session to ask grounded questions.", 401);
  }

  const workspaceAccess = await findWorkspaceAccessBySlug(workspaceSlug, user.id);

  if (!workspaceAccess) {
    return jsonError("Workspace not found.", 404);
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonError("Send the question request as JSON.", 400);
  }

  let input;

  try {
    input = parseWorkspaceAskQuestionInput(payload);
  } catch (error) {
    return jsonError(normalizeRouteErrorMessage(error), 400);
  }

  if (input.conversationId) {
    const conversation = await getAccessibleWorkspaceConversation(
      workspaceAccess.workspace.id,
      input.conversationId,
    );

    if (!conversation) {
      return jsonError("Conversation not found in this workspace.", 404);
    }
  }

  const rateLimit = await enforceRateLimit({
    identifier: user.id,
    policy: RATE_LIMIT_POLICIES.workspaceAsk,
    workspaceId: workspaceAccess.workspace.id,
  });

  if (!rateLimit.allowed) {
    return createRateLimitErrorResponse(
      rateLimit,
      "Too many grounded AI questions were requested in this workspace. Wait a moment and try again.",
    );
  }

  try {
    const response = await askGroundedWorkspaceQuestion({
      conversationId: input.conversationId,
      question: input.question,
      userId: user.id,
      workspaceAccess,
    });

    await Promise.allSettled([
      supabase.from("activity_logs").insert({
        action: "conversation.question_asked",
        actor_type: "user",
        actor_user_id: user.id,
        entity_id: response.conversationId,
        entity_type: "conversation",
        payload: {
          query: input.question,
          retrievalCount: response.retrievalCount,
        },
        workspace_id: workspaceAccess.workspace.id,
      }),
    ]);

    revalidatePath(`/app/${workspaceSlug}`);
    revalidatePath(`/app/${workspaceSlug}/conversations`);
    revalidatePath(`/app/${workspaceSlug}/activity`);

    return applyRateLimitHeaders(NextResponse.json(response), rateLimit);
  } catch (error) {
    const message = normalizeRouteErrorMessage(error);
    const normalized = message.toLowerCase();

    logRouteError("Grounded workspace answering failed.", error, {
      requestId,
      userId: user.id,
      workspaceId: workspaceAccess.workspace.id,
      workspaceSlug,
    });

    if (normalized.includes("openai_api_key") || normalized.includes("chat provider")) {
      return jsonError("AI answering is not configured on the server yet.", 503, {
        requestId,
      });
    }

    if (normalized.includes("service-role")) {
      return jsonError("The server-side conversation writer is not configured yet.", 503, {
        requestId,
      });
    }

    return jsonError("Grounded answering failed unexpectedly.", 500, {
      requestId,
    });
  }
}
