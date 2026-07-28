import type { BitMatrix } from "../image/bitmatrix";
import type { Point } from "../types";

/**
 * Finding the bottom-right alignment pattern — the fourth point that turns a
 * three-corner guess into a real perspective correction.
 *
 * With three finder patterns you can only build a transform that assumes the
 * symbol's far corner is exactly where the other three imply. On a flat scan
 * that is true; on a photograph taken at an angle it is off by several modules
 * by the time it reaches the far corner, and the sampler starts reading
 * neighbours instead of the modules it wants. The alignment pattern pins that
 * corner down.
 *
 * Versions 2 and up carry one near the bottom-right (version 1 has none). It is
 * a 5 × 5 square — dark ring, light ring, dark centre:
 *
 * ```
 * #####      a row through the centre reads  # . # . #
 * #...#
 * #.#.#      but only the inner three runs — light, dark,
 * #...#      light — are trustworthy
 * #####
 * ```
 *
 * ── Why the outer runs are not matched ──
 * The two dark runs at the ends are the pattern's border *plus* whatever data
 * modules happen to sit against it. In a real symbol that is routinely two or
 * three modules, so requiring five one-module runs rejects almost every genuine
 * alignment pattern — measured, not assumed: the first implementation here did
 * exactly that and found none at all.
 *
 * The inner three runs cannot be contaminated: the light ring is bounded by the
 * pattern's own dark border outside and its dark centre inside, whatever the
 * surrounding data does. So the match is light-dark-light, each one module, and
 * the centre reported is the middle (dark) run — the pattern's true centre.
 */

/** Each run may deviate from one module by this fraction. */
const RATIO_TOLERANCE = 0.5;

function matchesRatio(runs: ArrayLike<number>, moduleSize: number): boolean {
  const tolerance = moduleSize * RATIO_TOLERANCE;
  for (let i = 0; i < 3; i++) {
    if (runs[i]! === 0 || Math.abs(runs[i]! - moduleSize) >= tolerance) return false;
  }
  return true;
}

/** Centre of the middle (dark) run, given the run lengths and the scan's end. */
function centreOfRuns(runs: ArrayLike<number>, end: number): number {
  return end - runs[2]! - runs[1]! / 2;
}

/**
 * Walk vertically through a candidate centre and confirm the same
 * light-dark-light profile, returning the refined y or `null`.
 */
function crossCheckVertical(
  bits: BitMatrix,
  x: number,
  y: number,
  moduleSize: number,
): number | null {
  const maxCount = Math.ceil(moduleSize * 2) + 1;
  const runs = [0, 0, 0];

  // The dark centre run, walking up from the starting point…
  let cursor = y;
  while (cursor >= 0 && bits.get(x, cursor) && runs[1]! <= maxCount) {
    runs[1]!++;
    cursor--;
  }
  if (cursor < 0 || runs[1]! === 0 || runs[1]! > maxCount) return null;

  // …then the light ring above it.
  while (cursor >= 0 && !bits.get(x, cursor) && runs[0]! <= maxCount) {
    runs[0]!++;
    cursor--;
  }
  if (cursor < 0 || runs[0]! === 0 || runs[0]! > maxCount) return null;

  // The rest of the dark centre, downward…
  cursor = y + 1;
  while (cursor < bits.height && bits.get(x, cursor) && runs[1]! <= maxCount) {
    runs[1]!++;
    cursor++;
  }
  if (cursor >= bits.height || runs[1]! > maxCount) return null;

  // …and the light ring below.
  while (cursor < bits.height && !bits.get(x, cursor) && runs[2]! <= maxCount) {
    runs[2]!++;
    cursor++;
  }
  if (cursor >= bits.height || runs[2]! === 0 || runs[2]! > maxCount) return null;

  if (!matchesRatio(runs, moduleSize)) return null;
  return centreOfRuns(runs, cursor);
}

/**
 * Search a window around `predicted` for an alignment pattern.
 *
 * @param bits - Binarized image.
 * @param predicted - Where the three-corner estimate says the centre should be.
 * @param moduleSize - Estimated module size in image pixels.
 * @param radius - Search radius in pixels. Defaults to five modules, which
 *   covers the error a moderate perspective introduces without wandering so far
 *   into the data region that a coincidental match becomes likely.
 * @returns The refined centre, or `null` when nothing convincing is there —
 *   which is not fatal: the caller falls back to the three-point estimate.
 */
export function findAlignmentPattern(
  bits: BitMatrix,
  predicted: Point,
  moduleSize: number,
  radius = moduleSize * 5,
): Point | null {
  const left = Math.max(0, Math.floor(predicted.x - radius));
  const right = Math.min(bits.width - 1, Math.ceil(predicted.x + radius));
  const top = Math.max(0, Math.floor(predicted.y - radius));
  const bottom = Math.min(bits.height - 1, Math.ceil(predicted.y + radius));

  // Too small a window to hold a 5-module pattern: not an error, just nothing
  // to find.
  if (right - left < moduleSize * 4 || bottom - top < moduleSize * 4) return null;

  let best: Point | null = null;
  let bestDistance = Infinity;
  const centreRow = Math.round(predicted.y);

  // Rows are walked outward from the predicted centre, so a match near the
  // prediction is preferred over an equally good one further away — which is
  // what keeps a chance 1:1:1 run in the data region from winning.
  //
  // The bound is the larger of the two half-windows, not the window's height:
  // when an image edge clips one side, the two are different, and iterating
  // `height` times would spend half the loop on rows outside the window and
  // never reach the far edge of the surviving half.
  const reach = Math.max(centreRow - top, bottom - centreRow);
  for (let offset = 0; offset <= reach * 2 + 1; offset++) {
    const y = offset % 2 === 0 ? centreRow + offset / 2 : centreRow - (offset + 1) / 2;
    if (y < top || y > bottom) continue;

    const runs = [0, 0, 0];
    let state = 0;

    for (let x = left; x <= right; x++) {
      const dark = bits.get(x, y);

      // States 0 and 2 are light; state 1 is dark.
      if (dark === (state === 1)) {
        runs[state]!++;
        continue;
      }

      if (state === 2) {
        if (matchesRatio(runs, moduleSize)) {
          const centreX = centreOfRuns(runs, x);
          const centreY = crossCheckVertical(bits, Math.round(centreX), y, moduleSize);
          if (centreY !== null) {
            const spread = Math.hypot(centreX - predicted.x, centreY - predicted.y);
            if (spread < bestDistance) {
              bestDistance = spread;
              best = { x: centreX, y: centreY };
            }
          }
        }
        // Shift the window: the trailing light run becomes the next leading one.
        runs[0] = runs[2]!;
        runs[1] = 1;
        runs[2] = 0;
        state = 1;
      } else {
        runs[++state] = 1;
      }
    }
  }

  return best;
}

/**
 * Where the bottom-right alignment pattern should be, given the three finder
 * centres.
 *
 * The naive answer — complete the parallelogram — overshoots, because the
 * alignment pattern sits 3 modules in from the corner while the finder centres
 * sit 3.5 in. The correction pulls the estimate back towards the top-left by
 * exactly that difference, expressed as a fraction of the symbol's width.
 */
export function predictAlignment(
  topLeft: Point,
  topRight: Point,
  bottomLeft: Point,
  dimension: number,
): Point {
  const correction = 1 - 3 / (dimension - 7);
  return {
    x: topLeft.x + correction * (topRight.x - topLeft.x + bottomLeft.x - topLeft.x),
    y: topLeft.y + correction * (topRight.y - topLeft.y + bottomLeft.y - topLeft.y),
  };
}
