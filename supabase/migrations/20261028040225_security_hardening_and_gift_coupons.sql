-- Migration: Security hardening for ticket orders and event coupons, and gift coupon support
-- 1. Security Hardening: Revoke public SELECT on ticket_orders to prevent attendee PII enumeration
drop policy if exists "Purchasers can view ticket orders by reference" on public.ticket_orders;
revoke select on table public.ticket_orders from anon;

-- Note: Staff with events.manage, admin, treasurer, or editor roles retain full SELECT on ticket_orders
-- Order lookup and ticket verification for purchasers are performed securely via Server Actions using createAdminClient.

-- 2. Security Hardening: Revoke public SELECT on event_coupons to prevent promo code enumeration
drop policy if exists "Public can view active coupons" on public.event_coupons;
revoke select on table public.event_coupons from anon;

-- Note: Coupon validation during checkout is handled securely server-side via Server Actions using createAdminClient.

-- 3. Extend event_coupons to support purchasing & gifting coupons/vouchers
alter table public.event_coupons add column if not exists is_gift boolean not null default false;
alter table public.event_coupons add column if not exists recipient_name text;
alter table public.event_coupons add column if not exists recipient_email text;
alter table public.event_coupons add column if not exists purchaser_name text;
alter table public.event_coupons add column if not exists purchaser_email text;
alter table public.event_coupons add column if not exists gift_message text;
alter table public.event_coupons add column if not exists order_reference text;
alter table public.event_coupons add column if not exists stripe_session_id text;

create index if not exists idx_event_coupons_recipient on public.event_coupons(recipient_email);
create index if not exists idx_event_coupons_order_reference on public.event_coupons(order_reference);
create index if not exists idx_event_coupons_is_gift on public.event_coupons(is_gift);
