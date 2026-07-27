import type { ErrorCorrectionLevel } from "../types";
import { EC_FORMAT_BITS } from "./capacity";

/**
 * Format and version information, both protected by BCH codes
 * (ISO/IEC 18004 §7.9 and §7.10).
 *
 * These 15- and 18-bit words are what a scanner reads *first*, before it knows
 * anything else about the symbol, so they carry their own error correction and
 * — for the format word — an XOR mask that guarantees the field is never all
 * zeroes (which would be indistinguishable from a blank region).
 */

/** BCH(15,5) generator for the format information. */
const FORMAT_GENERATOR = 0x537;
/** The constant the format bits are XORed with so they're never all zero. */
const FORMAT_MASK = 0x5412;
/** BCH(18,6) generator for the version information. */
const VERSION_GENERATOR = 0x1f25;

/**
 * The 15-bit format word for an EC level and mask pattern, BCH-protected and
 * masked.
 */
export function formatInfoBits(level: ErrorCorrectionLevel, mask: number): number {
  const data = (EC_FORMAT_BITS[level] << 3) | mask;
  let remainder = data;
  for (let i = 0; i < 10; i++) {
    remainder = (remainder << 1) ^ ((remainder >>> 9) * FORMAT_GENERATOR);
  }
  return (((data << 10) | remainder) ^ FORMAT_MASK) & 0x7fff;
}

/**
 * The 18-bit version word, BCH-protected. Only versions 7 and up carry one —
 * smaller symbols are identified by their module count alone.
 */
export function versionInfoBits(version: number): number {
  let remainder = version;
  for (let i = 0; i < 12; i++) {
    remainder = (remainder << 1) ^ ((remainder >>> 11) * VERSION_GENERATOR);
  }
  return ((version << 12) | remainder) & 0x3ffff;
}
