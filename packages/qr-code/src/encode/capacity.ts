import type { ErrorCorrectionLevel, QRSegmentMode } from "../types";

/**
 * Version / error-correction capacity tables (ISO/IEC 18004 §7.5.1, Table 9)
 * plus the derived helpers that turn them into codeword counts.
 *
 * Rather than storing the full 40 × 4 × 5 block table, this stores the two
 * primitive columns — EC codewords per block and number of blocks — and
 * derives everything else from the module geometry. That makes the tables
 * self-checking: `capacity.test.ts` recomputes the published total-codeword
 * figures from these two arrays.
 */

export const MIN_VERSION = 1;
export const MAX_VERSION = 40;

/** Order used to index the tables below. */
export const EC_LEVELS: readonly ErrorCorrectionLevel[] = ["L", "M", "Q", "H"];

/** The 2-bit field written into the format information (ISO Table 12). */
export const EC_FORMAT_BITS: Record<ErrorCorrectionLevel, number> = {
  L: 1,
  M: 0,
  Q: 3,
  H: 2,
};

/**
 * Roughly how much of the symbol each level can lose and still decode —
 * used by `logoSafety()` to judge occlusion (SPEC §3.4).
 */
export const EC_RECOVERY_RATIO: Record<ErrorCorrectionLevel, number> = {
  L: 0.07,
  M: 0.15,
  Q: 0.25,
  H: 0.3,
};

function levelIndex(level: ErrorCorrectionLevel): number {
  return EC_LEVELS.indexOf(level);
}

/** EC codewords per block, indexed `[level][version]` (index 0 unused). */
const ECC_CODEWORDS_PER_BLOCK: readonly (readonly number[])[] = [
  // 0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18  19  20  21  22  23  24  25  26  27  28  29  30  31  32  33  34  35  36  37  38  39  40
  [-1,  7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30], // L
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], // M
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30], // Q
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30], // H
];

/** Number of EC blocks, indexed `[level][version]` (index 0 unused). */
const NUM_EC_BLOCKS: readonly (readonly number[])[] = [
  // 0  1  2  3  4  5  6  7  8  9 10  11  12  13  14  15  16  17  18  19  20  21  22  23  24  25  26  27  28  29  30  31  32  33  34  35  36  37  38  39  40
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4,  4,  4,  4,  4,  6,  6,  6,  6,  7,  8,  8,  9,  9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25], // L
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5,  5,  8,  9,  9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49], // M
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8,  8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68], // Q
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81], // H
];

/** Modules per side for a version: `4v + 17`. */
export function versionSize(version: number): number {
  return version * 4 + 17;
}

/**
 * Centre coordinates of the alignment patterns for a version (ISO Annex E).
 * Version 1 has none; the three that would collide with finder patterns are
 * skipped by the caller, not here.
 */
export function alignmentPatternPositions(version: number): number[] {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  // Version 32 is the one irregular entry in the published table.
  const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2;
  const positions = [6];
  for (let pos = version * 4 + 10; positions.length < count; pos -= step) {
    positions.splice(1, 0, pos);
  }
  return positions;
}

/**
 * Number of modules available to data and EC codewords — the full symbol minus
 * every function pattern (finders, separators, timing, alignment, format info,
 * and version info for v≥7).
 */
export function rawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const alignCount = Math.floor(version / 7) + 2;
    result -= (25 * alignCount - 10) * alignCount - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

/** Total codewords (data + EC) a version holds; leftover modules are remainder bits. */
export function totalCodewords(version: number): number {
  return Math.floor(rawDataModules(version) / 8);
}

/** EC codewords in each block at this version and level. */
export function ecCodewordsPerBlock(version: number, level: ErrorCorrectionLevel): number {
  return ECC_CODEWORDS_PER_BLOCK[levelIndex(level)]![version]!;
}

/** How many EC blocks the codewords are split across. */
export function numEcBlocks(version: number, level: ErrorCorrectionLevel): number {
  return NUM_EC_BLOCKS[levelIndex(level)]![version]!;
}

/** Data codewords (i.e. payload capacity) at this version and level. */
export function dataCodewords(version: number, level: ErrorCorrectionLevel): number {
  return (
    totalCodewords(version) - ecCodewordsPerBlock(version, level) * numEcBlocks(version, level)
  );
}

/** Payload capacity in bits. */
export function dataCapacityBits(version: number, level: ErrorCorrectionLevel): number {
  return dataCodewords(version, level) * 8;
}

/**
 * Bits used by a segment's character-count indicator, which widens in two
 * steps as versions grow (ISO Table 3).
 */
export function charCountBits(mode: QRSegmentMode, version: number): number {
  const group = version <= 9 ? 0 : version <= 26 ? 1 : 2;
  switch (mode) {
    case "numeric":
      return [10, 12, 14][group]!;
    case "alphanumeric":
      return [9, 11, 13][group]!;
    case "byte":
      return [8, 16, 16][group]!;
  }
}

/** The 4-bit mode indicator written before each segment (ISO Table 2). */
export const MODE_INDICATOR: Record<QRSegmentMode, number> = {
  numeric: 0b0001,
  alphanumeric: 0b0010,
  byte: 0b0100,
};
