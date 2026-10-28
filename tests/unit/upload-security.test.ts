import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  detectMimeFromMagicBytes,
  sanitizeFileName,
  scanForMaliciousPayloads,
  validateUploadFile,
} from "@/lib/storage/upload-security";

describe("File Upload Security & Magic Byte Validation", () => {
  it("sanitizes filenames and eliminates path traversal attempts", () => {
    expect(sanitizeFileName("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFileName("..\\..\\windows\\system32\\cmd.exe")).toBe("cmd.exe");
    expect(sanitizeFileName("file\x00name.pdf")).toBe("filename.pdf");
    expect(sanitizeFileName("Meeting Minutes (Oct 2026)!.pdf")).toBe(
      "Meeting_Minutes__Oct_2026.pdf",
    );
    expect(sanitizeFileName("")).toMatch(/^file-\d+$/);
  });

  it("detects genuine PDF magic bytes and rejects spoofed extensions", () => {
    // Valid PDF header: %PDF-1.4
    const validPdfBuffer = Buffer.from(
      "%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF",
    );
    const detected = detectMimeFromMagicBytes(validPdfBuffer);
    expect(detected).not.toBeNull();
    expect(detected?.mime).toBe("application/pdf");
    expect(detected?.ext).toBe("pdf");

    // Spoofed PDF: text file with .pdf extension
    const spoofedPdfBuffer = Buffer.from("Hello world, this is just plain text");
    const detectedSpoof = detectMimeFromMagicBytes(spoofedPdfBuffer);
    expect(detectedSpoof?.mime).not.toBe("application/pdf");
  });

  it("detects genuine PNG, JPEG, GIF, and WebP image magic bytes", async () => {
    // 1. JPEG
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    expect(detectMimeFromMagicBytes(jpegBuffer)?.mime).toBe("image/jpeg");

    // 2. PNG
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    expect(detectMimeFromMagicBytes(pngBuffer)?.mime).toBe("image/png");

    // 3. GIF
    const gifBuffer = Buffer.from("GIF89a\x01\x00\x01\x00\x80\x00\x00", "binary");
    expect(detectMimeFromMagicBytes(gifBuffer)?.mime).toBe("image/gif");

    // 4. WebP generated via sharp
    const webpBuffer = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 4,
        background: { r: 0, g: 255, b: 0, alpha: 1 },
      },
    })
      .webp()
      .toBuffer();
    expect(detectMimeFromMagicBytes(webpBuffer)?.mime).toBe("image/webp");
  });

  it("blocks dangerous executable extensions and malicious script payloads", async () => {
    // Prohibited extension test
    const fakeFile = new File([Buffer.from("MZ\x90\x00\x03")], "malware.exe", {
      type: "application/octet-stream",
    });
    const result = await validateUploadFile(fakeFile, { category: "all" });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("prohibited");

    // Block PHP script disguised as JPG
    const phpInJpg = new File([Buffer.from("<?php system($_GET['cmd']); ?>")], "exploit.jpg", {
      type: "image/jpeg",
    });
    const phpResult = await validateUploadFile(phpInJpg, { category: "image" });
    expect(phpResult.valid).toBe(false);

    // Scan for embedded scripts
    const scanResult = scanForMaliciousPayloads(Buffer.from("GIF89a<?php phpinfo(); ?>"));
    expect(scanResult.safe).toBe(false);
    expect(scanResult.reason).toContain("Embedded scripts");
  });

  it("enforces strict size limits", async () => {
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
    const largeFile = new File([largeBuffer], "huge-image.jpg", { type: "image/jpeg" });

    // Category with 5MB max
    const result = await validateUploadFile(largeFile, {
      category: "image",
      maxSizeBytes: 5 * 1024 * 1024,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("exceeds");
  });

  it("sanitizes uploaded images through Sharp re-encoding", async () => {
    const rawPng = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 120, g: 80, b: 200, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const file = new File([rawPng], "clean-diagram.png", { type: "image/png" });
    const result = await validateUploadFile(file, { category: "all" });

    expect(result.valid).toBe(true);
    expect(result.detectedMimeType).toBe("image/webp");
    expect(result.detectedExtension).toBe("webp");
    expect(result.sanitizedBuffer).toBeDefined();
    if (!result.sanitizedBuffer) throw new Error("Expected sanitized buffer");

    // Verify sanitized buffer is clean valid WebP
    const meta = await sharp(result.sanitizedBuffer).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(100);
    expect(meta.height).toBe(100);
  });
});
