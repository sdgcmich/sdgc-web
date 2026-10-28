export const PROJECT_INTEREST_CHOICES = [
  { code: "community_beautification", label: "Community Beautification" },
  { code: "sixth_grade_workshop", label: "6th Grade Workshop" },
  { code: "new_member_reception", label: "New Member Reception" },
  { code: "club_website", label: "Club Website" },
  { code: "garden_recognition_awards", label: "Community Garden Recognition Awards" },
  { code: "garden_walk_fundraiser", label: "Garden Walk Fund Raiser" },
  { code: "charitable_contributions", label: "Community Charitable Contributions" },
  { code: "holiday_decoration_workshop", label: "Holiday Decoration Workshop" },
] as const;

export type ProjectInterestCode = (typeof PROJECT_INTEREST_CHOICES)[number]["code"];

export interface MemberProfileInput {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string | null;
  phoneHome?: string;
  phoneCell?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  birthMonth?: number; // 1-12
  birthDay?: number; // 1-31
  spouseFirstName?: string;
  masterGardener: boolean;
  directoryOptOut?: boolean;
  gardeningInterests?: string;
  volunteerExperience?: string;
  interestsExperience?: string;
  projectInterests: ProjectInterestCode[];
}

export interface MemberProfile extends MemberProfileInput {
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ApplicationStatus = "pending" | "approved" | "rejected" | "expired" | "suspended";
export type PaymentStatus = "pending" | "confirmed" | "failed" | "refunded" | "unpaid";
export type PaymentMethod = "credit_card" | "check";

export interface MembershipSummary {
  id: string;
  userId: string;
  year: number;
  duesCents: number;
  currency: "USD";
  applicationStatus: ApplicationStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  isApproved: boolean;
  isSuspended: boolean;
  approvedAt?: string;
  approvedBy?: string;
  isActive: boolean;
}

export interface DirectoryMember {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl?: string | null;
  phone?: string;
  secondaryPhone?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  isMasterGardener: boolean;
  gardeningInterests?: string;
  volunteerExperience?: string;
  interestsExperience?: string;
  projectInterests: string[];
}
