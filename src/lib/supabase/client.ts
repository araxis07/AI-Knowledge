import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicConfig } from "@/lib/supabase/config";

export function createBrowserSupabaseClient() {
  const { publishableKey, url } = getSupabasePublicConfig();

  return createBrowserClient(url, publishableKey, {
    auth: {
      detectSessionInUrl: true,
      flowType: "pkce",
      persistSession: true,
    },
    global: {
      headers: {
        "X-Client-Info": "ai-knowledge-base/web",
      },
    },
  });
}
