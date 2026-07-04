import type { Bounds } from "./types";

/**
 * The inert, all-zero {@link Bounds} used before an element is measured and as
 * the SSR / server-render fallback. Frozen so it can be shared safely as a
 * stable reference.
 */
export const EMPTY_BOUNDS: Bounds = Object.freeze({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
});

/**
 * Convert a {@link DOMRect} / {@link DOMRectReadOnly} (e.g. from
 * `getBoundingClientRect()`) into a plain {@link Bounds} object.
 *
 * Every field is coerced to a number so a rect from an environment that omits
 * `x`/`y` (some older engines and partial jsdom rects) still satisfies the
 * `Bounds` contract instead of leaking `undefined`.
 */
export function rectToBounds(rect: DOMRectReadOnly): Bounds {
  return {
    x: rect.x ?? rect.left ?? 0,
    y: rect.y ?? rect.top ?? 0,
    width: rect.width ?? 0,
    height: rect.height ?? 0,
    top: rect.top ?? 0,
    right: rect.right ?? 0,
    bottom: rect.bottom ?? 0,
    left: rect.left ?? 0,
  };
}

/**
 * Structural equality check for two {@link Bounds} objects. Used to bail out of
 * a state update when a re-measure produced identical bounds, so React skips
 * the re-render.
 */
export function areBoundsEqual(a: Bounds, b: Bounds): boolean {
  return (
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height &&
    a.top === b.top &&
    a.right === b.right &&
    a.bottom === b.bottom &&
    a.left === b.left
  );
}
