import type { QRSegment, QRSegmentMode } from "../types";
import { charCountBits } from "./capacity";

/**
 * Mode segmentation (ISO/IEC 18004 §7.4).
 *
 * A QR payload may switch encoding mode mid-stream, and choosing where to
 * switch is a real optimization: `"HELLO 12345678901234"` is smaller as an
 * alphanumeric run followed by a numeric run than as either one alone, but
 * only once the run is long enough to repay the ~13-bit mode header.
 *
 * This is a dynamic program over (position × mode) that costs each byte in
 * sixths of a bit — numeric is 10/3 bits per digit and alphanumeric 11/2, both
 * exact in sixths — so the boundaries are chosen on exact arithmetic instead of
 * rounding. The final bit length is then computed exactly by
 * {@link segmentsBitLength}.
 */

/** The 45 characters alphanumeric mode can encode, in value order (ISO Table 5). */
export const ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

const ALPHANUMERIC_VALUES = (() => {
  const map = new Int8Array(128).fill(-1);
  for (let i = 0; i < ALPHANUMERIC_CHARSET.length; i++) {
    map[ALPHANUMERIC_CHARSET.charCodeAt(i)] = i;
  }
  return map;
})();

/** ECI assignment number for UTF-8 (ISO/IEC 18004 Table 4). */
export const ECI_UTF8 = 26;

/** Bits an ECI header occupies for an assignment number below 128. */
export const ECI_HEADER_BITS = 4 + 8;

/** Is this byte an ASCII digit? */
export function isNumericByte(byte: number): boolean {
  return byte >= 0x30 && byte <= 0x39;
}

/** The alphanumeric value of a byte, or -1 when the mode can't encode it. */
export function alphanumericValue(byte: number): number {
  return byte < 128 ? ALPHANUMERIC_VALUES[byte]! : -1;
}

/** UTF-8 encode, using the platform encoder when present. */
export function utf8Encode(text: string): Uint8Array {
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(text);
  // Node < 11 / exotic runtimes. Correct for the full BMP + surrogate pairs.
  const out: number[] = [];
  for (let i = 0; i < text.length; i++) {
    let code = text.codePointAt(i)!;
    if (code > 0xffff) i++;
    if (code < 0x80) out.push(code);
    else if (code < 0x800) out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    else if (code < 0x10000) {
      out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      out.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }
  return new Uint8Array(out);
}

/** True when the text needs an ECI header to be decoded as UTF-8. */
export function needsUtf8Eci(bytes: Readonly<Uint8Array>): boolean {
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i]! > 0x7f) return true;
  }
  return false;
}

const MODES: readonly QRSegmentMode[] = ["numeric", "alphanumeric", "byte"];
/** Cost per character in sixths of a bit: 10/3, 11/2, and 8 bits. */
const CHAR_COST_SIXTHS = [20, 33, 48] as const;

function canEncode(byte: number, modeIndex: number): boolean {
  if (modeIndex === 0) return isNumericByte(byte);
  if (modeIndex === 1) return alphanumericValue(byte) >= 0;
  return true;
}

/**
 * Split bytes into the cheapest sequence of mode segments for a given version.
 *
 * The version matters because character-count indicators widen at versions 10
 * and 27, which changes how long a run must be to repay a mode switch.
 */
export function segment(bytes: Readonly<Uint8Array>, version: number): QRSegment[] {
  if (bytes.length === 0) {
    return [{ mode: "byte", charCount: 0, data: new Uint8Array(0) }];
  }

  const headCost = MODES.map((mode) => (4 + charCountBits(mode, version)) * 6);
  // cost[m] — cheapest encoding of the prefix processed so far that ends in mode m.
  let cost: number[] = [Infinity, Infinity, Infinity];
  // from[i][m] — the mode byte i-1 ended in, on the best path where byte i is in mode m.
  const from: Int8Array[] = [];

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i]!;
    const next: number[] = [Infinity, Infinity, Infinity];
    const back = new Int8Array(3).fill(-1);

    for (let m = 0; m < 3; m++) {
      if (!canEncode(byte, m)) continue;
      if (i === 0) {
        next[m] = headCost[m]! + CHAR_COST_SIXTHS[m];
        continue;
      }
      // Byte mode encodes every byte, so `cost[2]` is finite from the first
      // iteration onward and this search always finds a predecessor.
      let best = Infinity;
      let bestFrom = 2;
      for (let p = 0; p < 3; p++) {
        if (cost[p] === Infinity) continue;
        const candidate = cost[p]! + (p === m ? 0 : headCost[m]!);
        // Ties prefer staying in the current mode: fewer, longer segments.
        if (candidate < best || (candidate === best && p === m)) {
          best = candidate;
          bestFrom = p;
        }
      }
      next[m] = best + CHAR_COST_SIXTHS[m];
      back[m] = bestFrom;
    }

    cost = next;
    from.push(back);
  }

  // Backtrack from the cheapest terminal mode.
  let mode = 0;
  for (let m = 1; m < 3; m++) {
    if (cost[m]! < cost[mode]!) mode = m;
  }
  const modeOfByte = new Int8Array(bytes.length);
  for (let i = bytes.length - 1; i >= 0; i--) {
    modeOfByte[i] = mode;
    const previous = from[i]![mode]!;
    if (i > 0) mode = previous;
  }

  // Collapse equal-mode runs into segments.
  const segments: QRSegment[] = [];
  let start = 0;
  for (let i = 1; i <= bytes.length; i++) {
    if (i === bytes.length || modeOfByte[i] !== modeOfByte[start]) {
      const data = bytes.slice(start, i);
      segments.push({
        mode: MODES[modeOfByte[start]!]!,
        charCount: data.length,
        data,
      });
      start = i;
    }
  }
  return segments;
}

/** Exact bit length of a segment's payload, excluding its header. */
export function segmentPayloadBits(mode: QRSegmentMode, charCount: number): number {
  switch (mode) {
    case "numeric": {
      const groups = Math.floor(charCount / 3);
      const rest = charCount % 3;
      return groups * 10 + (rest === 0 ? 0 : rest === 1 ? 4 : 7);
    }
    case "alphanumeric":
      return Math.floor(charCount / 2) * 11 + (charCount % 2) * 6;
    case "byte":
      return charCount * 8;
  }
}

/** Exact bit length of a whole segment list at a given version, headers included. */
export function segmentsBitLength(segments: readonly QRSegment[], version: number): number {
  let bits = 0;
  for (const seg of segments) {
    bits += 4 + charCountBits(seg.mode, version) + segmentPayloadBits(seg.mode, seg.charCount);
  }
  return bits;
}
