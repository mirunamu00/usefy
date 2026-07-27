import { describe, expect, it } from "vitest";
import QRCode from "qrcode";
import { encodeQR } from "./encodeQR";
import { dataCapacityBits, versionSize } from "./capacity";
import { QRCapacityError } from "../errors";
import type { ErrorCorrectionLevel } from "../types";
import { decodeMatrix, decodeMatrixBytes } from "../__testing__/decode";

const LEVELS: ErrorCorrectionLevel[] = ["L", "M", "Q", "H"];

describe("encodeQR — round trip through a real decoder", () => {
  const samples: Array<[label: string, value: string]> = [
    ["numeric", "01234567"],
    ["long numeric", "8675309".repeat(20)],
    ["alphanumeric", "HELLO WORLD"],
    ["alphanumeric with punctuation", "HTTPS://USEFY.DEV/QR-CODE $100 50%"],
    ["byte / mixed case", "https://usefy.dev/packages/qr-code"],
    ["mixed modes", "ORDER-4471 total 129900 KRW paid at 20260727T1830"],
    ["single character", "A"],
    ["empty", ""],
  ];

  for (const [label, value] of samples) {
    for (const level of LEVELS) {
      it(`decodes ${label} at level ${level}`, () => {
        const matrix = encodeQR(value, { level });
        expect(decodeMatrix(matrix)).toBe(value);
      });
    }
  }

  it("decodes UTF-8 text through an ECI header", () => {
    const value = "안녕하세요 usefy";
    const matrix = encodeQR(value);
    const bytes = decodeMatrixBytes(matrix);
    expect(bytes).not.toBeNull();
    expect(new TextDecoder().decode(Uint8Array.from(bytes!))).toBe(value);
  });

  it("decodes every mask pattern", () => {
    for (let mask = 0; mask < 8; mask++) {
      const matrix = encodeQR("MASK PATTERN TEST", { mask, level: "Q" });
      expect(matrix.mask).toBe(mask);
      expect(decodeMatrix(matrix)).toBe("MASK PATTERN TEST");
    }
  });

  it("decodes across the version-group boundaries and large symbols", () => {
    // Versions 9/10 and 26/27 are where the character-count fields widen, and
    // 40 exercises the largest block layout in the table.
    for (const version of [1, 9, 10, 26, 27, 40]) {
      const value = `V${version} `.repeat(3) + "USEFY";
      const matrix = encodeQR(value, { version, level: "L" });
      expect(matrix.version).toBe(version);
      expect(matrix.size).toBe(versionSize(version));
      expect(decodeMatrix(matrix)).toBe(value);
    }
  });

  it("decodes a payload that fills a large symbol to capacity", () => {
    const value = "A".repeat(1000);
    const matrix = encodeQR(value, { level: "H" });
    expect(decodeMatrix(matrix)).toBe(value);
  });

  it("decodes raw byte input", () => {
    const bytes = Uint8Array.from([0x00, 0x01, 0x7f, 0x80, 0xff, 0x42]);
    const matrix = encodeQR(bytes, { level: "M" });
    expect(decodeMatrixBytes(matrix)).toEqual(Array.from(bytes));
  });
});

describe("encodeQR — agreement with an independent encoder", () => {
  const samples = [
    "01234567",
    "HELLO WORLD",
    "https://usefy.dev",
    "ORDER-4471 total 129900 KRW",
    "1234567890".repeat(8),
    "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG 0123456789",
  ];

  for (const value of samples) {
    for (const level of LEVELS) {
      it(`matches node-qrcode for ${JSON.stringify(value.slice(0, 24))} at ${level}`, () => {
        // Forcing the mask keeps the comparison about encoding and placement;
        // mask *selection* is validated by the decode round trip above, since
        // encoders legitimately differ on penalty-rule 4 rounding (see mask.ts).
        const expected = QRCode.create(value, { errorCorrectionLevel: level, maskPattern: 3 });
        const actual = encodeQR(value, { level, mask: 3 });

        expect(actual.version).toBe(expected.version);
        expect(actual.size).toBe(expected.modules.size);
        expect(Array.from(actual.modules)).toEqual(Array.from(expected.modules.data));
      });
    }
  }
});

describe("encodeQR — version and mode selection", () => {
  it("picks the smallest version that fits", () => {
    expect(encodeQR("A", { level: "L" }).version).toBe(1);
    expect(encodeQR("A".repeat(200), { level: "L" }).version).toBeGreaterThan(1);
  });

  it("honours minVersion without changing what is encoded", () => {
    const matrix = encodeQR("HELLO", { minVersion: 10 });
    expect(matrix.version).toBe(10);
    expect(decodeMatrix(matrix)).toBe("HELLO");
  });

  it("grows the version as the error-correction level rises", () => {
    const value = "https://usefy.dev/packages/qr-code#error-correction";
    const versions = LEVELS.map((level) => encodeQR(value, { level }).version);
    // Monotonically non-decreasing L → H.
    expect(versions).toEqual([...versions].sort((a, b) => a - b));
    expect(versions[3]!).toBeGreaterThan(versions[0]!);
  });

  it("encodes digits more densely than the same characters as bytes", () => {
    const digits = "1".repeat(100);
    const letters = "a".repeat(100);
    expect(encodeQR(digits, { level: "M" }).version).toBeLessThan(
      encodeQR(letters, { level: "M" }).version,
    );
  });

  it("is deterministic", () => {
    const a = encodeQR("https://usefy.dev", { level: "Q" });
    const b = encodeQR("https://usefy.dev", { level: "Q" });
    expect(a.mask).toBe(b.mask);
    expect(Array.from(a.modules)).toEqual(Array.from(b.modules));
  });

  it("skips the ECI header when eci is disabled", () => {
    const withEci = encodeQR("é", { eci: true, version: 1, level: "L" });
    const withoutEci = encodeQR("é", { eci: false, version: 1, level: "L" });
    expect(Array.from(withEci.modules)).not.toEqual(Array.from(withoutEci.modules));
  });

  it("never adds an ECI header to raw bytes", () => {
    const bytes = Uint8Array.from([0xc3, 0xa9]);
    const asBytes = encodeQR(bytes, { version: 1, level: "L" });
    const asText = encodeQR("é", { eci: false, version: 1, level: "L" });
    expect(Array.from(asBytes.modules)).toEqual(Array.from(asText.modules));
  });
});

describe("encodeQR — matrix invariants", () => {
  it("exposes reserved function patterns and reads out of range as light", () => {
    const matrix = encodeQR("USEFY", { level: "M" });
    // The top-left finder centre is dark and reserved.
    expect(matrix.get(3, 3)).toBe(true);
    expect(matrix.isReserved(3, 3)).toBe(true);
    // The dark module is always dark.
    expect(matrix.get(8, matrix.size - 8)).toBe(true);
    // Out of range.
    expect(matrix.get(-1, 0)).toBe(false);
    expect(matrix.get(0, matrix.size)).toBe(false);
    expect(matrix.isReserved(-1, 0)).toBe(false);
    expect(matrix.isReserved(matrix.size, 0)).toBe(false);
  });

  it("draws all three finder patterns", () => {
    const matrix = encodeQR("USEFY");
    const corners = [
      [3, 3],
      [matrix.size - 4, 3],
      [3, matrix.size - 4],
    ] as const;
    for (const [cx, cy] of corners) {
      expect(matrix.get(cx, cy)).toBe(true); // 3×3 dark centre
      expect(matrix.get(cx - 1, cy)).toBe(true);
      expect(matrix.get(cx - 2, cy)).toBe(false); // light ring
      expect(matrix.get(cx - 3, cy)).toBe(true); // dark outer ring
    }
  });

  it("keeps the timing patterns alternating", () => {
    const matrix = encodeQR("USEFY", { version: 7, level: "M" });
    for (let i = 8; i < matrix.size - 8; i++) {
      expect(matrix.get(6, i)).toBe(i % 2 === 0);
      expect(matrix.get(i, 6)).toBe(i % 2 === 0);
    }
  });
});

describe("encodeQR — errors", () => {
  it("throws QRCapacityError when the data cannot fit at all", () => {
    let thrown: unknown;
    try {
      encodeQR("A".repeat(5000), { level: "H" });
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(QRCapacityError);
    const error = thrown as QRCapacityError;
    expect(error.name).toBe("QRCapacityError");
    expect(error.level).toBe("H");
    expect(error.maxVersion).toBe(40);
    expect(error.capacity).toBe(dataCapacityBits(40, "H"));
    expect(error.needed).toBeGreaterThan(error.capacity);
    expect(error.message).toContain("does not fit");
  });

  it("throws QRCapacityError when a forced version is too small", () => {
    expect(() => encodeQR("A".repeat(100), { version: 1, level: "L" })).toThrow(QRCapacityError);
    try {
      encodeQR("A".repeat(100), { version: 1, level: "L" });
    } catch (error) {
      expect((error as QRCapacityError).maxVersion).toBe(1);
    }
  });

  it("rejects out-of-range versions, levels and masks", () => {
    expect(() => encodeQR("A", { version: 0 })).toThrow(RangeError);
    expect(() => encodeQR("A", { version: 41 })).toThrow(RangeError);
    expect(() => encodeQR("A", { version: 1.5 })).toThrow(RangeError);
    expect(() => encodeQR("A", { minVersion: 99 })).toThrow(RangeError);
    expect(() => encodeQR("A", { level: "X" as ErrorCorrectionLevel })).toThrow(RangeError);
    expect(() => encodeQR("A", { mask: 8 })).toThrow(RangeError);
    expect(() => encodeQR("A", { mask: -1 })).toThrow(RangeError);
    expect(() => encodeQR("A", { mask: 1.5 })).toThrow(RangeError);
  });
});
