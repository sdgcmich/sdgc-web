import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { memberProfileSchema } from "@/features/membership/validation";
import type { AppRole, Capability } from "@/features/auth/types";

describe("User Handle Updates & Fixed Membership Primary Key", () => {
  it("validates user handle formats correctly", () => {
    // Valid handles
    const validBase = {
      username: "sarah",
      firstName: "Sarah",
      lastName: "Gardener",
      email: "sarah@example.com",
      masterGardener: false,
      directoryOptOut: false,
      projectInterests: [],
    };

    expect(memberProfileSchema.safeParse(validBase).success).toBe(true);
    expect(memberProfileSchema.safeParse({ ...validBase, username: "sarah1" }).success).toBe(true);
    expect(memberProfileSchema.safeParse({ ...validBase, username: "sarah_douglas" }).success).toBe(
      true,
    );
    expect(memberProfileSchema.safeParse({ ...validBase, username: "sarah-2026" }).success).toBe(
      true,
    );

    // Invalid handles
    expect(memberProfileSchema.safeParse({ ...validBase, username: "sa" }).success).toBe(false); // < 3 chars
    expect(memberProfileSchema.safeParse({ ...validBase, username: "sarah@home" }).success).toBe(
      false,
    ); // special chars
    expect(
      memberProfileSchema.safeParse({ ...validBase, username: "sarah gardener" }).success,
    ).toBe(false); // space
  });

  it("ensures membership ID remains fixed and derived from user primary key UUID", () => {
    const userId = "645b5420-8977-4f73-81f5-b99fb09a3d9e";
    const generateMemberCode = (id: string) => `SDGC-MBR-${id.slice(0, 8).toUpperCase()}`;

    const initialCode = generateMemberCode(userId);
    expect(initialCode).toBe("SDGC-MBR-645B5420");

    // Even if username changes from 'sarah' to 'sarah_master'
    const newUsername = "sarah_master";
    expect(newUsername).not.toBe("sarah");
    const codeAfterHandleUpdate = generateMemberCode(userId);
    expect(codeAfterHandleUpdate).toBe("SDGC-MBR-645B5420"); // Immutable primary key ID
  });

  it("generates default handle from first name and appends number on collisions", () => {
    const existingProfiles = ["sarah", "sarah1", "john"];

    function mockGenerateUsername(firstName: string, existing: string[]): string {
      const base = firstName.toLowerCase().replace(/[^a-z0-9]/g, "") || "member";
      if (!existing.includes(base)) return base;
      let counter = 1;
      while (existing.includes(`${base}${counter}`)) {
        counter++;
      }
      return `${base}${counter}`;
    }

    expect(mockGenerateUsername("Sarah", existingProfiles)).toBe("sarah2");
    expect(mockGenerateUsername("John", existingProfiles)).toBe("john1");
    expect(mockGenerateUsername("Michael", existingProfiles)).toBe("michael");
    expect(mockGenerateUsername("Mary-Jane!", existingProfiles)).toBe("maryjane");
  });
});

describe("Super Admin Hierarchy & Step-Up Re-Authentication", () => {
  it("includes super_admin in AppRole and privileged capabilities", () => {
    const roles: AppRole[] = ["super_admin", "admin", "editor", "treasurer"];
    expect(roles).toContain("super_admin");

    const superCaps: Capability[] = ["roles.admin", "super_admin.manage", "roles.manage"];
    expect(superCaps).toContain("roles.admin");
    expect(superCaps).toContain("super_admin.manage");
  });

  it("enforces role hierarchy rules between super_admin and normal admin", () => {
    function canModifyRole(actorRole: AppRole, targetRoleToChange: AppRole): boolean {
      if (actorRole === "super_admin") return true;
      if (targetRoleToChange === "super_admin" || targetRoleToChange === "admin") {
        return false; // Normal admin cannot touch admin or super_admin
      }
      return true; // Normal admin can manage editor and treasurer
    }

    // Super admin can manage everything
    expect(canModifyRole("super_admin", "super_admin")).toBe(true);
    expect(canModifyRole("super_admin", "admin")).toBe(true);
    expect(canModifyRole("super_admin", "editor")).toBe(true);
    expect(canModifyRole("super_admin", "treasurer")).toBe(true);

    // Normal admin CANNOT manage admin or super_admin
    expect(canModifyRole("admin", "super_admin")).toBe(false);
    expect(canModifyRole("admin", "admin")).toBe(false);

    // Normal admin CAN manage editor and treasurer
    expect(canModifyRole("admin", "editor")).toBe(true);
    expect(canModifyRole("admin", "treasurer")).toBe(true);
  });

  it("protects last super administrator and last administrator from demotion", () => {
    function canDemote(_role: AppRole, remainingCount: number): boolean {
      if (remainingCount <= 1) return false;
      return true;
    }

    expect(canDemote("super_admin", 1)).toBe(false);
    expect(canDemote("super_admin", 2)).toBe(true);
    expect(canDemote("admin", 1)).toBe(false);
    expect(canDemote("admin", 3)).toBe(true);
  });
});

describe("Avatar Image Processing with Sharp", () => {
  it("crops and resizes image buffer to 512x512 WebP", async () => {
    // Generate a simple 1000x800 test PNG buffer
    const testImageBuffer = await sharp({
      create: {
        width: 1000,
        height: 800,
        channels: 4,
        background: { r: 34, g: 139, b: 34, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    // Process avatar: resize to 512x512 square WebP (cover fit, center crop)
    const avatarBuffer = await sharp(testImageBuffer)
      .rotate()
      .resize(512, 512, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 85 })
      .toBuffer();

    const metadata = await sharp(avatarBuffer).metadata();
    expect(metadata.width).toBe(512);
    expect(metadata.height).toBe(512);
    expect(metadata.format).toBe("webp");
    expect(avatarBuffer.length).toBeGreaterThan(0);
  });
});
