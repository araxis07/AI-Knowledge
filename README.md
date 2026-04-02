# AI Knowledge Base

Production-oriented scaffold for a full-stack AI knowledge base and semantic document search platform built with Next.js App Router, TypeScript, Tailwind CSS, and a Supabase-first backend architecture.

This repository currently contains Phase 1 foundation only. Business features such as auth, workspaces, document ingestion, search, and grounded chat are intentionally deferred to later phases.

## Stack

- Next.js 16.2.2
- React 19.2.4
- TypeScript 5.9.3 in strict mode
- Tailwind CSS 4.2.2
- ESLint 9 with `eslint-config-next`
- Zod 4.3.6

## Included In Phase 1

- App Router scaffold
- strict TypeScript configuration
- Tailwind CSS v4 setup
- flat ESLint configuration
- production-leaning base app shell
- health endpoints
- environment template
- GitHub Actions CI foundation

## Not Included Yet

- authentication
- workspace management
- document upload or storage integration
- embeddings or vector search
- AI chat and citations
- Supabase runtime integration

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
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` and any AI provider secrets are intentionally not introduced in Phase 1.

## Project Structure

```text
src/
  app/
    api/health/
  components/
    layout/
    ui/
  lib/
    utils/
```

## CI

GitHub Actions runs:

- install with `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Next Phases

1. Auth, profiles, workspaces, and RLS foundations
2. Document upload and ingestion pipeline
3. Hybrid semantic search
4. Grounded AI Q&A with citations
