-- Migration: Create ticket_orders table and policies for Garden Walk & Event Ticketing
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
  status text not null default 'confirmed' check (status in ('confirmed', 'checked_in', 'cancelled', 'refunded')),
  notes text,
  checked_in_at timestamptz,
  checked_in_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexing
create index if not exists idx_ticket_orders_reference on public.ticket_orders(order_reference);
create index if not exists idx_ticket_orders_event_id on public.ticket_orders(event_id);
create index if not exists idx_ticket_orders_email on public.ticket_orders(purchaser_email);
create index if not exists idx_ticket_orders_status on public.ticket_orders(status);
create index if not exists idx_ticket_orders_created on public.ticket_orders(created_at desc);

-- Enable Row Level Security
alter table public.ticket_orders enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Public and guests can insert ticket orders" on public.ticket_orders;
drop policy if exists "Staff can view all ticket orders" on public.ticket_orders;
drop policy if exists "Staff can update ticket orders" on public.ticket_orders;
drop policy if exists "Staff can delete ticket orders" on public.ticket_orders;

-- 1. Anyone (public or guest) can submit an advance ticket order
create policy "Public and guests can insert ticket orders"
  on public.ticket_orders
  for insert
  with check (
    ticket_quantity > 0 and ticket_quantity <= 50
    and status = 'confirmed'
    and total_amount_cents = (ticket_quantity * unit_price_cents)
  );

-- 2. Staff with event management, admin, editor, or treasurer roles can view all ticket orders
create policy "Staff can view all ticket orders"
  on public.ticket_orders
  for select
  using (
    public.has_capability('events.manage')
    or public.has_role('admin')
    or public.has_role('treasurer')
    or public.has_role('editor')
  );

-- 3. Staff can update ticket orders (e.g. check-in attendee, update status or notes)
create policy "Staff can update ticket orders"
  on public.ticket_orders
  for update
  using (
    public.has_capability('events.manage')
    or public.has_role('admin')
    or public.has_role('treasurer')
    or public.has_role('editor')
  );

-- 4. Only admin and treasurer can delete ticket orders
create policy "Staff can delete ticket orders"
  on public.ticket_orders
  for delete
  using (
    public.has_role('admin')
    or public.has_role('treasurer')
  );

-- Table Grants
grant select, insert on table public.ticket_orders to anon;
grant all on table public.ticket_orders to authenticated;
grant all on table public.ticket_orders to service_role;

-- Seed initial authentic simulated ticket orders for the 2027 Garden Walk
insert into public.ticket_orders (
  id,
  order_reference,
  event_id,
  purchaser_name,
  purchaser_email,
  purchaser_phone,
  ticket_quantity,
  unit_price_cents,
  total_amount_cents,
  status,
  notes,
  created_at
)
values
  (
    'e1111111-0000-0000-0000-000000000001',
    'SDGC-TKT-2027-A8B9C1',
    'ebb22222-2222-2222-2222-222222222222',
    'Eleanor Vance',
    'eleanor.vance@example.com',
    '(269) 555-0144',
    2,
    2000,
    4000,
    'confirmed',
    'Advance pass reservation for 2027 Garden Walk tour.',
    now() - interval '3 days'
  ),
  (
    'e1111111-0000-0000-0000-000000000002',
    'SDGC-TKT-2027-D2E3F4',
    'ebb22222-2222-2222-2222-222222222222',
    'Marcus Holloway',
    'marcus.holloway@example.com',
    '(269) 555-0182',
    4,
    2000,
    8000,
    'checked_in',
    'Tour group checked in at Saugatuck City Hall table.',
    now() - interval '2 days'
  ),
  (
    'e1111111-0000-0000-0000-000000000003',
    'SDGC-TKT-2027-G5H6J7',
    'ebb22222-2222-2222-2222-222222222222',
    'Sophia Martinez',
    'sophia.martinez@example.com',
    '(616) 555-0199',
    1,
    2000,
    2000,
    'confirmed',
    'Will attend self-guided morning tour.',
    now() - interval '1 day'
  )
on conflict (order_reference) do update set
  purchaser_name = excluded.purchaser_name,
  purchaser_email = excluded.purchaser_email,
  ticket_quantity = excluded.ticket_quantity,
  total_amount_cents = excluded.total_amount_cents,
  status = excluded.status;
