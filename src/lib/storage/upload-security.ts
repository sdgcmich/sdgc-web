import sharp from "sharp";

/**
 * Supported upload categories and their allowed MIME types and magic byte headers.
 */
export type AllowedUploadCategory = "image" | "document" | "all";

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedMimeType?: string;
  detectedExtension?: string;
  sanitizedFileName?: string;
  sanitizedBuffer?: Buffer;
  sizeBytes?: number;
}

/**
 * Dangerous file extensions that must NEVER be accepted under any circumstances.
 */
const BLOCKED_EXTENSIONS = new Set([
  // Executables and binaries
  "exe",
  "dll",
  "so",
  "bin",
  "com",
  "scr",
  "msi",
  "cmd",
  "bat",
  "vbs",
  "wsf",
  "ps1",
  "app",
  // Server-side scripts
  "php",
  "php3",
  "php4",
  "php5",
  "phtml",
  "phps",
  "cgi",
  "pl",
  "py",
  "sh",
  "bash",
  "asp",
  "aspx",
  "jsp",
  "jspx",
  // Web / client scripts and active documents
  "html",
  "htm",
  "xhtml",
  "shtml",
  "js",
  "mjs",
  "cjs",
  "jsx",
  "ts",
  "tsx",
  "svg",
  "xml",
  "swf",
  // Configurations & hidden system files
  "htaccess",
  "htpasswd",
  "ini",
  "env",
  "conf",
  "config",
  "yml",
  "yaml",
  "json",
  "pem",
  "key",
]);

/**
 * Sanitizes a client-provided file name to prevent directory traversal and null byte injections.
 */
export function sanitizeFileName(rawName: string, fallbackBase = "file"): string {
  if (!rawName) return `${fallbackBase}-${Date.now()}`;

  // 1. Strip path traversal sequences (/ and \ and ..)
  let clean = rawName.replace(/^.*[/\\]/, "");

  // 2. Remove null bytes and control characters
  // biome-ignore lint/suspicious/noControlCharactersInRegex: necessary for sanitizing file names against null bytes and control chars
  clean = clean.replace(/[\x00-\x1f\x7f]/g, "");

  // 3. Separate name and extension
  const lastDot = clean.lastIndexOf(".");
  if (lastDot === -1) {
    const safeBase = clean.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
    return safeBase || fallbackBase;
  }

  const base = clean
    .slice(0, lastDot)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 80);
  const ext = clean
    .slice(lastDot + 1)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 10);

  const finalBase = base.replace(/^_+|_+$/g, "") || fallbackBase;
  return `${finalBase}.${ext}`;
}

/**
 * Inspects binary magic bytes to determine true file type and reject spoofed extensions.
 */
export function detectMimeFromMagicBytes(buffer: Buffer): { mime: string; ext: string } | null {
  if (!buffer || buffer.length < 4) return null;

  // 1. PDF: %PDF- (0x25 0x50 0x44 0x46 0x2D)
  if (
    buffer.length >= 5 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return { mime: "application/pdf", ext: "pdf" };
  }

  // 2. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }

  // 3. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: "image/png", ext: "png" };
  }

  // 4. GIF: GIF87a (47 49 46 38 37 61) or GIF89a (47 49 46 38 39 61)
  if (
    buffer.length >= 6 &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return { mime: "image/gif", ext: "gif" };
  }

  // 5. WebP: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { mime: "image/webp", ext: "webp" };
  }

  // 6. Microsoft Office OpenXML (DOCX, XLSX) / ZIP container: PK\x03\x04
  if (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
    return {
      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ext: "docx",
    };
  }

  // 7. Plain text / CSV check: ensure no null bytes or executable headers in the first 1024 bytes
  const sample = buffer.subarray(0, Math.min(buffer.length, 1024));
  let isText = true;
  for (let i = 0; i < sample.length; i++) {
    const byte = sample[i];
    if (byte === undefined) continue;
    // Disallow null bytes and control codes except newline, carriage return, tab
    if (byte === 0 || (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13)) {
      isText = false;
      break;
    }
  }

  if (isText) {
    return { mime: "text/plain", ext: "txt" };
  }

  return null;
}

/**
 * Scans a buffer for malicious signatures (e.g. PHP tags, executable headers, script injection).
 */
export function scanForMaliciousPayloads(buffer: Buffer): { safe: boolean; reason?: string } {
  // Reject Windows executables: 'MZ' header
  if (buffer.length >= 2 && buffer[0] === 0x4d && buffer[1] === 0x5a) {
    return { safe: false, reason: "Executable binaries (MZ/PE) are forbidden." };
  }

  // Reject Linux executables: 0x7F 'ELF'
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x7f &&
    buffer[1] === 0x45 &&
    buffer[2] === 0x4c &&
    buffer[3] === 0x46
  ) {
    return { safe: false, reason: "Executable ELF binaries are forbidden." };
  }

  // Scan sample for script/PHP tags embedded in polyglots
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096)).toString("latin1").toLowerCase();
  if (sample.includes("<?php") || sample.includes("<%@") || sample.includes("<script")) {
    return { safe: false, reason: "Embedded scripts or server-side tags detected." };
  }

  return { safe: true };
}

/**
 * Validates an uploaded file strictly against size, extension, magic bytes, and categories.
 */
export async function validateUploadFile(
  file: File,
  options: {
    category: AllowedUploadCategory;
    maxSizeBytes?: number;
    fallbackBase?: string;
  },
): Promise<FileValidationResult> {
  const maxBytes = options.maxSizeBytes || 15 * 1024 * 1024; // Default 15MB

  // 1. Basic checks
  if (!file || file.size === 0) {
    return { valid: false, error: "Empty or invalid file provided." };
  }

  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return { valid: false, error: `File size exceeds the ${maxMb}MB limit.` };
  }

  // 2. Extension check
  const rawName = file.name || "upload";
  const sanitizedName = sanitizeFileName(rawName, options.fallbackBase);
  const extMatch = sanitizedName.match(/\.([a-z0-9]+)$/i);
  const ext = extMatch?.[1]?.toLowerCase() ?? "";

  if (BLOCKED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `Files with extension '.${ext}' are prohibited for security reasons.`,
    };
  }

  // 3. Read buffer and check magic bytes
  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = detectMimeFromMagicBytes(buffer);

  if (!detected) {
    return {
      valid: false,
      error:
        "Unsupported or unrecognized file format. Allowed formats: PDF, DOCX, JPEG, PNG, WebP, GIF, TXT.",
    };
  }

  // 4. Scan for malicious payloads
  const scan = scanForMaliciousPayloads(buffer);
  if (!scan.safe) {
    return { valid: false, error: `Upload rejected: ${scan.reason}` };
  }

  // 5. Category enforcement
  const isImage = detected.mime.startsWith("image/");
  const isDocument =
    detected.mime === "application/pdf" ||
    detected.mime.includes("officedocument") ||
    detected.mime === "text/plain";

  if (options.category === "image" && !isImage) {
    return {
      valid: false,
      error: "Only valid raster image files (JPEG, PNG, WebP, GIF) are allowed.",
    };
  }

  if (options.category === "document" && !isDocument) {
    return { valid: false, error: "Only valid document files (PDF, DOCX, TXT) are allowed." };
  }

  // 6. Image Sanitization & Polyglot Stripping (via Sharp)
  let cleanBuffer = buffer;
  let finalMime = detected.mime;
  let finalExt = detected.ext;

  if (isImage) {
    try {
      // Re-encode through sharp to strip polyglots and sanitize image structures
      cleanBuffer = await sharp(buffer).rotate().webp({ quality: 85, effort: 4 }).toBuffer();
      finalMime = "image/webp";
      finalExt = "webp";
    } catch (sharpErr) {
      return {
        valid: false,
        error: `Corrupt or invalid image data: ${sharpErr instanceof Error ? sharpErr.message : "decode error"}`,
      };
    }
  }

  // Assemble sanitized filename with correct extension
  const baseName = sanitizedName.replace(/\.[^/.]+$/, "");
  const finalFileName = `${baseName}.${finalExt}`;

  return {
    valid: true,
    detectedMimeType: finalMime,
    detectedExtension: finalExt,
    sanitizedFileName: finalFileName,
    sanitizedBuffer: cleanBuffer,
    sizeBytes: cleanBuffer.length,
  };
}
