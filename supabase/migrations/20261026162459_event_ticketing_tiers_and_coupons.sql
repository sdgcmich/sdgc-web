-- Migration: event_ticketing_tiers_and_coupons
-- Adds ticketing configuration (requires_tickets, pricing tiers) to events,
-- creates event_coupons table for coupon and promo code management,
-- and enhances ticket_orders with tier breakdowns and coupon tracking.

-- 1. Enhance events table with ticket requirement and tier pricing
alter table public.events add column if not exists requires_tickets boolean not null default false;
alter table public.events add column if not exists ticket_price_cents integer default 1500 check (ticket_price_cents is null or ticket_price_cents >= 0);
alter table public.events add column if not exists student_price_cents integer default 1000 check (student_price_cents is null or student_price_cents >= 0);
alter table public.events add column if not exists child_price_cents integer default 0 check (child_price_cents is null or child_price_cents >= 0);

-- Backfill existing events that have a ticket_url or garden-walk slug
update public.events
set requires_tickets = true,
    ticket_price_cents = coalesce(ticket_price_cents, 1500),
    student_price_cents = coalesce(student_price_cents, 1000),
    child_price_cents = coalesce(child_price_cents, 0)
where ticket_url is not null or slug like '%garden-walk%';

update public.events
set ticket_price_cents = 1500
where slug like '%garden-walk%';

-- 2. Create event_coupons table
create table if not exists public.event_coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null default 'percentage' check (discount_type in ('percentage', 'fixed_amount')),
  discount_value integer not null check (discount_value > 0),
  event_id uuid references public.events(id) on delete cascade,
  valid_from timestamptz,
  valid_until timestamptz,
  max_uses integer,
  times_used integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_event_coupons_code on public.event_coupons(code);
create index if not exists idx_event_coupons_event_id on public.event_coupons(event_id);
create index if not exists idx_event_coupons_active on public.event_coupons(is_active);

-- Enable RLS
alter table public.event_coupons enable row level security;

-- 2.1 Allow public to validate active coupons
drop policy if exists "Public can view active coupons" on public.event_coupons;
create policy "Public can view active coupons"
  on public.event_coupons
  for select
  using (
    is_active = true
    and (valid_from is null or valid_from <= now())
    and (valid_until is null or valid_until >= now())
    and (max_uses is null or times_used < max_uses)
  );

-- 2.2 Staff can view all coupons
drop policy if exists "Staff can view all coupons" on public.event_coupons;
create policy "Staff can view all coupons"
  on public.event_coupons
  for select
  using (
    public.has_capability('events.manage')
    or public.has_role('admin')
    or public.has_role('treasurer')
    or public.has_role('editor')
  );

-- 2.3 Staff can insert, update, and delete coupons
drop policy if exists "Staff can insert coupons" on public.event_coupons;
create policy "Staff can insert coupons"
  on public.event_coupons
  for insert
  with check (
    public.has_capability('events.manage')
    or public.has_role('admin')
    or public.has_role('treasurer')
  );

drop policy if exists "Staff can update coupons" on public.event_coupons;
create policy "Staff can update coupons"
  on public.event_coupons
  for update
  using (
    public.has_capability('events.manage')
    or public.has_role('admin')
    or public.has_role('treasurer')
  );

drop policy if exists "Staff can delete coupons" on public.event_coupons;
create policy "Staff can delete coupons"
  on public.event_coupons
  for delete
  using (
    public.has_role('admin')
    or public.has_role('treasurer')
  );

grant select on table public.event_coupons to anon;
grant all on table public.event_coupons to authenticated;
grant all on table public.event_coupons to service_role;

-- 3. Enhance ticket_orders with tiered counts and coupon details
alter table public.ticket_orders add column if not exists student_quantity integer not null default 0 check (student_quantity >= 0);
alter table public.ticket_orders add column if not exists child_quantity integer not null default 0 check (child_quantity >= 0);
alter table public.ticket_orders add column if not exists coupon_code text;
alter table public.ticket_orders add column if not exists discount_amount_cents integer not null default 0 check (discount_amount_cents >= 0);

-- Update ticket_orders insert policy to support discounts & tiers
drop policy if exists "Public and guests can insert ticket orders" on public.ticket_orders;

create policy "Public and guests can insert ticket orders"
  on public.ticket_orders
  for insert
  with check (
    ticket_quantity > 0 and ticket_quantity <= 50
    and status in ('pending', 'confirmed')
    and total_amount_cents >= 0
  );

-- Seed initial popular coupons
insert into public.event_coupons (code, description, discount_type, discount_value, is_active)
values
  ('GARDEN20', '20% off Garden Walk and Club Event admissions', 'percentage', 20, true),
  ('EARLYBIRD', '$5.00 off Advance Event Admission', 'fixed_amount', 500, true),
  ('WELCOME10', '10% Community Welcome Discount', 'percentage', 10, true)
on conflict (code) do nothing;
