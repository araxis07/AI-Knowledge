# Production Checklist

## Platform

- Create separate Supabase and Vercel projects for development, staging, and production.
- Apply every SQL migration in `supabase/migrations` before promoting an environment.
- Verify the private `documents` storage bucket and its policies exist in the target project.
- Confirm Realtime is enabled for the tables used by ingestion status surfaces.

## Secrets and Environment

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only.
- Keep `OPENAI_API_KEY` server-side only.
- Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` per environment.
- Rotate provider keys that were ever shared outside your private secrets manager.
- Mirror production secrets into GitHub Actions only when the E2E job is intentionally enabled.

## App Readiness

- Verify `/api/health/live`, `/api/health/ready`, and `/api/health/status` return the expected status.
- Confirm rate limiting tables and RPCs are present before enabling public traffic.
- Smoke test upload, ingestion visibility, search, grounded Q&A, and member management in staging.
- Check that workspace-scoped RLS policies behave correctly for `owner`, `admin`, `editor`, and `viewer`.

## AI and Search

- Confirm the embedding model dimensions match the `document_chunks.embedding` vector size.
- Reindex existing documents after any embedding model change.
- Validate that keyword-only search still works if the embedding provider is unavailable.
- Validate that grounded Q&A refuses to answer when no retrieved context exists.

## CI and Testing

- Keep `npm run lint`, `npm run typecheck`, and `npm run build` green on every branch.
- Enable the optional Playwright E2E workflow only after storing the required Supabase secrets in GitHub.
- Enable provider-backed Playwright tests only after storing `OPENAI_API_KEY` and accepting external model cost.
- Review Playwright failure artifacts before re-running a broken pipeline.

## Launch Review

- Check public pages and README for accidental secret leakage before every release.
- Confirm the app works on mobile and desktop for the main workspace flows.
- Verify storage cleanup, archive, and delete controls on real documents.
- Record a short walkthrough or screenshots if this repository is being used as a portfolio project.
