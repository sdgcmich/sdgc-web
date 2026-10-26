-- Migration: Add pending status and Stripe tracking columns to ticket_orders
alter table public.ticket_orders drop constraint if exists ticket_orders_status_check;
alter table public.ticket_orders add constraint ticket_orders_status_check check (status in ('pending', 'confirmed', 'checked_in', 'cancelled', 'refunded'));
alter table public.ticket_orders alter column status set default 'pending';

alter table public.ticket_orders add column if not exists stripe_session_id text;
alter table public.ticket_orders add column if not exists stripe_payment_intent_id text;

create index if not exists idx_ticket_orders_stripe_session on public.ticket_orders(stripe_session_id);
