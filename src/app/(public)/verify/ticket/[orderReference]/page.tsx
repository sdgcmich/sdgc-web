import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { verifyTicketAction } from "@/features/verification/actions";
import { VerifyTicketView } from "@/features/verification/components/verify-ticket-view";

interface Props {
  params: Promise<{
    orderReference: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderReference } = await params;
  return {
    title: `Ticket Pass Verification • ${orderReference} | Saugatuck Douglas Garden Club`,
    description: `Official gate verification for ticket pass ${orderReference}.`,
  };
}

export default async function VerifyTicketPage({ params }: Props) {
  const { orderReference } = await params;
  if (!orderReference) {
    notFound();
  }

  const res = await verifyTicketAction(orderReference);
  if (!res.success || !res.data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8 text-center space-y-4">
        <h1 className="font-serif text-2xl font-bold text-foreground">Verification Error</h1>
        <p className="text-sm text-muted-foreground">
          {res.error || "Unable to retrieve ticket pass record."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <VerifyTicketView initialResult={res.data} />
    </div>
  );
}
