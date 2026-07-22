import type { Rect, TourPlacement } from "../types";

/** A tooltip side once `'auto'` has been resolved. */
export type ResolvedPlacement = Exclude<TourPlacement, "auto">;

/**
 * Input for {@link computeTooltipPosition}. All rects/sizes are in viewport
 * coordinates (CSS px).
 */
export interface ComputeTooltipPositionInput {
  /** Spotlight rect (already padded). */
  target: Rect;
  /** Measured tooltip box. */
  tooltip: { width: number; height: number };
  /** Viewport size. */
  viewport: { width: number; height: number };
  /** Preferred side; `'auto'` picks the roomiest. */
  placement: TourPlacement;
  /** Gap between spotlight and tooltip. @default 12 */
  offset?: number;
  /** Minimum gap to the viewport edge. @default 8 */
  viewportMargin?: number;
}

/** Result of {@link computeTooltipPosition}. */
export interface TooltipPosition {
  /** Tooltip top-left x in viewport coordinates. */
  x: number;
  /** Tooltip top-left y in viewport coordinates. */
  y: number;
  /** The side that was actually used after flip/auto resolution. */
  placement: ResolvedPlacement;
  /** Arrow anchor point, relative to the tooltip's top-left corner. */
  arrow: { x: number; y: number };
}

/** Keep the arrow this many px away from the tooltip corners. */
const ARROW_INSET = 8;

const DEFAULT_OFFSET = 12;
const DEFAULT_VIEWPORT_MARGIN = 8;

/** Clamp `value` into `[min, max]`; when the range is inverted, returns `min`. */
function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

/**
 * Compute the tooltip position for a tour step. Pure — no DOM access.
 *
 * Strategy, in order:
 *
 * 1. **Placement** — use the preferred side; `'auto'` ranks **fit-first**: it
 *    picks the roomiest side among those where the tooltip actually fits
 *    (room ≥ tooltip size + offset + viewport margin), falling back to the
 *    roomiest side overall when none fit (ties broken in the order
 *    bottom → top → right → left).
 * 2. **Flip** — if the preferred side can't fit the tooltip (+ offset +
 *    viewport margin) but the opposite side can, flip to the opposite side.
 *    If neither fits, the roomier of the two is used.
 * 3. **Shift** — the tooltip is centered on the target along the cross axis,
 *    then clamped so it stays at least `viewportMargin` px inside the viewport.
 * 4. **Arrow** — the arrow tracks the target center but is clamped to the
 *    tooltip bounds (with an 8px corner inset) so it never detaches.
 *
 * @param input - Target/tooltip/viewport boxes and placement preferences.
 * @returns The tooltip's viewport position, the resolved side, and the arrow
 * anchor relative to the tooltip.
 *
 * @example
 * ```ts
 * import { computeTooltipPosition } from "@usefy/spotlight-tour/headless";
 *
 * const pos = computeTooltipPosition({
 *   target: { x: 100, y: 100, width: 200, height: 50 },
 *   tooltip: { width: 300, height: 120 },
 *   viewport: { width: 1024, height: 768 },
 *   placement: "bottom",
 * });
 * // → { x: 50, y: 162, placement: "bottom", arrow: { x: 150, y: 0 } }
 * ```
 */
export function computeTooltipPosition(
  input: ComputeTooltipPositionInput
): TooltipPosition {
  const {
    target,
    tooltip,
    viewport,
    placement: preferred,
    offset = DEFAULT_OFFSET,
    viewportMargin = DEFAULT_VIEWPORT_MARGIN,
  } = input;

  // Available room between the target and each viewport edge.
  const room: Record<ResolvedPlacement, number> = {
    top: target.y,
    bottom: viewport.height - (target.y + target.height),
    left: target.x,
    right: viewport.width - (target.x + target.width),
  };

  const opposite: Record<ResolvedPlacement, ResolvedPlacement> = {
    top: "bottom",
    bottom: "top",
    left: "right",
    right: "left",
  };

  /** Room a side needs to fit the tooltip without touching the viewport edge. */
  const required = (side: ResolvedPlacement): number => {
    const mainSize =
      side === "top" || side === "bottom" ? tooltip.height : tooltip.width;
    return mainSize + offset + viewportMargin;
  };

  // 1) Resolve 'auto' fit-first: prefer sides where the tooltip actually fits
  //    (room >= required); among those pick the roomiest. When none fit, fall
  //    back to the roomiest side overall. Ties break in the candidate order
  //    bottom → top → right → left (strict `>` keeps the earlier side).
  let placement: ResolvedPlacement;
  if (preferred === "auto") {
    const order: ResolvedPlacement[] = ["bottom", "top", "right", "left"];
    const fitting = order.filter((side) => room[side] >= required(side));
    const candidates = fitting.length > 0 ? fitting : order;
    placement = candidates.reduce((best, side) =>
      room[side] > room[best] ? side : best
    );
  } else {
    placement = preferred;
  }

  // 2) Flip when the chosen side overflows and the opposite side is better.
  if (room[placement] < required(placement)) {
    const flipped = opposite[placement];
    if (
      room[flipped] >= required(flipped) ||
      room[flipped] > room[placement]
    ) {
      placement = flipped;
    }
  }

  const targetCenterX = target.x + target.width / 2;
  const targetCenterY = target.y + target.height / 2;

  // 3) Main-axis coordinate + cross-axis shift (clamped to viewport margins).
  let x: number;
  let y: number;
  if (placement === "top" || placement === "bottom") {
    y =
      placement === "top"
        ? target.y - offset - tooltip.height
        : target.y + target.height + offset;
    x = clamp(
      targetCenterX - tooltip.width / 2,
      viewportMargin,
      viewport.width - viewportMargin - tooltip.width
    );
  } else {
    x =
      placement === "left"
        ? target.x - offset - tooltip.width
        : target.x + target.width + offset;
    y = clamp(
      targetCenterY - tooltip.height / 2,
      viewportMargin,
      viewport.height - viewportMargin - tooltip.height
    );
  }

  // 4) Arrow: tracks the target center, clamped inside the tooltip bounds.
  //    For degenerate (tiny) tooltips the inset shrinks so min <= max holds.
  let arrow: { x: number; y: number };
  if (placement === "top" || placement === "bottom") {
    const inset = Math.min(ARROW_INSET, tooltip.width / 2);
    arrow = {
      x: clamp(targetCenterX - x, inset, tooltip.width - inset),
      y: placement === "top" ? tooltip.height : 0,
    };
  } else {
    const inset = Math.min(ARROW_INSET, tooltip.height / 2);
    arrow = {
      x: placement === "left" ? tooltip.width : 0,
      y: clamp(targetCenterY - y, inset, tooltip.height - inset),
    };
  }

  return { x, y, placement, arrow };
}
