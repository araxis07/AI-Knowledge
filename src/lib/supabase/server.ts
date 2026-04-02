import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabasePublicConfig } from "@/lib/supabase/config";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const { publishableKey, url } = getSupabasePublicConfig();

  return createServerClient(url, publishableKey, {
    auth: {
      flowType: "pkce",
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, options, value }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components may not be able to set cookies directly.
        }
      },
    },
    global: {
      headers: {
        "X-Client-Info": "ai-knowledge-base/server",
      },
    },
  });
}
