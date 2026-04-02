import { createClient } from "@supabase/supabase-js";

import { getSupabaseServiceRoleConfig } from "@/lib/supabase/config";

export function createServiceRoleSupabaseClient() {
  const { serviceRoleKey, url } = getSupabaseServiceRoleConfig();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: {
      headers: {
        "X-Client-Info": "ai-knowledge-base/service-role",
      },
    },
  });
}
