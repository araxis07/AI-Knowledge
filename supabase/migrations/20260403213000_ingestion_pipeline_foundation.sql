alter table public.documents
  add column if not exists chunk_count integer check (chunk_count is null or chunk_count >= 0),
  add column if not exists extracted_char_count integer check (
    extracted_char_count is null or extracted_char_count >= 0
  ),
  add column if not exists indexed_at timestamptz,
  add column if not exists last_ingested_at timestamptz,
  add column if not exists embedding_provider text,
  add column if not exists embedding_model text;

alter table public.ingestion_jobs
  add column if not exists steps_total integer not null default 0 check (steps_total >= 0),
  add column if not exists steps_completed integer not null default 0 check (
    steps_completed >= 0
  ),
  add column if not exists progress_message text,
  add column if not exists progress_metadata jsonb not null default '{}'::jsonb;

create index if not exists documents_workspace_indexed_at_idx
  on public.documents (workspace_id, indexed_at desc);

create index if not exists documents_workspace_last_ingested_at_idx
  on public.documents (workspace_id, last_ingested_at desc);

create index if not exists ingestion_jobs_workspace_document_status_updated_at_idx
  on public.ingestion_jobs (workspace_id, document_id, status, updated_at desc);
