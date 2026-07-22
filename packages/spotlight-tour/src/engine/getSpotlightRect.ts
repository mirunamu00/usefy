import type { Rect } from "../types";

/**
 * Compute the spotlight rect from a target rect: the target expanded by
 * `padding` px on every side. Pure — no DOM access.
 *
 * The result can go negative in `x`/`y` when the target sits at the viewport
 * edge; that is intentional (the overlay mask clips it).
 *
 * @param target - The target element's rect in viewport coordinates.
 * @param padding - Extra px added around the target on all sides.
 * @returns The padded spotlight rect.
 *
 * @example
 * ```ts
 * import { getSpotlightRect } from "@usefy/spotlight-tour/headless";
 *
 * const spotlight = getSpotlightRect({ x: 100, y: 50, width: 200, height: 40 }, 8);
 * // → { x: 92, y: 42, width: 216, height: 56 }
 * ```
 */
export function getSpotlightRect(target: Rect, padding: number): Rect {
  return {
    x: target.x - padding,
    y: target.y - padding,
    width: target.width + padding * 2,
    height: target.height + padding * 2,
  };
}
