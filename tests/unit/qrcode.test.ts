import { describe, it, expect } from "vitest";
import { generateQRCodeMatrix, generateQRCodeSvg } from "@/lib/qrcode";

describe("generateQRCodeMatrix and generateQRCodeSvg", () => {
  it("generates a valid QR matrix for short text", () => {
    const text = "https://sdgc.org/verify/ticket/SDGC-TKT-2027-A8B9C1";
    const matrix = generateQRCodeMatrix(text);
    expect(matrix.size).toBeGreaterThanOrEqual(21);
    expect(matrix.modules.length).toBe(matrix.size);
    const row0 = matrix.modules[0];
    const row3 = matrix.modules[3];
    const row6 = matrix.modules[6];
    expect(row0).toBeDefined();
    expect(row0?.[0]).toBe(true);
    expect(row0?.[6]).toBe(true);
    expect(row6?.[0]).toBe(true);
    expect(row6?.[6]).toBe(true);
    expect(row3?.[3]).toBe(true); // Center
  });

  it("generates valid SVG output with viewBox and paths", () => {
    const text = "https://sdgc.org/verify/member/SDGC-MBR-ABC12345";
    const svg = generateQRCodeSvg(text, { size: 200, margin: 4 });

    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('width="200" height="200"');
    expect(svg).toContain("<path d=");
    expect(svg).toContain("<rect");
  });
});
