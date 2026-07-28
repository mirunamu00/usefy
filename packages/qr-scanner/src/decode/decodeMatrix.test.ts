import { describe, expect, it, vi } from "vitest";
import {
  EC_LEVELS,
  MAX_VERSION,
  MIN_VERSION,
  dataCodewords,
  ecCodewordsPerBlock,
  encodeQR,
  functionPatternMap,
  numEcBlocks,
  type ErrorCorrectionLevel,
} from "@usefy/qr-code/headless";
import { QRDecodeError } from "../errors";
import { decodeMatrix } from "./decodeMatrix";
import {
  damageAnyModules,
  damageDataModules,
  gridFromMatrix,
  seededRandom,
  symbolWithBitStream,
} from "../__testing__/fixtures";
import { TestBitWriter } from "../__testing__/bitwriter";

/**
 * The oracle suite (SPEC §7): `@usefy/qr-code` produces both the symbol and the
 * payload it must decode to, so every assertion here is exact. Nothing in this
 * file trusts the decoder to check itself.
 */

/** A payload that fits the given version and level, in each of the three modes. */
function payloadFor(version: number, level: ErrorCorrectionLevel, mode: string): string {
  // Bits available minus a generous allowance for mode + count headers.
  const bits = dataCodewords(version, level) * 8 - 40;
  switch (mode) {
    case "numeric": {
      const digits = Math.max(1, Math.floor((bits * 3) / 10));
      return Array.from({ length: digits }, (_, i) => String(i % 10)).join("");
    }
    case "alphanumeric": {
      const chars = Math.max(1, Math.floor((bits * 2) / 11));
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 $%*+-./:";
      return Array.from({ length: chars }, (_, i) => alphabet[i % alphabet.length]).join("");
    }
    default: {
      const bytes = Math.max(1, Math.floor(bits / 8));
      return Array.from({ length: bytes }, (_, i) =>
        String.fromCharCode(0x21 + (i % 0x5d)),
      ).join("");
    }
  }
}

describe("the encoder → decoder round trip", () => {
  const versions = Array.from(
    { length: MAX_VERSION - MIN_VERSION + 1 },
    (_, i) => i + MIN_VERSION,
  );

  // 160 combinations, one assertion each: the claim in SPEC §10 is that every
  // version × level pair this package's counterpart can produce reads back.
  it(
    "reads back all 160 version × level combinations",
    () => {
      const failures: string[] = [];
      for (const version of versions) {
        for (const level of EC_LEVELS) {
          const value = payloadFor(version, level, "byte");
          const matrix = encodeQR(value, { version, level });
          const result = decodeMatrix(gridFromMatrix(matrix));
          if (result.text !== value) {
            failures.push(`v${version}-${level}: text mismatch`);
            continue;
          }
          if (
            result.symbol?.version !== version ||
            result.symbol.level !== level ||
            result.symbol.mask !== matrix.mask ||
            result.symbol.mirrored ||
            result.symbol.errorsCorrected !== 0
          ) {
            failures.push(`v${version}-${level}: metadata mismatch`);
          }
        }
      }
      expect(failures).toEqual([]);
    },
    120_000,
  );

  it.each(["numeric", "alphanumeric", "byte"] as const)(
    "reads back %s payloads across the version groups",
    (mode) => {
      // Versions 9/10 and 26/27 straddle the character-count width changes,
      // which is exactly where an off-by-one in the parser hides.
      for (const version of [1, 9, 10, 26, 27, 40]) {
        for (const level of EC_LEVELS) {
          const value = payloadFor(version, level, mode);
          const matrix = encodeQR(value, { version, level });
          expect(decodeMatrix(gridFromMatrix(matrix)).text, `v${version}-${level} ${mode}`).toBe(
            value,
          );
        }
      }
    },
    60_000,
  );

  it("reads back every mask pattern", () => {
    for (let mask = 0; mask < 8; mask++) {
      const matrix = encodeQR("https://usefy.dev/qr-scanner", { mask, level: "Q" });
      const result = decodeMatrix(gridFromMatrix(matrix));
      expect(result.text).toBe("https://usefy.dev/qr-scanner");
      expect(result.symbol?.mask).toBe(mask);
    }
  });

  it("reads back UTF-8 text carried behind an ECI header", () => {
    const value = "안녕하세요 — usefy 🎯";
    const matrix = encodeQR(value, { level: "H" });
    const result = decodeMatrix(gridFromMatrix(matrix));

    expect(result.text).toBe(value);
    expect(result.segments.some((segment) => segment.eci === 26)).toBe(true);
  });

  it("reads back raw bytes that are not valid UTF-8", () => {
    const bytes = Uint8Array.from([0x00, 0x01, 0xff, 0xfe, 0x80, 0x7f, 0xc0]);
    const matrix = encodeQR(bytes, { level: "M" });
    const result = decodeMatrix(gridFromMatrix(matrix));

    expect(Array.from(result.bytes)).toEqual(Array.from(bytes));
  });

  it("reads back a mixed-mode payload as the segments the encoder chose", () => {
    const value = "HELLO 12345 world";
    const matrix = encodeQR(value, { level: "M" });
    const result = decodeMatrix(gridFromMatrix(matrix));

    expect(result.text).toBe(value);
    expect(result.segments.length).toBeGreaterThan(1);
    expect(result.segments.map((segment) => segment.mode)).toContain("alphanumeric");
  });

  it("reports the grid's own coordinates when detection supplied none", () => {
    const matrix = encodeQR("corners", { version: 2, level: "L" });
    const result = decodeMatrix(gridFromMatrix(matrix));

    expect(result.corners).toEqual([
      { x: 0, y: 0 },
      { x: matrix.size, y: 0 },
      { x: matrix.size, y: matrix.size },
      { x: 0, y: matrix.size },
    ]);
    expect(result.center).toEqual({ x: matrix.size / 2, y: matrix.size / 2 });
    expect(result.engine).toBe("internal");
  });
});

describe("mirrored symbols", () => {
  it("decodes a transposed symbol and says so", () => {
    const value = "MIRROR TEST 42";
    const matrix = encodeQR(value, { level: "Q" });
    const mirrored = gridFromMatrix(matrix).transposed();

    const result = decodeMatrix(mirrored);
    expect(result.text).toBe(value);
    expect(result.symbol?.mirrored).toBe(true);
  });

  it("reorders the corners so an overlay still traces the symbol", () => {
    const matrix = encodeQR("MIRROR", { level: "L" });
    const corners = [
      { x: 10, y: 10 },
      { x: 90, y: 12 },
      { x: 92, y: 92 },
      { x: 12, y: 90 },
    ] as const;

    const result = decodeMatrix(gridFromMatrix(matrix).transposed(), { corners });
    // Reflecting across the main diagonal swaps top-right and bottom-left.
    expect(result.corners).toEqual([corners[0], corners[3], corners[2], corners[1]]);
  });
});

describe("error correction through a whole symbol", () => {
  /**
   * A flipped *module* damages at most one codeword, so damage well below a
   * level's per-block capacity must always recover.
   *
   * Deliberately **not** parameterised by level: at version 6 even level L has
   * 18 parity codewords in a single block, so 2/4/6/8 flips are comfortably
   * inside every level's budget and a `["L", 2] … ["H", 8]` table would test
   * one thing four times while looking like it tested four. The level-dependent
   * property gets its own test below, where the levels actually differ.
   */
  it.each([2, 6, 10, 14])("recovers %i damaged modules and reports the repairs", (damage) => {
    const value = "https://usefy.dev/qr-scanner?utm=oracle";
    const matrix = encodeQR(value, { version: 6, level: "M" });
    const reserved = functionPatternMap(6);

    for (let seed = 0; seed < 20; seed++) {
      const grid = damageDataModules(
        gridFromMatrix(matrix),
        reserved,
        damage,
        seededRandom(seed + damage * 31),
      );
      const result = decodeMatrix(grid);
      expect(result.text, `seed ${seed}`).toBe(value);
      expect(result.symbol?.errorsCorrected).toBeGreaterThan(0);
    }
  });

  it("scales with the level: H survives damage that L cannot", () => {
    const value = "usefy qr-scanner error correction comparison payload";
    const reserved = functionPatternMap(6);
    const damage = 40;

    let lowSurvived = 0;
    let highSurvived = 0;
    for (let seed = 0; seed < 25; seed++) {
      for (const [level, counter] of [
        ["L", () => lowSurvived++],
        ["H", () => highSurvived++],
      ] as const) {
        const matrix = encodeQR(value, { version: 6, level });
        const grid = damageDataModules(
          gridFromMatrix(matrix),
          reserved,
          damage,
          seededRandom(seed * 13 + 1),
        );
        try {
          if (decodeMatrix(grid).text === value) counter();
        } catch {
          // An uncorrectable symbol is the expected outcome at level L here.
        }
      }
    }

    expect(highSurvived).toBeGreaterThan(lowSurvived);
  });

  it("fails rather than returning a wrong payload when damage is overwhelming", () => {
    const value = "usefy";
    const matrix = encodeQR(value, { version: 3, level: "L" });

    let wrong = 0;
    let refused = 0;
    let correct = 0;
    for (let seed = 0; seed < 120; seed++) {
      const grid = damageAnyModules(gridFromMatrix(matrix), 120, seededRandom(seed * 101));
      try {
        const result = decodeMatrix(grid);
        if (result.text === value) correct++;
        else wrong++;
      } catch (error) {
        expect(error).toBeInstanceOf(QRDecodeError);
        refused++;
      }
    }

    expect({ wrong }).toEqual({ wrong: 0 });
    expect(refused).toBeGreaterThan(0);
    expect(refused + correct).toBe(120);
  });
});

describe("failure reporting", () => {
  it("rejects a grid that is not a legal symbol size", () => {
    const grid = gridFromMatrix(encodeQR("size", { version: 1 }));
    const wrongSize = grid.data.slice(0, 20 * 20);
    const bad = Object.assign(Object.create(Object.getPrototypeOf(grid)), grid, {
      width: 20,
      height: 20,
      data: wrongSize,
    });

    expect(() => decodeMatrix(bad)).toThrow(QRDecodeError);
    try {
      decodeMatrix(bad);
    } catch (error) {
      expect((error as QRDecodeError).stage).toBe("format");
    }
  });

  it("refuses a symbol whose format words are destroyed", () => {
    const matrix = encodeQR("format", { version: 1, level: "M" });
    const grid = gridFromMatrix(matrix);
    // Flip both copies of the format information beyond BCH's reach.
    for (let i = 0; i <= 8; i++) {
      grid.set(8, i, !grid.get(8, i));
      grid.set(i, 8, !grid.get(i, 8));
      grid.set(grid.size - 1 - i, 8, !grid.get(grid.size - 1 - i, 8));
    }

    try {
      decodeMatrix(grid);
      expect.unreachable("a destroyed format word must not decode");
    } catch (error) {
      expect(error).toBeInstanceOf(QRDecodeError);
      expect(["format", "ec", "parse"]).toContain((error as QRDecodeError).stage);
    }
  });

  it("reports `ec` when the data is beyond repair but the format survives", () => {
    const version = 4;
    const level: ErrorCorrectionLevel = "L";
    const matrix = encodeQR("beyond repair", { version, level });
    const reserved = functionPatternMap(version);
    const budget = numEcBlocks(version, level) * ecCodewordsPerBlock(version, level);

    const grid = damageDataModules(
      gridFromMatrix(matrix),
      reserved,
      budget * 8,
      seededRandom(7),
    );

    try {
      decodeMatrix(grid);
      expect.unreachable("data damaged past the EC budget must not decode");
    } catch (error) {
      expect(error).toBeInstanceOf(QRDecodeError);
      expect((error as QRDecodeError).stage).toBe("ec");
    }
  });
});

describe("modes the counterpart encoder never emits", () => {
  /**
   * Built with `symbolWithBitStream`, which rewrites a real symbol's data
   * modules — so these travel the whole decode path (format word, mask,
   * Reed–Solomon, parser) exactly as a symbol from another generator would.
   */
  it("surfaces Structured Append metadata from a real symbol", () => {
    const writer = new TestBitWriter().push(0b0011, 4).push(1, 4).push(2, 4).push(0xa7, 8);
    writer.segment(0b0100, 5, 8);
    for (const byte of new TextEncoder().encode("part2")) writer.push(byte, 8);
    writer.push(0b0000, 4);

    const grid = symbolWithBitStream(writer.toBytes(), 4 + 16 + 4 + 8 + 40 + 4, 3, "M", 4);
    const result = decodeMatrix(grid);

    expect(result.text).toBe("part2");
    expect(result.symbol?.structuredAppend).toEqual({ index: 1, total: 3, parity: 0xa7 });
  });

  it("surfaces a GS1 (FNC1 position 1) flag", () => {
    const writer = new TestBitWriter().push(0b0101, 4);
    writer.segment(0b0010, 4, 9);
    const charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
    writer.push(charset.indexOf("0") * 45 + charset.indexOf("1"), 11);
    writer.push(charset.indexOf("9") * 45 + charset.indexOf("5"), 11);
    writer.push(0b0000, 4);

    const result = decodeMatrix(symbolWithBitStream(writer.toBytes(), 4 + 13 + 22 + 4, 2, "L", 1));
    expect(result.symbol?.fnc1).toBe("gs1");
    expect(result.text).toBe("0195");
  });

  it("surfaces an AIM (FNC1 position 2) flag with its application indicator", () => {
    const writer = new TestBitWriter().push(0b1001, 4).push(37, 8);
    writer.segment(0b0100, 2, 8);
    writer.push(0x4f, 8).push(0x4b, 8);
    writer.push(0b0000, 4);

    const result = decodeMatrix(symbolWithBitStream(writer.toBytes(), 4 + 8 + 12 + 16 + 4, 2, "L", 6));
    expect(result.symbol?.fnc1).toBe("aim");
    expect(result.symbol?.fnc1Application).toBe(37);
    expect(result.text).toBe("OK");
  });

  it("decodes a Kanji segment from a real symbol", () => {
    const writer = new TestBitWriter().segment(0b1000, 2, 8);
    writer.push(1855, 13).push(2586, 13);
    writer.push(0b0000, 4);

    const result = decodeMatrix(symbolWithBitStream(writer.toBytes(), 4 + 8 + 26 + 4, 2, "M", 2));
    expect(result.text).toBe("漢字");
    expect(result.segments[0]!.mode).toBe("kanji");
  });
});

describe("result metadata", () => {
  it("carries the supplied timestamp and inverted flag", () => {
    const matrix = encodeQR("metadata", { level: "L" });
    const result = decodeMatrix(gridFromMatrix(matrix), { timestamp: 1234.5, inverted: true });

    expect(result.timestamp).toBe(1234.5);
    expect(result.symbol?.inverted).toBe(true);
  });

  it("stamps its own timestamp when none is supplied", () => {
    const matrix = encodeQR("timestamp", { level: "L" });
    const before = performance.now();
    const result = decodeMatrix(gridFromMatrix(matrix));

    expect(result.timestamp).toBeGreaterThanOrEqual(before);
    expect(result.symbol?.inverted).toBe(false);
  });
});

describe("binary mode", () => {
  it("skips text decoding but keeps every byte", () => {
    const value = "binary mode payload";
    const matrix = encodeQR(value, { level: "M" });
    const result = decodeMatrix(gridFromMatrix(matrix), { binary: true });

    expect(result.text).toBe("");
    expect(new TextDecoder().decode(result.bytes)).toBe(value);
    expect(result.segments.every((segment) => segment.text === undefined)).toBe(true);
  });

  it("keeps the ECI on a segment whose text it dropped", () => {
    // The consumer asked for bytes, not text — but which charset the symbol
    // declared is still information they may need to interpret them.
    const matrix = encodeQR("안녕", { level: "M" });
    const result = decodeMatrix(gridFromMatrix(matrix), { binary: true });

    expect(result.segments[0]!.eci).toBe(26);
    expect(result.segments[0]!.text).toBeUndefined();
  });
});

describe("segments the platform cannot turn into text", () => {
  it("contributes nothing to `text` but keeps its bytes", () => {
    // ECI 2 is CP437, which no browser implements. The symbol still decodes;
    // the affected segment simply has no text.
    const writer = new TestBitWriter().push(0b0111, 4).push(2, 8);
    writer.segment(0b0100, 2, 8).push(0x9b, 8).push(0x41, 8);
    writer.push(0b0000, 4);

    const result = decodeMatrix(symbolWithBitStream(writer.toBytes(), 4 + 8 + 12 + 16 + 4, 2, "L", 3));

    expect(result.text).toBe("");
    expect(result.segments[0]!.text).toBeUndefined();
    expect(Array.from(result.bytes)).toEqual([0x9b, 0x41]);
  });
});

describe("environments without `performance`", () => {
  it("falls back to Date.now for the timestamp", () => {
    vi.stubGlobal("performance", undefined);
    try {
      const matrix = encodeQR("no performance api", { level: "L" });
      const result = decodeMatrix(gridFromMatrix(matrix));
      expect(result.timestamp).toBeGreaterThan(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
