export type VerificationStatus = "valid" | "checked_in" | "cancelled" | "refunded" | "not_found";

export interface TicketVerificationResult {
  status: VerificationStatus;
  orderReference: string;
  orderId?: string;
  purchaserName?: string;
  purchaserEmail?: string;
  purchaserPhone?: string | null;
  ticketQuantity?: number;
  studentQuantity?: number;
  childQuantity?: number;
  unitPriceCents?: number;
  totalAmountCents?: number;
  discountAmountCents?: number;
  couponCode?: string | null;
  eventTitle?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  checkedInAt?: string | null;
  checkedInByName?: string | null;
  notes?: string | null;
  createdAt?: string;
  message?: string;
}

export interface MemberVerificationResult {
  status: "active" | "expired" | "not_found";
  memberCode: string;
  name?: string;
  username?: string;
  city?: string;
  state?: string;
  isMasterGardener?: boolean;
  termYear?: number;
  validTerm?: string;
  memberSince?: string;
  message?: string;
}
