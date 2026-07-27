import { describe, expect, it } from "vitest";
import { generatorPoly, rsEncode } from "./reedSolomon";

describe("generatorPoly", () => {
  it("matches the published degree-7 generator (ISO Annex A)", () => {
    // x⁷ + α⁸⁷x⁶ + α²²⁹x⁵ + α¹⁴⁶x⁴ + α¹⁴⁹x³ + α²³⁸x² + α¹⁰²x + α²¹
    expect(Array.from(generatorPoly(7))).toEqual([1, 127, 122, 154, 164, 11, 68, 117]);
  });

  it("matches the published degree-10 generator", () => {
    expect(Array.from(generatorPoly(10))).toEqual([1, 216, 194, 159, 111, 199, 94, 95, 113, 157, 193]);
  });

  it("is monic and has degree + 1 coefficients", () => {
    for (const degree of [7, 10, 13, 15, 16, 17, 18, 20, 22, 24, 26, 28, 30]) {
      const poly = generatorPoly(degree);
      expect(poly.length).toBe(degree + 1);
      expect(poly[0]).toBe(1);
    }
  });

  it("hands out a fresh copy, so a caller cannot poison the cache", () => {
    const first = generatorPoly(18);
    expect(generatorPoly(18)).not.toBe(first);
    expect(Array.from(generatorPoly(18))).toEqual(Array.from(first));

    first[0] = 99;
    expect(generatorPoly(18)[0]).toBe(1);
  });

  it("rejects invalid degrees", () => {
    expect(() => generatorPoly(0)).toThrow(RangeError);
    expect(() => generatorPoly(-1)).toThrow(RangeError);
    expect(() => generatorPoly(2.5)).toThrow(RangeError);
  });
});

describe("rsEncode", () => {
  it("reproduces the worked example from ISO/IEC 18004 Annex I", () => {
    // Data codewords for "01234567" at version 1-M, and the ten EC codewords
    // the standard's worked example derives from them.
    const data = Uint8Array.from([
      0x10, 0x20, 0x0c, 0x56, 0x61, 0x80, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11, 0xec,
      0x11,
    ]);
    expect(Array.from(rsEncode(data, 10))).toEqual([
      0xa5, 0x24, 0xd4, 0xc1, 0xed, 0x36, 0xc7, 0x87, 0x2c, 0x55,
    ]);
  });

  it("produces exactly ecLength codewords", () => {
    const data = Uint8Array.from({ length: 34 }, (_, i) => i * 7);
    for (const ecLength of [7, 15, 22, 30]) {
      expect(rsEncode(data, ecLength).length).toBe(ecLength);
    }
  });

  it("handles all-zero data (every intermediate factor is zero)", () => {
    expect(Array.from(rsEncode(new Uint8Array(16), 10))).toEqual(new Array(10).fill(0));
  });

  it("changes parity when any single data codeword changes", () => {
    const data = Uint8Array.from({ length: 16 }, (_, i) => i);
    const base = Array.from(rsEncode(data, 10));
    for (let i = 0; i < data.length; i++) {
      const mutated = Uint8Array.from(data);
      mutated[i]! ^= 0xff;
      expect(Array.from(rsEncode(mutated, 10))).not.toEqual(base);
    }
  });
});
