import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOptionalSupabasePublicConfig } from "@/lib/supabase/config";

function sanitizeRedirectPath(candidate: string | null): string {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return "/";
  }

  return candidate;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = sanitizeRedirectPath(requestUrl.searchParams.get("next"));
  const supabaseConfig = getOptionalSupabasePublicConfig();

  if (!code || !supabaseConfig) {
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const redirectUrl = new URL(next, requestUrl.origin);
    redirectUrl.searchParams.set("auth_error", "callback_exchange_failed");

    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
