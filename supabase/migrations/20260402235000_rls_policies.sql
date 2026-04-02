create or replace function private.has_shared_workspace(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members me
    join public.workspace_members them
      on them.workspace_id = me.workspace_id
    where me.user_id = auth.uid()
      and them.user_id = target_user_id
  );
$$;

create or replace function private.workspace_role_for_user(target_workspace_id uuid)
returns public.workspace_role
language sql
stable
security definer
set search_path = public
as $$
  select wm.role
  from public.workspace_members wm
  where wm.workspace_id = target_workspace_id
    and wm.user_id = auth.uid()
  limit 1;
$$;

create or replace function private.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
  );
$$;

create or replace function private.has_workspace_role(
  target_workspace_id uuid,
  minimum_role public.workspace_role
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select wm.role >= minimum_role
      from public.workspace_members wm
      where wm.workspace_id = target_workspace_id
        and wm.user_id = auth.uid()
      limit 1
    ),
    false
  );
$$;

create or replace function private.can_manage_workspace_member(
  target_workspace_id uuid,
  target_role public.workspace_role
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  member_role public.workspace_role;
begin
  member_role := private.workspace_role_for_user(target_workspace_id);

  if member_role is null then
    return false;
  end if;

  if member_role = 'owner' then
    return true;
  end if;

  if member_role = 'admin' and target_role in ('viewer', 'editor') then
    return true;
  end if;

  return false;
end;
$$;

create or replace function private.can_access_conversation(
  target_workspace_id uuid,
  owner_user_id uuid,
  visibility public.conversation_visibility
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not private.is_workspace_member(target_workspace_id) then
    return false;
  end if;

  if owner_user_id = auth.uid() then
    return true;
  end if;

  if visibility = 'workspace' then
    return true;
  end if;

  return private.has_workspace_role(target_workspace_id, 'admin');
end;
$$;

create or replace function private.can_manage_conversation(
  target_workspace_id uuid,
  owner_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select owner_user_id = auth.uid()
    or private.has_workspace_role(target_workspace_id, 'admin');
$$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.document_tags enable row level security;
alter table public.document_tag_links enable row level security;
alter table public.ingestion_jobs enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.citations enable row level security;
alter table public.search_history enable row level security;
alter table public.activity_logs enable row level security;

create policy profiles_select_shared_workspace
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or private.has_shared_workspace(id)
);

create policy profiles_insert_self
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy profiles_update_self
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy workspaces_select_member
on public.workspaces
for select
to authenticated
using (private.is_workspace_member(id));

create policy workspaces_insert_creator
on public.workspaces
for insert
to authenticated
with check (
  created_by = auth.uid()
);

create policy workspaces_update_admin
on public.workspaces
for update
to authenticated
using (private.has_workspace_role(id, 'admin'))
with check (private.has_workspace_role(id, 'admin'));

create policy workspaces_delete_owner
on public.workspaces
for delete
to authenticated
using (private.has_workspace_role(id, 'owner'));

create policy workspace_members_select_member
on public.workspace_members
for select
to authenticated
using (private.is_workspace_member(workspace_id));

create policy workspace_members_insert_manager
on public.workspace_members
for insert
to authenticated
with check (private.can_manage_workspace_member(workspace_id, role));

create policy workspace_members_update_manager
on public.workspace_members
for update
to authenticated
using (private.can_manage_workspace_member(workspace_id, role))
with check (private.can_manage_workspace_member(workspace_id, role));

create policy workspace_members_delete_manager
on public.workspace_members
for delete
to authenticated
using (private.can_manage_workspace_member(workspace_id, role));

create policy documents_select_member
on public.documents
for select
to authenticated
using (private.is_workspace_member(workspace_id));

create policy documents_insert_editor
on public.documents
for insert
to authenticated
with check (
  private.has_workspace_role(workspace_id, 'editor')
  and uploaded_by = auth.uid()
);

create policy documents_update_editor
on public.documents
for update
to authenticated
using (private.has_workspace_role(workspace_id, 'editor'))
with check (private.has_workspace_role(workspace_id, 'editor'));

create policy documents_delete_editor
on public.documents
for delete
to authenticated
using (private.has_workspace_role(workspace_id, 'editor'));

create policy document_chunks_select_member
on public.document_chunks
for select
to authenticated
using (private.is_workspace_member(workspace_id));

create policy document_tags_select_member
on public.document_tags
for select
to authenticated
using (private.is_workspace_member(workspace_id));

create policy document_tags_insert_editor
on public.document_tags
for insert
to authenticated
with check (private.has_workspace_role(workspace_id, 'editor'));

create policy document_tags_update_editor
on public.document_tags
for update
to authenticated
using (private.has_workspace_role(workspace_id, 'editor'))
with check (private.has_workspace_role(workspace_id, 'editor'));

create policy document_tags_delete_editor
on public.document_tags
for delete
to authenticated
using (private.has_workspace_role(workspace_id, 'editor'));

create policy document_tag_links_select_member
on public.document_tag_links
for select
to authenticated
using (private.is_workspace_member(workspace_id));

create policy document_tag_links_insert_editor
on public.document_tag_links
for insert
to authenticated
with check (private.has_workspace_role(workspace_id, 'editor'));

create policy document_tag_links_delete_editor
on public.document_tag_links
for delete
to authenticated
using (private.has_workspace_role(workspace_id, 'editor'));

create policy ingestion_jobs_select_member
on public.ingestion_jobs
for select
to authenticated
using (private.is_workspace_member(workspace_id));

create policy ingestion_jobs_insert_editor
on public.ingestion_jobs
for insert
to authenticated
with check (
  private.has_workspace_role(workspace_id, 'editor')
  and requested_by = auth.uid()
);

create policy conversations_select_accessible
on public.conversations
for select
to authenticated
using (
  private.can_access_conversation(workspace_id, created_by, visibility)
);

create policy conversations_insert_member
on public.conversations
for insert
to authenticated
with check (
  private.is_workspace_member(workspace_id)
  and created_by = auth.uid()
);

create policy conversations_update_owner_or_admin
on public.conversations
for update
to authenticated
using (private.can_manage_conversation(workspace_id, created_by))
with check (private.can_manage_conversation(workspace_id, created_by));

create policy conversations_delete_owner_or_admin
on public.conversations
for delete
to authenticated
using (private.can_manage_conversation(workspace_id, created_by));

create policy conversation_messages_select_accessible
on public.conversation_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_messages.conversation_id
      and c.workspace_id = conversation_messages.workspace_id
      and private.can_access_conversation(c.workspace_id, c.created_by, c.visibility)
  )
);

create policy conversation_messages_insert_user_messages
on public.conversation_messages
for insert
to authenticated
with check (
  role = 'user'
  and created_by = auth.uid()
  and exists (
    select 1
    from public.conversations c
    where c.id = conversation_messages.conversation_id
      and c.workspace_id = conversation_messages.workspace_id
      and private.can_access_conversation(c.workspace_id, c.created_by, c.visibility)
  )
);

create policy conversation_messages_delete_owner_or_admin
on public.conversation_messages
for delete
to authenticated
using (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_messages.conversation_id
      and c.workspace_id = conversation_messages.workspace_id
      and private.can_manage_conversation(c.workspace_id, c.created_by)
  )
);

create policy citations_select_accessible
on public.citations
for select
to authenticated
using (
  exists (
    select 1
    from public.conversation_messages cm
    join public.conversations c
      on c.id = cm.conversation_id
     and c.workspace_id = cm.workspace_id
    where cm.id = citations.conversation_message_id
      and cm.workspace_id = citations.workspace_id
      and private.can_access_conversation(c.workspace_id, c.created_by, c.visibility)
  )
);

create policy search_history_select_owner_or_admin
on public.search_history
for select
to authenticated
using (
  actor_user_id = auth.uid()
  or private.has_workspace_role(workspace_id, 'admin')
);

create policy search_history_insert_owner
on public.search_history
for insert
to authenticated
with check (
  actor_user_id = auth.uid()
  and private.is_workspace_member(workspace_id)
);

create policy activity_logs_select_owner_or_admin
on public.activity_logs
for select
to authenticated
using (
  actor_user_id = auth.uid()
  or private.has_workspace_role(workspace_id, 'admin')
);

create policy activity_logs_insert_user_actor
on public.activity_logs
for insert
to authenticated
with check (
  actor_type = 'user'
  and actor_user_id = auth.uid()
  and private.is_workspace_member(workspace_id)
);
