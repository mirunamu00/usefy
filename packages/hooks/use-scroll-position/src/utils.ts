import type { RefObject } from "react";
import type { ScrollPosition, ScrollPositionTarget } from "./types";

/**
 * The inert, frozen zero scroll offset used as the initial value and the
 * SSR / server-render fallback. Frozen so it can be shared as a stable
 * reference without risk of accidental mutation.
 */
export const ZERO_SCROLL_POSITION: ScrollPosition = Object.freeze({ x: 0, y: 0 });

/**
 * Whether the code is running in a browser environment (i.e. `window` exists).
 * Returns `false` during SSR.
 */
export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Narrow an arbitrary value to a React `RefObject` (an object exposing a
 * `current` property).
 */
function isRefObject(
  value: HTMLElement | RefObject<HTMLElement | null>
): value is RefObject<HTMLElement | null> {
  return typeof value === "object" && value !== null && "current" in value;
}

/**
 * Whether the given value is the global `window` object.
 */
export function isWindow(
  value: Window | HTMLElement | null
): value is Window {
  return isBrowser() && value === window;
}

/**
 * Resolve the user-facing `element` option into the actual scroll target to
 * attach a listener to and read offsets from.
 *
 * - `null` / `undefined` → the global `window`.
 * - A `RefObject` → its `current` element (may be `null` if not attached yet).
 * - A raw `HTMLElement` → itself.
 *
 * Returns `null` on the server (no `window`), so callers can no-op safely.
 */
export function resolveScrollTarget(
  element: ScrollPositionTarget
): Window | HTMLElement | null {
  if (!isBrowser()) return null;
  if (element == null) return window;
  if (isRefObject(element)) return element.current;
  return element;
}

/**
 * Read the current {@link ScrollPosition} from a resolved scroll target.
 *
 * For the window it reads `scrollX`/`scrollY`; for an element it reads
 * `scrollLeft`/`scrollTop`. Returns {@link ZERO_SCROLL_POSITION} when the target
 * is `null` (unattached ref / SSR).
 */
export function getScrollPosition(
  target: Window | HTMLElement | null
): ScrollPosition {
  if (target === null) return ZERO_SCROLL_POSITION;
  if (isWindow(target)) {
    return { x: target.scrollX, y: target.scrollY };
  }
  return { x: target.scrollLeft, y: target.scrollTop };
}

/**
 * Structural equality check for two {@link ScrollPosition} values. Used to bail
 * out of a state update when a scroll event produced an identical offset, so
 * React can skip the re-render.
 */
export function arePositionsEqual(a: ScrollPosition, b: ScrollPosition): boolean {
  return a.x === b.x && a.y === b.y;
}
