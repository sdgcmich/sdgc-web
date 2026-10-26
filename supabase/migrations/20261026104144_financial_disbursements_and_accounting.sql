-- Migration: financial_disbursements_and_accounting
-- Creates the disbursements / withdrawals accounting ledger for club treasury management.

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

-- Policies: Only authorized financial staff (treasurer, admin, dues.reconcile) can manage disbursements
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
