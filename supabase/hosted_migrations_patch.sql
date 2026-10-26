-- ==============================================================================
-- Saugatuck Douglas Garden Club (SDGC) — Hosted Database Migration Patch
-- Run this script in the Supabase Dashboard SQL Editor for your hosted project
-- (e.g. sdgc.redwan.work) to synchronize ticket_orders and reload schema cache.
-- ==============================================================================

-- 1. Create ticket_orders table if it does not already exist
create table if not exists public.ticket_orders (
  id uuid primary key default gen_random_uuid(),
  order_reference text not null unique,
  event_id uuid references public.events(id) on delete set null,
  purchaser_name text not null,
  purchaser_email text not null,
  purchaser_phone text,
  ticket_quantity integer not null check (ticket_quantity > 0 and ticket_quantity <= 50),
  unit_price_cents integer not null default 2000 check (unit_price_cents >= 0),
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

-- 2. Add columns and constraints if table previously existed without them
alter table public.ticket_orders add column if not exists stripe_session_id text;
alter table public.ticket_orders add column if not exists stripe_payment_intent_id text;

alter table public.ticket_orders drop constraint if exists ticket_orders_status_check;
alter table public.ticket_orders add constraint ticket_orders_status_check check (status in ('pending', 'confirmed', 'checked_in', 'cancelled', 'refunded'));
alter table public.ticket_orders alter column status set default 'pending';

-- 3. Indexes for fast lookup
create index if not exists idx_ticket_orders_reference on public.ticket_orders(order_reference);
create index if not exists idx_ticket_orders_event_id on public.ticket_orders(event_id);
create index if not exists idx_ticket_orders_email on public.ticket_orders(purchaser_email);
create index if not exists idx_ticket_orders_status on public.ticket_orders(status);
create index if not exists idx_ticket_orders_created on public.ticket_orders(created_at desc);
create index if not exists idx_ticket_orders_stripe_session on public.ticket_orders(stripe_session_id);

-- 4. Enable Row Level Security (RLS)
alter table public.ticket_orders enable row level security;

-- 5. Drop existing policies to ensure idempotency
drop policy if exists "Public and guests can insert ticket orders" on public.ticket_orders;
drop policy if exists "Purchasers can view ticket orders by reference" on public.ticket_orders;
drop policy if exists "Staff can view all ticket orders" on public.ticket_orders;
drop policy if exists "Staff can update ticket orders" on public.ticket_orders;
drop policy if exists "Staff can delete ticket orders" on public.ticket_orders;

-- Public and guest advance order creation (supports both pending and confirmed)
create policy "Public and guests can insert ticket orders"
  on public.ticket_orders
  for insert
  with check (
    ticket_quantity > 0 and ticket_quantity <= 50
    and status in ('pending', 'confirmed')
    and total_amount_cents = (ticket_quantity * unit_price_cents)
  );

-- Public order lookup by reference for post-checkout and receipt views
create policy "Purchasers can view ticket orders by reference"
  on public.ticket_orders
  for select
  using (true);

-- Staff administration policies
create policy "Staff can view all ticket orders"
  on public.ticket_orders
  for select
  using (
    public.has_capability('events.manage')
    or public.has_role('admin')
    or public.has_role('treasurer')
    or public.has_role('editor')
  );

create policy "Staff can update ticket orders"
  on public.ticket_orders
  for update
  using (
    public.has_capability('events.manage')
    or public.has_role('admin')
    or public.has_role('treasurer')
    or public.has_role('editor')
  );

create policy "Staff can delete ticket orders"
  on public.ticket_orders
  for delete
  using (
    public.has_role('admin')
    or public.has_role('treasurer')
  );

-- 6. Table Grants
grant select, insert on table public.ticket_orders to anon;
grant all on table public.ticket_orders to authenticated;
grant all on table public.ticket_orders to service_role;

-- 7. Reload PostgREST Schema Cache Immediately
NOTIFY pgrst, 'reload schema';
