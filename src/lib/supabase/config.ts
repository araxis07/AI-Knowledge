import { z } from "zod";

import { readPublicEnv, readServerEnv } from "@/lib/env";

const supabasePublicConfigSchema = z.object({
  url: z.string().url(),
  publishableKey: z.string().min(1),
});

const supabaseServiceRoleConfigSchema = z.object({
  url: z.string().url(),
  serviceRoleKey: z.string().min(1),
});

export function getOptionalSupabasePublicConfig() {
  const env = readPublicEnv();
  const publishableKey =
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !publishableKey) {
    return null;
  }

  return supabasePublicConfigSchema.parse({
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey,
  });
}

export function getSupabasePublicConfig() {
  const config = getOptionalSupabasePublicConfig();

  if (!config) {
    throw new Error(
      "Supabase public config is incomplete. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY).",
    );
  }

  return config;
}

export function getSupabaseServiceRoleConfig() {
  const config = getOptionalSupabaseServiceRoleConfig();

  if (!config) {
    throw new Error(
      "Supabase service-role config is incomplete. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return config;
}

export function getOptionalSupabaseServiceRoleConfig() {
  const publicEnv = readPublicEnv();
  const serverEnv = readServerEnv();

  if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL || !serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  return supabaseServiceRoleConfigSchema.parse({
    url: publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey: serverEnv.SUPABASE_SERVICE_ROLE_KEY,
  });
}
