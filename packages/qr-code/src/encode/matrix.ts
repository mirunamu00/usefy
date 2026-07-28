import type { ErrorCorrectionLevel } from "../types";
import { alignmentPatternPositions, versionSize } from "./capacity";
import { formatInfoBits, versionInfoBits } from "./info";

/**
 * Module placement (ISO/IEC 18004 §7.7 and §7.8).
 *
 * A symbol is built in two layers: the function patterns a scanner uses to
 * find and orient the code (finders, separators, timing, alignment, plus the
 * reserved format/version areas), and then the codewords, snaked into whatever
 * modules are left in a two-column zig-zag from the bottom-right corner.
 *
 * The `reserved` map is kept because everything downstream needs it — masking
 * must skip function patterns, and the renderer uses it to give the finder
 * "eyes" their own shape and colour.
 */

/** A symbol with its function patterns and data placed, before masking. */
export interface RawMatrix {
  version: number;
  size: number;
  level: ErrorCorrectionLevel;
  modules: Uint8Array;
  reserved: Uint8Array;
}

function set(raw: RawMatrix, x: number, y: number, dark: boolean, functional: boolean): void {
  if (x < 0 || y < 0 || x >= raw.size || y >= raw.size) return;
  const i = y * raw.size + x;
  raw.modules[i] = dark ? 1 : 0;
  if (functional) raw.reserved[i] = 1;
}

/** A 7×7 finder pattern (plus its one-module separator) centred at `cx, cy`. */
function drawFinder(raw: RawMatrix, cx: number, cy: number): void {
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      const distance = Math.max(Math.abs(dx), Math.abs(dy));
      set(raw, cx + dx, cy + dy, distance !== 2 && distance !== 4, true);
    }
  }
}

/** A 5×5 alignment pattern centred at `cx, cy`. */
function drawAlignment(raw: RawMatrix, cx: number, cy: number): void {
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      set(raw, cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1, true);
    }
  }
}

/**
 * Write the 15-bit format word into both of its copies.
 *
 * Called twice in a symbol's life: once during construction with a placeholder
 * so the modules are marked reserved, and again after the mask is chosen with
 * the real value.
 */
export function drawFormatInfo(
  raw: RawMatrix,
  level: ErrorCorrectionLevel,
  mask: number,
): void {
  const bits = formatInfoBits(level, mask);
  const bit = (i: number): boolean => ((bits >>> i) & 1) === 1;
  const { size } = raw;

  // Copy 1 — around the top-left finder.
  for (let i = 0; i <= 5; i++) set(raw, 8, i, bit(i), true);
  set(raw, 8, 7, bit(6), true);
  set(raw, 8, 8, bit(7), true);
  set(raw, 7, 8, bit(8), true);
  for (let i = 9; i < 15; i++) set(raw, 14 - i, 8, bit(i), true);

  // Copy 2 — split between the top-right and bottom-left finders.
  for (let i = 0; i < 8; i++) set(raw, size - 1 - i, 8, bit(i), true);
  for (let i = 8; i < 15; i++) set(raw, 8, size - 15 + i, bit(i), true);

  // The "dark module" — always dark, in every symbol.
  set(raw, 8, size - 8, true, true);
}

/** Write the 18-bit version word into both of its copies (versions 7+ only). */
function drawVersionInfo(raw: RawMatrix): void {
  if (raw.version < 7) return;
  const bits = versionInfoBits(raw.version);
  for (let i = 0; i < 18; i++) {
    const dark = ((bits >>> i) & 1) === 1;
    const a = raw.size - 11 + (i % 3);
    const b = Math.floor(i / 3);
    set(raw, a, b, dark, true);
    set(raw, b, a, dark, true);
  }
}

/** Draw every function pattern and reserve the format/version areas. */
export function drawFunctionPatterns(raw: RawMatrix): void {
  const { size } = raw;

  // Timing patterns, drawn first so the finders overwrite their ends.
  for (let i = 0; i < size; i++) {
    const dark = i % 2 === 0;
    set(raw, 6, i, dark, true);
    set(raw, i, 6, dark, true);
  }

  drawFinder(raw, 3, 3);
  drawFinder(raw, size - 4, 3);
  drawFinder(raw, 3, size - 4);

  const positions = alignmentPatternPositions(raw.version);
  const last = positions.length - 1;
  for (let i = 0; i <= last; i++) {
    for (let j = 0; j <= last; j++) {
      // The three corners are already occupied by finder patterns.
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) continue;
      drawAlignment(raw, positions[i]!, positions[j]!);
    }
  }

  // Placeholder format bits — the real ones are written once the mask is known.
  drawFormatInfo(raw, raw.level, 0);
  drawVersionInfo(raw);
}

/**
 * The reserved-module map for a version: `1` where a function pattern (finder,
 * separator, timing, alignment, format or version information) lives.
 *
 * Exported because a **decoder** needs exactly the same map to know which
 * modules to skip — `@usefy/qr-scanner` reads it from here rather than
 * restating the geometry, so the two halves of the format can never disagree
 * about where the data starts.
 */
export function functionPatternMap(version: number): Uint8Array {
  const size = versionSize(version);
  const raw: RawMatrix = {
    version,
    size,
    // The level only selects placeholder format bits, which are overwritten
    // once the mask is known; it does not affect which modules are reserved.
    level: "L",
    modules: new Uint8Array(size * size),
    reserved: new Uint8Array(size * size),
  };
  drawFunctionPatterns(raw);
  return raw.reserved;
}

/**
 * Memoized traversals, keyed by version.
 *
 * Both halves of the format walk this order on every symbol — the encoder once
 * per encode, the scanner up to four times per *frame* (a mirrored retry and an
 * inverted pass each repeat it). Rebuilding it means a throwaway function-
 * pattern map plus a `Uint32Array(size²)`, which at version 40 is a quarter of
 * a megabyte of garbage per attempt, at up to twelve frames a second.
 *
 * Bounded by construction: there are only 40 versions, and the largest entry is
 * 118 KB, so a process that encoded or scanned every version would hold about
 * 1.5 MB — far less than one frame's worth of the garbage this avoids.
 */
const orderCache = new Map<number, Uint32Array>();

/**
 * The order in which codeword bits occupy modules: two columns at a time,
 * right to left, alternating upward and downward, skipping the vertical timing
 * pattern column and every function module.
 *
 * Returns row-major module indices, one per data bit, longest-first. The
 * length is the symbol's raw data-module count, so the trailing entries beyond
 * `totalCodewords * 8` are the remainder modules.
 *
 * Shared with the decoder (`@usefy/qr-scanner`), which walks the identical
 * order in reverse. Keeping one traversal for both directions is what makes
 * "the scanner reads what the encoder wrote" a structural guarantee instead of
 * a pair of loops that have to be kept in step by hand.
 *
 * **The returned array is shared and must not be mutated.** It is memoized per
 * version precisely so that neither encoding nor scanning allocates it per
 * symbol; handing out a copy would undo that (118 KB at version 40, several
 * times per camera frame). Copy it yourself if you need to write to it.
 */
export function codewordModuleOrder(version: number): Uint32Array {
  const cached = orderCache.get(version);
  if (cached) return cached;

  const order = traverseDataModules(versionSize(version), functionPatternMap(version));
  orderCache.set(version, order);
  return order;
}

/** The one implementation of the zig-zag walk. */
function traverseDataModules(size: number, reserved: Readonly<Uint8Array>): Uint32Array {
  const order = new Uint32Array(size * size);
  let count = 0;

  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // skip the vertical timing pattern
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        const index = y * size + x;
        if (reserved[index] === 1) continue;
        order[count++] = index;
      }
    }
  }

  return order.slice(0, count);
}

/**
 * Snake the codewords through every non-function module, in the order
 * `codewordModuleOrder` defines. Leftover "remainder" modules stay light.
 *
 * Consumes the *published* order rather than re-walking `raw.reserved`, so the
 * encoder and any decoder are provably reading one description of the
 * traversal — and, because that order is memoized, encoding allocates nothing
 * for it after the first symbol of a given version.
 */
export function drawCodewords(raw: RawMatrix, codewords: Readonly<Uint8Array>): void {
  const order = codewordModuleOrder(raw.version);
  const totalBits = Math.min(codewords.length * 8, order.length);

  for (let bit = 0; bit < totalBits; bit++) {
    raw.modules[order[bit]!] = (codewords[bit >>> 3]! >>> (7 - (bit & 7))) & 1;
  }
}

/** Build a symbol with function patterns and codewords placed, unmasked. */
export function buildMatrix(
  codewords: Readonly<Uint8Array>,
  version: number,
  level: ErrorCorrectionLevel,
): RawMatrix {
  const size = versionSize(version);
  const raw: RawMatrix = {
    version,
    size,
    level,
    modules: new Uint8Array(size * size),
    reserved: new Uint8Array(size * size),
  };
  drawFunctionPatterns(raw);
  drawCodewords(raw, codewords);
  return raw;
}
