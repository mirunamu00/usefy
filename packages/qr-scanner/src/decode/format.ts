import {
  EC_LEVELS,
  MAX_VERSION,
  MIN_VERSION,
  formatInfoBits,
  versionInfoBits,
  versionSize,
  type ErrorCorrectionLevel,
} from "@usefy/qr-code/headless";
import type { ModuleGrid } from "../types";

/**
 * Format and version information recovery (ISO/IEC 18004 §7.9, §7.10) — the
 * first thing a scanner reads, before it knows anything else about the symbol.
 *
 * Both words are BCH-protected, and rather than tabulating the legal
 * code words this module *generates* them with the same functions
 * `@usefy/qr-code` writes them with. Correction is then a minimum-Hamming-
 * distance search over that generated set, which is both the textbook decoder
 * and structurally incapable of disagreeing with the encoder.
 */

/** Every legal 15-bit format word, with the level and mask it encodes. */
const FORMAT_WORDS: ReadonlyArray<{ bits: number; level: ErrorCorrectionLevel; mask: number }> =
  EC_LEVELS.flatMap((level) =>
    Array.from({ length: 8 }, (_, mask) => ({ bits: formatInfoBits(level, mask), level, mask })),
  );

/** Every legal 18-bit version word, versions 7–40. */
const VERSION_WORDS: ReadonlyArray<{ bits: number; version: number }> = Array.from(
  { length: MAX_VERSION - 7 + 1 },
  (_, i) => ({ bits: versionInfoBits(i + 7), version: i + 7 }),
);

/**
 * The format word carries 10 BCH parity bits over 5 data bits, giving a
 * minimum distance of 7 — so up to 3 bit errors are correctable. Accepting a
 * larger distance would start inventing masks out of noise.
 */
const MAX_FORMAT_DISTANCE = 3;
/** BCH(18,6) has minimum distance 8, so 3 errors are safely correctable. */
const MAX_VERSION_DISTANCE = 3;

function hammingDistance(a: number, b: number): number {
  let diff = a ^ b;
  let count = 0;
  while (diff !== 0) {
    diff &= diff - 1;
    count++;
  }
  return count;
}

export interface FormatInfo {
  readonly level: ErrorCorrectionLevel;
  readonly mask: number;
  /** Bit errors that had to be corrected — a signal the read was marginal. */
  readonly errorsCorrected: number;
}

/**
 * Correct and interpret a raw 15-bit format word, or `null` when no legal word
 * is close enough.
 *
 * No tie-breaking is needed and none is performed: the code's minimum distance
 * is 7, so the radius-3 spheres around the 32 legal words are disjoint and a
 * word inside one of them cannot be equidistant from another. `format.test.ts`
 * proves that exhaustively over all 32,768 inputs rather than taking it on
 * faith — it is the property that makes "nearest word wins" safe.
 */
export function decodeFormatBits(raw: number): FormatInfo | null {
  let best: (typeof FORMAT_WORDS)[number] | undefined;
  let bestDistance = Number.MAX_SAFE_INTEGER;

  for (const candidate of FORMAT_WORDS) {
    const distance = hammingDistance(raw & 0x7fff, candidate.bits);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }

  if (!best || bestDistance > MAX_FORMAT_DISTANCE) return null;
  return { level: best.level, mask: best.mask, errorsCorrected: bestDistance };
}

/**
 * Correct and interpret a raw 18-bit version word (versions 7–40 only).
 *
 * BCH(18,6) has minimum distance 8, so the same disjoint-sphere argument as
 * {@link decodeFormatBits} applies at radius 3.
 */
export function decodeVersionBits(raw: number): number | null {
  let best = -1;
  let bestDistance = Number.MAX_SAFE_INTEGER;

  for (const candidate of VERSION_WORDS) {
    const distance = hammingDistance(raw & 0x3ffff, candidate.bits);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate.version;
    }
  }

  if (best < 0 || bestDistance > MAX_VERSION_DISTANCE) return null;
  return best;
}

/**
 * Read a bit sequence out of the grid, most-significant bit first.
 *
 * The coordinate lists below are the exact inverse of the encoder's
 * `drawFormatInfo` / version-info placement; the round-trip test in
 * `format.test.ts` reads real symbols produced by `@usefy/qr-code` to prove it.
 */
function readBits(grid: ModuleGrid, coordinates: ReadonlyArray<readonly [number, number]>): number {
  let bits = 0;
  // The lists are written least-significant bit first (bit 0 … bit n), matching
  // the spec's numbering, so they are folded in reverse to build the word.
  for (let i = coordinates.length - 1; i >= 0; i--) {
    const [x, y] = coordinates[i]!;
    bits = (bits << 1) | (grid.get(x, y) ? 1 : 0);
  }
  return bits;
}

/** Bit 0 … bit 14 of format copy 1, wrapped around the top-left finder. */
function formatCopy1(): Array<readonly [number, number]> {
  const coordinates: Array<readonly [number, number]> = [];
  for (let i = 0; i <= 5; i++) coordinates.push([8, i]);
  coordinates.push([8, 7], [8, 8], [7, 8]);
  for (let i = 9; i < 15; i++) coordinates.push([14 - i, 8]);
  return coordinates;
}

/** Bit 0 … bit 14 of format copy 2, split between the other two finders. */
function formatCopy2(size: number): Array<readonly [number, number]> {
  const coordinates: Array<readonly [number, number]> = [];
  for (let i = 0; i < 8; i++) coordinates.push([size - 1 - i, 8]);
  for (let i = 8; i < 15; i++) coordinates.push([8, size - 15 + i]);
  return coordinates;
}

/**
 * Read the format information, trying both copies and keeping the one that
 * needed fewer corrections.
 *
 * Two copies exist precisely because one corner of a symbol can be damaged;
 * preferring the *cleaner* read rather than the first one is what makes that
 * redundancy worth anything.
 */
export function readFormatInfo(grid: ModuleGrid): FormatInfo | null {
  const first = decodeFormatBits(readBits(grid, formatCopy1()));
  const second = decodeFormatBits(readBits(grid, formatCopy2(grid.size)));

  if (!first) return second;
  if (!second) return first;
  return second.errorsCorrected < first.errorsCorrected ? second : first;
}

/**
 * Read the version information.
 *
 * Versions below 7 carry no version word at all — their size alone identifies
 * them.
 *
 * For versions 7 and up the two 18-bit copies are corrected independently, and
 * they are a *cross-check* on the sampled grid's dimensions rather than the
 * primary source: the dimension already determines the version, since only one
 * version has any given size. So:
 *
 * - both copies readable and in agreement, matching the size → accepted;
 * - a readable copy that contradicts the size → refused, because that means the
 *   grid was sampled at the wrong dimension and everything after this would be
 *   garbage;
 * - the two copies disagreeing → refused, same reason;
 * - **neither copy readable → the size-derived version is used.** The version
 *   corners are exactly where a thumb, a staple or a fold lands, and refusing
 *   there would throw away a symbol whose dimensions are perfectly clear. The
 *   format word and Reed–Solomon still have to agree for anything to be
 *   returned, so a genuinely wrong dimension fails a step later regardless.
 */
export function readVersion(grid: ModuleGrid): number | null {
  const size = grid.size;
  if ((size - 17) % 4 !== 0) return null;
  const derived = (size - 17) / 4;
  if (derived < MIN_VERSION || derived > MAX_VERSION) return null;
  if (derived < 7) return derived;

  // Copy 1: bottom-left block, 3 columns × 6 rows. Copy 2: its transpose.
  const bottomLeft: Array<readonly [number, number]> = [];
  const topRight: Array<readonly [number, number]> = [];
  for (let i = 0; i < 18; i++) {
    const a = size - 11 + (i % 3);
    const b = Math.floor(i / 3);
    topRight.push([a, b]);
    bottomLeft.push([b, a]);
  }

  const first = decodeVersionBits(readBits(grid, topRight));
  const second = decodeVersionBits(readBits(grid, bottomLeft));
  if (first !== null && second !== null && first !== second) return null;

  const version = first ?? second;
  // Neither copy survived: fall back to the dimension, which identifies the
  // version on its own. Every other check downstream still applies.
  if (version === null) return derived;

  // A version word that contradicts the symbol's own dimensions means one of
  // the two was misread. There is no way to tell which, so the read fails
  // instead of picking the more convenient answer.
  return versionSize(version) === size ? version : null;
}
