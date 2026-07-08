/**
 * Whether a `document` object is available (i.e. running in a browser-like
 * environment rather than SSR).
 *
 * Used as the SSR-safety boundary for {@link useClickAnyWhere}: when no
 * `document` is present the hook skips attaching any listeners on the server.
 *
 * @returns `true` when `document` is defined.
 *
 * @example
 * ```ts
 * if (isDocumentAvailable()) {
 *   // Safe to call document.addEventListener
 * }
 * ```
 */
export function isDocumentAvailable(): boolean {
  return typeof document !== "undefined";
}
