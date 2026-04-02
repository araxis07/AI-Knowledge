create or replace function private.storage_workspace_id(object_name text)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  folder text;
begin
  folder := (storage.foldername(object_name))[1];

  if folder is null or folder !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return null;
  end if;

  return folder::uuid;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  26214400,
  array[
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/x-markdown'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists documents_bucket_select_member on storage.objects;
create policy documents_bucket_select_member
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and private.is_workspace_member(private.storage_workspace_id(name))
);

drop policy if exists documents_bucket_insert_editor on storage.objects;
create policy documents_bucket_insert_editor
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and private.has_workspace_role(private.storage_workspace_id(name), 'editor')
);

drop policy if exists documents_bucket_update_editor on storage.objects;
create policy documents_bucket_update_editor
on storage.objects
for update
to authenticated
using (
  bucket_id = 'documents'
  and private.has_workspace_role(private.storage_workspace_id(name), 'editor')
)
with check (
  bucket_id = 'documents'
  and private.has_workspace_role(private.storage_workspace_id(name), 'editor')
);

drop policy if exists documents_bucket_delete_editor on storage.objects;
create policy documents_bucket_delete_editor
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
  and private.has_workspace_role(private.storage_workspace_id(name), 'editor')
);
