import { describe, expect, it } from "vitest";
import {
  EC_FORMAT_BITS,
  EC_LEVELS,
  EC_RECOVERY_RATIO,
  MAX_VERSION,
  MIN_VERSION,
  MODE_INDICATOR,
  alignmentPatternPositions,
  charCountBits,
  dataCapacityBits,
  dataCodewords,
  ecCodewordsPerBlock,
  numEcBlocks,
  rawDataModules,
  totalCodewords,
  versionSize,
} from "./capacity";

describe("versionSize / rawDataModules / totalCodewords", () => {
  it("sizes symbols as 4v + 17", () => {
    expect(versionSize(1)).toBe(21);
    expect(versionSize(7)).toBe(45);
    expect(versionSize(40)).toBe(177);
  });

  it("matches the published total-codeword counts (ISO Table 1)", () => {
    const published: Record<number, number> = {
      1: 26,
      2: 44,
      3: 70,
      4: 100,
      5: 134,
      6: 172,
      7: 196,
      10: 346,
      20: 1085,
      26: 1706,
      27: 1828,
      32: 2465,
      40: 3706,
    };
    for (const [version, codewords] of Object.entries(published)) {
      expect(totalCodewords(Number(version))).toBe(codewords);
    }
  });

  it("leaves the published number of remainder bits", () => {
    // ISO Table 1, "Remainder bits" column.
    const remainder: Record<number, number> = { 1: 0, 2: 7, 7: 0, 14: 3, 21: 4, 28: 3, 35: 0, 40: 0 };
    for (const [version, bits] of Object.entries(remainder)) {
      const v = Number(version);
      expect(rawDataModules(v) - totalCodewords(v) * 8).toBe(bits);
    }
  });
});

describe("block tables", () => {
  it("matches the published data-codeword counts (ISO Table 7-11)", () => {
    // A spot check across the table's shape: small, mid, and largest versions.
    expect(dataCodewords(1, "L")).toBe(19);
    expect(dataCodewords(1, "M")).toBe(16);
    expect(dataCodewords(1, "Q")).toBe(13);
    expect(dataCodewords(1, "H")).toBe(9);
    expect(dataCodewords(5, "Q")).toBe(62);
    expect(dataCodewords(10, "L")).toBe(274);
    expect(dataCodewords(10, "M")).toBe(216);
    expect(dataCodewords(27, "H")).toBe(628);
    expect(dataCodewords(40, "L")).toBe(2956);
    expect(dataCodewords(40, "H")).toBe(1276);
  });

  it("keeps every version/level combination internally consistent", () => {
    for (let version = MIN_VERSION; version <= MAX_VERSION; version++) {
      for (const level of EC_LEVELS) {
        const blocks = numEcBlocks(version, level);
        const ecPerBlock = ecCodewordsPerBlock(version, level);
        const data = dataCodewords(version, level);

        expect(blocks).toBeGreaterThan(0);
        expect(ecPerBlock).toBeGreaterThan(0);
        expect(data).toBeGreaterThan(0);
        expect(data + ecPerBlock * blocks).toBe(totalCodewords(version));
        // No block may be shorter than its own parity, or RS would be undefined.
        expect(Math.floor(totalCodewords(version) / blocks)).toBeGreaterThan(ecPerBlock);
      }
    }
  });

  it("gives every higher level strictly less payload room", () => {
    for (let version = MIN_VERSION; version <= MAX_VERSION; version++) {
      expect(dataCodewords(version, "L")).toBeGreaterThan(dataCodewords(version, "M"));
      expect(dataCodewords(version, "M")).toBeGreaterThan(dataCodewords(version, "Q"));
      expect(dataCodewords(version, "Q")).toBeGreaterThan(dataCodewords(version, "H"));
    }
  });

  it("reports capacity in bits", () => {
    expect(dataCapacityBits(1, "L")).toBe(19 * 8);
  });
});

describe("alignmentPatternPositions", () => {
  it("has none for version 1", () => {
    expect(alignmentPatternPositions(1)).toEqual([]);
  });

  it("matches the published coordinate table (ISO Annex E)", () => {
    expect(alignmentPatternPositions(2)).toEqual([6, 18]);
    expect(alignmentPatternPositions(7)).toEqual([6, 22, 38]);
    expect(alignmentPatternPositions(14)).toEqual([6, 26, 46, 66]);
    expect(alignmentPatternPositions(21)).toEqual([6, 28, 50, 72, 94]);
    expect(alignmentPatternPositions(32)).toEqual([6, 34, 60, 86, 112, 138]);
    expect(alignmentPatternPositions(40)).toEqual([6, 30, 58, 86, 114, 142, 170]);
  });

  it("always starts at 6, ends 7 modules from the edge, and stays in range", () => {
    for (let version = 2; version <= MAX_VERSION; version++) {
      const positions = alignmentPatternPositions(version);
      expect(positions[0]).toBe(6);
      expect(positions[positions.length - 1]).toBe(versionSize(version) - 7);
      expect(positions.length).toBe(Math.floor(version / 7) + 2);
      for (const position of positions) {
        expect(position).toBeGreaterThanOrEqual(6);
        expect(position).toBeLessThan(versionSize(version) - 6);
      }
    }
  });
});

describe("charCountBits", () => {
  it("widens at versions 10 and 27 (ISO Table 3)", () => {
    expect([charCountBits("numeric", 9), charCountBits("numeric", 10), charCountBits("numeric", 27)]).toEqual([10, 12, 14]);
    expect([charCountBits("alphanumeric", 9), charCountBits("alphanumeric", 10), charCountBits("alphanumeric", 27)]).toEqual([9, 11, 13]);
    expect([charCountBits("byte", 9), charCountBits("byte", 10), charCountBits("byte", 27)]).toEqual([8, 16, 16]);
  });
});

describe("constants", () => {
  it("uses the published mode indicators and format bits", () => {
    expect(MODE_INDICATOR).toEqual({ numeric: 0b0001, alphanumeric: 0b0010, byte: 0b0100 });
    expect(EC_FORMAT_BITS).toEqual({ L: 1, M: 0, Q: 3, H: 2 });
  });

  it("orders the recovery ratios by level", () => {
    expect(EC_RECOVERY_RATIO.L).toBeLessThan(EC_RECOVERY_RATIO.M);
    expect(EC_RECOVERY_RATIO.M).toBeLessThan(EC_RECOVERY_RATIO.Q);
    expect(EC_RECOVERY_RATIO.Q).toBeLessThan(EC_RECOVERY_RATIO.H);
  });
});
