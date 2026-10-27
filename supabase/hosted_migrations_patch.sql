-- ==============================================================================
-- Saugatuck Douglas Garden Club (SDGC) — Hosted Database Migration Patch
-- Run this script in the Supabase Dashboard SQL Editor for your hosted project:
-- Project: puexcsrptqlkrlhgbpql (https://sdgc.redwan.work)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Create or Enhance ticket_orders Table
-- ------------------------------------------------------------------------------
create table if not exists public.ticket_orders (
  id uuid primary key default gen_random_uuid(),
  order_reference text not null unique,
  event_id uuid references public.events(id) on delete set null,
  purchaser_name text not null,
  purchaser_email text not null,
  purchaser_phone text,
  ticket_quantity integer not null check (ticket_quantity > 0 and ticket_quantity <= 50),
  unit_price_cents integer not null default 1500 check (unit_price_cents >= 0),
  total_amount_cents integer not null check (total_amount_cents >= 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'checked_in', 'cancelled', 'refunded')),
  notes text,
  stripe_session_id text,
  stripe_payment_intent_id text,
  checked_in_at timestamptz,
  checked_in_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enhance ticket_orders with tiered counts and coupon details
alter table public.ticket_orders add column if not exists student_quantity integer not null default 0 check (student_quantity >= 0);
alter table public.ticket_orders add column if not exists child_quantity integer not null default 0 check (child_quantity >= 0);
alter table public.ticket_orders add column if not exists coupon_code text;
alter table public.ticket_orders add column if not exists discount_amount_cents integer not null default 0 check (discount_amount_cents >= 0);
alter table public.ticket_orders add column if not exists stripe_session_id text;
alter table public.ticket_orders add column if not exists stripe_payment_intent_id text;

alter table public.ticket_orders drop constraint if exists ticket_orders_status_check;
alter table public.ticket_orders add constraint ticket_orders_status_check check (status in ('pending', 'confirmed', 'checked_in', 'cancelled', 'refunded'));
alter table public.ticket_orders alter column status set default 'pending';

-- Indexes for fast lookup
create index if not exists idx_ticket_orders_reference on public.ticket_orders(order_reference);
create index if not exists idx_ticket_orders_event_id on public.ticket_orders(event_id);
create index if not exists idx_ticket_orders_email on public.ticket_orders(purchaser_email);
create index if not exists idx_ticket_orders_status on public.ticket_orders(status);
create index if not exists idx_ticket_orders_created on public.ticket_orders(created_at desc);
create index if not exists idx_ticket_orders_stripe_session on public.ticket_orders(stripe_session_id);

alter table public.ticket_orders enable row level security;

-- Policies for ticket_orders
drop policy if exists "Public and guests can insert ticket orders" on public.ticket_orders;
create policy "Public and guests can insert ticket orders"
  on public.ticket_orders
  for insert
  with check (
    ticket_quantity > 0 and ticket_quantity <= 50
    and status in ('pending', 'confirmed')
  );

drop policy if exists "Purchasers can view ticket orders by reference" on public.ticket_orders;
create policy "Purchasers can view ticket orders by reference"
  on public.ticket_orders
  for select
  using (true);

drop policy if exists "Staff can view all ticket orders" on public.ticket_orders;
create policy "Staff can view all ticket orders"
  on public.ticket_orders
  for select
  using (
    public.has_capability('events.manage')
    or public.has_role('admin')
    or public.has_role('treasurer')
    or public.has_role('editor')
  );

drop policy if exists "Staff can update ticket orders" on public.ticket_orders;
create policy "Staff can update ticket orders"
  on public.ticket_orders
  for update
  using (
    public.has_capability('events.manage')
    or public.has_role('admin')
    or public.has_role('treasurer')
    or public.has_role('editor')
  );

drop policy if exists "Staff can delete ticket orders" on public.ticket_orders;
create policy "Staff can delete ticket orders"
  on public.ticket_orders
  for delete
  using (
    public.has_role('admin')
    or public.has_role('treasurer')
  );

grant select, insert, update on table public.ticket_orders to anon;
grant all on table public.ticket_orders to authenticated;
grant all on table public.ticket_orders to service_role;

-- ------------------------------------------------------------------------------
-- 2. Enhance Events with Ticketing Controls & Tiered Pricing
-- ------------------------------------------------------------------------------
alter table public.events add column if not exists requires_tickets boolean not null default false;
alter table public.events add column if not exists ticket_price_cents integer default 1500 check (ticket_price_cents is null or ticket_price_cents >= 0);
alter table public.events add column if not exists student_price_cents integer default 1000 check (student_price_cents is null or student_price_cents >= 0);
alter table public.events add column if not exists child_price_cents integer default 0 check (child_price_cents is null or child_price_cents >= 0);

update public.events
set requires_tickets = true,
    ticket_price_cents = coalesce(ticket_price_cents, 1500),
    student_price_cents = coalesce(student_price_cents, 1000),
    child_price_cents = coalesce(child_price_cents, 0)
where ticket_url is not null or slug like '%garden-walk%';

update public.events
set ticket_price_cents = 1500
where slug like '%garden-walk%';

-- ------------------------------------------------------------------------------
-- 3. Create Event Coupons Table
-- ------------------------------------------------------------------------------
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

alter table public.event_coupons enable row level security;

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

-- Seed default promotional coupons
insert into public.event_coupons (code, description, discount_type, discount_value, is_active)
values 
  ('GARDEN20', '20% off advance admissions', 'percentage', 20, true),
  ('EARLYBIRD', '$5.00 off community admissions', 'fixed_amount', 500, true),
  ('WELCOME10', '10% welcome discount', 'percentage', 10, true)
on conflict (code) do nothing;

-- ------------------------------------------------------------------------------
-- 4. Create Disbursements Table (Treasury & Accounting)
-- ------------------------------------------------------------------------------
create table if not exists public.disbursements (
  id uuid primary key default gen_random_uuid(),
  amount_cents integer not null check (amount_cents > 0),
  category text not null check (length(category) > 0),
  payee text not null check (length(payee) > 0),
  description text not null,
  reference_number text,
  disbursed_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists disbursements_disbursed_at_idx on public.disbursements (disbursed_at desc);
create index if not exists disbursements_category_idx on public.disbursements (category);

alter table public.disbursements enable row level security;

drop policy if exists "Staff with dues.reconcile can select disbursements" on public.disbursements;
create policy "Staff with dues.reconcile can select disbursements"
  on public.disbursements
  for select
  using (
    public.has_capability('dues.reconcile')
    or public.has_role('admin')
    or public.has_role('treasurer')
  );

drop policy if exists "Staff with dues.reconcile can insert disbursements" on public.disbursements;
create policy "Staff with dues.reconcile can insert disbursements"
  on public.disbursements
  for insert
  with check (
    public.has_capability('dues.reconcile')
    or public.has_role('admin')
    or public.has_role('treasurer')
  );

drop policy if exists "Staff with dues.reconcile can update disbursements" on public.disbursements;
create policy "Staff with dues.reconcile can update disbursements"
  on public.disbursements
  for update
  using (
    public.has_capability('dues.reconcile')
    or public.has_role('admin')
    or public.has_role('treasurer')
  );

drop policy if exists "Staff with dues.reconcile can delete disbursements" on public.disbursements;
create policy "Staff with dues.reconcile can delete disbursements"
  on public.disbursements
  for delete
  using (
    public.has_capability('dues.reconcile')
    or public.has_role('admin')
    or public.has_role('treasurer')
  );

grant select, insert, update, delete on public.disbursements to authenticated;

-- ------------------------------------------------------------------------------
-- 5. Reload PostgREST Schema Cache Immediately
-- ------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
