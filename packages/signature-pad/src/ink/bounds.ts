/**
 * Ink bounding box — the trim math shared by PNG/SVG export (Phase 2) and
 * anything that needs to know where the ink actually is (SPEC §4.2).
 * Pure and framework-free.
 */
import type { SignatureStroke } from "../types";
import { strokeSteps } from "./strokeWalker";

/** An axis-aligned rectangle in CSS px. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Bounding box of the rendered ink: the bbox over every flattened draw
 * step of every stroke, inflated by each step's radius (`FlatStep.width`
 * is a half-width, so a dot at (x, y) with width w covers
 * `[x − w, x + w] × [y − w, y + w]`).
 *
 * Runs the exact same geometry pipeline as rendering ({@link strokeSteps}),
 * so the box always matches what is actually drawn — including width
 * variation. Strokes are self-contained (they carry their own width
 * parameters), so no options argument is needed. Returns `null` when
 * there is no ink (no strokes, or only empty point arrays).
 *
 * @example
 * ```ts
 * import { inkBounds } from "@usefy/signature-pad/headless";
 *
 * const dot: SignatureStroke = {
 *   points: [{ x: 10, y: 20, time: 0, pressure: 0 }],
 *   color: "#000", minWidth: 1, maxWidth: 3,
 *   velocityFilterWeight: 0.7, pressure: "auto", pointerType: "mouse",
 * };
 * inkBounds([dot]);
 * // dot radius = (1 + 3) / 2 = 2 → { x: 8, y: 18, width: 4, height: 4 }
 * ```
 */
export function inkBounds(strokes: readonly SignatureStroke[]): Rect | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let any = false;

  for (const stroke of strokes) {
    for (const step of strokeSteps(stroke)) {
      any = true;
      if (step.x - step.width < minX) minX = step.x - step.width;
      if (step.y - step.width < minY) minY = step.y - step.width;
      if (step.x + step.width > maxX) maxX = step.x + step.width;
      if (step.y + step.width > maxY) maxY = step.y + step.width;
    }
  }

  if (!any) return null;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * The crop box exports use: {@link inkBounds} inflated by
 * `max(padding, capSlack)`, where `capSlack` is the largest
 * `(maxWidth − minWidth) / 2` across the strokes — the amount an SVG
 * round cap (whose radius is the segment's MEAN width) can overshoot the
 * endpoint dot radius that `inkBounds` accounts for. Flooring the
 * inflation guarantees caps are never clipped, even at `padding: 0`.
 * Shared by the PNG and SVG exporters so their crop boxes stay identical
 * (parity by construction). Returns `null` for an empty document.
 */
export function exportBounds(
  strokes: readonly SignatureStroke[],
  padding: number,
): Rect | null {
  const bounds = inkBounds(strokes);
  if (!bounds) return null;
  let capSlack = 0;
  for (const stroke of strokes) {
    const slack = (stroke.maxWidth - stroke.minWidth) / 2;
    if (slack > capSlack) capSlack = slack;
  }
  const inflate = Math.max(padding, capSlack);
  return {
    x: bounds.x - inflate,
    y: bounds.y - inflate,
    width: bounds.width + 2 * inflate,
    height: bounds.height + 2 * inflate,
  };
}
