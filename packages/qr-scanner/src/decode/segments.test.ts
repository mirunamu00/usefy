import { describe, expect, it } from "vitest";
import { QRDecodeError } from "../errors";
import { parseSegments } from "./segments";
import { TestBitWriter } from "../__testing__/bitwriter";

const NUMERIC = 0b0001;
const ALPHANUMERIC = 0b0010;
const BYTE = 0b0100;
const KANJI = 0b1000;
const ECI = 0b0111;
const STRUCTURED_APPEND = 0b0011;
const FNC1_FIRST = 0b0101;
const FNC1_SECOND = 0b1001;

/** Character-count widths at version 1 (the group used by most tests here). */
const V1 = { numeric: 10, alphanumeric: 9, byte: 8, kanji: 8 };

describe("numeric mode", () => {
  it("decodes triples, pairs and singles", () => {
    for (const digits of ["0", "42", "123", "1234", "12345", "9876543210"]) {
      const writer = new TestBitWriter().segment(NUMERIC, digits.length, V1.numeric);
      let i = 0;
      while (digits.length - i >= 3) {
        writer.push(Number(digits.slice(i, i + 3)), 10);
        i += 3;
      }
      if (digits.length - i === 2) writer.push(Number(digits.slice(i)), 7);
      else if (digits.length - i === 1) writer.push(Number(digits.slice(i)), 4);

      const parsed = parseSegments(writer.toBytes(), 1);
      expect(parsed.segments[0]!.text, digits).toBe(digits);
      expect(parsed.segments[0]!.mode).toBe("numeric");
    }
  });

  it("rejects a triplet outside 0–999", () => {
    const bytes = new TestBitWriter().segment(NUMERIC, 3, V1.numeric).push(1000, 10).toBytes();
    expect(() => parseSegments(bytes, 1)).toThrow(QRDecodeError);
  });

  it("rejects a pair outside 0–99 and a digit outside 0–9", () => {
    const pair = new TestBitWriter().segment(NUMERIC, 2, V1.numeric).push(100, 7).toBytes();
    expect(() => parseSegments(pair, 1)).toThrow(/out of range/);

    const single = new TestBitWriter().segment(NUMERIC, 1, V1.numeric).push(10, 4).toBytes();
    expect(() => parseSegments(single, 1)).toThrow(/out of range/);
  });
});

describe("alphanumeric mode", () => {
  const CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

  it("decodes pairs and a trailing single", () => {
    for (const text of ["A", "AB", "HELLO WORLD", "$%*+-./:"]) {
      const writer = new TestBitWriter().segment(ALPHANUMERIC, text.length, V1.alphanumeric);
      let i = 0;
      while (text.length - i >= 2) {
        writer.push(CHARSET.indexOf(text[i]!) * 45 + CHARSET.indexOf(text[i + 1]!), 11);
        i += 2;
      }
      if (text.length - i === 1) writer.push(CHARSET.indexOf(text[i]!), 6);

      expect(parseSegments(writer.toBytes(), 1).segments[0]!.text, text).toBe(text);
    }
  });

  it("rejects values outside the 45-character alphabet", () => {
    const pair = new TestBitWriter().segment(ALPHANUMERIC, 2, V1.alphanumeric).push(2025, 11).toBytes();
    expect(() => parseSegments(pair, 1)).toThrow(/out of range/);

    const single = new TestBitWriter().segment(ALPHANUMERIC, 1, V1.alphanumeric).push(45, 6).toBytes();
    expect(() => parseSegments(single, 1)).toThrow(/out of range/);
  });
});

describe("byte mode and ECI", () => {
  it("decodes UTF-8 without an ECI header, as real scanners do", () => {
    const bytes = new TextEncoder().encode("héllo ☕");
    const writer = new TestBitWriter().segment(BYTE, bytes.length, V1.byte);
    for (const byte of bytes) writer.push(byte, 8);

    const parsed = parseSegments(writer.toBytes(), 1);
    expect(parsed.segments[0]!.text).toBe("héllo ☕");
    expect(parsed.segments[0]!.eci).toBeUndefined();
  });

  it("falls back to ISO-8859-1 for bytes that are not valid UTF-8", () => {
    const bytes = Uint8Array.from([0xe9, 0xe8, 0xff]); // é è ÿ in Latin-1
    const writer = new TestBitWriter().segment(BYTE, bytes.length, V1.byte);
    for (const byte of bytes) writer.push(byte, 8);

    expect(parseSegments(writer.toBytes(), 1).segments[0]!.text).toBe("éèÿ");
  });

  it("applies a declared ECI charset", () => {
    // ECI 20 is Shift-JIS; 0x82 0xA0 is あ there, and is invalid UTF-8, so a
    // decoder that ignored the ECI would produce mojibake instead.
    const writer = new TestBitWriter().push(ECI, 4).push(20, 8);
    writer.segment(BYTE, 2, V1.byte).push(0x82, 8).push(0xa0, 8);

    const parsed = parseSegments(writer.toBytes(), 1);
    expect(parsed.segments[0]!.eci).toBe(20);
    expect(parsed.segments[0]!.text).toBe("あ");
  });

  it("reads the two- and three-byte ECI designator forms", () => {
    const twoByte = new TestBitWriter().push(ECI, 4).push(0x80, 8).push(26, 8);
    twoByte.segment(BYTE, 1, V1.byte).push(0x41, 8);
    expect(parseSegments(twoByte.toBytes(), 1).segments[0]!.eci).toBe(26);

    const threeByte = new TestBitWriter().push(ECI, 4).push(0xc0, 8).push(0x0000, 16);
    threeByte.segment(BYTE, 1, V1.byte).push(0x41, 8);
    expect(parseSegments(threeByte.toBytes(), 1).segments[0]!.eci).toBe(0);
  });

  it("keeps the bytes when the runtime has no decoder for the declared ECI", () => {
    // ECI 2 is CP437, which the Encoding Standard does not define — the text is
    // dropped rather than decoded with the wrong table, and the bytes survive.
    const writer = new TestBitWriter().push(ECI, 4).push(2, 8);
    writer.segment(BYTE, 2, V1.byte).push(0x9b, 8).push(0x41, 8);

    const segment = parseSegments(writer.toBytes(), 1).segments[0]!;
    expect(segment.text).toBeUndefined();
    expect(Array.from(segment.bytes)).toEqual([0x9b, 0x41]);
  });

  it("rejects a malformed ECI designator", () => {
    const writer = new TestBitWriter().push(ECI, 4).push(0xf0, 8);
    writer.segment(BYTE, 1, V1.byte).push(0x41, 8);
    expect(() => parseSegments(writer.toBytes(), 1)).toThrow(/Malformed ECI/);
  });
});

describe("kanji mode", () => {
  it("decodes Shift-JIS double bytes through the platform decoder", () => {
    // 漢 = SJIS 0x8ABF → 13-bit 1855, 字 = SJIS 0x8E9A → 13-bit 2586.
    const writer = new TestBitWriter().segment(KANJI, 2, V1.kanji);
    writer.push(1855, 13).push(2586, 13);

    const segment = parseSegments(writer.toBytes(), 1).segments[0]!;
    expect(segment.mode).toBe("kanji");
    expect(Array.from(segment.bytes)).toEqual([0x8a, 0xbf, 0x8e, 0x9a]);
    expect(segment.text).toBe("漢字");
  });

  it("uses the narrower Kanji character-count field, not byte mode's", () => {
    // At version 10 byte mode's count is 16 bits but Kanji's is 10. Reading the
    // wrong width does not corrupt one character — it desynchronises the rest
    // of the stream, so this is checked with a following segment.
    const writer = new TestBitWriter().segment(KANJI, 1, 10).push(1855, 13);
    writer.segment(NUMERIC, 3, 12).push(123, 10);

    const parsed = parseSegments(writer.toBytes(), 10);
    expect(parsed.segments.map((segment) => segment.text)).toEqual(["漢", "123"]);
  });

  it("uses the 12-bit Kanji count field at versions 27 and up", () => {
    const writer = new TestBitWriter().segment(KANJI, 1, 12).push(1855, 13);
    writer.segment(NUMERIC, 1, 14).push(7, 4);

    const parsed = parseSegments(writer.toBytes(), 30);
    expect(parsed.segments.map((segment) => segment.text)).toEqual(["漢", "7"]);
  });

  it("decodes the upper Shift-JIS block (base 0xC140)", () => {
    // SJIS 0xE040 → assembled 0x1F00 → the branch that adds 0xC140.
    const writer = new TestBitWriter().segment(KANJI, 1, V1.kanji).push(0x1f00 % 256 + Math.floor(0x1f00 / 256) * 0xc0, 13);
    const segment = parseSegments(writer.toBytes(), 1).segments[0]!;
    expect(Array.from(segment.bytes)).toEqual([0xe0, 0x40]);
  });
});

describe("structured append", () => {
  it("reports the sequence position, total and parity", () => {
    const writer = new TestBitWriter().push(STRUCTURED_APPEND, 4).push(2, 4).push(3, 4).push(0x5a, 8);
    writer.segment(BYTE, 1, V1.byte).push(0x41, 8);

    const parsed = parseSegments(writer.toBytes(), 1);
    expect(parsed.structuredAppend).toEqual({ index: 2, total: 4, parity: 0x5a });
    expect(parsed.segments[0]!.text).toBe("A");
  });

  it("rejects a position outside its own sequence", () => {
    const writer = new TestBitWriter().push(STRUCTURED_APPEND, 4).push(3, 4).push(1, 4).push(0, 8);
    writer.segment(BYTE, 1, V1.byte).push(0x41, 8);
    expect(() => parseSegments(writer.toBytes(), 1)).toThrow(/impossible/);
  });
});

describe("FNC1", () => {
  it("flags a GS1 symbol without touching its data", () => {
    const writer = new TestBitWriter().push(FNC1_FIRST, 4);
    writer.segment(ALPHANUMERIC, 2, V1.alphanumeric).push(0 * 45 + 1, 11);

    const parsed = parseSegments(writer.toBytes(), 1);
    expect(parsed.fnc1).toBe("gs1");
    expect(parsed.fnc1Application).toBeUndefined();
    expect(parsed.segments[0]!.text).toBe("01");
  });

  it("flags an AIM symbol and keeps its application indicator", () => {
    const writer = new TestBitWriter().push(FNC1_SECOND, 4).push(37, 8);
    writer.segment(BYTE, 1, V1.byte).push(0x42, 8);

    const parsed = parseSegments(writer.toBytes(), 1);
    expect(parsed.fnc1).toBe("aim");
    expect(parsed.fnc1Application).toBe(37);
  });
});

describe("stream framing", () => {
  it("stops at the terminator and ignores the padding after it", () => {
    const writer = new TestBitWriter().segment(BYTE, 1, V1.byte).push(0x41, 8);
    writer.push(0b0000, 4); // terminator
    writer.push(0xec, 8).push(0x11, 8).push(0xec, 8); // standard pad codewords

    const parsed = parseSegments(writer.toBytes(), 1);
    expect(parsed.segments).toHaveLength(1);
    expect(parsed.segments[0]!.text).toBe("A");
  });

  it("stops when fewer than four bits remain, with no terminator", () => {
    // 4 + 8 + 8 = 20 bits, padded to 24 → exactly 4 bits spare, which the loop
    // would happily read as a mode indicator. Adding one more bit of payload
    // leaves 3, which is the `available >= 4` exit this test is named for —
    // without it the loop exits through the all-zero terminator instead and the
    // branch goes untested.
    // 4 + 10 + 7 = 21 bits, padded to 24 → exactly 3 spare.
    const writer = new TestBitWriter().segment(NUMERIC, 2, V1.numeric).push(42, 7);
    expect(writer.toBytes().length * 8 - (4 + V1.numeric + 7)).toBe(3);

    const parsed = parseSegments(writer.toBytes(), 1);
    expect(parsed.segments).toHaveLength(1);
    expect(parsed.segments[0]!.text).toBe("42");
  });

  it("rejects an unknown mode indicator", () => {
    const bytes = new TestBitWriter().push(0b1010, 4).push(0, 12).toBytes();
    expect(() => parseSegments(bytes, 1)).toThrow(/Unknown mode indicator/);
  });

  it("rejects a stream that ends mid-segment", () => {
    // Claims 8 bytes, supplies two.
    const writer = new TestBitWriter().segment(BYTE, 8, V1.byte).push(0x41, 8).push(0x42, 8);
    expect(() => parseSegments(writer.toBytes(), 1)).toThrow(/ended early/);
  });

  it("rejects a symbol whose data section carries no segment at all", () => {
    expect(() => parseSegments(new Uint8Array([0x00, 0x00]), 1)).toThrow(/no data segments/);
  });

  it("keeps consecutive segments separate rather than merging them", () => {
    const writer = new TestBitWriter().segment(NUMERIC, 3, V1.numeric).push(123, 10);
    writer.segment(NUMERIC, 3, V1.numeric).push(456, 10);

    const parsed = parseSegments(writer.toBytes(), 1);
    expect(parsed.segments.map((segment) => segment.text)).toEqual(["123", "456"]);
  });
});
