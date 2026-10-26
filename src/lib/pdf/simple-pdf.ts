import zlib from "node:zlib";

export interface TextOptions {
  fontSize?: number;
  font?: "Helvetica" | "Helvetica-Bold" | "Times-Roman" | "Courier";
  color?: [number, number, number]; // 0.0 - 1.0 RGB
  align?: "left" | "center" | "right";
}

export interface RectOptions {
  fillColor?: [number, number, number];
  strokeColor?: [number, number, number];
  lineWidth?: number;
}

/**
 * Lightweight, zero-dependency, standard PDF 1.4 document generator.
 * Produces clean, standards-compliant application/pdf byte buffers.
 */
export class PdfDocument {
  private width: number;
  private height: number;
  private operations: string[] = [];

  constructor(width = 612, height = 792) {
    // Default US Letter: 8.5 x 11 inches (72 points/inch: 612 x 792)
    this.width = width;
    this.height = height;
  }

  drawRect(x: number, y: number, width: number, height: number, options: RectOptions = {}): this {
    const { fillColor, strokeColor, lineWidth = 1 } = options;
    const ops: string[] = ["q"];

    if (lineWidth) {
      ops.push(`${lineWidth.toFixed(2)} w`);
    }

    if (fillColor) {
      ops.push(
        `${fillColor[0].toFixed(3)} ${fillColor[1].toFixed(3)} ${fillColor[2].toFixed(3)} rg`,
      );
    }

    if (strokeColor) {
      ops.push(
        `${strokeColor[0].toFixed(3)} ${strokeColor[1].toFixed(3)} ${strokeColor[2].toFixed(3)} RG`,
      );
    }

    ops.push(`${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re`);

    if (fillColor && strokeColor) {
      ops.push("B");
    } else if (fillColor) {
      ops.push("f");
    } else if (strokeColor) {
      ops.push("S");
    } else {
      ops.push("n");
    }

    ops.push("Q");
    this.operations.push(ops.join(" "));
    return this;
  }

  drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    strokeColor: [number, number, number] = [0.8, 0.8, 0.8],
    lineWidth = 1,
  ): this {
    const ops = [
      "q",
      `${lineWidth.toFixed(2)} w`,
      `${strokeColor[0].toFixed(3)} ${strokeColor[1].toFixed(3)} ${strokeColor[2].toFixed(3)} RG`,
      `${x1.toFixed(2)} ${y1.toFixed(2)} m`,
      `${x2.toFixed(2)} ${y2.toFixed(2)} l`,
      "S",
      "Q",
    ];
    this.operations.push(ops.join(" "));
    return this;
  }

  drawText(text: string, x: number, y: number, options: TextOptions = {}): this {
    const { fontSize = 12, font = "Helvetica", color = [0.1, 0.1, 0.1] } = options;

    let fontId = "/F1";
    if (font === "Helvetica-Bold") fontId = "/F2";
    if (font === "Times-Roman") fontId = "/F3";
    if (font === "Courier") fontId = "/F4";

    // Sanitize non-ASCII / Unicode characters to clean printable ASCII
    // to prevent UTF-8 to WinAnsi encoding mojibake (e.g., â€¢, â€“, Ã—)
    const sanitized = text
      .replace(/[•·]/g, "-")
      .replace(/[–—]/g, "-")
      .replace(/×/g, "x")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/…/g, "...")
      .replace(/\u00A0/g, " ")
      .replace(/[^\x20-\x7E]/g, "");

    // Escape special characters in PDF string literals: (, ), \
    const escaped = sanitized.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

    const ops = [
      "BT",
      `${fontId} ${fontSize} Tf`,
      `${color[0].toFixed(3)} ${color[1].toFixed(3)} ${color[2].toFixed(3)} rg`,
      `${x.toFixed(2)} ${y.toFixed(2)} Td`,
      `(${escaped}) Tj`,
      "ET",
    ];

    this.operations.push(ops.join(" "));
    return this;
  }

  toBuffer(): Buffer {
    const streamContent = this.operations.join("\n");
    const compressedStream = zlib.deflateSync(Buffer.from(streamContent, "utf8"));

    const offsets: number[] = [];

    // Header
    let buffer = Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "binary");

    // Object 1: Catalog
    offsets.push(buffer.length);
    const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
    buffer = Buffer.concat([buffer, Buffer.from(obj1, "utf8")]);

    // Object 2: Pages
    offsets.push(buffer.length);
    const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
    buffer = Buffer.concat([buffer, Buffer.from(obj2, "utf8")]);

    // Object 3: Page
    offsets.push(buffer.length);
    const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.width} ${this.height}] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R /F4 7 0 R >> >> /Contents 8 0 R >>\nendobj\n`;
    buffer = Buffer.concat([buffer, Buffer.from(obj3, "utf8")]);

    // Object 4: Font F1 (Helvetica)
    offsets.push(buffer.length);
    const obj4 =
      "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n";
    buffer = Buffer.concat([buffer, Buffer.from(obj4, "utf8")]);

    // Object 5: Font F2 (Helvetica-Bold)
    offsets.push(buffer.length);
    const obj5 =
      "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n";
    buffer = Buffer.concat([buffer, Buffer.from(obj5, "utf8")]);

    // Object 6: Font F3 (Times-Roman)
    offsets.push(buffer.length);
    const obj6 =
      "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>\nendobj\n";
    buffer = Buffer.concat([buffer, Buffer.from(obj6, "utf8")]);

    // Object 7: Font F4 (Courier)
    offsets.push(buffer.length);
    const obj7 =
      "7 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>\nendobj\n";
    buffer = Buffer.concat([buffer, Buffer.from(obj7, "utf8")]);

    // Object 8: Contents Stream
    offsets.push(buffer.length);
    const streamHeader = `8 0 obj\n<< /Length ${compressedStream.length} /Filter /FlateDecode >>\nstream\n`;
    const streamFooter = "\nendstream\nendobj\n";
    buffer = Buffer.concat([
      buffer,
      Buffer.from(streamHeader, "utf8"),
      compressedStream,
      Buffer.from(streamFooter, "utf8"),
    ]);

    // Cross-Reference Table
    const startXref = buffer.length;
    let xref = "xref\n0 9\n0000000000 65535 f \n";
    for (const offset of offsets) {
      xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
    }

    const trailer = `trailer\n<< /Size 9 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
    buffer = Buffer.concat([buffer, Buffer.from(xref + trailer, "utf8")]);

    return buffer;
  }
}
