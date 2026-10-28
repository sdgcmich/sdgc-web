# Remediation Package R9 — Database Security Hardening, Coupon & Gift Pass System, and Payment Experience Alignment

**Executed:** 2026-10-28  
**Remediation Scope:** Database Schema Reset & RLS Policy Hardening, Integration Test Dynamic Environment Binding, Cloudflare R2 / Resend Cleanup, Treasury Dues Interface Refinement, Admin Coupon & Gift Voucher Management, Public Gift Pass Purchase Flow, Multi-Provider Payment Gateway Selection  
**Authorizing User Requests:** Issues 1 through 5 — Comprehensive audit, security hardening, and production readiness handover.

---

## 1. Executive Summary

This remediation package delivers the complete hardening and feature enhancements required to prepare the Saugatuck Douglas Garden Club (SDGC) platform for production client handover:

1. **Database Schema Reset & RLS Security Hardening (Issues 1 & 3)**:
   - Validated that the direct public `SELECT` on `ticket_orders` represented an anonymous PII exposure risk (allowing unauthenticated enumeration of purchaser names, emails, and ticket references).
   - Created reproducible migration `20261028040225_security_hardening_and_gift_coupons.sql` and updated `supabase/hosted_migrations_patch.sql`.
   - Revoked `SELECT` privileges from `anon` on `public.ticket_orders` and `public.event_coupons`.
   - Removed overly permissive `using (true)` policies for public reads; lookup operations (`verifyTicketAction`, `getTicketOrderByReferenceAction`, `validateCouponCodeAction`) now run exclusively through controlled server-side queries via `createAdminClient()`. Staff endpoints continue to enforce fine-grained role capabilities (`events.manage`, `admin`, `treasurer`).
   - Executed clean schema drop and reset via `npm run db:reset` against the local Docker Supabase stack, followed by type generation via `npm run db:types`.

2. **Dynamic Environment Binding for Integration Tests (Issue 2)**:
   - Updated `tests/integration/setup.ts` to dynamically resolve `process.env.SUPABASE_URL` and `.env.local` without hardcoded loopback assumptions.
   - Updated `scripts/provision-local.mjs` to validate URL protocols flexibly rather than blocking non-loopback host configurations.

3. **Storage & Messaging Cleanup (Issue 4)**:
   - Deprecated and removed Cloudflare R2/S3 storage drivers (`@aws-sdk/client-s3`) and related domain configurations from `next.config.ts`. Cloudinary is now the sole media asset provider.
   - Removed direct external `fetch("https://api.resend.com/emails")` calls from `src/features/contact/notifications.ts`. Contact messages are stored directly in Supabase and captured in development via local Mailpit SMTP, in alignment with future Supabase SMTP integration.

4. **Treasury Dues Simplification (Issue 5 Part 1)**:
   - Removed manual withdrawal/disbursement tracking from `/admin/dues` and `admin-dues.tsx`. As all electronic ticket and dues payments flow directly through Stripe, disbursements are managed within the official Stripe dashboard rather than duplicating ledger entries on-site.
   - Preserved check payment reconciliation for in-person cash/check dues.

5. **Admin Coupon & Gift Pass Management (Issue 5 Part 2)**:
   - Created `/admin/coupons` and `src/features/admin/components/admin-coupons.tsx`.
   - Added administrative controls to create standard promotional codes and gift vouchers with predefined balances ($10, $20, $30, $50, or custom amounts).
   - Added capabilities to view redemption status, toggle active states, and delete vouchers.
   - Added "Coupons & Gift Passes" navigation to `admin-shell.tsx`.

6. **Public Gift Pass Flow & Payment Gateway Selection (Issue 5 Part 3)**:
   - Created public `/gift` route (`src/app/(public)/gift/page.tsx`) with `GiftPassCard` component, allowing patrons to purchase and gift Garden Walk passes ($15, $30, $50, or custom) with personal recipient greetings.
   - Implemented an explicit payment method selection step (Stripe Checkout vs Offline Check/Cash) across both ticket checkout and gift pass purchase flows, paving the way for seamless addition of future payment providers.
   - Enhanced Stripe webhook handler to fulfill gift coupons upon completed checkout sessions.
   - Linked `/gift` in `site-footer.tsx` and registered the route in `sitemap.ts`.

---

## 2. Changes by Component

### A. Database Migrations & Security

- **Migration File**: `supabase/migrations/20261028040225_security_hardening_and_gift_coupons.sql`
- **Hosted Patch**: `supabase/hosted_migrations_patch.sql`
- **TypeScript Types**: `src/types/database.ts`
- **RLS Rules**:
  - Dropped public `allow anon select on ticket_orders` and `allow public read of event coupons`.
  - Revoked `SELECT` on `ticket_orders` and `event_coupons` from `anon`.
  - Added gift fields to `event_coupons`: `is_gift`, `recipient_name`, `recipient_email`, `purchaser_name`, `purchaser_email`, `gift_message`, `order_reference`, `stripe_session_id`.

### B. Admin Coupon & Dues Interfaces

- `src/app/(admin)/admin/coupons/page.tsx`: Server component route with RBAC capability checks (`events.manage`, `admin`).
- `src/features/admin/components/admin-coupons.tsx`: Full-featured management UI with summary metric cards, filterable voucher table, voucher activation toggles, and modal dialog to generate gift passes or promo codes.
- `src/app/(admin)/admin/dues/page.tsx` & `src/features/admin/components/admin-dues.tsx`: Removed withdrawals/disbursements UI. Streamlined dues overview into a 3-card revenue summary and check reconciliation table.
- `src/features/admin/components/admin-shell.tsx`: Added navigation entry for Coupons & Gift Passes.

### C. Public Gift Passes & Checkout

- `src/app/(public)/gift/page.tsx`: Publicly accessible gift pass purchase page.
- `src/features/tickets/components/gift-pass-card.tsx`: Tiered gift voucher selector ($15, $30, $50, custom), recipient details form, and payment method selector.
- `src/features/tickets/components/tickets-checkout.tsx`: Added Step 4 Payment Provider selector (Stripe Checkout vs In-Person Check), gift pass promotion banner, and coupon redemption code input.
- `src/features/membership/components/dues-card.tsx`: Added clear Stripe payment method badges.
- `src/features/tickets/actions.ts`: Added `purchaseGiftCouponAction`, `listAdminCouponsAction`, `createCouponAction`, `toggleCouponActiveAction`, `deleteCouponAction`.
- `src/features/payments/stripe-provider.ts`: Added `createGiftCouponCheckoutSession`.
- `src/app/api/webhooks/stripe/route.ts`: Handled `type === "gift_coupon"` webhook events to activate purchased gift vouchers.
- `src/components/layout/site-footer.tsx` & `src/app/sitemap.ts`: Linked `/gift` and `/tickets-checkout`.

### D. Infrastructure & Dependency Cleanup

- `src/lib/storage/provider.ts`: Removed Cloudflare R2 provider; unified on Cloudinary.
- `next.config.ts`: Removed R2 hostname permissions.
- `package.json`: Removed `@aws-sdk/client-s3`.
- `src/features/contact/notifications.ts`: Removed external Resend API call; retained Supabase storage and local Mailpit testing.
- `tests/integration/setup.ts` & `scripts/provision-local.mjs`: Added dynamic env resolution and protocol validation.

---

## 3. Verification & Test Evidence

All checks executed against local Docker Supabase stack (`http://127.0.0.1:54321`):

```bash
# 1. Targeted Integration Test (RLS Hardening & Gift Passes)
npx vitest run --config vitest.integration.config.ts tests/integration/remediation-r7-security-and-gifts.test.ts
# Output:
# ✓ tests/integration/remediation-r7-security-and-gifts.test.ts (7 tests) 154ms
#   ✓ Anon client is denied direct SELECT on public.ticket_orders (RLS 403 / empty)
#   ✓ Service role client can query ticket_orders for backend processing
#   ✓ Anon client is denied direct SELECT on public.event_coupons
#   ✓ Admin client can create and retrieve event_coupons
#   ✓ validateCouponCodeAction works correctly via server action without exposing public table
#   ✓ purchaseGiftCouponAction creates an unredeemed gift coupon record
#   ✓ Ticket verification works via server action without direct anon table access
# Tests: 7 passed (7)

# 2. Comprehensive Quality Suite (Biome Lint, Prettier, TypeScript, Unit Tests)
npm run check
# Output:
# Checked 253 files in 1038ms. No errors or warnings found.
# Running Next.js type generation and TS compiler...
# Total Tests: 19 test files passed (131 tests)

# 3. Production Compilation Build
npm run build
# Output:
# Compiled successfully in 14.8s
# 49/49 App Router routes compiled cleanly with 0 type errors or missing dependencies.
```
