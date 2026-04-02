# AI Knowledge Base

Production-oriented scaffold for a full-stack AI knowledge base and semantic document search platform built with Next.js App Router, TypeScript, Tailwind CSS, and a Supabase-first backend architecture.

This repository currently contains Phase 2 foundation: the original scaffold plus real Supabase Auth integration, protected application routes, user profile sync, workspace creation, role-aware navigation, and a workspace settings foundation.

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
- health endpoints
- environment template
- GitHub Actions CI foundation

## Not Included Yet

- document upload or storage integration
- embeddings or vector search
- AI chat and citations
- member invitation workflows
- document ingestion jobs and retrieval UX

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
```

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the preferred public key. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is kept as a compatibility fallback during Supabase's key transition. `SUPABASE_SERVICE_ROLE_KEY` is only for trusted server-side workflows and must never be exposed to the browser.

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
    layout/
    ui/
    workspaces/
  lib/
    supabase/
    utils/
    validation/
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

1. Member invitations and richer workspace administration
2. Document upload and ingestion pipeline
3. Hybrid semantic search
4. Grounded AI Q&A with citations
