import { PdfDocument } from "./simple-pdf";

export interface TicketPassData {
  orderReference: string;
  purchaserName: string;
  purchaserEmail: string;
  eventName: string;
  eventDate: string;
  eventTime?: string;
  venueName?: string;
  venueAddress?: string;
  ticketCount: number;
  ticketType: string;
  totalAmountCents: number;
  currency: string;
  paymentStatus: string;
  purchaseDate: string;
  transactionReference?: string;
}

export function generateTicketPassPdf(data: TicketPassData): Buffer {
  // US Letter size: 612 x 792 points
  const doc = new PdfDocument(612, 792);

  // Top Accent Banner (SDGC Forest Green: RGB 0.133, 0.380, 0.251)
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
  doc.drawText("Official Event Admission Pass & Will-Call Voucher", 50, 705, {
    fontSize: 8.5,
    font: "Helvetica",
    color: [0.35, 0.55, 0.4],
  });

  doc.drawLine(50, 692, 562, 692, [0.85, 0.85, 0.85], 1);

  // Main Ticket Card Box
  const ticketTop = 675;
  const cardHeight = 240;
  doc.drawRect(50, ticketTop - cardHeight, 512, cardHeight, {
    fillColor: [0.985, 0.99, 0.985],
    strokeColor: [0.133, 0.38, 0.251],
    lineWidth: 1.5,
  });

  // Event Header Banner inside card
  doc.drawRect(50, ticketTop - 50, 512, 50, {
    fillColor: [0.133, 0.38, 0.251],
  });
  doc.drawText("OFFICIAL EVENT ADMISSION PASS", 70, ticketTop - 25, {
    fontSize: 10,
    font: "Helvetica",
    color: [0.85, 0.95, 0.88],
  });
  doc.drawText(data.eventName.toUpperCase(), 70, ticketTop - 42, {
    fontSize: 14,
    font: "Helvetica-Bold",
    color: [1, 1, 1],
  });

  // Ticket Pass Details (Left: Event & Venue, Right: Stub / Check-in)
  // Perforated line divider between main body and stub
  const stubX = 410;
  for (let y = ticketTop - 50; y > ticketTop - cardHeight; y -= 8) {
    doc.drawLine(stubX, y, stubX, y - 4, [0.75, 0.75, 0.75], 1);
  }

  // Left Column: Event details
  doc.drawText("DATE & TIME", 70, ticketTop - 75, {
    fontSize: 8,
    font: "Helvetica-Bold",
    color: [0.45, 0.45, 0.45],
  });
  doc.drawText(
    `${data.eventDate}${data.eventTime ? ` | ${data.eventTime}` : ""}`,
    70,
    ticketTop - 90,
    {
      fontSize: 11,
      font: "Helvetica-Bold",
      color: [0.1, 0.1, 0.1],
    },
  );

  doc.drawText("LOCATION / CHECK-IN", 70, ticketTop - 115, {
    fontSize: 8,
    font: "Helvetica-Bold",
    color: [0.45, 0.45, 0.45],
  });
  doc.drawText(data.venueName || "Saugatuck-Douglas Area Private Gardens", 70, ticketTop - 130, {
    fontSize: 10,
    font: "Helvetica-Bold",
    color: [0.15, 0.15, 0.15],
  });
  doc.drawText(
    data.venueAddress || "Check in at Registration Tent to pick up tour guidebook & map",
    70,
    ticketTop - 144,
    {
      fontSize: 8.5,
      font: "Helvetica",
      color: [0.35, 0.35, 0.35],
    },
  );

  doc.drawText("PASS HOLDER", 70, ticketTop - 170, {
    fontSize: 8,
    font: "Helvetica-Bold",
    color: [0.45, 0.45, 0.45],
  });
  doc.drawText(data.purchaserName, 70, ticketTop - 185, {
    fontSize: 11,
    font: "Helvetica-Bold",
    color: [0.1, 0.1, 0.1],
  });
  doc.drawText(data.purchaserEmail, 70, ticketTop - 198, {
    fontSize: 9,
    font: "Helvetica",
    color: [0.35, 0.35, 0.35],
  });

  doc.drawText("ADMISSION DETAILS", 70, ticketTop - 220, {
    fontSize: 8,
    font: "Helvetica-Bold",
    color: [0.45, 0.45, 0.45],
  });
  doc.drawText(
    `${data.ticketCount} x ${data.ticketType} Pass${data.ticketCount > 1 ? "es" : ""}`,
    70,
    ticketTop - 233,
    {
      fontSize: 10,
      font: "Helvetica-Bold",
      color: [0.133, 0.38, 0.251],
    },
  );

  // Right Column: Stub & Check-in reference
  doc.drawText("ADMIT", stubX + 20, ticketTop - 75, {
    fontSize: 8,
    font: "Helvetica-Bold",
    color: [0.45, 0.45, 0.45],
  });
  doc.drawText(String(data.ticketCount), stubX + 20, ticketTop - 105, {
    fontSize: 28,
    font: "Helvetica-Bold",
    color: [0.133, 0.38, 0.251],
  });
  doc.drawText(data.ticketCount > 1 ? "GUESTS" : "GUEST", stubX + 60, ticketTop - 95, {
    fontSize: 10,
    font: "Helvetica-Bold",
    color: [0.3, 0.3, 0.3],
  });

  doc.drawText("ORDER REFERENCE", stubX + 20, ticketTop - 130, {
    fontSize: 8,
    font: "Helvetica-Bold",
    color: [0.45, 0.45, 0.45],
  });
  doc.drawText(data.orderReference, stubX + 20, ticketTop - 146, {
    fontSize: 9,
    font: "Courier",
    color: [0.1, 0.1, 0.1],
  });

  // Status Badge
  doc.drawRect(stubX + 20, ticketTop - 195, 110, 24, {
    fillColor: [0.9, 0.96, 0.92],
    strokeColor: [0.133, 0.38, 0.251],
    lineWidth: 1,
  });
  doc.drawText(
    data.paymentStatus.toUpperCase() === "PAID"
      ? "VERIFIED PAID"
      : data.paymentStatus.toUpperCase(),
    stubX + 30,
    ticketTop - 186,
    {
      fontSize: 8.5,
      font: "Helvetica-Bold",
      color: [0.133, 0.38, 0.251],
    },
  );

  doc.drawText(`Purchased: ${data.purchaseDate}`, stubX + 20, ticketTop - 225, {
    fontSize: 7.5,
    font: "Helvetica",
    color: [0.45, 0.45, 0.45],
  });

  // Order Summary & Receipt Section below ticket pass
  const summaryTop = ticketTop - cardHeight - 25;
  doc.drawText("TRANSACTION & RECEIPT SUMMARY", 50, summaryTop, {
    fontSize: 11,
    font: "Helvetica-Bold",
    color: [0.1, 0.1, 0.1],
  });
  doc.drawLine(50, summaryTop - 8, 562, summaryTop - 8, [0.85, 0.85, 0.85], 1);

  // Metadata Table
  const tableTop = summaryTop - 20;
  doc.drawRect(50, tableTop - 20, 512, 20, {
    fillColor: [0.93, 0.95, 0.93],
  });
  doc.drawText("ITEM DESCRIPTION", 65, tableTop - 14, {
    fontSize: 8.5,
    font: "Helvetica-Bold",
    color: [0.2, 0.2, 0.2],
  });
  doc.drawText("QTY", 360, tableTop - 14, {
    fontSize: 8.5,
    font: "Helvetica-Bold",
    color: [0.2, 0.2, 0.2],
  });
  doc.drawText("PRICE", 420, tableTop - 14, {
    fontSize: 8.5,
    font: "Helvetica-Bold",
    color: [0.2, 0.2, 0.2],
  });
  doc.drawText("TOTAL", 490, tableTop - 14, {
    fontSize: 8.5,
    font: "Helvetica-Bold",
    color: [0.2, 0.2, 0.2],
  });

  const rowY = tableTop - 42;
  doc.drawText(`${data.eventName} (${data.ticketType})`, 65, rowY, {
    fontSize: 9.5,
    font: "Helvetica-Bold",
    color: [0.15, 0.15, 0.15],
  });
  doc.drawText(String(data.ticketCount), 365, rowY, {
    fontSize: 9.5,
    font: "Helvetica",
    color: [0.2, 0.2, 0.2],
  });

  const unitPrice =
    data.ticketCount > 0 ? (data.totalAmountCents / data.ticketCount / 100).toFixed(2) : "0.00";
  doc.drawText(`$${unitPrice}`, 420, rowY, {
    fontSize: 9.5,
    font: "Helvetica",
    color: [0.2, 0.2, 0.2],
  });

  const formattedTotal = `$${(data.totalAmountCents / 100).toFixed(2)} ${data.currency}`;
  doc.drawText(formattedTotal, 485, rowY, {
    fontSize: 9.5,
    font: "Helvetica-Bold",
    color: [0.1, 0.1, 0.1],
  });

  doc.drawLine(50, rowY - 15, 562, rowY - 15, [0.88, 0.88, 0.88], 1);

  // Total
  doc.drawText("Total Amount Paid:", 390, rowY - 32, {
    fontSize: 10,
    font: "Helvetica-Bold",
    color: [0.2, 0.2, 0.2],
  });
  doc.drawText(formattedTotal, 485, rowY - 32, {
    fontSize: 11,
    font: "Helvetica-Bold",
    color: [0.133, 0.38, 0.251],
  });

  if (data.transactionReference) {
    doc.drawText(`Stripe Transaction ID: ${data.transactionReference}`, 50, rowY - 32, {
      fontSize: 8,
      font: "Courier",
      color: [0.4, 0.4, 0.4],
    });
  }

  // Guidelines / Will-Call Instructions Box
  const infoBoxTop = rowY - 55;
  doc.drawRect(50, infoBoxTop - 75, 512, 75, {
    fillColor: [0.97, 0.98, 0.97],
    strokeColor: [0.85, 0.9, 0.85],
    lineWidth: 1,
  });
  doc.drawText("IMPORTANT ADMISSION & CHECK-IN INSTRUCTIONS", 65, infoBoxTop - 16, {
    fontSize: 8.5,
    font: "Helvetica-Bold",
    color: [0.133, 0.38, 0.251],
  });
  doc.drawText(
    "- Please present this printed pass or show it on your mobile device at the event registration table.",
    65,
    infoBoxTop - 30,
    { fontSize: 8, font: "Helvetica", color: [0.3, 0.3, 0.3] },
  );
  doc.drawText(
    "- You will receive your official Garden Walk wristbands, garden directory guidebook, and tour map.",
    65,
    infoBoxTop - 42,
    { fontSize: 8, font: "Helvetica", color: [0.3, 0.3, 0.3] },
  );
  doc.drawText(
    "- Event runs rain or shine. In case of severe weather updates, check www.saugatuckdouglasgardenclub.org.",
    65,
    infoBoxTop - 54,
    { fontSize: 8, font: "Helvetica", color: [0.3, 0.3, 0.3] },
  );
  doc.drawText(
    "- Ticket sales directly support public garden landscaping and horticulture scholarships in our community.",
    65,
    infoBoxTop - 66,
    { fontSize: 8, font: "Helvetica", color: [0.3, 0.3, 0.3] },
  );

  // Footer
  doc.drawLine(50, 60, 562, 60, [0.85, 0.85, 0.85], 1);
  doc.drawText(
    "Saugatuck Douglas Garden Club  |  A 501(c)(3) Nonprofit Organization  |  EIN: 38-2342918",
    50,
    46,
    {
      fontSize: 7.5,
      font: "Helvetica",
      color: [0.45, 0.45, 0.45],
    },
  );
  doc.drawText(
    `Order Reference: ${data.orderReference}  |  Electronic Pass generated securely by SDGC Web`,
    50,
    34,
    {
      fontSize: 7,
      font: "Helvetica",
      color: [0.55, 0.55, 0.55],
    },
  );

  return doc.toBuffer();
}
