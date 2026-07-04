/**
 * Whether the code is running in a browser environment (both `window` and
 * `document` exist). Returns `false` during SSR so callers can no-op safely.
 */
export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/**
 * Whether the current platform is iOS (iPhone / iPad / iPod), where
 * `overflow: hidden` alone does **not** prevent touch scrolling and a
 * `position: fixed` body fix is required instead.
 *
 * Detection is user-agent based, with a `maxTouchPoints` disambiguation for
 * iPadOS 13+ (which reports itself as a desktop `"MacIntel"` platform). Returns
 * `false` on the server.
 */
export function isIOS(): boolean {
  if (!isBrowser()) return false;

  const nav = window.navigator;
  if (!nav) return false;

  const ua = nav.userAgent ?? "";
  if (/iP(hone|ad|od)/.test(ua)) return true;

  // iPadOS 13+ masquerades as macOS ("MacIntel") but reports touch points.
  return nav.platform === "MacIntel" && (nav.maxTouchPoints ?? 0) > 1;
}

/**
 * The width of the vertical scrollbar in CSS pixels
 * (`window.innerWidth - document.documentElement.clientWidth`).
 *
 * Applied as `padding-right` on the body when locking so that hiding the
 * scrollbar does not cause the page content to shift horizontally. Returns `0`
 * on the server or when there is no scrollbar (e.g. overlay scrollbars).
 */
export function getScrollbarWidth(): number {
  if (!isBrowser()) return 0;
  return window.innerWidth - document.documentElement.clientWidth;
}
