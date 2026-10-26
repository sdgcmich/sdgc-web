import type { Metadata } from "next";
import { requireCapability } from "@/features/auth/authorization";
import { listAdminTicketOrdersAction, listAdminCouponsAction } from "@/features/tickets/actions";
import { AdminTickets } from "@/features/admin/components/admin-tickets";

export const metadata: Metadata = {
  title: "Garden Walk & Tickets | Admin Portal",
  description:
    "Manage advance tour admissions, check in guests at welcome tables, and track Garden Walk ticket revenues.",
};

export default async function AdminTicketsPage() {
  await requireCapability(["events.manage", "dues.reconcile"], "/admin/tickets");
  const [{ orders, stats, events }, couponsRes] = await Promise.all([
    listAdminTicketOrdersAction(),
    listAdminCouponsAction(),
  ]);

  return (
    <AdminTickets
      initialOrders={orders}
      initialStats={stats}
      initialEvents={events}
      initialCoupons={couponsRes.success && couponsRes.data ? couponsRes.data : []}
    />
  );
}
