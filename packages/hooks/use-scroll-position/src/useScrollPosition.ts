import { useState } from "react";
import { useIsomorphicLayoutEffect } from "@usefy/use-isomorphic-layout-effect";
import { useLatest } from "@usefy/use-latest";
import type {
  UseScrollPositionOptions,
  UseScrollPositionReturn,
} from "./types";
import {
  arePositionsEqual,
  getScrollPosition,
  resolveScrollTarget,
  ZERO_SCROLL_POSITION,
} from "./utils";

/** Default throttle interval, in milliseconds. */
const DEFAULT_THROTTLE_MS = 100;

/**
 * Track the throttled scroll offset (`{ x, y }`) of the window or a given
 * element, re-rendering as the target scrolls.
 *
 * By default the hook tracks the window/document scroll. Pass an `element` (a
 * raw `HTMLElement` or a `RefObject<HTMLElement>`) to track that element's own
 * scroll instead. The listener is attached with `{ passive: true }` and the
 * handler is throttled — it fires on the leading edge and always once more on
 * the trailing edge, so the settled resting position is never dropped.
 *
 * Behaviour notes:
 * - **Synchronous initial read**: the current position is read in a layout
 *   effect on mount (via `useIsomorphicLayoutEffect`), so the first commit after
 *   mount reflects the real offset rather than `0, 0`.
 * - **SSR-safe**: no `window`/`document` access on the server. It returns
 *   `{ x: 0, y: 0 }` and attaches nothing until it runs on the client.
 * - **StrictMode / concurrent-safe**: the listener and any pending trailing
 *   timer are cleaned up on unmount and whenever the target element changes, so
 *   double-mount/unmount never leaks a listener or a timer.
 * - **Stable throttle**: changing `throttleMs` between renders does not
 *   re-subscribe the listener — the latest value is read from a ref on each
 *   scroll event.
 *
 * @param options - Optional `element` (target, defaults to the window) and
 *   `throttleMs` (throttle interval; `0` disables throttling).
 * @returns The current {@link ScrollPosition} `{ x, y }`. The returned object
 *   keeps a stable identity across scroll events that don't change the offset.
 *
 * @example
 * ```tsx
 * // Track the window scroll (throttled to 100ms by default).
 * import { useScrollPosition } from "@usefy/use-scroll-position";
 *
 * function ScrollIndicator() {
 *   const { x, y } = useScrollPosition();
 *   return <div>Scrolled to {x}, {y}</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Track a scrollable element via a ref, updating on every frame.
 * import { useRef } from "react";
 * import { useScrollPosition } from "@usefy/use-scroll-position";
 *
 * function Pane() {
 *   const ref = useRef<HTMLDivElement>(null);
 *   const { y } = useScrollPosition({ element: ref, throttleMs: 0 });
 *
 *   return (
 *     <div ref={ref} style={{ overflow: "auto", height: 200 }}>
 *       <p>scrollTop: {y}</p>
 *       <div style={{ height: 2000 }} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useScrollPosition(
  options: UseScrollPositionOptions = {}
): UseScrollPositionReturn {
  const { element, throttleMs = DEFAULT_THROTTLE_MS } = options;

  const [position, setPosition] =
    useState<UseScrollPositionReturn>(ZERO_SCROLL_POSITION);

  // Keep the latest throttle interval in a ref so changing it never re-subscribes
  // the scroll listener — the handler reads the fresh value on each event.
  const throttleRef = useLatest(throttleMs);

  // A single layout effect owns the whole lifecycle: it reads the initial
  // position synchronously, attaches the throttled listener, and tears both the
  // listener and any pending trailing timer down on unmount / target change.
  //
  // The effect re-runs when `element` changes. A `RefObject`'s identity is
  // stable, so a ref target subscribes once (mirroring `useEventListener`); a
  // raw element re-subscribes when its identity changes.
  useIsomorphicLayoutEffect(() => {
    const target = resolveScrollTarget(element);
    if (target === null) return;

    // Commit the current offset, bailing out of the re-render when unchanged so
    // no-op scrolls don't allocate a new object or re-render.
    const commit = () => {
      const next = getScrollPosition(target);
      setPosition((prev) => (arePositionsEqual(prev, next) ? prev : next));
    };

    // Synchronous initial read so the first commit reflects the real position.
    commit();

    // Timestamp-based leading+trailing throttle. `-Infinity` guarantees the very
    // first scroll fires on the leading edge regardless of the current clock.
    let lastRun = Number.NEGATIVE_INFINITY;
    let trailingTimer: ReturnType<typeof setTimeout> | null = null;

    const handleScroll = () => {
      const interval = throttleRef.current;

      // No throttle: commit on every scroll event.
      if (interval <= 0) {
        commit();
        return;
      }

      const now = Date.now();
      const elapsed = now - lastRun;

      if (elapsed >= interval) {
        // Leading edge (or a full interval has elapsed) — commit now.
        if (trailingTimer !== null) {
          clearTimeout(trailingTimer);
          trailingTimer = null;
        }
        lastRun = now;
        commit();
      } else if (trailingTimer === null) {
        // Within the throttle window — schedule a single trailing commit so the
        // final resting position is always captured.
        trailingTimer = setTimeout(() => {
          lastRun = Date.now();
          trailingTimer = null;
          commit();
        }, interval - elapsed);
      }
    };

    target.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      target.removeEventListener("scroll", handleScroll);
      if (trailingTimer !== null) {
        clearTimeout(trailingTimer);
        trailingTimer = null;
      }
    };
    // `throttleMs` is intentionally excluded — it's read live from `throttleRef`,
    // so it must not re-subscribe the listener.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [element]);

  return position;
}
