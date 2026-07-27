import { describe, expect, it } from "vitest";
import { formatInfoBits, versionInfoBits } from "./info";
import type { ErrorCorrectionLevel } from "../types";

describe("formatInfoBits", () => {
  it("matches all 32 published format-information strings (ISO Table 25)", () => {
    // Indexed by the 5-bit data word `(ecFormatBits << 3) | mask`, i.e. the
    // order M(00), L(01), H(10), Q(11) — the same order as the decode table
    // every scanner ships.
    const published = [
      0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0, // M, masks 0–7
      0x77c4, 0x72f3, 0x7daa, 0x789d, 0x662f, 0x6318, 0x6c41, 0x6976, // L
      0x1689, 0x13be, 0x1ce7, 0x19d0, 0x0762, 0x0255, 0x0d0c, 0x083b, // H
      0x355f, 0x3068, 0x3f31, 0x3a06, 0x24b4, 0x2183, 0x2eda, 0x2bed, // Q
    ];
    const order: ErrorCorrectionLevel[] = ["M", "L", "H", "Q"];

    order.forEach((level, block) => {
      for (let mask = 0; mask < 8; mask++) {
        expect(formatInfoBits(level, mask)).toBe(published[block * 8 + mask]);
      }
    });
  });

  it("leaves a symbol with level M and mask 0 as the bare XOR constant", () => {
    // Its data word is zero, so the whole 15-bit field is just the mask —
    // which is exactly why the spec applies one: an all-zero field would be
    // indistinguishable from a blank region.
    expect(formatInfoBits("M", 0)).toBe(0x5412);
  });

  it("keeps every format word at least 3 bits apart (the BCH guarantee)", () => {
    const words: number[] = [];
    for (const level of ["L", "M", "Q", "H"] as const) {
      for (let mask = 0; mask < 8; mask++) words.push(formatInfoBits(level, mask));
    }
    for (let i = 0; i < words.length; i++) {
      for (let j = i + 1; j < words.length; j++) {
        let distance = 0;
        for (let bit = 0; bit < 15; bit++) {
          if (((words[i]! ^ words[j]!) >>> bit) & 1) distance++;
        }
        expect(distance).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

describe("versionInfoBits", () => {
  it("matches the published version-information strings (ISO Table 26)", () => {
    const expected: Record<number, number> = {
      7: 0x07c94,
      8: 0x085bc,
      9: 0x09a99,
      10: 0x0a4d3,
      15: 0x0f928,
      21: 0x15683,
      30: 0x1ed75,
      40: 0x28c69,
    };
    for (const [version, bits] of Object.entries(expected)) {
      expect(versionInfoBits(Number(version))).toBe(bits);
    }
  });

  it("carries the version in its top six bits", () => {
    for (let version = 7; version <= 40; version++) {
      expect(versionInfoBits(version) >>> 12).toBe(version);
    }
  });
});
