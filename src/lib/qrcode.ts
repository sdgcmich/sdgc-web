/**
 * Pure TypeScript QR Code generator (Model 2, Byte Mode, ISO/IEC 18004 compliant).
 * 0 external dependencies. Runs in SSR (Server Components), Client Components, and Node.js.
 */

// GF(256) math with primitive polynomial 0x11d (285)
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);

(() => {
  let val = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = val;
    EXP_TABLE[i + 255] = val;
    LOG_TABLE[val] = i;
    val <<= 1;
    if (val & 256) val ^= 0x11d;
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  const logX = LOG_TABLE[x] ?? 0;
  const logY = LOG_TABLE[y] ?? 0;
  return EXP_TABLE[logX + logY] ?? 0;
}

function rsComputePoly(ecLen: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < ecLen; i++) {
    const next = new Uint8Array(poly.length + 1);
    const factor = EXP_TABLE[i] ?? 0;
    for (let j = 0; j < poly.length; j++) {
      const pVal = poly[j] ?? 0;
      next[j] = (next[j] ?? 0) ^ gfMul(pVal, factor);
      next[j + 1] = (next[j + 1] ?? 0) ^ pVal;
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: Uint8Array, ecLen: number): Uint8Array {
  const genPoly = rsComputePoly(ecLen);
  const remainder = new Uint8Array(ecLen);

  for (let i = 0; i < data.length; i++) {
    const dVal = data[i] ?? 0;
    const r0 = remainder[0] ?? 0;
    const factor = dVal ^ r0;
    for (let j = 0; j < ecLen - 1; j++) {
      remainder[j] = (remainder[j + 1] ?? 0) ^ gfMul(genPoly[j + 1] ?? 0, factor);
    }
    remainder[ecLen - 1] = gfMul(genPoly[ecLen] ?? 0, factor);
  }
  return remainder;
}

// Version capacities (Version 1-8, Error Correction Level M)
interface VersionSpec {
  version: number;
  size: number;
  totalDataBytes: number;
  ecBytesPerBlock: number;
  numBlocks: number;
  alignments: number[];
}

const VERSION_SPECS: VersionSpec[] = [
  { version: 1, size: 21, totalDataBytes: 16, ecBytesPerBlock: 10, numBlocks: 1, alignments: [] },
  {
    version: 2,
    size: 25,
    totalDataBytes: 28,
    ecBytesPerBlock: 16,
    numBlocks: 1,
    alignments: [6, 18],
  },
  {
    version: 3,
    size: 29,
    totalDataBytes: 44,
    ecBytesPerBlock: 26,
    numBlocks: 1,
    alignments: [6, 22],
  },
  {
    version: 4,
    size: 33,
    totalDataBytes: 64,
    ecBytesPerBlock: 18,
    numBlocks: 2,
    alignments: [6, 26],
  },
  {
    version: 5,
    size: 37,
    totalDataBytes: 86,
    ecBytesPerBlock: 24,
    numBlocks: 2,
    alignments: [6, 30],
  },
  {
    version: 6,
    size: 41,
    totalDataBytes: 108,
    ecBytesPerBlock: 16,
    numBlocks: 4,
    alignments: [6, 34],
  },
  {
    version: 7,
    size: 45,
    totalDataBytes: 124,
    ecBytesPerBlock: 18,
    numBlocks: 4,
    alignments: [6, 22, 38],
  },
  {
    version: 8,
    size: 49,
    totalDataBytes: 154,
    ecBytesPerBlock: 22,
    numBlocks: 4,
    alignments: [6, 24, 42],
  },
];

const FALLBACK_SPEC: VersionSpec = {
  version: 8,
  size: 49,
  totalDataBytes: 154,
  ecBytesPerBlock: 22,
  numBlocks: 4,
  alignments: [6, 24, 42],
};

export interface QRCodeMatrix {
  size: number;
  modules: boolean[][];
}

export function generateQRCodeMatrix(text: string): QRCodeMatrix {
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(text);

  // Pick smallest sufficient QR version (Level M)
  const spec = VERSION_SPECS.find((s) => textBytes.length + 3 <= s.totalDataBytes) ?? FALLBACK_SPEC;
  const { size, totalDataBytes, ecBytesPerBlock, numBlocks } = spec;

  // Build bitstream: Mode (0100 for Byte) + Count indicator + Data bytes + Terminator
  const bits: number[] = [];
  function pushBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  }

  // Byte mode indicator: 0100
  pushBits(4, 4);
  // Character count: 8 bits for versions 1-9
  pushBits(textBytes.length, 8);
  for (const byte of textBytes) {
    pushBits(byte, 8);
  }
  // Terminator (up to 4 zero bits)
  const maxBits = totalDataBytes * 8;
  const termLen = Math.min(4, maxBits - bits.length);
  pushBits(0, termLen);
  // Byte alignment
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }
  // Pad bytes (0xEC, 0x11)
  const padPatterns = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < maxBits) {
    pushBits(padPatterns[padIdx % 2] ?? 0xec, 8);
    padIdx++;
  }

  // Convert bits to data bytes
  const dataBytes = new Uint8Array(totalDataBytes);
  for (let i = 0; i < totalDataBytes; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | (bits[i * 8 + j] ?? 0);
    }
    dataBytes[i] = b;
  }

  // Interleave blocks and compute EC
  const blockSize = Math.floor(totalDataBytes / numBlocks);
  const rawBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];

  let dataOffset = 0;
  for (let b = 0; b < numBlocks; b++) {
    const bLen = blockSize + (b < totalDataBytes % numBlocks ? 1 : 0);
    const blockData = dataBytes.slice(dataOffset, dataOffset + bLen);
    dataOffset += bLen;
    rawBlocks.push(blockData);
    ecBlocks.push(rsEncode(blockData, ecBytesPerBlock));
  }

  // Interleave data and EC bytes
  const finalCodewords: number[] = [];
  const maxBlockLen = Math.max(...rawBlocks.map((b) => b.length));
  for (let i = 0; i < maxBlockLen; i++) {
    for (let b = 0; b < numBlocks; b++) {
      const block = rawBlocks[b];
      if (block && i < block.length) {
        finalCodewords.push(block[i] ?? 0);
      }
    }
  }
  for (let i = 0; i < ecBytesPerBlock; i++) {
    for (let b = 0; b < numBlocks; b++) {
      const ecBlock = ecBlocks[b];
      if (ecBlock && i < ecBlock.length) {
        finalCodewords.push(ecBlock[i] ?? 0);
      }
    }
  }

  // Initialize module matrix and reserved mask
  const modules: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isReserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  function setModule(r: number, c: number, val: boolean) {
    const rowM = modules[r];
    const rowR = isReserved[r];
    if (rowM && rowR && c >= 0 && c < size) {
      rowM[c] = val;
      rowR[c] = true;
    }
  }

  // Place Finder Pattern
  function placeFinder(top: number, left: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = top + r;
        const nc = left + c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          const isBorder = r === -1 || r === 7 || c === -1 || c === 7;
          const isOuterBlack = r === 0 || r === 6 || c === 0 || c === 6;
          const isInnerBlack = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          setModule(nr, nc, !isBorder && (isOuterBlack || isInnerBlack));
        }
      }
    }
  }

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setModule(6, i, i % 2 === 0);
    setModule(i, 6, i % 2 === 0);
  }

  // Alignment patterns
  if (spec.alignments.length > 0) {
    for (const ar of spec.alignments) {
      for (const ac of spec.alignments) {
        const rowR = isReserved[ar];
        if (rowR?.[ac]) continue;
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            const isEdge = Math.abs(r) === 2 || Math.abs(c) === 2;
            const isCenter = r === 0 && c === 0;
            setModule(ar + r, ac + c, isEdge || isCenter);
          }
        }
      }
    }
  }

  // Reserve format information areas
  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      if (i < size) {
        const row = isReserved[i];
        if (row) row[8] = true;
      }
      const row8 = isReserved[8];
      if (row8 && i < size) row8[i] = true;
    }
  }
  for (let i = 0; i < 8; i++) {
    const rowBack = isReserved[size - 1 - i];
    if (rowBack) rowBack[8] = true;
    const row8 = isReserved[8];
    if (row8) row8[size - 1 - i] = true;
  }
  setModule(size - 8, 8, true); // Dark module

  // Place codewords with zigzag scanning
  let bitIndex = 0;
  const totalCodewordBits = finalCodewords.length * 8;

  let col = size - 1;
  let dir = -1; // -1 = up, 1 = down

  while (col > 0) {
    if (col === 6) col--; // Skip timing column
    const rStart = dir === -1 ? size - 1 : 0;
    const rEnd = dir === -1 ? -1 : size;

    for (let r = rStart; r !== rEnd; r += dir) {
      for (let c = 0; c < 2; c++) {
        const curCol = col - c;
        const rowR = isReserved[r];
        if (rowR && !rowR[curCol]) {
          let bit = false;
          if (bitIndex < totalCodewordBits) {
            const byteVal = finalCodewords[Math.floor(bitIndex / 8)] ?? 0;
            const bitOffset = 7 - (bitIndex % 8);
            bit = ((byteVal >> bitOffset) & 1) === 1;
            bitIndex++;
          }
          // Mask 0: (r + c) % 2 === 0
          const mask = (r + curCol) % 2 === 0;
          const rowM = modules[r];
          if (rowM) {
            rowM[curCol] = bit !== mask;
          }
        }
      }
    }
    dir = -dir;
    col -= 2;
  }

  // Format info: Level M (00) with Mask 0 (000) -> Pattern 101010000010010
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  const row8 = modules[8];
  if (row8) {
    for (let i = 0; i < 6; i++) row8[i] = formatBits[i] === 1;
    row8[7] = formatBits[6] === 1;
    row8[8] = formatBits[7] === 1;
  }
  const row7 = modules[7];
  if (row7) row7[8] = formatBits[8] === 1;
  for (let i = 9; i < 15; i++) {
    const row = modules[14 - i];
    if (row) row[8] = formatBits[i] === 1;
  }

  // Write format info duplicate around other finders
  for (let i = 0; i < 7; i++) {
    const row = modules[size - 1 - i];
    if (row) row[8] = formatBits[i] === 1;
  }
  if (row8) {
    for (let i = 7; i < 15; i++) {
      row8[size - 15 + i] = formatBits[i] === 1;
    }
  }

  return { size, modules };
}

/**
 * Returns an SVG string representing the QR code with customizable size, margin, and colors.
 */
export function generateQRCodeSvg(
  text: string,
  options: { size?: number; margin?: number; color?: string; background?: string } = {},
): string {
  const { size = 180, margin = 4, color = "#000000", background = "#ffffff" } = options;
  const qr = generateQRCodeMatrix(text);
  const totalUnits = qr.size + margin * 2;

  let pathD = "";
  for (let r = 0; r < qr.size; r++) {
    const row = qr.modules[r];
    if (!row) continue;
    for (let c = 0; c < qr.size; c++) {
      if (row[c]) {
        const x = c + margin;
        const y = r + margin;
        pathD += `M${x},${y}h1v1h-1z `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalUnits} ${totalUnits}" width="${size}" height="${size}" shape-rendering="crispEdges" aria-label="QR Code for ${encodeURIComponent(text)}">
  <rect width="${totalUnits}" height="${totalUnits}" fill="${background}" />
  <path d="${pathD.trim()}" fill="${color}" />
</svg>`;
}
