import type { ApplicationStatus, PaymentStatus } from "@/features/membership/types";

export interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
}

export interface AdminMetrics {
  totalMembers: number;
  pendingApprovals: number;
  unreconciledPayments: number;
  upcomingEvents: number;
  unreadMessages: number;
  totalTickets?: number;
}

export interface AdminMemberRecord {
  id: string; // membership id
  userId: string;
  username: string;
  name: string;
  email: string;
  year: number;
  applicationStatus: ApplicationStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  isApproved: boolean;
  isMasterGardener: boolean;
  version: number;
  roles: string[];
  appliedAt: string;
  phone?: string;
  altPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  spouseFirstName?: string;
  gardeningInterests?: string;
  workExperience?: string;
  volunteerExperience?: string;
  adminNotes?: string;
  directoryOptOut?: boolean;
}

export interface AdminTermRecord {
  id: string;
  year: number;
  duesCents: number;
  currency: string;
  opensAt: string;
  closesAt: string;
}

export interface AdminDuesRecord {
  id: string; // payment id
  membershipId: string;
  memberName: string;
  memberUsername: string;
  year: number;
  amountCents: number;
  paymentMethod: "credit_card" | "check" | "cash";
  status: "pending" | "confirmed" | "failed" | "refunded";
  notes?: string;
  reconciledAt?: string;
  reconciledBy?: string;
  createdAt: string;
}

export interface AdminVenueRecord {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  url?: string;
}

export interface AdminEventRecord {
  id: string;
  title: string;
  slug: string;
  startsAt: string;
  endsAt?: string;
  category?: string;
  status: "published" | "draft" | "cancelled";
  venueName?: string;
  venueId?: string;
  description?: string;
  featuredImage?: string | null;
}

export interface AdminPageRecord {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  content?: string;
  status: "published" | "draft";
  updatedAt: string;
}

export interface AdminMessageRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  senderType?: string;
  category?: string;
  subject?: string;
  attachmentUrl?: string;
  message: string;
  status: "unread" | "read" | "archived";
  createdAt: string;
}

export interface AdminAuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorEmail: string;
  createdAt: string;
  details?: Record<string, unknown>;
}

export interface DisbursementRecord {
  id: string;
  amountCents: number;
  category: string;
  payee: string;
  description: string;
  referenceNumber?: string;
  disbursedAt: string;
  createdBy?: string;
  createdAt: string;
}

export interface FinancialLedgerSummary {
  totalDuesRevenueCents: number;
  duesPaymentCount: number;
  totalTicketRevenueCents: number;
  ticketOrderCount: number;
  totalTicketsSold: number;
  totalOtherRevenueCents: number;
  totalGrossRevenueCents: number;
  totalDisbursedCents: number;
  disbursementCount: number;
  netAvailableBalanceCents: number;
}
