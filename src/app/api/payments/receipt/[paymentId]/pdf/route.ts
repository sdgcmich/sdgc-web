import { NextResponse } from "next/server";
import { getCurrentUser, hasCapability } from "@/features/auth/authorization";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateDuesReceiptPdf, type DuesReceiptData } from "@/lib/pdf/dues-receipt-pdf";

interface RouteParams {
  params: Promise<{
    paymentId: string;
  }>;
}

export async function GET(_request: Request, context: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to access receipt." },
        { status: 401 },
      );
    }

    const { paymentId } = await context.params;
    if (!paymentId) {
      return NextResponse.json({ error: "Payment ID is required." }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Query payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select(
        `
        id,
        user_id,
        amount_cents,
        currency,
        payment_method,
        status,
        provider_transaction_id,
        created_at,
        term_id,
        membership_terms (
          year
        )
      `,
      )
      .eq("id", paymentId)
      .maybeSingle();

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Payment record not found." }, { status: 404 });
    }

    // Authorization check: User must own the payment or have admin/staff capability
    const isOwner = payment.user_id === user.id;
    if (!isOwner) {
      const isStaff = await hasCapability(["dues.reconcile", "members.manage"], user.id);
      if (!isStaff) {
        return NextResponse.json(
          { error: "Access denied to this payment receipt." },
          { status: 403 },
        );
      }
    }

    // Fetch user profile for name
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, username")
      .eq("id", payment.user_id)
      .maybeSingle();

    const terms = payment.membership_terms as unknown as { year?: number } | null;
    const termYear = terms?.year || new Date().getFullYear();

    const memberName = profile
      ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.username
      : user.email;

    const receiptDate = new Date(payment.created_at).toLocaleDateString("en-US", {
      timeZone: "America/Detroit",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const receiptNumber = `SDGC-REC-${termYear}-${payment.id.slice(0, 8).toUpperCase()}`;

    const receiptData: DuesReceiptData = {
      paymentId: payment.id,
      receiptNumber,
      date: receiptDate,
      memberName,
      memberEmail: user.email,
      year: termYear,
      amountCents: payment.amount_cents,
      currency: payment.currency || "USD",
      paymentMethod: payment.payment_method,
      transactionReference: payment.provider_transaction_id || payment.id,
      status:
        payment.status === "confirmed" || payment.status === "succeeded"
          ? "CONFIRMED"
          : payment.status.toUpperCase(),
    };

    const pdfBuffer = generateDuesReceiptPdf(receiptData);

    return new Response(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="SDGC-Dues-Receipt-${receiptNumber}.pdf"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate dues receipt PDF." },
      { status: 500 },
    );
  }
}
