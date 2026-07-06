import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import type { OnVisibilityChange, UsePageVisibilityReturn } from "./types";
import {
  SERVER_PAGE_VISIBILITY,
  getPageVisibility,
  isDocumentAvailable,
} from "./utils";

/**
 * Track whether the page (tab/window) is currently visible to the user, via the
 * [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API).
 *
 * Returns `true` while the page is in the foreground and `false` while it is
 * hidden — a background tab, a minimized window, or a locked/off screen. The
 * value updates on the document `visibilitychange` event.
 *
 * Built on `useSyncExternalStore`, so it is tear-free under concurrent
 * rendering and SSR-safe out of the box. On the server (or any environment
 * without a `document`) it returns `true`: the page is optimistically treated
 * as visible, which is what most apps want and avoids a hydration mismatch on
 * the first client paint of a foreground tab.
 *
 * Pass an optional `onChange` callback to run side effects on each transition
 * (pause a video, stop polling, mute audio, …). It is invoked from the
 * `visibilitychange` event handler — never from inside a `setState` updater —
 * and is read through a ref, so replacing the callback between renders never
 * re-subscribes the listener.
 *
 * @param onChange - Optional callback fired on every visibility transition with
 * the new boolean value (`true` = visible, `false` = hidden).
 * @returns `true` when the page is visible, `false` when hidden.
 *
 * @example
 * ```tsx
 * // Basic: show a badge while the tab is in the background
 * function TabStatus() {
 *   const visible = usePageVisibility();
 *   return <span>{visible ? "👀 Active" : "💤 Background"}</span>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Pause work while hidden, resume when visible
 * function LiveFeed() {
 *   const visible = usePageVisibility();
 *   useEffect(() => {
 *     if (!visible) return; // don't poll in the background
 *     const id = setInterval(fetchUpdates, 5000);
 *     return () => clearInterval(id);
 *   }, [visible]);
 *   return <Feed />;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // React to transitions with the onChange callback
 * function Player({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement> }) {
 *   usePageVisibility((visible) => {
 *     if (visible) videoRef.current?.play();
 *     else videoRef.current?.pause();
 *   });
 *   return <video ref={videoRef} />;
 * }
 * ```
 */
export function usePageVisibility(
  onChange?: OnVisibilityChange
): UsePageVisibilityReturn {
  // Latest-callback ref: hold the newest `onChange` without re-subscribing the
  // listener. Updated in a post-commit effect so we never fire a callback from
  // a render React may discard (StrictMode / concurrent safe).
  const onChangeRef = useRef<OnVisibilityChange | undefined>(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const subscribe = useCallback((onStoreChange: () => void) => {
    if (!isDocumentAvailable()) {
      return () => {};
    }

    const handleVisibilityChange = () => {
      // Notify the store first so React schedules a re-render with the new
      // value, then dispatch the user callback from the event handler —
      // outside any setState updater, so it is StrictMode/concurrent safe.
      // `visibilitychange` only fires on real transitions, so every call is a
      // genuine change.
      onStoreChange();
      onChangeRef.current?.(getPageVisibility());
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const getSnapshot = useCallback((): boolean => getPageVisibility(), []);

  const getServerSnapshot = useCallback(
    (): boolean => SERVER_PAGE_VISIBILITY,
    []
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
