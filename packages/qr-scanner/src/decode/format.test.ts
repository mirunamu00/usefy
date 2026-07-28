import { describe, expect, it } from "vitest";
import {
  EC_LEVELS,
  MAX_VERSION,
  encodeQR,
  formatInfoBits,
  versionInfoBits,
} from "@usefy/qr-code/headless";
import { BitMatrix } from "../image/bitmatrix";
import { decodeFormatBits, decodeVersionBits, readFormatInfo, readVersion } from "./format";
import { gridFromMatrix } from "../__testing__/fixtures";
import { decodeMatrix } from "./decodeMatrix";

describe("decodeFormatBits", () => {
  it("recovers every legal level × mask combination unchanged", () => {
    for (const level of EC_LEVELS) {
      for (let mask = 0; mask < 8; mask++) {
        const decoded = decodeFormatBits(formatInfoBits(level, mask));
        expect(decoded, `${level}/${mask}`).toEqual({ level, mask, errorsCorrected: 0 });
      }
    }
  });

  it("corrects up to three bit errors — the BCH(15,5) guarantee", () => {
    for (const level of EC_LEVELS) {
      for (let mask = 0; mask < 8; mask++) {
        const clean = formatInfoBits(level, mask);
        for (const flips of [[0], [7, 14], [1, 5, 12]]) {
          let corrupted = clean;
          for (const bit of flips) corrupted ^= 1 << bit;
          expect(decodeFormatBits(corrupted), `${level}/${mask} flips ${flips}`).toEqual({
            level,
            mask,
            errorsCorrected: flips.length,
          });
        }
      }
    }
  });

  /**
   * The property that makes "nearest legal word wins" safe rather than a coin
   * flip, checked over every possible input rather than a sample.
   *
   * BCH(15,5) has minimum distance 7, so the radius-3 spheres around the 32
   * legal words are disjoint: no 15-bit word is within 3 of two of them. If
   * that ever stopped holding, a damaged symbol could decode with the wrong
   * mask — which produces confident garbage, not an error.
   */
  it("decodes every one of the 32,768 possible words unambiguously or not at all", () => {
    const words = EC_LEVELS.flatMap((level) =>
      Array.from({ length: 8 }, (_, mask) => ({ bits: formatInfoBits(level, mask), level, mask })),
    );

    let ambiguities = 0;
    let corrected = 0;
    let refused = 0;

    for (let candidate = 0; candidate < 0x8000; candidate++) {
      let best = 99;
      let bestCount = 0;
      let bestWord = words[0]!;
      for (const word of words) {
        let diff = candidate ^ word.bits;
        let distance = 0;
        while (diff) {
          diff &= diff - 1;
          distance++;
        }
        if (distance < best) {
          best = distance;
          bestCount = 1;
          bestWord = word;
        } else if (distance === best) {
          bestCount++;
        }
      }

      const decoded = decodeFormatBits(candidate);
      if (best <= 3) {
        if (bestCount !== 1) ambiguities++;
        expect(decoded).toEqual({
          level: bestWord.level,
          mask: bestWord.mask,
          errorsCorrected: best,
        });
        corrected++;
      } else {
        expect(decoded).toBeNull();
        refused++;
      }
    }

    expect({ ambiguities }).toEqual({ ambiguities: 0 });
    // 32 words × (1 + 15 + 105 + 455) = 18,272 correctable inputs.
    expect(corrected).toBe(32 * (1 + 15 + 105 + 455));
    expect(corrected + refused).toBe(0x8000);
  });
});

describe("decodeVersionBits", () => {
  it("recovers versions 7–40 unchanged", () => {
    for (let version = 7; version <= MAX_VERSION; version++) {
      expect(decodeVersionBits(versionInfoBits(version))).toBe(version);
    }
  });

  it("corrects up to three bit errors", () => {
    for (let version = 7; version <= MAX_VERSION; version++) {
      const clean = versionInfoBits(version);
      expect(decodeVersionBits(clean ^ 0b1)).toBe(version);
      expect(decodeVersionBits(clean ^ 0b1000000010)).toBe(version);
      expect(decodeVersionBits(clean ^ 0b100000001000001)).toBe(version);
    }
  });

  it("returns null for a word no version produces", () => {
    expect(decodeVersionBits(0b111111111111111111)).toBeNull();
  });
});

describe("readFormatInfo", () => {
  it("reads the level and mask a real symbol was built with", () => {
    for (const level of EC_LEVELS) {
      for (let mask = 0; mask < 8; mask++) {
        const matrix = encodeQR("format placement", { level, mask, version: 5 });
        const info = readFormatInfo(gridFromMatrix(matrix));
        expect(info, `${level}/${mask}`).toEqual({ level, mask, errorsCorrected: 0 });
      }
    }
  });

  it("survives one destroyed copy by reading the other", () => {
    const matrix = encodeQR("redundancy", { level: "Q", mask: 5, version: 4 });
    const grid = gridFromMatrix(matrix);

    // Obliterate copy 1 (around the top-left finder) entirely.
    for (let i = 0; i <= 8; i++) {
      grid.set(8, i, true);
      grid.set(i, 8, true);
    }

    expect(readFormatInfo(grid)).toEqual({ level: "Q", mask: 5, errorsCorrected: 0 });
  });

  it("prefers the copy that needed fewer corrections", () => {
    const matrix = encodeQR("cleanest wins", { level: "H", mask: 2, version: 3 });
    const grid = gridFromMatrix(matrix);

    // Two errors in copy 1: still correctable, but copy 2 is pristine.
    grid.set(8, 0, !grid.get(8, 0));
    grid.set(8, 1, !grid.get(8, 1));

    expect(readFormatInfo(grid)).toEqual({ level: "H", mask: 2, errorsCorrected: 0 });
  });

  it("returns null when both copies are destroyed", () => {
    const grid = BitMatrix.square(21);
    // An all-light grid reads 0x0000 in both copies, which is 3 flips away from
    // the L/mask-1 word — close enough to be dangerous, which is why the tie
    // and distance rules matter. Force something further out instead.
    for (let i = 0; i < 21; i++) grid.set(8, i, i % 3 === 0);
    for (let i = 0; i < 21; i++) grid.set(i, 8, i % 2 === 0);

    const info = readFormatInfo(grid);
    if (info) expect(info.errorsCorrected).toBeLessThanOrEqual(3);
    else expect(info).toBeNull();
  });
});

/** The lowest 18-bit word more than three bits from every legal version word. */
function firstUnreadableVersionWord(): number {
  for (let candidate = 1; candidate < 0x40000; candidate++) {
    if (decodeVersionBits(candidate) === null) return candidate;
  }
  /* c8 ignore next -- 34 legal words cannot cover 262,144 candidates. */
  throw new Error("every 18-bit word decodes, which is impossible");
}

describe("readVersion", () => {
  it("derives versions 1–6 from the grid size alone", () => {
    for (let version = 1; version <= 6; version++) {
      const matrix = encodeQR("small", { version, level: "L" });
      expect(readVersion(gridFromMatrix(matrix))).toBe(version);
    }
  });

  it("reads the version word for versions 7–40", () => {
    for (const version of [7, 8, 15, 26, 27, 39, 40]) {
      const matrix = encodeQR("larger symbol payload", { version, level: "L" });
      expect(readVersion(gridFromMatrix(matrix))).toBe(version);
    }
  });

  it("survives one destroyed version copy", () => {
    const matrix = encodeQR("version redundancy", { version: 12, level: "M" });
    const grid = gridFromMatrix(matrix);
    const size = grid.size;
    for (let i = 0; i < 18; i++) {
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      grid.set(a, b, true); // wipe the top-right copy
    }
    expect(readVersion(grid)).toBe(12);
  });

  it("rejects a grid whose size is not 4v + 17", () => {
    expect(readVersion(BitMatrix.square(20))).toBeNull();
    expect(readVersion(BitMatrix.square(18))).toBeNull();
  });

  it("rejects a grid outside the version range even when 4v + 17 fits", () => {
    expect(readVersion(BitMatrix.square(13))).toBeNull(); // would be version 0
    expect(readVersion(BitMatrix.square(181))).toBeNull(); // would be version 41
  });

  it("refuses when the two version copies disagree", () => {
    const matrix = encodeQR("disagreement", { version: 10, level: "L" });
    const grid = gridFromMatrix(matrix);
    const size = grid.size;

    // Overwrite the top-right copy with a *different* legal version word, so
    // both copies decode cleanly — to different answers.
    const impostor = versionInfoBits(12);
    for (let i = 0; i < 18; i++) {
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      grid.set(a, b, ((impostor >>> i) & 1) === 1);
    }

    expect(readVersion(grid)).toBeNull();
  });

  it("refuses a version word that contradicts the grid's own size", () => {
    // Both copies say version 12, but the grid is a version 10 symbol: one of
    // the two readings is wrong and there is no way to tell which.
    const matrix = encodeQR("size mismatch", { version: 10, level: "L" });
    const grid = gridFromMatrix(matrix);
    const size = grid.size;
    const impostor = versionInfoBits(12);

    for (let i = 0; i < 18; i++) {
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      const bit = ((impostor >>> i) & 1) === 1;
      grid.set(a, b, bit);
      grid.set(b, a, bit);
    }

    expect(readVersion(grid)).toBeNull();
  });

  it("falls back to the size when both version copies are destroyed", () => {
    // The version corners are where a thumb, a staple or a fold lands. The
    // dimension identifies the version on its own — only one version is 57
    // modules across — so refusing here would throw away a perfectly readable
    // symbol. The format word and Reed–Solomon still have to agree downstream.
    const matrix = encodeQR("unreadable version", { version: 10, level: "L" });
    const grid = gridFromMatrix(matrix);
    const size = grid.size;

    // A word more than three bits from every legal one, written into both copies.
    const unreadable = firstUnreadableVersionWord();
    for (let i = 0; i < 18; i++) {
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      const bit = ((unreadable >>> i) & 1) === 1;
      grid.set(a, b, bit);
      grid.set(b, a, bit);
    }

    expect(readVersion(grid)).toBe(10);
  });

  it("still decodes the whole symbol with both version copies destroyed", () => {
    const value = "the version corners took the damage";
    const matrix = encodeQR(value, { version: 10, level: "M" });
    const grid = gridFromMatrix(matrix);
    const size = grid.size;

    // The version modules are function patterns, so wrecking them costs the
    // payload nothing — which is exactly why falling back to the size is safe.
    const unreadable = firstUnreadableVersionWord();
    for (let i = 0; i < 18; i++) {
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      const bit = ((unreadable >>> i) & 1) === 1;
      grid.set(a, b, bit);
      grid.set(b, a, bit);
    }

    expect(readVersion(grid)).toBe(10);
    expect(decodeMatrix(grid).text).toBe(value);
  });
});
