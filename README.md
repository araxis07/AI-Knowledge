# AI Knowledge Base

Production-oriented full-stack foundation for an AI knowledge base and semantic document search platform built with Next.js App Router, TypeScript, Tailwind CSS, and a Supabase-first backend architecture.

This repository currently contains the product shell, real Supabase Auth, workspace management, document library uploads, and an asynchronous ingestion foundation that extracts text, chunks content, and stores embeddings in Postgres with pgvector.

## Stack

- Next.js 16.2.2
- React 19.2.4
- TypeScript 5.9.3 in strict mode
- Tailwind CSS 4.2.2
- ESLint 9 with `eslint-config-next`
- Zod 4.3.6

## Included Now

- App Router scaffold
- strict TypeScript configuration
- Tailwind CSS v4 setup
- flat ESLint configuration
- production-leaning base app shell
- Supabase SSR/auth foundation for App Router
- real sign in, sign up, and sign out flows with Supabase Auth
- protected `/app` routes with server-side guards
- profile sync for authenticated users
- workspace creation, switching, and settings foundation
- role-aware workspace access for `owner`, `admin`, `editor`, and `viewer`
- initial SQL migrations with RLS, pgvector, and full-text search support
- real document uploads into a private Supabase Storage bucket
- document library list and detail pages backed by Postgres
- asynchronous ingestion jobs with progress tracking
- text extraction for PDF, Markdown, and plain-text files
- normalized chunk generation with overlap
- swappable embedding adapter foundation with an OpenAI implementation
- chunk and vector persistence in `document_chunks`
- health endpoints
- environment template
- GitHub Actions CI foundation

## Not Included Yet

- hybrid search and retrieval ranking
- AI chat and citations
- member invitation workflows
- extraction workers outside the Next.js runtime

## Requirements

- Node.js `>=24.14.1`
- npm `>=11`

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Available Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run check
```

## Environment

The scaffold keeps environment requirements minimal for now:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AI_EMBEDDING_PROVIDER=openai
AI_OPENAI_BASE_URL=https://api.openai.com/v1
AI_OPENAI_EMBEDDING_MODEL=text-embedding-3-small
AI_OPENAI_EMBEDDING_DIMENSIONS=1536
OPENAI_API_KEY=
```

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the preferred public key. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is kept as a compatibility fallback during Supabase's key transition. `SUPABASE_SERVICE_ROLE_KEY` is only for trusted server-side workflows and must never be exposed to the browser.

The ingestion worker runs after the request completes by using Next.js server-side background callbacks. It needs `SUPABASE_SERVICE_ROLE_KEY` to read storage and write chunks, and it needs `OPENAI_API_KEY` to generate embeddings with the default provider.

## Project Structure

```text
src/
  app/
    (public)/
    (app)/app/
    actions/
    api/health/
    auth/callback/
  components/
    auth/
    documents/
    layout/
    ui/
    workspaces/
  lib/
    supabase/
    utils/
    validation/
  server/
    ingestion/
supabase/
  migrations/
```

## CI

GitHub Actions runs:

- install with `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Next Phases

1. Hybrid semantic search and retrieval ranking
2. Grounded AI Q&A with citations
3. Member invitations and richer workspace administration
4. E2E coverage for document and ingestion flows
