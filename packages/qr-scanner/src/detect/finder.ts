import type { BitMatrix } from "../image/bitmatrix";
import type { Point } from "../types";

/**
 * Finder-pattern detection: the 1 : 1 : 3 : 1 : 1 dark/light ratio in the three
 * corners of every QR symbol (ISO/IEC 18004 §6.3.3).
 *
 * The scan is a run-length state machine over each row. A row hit alone means
 * little — text, table borders and barcodes produce the ratio by accident — so
 * every candidate is re-checked vertically and along both diagonals before it
 * is believed, and centres are refined to sub-pixel accuracy from the run
 * boundaries. That last part is not a nicety: at 3 pixels per module a
 * half-pixel error in the centre is a sixth of a module, and by the far corner
 * of a version 20 symbol that has grown into a whole module of drift.
 */

export interface FinderCandidate {
  /** Sub-pixel centre, in binarized-image pixels. */
  readonly x: number;
  readonly y: number;
  /** Estimated module size (one seventh of the pattern's width). */
  readonly moduleSize: number;
  /** How many independent scan lines agreed on this centre. */
  readonly count: number;
}

/** Every candidate must be re-found within this fraction of its module size. */
const CENTRE_TOLERANCE = 1.0;
/**
 * How far two candidates' module sizes may differ and still be merged: one
 * pixel, **or** the same fraction of the estimate, whichever is larger.
 *
 * The relative half matters for close-ups. At 20 px per module, two scan lines
 * through the same finder pattern routinely disagree by more than a pixel, and
 * an absolute-only budget would split one pattern into several candidates that
 * never merge — handing the grouping stage more corners than the frame
 * contains.
 */
const MODULE_SIZE_TOLERANCE = 1.0;

/**
 * Does a five-run sequence match 1 : 1 : 3 : 1 : 1?
 *
 * The tolerance is half a module per unit, which is the standard reading of
 * "the pattern shall be recognisable"; tighter rejects real photographs, looser
 * starts accepting body text.
 */
function matchesRatio(runs: ArrayLike<number>): boolean {
  let total = 0;
  for (let i = 0; i < 5; i++) {
    const run = runs[i]!;
    if (run === 0) return false;
    total += run;
  }
  if (total < 7) return false;

  const moduleSize = total / 7;
  const tolerance = moduleSize / 2;

  return (
    Math.abs(moduleSize - runs[0]!) < tolerance &&
    Math.abs(moduleSize - runs[1]!) < tolerance &&
    Math.abs(3 * moduleSize - runs[2]!) < 3 * tolerance &&
    Math.abs(moduleSize - runs[3]!) < tolerance &&
    Math.abs(moduleSize - runs[4]!) < tolerance
  );
}

/** The centre of the middle run, given the run lengths and the scan position. */
function centreOfRuns(runs: ArrayLike<number>, end: number): number {
  return end - runs[4]! - runs[3]! - runs[2]! / 2;
}

/**
 * Walk one axis (or diagonal) through a candidate centre and measure the five
 * runs around it. Returns the refined centre along that axis, or `null` when
 * the pattern does not hold up.
 */
function crossCheck(
  bits: BitMatrix,
  startX: number,
  startY: number,
  stepX: number,
  stepY: number,
  maxCount: number,
  /**
   * The row scan's total run length, for the axis checks. Pass `null` for a
   * diagonal, where no fixed expectation exists (see {@link confirm}).
   */
  originalTotal: number | null,
): number | null {
  const runs = [0, 0, 0, 0, 0];

  // Centre run, walking backwards then forwards.
  let x = startX;
  let y = startY;
  while (bits.getSafe(x, y) && runs[2]! < maxCount) {
    runs[2]!++;
    x -= stepX;
    y -= stepY;
  }
  if (runs[2]! >= maxCount) return null;

  while (!bits.getSafe(x, y) && runs[1]! < maxCount) {
    runs[1]!++;
    x -= stepX;
    y -= stepY;
  }
  if (runs[1]! >= maxCount) return null;

  while (bits.getSafe(x, y) && runs[0]! < maxCount) {
    runs[0]!++;
    x -= stepX;
    y -= stepY;
  }
  if (runs[0]! >= maxCount) return null;

  x = startX + stepX;
  y = startY + stepY;
  while (bits.getSafe(x, y) && runs[2]! < maxCount) {
    runs[2]!++;
    x += stepX;
    y += stepY;
  }
  if (runs[2]! >= maxCount) return null;

  while (!bits.getSafe(x, y) && runs[3]! < maxCount) {
    runs[3]!++;
    x += stepX;
    y += stepY;
  }
  if (runs[3]! >= maxCount) return null;

  while (bits.getSafe(x, y) && runs[4]! < maxCount) {
    runs[4]!++;
    x += stepX;
    y += stepY;
  }
  if (runs[4]! >= maxCount) return null;

  const total = runs[0]! + runs[1]! + runs[2]! + runs[3]! + runs[4]!;
  // A cross-check that disagrees with the original scan by more than ~40% is
  // measuring something else — a letter, or an adjacent pattern.
  if (originalTotal !== null && 5 * Math.abs(total - originalTotal) >= 2 * originalTotal) {
    return null;
  }
  if (!matchesRatio(runs)) return null;

  // Distance travelled along the axis, converted back to a coordinate.
  const back = runs[4]! + runs[3]! + runs[2]! / 2;
  return stepX !== 0 ? x - stepX * back : y - stepY * back;
}

/**
 * Find every plausible finder-pattern centre in a binarized image.
 *
 * Candidates are merged when they agree on both position and module size, and
 * the `count` of agreeing scan lines becomes a confidence score the grouping
 * stage sorts by.
 *
 * @param bits - The binarized image.
 * @param limit - Stop after this many distinct candidates (0 = unlimited).
 */
export function findFinderPatterns(bits: BitMatrix, limit = 0): FinderCandidate[] {
  const candidates: Array<{ x: number; y: number; moduleSize: number; count: number }> = [];
  const { width, height } = bits;

  // Rows are sampled rather than exhaustively walked: a finder pattern is seven
  // modules tall, so a symbol big enough to decode cannot slip between samples
  // three rows apart, and the scan cost drops by the same factor.
  const rowStep = Math.max(1, Math.floor(height / 256));

  for (let y = 0; y < height; y += rowStep) {
    const runs = [0, 0, 0, 0, 0];
    let state = 0;
    let rowOffset = y * width;

    for (let x = 0; x < width; x++) {
      const dark = bits.data[rowOffset + x] === 1;

      if (dark === (state % 2 === 0)) {
        // Same colour as the run we are in.
        runs[state]!++;
        continue;
      }

      if (state === 4) {
        if (matchesRatio(runs)) {
          const centreX = centreOfRuns(runs, x);
          const total = runs[0]! + runs[1]! + runs[2]! + runs[3]! + runs[4]!;
          const moduleSize = total / 7;
          const found = confirm(bits, centreX, y, moduleSize, total, candidates);
          if (found && limit > 0 && candidates.length >= limit) {
            return finalize(candidates);
          }
        }
        // Shift the window: the last two runs become the first two.
        runs[0] = runs[2]!;
        runs[1] = runs[3]!;
        runs[2] = runs[4]!;
        runs[3] = 1;
        runs[4] = 0;
        state = 3;
      } else {
        runs[++state] = 1;
      }
    }

    // A pattern that ends exactly at the right edge of the image.
    if (state === 4 && matchesRatio(runs)) {
      const total = runs[0]! + runs[1]! + runs[2]! + runs[3]! + runs[4]!;
      confirm(bits, centreOfRuns(runs, width), y, total / 7, total, candidates);
    }
  }

  return finalize(candidates);
}

/**
 * Cross-check a row hit vertically and diagonally, then merge it into the
 * candidate list. Returns whether a *new* candidate was created.
 */
function confirm(
  bits: BitMatrix,
  centreX: number,
  rowY: number,
  moduleSize: number,
  rowTotal: number,
  candidates: Array<{ x: number; y: number; moduleSize: number; count: number }>,
): boolean {
  const maxCount = Math.ceil(moduleSize * 7);
  const x = Math.round(centreX);

  const verticalCentre = crossCheck(bits, x, rowY, 0, 1, maxCount, rowTotal);
  if (verticalCentre === null) return false;

  const y = Math.round(verticalCentre);
  const horizontalCentre = crossCheck(bits, x, y, 1, 0, maxCount, rowTotal);
  if (horizontalCentre === null) return false;

  // ── Diagonals are checked by ratio only, never by length ──
  // How long a diagonal chord through the pattern is depends entirely on how
  // the pattern is rotated: √2 × its side when axis-aligned, and 1 × its side
  // when the symbol sits at 45°, with everything in between. There is no
  // expected length to compare against, and comparing to the row scan's total
  // rejects real patterns — measured in a browser, where an antialiased symbol
  // rotated 37° lost one of its three finders and became undecodable while
  // jsQR read it fine.
  //
  // The diagonals still earn their place: a run of text or a 1D barcode
  // produces the 1 : 1 : 3 : 1 : 1 ratio on one axis and nothing at all on a
  // diagonal, which the ratio test alone rejects.
  if (crossCheck(bits, x, y, 1, 1, maxCount, null) === null) return false;
  if (crossCheck(bits, x, y, 1, -1, maxCount, null) === null) return false;

  for (const candidate of candidates) {
    const sizeDelta = Math.abs(candidate.moduleSize - moduleSize);
    if (
      Math.abs(candidate.x - horizontalCentre) <= CENTRE_TOLERANCE * candidate.moduleSize &&
      Math.abs(candidate.y - verticalCentre) <= CENTRE_TOLERANCE * candidate.moduleSize &&
      (sizeDelta <= MODULE_SIZE_TOLERANCE ||
        sizeDelta / candidate.moduleSize <= MODULE_SIZE_TOLERANCE)
    ) {
      // Running average, weighted by how many lines have agreed so far — a
      // centre confirmed ten times should not be dragged by an eleventh.
      const total = candidate.count + 1;
      candidate.x = (candidate.x * candidate.count + horizontalCentre) / total;
      candidate.y = (candidate.y * candidate.count + verticalCentre) / total;
      candidate.moduleSize = (candidate.moduleSize * candidate.count + moduleSize) / total;
      candidate.count = total;
      return false;
    }
  }

  candidates.push({ x: horizontalCentre, y: verticalCentre, moduleSize, count: 1 });
  return true;
}

function finalize(
  candidates: Array<{ x: number; y: number; moduleSize: number; count: number }>,
): FinderCandidate[] {
  // A real finder pattern is confirmed by several scan lines; a coincidence
  // usually is not. But a symbol photographed small enough can legitimately
  // produce a single confirmation, so the filter only applies when discarding
  // the singletons still leaves a full triple to work with.
  const confirmed = candidates.filter((candidate) => candidate.count >= 2);
  const pool = confirmed.length >= 3 ? confirmed : candidates;

  // Ordering by confidence lets the grouping stage try the likeliest triples
  // first, which matters when a busy photo yields a dozen candidates.
  return pool
    .slice()
    .sort((a, b) => b.count - a.count)
    .map(({ x, y, moduleSize, count }) => ({ x, y, moduleSize, count }));
}

/** Euclidean distance between two points — used all over the detector. */
export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
