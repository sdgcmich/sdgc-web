import type { Metadata } from "next";
import { GateScanner } from "@/features/verification/components/gate-scanner";

export const metadata: Metadata = {
  title: "Member Credential Lookup | Saugatuck Douglas Garden Club",
  description: "Verify active club membership, valid term season, and local nursery discounts.",
};

export default function MemberLookupPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <GateScanner mode="member" />
    </div>
  );
}
