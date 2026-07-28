import { describe, expect, it } from "vitest";
import { encodeQR } from "./encodeQR";
import { buildBitStream } from "./bitstream";
import { interleave } from "./interleave";
import { maskAt } from "./mask";
import { segment } from "./segment";
import { codewordModuleOrder, functionPatternMap } from "./matrix";
import {
  MAX_VERSION,
  MIN_VERSION,
  rawDataModules,
  totalCodewords,
  versionSize,
} from "./capacity";
import type { ErrorCorrectionLevel } from "../types";

const VERSIONS = Array.from(
  { length: MAX_VERSION - MIN_VERSION + 1 },
  (_, i) => i + MIN_VERSION,
);

describe("functionPatternMap", () => {
  it.each(VERSIONS)(
    "reserves exactly the modules the capacity formula accounts for (v%i)",
    (version) => {
      const size = versionSize(version);
      const reserved = functionPatternMap(version);
      let count = 0;
      for (const value of reserved) count += value;

      // `rawDataModules` derives the data-module count from published formulas
      // rather than from this drawing code, so agreement is a real cross-check
      // of the geometry: finders, separators, timing, alignment, format and
      // version information all accounted for, none double-counted.
      expect(size * size - count).toBe(rawDataModules(version));
    },
  );

  it("reserves the three finders, the timing rows and the dark module", () => {
    const version = 7;
    const size = versionSize(version);
    const reserved = functionPatternMap(version);
    const at = (x: number, y: number): number => reserved[y * size + x]!;

    expect(at(0, 0)).toBe(1); // top-left finder
    expect(at(size - 1, 0)).toBe(1); // top-right finder
    expect(at(0, size - 1)).toBe(1); // bottom-left finder
    expect(at(6, 10)).toBe(1); // vertical timing
    expect(at(10, 6)).toBe(1); // horizontal timing
    expect(at(8, size - 8)).toBe(1); // dark module
    expect(at(size - 1, size - 1)).toBe(0); // the first data module
  });

  it("has no alignment pattern in version 1 and one in version 2", () => {
    const v1 = functionPatternMap(1);
    const v2 = functionPatternMap(2);
    let v1Count = 0;
    let v2Count = 0;
    for (const value of v1) v1Count += value;
    for (const value of v2) v2Count += value;

    // Version 2 adds a single 5×5 alignment pattern over the same function set.
    expect(v2Count - v1Count).toBe(25 + (versionSize(2) - versionSize(1)) * 2);
  });
});

describe("codewordModuleOrder", () => {
  it.each(VERSIONS)("visits every data module exactly once (v%i)", (version) => {
    const size = versionSize(version);
    const order = codewordModuleOrder(version);
    const reserved = functionPatternMap(version);

    expect(order.length).toBe(rawDataModules(version));
    expect(new Set(order).size).toBe(order.length);

    // Aggregated rather than asserted per module: 30k `expect` calls per
    // version would dominate the suite's runtime for no extra signal.
    let outOfRange = 0;
    let hitsReserved = 0;
    for (const index of order) {
      if (index >= size * size) outOfRange++;
      if (reserved[index] === 1) hitsReserved++;
    }
    expect({ outOfRange, hitsReserved }).toEqual({ outOfRange: 0, hitsReserved: 0 });
  });

  it("starts at the bottom-right corner, as the spec's traversal does", () => {
    const size = versionSize(5);
    expect(codewordModuleOrder(5)[0]).toBe(size * size - 1);
  });

  it("returns one shared, memoized array per version", () => {
    // Both halves of the format walk this order — the scanner up to four times
    // per camera frame — so it is built once and shared. Documented as
    // read-only for exactly that reason.
    expect(codewordModuleOrder(9)).toBe(codewordModuleOrder(9));
    expect(codewordModuleOrder(9)).not.toBe(codewordModuleOrder(10));
  });

  it("does not let a caller's encode disturb a later one", () => {
    // The sharing above is only safe if nothing inside this package writes to
    // the array; encoding twice must produce identical symbols.
    const first = encodeQR("memoized", { version: 9, level: "M", mask: 3 });
    const second = encodeQR("memoized", { version: 9, level: "M", mask: 3 });
    expect(Array.from(second.modules)).toEqual(Array.from(first.modules));
  });
});

/**
 * The anti-divergence test that justifies exporting the traversal at all: walk
 * a finished symbol in the published order, undo the mask, and the codewords
 * must come back byte-identical. This is precisely what `@usefy/qr-scanner`
 * does, so a regression here is a regression in the scanner.
 */
describe("a finished symbol reads back through the published order", () => {
  const cases: Array<[number, ErrorCorrectionLevel, string]> = [
    [1, "L", "42"],
    [2, "M", "USEFY"],
    [7, "Q", "https://usefy.dev/qr"],
    [10, "H", "x".repeat(80)],
    [25, "M", "y".repeat(600)],
    [40, "L", "z".repeat(2000)],
  ];

  it.each(cases)("v%i-%s round trips", (version, level, value) => {
    const matrix = encodeQR(value, { level, version });
    expect(matrix.version).toBe(version);

    const segments = segment(new TextEncoder().encode(value), version);
    const expected = interleave(buildBitStream(segments, version, level, false), version, level);
    expect(expected.length).toBe(totalCodewords(version));

    const order = codewordModuleOrder(version);
    const read = new Uint8Array(expected.length);
    for (let bit = 0; bit < read.length * 8; bit++) {
      const index = order[bit]!;
      const x = index % matrix.size;
      const y = (index / matrix.size) | 0;
      // The stored matrix is masked; XOR the mask back out to recover the bit.
      const bitValue = matrix.modules[index]! ^ (maskAt(matrix.mask, x, y) ? 1 : 0);
      if (bitValue === 1) read[bit >>> 3]! |= 0x80 >>> (bit & 7);
    }

    expect(Array.from(read)).toEqual(Array.from(expected));
  });
});
