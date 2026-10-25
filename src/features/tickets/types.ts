export type TicketOrderStatus = "confirmed" | "checked_in" | "cancelled" | "refunded";

export interface TicketEvent {
  id: string;
  slug: string;
  title: string;
  date: string;
  time: string;
  location: string;
  advancePriceCents: number;
  dayOfPriceCents: number;
  description: string;
}

export interface TicketCheckoutInput {
  eventId: string;
  quantity: number;
  purchaserName: string;
  purchaserEmail: string;
  purchaserPhone?: string;
  notes?: string;
}

export interface TicketOrder {
  orderId: string;
  orderReference: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  ticketQuantity: number;
  unitPriceCents: number;
  totalCents: number;
  purchaserName: string;
  purchaserEmail: string;
  purchaserPhone: string | null;
  status: TicketOrderStatus | "simulated_reservation";
  notes?: string | null;
  checkedInAt?: string | null;
  checkedInBy?: string | null;
  createdAt: string;
  checkInInstructions: string;
}

export interface TicketOrderListItem {
  id: string;
  orderReference: string;
  eventId: string | null;
  eventTitle: string;
  eventSlug: string;
  purchaserName: string;
  purchaserEmail: string;
  purchaserPhone: string | null;
  ticketQuantity: number;
  unitPriceCents: number;
  totalAmountCents: number;
  status: TicketOrderStatus;
  notes: string | null;
  checkedInAt: string | null;
  checkedInByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketStats {
  totalOrders: number;
  totalTicketsSold: number;
  totalRevenueCents: number;
  checkedInCount: number;
  pendingCount: number;
}

export interface TicketFilterInput {
  eventId?: string;
  status?: string;
  query?: string;
}
