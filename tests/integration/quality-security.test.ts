import { randomBytes, randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createAnonClient, createAuthClient, createServiceClient, getLocalFixtures, supabaseUrl } from "./setup";

// Fail before creating clients or writing. Never run this against a hosted database.
const endpoint = new URL(supabaseUrl);
if (endpoint.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(endpoint.hostname) || endpoint.port !== "54321" || endpoint.username || endpoint.password || endpoint.pathname !== "/" || endpoint.search || endpoint.hash) {
  throw new Error("Quality security tests require the disposable loopback Supabase stack");
}

describe.sequential("quality security boundaries", () => {
  it("anonymous callers cannot insert a confirmed ticket, including minimal-return writes", async () => {
    const service = createServiceClient();
    const anon = createAnonClient();
    const event = await service.from("events").select("id").eq("slug", "2026-garden-walk-fundraiser").single();
    expect(event.error).toBeNull();
    expect(event.data).not.toBeNull();
    if (!event.data) throw new Error("Required seeded event 2026-garden-walk-fundraiser is missing");
    const id = randomUUID();
    try {
      const result = await anon.from("ticket_orders").insert({
        id,
        order_reference: `QA-${randomUUID()}`,
        event_id: event.data.id,
        purchaser_name: "Synthetic QA Attendee",
        purchaser_email: "qa.attendee@example.test",
        ticket_quantity: 1,
        unit_price_cents: 2000,
        total_amount_cents: 2000,
        status: "confirmed",
      }); // Intentionally no .select(): SELECT denial must not hide a successful write.
      const after = await service.from("ticket_orders").select("id").eq("id", id);
      expect(after.error).toBeNull();
      expect(after.data).toEqual([]);
      expect(result.error?.code).toBe("42501");
    } finally {
      const cleanup = await service.from("ticket_orders").delete().eq("id", id);
      expect(cleanup.error).toBeNull();
    }
  });

  it("anonymous credential lookup cannot return an existing synthetic member profile", async () => {
    const fixtures = getLocalFixtures();
    const member = fixtures.personas?.["member@sdgc.local"];
    expect(typeof member?.username).toBe("string");
    if (!member?.username) throw new Error("Required synthetic member fixture is missing");
    const result = await createAnonClient().rpc("lookup_member_credential", { lookup_code: member.username });
    if (result.error) {
      expect(result.error.code).toBe("42501");
      expect(result.data).toBeNull();
    } else {
      expect(result.data).toEqual([]);
    }
  });

  it("an ordinary administrator cannot self-assign super_admin via direct table writes", async () => {
    const service = createServiceClient();
    const email = `qa-role-${randomUUID()}@example.test`;
    const password = `Qa1!${randomBytes(24).toString("hex")}`;
    const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
    expect(created.error).toBeNull();
    const id = created.data.user?.id;
    if (!id) throw new Error("Could not create isolated role fixture");
    try {
      const granted = await service.from("user_roles").insert({ user_id: id, role: "admin" });
      expect(granted.error).toBeNull();
      const { client } = await createAuthClient(email, password);
      const before = await service.from("user_roles").select("role").eq("user_id", id);
      expect(before.error).toBeNull();
      expect(before.data?.map((row) => row.role).sort()).toEqual(["admin"]);
      const attempted = await client.from("user_roles").insert({ user_id: id, role: "super_admin" });
      const after = await service.from("user_roles").select("role").eq("user_id", id);
      expect(after.error).toBeNull();
      expect(after.data?.map((row) => row.role).sort()).toEqual(["admin"]);
      expect(attempted.error?.code).toBe("42501");
    } finally {
      // Attempt both cleanups before asserting either result.
      const roles = await service.from("user_roles").delete().eq("user_id", id);
      const user = await service.auth.admin.deleteUser(id);
      expect(roles.error).toBeNull();
      expect(user.error).toBeNull();
    }
  });
});
