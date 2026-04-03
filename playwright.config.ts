import { existsSync } from "node:fs";

import { defineConfig } from "@playwright/test";

function loadEnvFileIfPresent(path: string) {
  if (existsSync(path)) {
    process.loadEnvFile?.(path);
  }
}

loadEnvFileIfPresent(".env");
loadEnvFileIfPresent(".env.local");
loadEnvFileIfPresent(".env.test.local");

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const appUrl = new URL(baseURL);
const appHost = appUrl.hostname || "127.0.0.1";
const appPort =
  appUrl.port || (appUrl.protocol === "https:" ? "443" : "3000");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  webServer: {
    command: `npm run dev -- --hostname ${appHost} --port ${appPort}`,
    env: {
      AI_CHAT_PROVIDER: process.env.AI_CHAT_PROVIDER ?? "openai",
      AI_EMBEDDING_PROVIDER: process.env.AI_EMBEDDING_PROVIDER ?? "openai",
      AI_OPENAI_BASE_URL: process.env.AI_OPENAI_BASE_URL ?? "https://api.openai.com/v1",
      AI_OPENAI_CHAT_MODEL: process.env.AI_OPENAI_CHAT_MODEL ?? "gpt-5.2",
      AI_OPENAI_EMBEDDING_DIMENSIONS: process.env.AI_OPENAI_EMBEDDING_DIMENSIONS ?? "1536",
      AI_OPENAI_EMBEDDING_MODEL:
        process.env.AI_OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
      NEXT_PUBLIC_APP_URL: baseURL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    url: baseURL,
  },
});
