import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getOptionalSupabasePublicConfig } from "@/lib/supabase/config";

export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const config = getOptionalSupabasePublicConfig();

  if (!config) {
    return response;
  }

  const { publishableKey, url } = config;

  const supabase = createServerClient(url, publishableKey, {
    auth: {
      flowType: "pkce",
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, options, value }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
    global: {
      headers: {
        "X-Client-Info": "ai-knowledge-base/proxy",
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}
