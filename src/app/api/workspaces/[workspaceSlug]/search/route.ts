import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { parseWorkspaceSearchParams } from "@/lib/validation/search";
import { findWorkspaceAccessBySlug } from "@/lib/workspaces";
import { searchWorkspace } from "@/server/search/workspace-search";

type WorkspaceSearchRouteContext = {
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

export async function GET(request: Request, { params }: WorkspaceSearchRouteContext) {
  const { workspaceSlug } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return jsonError("You need an active session to search this workspace.", 401);
  }

  const access = await findWorkspaceAccessBySlug(workspaceSlug, user.id);

  if (!access) {
    return jsonError("Workspace not found.", 404);
  }

  const requestUrl = new URL(request.url);
  const search = parseWorkspaceSearchParams(
    {
      dateFrom: requestUrl.searchParams.get("dateFrom") ?? undefined,
      dateTo: requestUrl.searchParams.get("dateTo") ?? undefined,
      document: requestUrl.searchParams.get("document") ?? undefined,
      limit: requestUrl.searchParams.get("limit") ?? undefined,
      mode: requestUrl.searchParams.get("mode") ?? undefined,
      q: requestUrl.searchParams.get("q") ?? undefined,
      tag: requestUrl.searchParams.get("tag") ?? undefined,
    },
    access.workspace.settings.defaultSearchMode,
  );

  if (!search.query) {
    return jsonError("Provide a search query with at least 2 characters.", 400);
  }

  const response = await searchWorkspace(access.workspace.id, search);

  return NextResponse.json(response);
}
