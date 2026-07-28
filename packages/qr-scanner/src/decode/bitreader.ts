import { QRDecodeError } from "../errors";

/**
 * Big-endian bit reader over the decoded data codewords.
 *
 * Bounds violations throw rather than returning zero-filled values: a QR bit
 * stream that runs off its end is a corrupt symbol, and silently reading zeros
 * turns that into a plausible-looking wrong payload — the exact failure mode
 * this package refuses to produce (SPEC decision #11).
 */
export class BitReader {
  private position = 0;

  constructor(private readonly data: Readonly<Uint8Array>) {}

  /** Bits not yet consumed. */
  get available(): number {
    return this.data.length * 8 - this.position;
  }

  /** Bits consumed so far — the terminator check needs to know where it is. */
  get offset(): number {
    return this.position;
  }

  /**
   * Read `count` bits, most significant first.
   *
   * @throws {QRDecodeError} when fewer than `count` bits remain.
   */
  read(count: number): number {
    if (count < 0 || count > 32) {
      throw new RangeError(`BitReader.read expects 0–32 bits, got ${count}`);
    }
    if (count > this.available) {
      throw new QRDecodeError(
        "parse",
        `The bit stream ended early: ${count} more bits were requested but only ` +
          `${this.available} remain. The symbol is truncated or misread.`,
      );
    }

    let value = 0;
    for (let i = 0; i < count; i++) {
      const bit = (this.data[this.position >>> 3]! >>> (7 - (this.position & 7))) & 1;
      value = (value << 1) | bit;
      this.position++;
    }
    // `<<` is signed 32-bit; a 32-bit read would come back negative without this.
    return value >>> 0;
  }

  /** Read `count` whole bytes. Faster than `read(8)` in a loop, and clearer. */
  readBytes(count: number): Uint8Array {
    const out = new Uint8Array(count);
    for (let i = 0; i < count; i++) out[i] = this.read(8);
    return out;
  }
}
