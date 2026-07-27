import type { QRMatrix } from "../types";
import { type RawMatrix, drawFormatInfo } from "./matrix";

/**
 * Data masking (ISO/IEC 18004 §7.8).
 *
 * Raw codewords often produce large blank areas or accidental copies of the
 * finder pattern, both of which confuse scanners. So the encoder XORs the data
 * region with each of eight fixed patterns, scores the result against four
 * penalty rules, and keeps the least-bad one.
 */

/** Penalty weights from ISO Table 11. */
export const PENALTY_N1 = 3;
export const PENALTY_N2 = 3;
export const PENALTY_N3 = 40;
export const PENALTY_N4 = 10;

/** The eight mask conditions (ISO Table 10). True means "invert this module". */
export function maskAt(mask: number, x: number, y: number): boolean {
  switch (mask) {
    case 0:
      return (x + y) % 2 === 0;
    case 1:
      return y % 2 === 0;
    case 2:
      return x % 3 === 0;
    case 3:
      return (x + y) % 3 === 0;
    case 4:
      return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
    case 5:
      return ((x * y) % 2) + ((x * y) % 3) === 0;
    case 6:
      return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
    case 7:
      return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
    default:
      throw new RangeError(`Mask pattern must be 0–7, got ${mask}`);
  }
}

/**
 * XOR a mask over every non-function module. XOR is its own inverse, so
 * calling this twice with the same mask restores the original.
 */
export function applyMask(raw: RawMatrix, mask: number): void {
  const { size, modules, reserved } = raw;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      if (reserved[i] === 1) continue;
      if (maskAt(mask, x, y)) modules[i] ^= 1;
    }
  }
}

/** The 11-module finder-lookalike patterns rule 3 penalizes. */
const FINDER_LIKE_A = 0b10111010000;
const FINDER_LIKE_B = 0b00001011101;

/**
 * Total penalty for a masked symbol — lower is better.
 *
 * Rule 4 follows the ZXing/ISO reading (`floor(|dark% − 50| / 5)` steps), which
 * differs at exact 5% boundaries from the `ceil`-based approximation some
 * libraries use. Implementations legitimately disagree here and every choice
 * produces a valid symbol, so this package pins the spec reading and proves
 * the result by decoding every generated code in tests.
 */
export function penaltyScore(modules: Readonly<Uint8Array>, size: number): number {
  let score = 0;

  // Rules 1 and 3 — run lengths and finder lookalikes, scanned both ways.
  for (let a = 0; a < size; a++) {
    let rowRun = 1;
    let colRun = 1;
    let rowBits = 0;
    let colBits = 0;

    for (let b = 0; b < size; b++) {
      const rowValue = modules[a * size + b]!;
      const colValue = modules[b * size + a]!;

      if (b > 0) {
        rowRun = rowValue === modules[a * size + b - 1]! ? rowRun + 1 : 1;
        if (rowRun === 5) score += PENALTY_N1;
        else if (rowRun > 5) score += 1;

        colRun = colValue === modules[(b - 1) * size + a]! ? colRun + 1 : 1;
        if (colRun === 5) score += PENALTY_N1;
        else if (colRun > 5) score += 1;
      }

      rowBits = ((rowBits << 1) & 0x7ff) | rowValue;
      colBits = ((colBits << 1) & 0x7ff) | colValue;
      if (b >= 10) {
        if (rowBits === FINDER_LIKE_A || rowBits === FINDER_LIKE_B) score += PENALTY_N3;
        if (colBits === FINDER_LIKE_A || colBits === FINDER_LIKE_B) score += PENALTY_N3;
      }
    }
  }

  // Rule 2 — solid 2×2 blocks.
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const value = modules[y * size + x]!;
      if (
        value === modules[y * size + x + 1]! &&
        value === modules[(y + 1) * size + x]! &&
        value === modules[(y + 1) * size + x + 1]!
      ) {
        score += PENALTY_N2;
      }
    }
  }

  // Rule 4 — deviation from an even dark/light balance, in 5% steps.
  let dark = 0;
  for (let i = 0; i < modules.length; i++) dark += modules[i]!;
  const total = size * size;
  score += Math.floor((Math.abs(dark * 2 - total) * 10) / total) * PENALTY_N4;

  return score;
}

function freeze(raw: RawMatrix, mask: number): QRMatrix {
  const { size, modules, reserved } = raw;
  return {
    version: raw.version,
    size,
    level: raw.level,
    mask,
    modules,
    reserved,
    get(x: number, y: number): boolean {
      if (x < 0 || y < 0 || x >= size || y >= size) return false;
      return modules[y * size + x] === 1;
    },
    isReserved(x: number, y: number): boolean {
      if (x < 0 || y < 0 || x >= size || y >= size) return false;
      return reserved[y * size + x] === 1;
    },
  };
}

/**
 * Try every mask (or just the forced one), keep the lowest-scoring, and write
 * the matching format information.
 *
 * @param raw - An unmasked symbol from `buildMatrix`. Mutated in place.
 * @param forced - Skip scoring and use this mask, 0–7.
 */
export function applyBestMask(raw: RawMatrix, forced?: number): QRMatrix {
  let chosen = forced;

  if (chosen === undefined) {
    let bestScore = Infinity;
    for (let mask = 0; mask < 8; mask++) {
      applyMask(raw, mask);
      drawFormatInfo(raw, raw.level, mask);
      const score = penaltyScore(raw.modules, raw.size);
      if (score < bestScore) {
        bestScore = score;
        chosen = mask;
      }
      applyMask(raw, mask); // XOR is its own inverse — undo before the next try
    }
  } else if (!Number.isInteger(chosen) || chosen < 0 || chosen > 7) {
    throw new RangeError(`Mask pattern must be an integer 0–7, got ${chosen}`);
  }

  applyMask(raw, chosen!);
  drawFormatInfo(raw, raw.level, chosen!);
  return freeze(raw, chosen!);
}
