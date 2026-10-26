import { PdfDocument } from "./simple-pdf";

export interface DuesReceiptData {
  paymentId: string;
  receiptNumber: string;
  date: string;
  memberName: string;
  memberEmail: string;
  year: number;
  amountCents: number;
  currency: string;
  paymentMethod: string;
  transactionReference: string;
  status: string;
}

export function generateDuesReceiptPdf(data: DuesReceiptData): Buffer {
  const doc = new PdfDocument(612, 792);

  // Top Accent Banner (SDGC Forest Green: RGB 0.13, 0.38, 0.25)
  doc.drawRect(0, 772, 612, 20, { fillColor: [0.133, 0.38, 0.251] });

  // Organization Header
  doc.drawText("SAUGATUCK DOUGLAS GARDEN CLUB", 50, 735, {
    fontSize: 20,
    font: "Helvetica-Bold",
    color: [0.133, 0.38, 0.251],
  });
  doc.drawText("P.O. Box 1011, Douglas, MI 49406  |  www.saugatuckdouglasgardenclub.org", 50, 718, {
    fontSize: 9,
    font: "Helvetica",
    color: [0.4, 0.4, 0.4],
  });
  doc.drawText("A 501(c)(3) Nonprofit Organization  |  EIN: 38-2342918", 50, 705, {
    fontSize: 8,
    font: "Helvetica",
    color: [0.45, 0.45, 0.45],
  });

  // Invoice / Receipt Title
  doc.drawText("OFFICIAL DUES INVOICE & RECEIPT", 50, 665, {
    fontSize: 14,
    font: "Helvetica-Bold",
    color: [0.1, 0.1, 0.1],
  });

  doc.drawLine(50, 655, 562, 655, [0.85, 0.85, 0.85], 1);

  // Metadata Panel (Left: Member, Right: Invoice details)
  doc.drawRect(50, 565, 512, 80, {
    fillColor: [0.97, 0.98, 0.97],
    strokeColor: [0.85, 0.9, 0.85],
    lineWidth: 1,
  });

  // Left Column: Member Details
  doc.drawText("MEMBER DETAILS", 65, 628, {
    fontSize: 9,
    font: "Helvetica-Bold",
    color: [0.35, 0.35, 0.35],
  });
  doc.drawText(`Name: ${data.memberName}`, 65, 612, {
    fontSize: 10,
    font: "Helvetica-Bold",
    color: [0.1, 0.1, 0.1],
  });
  doc.drawText(`Email: ${data.memberEmail}`, 65, 597, {
    fontSize: 9,
    font: "Helvetica",
    color: [0.3, 0.3, 0.3],
  });
  doc.drawText(`Membership Term: ${data.year} Calendar Season`, 65, 582, {
    fontSize: 9,
    font: "Helvetica",
    color: [0.3, 0.3, 0.3],
  });

  // Right Column: Receipt Metadata
  doc.drawText("RECEIPT INFORMATION", 330, 628, {
    fontSize: 9,
    font: "Helvetica-Bold",
    color: [0.35, 0.35, 0.35],
  });
  doc.drawText(`Receipt #: ${data.receiptNumber}`, 330, 612, {
    fontSize: 10,
    font: "Helvetica-Bold",
    color: [0.133, 0.38, 0.251],
  });
  doc.drawText(`Date: ${data.date}`, 330, 597, {
    fontSize: 9,
    font: "Helvetica",
    color: [0.3, 0.3, 0.3],
  });
  doc.drawText(`Status: ${data.status.toUpperCase()}`, 330, 582, {
    fontSize: 9,
    font: "Helvetica-Bold",
    color: [0.15, 0.55, 0.25], // Green
  });

  // Line Items Table Header
  const tableTop = 530;
  doc.drawRect(50, tableTop - 22, 512, 22, {
    fillColor: [0.133, 0.38, 0.251],
  });
  doc.drawText("DESCRIPTION", 65, tableTop - 15, {
    fontSize: 9,
    font: "Helvetica-Bold",
    color: [1, 1, 1],
  });
  doc.drawText("YEAR", 380, tableTop - 15, {
    fontSize: 9,
    font: "Helvetica-Bold",
    color: [1, 1, 1],
  });
  doc.drawText("AMOUNT", 490, tableTop - 15, {
    fontSize: 9,
    font: "Helvetica-Bold",
    color: [1, 1, 1],
  });

  // Line Item Row
  const rowTop = tableTop - 48;
  doc.drawText(`Annual Membership Dues — Saugatuck Douglas Garden Club`, 65, rowTop, {
    fontSize: 10,
    font: "Helvetica-Bold",
    color: [0.15, 0.15, 0.15],
  });
  doc.drawText(
    "Active voting membership, community projects, and member directory access",
    65,
    rowTop - 13,
    {
      fontSize: 8,
      font: "Helvetica",
      color: [0.45, 0.45, 0.45],
    },
  );
  doc.drawText(String(data.year), 380, rowTop, {
    fontSize: 10,
    font: "Helvetica",
    color: [0.2, 0.2, 0.2],
  });

  const formattedAmount = `$${(data.amountCents / 100).toFixed(2)} ${data.currency}`;
  doc.drawText(formattedAmount, 485, rowTop, {
    fontSize: 10,
    font: "Helvetica-Bold",
    color: [0.1, 0.1, 0.1],
  });

  doc.drawLine(50, rowTop - 25, 562, rowTop - 25, [0.85, 0.85, 0.85], 1);

  // Total Section
  const totalTop = rowTop - 45;
  doc.drawText("Total Paid:", 410, totalTop, {
    fontSize: 11,
    font: "Helvetica-Bold",
    color: [0.2, 0.2, 0.2],
  });
  doc.drawText(formattedAmount, 485, totalTop, {
    fontSize: 12,
    font: "Helvetica-Bold",
    color: [0.133, 0.38, 0.251],
  });

  // Payment Details Section
  const paymentBoxTop = totalTop - 35;
  doc.drawRect(50, paymentBoxTop - 60, 512, 60, {
    fillColor: [0.98, 0.98, 0.98],
    strokeColor: [0.88, 0.88, 0.88],
    lineWidth: 1,
  });
  doc.drawText("PAYMENT METHOD & TRANSACTION AUDIT", 65, paymentBoxTop - 16, {
    fontSize: 8,
    font: "Helvetica-Bold",
    color: [0.4, 0.4, 0.4],
  });
  doc.drawText(
    `Method: ${data.paymentMethod === "credit_card" ? "Credit Card (Stripe Checkout)" : "Check / Physical"}`,
    65,
    paymentBoxTop - 32,
    {
      fontSize: 9,
      font: "Helvetica",
      color: [0.2, 0.2, 0.2],
    },
  );
  doc.drawText(
    `Transaction Reference: ${data.transactionReference || "sim_confirmed"}`,
    65,
    paymentBoxTop - 46,
    {
      fontSize: 8,
      font: "Courier",
      color: [0.35, 0.35, 0.35],
    },
  );

  // Tax Exemption & Nonprofit Statement Box
  const taxTop = paymentBoxTop - 85;
  doc.drawRect(50, taxTop - 95, 512, 95, {
    fillColor: [0.95, 0.97, 0.95],
    strokeColor: [0.8, 0.88, 0.8],
    lineWidth: 1,
  });
  doc.drawText("TAX DEDUCTIBILITY NOTICE (501(c)(3) EXEMPT)", 65, taxTop - 18, {
    fontSize: 9,
    font: "Helvetica-Bold",
    color: [0.133, 0.38, 0.251],
  });
  doc.drawText(
    "The Saugatuck Douglas Garden Club is a registered 501(c)(3) non-profit educational and community organization.",
    65,
    taxTop - 33,
    { fontSize: 8.5, font: "Helvetica", color: [0.25, 0.25, 0.25] },
  );
  doc.drawText(
    "No goods or services of substantial monetary value were provided in exchange for these annual club dues.",
    65,
    taxTop - 46,
    { fontSize: 8.5, font: "Helvetica", color: [0.25, 0.25, 0.25] },
  );
  doc.drawText(
    "Your dues directly support community park plantings, local high school horticulture scholarships,",
    65,
    taxTop - 59,
    { fontSize: 8.5, font: "Helvetica", color: [0.25, 0.25, 0.25] },
  );
  doc.drawText(
    "and public educational garden walks. Please retain this official receipt for your tax records.",
    65,
    taxTop - 72,
    { fontSize: 8.5, font: "Helvetica", color: [0.25, 0.25, 0.25] },
  );

  // Footer & Authorized Seal
  doc.drawLine(50, 110, 562, 110, [0.85, 0.85, 0.85], 1);
  doc.drawText("Treasurer, Saugatuck Douglas Garden Club", 50, 95, {
    fontSize: 8,
    font: "Helvetica-Bold",
    color: [0.4, 0.4, 0.4],
  });
  doc.drawText(
    "This document serves as an authentic electronic receipt generated from the SDGC membership system.",
    50,
    82,
    {
      fontSize: 7.5,
      font: "Helvetica",
      color: [0.55, 0.55, 0.55],
    },
  );

  return doc.toBuffer();
}
