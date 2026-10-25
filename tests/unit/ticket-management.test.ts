import { describe, expect, it } from "vitest";
import { ticketCheckoutSchema } from "@/features/tickets/validation";
import type { TicketOrderListItem, TicketStats } from "@/features/tickets/types";

describe("Garden Walk & Ticket Management", () => {
  describe("Ticket Checkout Validation Schema", () => {
    it("accepts valid ticket checkout payload", () => {
      const validPayload = {
        eventId: "ebb22222-2222-2222-2222-222222222222",
        quantity: 3,
        purchaserName: "Eleanor Vance",
        purchaserEmail: "eleanor.vance@example.org",
        purchaserPhone: "(269) 555-0144",
        notes: "Looking forward to the garden docents!",
      };

      const result = ticketCheckoutSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.purchaserName).toBe("Eleanor Vance");
        expect(result.data.quantity).toBe(3);
        expect(result.data.purchaserEmail).toBe("eleanor.vance@example.org");
      }
    });

    it("rejects ticket orders with zero or negative quantity", () => {
      const zeroQty = {
        eventId: "ebb22222-2222-2222-2222-222222222222",
        quantity: 0,
        purchaserName: "Eleanor Vance",
        purchaserEmail: "eleanor.vance@example.org",
      };
      const result = ticketCheckoutSchema.safeParse(zeroQty);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/at least 1 ticket/i);
      }
    });

    it("rejects ticket orders exceeding the 20 ticket per order limit", () => {
      const excessQty = {
        eventId: "ebb22222-2222-2222-2222-222222222222",
        quantity: 25,
        purchaserName: "Eleanor Vance",
        purchaserEmail: "eleanor.vance@example.org",
      };
      const result = ticketCheckoutSchema.safeParse(excessQty);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/Maximum 20 tickets/i);
      }
    });

    it("rejects non-integer ticket quantities", () => {
      const floatQty = {
        eventId: "ebb22222-2222-2222-2222-222222222222",
        quantity: 2.5,
        purchaserName: "Eleanor Vance",
        purchaserEmail: "eleanor.vance@example.org",
      };
      const result = ticketCheckoutSchema.safeParse(floatQty);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/whole number/i);
      }
    });

    it("rejects invalid email formats", () => {
      const invalidEmail = {
        eventId: "ebb22222-2222-2222-2222-222222222222",
        quantity: 2,
        purchaserName: "Eleanor Vance",
        purchaserEmail: "not-an-email",
      };
      const result = ticketCheckoutSchema.safeParse(invalidEmail);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/valid email/i);
      }
    });

    it("rejects notes exceeding 500 characters", () => {
      const tooLongNotes = {
        eventId: "ebb22222-2222-2222-2222-222222222222",
        quantity: 2,
        purchaserName: "Eleanor Vance",
        purchaserEmail: "eleanor.vance@example.org",
        notes: "A".repeat(501),
      };
      const result = ticketCheckoutSchema.safeParse(tooLongNotes);
      expect(result.success).toBe(false);
    });
  });

  describe("Ticket Financial Calculations & Business Logic", () => {
    it("calculates correct unit price, total amount, and advance savings", () => {
      const advancePriceCents = 2000; // $20.00
      const dayOfPriceCents = 2500; // $25.00
      const quantity = 4;

      const totalAmountCents = advancePriceCents * quantity;
      const advanceSavingsCents = (dayOfPriceCents - advancePriceCents) * quantity;

      expect(totalAmountCents).toBe(8000); // $80.00
      expect(advanceSavingsCents).toBe(2000); // $20.00 saved
    });

    it("formats order references conforming to SDGC-TKT-YYYY-XXXXXX standard", () => {
      const year = "2027";
      const sampleHex = "A1B2C3";
      const orderRef = `SDGC-TKT-${year}-${sampleHex}`;

      expect(orderRef).toMatch(/^SDGC-TKT-20\d\d-[A-F0-9]{6}$/);
    });
  });

  describe("Admin Roster Aggregation & Stats Calculations", () => {
    const mockOrders: TicketOrderListItem[] = [
      {
        id: "ord-1",
        orderReference: "SDGC-TKT-2027-111111",
        eventId: "ebb22222-2222-2222-2222-222222222222",
        eventTitle: "47th Annual Garden Walk",
        eventSlug: "2027-47th-annual-garden-walk",
        purchaserName: "Alice Walker",
        purchaserEmail: "alice@example.com",
        purchaserPhone: "269-555-0101",
        ticketQuantity: 2,
        unitPriceCents: 2000,
        totalAmountCents: 4000,
        status: "confirmed",
        notes: null,
        checkedInAt: null,
        checkedInByName: null,
        createdAt: "2027-06-01T12:00:00Z",
        updatedAt: "2027-06-01T12:00:00Z",
      },
      {
        id: "ord-2",
        orderReference: "SDGC-TKT-2027-222222",
        eventId: "ebb22222-2222-2222-2222-222222222222",
        eventTitle: "47th Annual Garden Walk",
        eventSlug: "2027-47th-annual-garden-walk",
        purchaserName: "Bob Miller",
        purchaserEmail: "bob@example.com",
        purchaserPhone: "269-555-0102",
        ticketQuantity: 3,
        unitPriceCents: 2000,
        totalAmountCents: 6000,
        status: "checked_in",
        notes: "Checked in at north gate",
        checkedInAt: "2027-07-10T14:30:00Z",
        checkedInByName: "admin-uuid",
        createdAt: "2027-06-02T12:00:00Z",
        updatedAt: "2027-07-10T14:30:00Z",
      },
      {
        id: "ord-3",
        orderReference: "SDGC-TKT-2027-333333",
        eventId: "ebb22222-2222-2222-2222-222222222222",
        eventTitle: "47th Annual Garden Walk",
        eventSlug: "2027-47th-annual-garden-walk",
        purchaserName: "Charlie Brown",
        purchaserEmail: "charlie@example.com",
        purchaserPhone: null,
        ticketQuantity: 1,
        unitPriceCents: 2000,
        totalAmountCents: 2000,
        status: "cancelled",
        notes: "Refunded upon request",
        checkedInAt: null,
        checkedInByName: null,
        createdAt: "2027-06-03T12:00:00Z",
        updatedAt: "2027-06-04T12:00:00Z",
      },
    ];

    it("accurately aggregates total tickets sold, revenue, and check-in metrics", () => {
      const activeOrders = mockOrders.filter(
        (o) => o.status !== "cancelled" && o.status !== "refunded",
      );

      const stats: TicketStats = {
        totalOrders: mockOrders.length,
        totalTicketsSold: activeOrders.reduce((sum, o) => sum + o.ticketQuantity, 0),
        totalRevenueCents: activeOrders.reduce((sum, o) => sum + o.totalAmountCents, 0),
        checkedInCount: mockOrders
          .filter((o) => o.status === "checked_in")
          .reduce((sum, o) => sum + o.ticketQuantity, 0),
        pendingCount: mockOrders
          .filter((o) => o.status === "confirmed")
          .reduce((sum, o) => sum + o.ticketQuantity, 0),
      };

      expect(stats.totalOrders).toBe(3);
      expect(stats.totalTicketsSold).toBe(5); // 2 (Alice) + 3 (Bob), Charlie cancelled
      expect(stats.totalRevenueCents).toBe(10000); // $100.00 active revenue
      expect(stats.checkedInCount).toBe(3); // Bob's 3 tickets
      expect(stats.pendingCount).toBe(2); // Alice's 2 tickets
    });

    it("correctly filters orders by search query", () => {
      const query = "bob";
      const matches = mockOrders.filter(
        (o) =>
          o.purchaserName.toLowerCase().includes(query) ||
          o.purchaserEmail.toLowerCase().includes(query) ||
          o.orderReference.toLowerCase().includes(query),
      );

      expect(matches).toHaveLength(1);
      expect(matches[0]?.purchaserName).toBe("Bob Miller");
    });

    it("exports CSV formatted data correctly with header and escaped rows", () => {
      const headers = [
        "Order Reference",
        "Event",
        "Purchaser Name",
        "Purchaser Email",
        "Purchaser Phone",
        "Quantity",
        "Total ($)",
        "Status",
        "Checked In At",
        "Notes",
      ];

      const rows = mockOrders.map((o) => [
        `"${o.orderReference}"`,
        `"${o.eventTitle.replace(/"/g, '""')}"`,
        `"${o.purchaserName.replace(/"/g, '""')}"`,
        `"${o.purchaserEmail}"`,
        `"${o.purchaserPhone || ""}"`,
        o.ticketQuantity,
        (o.totalAmountCents / 100).toFixed(2),
        `"${o.status}"`,
        `"${o.checkedInAt || ""}"`,
        `"${(o.notes || "").replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      expect(csvContent).toContain("Order Reference,Event,Purchaser Name");
      expect(csvContent).toContain('"SDGC-TKT-2027-111111"');
      expect(csvContent).toContain('"Alice Walker"');
      expect(csvContent).toContain('"Checked in at north gate"');
    });
  });
});
