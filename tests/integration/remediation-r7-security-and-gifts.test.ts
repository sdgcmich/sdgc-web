import { describe, expect, it } from "vitest";
import { createAnonClient, createServiceClient } from "./setup";
import { validateCouponCodeAction, purchaseGiftCouponAction } from "@/features/tickets/actions";
import { verifyTicketAction } from "@/features/verification/actions";

describe("Remediation Package R7 — Security Hardening, Coupons & Gift Passes", () => {
  const anonClient = createAnonClient();
  const serviceClient = createServiceClient();

  describe("Database RLS & Grant Hardening", () => {
    it("denies anonymous users from reading ticket_orders (prevents PII leak)", async () => {
      const { data, error } = await anonClient.from("ticket_orders").select("*").limit(5);
      // Anonymous SELECT was revoked; PostgREST returns permission denied error
      expect(error).not.toBeNull();
      expect(data).toBeNull();
    });

    it("denies anonymous users from reading event_coupons (prevents promo code enumeration)", async () => {
      const { data, error } = await anonClient.from("event_coupons").select("*").limit(5);
      // Anonymous SELECT was revoked; PostgREST returns permission denied error
      expect(error).not.toBeNull();
      expect(data).toBeNull();
    });

    it("allows administrative/service operations on ticket_orders and event_coupons", async () => {
      const { data: tickets, error: ticketsErr } = await serviceClient
        .from("ticket_orders")
        .select("id, order_reference")
        .limit(3);
      expect(ticketsErr).toBeNull();
      expect(tickets).toBeDefined();

      const { data: coupons, error: couponsErr } = await serviceClient
        .from("event_coupons")
        .select("id, code, discount_type, discount_value")
        .limit(3);
      expect(couponsErr).toBeNull();
      expect(coupons).toBeDefined();
    });
  });

  describe("Server Action Safe Coupon Validation", () => {
    it("validates seeded active coupons without granting direct table access to client", async () => {
      const res = await validateCouponCodeAction("GARDEN20", undefined, 5000);
      expect(res.success).toBe(true);
      if (res.success && res.data) {
        expect(res.data.valid).toBe(true);
        expect(res.data.discountType).toBe("percentage");
        expect(res.data.discountValue).toBe(20);
        expect(res.data.calculatedDiscountCents).toBe(1000); // 20% of 5000
      }
    });

    it("safely handles non-existent or invalid coupon codes", async () => {
      const res = await validateCouponCodeAction("NON_EXISTENT_CODE_XYZ");
      expect(res.success).toBe(true);
      if (res.success && res.data) {
        expect(res.data.valid).toBe(false);
      }
    });
  });

  describe("Buy and Gift Coupon / Pass Workflow", () => {
    it("allows purchasing and gifting an advance pass to a recipient", async () => {
      const res = await purchaseGiftCouponAction({
        amountDollars: 30,
        purchaserName: "Alice Donor",
        purchaserEmail: "alice.donor@example.com",
        recipientName: "Bob Gardener",
        recipientEmail: "bob.gardener@example.com",
        giftMessage: "Enjoy the Garden Walk on me!",
        paymentMethod: "check",
      });

      expect(res.success).toBe(true);
      if (!res.success || !res.data) {
        throw new Error("Gift pass creation failed");
      }

      const giftCode = res.data.code;
      expect(giftCode).toMatch(/^GIFT-\d{4}-[A-Z0-9]+$/);

      // Verify the voucher is recorded in database with gift metadata
      const { data: voucher, error } = await serviceClient
        .from("event_coupons")
        .select("*")
        .eq("code", giftCode)
        .single();

      expect(error).toBeNull();
      expect(voucher).toBeDefined();
      if (!voucher) throw new Error("Voucher not found");
      expect(voucher.is_gift).toBe(true);
      expect(voucher.discount_type).toBe("fixed_amount");
      expect(voucher.discount_value).toBe(3000); // $30.00
      expect(voucher.recipient_name).toBe("Bob Gardener");
      expect(voucher.recipient_email).toBe("bob.gardener@example.com");
      expect(voucher.purchaser_name).toBe("Alice Donor");
      expect(voucher.purchaser_email).toBe("alice.donor@example.com");
      expect(voucher.gift_message).toBe("Enjoy the Garden Walk on me!");
      expect(voucher.max_uses).toBe(1);
      expect(voucher.times_used).toBe(0);
      expect(voucher.is_active).toBe(true);

      // Verify that the recipient can redeem the gifted code at checkout
      const validationRes = await validateCouponCodeAction(giftCode, undefined, 4000);
      expect(validationRes.success).toBe(true);
      if (validationRes.success && validationRes.data) {
        expect(validationRes.data.valid).toBe(true);
        expect(validationRes.data.discountType).toBe("fixed_amount");
        expect(validationRes.data.discountValue).toBe(3000);
        expect(validationRes.data.calculatedDiscountCents).toBe(3000);
      }
    });
  });

  describe("Safe Ticket Verification without Anon Select", () => {
    it("verifies ticket orders via Server Action without requiring broad client SELECT grants", async () => {
      // Find or create an order
      const { data: eventRow } = await serviceClient.from("events").select("id").limit(1).single();
      expect(eventRow).toBeDefined();

      const testRef = `SDGC-TKT-TEST-${Date.now().toString(36).toUpperCase()}`;
      await serviceClient.from("ticket_orders").insert({
        order_reference: testRef,
        event_id: eventRow?.id,
        purchaser_name: "Test Attendee",
        purchaser_email: "test.attendee@example.com",
        ticket_quantity: 1,
        unit_price_cents: 2000,
        total_amount_cents: 2000,
        status: "confirmed",
      });

      const verification = await verifyTicketAction(testRef);
      expect(verification.success).toBe(true);
      if (verification.success && verification.data) {
        expect(verification.data.status).toBe("valid");
        expect(verification.data.orderReference).toBe(testRef);
        expect(verification.data.purchaserName).toBe("Test Attendee");
      }
    });
  });
});
