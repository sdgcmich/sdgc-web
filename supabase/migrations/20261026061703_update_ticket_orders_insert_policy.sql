-- Migration: Update ticket_orders insert policy to permit pending status and public reference lookup
drop policy if exists "Public and guests can insert ticket orders" on public.ticket_orders;

create policy "Public and guests can insert ticket orders"
  on public.ticket_orders
  for insert
  with check (
    ticket_quantity > 0 and ticket_quantity <= 50
    and status in ('pending', 'confirmed')
    and total_amount_cents = (ticket_quantity * unit_price_cents)
  );

-- Allow purchasers to query their own order by order_reference
drop policy if exists "Purchasers can view ticket orders by reference" on public.ticket_orders;

create policy "Purchasers can view ticket orders by reference"
  on public.ticket_orders
  for select
  using (true);
