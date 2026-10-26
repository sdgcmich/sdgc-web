import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { verifyMemberAction } from "@/features/verification/actions";
import { VerifyMemberView } from "@/features/verification/components/verify-member-view";

interface Props {
  params: Promise<{
    memberCode: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { memberCode } = await params;
  return {
    title: `Member Verification • ${memberCode} | Saugatuck Douglas Garden Club`,
    description: `Official membership credential verification for ${memberCode}.`,
  };
}

export default async function VerifyMemberPage({ params }: Props) {
  const { memberCode } = await params;
  if (!memberCode) {
    notFound();
  }

  const res = await verifyMemberAction(memberCode);
  if (!res.success || !res.data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8 text-center space-y-4">
        <h1 className="font-serif text-2xl font-bold text-foreground">Verification Error</h1>
        <p className="text-sm text-muted-foreground">
          {res.error || "Unable to retrieve member credential record."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <VerifyMemberView result={res.data} />
    </div>
  );
}
