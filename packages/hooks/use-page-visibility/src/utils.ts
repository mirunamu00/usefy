import type { PageVisibilityState } from "./types";

/**
 * The inert page-visibility value returned during server-side rendering and in
 * any environment without a `document`. The page is optimistically treated as
 * **visible** — this is the value most apps want on the server and it avoids a
 * hydration mismatch on the client's first paint of a foreground tab.
 */
export const SERVER_PAGE_VISIBILITY = true;

/**
 * Whether a `document` object is available (i.e. running in a browser-like
 * environment rather than SSR).
 *
 * @returns `true` when `document` is defined.
 *
 * @example
 * ```ts
 * if (isDocumentAvailable()) {
 *   // Safe to read document.visibilityState
 * }
 * ```
 */
export function isDocumentAvailable(): boolean {
  return typeof document !== "undefined";
}

/**
 * Whether the Page Visibility API is available in the current environment.
 *
 * @returns `true` when `document.visibilityState` is present.
 *
 * @example
 * ```ts
 * const supported = isPageVisibilitySupported();
 * ```
 */
export function isPageVisibilitySupported(): boolean {
  return isDocumentAvailable() && "visibilityState" in document;
}

/**
 * Read the raw {@link PageVisibilityState} from `document.visibilityState`.
 *
 * Anything that is not explicitly `"hidden"` is reported as `"visible"`, so
 * legacy `"prerender"`/`"unloaded"` values collapse to `"visible"`.
 *
 * @returns `"visible"` or `"hidden"`. Returns `"visible"` under SSR / without a
 * `document`, matching the optimistic server default.
 *
 * @example
 * ```ts
 * const state = getVisibilityState(); // "visible" | "hidden"
 * ```
 */
export function getVisibilityState(): PageVisibilityState {
  if (!isDocumentAvailable()) {
    return "visible";
  }
  return document.visibilityState === "hidden" ? "hidden" : "visible";
}

/**
 * Read the current page visibility as a boolean, derived from
 * `document.visibilityState`.
 *
 * @returns `true` when the page is visible (foreground), `false` when hidden.
 * Returns {@link SERVER_PAGE_VISIBILITY} (`true`) under SSR / without a
 * `document`.
 *
 * @example
 * ```ts
 * if (getPageVisibility()) {
 *   // the page is in the foreground
 * }
 * ```
 */
export function getPageVisibility(): boolean {
  if (!isDocumentAvailable()) {
    return SERVER_PAGE_VISIBILITY;
  }
  return document.visibilityState !== "hidden";
}
