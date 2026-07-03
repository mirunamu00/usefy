/**
 * Whether `window.matchMedia` is available (false during SSR or in very old
 * browsers).
 *
 * @example
 * ```ts
 * if (isMatchMediaSupported()) {
 *   // safe to call window.matchMedia
 * }
 * ```
 */
export function isMatchMediaSupported(): boolean {
  return (
    typeof window !== "undefined" && typeof window.matchMedia === "function"
  );
}

/**
 * Evaluate a media query string, returning `defaultValue` when `matchMedia`
 * is unavailable (SSR).
 *
 * @param query - A CSS media query, e.g. `"(min-width: 768px)"`
 * @param defaultValue - Value to return when `matchMedia` is unavailable
 * @returns Whether the query currently matches
 *
 * @example
 * ```ts
 * getMatches("(min-width: 768px)", false);
 * ```
 */
export function getMatches(query: string, defaultValue: boolean): boolean {
  if (!isMatchMediaSupported()) {
    return defaultValue;
  }
  return window.matchMedia(query).matches;
}
