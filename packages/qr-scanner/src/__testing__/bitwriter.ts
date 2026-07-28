/**
 * A minimal bit writer for hand-building QR bit streams in tests.
 *
 * `@usefy/qr-code` can only produce the modes it encodes (numeric,
 * alphanumeric, byte and ECI 26), so Kanji, Structured Append and FNC1 —
 * modes this scanner must read because other generators emit them — have no
 * oracle to lean on and are written out by hand instead.
 */
export class TestBitWriter {
  private readonly bits: number[] = [];

  push(value: number, length: number): this {
    for (let i = length - 1; i >= 0; i--) this.bits.push((value >>> i) & 1);
    return this;
  }

  /** Mode indicator + character count, at the widths the version dictates. */
  segment(mode: number, count: number, countBits: number): this {
    return this.push(mode, 4).push(count, countBits);
  }

  toBytes(): Uint8Array {
    const bytes = new Uint8Array(Math.ceil(this.bits.length / 8));
    this.bits.forEach((bit, index) => {
      if (bit) bytes[index >>> 3]! |= 0x80 >>> (index & 7);
    });
    return bytes;
  }
}
