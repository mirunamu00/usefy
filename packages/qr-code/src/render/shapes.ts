import type { QREyeShape, QRModuleShape } from "../types";
import { fmt } from "./color";

/**
 * SVG path construction for modules and finder "eyes".
 *
 * Everything here is a pure string builder over user units where one unit is
 * one module. The canvas renderer replays the *same* functions through
 * `Path2D`, so a shape can never look different between SVG and canvas —
 * there is only one definition of what "rounded" means.
 *
 * Winding matters: a finder ring is an outer shape with a hole, and under the
 * default `nonzero` fill rule the hole must run in the opposite direction from
 * the outline. Every builder therefore takes a `clockwise` flag.
 */

/** Corner radii, clockwise from the top-left. */
export type Corners = readonly [number, number, number, number];

/** An axis-aligned rectangle. */
export function rectPath(x: number, y: number, w: number, h: number, clockwise = true): string {
  const [x0, y0, x1, y1] = [fmt(x), fmt(y), fmt(x + w), fmt(y + h)];
  return clockwise
    ? `M${x0} ${y0}H${x1}V${y1}H${x0}Z`
    : `M${x0} ${y0}V${y1}H${x1}V${y0}Z`;
}

/** A rectangle with independent corner radii. */
export function roundedRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  corners: Corners,
  clockwise = true,
): string {
  const limit = Math.min(w, h) / 2;
  const [tl, tr, br, bl] = corners.map((r) => Math.max(0, Math.min(r, limit))) as unknown as Corners;
  if (tl === 0 && tr === 0 && br === 0 && bl === 0) return rectPath(x, y, w, h, clockwise);

  const right = x + w;
  const bottom = y + h;
  const sweep = clockwise ? 1 : 0;
  const arc = (r: number, ex: number, ey: number): string =>
    `A${fmt(r)} ${fmt(r)} 0 0 ${sweep} ${fmt(ex)} ${fmt(ey)}`;

  if (clockwise) {
    return (
      `M${fmt(x + tl)} ${fmt(y)}` +
      `H${fmt(right - tr)}` +
      (tr ? arc(tr, right, y + tr) : "") +
      `V${fmt(bottom - br)}` +
      (br ? arc(br, right - br, bottom) : "") +
      `H${fmt(x + bl)}` +
      (bl ? arc(bl, x, bottom - bl) : "") +
      `V${fmt(y + tl)}` +
      (tl ? arc(tl, x + tl, y) : "") +
      "Z"
    );
  }

  return (
    `M${fmt(x + tl)} ${fmt(y)}` +
    (tl ? arc(tl, x, y + tl) : `H${fmt(x)}`) +
    `V${fmt(bottom - bl)}` +
    (bl ? arc(bl, x + bl, bottom) : "") +
    `H${fmt(right - br)}` +
    (br ? arc(br, right, bottom - br) : "") +
    `V${fmt(y + tr)}` +
    (tr ? arc(tr, right - tr, y) : "") +
    "Z"
  );
}

/** A full circle, drawn as two half-arcs. */
export function circlePath(cx: number, cy: number, r: number, clockwise = true): string {
  const sweep = clockwise ? 1 : 0;
  return (
    `M${fmt(cx - r)} ${fmt(cy)}` +
    `A${fmt(r)} ${fmt(r)} 0 1 ${sweep} ${fmt(cx + r)} ${fmt(cy)}` +
    `A${fmt(r)} ${fmt(r)} 0 1 ${sweep} ${fmt(cx - r)} ${fmt(cy)}Z`
  );
}

/** Which of a module's four orthogonal neighbours are painted. */
export interface Neighbours {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

/**
 * One data module.
 *
 * The shaped variants are **neighbour-aware**: a corner is only rounded when
 * both edges meeting there are exposed. Without that, a run of rounded modules
 * would pinch at every join and visually break the code into disconnected
 * blobs — which is a scanning problem, not a taste problem.
 */
export function modulePath(
  shape: QRModuleShape,
  x: number,
  y: number,
  gap: number,
  neighbours: Neighbours,
): string {
  const inset = gap / 2;
  const px = x + inset;
  const py = y + inset;
  const span = 1 - gap;

  switch (shape) {
    case "square":
      return rectPath(px, py, span, span);
    case "dot":
      return circlePath(x + 0.5, y + 0.5, span / 2);
    case "rounded": {
      const r = span * 0.45;
      return roundedRectPath(px, py, span, span, [
        !neighbours.up && !neighbours.left ? r : 0,
        !neighbours.up && !neighbours.right ? r : 0,
        !neighbours.down && !neighbours.right ? r : 0,
        !neighbours.down && !neighbours.left ? r : 0,
      ]);
    }
    case "classy": {
      // Only the top-left and bottom-right corners round, and fully — the
      // asymmetry is what gives the style its leaf-like diagonal rhythm.
      const r = span / 2;
      return roundedRectPath(px, py, span, span, [
        !neighbours.up && !neighbours.left ? r : 0,
        0,
        !neighbours.down && !neighbours.right ? r : 0,
        0,
      ]);
    }
  }
}

/** The 7×7 finder ring (outline with a 5×5 hole), positioned in padded units. */
export function eyeOuterPath(shape: QREyeShape, x: number, y: number): string {
  switch (shape) {
    case "square":
      return rectPath(x, y, 7, 7) + rectPath(x + 1, y + 1, 5, 5, false);
    case "rounded":
      return (
        roundedRectPath(x, y, 7, 7, [2, 2, 2, 2]) +
        roundedRectPath(x + 1, y + 1, 5, 5, [1.4, 1.4, 1.4, 1.4], false)
      );
    case "circle":
      return circlePath(x + 3.5, y + 3.5, 3.5) + circlePath(x + 3.5, y + 3.5, 2.5, false);
    case "leaf":
      return (
        roundedRectPath(x, y, 7, 7, [3.5, 0, 3.5, 0]) +
        roundedRectPath(x + 1, y + 1, 5, 5, [2.5, 0, 2.5, 0], false)
      );
  }
}

/** The 3×3 finder centre, positioned in padded units. */
export function eyeInnerPath(shape: QREyeShape, x: number, y: number): string {
  switch (shape) {
    case "square":
      return rectPath(x + 2, y + 2, 3, 3);
    case "rounded":
      return roundedRectPath(x + 2, y + 2, 3, 3, [0.9, 0.9, 0.9, 0.9]);
    case "circle":
      return circlePath(x + 3.5, y + 3.5, 1.5);
    case "leaf":
      return roundedRectPath(x + 2, y + 2, 3, 3, [1.5, 0, 1.5, 0]);
  }
}
