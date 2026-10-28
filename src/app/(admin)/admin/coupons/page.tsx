import type { Metadata } from "next";
import { requireCapability } from "@/features/auth/authorization";
import { getTicketEvents, listAdminCouponsAction } from "@/features/tickets/actions";
import { AdminCoupons } from "@/features/admin/components/admin-coupons";

export const metadata: Metadata = {
  title: "Coupon & Gift Pass Management | Admin Portal",
  description:
    "Configure promotional discount coupons, advance gift passes, and monitor ticket redemption limits.",
};

export default async function AdminCouponsPage() {
  await requireCapability(["events.manage", "dues.reconcile"], "/admin/coupons");
  const [couponsRes, events] = await Promise.all([listAdminCouponsAction(), getTicketEvents()]);

  return (
    <AdminCoupons
      initialCoupons={couponsRes.success && couponsRes.data ? couponsRes.data : []}
      events={events}
    />
  );
}
