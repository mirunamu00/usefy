import type { BitMatrix } from "../image/bitmatrix";
import type { Point } from "../types";

/**
 * Measuring module size **along the symbol's own axes**.
 *
 * The obvious estimate — one seventh of the finder pattern's width as seen by
 * the horizontal scan — is wrong for any symbol that is not axis-aligned. A row
 * cutting through a pattern rotated by θ crosses it along a longer chord, so
 * every run is stretched by `1 / cos θ`: 15 % at 30°, 41 % at 45°. Feed that
 * into the dimension estimate and a 29-module symbol is confidently measured as
 * 25, after which nothing downstream can succeed.
 *
 * So the module size is re-measured along the line joining two finder centres,
 * which is by construction one of the symbol's own axes and therefore immune to
 * how the symbol happens to sit in the frame.
 */

/**
 * Walk from `from` towards `to`, counting the black-white-black transition
 * widths of the finder pattern at `from`, and return the distance covered.
 *
 * A Bresenham walk rather than floating-point stepping: it visits exactly the
 * pixels a line covers, with no risk of skipping one on a steep slope.
 */
function runLengthTowards(bits: BitMatrix, from: Point, to: Point): number {
  let fromX = Math.round(from.x);
  let fromY = Math.round(from.y);
  let toX = Math.round(to.x);
  let toY = Math.round(to.y);

  // Walk in the steeper axis so every step advances one pixel there.
  const steep = Math.abs(toY - fromY) > Math.abs(toX - fromX);
  if (steep) {
    [fromX, fromY] = [fromY, fromX];
    [toX, toY] = [toY, toX];
  }

  const dx = Math.abs(toX - fromX);
  const dy = Math.abs(toY - fromY);
  let error = -dx / 2;
  const xStep = fromX < toX ? 1 : -1;
  const yStep = fromY < toY ? 1 : -1;

  // Three state changes: leaving the centre's black, crossing the white ring,
  // and leaving the outer black ring — 3 modules of the pattern.
  let state = 0;
  const limit = toX + xStep;

  for (let x = fromX, y = fromY; x !== limit; x += xStep) {
    const realX = steep ? y : x;
    const realY = steep ? x : y;

    // States 0 and 2 expect dark, state 1 expects light. A pixel of the *wrong*
    // colour for the current state means a boundary was just crossed.
    const dark = bits.getSafe(realX, realY);
    if (state === 1 ? dark : !dark) {
      if (state === 2) {
        return Math.hypot(x - fromX, y - fromY);
      }
      state++;
    }

    error += dy;
    if (error > 0) {
      if (y === toY) break;
      y += yStep;
      error -= dx;
    }
  }

  // Ran off the end of the line while still inside the final black run: the
  // pattern extends past `to`, so the distance to `to` is the best estimate.
  if (state === 2) return Math.hypot(toX - fromX, toY - fromY);
  return NaN;
}

/**
 * The width of the black-white-black run through a finder pattern, measured in
 * both directions along the line to `other` and summed.
 *
 * Measuring both ways doubles the sample and, more importantly, cancels the
 * error from the centre pixel being counted twice.
 */
function runLengthBothWays(bits: BitMatrix, centre: Point, other: Point): number {
  const forward = runLengthTowards(bits, centre, other);

  // Mirror `other` through `centre`, clamped to the image, and walk that way too.
  const scale = (() => {
    const dx = centre.x - other.x;
    const dy = centre.y - other.y;
    let limit = 1;
    if (centre.x + dx < 0) limit = Math.min(limit, centre.x / -dx);
    else if (centre.x + dx >= bits.width) limit = Math.min(limit, (bits.width - 1 - centre.x) / dx);
    if (centre.y + dy < 0) limit = Math.min(limit, centre.y / -dy);
    else if (centre.y + dy >= bits.height) limit = Math.min(limit, (bits.height - 1 - centre.y) / dy);
    return limit;
  })();

  const backward = runLengthTowards(bits, centre, {
    x: centre.x + (centre.x - other.x) * scale,
    y: centre.y + (centre.y - other.y) * scale,
  });

  if (Number.isNaN(forward)) return backward;
  if (Number.isNaN(backward)) return forward;
  // The centre pixel is counted by both halves.
  return forward + backward - 1;
}

/**
 * Module size along the axis between two finder centres, in image pixels.
 *
 * Each pattern contributes the 3-module width of its own black-white-black run
 * measured both ways (so 7 modules of pattern in total across the two
 * directions); averaging the two patterns' answers is what makes this robust
 * when one of them sits in shadow.
 *
 * @returns `NaN` when neither pattern could be measured — the caller then falls
 *   back to the scan-derived estimate.
 */
export function moduleSizeBetween(
  bits: BitMatrix,
  pattern: Point,
  other: Point,
): number {
  const first = runLengthBothWays(bits, pattern, other);
  const second = runLengthBothWays(bits, other, pattern);

  if (Number.isNaN(first)) return second / 7;
  if (Number.isNaN(second)) return first / 7;
  return (first + second) / 14;
}
