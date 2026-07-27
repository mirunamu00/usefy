import type { ErrorCorrectionLevel, QRSegment } from "../types";
import { QRCapacityError } from "../errors";
import { MODE_INDICATOR, charCountBits, dataCapacityBits } from "./capacity";
import { ECI_UTF8, alphanumericValue } from "./segment";

/**
 * Bit-level assembly of the data codewords (ISO/IEC 18004 §7.4).
 *
 * Segments are written most-significant-bit first, then the stream is closed
 * with a terminator, padded to a byte boundary, and filled to the version's
 * exact data capacity with the alternating 0xEC / 0x11 pad codewords the spec
 * mandates.
 */

/** An MSB-first bit accumulator. */
export class BitWriter {
  private readonly bytes: number[] = [];
  private bits = 0;

  /** Bits written so far. */
  get length(): number {
    return this.bits;
  }

  /** Append the low `count` bits of `value`, most-significant first. */
  push(value: number, count: number): void {
    if (count < 0 || count > 32) {
      throw new RangeError(`Cannot write ${count} bits at once`);
    }
    for (let i = count - 1; i >= 0; i--) {
      const bit = (value >>> i) & 1;
      const byteIndex = this.bits >>> 3;
      if (byteIndex === this.bytes.length) this.bytes.push(0);
      this.bytes[byteIndex]! |= bit << (7 - (this.bits & 7));
      this.bits++;
    }
  }

  /** The written bits as bytes, zero-padded to the next byte boundary. */
  toUint8Array(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}

/** Write one segment's payload (no mode indicator, no character count). */
export function writeSegmentPayload(writer: BitWriter, segment: QRSegment): void {
  const { data } = segment;
  switch (segment.mode) {
    case "numeric": {
      let i = 0;
      for (; i + 3 <= data.length; i += 3) {
        const value =
          (data[i]! - 0x30) * 100 + (data[i + 1]! - 0x30) * 10 + (data[i + 2]! - 0x30);
        writer.push(value, 10);
      }
      const rest = data.length - i;
      if (rest === 2) {
        writer.push((data[i]! - 0x30) * 10 + (data[i + 1]! - 0x30), 7);
      } else if (rest === 1) {
        writer.push(data[i]! - 0x30, 4);
      }
      break;
    }
    case "alphanumeric": {
      let i = 0;
      for (; i + 2 <= data.length; i += 2) {
        writer.push(alphanumericValue(data[i]!) * 45 + alphanumericValue(data[i + 1]!), 11);
      }
      if (i < data.length) writer.push(alphanumericValue(data[i]!), 6);
      break;
    }
    case "byte": {
      for (let i = 0; i < data.length; i++) writer.push(data[i]!, 8);
      break;
    }
  }
}

/**
 * Segments → the full data-codeword block for a version and level.
 *
 * @param segments - Mode-split payload.
 * @param version - Symbol version 1–40.
 * @param level - Error-correction level.
 * @param eci - Prefix an ECI 26 (UTF-8) header.
 * @throws {QRCapacityError} when the segments exceed the version's capacity.
 */
export function buildBitStream(
  segments: readonly QRSegment[],
  version: number,
  level: ErrorCorrectionLevel,
  eci: boolean,
): Uint8Array {
  const capacityBits = dataCapacityBits(version, level);
  const writer = new BitWriter();

  if (eci) {
    writer.push(0b0111, 4);
    writer.push(ECI_UTF8, 8);
  }

  for (const segment of segments) {
    const countBits = charCountBits(segment.mode, version);
    if (segment.charCount >= 1 << countBits) {
      throw new RangeError(
        `Segment of ${segment.charCount} ${segment.mode} characters exceeds the ` +
          `${countBits}-bit character count field at version ${version}`,
      );
    }
    writer.push(MODE_INDICATOR[segment.mode], 4);
    writer.push(segment.charCount, countBits);
    writeSegmentPayload(writer, segment);
  }

  if (writer.length > capacityBits) {
    throw new QRCapacityError({
      needed: writer.length,
      capacity: capacityBits,
      level,
      maxVersion: version,
    });
  }

  // Terminator (up to four zero bits), then pad to a whole byte.
  writer.push(0, Math.min(4, capacityBits - writer.length));
  writer.push(0, (8 - (writer.length % 8)) % 8);

  const written = writer.toUint8Array();
  const codewords = new Uint8Array(capacityBits / 8);
  codewords.set(written);
  for (let i = written.length, pad = 0xec; i < codewords.length; i++, pad ^= 0xec ^ 0x11) {
    codewords[i] = pad;
  }
  return codewords;
}
