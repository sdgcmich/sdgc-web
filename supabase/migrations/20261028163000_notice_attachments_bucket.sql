-- Migration: notice_attachments_bucket
-- 1. Create public storage bucket 'attachments' for downloadable notice files (PDFs, event maps, meeting minutes)
-- 2. Sets RLS policies: public read, staff (content.manage / roles.admin) write and delete

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

-- 1. Public can read attachments
drop policy if exists "attachments_public_select" on storage.objects;
create policy "attachments_public_select" on storage.objects
  for select
  using (bucket_id = 'attachments');

-- 2. Staff with content.manage or roles.admin can upload attachments
drop policy if exists "attachments_staff_insert" on storage.objects;
create policy "attachments_staff_insert" on storage.objects
  for insert
  with check (
    bucket_id = 'attachments'
    and (
      public.has_capability('content.manage')
      or public.has_capability('roles.admin')
    )
  );

-- 3. Staff with content.manage or roles.admin can update attachments
drop policy if exists "attachments_staff_update" on storage.objects;
create policy "attachments_staff_update" on storage.objects
  for update
  using (
    bucket_id = 'attachments'
    and (
      public.has_capability('content.manage')
      or public.has_capability('roles.admin')
    )
  );

-- 4. Staff with content.manage or roles.admin can delete attachments
drop policy if exists "attachments_staff_delete" on storage.objects;
create policy "attachments_staff_delete" on storage.objects
  for delete
  using (
    bucket_id = 'attachments'
    and (
      public.has_capability('content.manage')
      or public.has_capability('roles.admin')
    )
  );
