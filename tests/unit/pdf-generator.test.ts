import { describe, expect, it } from "vitest";
import { generateDuesReceiptPdf, type DuesReceiptData } from "@/lib/pdf/dues-receipt-pdf";
import { generateTicketPassPdf, type TicketPassData } from "@/lib/pdf/ticket-pass-pdf";

describe("PDF Generation Suite", () => {
  it("generates a valid, standards-compliant Dues Receipt PDF buffer", () => {
    const data: DuesReceiptData = {
      paymentId: "pay_test_12345",
      receiptNumber: "SDGC-REC-2026-PAY12345",
      date: "October 26, 2026",
      memberName: "Jane Member",
      memberEmail: "jane@example.com",
      year: 2026,
      amountCents: 2500,
      currency: "USD",
      paymentMethod: "credit_card",
      transactionReference: "pi_test_stripe_trans_123",
      status: "confirmed",
    };

    const pdfBuffer = generateDuesReceiptPdf(data);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(500);

    // Verify PDF 1.4 magic header and EOF
    const header = pdfBuffer.subarray(0, 8).toString("latin1");
    expect(header).toContain("%PDF-1.4");

    const tail = pdfBuffer.subarray(pdfBuffer.length - 10).toString("latin1");
    expect(tail).toContain("%%EOF");
  });

  it("generates a valid, standards-compliant Ticket Pass PDF buffer", () => {
    const data: TicketPassData = {
      orderReference: "SDGC-TKT-2026-ABCDEF",
      purchaserName: "Robert Visitor",
      purchaserEmail: "robert@example.com",
      eventName: "48th Annual Saugatuck-Douglas Garden Walk",
      eventDate: "Saturday, July 11, 2026",
      eventTime: "9:00 AM – 4:00 PM",
      venueName: "Saugatuck-Douglas Area Private Gardens",
      venueAddress: "Registration Tent at Douglas Old Town Hall",
      ticketCount: 2,
      ticketType: "Advance Admission",
      totalAmountCents: 4000,
      currency: "USD",
      paymentStatus: "PAID",
      purchaseDate: "Oct 26, 2026",
      transactionReference: "pi_test_stripe_tkt_789",
    };

    const pdfBuffer = generateTicketPassPdf(data);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(500);

    const header = pdfBuffer.subarray(0, 8).toString("latin1");
    expect(header).toContain("%PDF-1.4");

    const tail = pdfBuffer.subarray(pdfBuffer.length - 10).toString("latin1");
    expect(tail).toContain("%%EOF");
  });
});
