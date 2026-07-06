/**
 * The document's visibility state, mirroring the string values of
 * `document.visibilityState` from the Page Visibility API.
 *
 * - `"visible"` — the page is at least partially visible (the foreground tab of
 *   a non-minimized window).
 * - `"hidden"` — the page is not visible to the user (a background tab, a
 *   minimized window, or the device screen is off/locked).
 *
 * The spec historically also allowed `"prerender"` and `"unloaded"`, but modern
 * browsers only surface `"visible"` and `"hidden"`, so those are the only two
 * states this hook reports.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilityState
 */
export type PageVisibilityState = "visible" | "hidden";

/**
 * Callback invoked on every page-visibility transition observed by
 * {@link usePageVisibility}.
 *
 * Fired from the `visibilitychange` event handler, outside any `setState`
 * updater, so it is safe under StrictMode and concurrent rendering.
 * It is read through a ref, so changing the callback between renders never
 * re-subscribes the underlying listener.
 *
 * @param visible - `true` when the page just became visible, `false` when it
 * became hidden.
 */
export type OnVisibilityChange = (visible: boolean) => void;

/**
 * The value returned by {@link usePageVisibility}: `true` while the page/tab is
 * in the foreground (visible), `false` while it is hidden.
 */
export type UsePageVisibilityReturn = boolean;
