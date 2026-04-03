# AI Knowledge Base

Portfolio-grade full-stack knowledge base for workspace-scoped document search and grounded AI answers. The app uses Next.js App Router on the frontend and Supabase for auth, Postgres, Storage, Realtime, and pgvector-backed retrieval.

## What This Project Includes

- Real Supabase Auth with sign up, sign in, sign out, and protected App Router routes
- Workspace creation, switching, settings, and role-aware guards for `owner`, `admin`, `editor`, and `viewer`
- Secure document uploads into a private workspace bucket
- Database-backed document library, detail pages, archive/delete/reprocess controls, and ingestion job visibility
- Async ingestion foundation for PDF, Markdown, and plain text extraction, normalization, chunking, and vector persistence
- Hybrid search with PostgreSQL full-text search plus pgvector-based retrieval
- Grounded AI Q&A that only answers from retrieved workspace context and renders visible citations
- Conversation history foundation, activity feed, operational status panels, and health endpoints
- Realtime ingestion status refresh, server-side rate limiting, and secret redaction in logs
- Playwright coverage for critical flows, plus GitHub Actions CI foundations

## Provider-Dependent Features

These flows are implemented but depend on external credentials:

- Embedding generation during ingestion needs `OPENAI_API_KEY`
- Semantic or hybrid retrieval falls back to keyword-only search if embeddings are unavailable
- Grounded AI answers with fresh model output need `OPENAI_API_KEY`
- Provider-backed Playwright tests are optional and disabled by default

Core workspace, auth, document upload, keyword search, member management, and operational surfaces do not require browser-side secrets.

## Stack

- Next.js 16.2.2
- React 19.2.4
- TypeScript 5.9.3 in strict mode
- Tailwind CSS 4.2.2
- Supabase Auth, Postgres, Storage, Realtime, and pgvector
- Zod 4.3.6
- React Hook Form 7.72.0
- Playwright 1.59.1
- ESLint 9 with `eslint-config-next`

## Repository Structure

```text
src/
  app/                     # App Router pages, route handlers, server actions
  components/              # UI, layout, search, chat, documents, workspaces
  lib/                     # shared validation, env, Supabase helpers, utilities
  server/                  # server-only AI, ingestion, search, ops, and rate limit logic
supabase/
  migrations/              # SQL schema, RLS, search, storage, and hardening migrations
e2e/                       # Playwright helpers, fixtures, and specs
docs/
  production-checklist.md
```

## Local Development

### Requirements

- Node.js `>=24.14.1`
- npm `>=11`
- A Supabase project with the repository migrations applied

### Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment

The public-safe template lives in [`./.env.example`](./.env.example). The important groups are:

### App

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Supabase

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the preferred browser key. `NEXT_PUBLIC_SUPABASE_ANON_KEY` remains as a compatibility fallback. `SUPABASE_SERVICE_ROLE_KEY` must stay server-side only.

### AI Providers

```bash
AI_CHAT_PROVIDER=openai
AI_EMBEDDING_PROVIDER=openai
AI_OPENAI_BASE_URL=https://api.openai.com/v1
AI_OPENAI_CHAT_MODEL=gpt-5.2
AI_OPENAI_EMBEDDING_MODEL=text-embedding-3-small
AI_OPENAI_EMBEDDING_DIMENSIONS=1536
OPENAI_API_KEY=
```

### Playwright

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000
PLAYWRIGHT_ENABLE_PROVIDER_TESTS=false
```

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run check
npm run test:e2e
npm run test:e2e:core
npm run test:e2e:provider
```

## Testing

### Critical Playwright Flows

- Auth redirect, sign-in, sign-out, and public sign-up smoke coverage
- Workspace creation and workspace switching
- Document upload plus ingestion/job visibility
- Keyword search with result snippets and filters
- Owner member-management controls
- Provider-backed grounded Q&A with citations

### How The Suite Is Split

- `npm run test:e2e:core`
  Runs flows that do not require live model output
- `npm run test:e2e:provider`
  Runs provider-backed AI tests tagged with `@provider`

Provider tests only run when `PLAYWRIGHT_ENABLE_PROVIDER_TESTS=true` and `OPENAI_API_KEY` is present.

## CI

The default GitHub Actions workflow always runs:

- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

An optional E2E job is included but only runs when the repository variable `E2E_ENABLED=true` is set. It expects the required Supabase secrets to be configured in GitHub. Provider-backed E2E is gated separately by `E2E_PROVIDER_ENABLED=true`.

## Production Readiness

See [`docs/production-checklist.md`](./docs/production-checklist.md) for the deploy checklist covering migrations, secrets, health checks, provider setup, and launch review.

## Current Gaps

- Member invitation workflows
- Ownership transfer and workspace deletion flows
- Dedicated external workers beyond the current Next.js async job foundation
- Richer analytics and quota management
