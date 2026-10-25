import type { Metadata } from "next";
import { requireCapability } from "@/features/auth/authorization";
import { listAdminTicketOrdersAction } from "@/features/tickets/actions";
import { AdminTickets } from "@/features/admin/components/admin-tickets";

export const metadata: Metadata = {
  title: "Garden Walk & Tickets | Admin Portal",
  description:
    "Manage advance tour admissions, check in guests at welcome tables, and track Garden Walk ticket revenues.",
};

export default async function AdminTicketsPage() {
  await requireCapability("events.manage", "/admin/tickets");
  const { orders, stats, events } = await listAdminTicketOrdersAction();

  return <AdminTickets initialOrders={orders} initialStats={stats} initialEvents={events} />;
}
