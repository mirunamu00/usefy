import type { WindowSize } from "./types";

/**
 * Check whether the window object is available.
 * Returns false in SSR environments where `window` is not defined.
 *
 * @returns true if running in a browser environment
 *
 * @example
 * ```tsx
 * if (isWindowAvailable()) {
 *   // Safe to read window.innerWidth
 * }
 * ```
 */
export function isWindowAvailable(): boolean {
  return typeof window !== "undefined";
}

/**
 * Read the current window size.
 *
 * @param includeScrollbar - When true, uses `window.innerWidth`/`innerHeight`
 * (includes the scrollbar). When false, uses `document.documentElement`
 * `clientWidth`/`clientHeight` (excludes the scrollbar). Defaults to true.
 * @returns The current window size, or `{ width: 0, height: 0 }` in SSR.
 *
 * @example
 * ```tsx
 * const { width, height } = getWindowSize();          // includes scrollbar
 * const inner = getWindowSize(false);                 // excludes scrollbar
 * ```
 */
export function getWindowSize(includeScrollbar = true): WindowSize {
  if (!isWindowAvailable()) {
    return { width: 0, height: 0 };
  }

  if (includeScrollbar) {
    return { width: window.innerWidth, height: window.innerHeight };
  }

  const doc = document.documentElement;
  return { width: doc.clientWidth, height: doc.clientHeight };
}

/**
 * Compare two window sizes for equality.
 * Used to skip state updates (and re-renders) when the size hasn't changed.
 *
 * @param a - First size
 * @param b - Second size
 * @returns true if both width and height are equal
 *
 * @example
 * ```tsx
 * areSizesEqual({ width: 100, height: 50 }, { width: 100, height: 50 }); // true
 * ```
 */
export function areSizesEqual(a: WindowSize, b: WindowSize): boolean {
  return a.width === b.width && a.height === b.height;
}
