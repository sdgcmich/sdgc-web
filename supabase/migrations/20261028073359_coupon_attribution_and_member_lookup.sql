-- Migration: coupon_attribution_and_member_lookup
-- 1. Adds created_by attribution column to event_coupons
-- 2. Adds secure member credential lookup function resolving UUID prefixes and usernames without type mismatches

-- 1. Add created_by column to event_coupons
alter table public.event_coupons
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

create index if not exists idx_event_coupons_created_by
  on public.event_coupons(created_by);

-- 2. Function to look up member credentials safely by UUID prefix, username, or full name
create or replace function public.lookup_member_credential(lookup_code text)
returns table (
  id uuid,
  username text,
  first_name text,
  last_name text,
  city text,
  state text,
  is_master_gardener boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.username,
    p.first_name,
    p.last_name,
    p.city,
    p.state,
    p.is_master_gardener,
    p.created_at
  from public.profiles p
  where
    -- Match by UUID prefix (e.g. from SDGC-MBR-A2017717 -> a2017717)
    p.id::text ilike (lower(trim(lookup_code)) || '%')
    -- Or match username (with or without leading @)
    or lower(p.username) = lower(trim(lookup_code))
    or lower(p.username) = lower(trim(replace(lookup_code, '@', '')))
    -- Or match full name
    or lower(trim(p.first_name || ' ' || p.last_name)) = lower(trim(lookup_code))
  limit 1;
$$;

grant execute on function public.lookup_member_credential(text) to anon, authenticated, service_role;
