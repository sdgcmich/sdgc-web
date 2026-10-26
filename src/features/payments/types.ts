export type PaymentMethod = "credit_card" | "check" | "cash";
export type PaymentStatus = "pending" | "confirmed" | "failed" | "refunded";

export interface PaymentRecord {
  id: string;
  userId: string;
  membershipId: string;
  termId: string;
  amountCents: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  provider: string;
  providerTransactionId?: string | null;
  providerEventId?: string | null;
  reconciledBy?: string | null;
  reconciledAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCheckoutInput {
  paymentId: string;
  amountCents: number;
  currency: "USD";
  returnPath: string;
  membershipId?: string;
}

export interface CheckoutResult {
  checkoutUrl: string;
  providerReference: string;
}

export interface InitiateDuesInput {
  method: "credit_card" | "check";
  termYear?: number;
  returnPath?: string;
}

export interface InitiateDuesResult {
  paymentId: string;
  status: PaymentStatus;
  method: PaymentMethod;
  amountCents: number;
  message: string;
  checkoutUrl?: string;
}
