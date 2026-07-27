import { describe, expect, it } from "vitest";
import { BitWriter, buildBitStream, writeSegmentPayload } from "./bitstream";
import { dataCodewords } from "./capacity";
import { segment, utf8Encode } from "./segment";
import { QRCapacityError } from "../errors";
import type { QRSegment } from "../types";

const seg = (mode: QRSegment["mode"], text: string): QRSegment => {
  const data = utf8Encode(text);
  return { mode, charCount: data.length, data };
};

const bitsOf = (writer: BitWriter): string =>
  Array.from(writer.toUint8Array())
    .map((b) => b.toString(2).padStart(8, "0"))
    .join("")
    .slice(0, writer.length);

describe("BitWriter", () => {
  it("writes most-significant bit first and tracks its length", () => {
    const writer = new BitWriter();
    writer.push(0b101, 3);
    writer.push(0b1, 1);
    expect(writer.length).toBe(4);
    expect(bitsOf(writer)).toBe("1011");
  });

  it("spans byte boundaries", () => {
    const writer = new BitWriter();
    writer.push(0b1111, 4);
    writer.push(0b000011110000, 12);
    expect(writer.length).toBe(16);
    expect(Array.from(writer.toUint8Array())).toEqual([0b11110000, 0b11110000]);
  });

  it("zero-pads the final byte", () => {
    const writer = new BitWriter();
    writer.push(1, 1);
    expect(Array.from(writer.toUint8Array())).toEqual([0b10000000]);
  });

  it("accepts a zero-width write and rejects impossible widths", () => {
    const writer = new BitWriter();
    writer.push(0, 0);
    expect(writer.length).toBe(0);
    expect(() => writer.push(0, -1)).toThrow(RangeError);
    expect(() => writer.push(0, 33)).toThrow(RangeError);
  });
});

describe("writeSegmentPayload", () => {
  it("packs numeric digits 3 → 10 bits, 2 → 7 bits, 1 → 4 bits", () => {
    const three = new BitWriter();
    writeSegmentPayload(three, seg("numeric", "867"));
    expect(bitsOf(three)).toBe((867).toString(2).padStart(10, "0"));

    const two = new BitWriter();
    writeSegmentPayload(two, seg("numeric", "86"));
    expect(bitsOf(two)).toBe((86).toString(2).padStart(7, "0"));

    const one = new BitWriter();
    writeSegmentPayload(one, seg("numeric", "8"));
    expect(bitsOf(one)).toBe((8).toString(2).padStart(4, "0"));

    const four = new BitWriter();
    writeSegmentPayload(four, seg("numeric", "8675"));
    expect(four.length).toBe(14);
  });

  it("packs alphanumeric pairs as a·45 + b, and a lone character in 6 bits", () => {
    const pair = new BitWriter();
    writeSegmentPayload(pair, seg("alphanumeric", "AB"));
    // 'A' = 10, 'B' = 11 → 10 * 45 + 11 = 461
    expect(bitsOf(pair)).toBe((461).toString(2).padStart(11, "0"));

    const single = new BitWriter();
    writeSegmentPayload(single, seg("alphanumeric", "A"));
    expect(bitsOf(single)).toBe((10).toString(2).padStart(6, "0"));
  });

  it("writes bytes verbatim", () => {
    const writer = new BitWriter();
    writeSegmentPayload(writer, { mode: "byte", charCount: 2, data: Uint8Array.from([0xab, 0x00]) });
    expect(Array.from(writer.toUint8Array())).toEqual([0xab, 0x00]);
  });
});

describe("buildBitStream", () => {
  it("reproduces the worked example from ISO/IEC 18004 Annex I", () => {
    // "01234567" at version 1-M.
    const codewords = buildBitStream(segment(utf8Encode("01234567"), 1), 1, "M", false);
    expect(Array.from(codewords)).toEqual([
      0x10, 0x20, 0x0c, 0x56, 0x61, 0x80, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11, 0xec,
      0x11,
    ]);
  });

  it("always fills the version's exact data capacity", () => {
    for (const level of ["L", "M", "Q", "H"] as const) {
      for (const version of [1, 5, 12, 28, 40]) {
        const codewords = buildBitStream(segment(utf8Encode("USEFY"), version), version, level, false);
        expect(codewords.length).toBe(dataCodewords(version, level));
      }
    }
  });

  it("alternates the 0xEC / 0x11 pad codewords", () => {
    const codewords = buildBitStream(segment(utf8Encode("A"), 1), 1, "L", false);
    const pads = Array.from(codewords.slice(-6));
    expect(pads).toEqual([0xec, 0x11, 0xec, 0x11, 0xec, 0x11]);
  });

  it("prefixes an ECI header when asked", () => {
    // 0111 (ECI mode) 00011010 (assignment 26) 0100 (byte mode) 00000010 (2 bytes) …
    const withEci = buildBitStream(segment(utf8Encode("é"), 1), 1, "L", true);
    expect(withEci[0]).toBe(0b01110001);
    expect(withEci[1]).toBe(0b10100100);
    expect(withEci[2]).toBe(0b00000010);

    const withoutEci = buildBitStream(segment(utf8Encode("é"), 1), 1, "L", false);
    expect(withoutEci[0]).toBe(0b01000000); // straight into byte mode
  });

  it("omits the terminator when the stream exactly fills capacity", () => {
    // 19 codewords at 1-L; 17 bytes of payload plus a 4+8 bit header is 148
    // bits, leaving 4 — exactly the terminator, and nothing after it.
    const version = 1;
    const capacity = dataCodewords(version, "L") * 8;
    const payloadBytes = Math.floor((capacity - 4 - 8) / 8);
    const text = "x".repeat(payloadBytes);
    const codewords = buildBitStream(segment(utf8Encode(text), version), version, "L", false);
    expect(codewords.length).toBe(dataCodewords(version, "L"));
    expect(codewords[codewords.length - 1]).not.toBe(0xec);
  });

  it("throws QRCapacityError when the segments overflow the version", () => {
    const text = "A".repeat(200);
    expect(() => buildBitStream(segment(utf8Encode(text), 1), 1, "L", false)).toThrow(
      QRCapacityError,
    );
  });

  it("throws when a segment exceeds its character-count field", () => {
    // Byte mode at versions 1–9 has an 8-bit count: 255 characters maximum.
    const data = utf8Encode("x".repeat(256));
    expect(() =>
      buildBitStream([{ mode: "byte", charCount: 256, data }], 9, "L", false),
    ).toThrow(/character count field/);
  });
});
