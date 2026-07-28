import { ALPHANUMERIC_CHARSET, charCountBits } from "@usefy/qr-code/headless";
import { QRDecodeError } from "../errors";
import type { QRScanSegment, QRSegmentMode, StructuredAppendInfo } from "../types";
import { BitReader } from "./bitreader";
import { decodeSegmentText, decodeWithLabel } from "./charset";

/**
 * The QR bit stream parser (ISO/IEC 18004 §7.4) — the inverse of
 * `@usefy/qr-code`'s `bitstream.ts` and `segment.ts`, plus the modes that
 * package deliberately does not *write*.
 *
 * A generator only has to emit modes it chose; a scanner meets whatever the
 * rest of the world produced. So Kanji, Structured Append and both FNC1
 * positions are all handled here even though the counterpart encoder never
 * emits them (SPEC decision #7).
 */

/** Mode indicators (ISO Table 2). */
const MODE_TERMINATOR = 0b0000;
const MODE_NUMERIC = 0b0001;
const MODE_ALPHANUMERIC = 0b0010;
const MODE_BYTE = 0b0100;
const MODE_KANJI = 0b1000;
const MODE_ECI = 0b0111;
const MODE_STRUCTURED_APPEND = 0b0011;
const MODE_FNC1_FIRST = 0b0101;
const MODE_FNC1_SECOND = 0b1001;

export interface ParsedBitStream {
  readonly segments: QRScanSegment[];
  readonly structuredAppend?: StructuredAppendInfo;
  readonly fnc1?: "gs1" | "aim";
  readonly fnc1Application?: number;
}

/**
 * Read an ECI assignment number, whose width is announced by its own leading
 * bits: 1 byte for 0–127, 2 for 128–16383, 3 above that.
 */
function readEci(reader: BitReader): number {
  const first = reader.read(8);
  if ((first & 0x80) === 0) return first & 0x7f;
  if ((first & 0xc0) === 0x80) return ((first & 0x3f) << 8) | reader.read(8);
  if ((first & 0xe0) === 0xc0) return ((first & 0x1f) << 16) | reader.read(16);
  throw new QRDecodeError("parse", `Malformed ECI designator (leading byte 0x${first.toString(16)}).`);
}

/** Numeric mode: three digits per 10 bits, with 7- and 4-bit tails. */
function readNumeric(reader: BitReader, charCount: number): Uint8Array {
  const out = new Uint8Array(charCount);
  let index = 0;

  while (charCount - index >= 3) {
    const triple = reader.read(10);
    if (triple >= 1000) {
      throw new QRDecodeError("parse", `Numeric triplet ${triple} is out of range (0–999).`);
    }
    out[index++] = 0x30 + Math.floor(triple / 100);
    out[index++] = 0x30 + (Math.floor(triple / 10) % 10);
    out[index++] = 0x30 + (triple % 10);
  }

  if (charCount - index === 2) {
    const pair = reader.read(7);
    if (pair >= 100) {
      throw new QRDecodeError("parse", `Numeric pair ${pair} is out of range (0–99).`);
    }
    out[index++] = 0x30 + Math.floor(pair / 10);
    out[index++] = 0x30 + (pair % 10);
  } else if (charCount - index === 1) {
    const digit = reader.read(4);
    if (digit >= 10) {
      throw new QRDecodeError("parse", `Numeric digit ${digit} is out of range (0–9).`);
    }
    out[index++] = 0x30 + digit;
  }

  return out;
}

/** Alphanumeric mode: two characters per 11 bits, with a 6-bit tail. */
function readAlphanumeric(reader: BitReader, charCount: number): Uint8Array {
  const out = new Uint8Array(charCount);
  let index = 0;

  while (charCount - index >= 2) {
    const pair = reader.read(11);
    if (pair >= 45 * 45) {
      throw new QRDecodeError("parse", `Alphanumeric pair ${pair} is out of range (0–2024).`);
    }
    out[index++] = ALPHANUMERIC_CHARSET.charCodeAt(Math.floor(pair / 45));
    out[index++] = ALPHANUMERIC_CHARSET.charCodeAt(pair % 45);
  }

  if (charCount - index === 1) {
    const value = reader.read(6);
    if (value >= 45) {
      throw new QRDecodeError("parse", `Alphanumeric value ${value} is out of range (0–44).`);
    }
    out[index++] = ALPHANUMERIC_CHARSET.charCodeAt(value);
  }

  return out;
}

/**
 * Kanji mode: 13 bits per character, holding a Shift-JIS double byte offset by
 * one of two bases. Reassembled into Shift-JIS bytes and handed to
 * `TextDecoder("shift_jis")` — no encoding table ships in this package.
 */
function readKanji(reader: BitReader, charCount: number): Uint8Array {
  const out = new Uint8Array(charCount * 2);
  for (let i = 0; i < charCount; i++) {
    const value = reader.read(13);
    let assembled = ((value / 0xc0) << 8) | (value % 0xc0);
    assembled += assembled < 0x1f00 ? 0x8140 : 0xc140;
    out[i * 2] = (assembled >> 8) & 0xff;
    out[i * 2 + 1] = assembled & 0xff;
  }
  return out;
}

/**
 * Character-count field widths (ISO Table 3).
 *
 * `charCountBits` from `@usefy/qr-code` covers the three modes that encoder
 * writes; Kanji has its own, narrower widths and is added here. Getting this
 * wrong does not produce a wrong character — it desynchronises the whole
 * remaining bit stream — so it is a table, not an approximation.
 */
function countBits(mode: QRSegmentMode, version: number): number {
  if (mode !== "kanji") return charCountBits(mode, version);
  return version <= 9 ? 8 : version <= 26 ? 10 : 12;
}

/** ASCII/Latin-1 bytes → string, chunked so a 7,089-digit payload cannot blow the stack. */
function latin1(bytes: Readonly<Uint8Array>): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 8192) {
    out += String.fromCharCode(...bytes.subarray(i, Math.min(i + 8192, bytes.length)));
  }
  return out;
}

/**
 * Parse the corrected data codewords into segments.
 *
 * Consecutive segments of the same mode and ECI are **not** merged — the
 * segmentation is part of what the symbol said, and a consumer inspecting
 * `segments` should see what was actually encoded.
 *
 * @param data - Error-corrected data codewords.
 * @param version - Symbol version, which sets the character-count field widths.
 * @throws {QRDecodeError} with stage `"parse"` on an unknown mode or a stream
 *   that ends mid-segment.
 */
export function parseSegments(data: Readonly<Uint8Array>, version: number): ParsedBitStream {
  const reader = new BitReader(data);
  const segments: QRScanSegment[] = [];
  let structuredAppend: StructuredAppendInfo | undefined;
  let fnc1: "gs1" | "aim" | undefined;
  let fnc1Application: number | undefined;
  let eci: number | undefined;

  // A symbol whose data section is entirely padding is not a decode failure in
  // the mathematical sense, but it is not a QR payload either.
  let sawSegment = false;

  while (reader.available >= 4) {
    const mode = reader.read(4);
    if (mode === MODE_TERMINATOR) break;

    switch (mode) {
      case MODE_ECI:
        eci = readEci(reader);
        continue;

      case MODE_STRUCTURED_APPEND: {
        const index = reader.read(4);
        const total = reader.read(4) + 1;
        const parity = reader.read(8);
        if (index >= total) {
          throw new QRDecodeError(
            "parse",
            `Structured Append says symbol ${index + 1} of ${total}, which is impossible.`,
          );
        }
        structuredAppend = { index, total, parity };
        continue;
      }

      case MODE_FNC1_FIRST:
        fnc1 = "gs1";
        continue;

      case MODE_FNC1_SECOND:
        fnc1 = "aim";
        fnc1Application = reader.read(8);
        continue;

      case MODE_NUMERIC:
      case MODE_ALPHANUMERIC:
      case MODE_BYTE:
      case MODE_KANJI:
        break;

      default:
        throw new QRDecodeError(
          "parse",
          `Unknown mode indicator 0b${mode.toString(2).padStart(4, "0")} in the bit stream.`,
        );
    }

    const segmentMode: QRSegmentMode =
      mode === MODE_NUMERIC
        ? "numeric"
        : mode === MODE_ALPHANUMERIC
          ? "alphanumeric"
          : mode === MODE_BYTE
            ? "byte"
            : "kanji";

    const count = reader.read(countBits(segmentMode, version));

    let bytes: Uint8Array;
    let text: string | undefined;

    switch (segmentMode) {
      case "numeric":
        bytes = readNumeric(reader, count);
        text = latin1(bytes);
        break;
      case "alphanumeric":
        bytes = readAlphanumeric(reader, count);
        text = latin1(bytes);
        break;
      case "byte":
        bytes = reader.readBytes(count);
        text = decodeSegmentText(bytes, eci);
        break;
      case "kanji":
        bytes = readKanji(reader, count);
        text = decodeWithLabel(bytes, "shift_jis");
        break;
    }

    sawSegment = true;
    // The ECI is reported only where it actually determined the text. Numeric
    // and alphanumeric segments are ASCII by definition, and Kanji is Shift-JIS
    // by definition, so tagging those with whatever ECI happened to be in force
    // would be noise a consumer has to learn to ignore.
    const carriesEci = eci !== undefined && segmentMode === "byte";
    segments.push(
      carriesEci ? { mode: segmentMode, text, bytes, eci } : { mode: segmentMode, text, bytes },
    );
  }

  if (!sawSegment) {
    throw new QRDecodeError("parse", "The symbol carries no data segments.");
  }

  return { segments, structuredAppend, fnc1, fnc1Application };
}
