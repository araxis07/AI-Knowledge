import { existsSync } from "node:fs";

function loadEnvFileIfPresent(path: string) {
  if (existsSync(path)) {
    process.loadEnvFile?.(path);
  }
}

loadEnvFileIfPresent(".env");
loadEnvFileIfPresent(".env.local");
loadEnvFileIfPresent(".env.test.local");

function readRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`${name} is required for Playwright E2E tests.`);
  }

  return value;
}

export const e2eEnv = {
  baseUrl: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
  enableProviderTests: process.env.PLAYWRIGHT_ENABLE_PROVIDER_TESTS === "true",
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
};

export function getRequiredSupabaseE2EEnv() {
  return {
    serviceRoleKey: readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    url: readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
  };
}

export function hasSupabaseAdminE2EEnv() {
  return (
    e2eEnv.supabaseUrl.trim().length > 0 &&
    e2eEnv.supabaseServiceRoleKey.trim().length > 0
  );
}

export function hasProviderTestEnv() {
  return e2eEnv.enableProviderTests && e2eEnv.openAiApiKey.trim().length > 0;
}
