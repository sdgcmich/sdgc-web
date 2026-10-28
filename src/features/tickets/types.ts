export type TicketOrderStatus = "pending" | "confirmed" | "checked_in" | "cancelled" | "refunded";

export interface TicketEvent {
  id: string;
  slug: string;
  title: string;
  date: string;
  time: string;
  location: string;
  advancePriceCents: number;
  dayOfPriceCents: number;
  studentPriceCents: number;
  childPriceCents: number;
  requiresTickets: boolean;
  startsAt: string;
  description: string;
}

export interface TicketCheckoutInput {
  eventId: string;
  quantity: number;
  studentQuantity?: number;
  childQuantity?: number;
  couponCode?: string;
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
  studentQuantity?: number;
  childQuantity?: number;
  unitPriceCents: number;
  totalCents: number;
  discountAmountCents?: number;
  couponCode?: string | null;
  purchaserName: string;
  purchaserEmail: string;
  purchaserPhone: string | null;
  status: TicketOrderStatus | "simulated_reservation";
  notes?: string | null;
  checkedInAt?: string | null;
  checkedInBy?: string | null;
  createdAt: string;
  checkInInstructions: string;
  checkoutUrl?: string;
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
  studentQuantity?: number;
  childQuantity?: number;
  unitPriceCents: number;
  totalAmountCents: number;
  discountAmountCents?: number;
  couponCode?: string | null;
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

export interface TicketCoupon {
  id: string;
  code: string;
  description?: string | null;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  eventId?: string | null;
  eventTitle?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
  maxUses?: number | null;
  timesUsed: number;
  isActive: boolean;
  isGift?: boolean;
  recipientName?: string | null;
  recipientEmail?: string | null;
  purchaserName?: string | null;
  purchaserEmail?: string | null;
  giftMessage?: string | null;
  orderReference?: string | null;
  createdAt: string;
}

export interface ValidateCouponResult {
  valid: boolean;
  code?: string;
  discountType?: "percentage" | "fixed_amount";
  discountValue?: number;
  calculatedDiscountCents?: number;
  message?: string;
}
