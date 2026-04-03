import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { parseWorkspaceAskQuestionInput } from "@/lib/validation/conversations";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { findWorkspaceAccessBySlug } from "@/lib/workspaces";
import { askGroundedWorkspaceQuestion } from "@/server/ai/grounded-answer";
import { getAccessibleWorkspaceConversation } from "@/server/conversations/workspace-conversations";

type WorkspaceConversationAskRouteContext = {
  params: Promise<{
    workspaceSlug: string;
  }>;
};

function jsonError(message: string, status: number) {
  return NextResponse.json(
    {
      message,
    },
    {
      status,
    },
  );
}

function normalizeRouteErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Grounded answering failed.";
}

export async function POST(
  request: Request,
  { params }: WorkspaceConversationAskRouteContext,
) {
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

  try {
    const response = await askGroundedWorkspaceQuestion({
      conversationId: input.conversationId,
      question: input.question,
      userId: user.id,
      workspaceAccess,
    });

    revalidatePath(`/app/${workspaceSlug}`);
    revalidatePath(`/app/${workspaceSlug}/conversations`);

    return NextResponse.json(response);
  } catch (error) {
    const message = normalizeRouteErrorMessage(error);
    const normalized = message.toLowerCase();

    if (normalized.includes("openai_api_key") || normalized.includes("chat provider")) {
      return jsonError("AI answering is not configured on the server yet.", 503);
    }

    if (normalized.includes("service-role")) {
      return jsonError("The server-side conversation writer is not configured yet.", 503);
    }

    return jsonError(message, 500);
  }
}
