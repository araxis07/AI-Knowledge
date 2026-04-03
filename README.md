# AI Knowledge Base

Portfolio-grade full-stack AI knowledge base for secure document ingestion, hybrid search, and grounded AI answers with visible citations.

Built with Next.js App Router and Supabase, this project lets users sign in, create workspaces, upload documents, index them, search across them semantically and by keyword, and ask AI questions that stay anchored to retrieved context.

## Purpose

This project is designed for teams that need a private workspace to:

- upload and organize internal documents
- index content into a vector-enabled database
- search across documents with semantic and keyword retrieval
- ask grounded AI questions with citations back to source content
- manage workspaces, members, and operational visibility from one product

It is intentionally built as a serious full-stack portfolio project rather than a fake demo.

## What The Product Does

- Real authentication with protected app routes
- Workspace creation, switching, settings, and role-based access
- Secure document uploads to Supabase Storage
- Document library with metadata, status, archive, delete, and reprocess foundations
- Async ingestion pipeline for PDF, Markdown, and plain text
- Text normalization, chunking, embeddings, and vector storage in pgvector
- Hybrid search using PostgreSQL full-text search plus vector similarity
- Grounded AI Q&A that only answers from retrieved context
- Visible citations with document names and chunk previews
- Conversation history foundation
- Activity logs, operational panels, health endpoints, and rate-limiting foundations
- Realtime ingestion status updates
- Playwright coverage and GitHub Actions CI foundations

## Tech Stack

### Frontend

- Next.js 16 App Router
- React 19
- TypeScript strict mode
- Tailwind CSS 4

### Backend / Platform

- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Supabase Realtime
- pgvector
- PostgreSQL full-text search

### Validation / Forms / Quality

- Zod
- React Hook Form
- ESLint
- Playwright
- GitHub Actions

## Architecture Summary

The app is structured as a modular monolith:

- `Next.js` handles the app shell, route handlers, server actions, and server-rendered UX
- `Supabase` handles auth, database, storage, realtime, and row-level security
- `Postgres + pgvector` power document retrieval, chunk storage, and hybrid search
- `Server-side adapters` keep AI providers swappable for embeddings and chat
- `RLS` enforces workspace-scoped access control at the database layer

## Core Features

### Authentication and Access

- Sign up, sign in, sign out
- Protected workspace routes
- Role model: `owner`, `admin`, `editor`, `viewer`
- Role-aware admin and operational actions

### Documents and Ingestion

- Upload `PDF`, `Markdown`, and `plain text`
- Store document metadata in the database
- Workspace-scoped private file storage
- Ingestion job tracking with status visibility
- Document states including uploaded, processing, ready, failed, and archived foundations

### Search and AI

- Keyword search with PostgreSQL full-text search
- Semantic search with pgvector
- Hybrid ranking across both retrieval methods
- Workspace-level search filters
- Grounded AI answers with visible citations
- Clear insufficient-context handling

### Admin and Operations

- Workspace settings foundation
- Member management
- Activity log from database-backed events
- Health and readiness endpoints
- Operational status panels
- Rate-limiting and secret-redaction foundations

## Repository Structure

```text
src/
  app/                     # App Router pages, route handlers, server actions
  components/              # UI, layout, documents, search, conversations, workspaces
  lib/                     # env, validation, utilities, Supabase helpers
  server/                  # server-only ingestion, AI, search, rate limit, ops logic
supabase/
  migrations/              # schema, RLS, storage, search, hardening migrations
e2e/                       # Playwright specs, fixtures, helpers
docs/
  production-checklist.md
```

## Local Setup

### Requirements

- Node.js `>=24.14.1`
- npm `>=11`
- A Supabase project with the repository migrations applied

### Install

```bash
npm install
cp .env.example .env.local
```

### Run

```bash
npm run dev
```

Open `http://localhost:3000`

## Environment Variables

Use [`.env.example`](./.env.example) as the template.

### Required Foundation

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Provider-Dependent

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

Important:

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only
- Never commit `.env.local`
- AI-backed flows require provider keys to run end-to-end

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

## Testing and CI

The repository includes:

- Playwright coverage for critical user flows
- Lint, typecheck, and production build validation
- GitHub Actions CI
- Optional provider-backed E2E execution behind CI gating

### Critical Flows Covered

- Auth
- Workspace creation and switching
- Document upload
- Ingestion status visibility
- Search
- AI Q&A with citations
- Admin and member controls

## Provider-Dependent Areas

These features are implemented, but require external setup:

- Embedding generation during ingestion
- Live grounded AI answer generation
- Provider-backed E2E tests
- Semantic retrieval quality that depends on embedding availability

Without provider keys, the project still supports:

- auth
- workspaces
- document library
- storage integration
- keyword search
- member management
- operational/admin surfaces

## Production Notes

See [docs/production-checklist.md](./docs/production-checklist.md) for deployment and readiness steps.

Main setup dependencies before production use:

- apply all Supabase migrations
- configure Storage, Realtime, pgvector, and RLS correctly
- provide secure env values in deployment
- verify health endpoints and provider readiness

## Current Limitations

- Member invitation flow is not fully built out
- Ownership transfer and workspace deletion are still limited
- Ingestion currently uses the existing async job foundation instead of a dedicated durable worker queue
- Richer usage/billing/quota controls are not implemented

## Portfolio Positioning

This project is suitable as:

- a serious portfolio-grade full-stack product
- a foundation for an internal AI knowledge base
- a starting point for a workspace-based document intelligence SaaS

