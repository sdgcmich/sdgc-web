-- Add attachments column to public.notices table for attaching PDFs, docs, images, etc.
alter table public.notices
add column if not exists attachments jsonb not null default '[]'::jsonb;

comment on column public.notices.attachments is 'Array of attachment objects containing name, url, type, sizeBytes';
