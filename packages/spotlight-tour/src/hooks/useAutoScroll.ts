import { useEffect, useState } from "react";
import { useIsomorphicLayoutEffect } from "@usefy/use-isomorphic-layout-effect";

/** Quiet period (ms) without scroll events after which the scroll counts as settled. */
export const SCROLL_SETTLE_QUIET_MS = 150;

/** Options for {@link useAutoScroll}. */
export interface UseAutoScrollOptions {
  /** The resolved step target, or `null` (nothing to scroll to). */
  element: Element | null;
  /** Master switch — `open && step.scrollIntoView !== false`. */
  enabled: boolean;
  /** Scroll instantly instead of smoothly (reduced motion). */
  instant: boolean;
}

/**
 * Scroll an off-viewport step target into view and report while the scroll is
 * in flight (SPEC §3.4 auto-scroll).
 *
 * When `element` changes (a step settles) and its box is not fully inside the
 * viewport, the hook calls `scrollIntoView({ block: 'center' })` — `smooth`
 * normally, instant under reduced motion — and returns `true` until the
 * scroll **settles**. Settling is detected via the `scrollend` event where
 * supported, always backed by a quiet-period fallback timer
 * ({@link SCROLL_SETTLE_QUIET_MS} ms without scroll events), which also
 * covers the cases where no scroll event ever fires (already at the edge,
 * instant behavior).
 *
 * **Scroll-lock sequencing**: the decision (`scrolling` flips true) happens in
 * a layout effect, but the actual `scrollIntoView` call is deferred by a
 * 0-ms timer inside a passive effect. Consumers gate their scroll lock on
 * `!scrolling`, so by the time the scroll starts, the re-render that released
 * the body lock has been committed and its effects flushed — the page can
 * actually move.
 *
 * SSR-safe; all listeners and timers are cleaned up on step change, close,
 * and unmount.
 *
 * @param options - {@link UseAutoScrollOptions}
 * @returns `true` while an auto-scroll is in flight (feed into `pending`).
 *
 * @internal
 */
export function useAutoScroll(options: UseAutoScrollOptions): boolean {
  const { element, enabled, instant } = options;
  const [scrolling, setScrolling] = useState(false);

  // Decision — synchronous, before paint, so the tooltip's "pending" hide and
  // the scroll-lock release are committed before any scrolling begins.
  useIsomorphicLayoutEffect(() => {
    if (!enabled || !element || typeof window === "undefined") {
      setScrolling(false);
      return;
    }
    const rect = element.getBoundingClientRect();
    const outside =
      rect.top < 0 ||
      rect.left < 0 ||
      rect.bottom > window.innerHeight ||
      rect.right > window.innerWidth;
    setScrolling(outside);
  }, [element, enabled]);

  // Action + settle detection.
  useEffect(() => {
    if (!scrolling || !element || typeof window === "undefined") return;

    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    let done = false;

    const settle = () => {
      if (done) return;
      done = true;
      setScrolling(false);
    };
    const onScrollEnd = () => settle();
    const onScroll = () => {
      // Still moving — push the quiet-period deadline out.
      if (settleTimer !== null) clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, SCROLL_SETTLE_QUIET_MS);
    };

    // Deferred start (see the scroll-lock sequencing note in the JSDoc).
    const startTimer = setTimeout(() => {
      element.scrollIntoView({
        block: "center",
        inline: "nearest",
        behavior: instant ? "auto" : "smooth",
      });
      if ("onscrollend" in window) {
        window.addEventListener("scrollend", onScrollEnd);
      }
      // Quiet-period fallback runs in every mode: it settles when scroll
      // events stop, and also when none ever fire (nothing had to move, or
      // the scroll completed synchronously).
      window.addEventListener("scroll", onScroll, {
        capture: true,
        passive: true,
      });
      settleTimer = setTimeout(settle, SCROLL_SETTLE_QUIET_MS);
    }, 0);

    return () => {
      done = true;
      clearTimeout(startTimer);
      if (settleTimer !== null) clearTimeout(settleTimer);
      window.removeEventListener("scrollend", onScrollEnd);
      window.removeEventListener("scroll", onScroll, { capture: true });
    };
  }, [scrolling, element, instant]);

  return scrolling;
}
