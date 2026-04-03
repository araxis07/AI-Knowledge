do $$
begin
  create type public.workspace_role as enum ('viewer', 'editor', 'admin', 'owner');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.document_status as enum (
    'uploaded',
    'queued',
    'processing',
    'indexed',
    'failed',
    'archived'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.ingestion_job_kind as enum (
    'extract',
    'chunk',
    'embed',
    'reindex',
    'delete'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.ingestion_job_status as enum (
    'queued',
    'running',
    'completed',
    'failed',
    'cancelled'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.conversation_visibility as enum ('private', 'workspace');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.conversation_status as enum ('active', 'archived');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.message_role as enum ('user', 'assistant', 'system', 'tool');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.search_mode as enum ('keyword', 'semantic', 'hybrid');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.activity_actor_type as enum ('user', 'system');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  timezone text,
  locale text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_format_chk check (
    email is null or email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  )
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  description text,
  created_by uuid not null references public.profiles (id) on delete restrict,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspaces_slug_format_chk check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint workspaces_name_length_chk check (
    char_length(trim(name)) between 1 and 120
  )
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.workspace_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_members_workspace_user_unique unique (workspace_id, user_id)
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  uploaded_by uuid references public.profiles (id) on delete set null,
  title text not null,
  description text,
  summary text,
  storage_bucket text not null default 'documents',
  storage_path text not null,
  source_type text not null default 'upload',
  mime_type text not null,
  file_extension text,
  size_bytes bigint not null check (size_bytes >= 0),
  checksum_sha256 text,
  page_count integer check (page_count is null or page_count >= 0),
  token_count integer check (token_count is null or token_count >= 0),
  language_code text not null default 'en',
  status public.document_status not null default 'uploaded',
  metadata jsonb not null default '{}'::jsonb,
  fts tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint documents_storage_path_length_chk check (char_length(storage_path) > 0),
  constraint documents_checksum_sha256_chk check (
    checksum_sha256 is null or checksum_sha256 ~ '^[A-Fa-f0-9]{64}$'
  ),
  constraint documents_id_workspace_unique unique (id, workspace_id),
  constraint documents_storage_unique unique (workspace_id, storage_bucket, storage_path)
);

create table if not exists public.document_tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  slug text not null,
  color text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint document_tags_slug_format_chk check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint document_tags_id_workspace_unique unique (id, workspace_id),
  constraint document_tags_workspace_slug_unique unique (workspace_id, slug)
);

create table if not exists public.document_tag_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  document_id uuid not null,
  tag_id uuid not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint document_tag_links_unique unique (document_id, tag_id),
  constraint document_tag_links_document_fk
    foreign key (document_id, workspace_id)
    references public.documents (id, workspace_id)
    on delete cascade,
  constraint document_tag_links_tag_fk
    foreign key (tag_id, workspace_id)
    references public.document_tags (id, workspace_id)
    on delete cascade
);

create table if not exists public.ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  document_id uuid not null,
  requested_by uuid references public.profiles (id) on delete set null,
  job_kind public.ingestion_job_kind not null,
  status public.ingestion_job_status not null default 'queued',
  attempt_count integer not null default 0 check (attempt_count >= 0),
  priority smallint not null default 100 check (priority >= 0),
  provider_key text,
  worker_ref text,
  error_code text,
  error_message text,
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  last_heartbeat_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ingestion_jobs_document_fk
    foreign key (document_id, workspace_id)
    references public.documents (id, workspace_id)
    on delete cascade
);

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  document_id uuid not null,
  chunk_index integer not null check (chunk_index >= 0),
  chunk_kind text not null default 'body',
  heading text,
  content text not null,
  page_number integer check (page_number is null or page_number > 0),
  token_count integer check (token_count is null or token_count >= 0),
  char_count integer generated always as (char_length(content)) stored,
  embedding_model text,
  embedding_dimensions smallint not null default 1536 check (embedding_dimensions = 1536),
  embedding extensions.vector(1536),
  metadata jsonb not null default '{}'::jsonb,
  fts tsvector generated always as (
    setweight(to_tsvector('english', coalesce(heading, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint document_chunks_chunk_kind_chk check (
    chunk_kind in ('title', 'heading', 'body', 'table', 'caption', 'quote', 'code', 'metadata')
  ),
  constraint document_chunks_id_workspace_unique unique (id, workspace_id),
  constraint document_chunks_document_chunk_unique unique (document_id, chunk_index),
  constraint document_chunks_document_fk
    foreign key (document_id, workspace_id)
    references public.documents (id, workspace_id)
    on delete cascade
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete restrict,
  title text not null,
  visibility public.conversation_visibility not null default 'private',
  status public.conversation_status not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_title_length_chk check (
    char_length(trim(title)) between 1 and 240
  ),
  constraint conversations_id_workspace_unique unique (id, workspace_id)
);

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  conversation_id uuid not null,
  created_by uuid references public.profiles (id) on delete set null,
  role public.message_role not null,
  sort_order bigint generated always as identity,
  content text not null,
  model_key text,
  provider_key text,
  prompt_tokens integer check (prompt_tokens is null or prompt_tokens >= 0),
  completion_tokens integer check (completion_tokens is null or completion_tokens >= 0),
  metadata jsonb not null default '{}'::jsonb,
  retrieval_snapshot jsonb not null default '{}'::jsonb,
  fts tsvector generated always as (
    to_tsvector('english', coalesce(content, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversation_messages_user_role_actor_chk check (
    (role = 'user' and created_by is not null) or role <> 'user'
  ),
  constraint conversation_messages_id_workspace_unique unique (id, workspace_id),
  constraint conversation_messages_conversation_sort_unique unique (conversation_id, sort_order),
  constraint conversation_messages_conversation_fk
    foreign key (conversation_id, workspace_id)
    references public.conversations (id, workspace_id)
    on delete cascade
);

create table if not exists public.citations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  conversation_message_id uuid not null,
  document_id uuid,
  document_chunk_id uuid,
  citation_index integer not null check (citation_index >= 0),
  quote_text text not null,
  snippet_text text,
  page_number integer check (page_number is null or page_number > 0),
  char_start integer check (char_start is null or char_start >= 0),
  char_end integer check (char_end is null or char_end > 0),
  relevance_score double precision,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint citations_id_workspace_unique unique (id, workspace_id),
  constraint citations_message_index_unique unique (conversation_message_id, citation_index),
  constraint citations_offsets_chk check (
    char_start is null or char_end is null or char_end > char_start
  ),
  constraint citations_message_fk
    foreign key (conversation_message_id, workspace_id)
    references public.conversation_messages (id, workspace_id)
    on delete cascade,
  constraint citations_document_fk
    foreign key (document_id, workspace_id)
    references public.documents (id, workspace_id)
    on delete cascade,
  constraint citations_chunk_fk
    foreign key (document_chunk_id, workspace_id)
    references public.document_chunks (id, workspace_id)
    on delete cascade
);

create table if not exists public.search_history (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  actor_user_id uuid not null references public.profiles (id) on delete restrict,
  mode public.search_mode not null default 'hybrid',
  query_text text not null,
  filters jsonb not null default '{}'::jsonb,
  results_count integer not null default 0 check (results_count >= 0),
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  actor_user_id uuid references public.profiles (id) on delete set null,
  actor_type public.activity_actor_type not null default 'user',
  action text not null,
  entity_type text not null,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint activity_logs_action_length_chk check (char_length(trim(action)) > 0),
  constraint activity_logs_entity_type_length_chk check (char_length(trim(entity_type)) > 0)
);

create unique index if not exists profiles_email_unique_idx
  on public.profiles (lower(email))
  where email is not null;

create unique index if not exists workspaces_slug_unique_idx
  on public.workspaces (lower(slug));

create index if not exists workspaces_created_by_idx
  on public.workspaces (created_by, created_at desc);

create index if not exists workspace_members_user_id_idx
  on public.workspace_members (user_id, created_at desc);

create index if not exists workspace_members_workspace_role_idx
  on public.workspace_members (workspace_id, role, user_id);

create index if not exists documents_workspace_status_created_at_idx
  on public.documents (workspace_id, status, created_at desc);

create index if not exists documents_uploaded_by_idx
  on public.documents (uploaded_by, created_at desc);

create unique index if not exists documents_workspace_checksum_unique_idx
  on public.documents (workspace_id, checksum_sha256)
  where checksum_sha256 is not null;

create index if not exists documents_fts_idx
  on public.documents
  using gin (fts);

create index if not exists document_tags_workspace_name_idx
  on public.document_tags (workspace_id, lower(name));

create index if not exists document_tag_links_workspace_document_idx
  on public.document_tag_links (workspace_id, document_id);

create index if not exists document_tag_links_workspace_tag_idx
  on public.document_tag_links (workspace_id, tag_id);

create index if not exists ingestion_jobs_workspace_status_created_at_idx
  on public.ingestion_jobs (workspace_id, status, created_at desc);

create index if not exists ingestion_jobs_document_created_at_idx
  on public.ingestion_jobs (document_id, created_at desc);

create unique index if not exists ingestion_jobs_active_document_kind_unique_idx
  on public.ingestion_jobs (document_id, job_kind)
  where status in ('queued', 'running');

create index if not exists document_chunks_workspace_document_chunk_idx
  on public.document_chunks (workspace_id, document_id, chunk_index);

create index if not exists document_chunks_fts_idx
  on public.document_chunks
  using gin (fts);

create index if not exists document_chunks_embedding_hnsw_idx
  on public.document_chunks
  using hnsw (embedding extensions.vector_cosine_ops)
  where embedding is not null;

create index if not exists conversations_workspace_last_message_idx
  on public.conversations (workspace_id, last_message_at desc);

create index if not exists conversations_created_by_idx
  on public.conversations (created_by, created_at desc);

create index if not exists conversation_messages_workspace_conversation_sort_idx
  on public.conversation_messages (workspace_id, conversation_id, sort_order);

create index if not exists conversation_messages_created_by_idx
  on public.conversation_messages (created_by, created_at desc);

create index if not exists conversation_messages_fts_idx
  on public.conversation_messages
  using gin (fts);

create index if not exists citations_workspace_message_idx
  on public.citations (workspace_id, conversation_message_id, citation_index);

create index if not exists citations_document_idx
  on public.citations (document_id, document_chunk_id);

create index if not exists search_history_workspace_actor_created_at_idx
  on public.search_history (workspace_id, actor_user_id, created_at desc);

create index if not exists search_history_workspace_mode_created_at_idx
  on public.search_history (workspace_id, mode, created_at desc);

create index if not exists activity_logs_workspace_created_at_idx
  on public.activity_logs (workspace_id, created_at desc);

create index if not exists activity_logs_actor_created_at_idx
  on public.activity_logs (actor_user_id, created_at desc);

create index if not exists activity_logs_entity_idx
  on public.activity_logs (workspace_id, entity_type, entity_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at
before update on public.workspaces
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists workspace_members_set_updated_at on public.workspace_members;
create trigger workspace_members_set_updated_at
before update on public.workspace_members
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
before update on public.documents
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists document_tags_set_updated_at on public.document_tags;
create trigger document_tags_set_updated_at
before update on public.document_tags
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists document_tag_links_set_updated_at on public.document_tag_links;
create trigger document_tag_links_set_updated_at
before update on public.document_tag_links
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists ingestion_jobs_set_updated_at on public.ingestion_jobs;
create trigger ingestion_jobs_set_updated_at
before update on public.ingestion_jobs
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists document_chunks_set_updated_at on public.document_chunks;
create trigger document_chunks_set_updated_at
before update on public.document_chunks
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
before update on public.conversations
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists conversation_messages_set_updated_at on public.conversation_messages;
create trigger conversation_messages_set_updated_at
before update on public.conversation_messages
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists citations_set_updated_at on public.citations;
create trigger citations_set_updated_at
before update on public.citations
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists search_history_set_updated_at on public.search_history;
create trigger search_history_set_updated_at
before update on public.search_history
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists activity_logs_set_updated_at on public.activity_logs;
create trigger activity_logs_set_updated_at
before update on public.activity_logs
for each row
execute function public.set_current_timestamp_updated_at();

create or replace function public.sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    avatar_url
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do update
    set
      email = excluded.email,
      full_name = coalesce(excluded.full_name, public.profiles.full_name),
      avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_profile_sync on auth.users;

create trigger on_auth_user_profile_sync
after insert or update of email, raw_user_meta_data
on auth.users
for each row
execute function public.sync_profile_from_auth_user();

insert into public.profiles (id, email, full_name, avatar_url)
select
  id,
  email,
  coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name'),
  coalesce(raw_user_meta_data ->> 'avatar_url', raw_user_meta_data ->> 'picture')
from auth.users
on conflict (id) do update
set
  email = excluded.email,
  full_name = coalesce(excluded.full_name, public.profiles.full_name),
  avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
  updated_at = now();

create or replace function public.create_workspace_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict (workspace_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_workspace_created_create_owner_membership on public.workspaces;

create trigger on_workspace_created_create_owner_membership
after insert on public.workspaces
for each row
execute function public.create_workspace_owner_membership();

create or replace function public.touch_conversation_last_message_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set
    last_message_at = coalesce(new.created_at, now()),
    updated_at = now()
  where id = new.conversation_id
    and workspace_id = new.workspace_id;

  return new;
end;
$$;

drop trigger if exists on_conversation_message_insert_touch_conversation on public.conversation_messages;

create trigger on_conversation_message_insert_touch_conversation
after insert on public.conversation_messages
for each row
execute function public.touch_conversation_last_message_at();
