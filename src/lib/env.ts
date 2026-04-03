import { z } from "zod";

function emptyStringToUndefined(value: unknown) {
  return typeof value === "string" && value.trim().length === 0 ? undefined : value;
}

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.preprocess(emptyStringToUndefined, z.string().url().optional()),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).optional(),
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).optional(),
  ),
});

const serverEnvSchema = z.object({
  AI_CHAT_PROVIDER: z.preprocess(
    emptyStringToUndefined,
    z.enum(["openai"]).optional(),
  ),
  AI_EMBEDDING_PROVIDER: z.preprocess(
    emptyStringToUndefined,
    z.enum(["openai"]).optional(),
  ),
  AI_OPENAI_BASE_URL: z.preprocess(emptyStringToUndefined, z.string().url().optional()),
  AI_OPENAI_CHAT_MODEL: z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).optional(),
  ),
  AI_OPENAI_EMBEDDING_DIMENSIONS: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().positive().optional(),
  ),
  AI_OPENAI_EMBEDDING_MODEL: z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).optional(),
  ),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  OPENAI_API_KEY: z.preprocess(emptyStringToUndefined, z.string().min(1).optional()),
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).optional(),
  ),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function readPublicEnv(): PublicEnv {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function readServerEnv(): ServerEnv {
  return serverEnvSchema.parse({
    AI_CHAT_PROVIDER: process.env.AI_CHAT_PROVIDER,
    AI_EMBEDDING_PROVIDER: process.env.AI_EMBEDDING_PROVIDER,
    AI_OPENAI_BASE_URL: process.env.AI_OPENAI_BASE_URL,
    AI_OPENAI_CHAT_MODEL: process.env.AI_OPENAI_CHAT_MODEL,
    AI_OPENAI_EMBEDDING_DIMENSIONS: process.env.AI_OPENAI_EMBEDDING_DIMENSIONS,
    AI_OPENAI_EMBEDDING_MODEL: process.env.AI_OPENAI_EMBEDDING_MODEL,
    NODE_ENV: process.env.NODE_ENV,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}
