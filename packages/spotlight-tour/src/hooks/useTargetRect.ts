import { useCallback, useEffect, useRef, useState } from "react";
import { useIsomorphicLayoutEffect } from "@usefy/use-isomorphic-layout-effect";
import { useLatest } from "@usefy/use-latest";
import { useResizeObserver } from "@usefy/use-resize-observer";
import type { Rect } from "../types";

function rectsEqual(a: Rect, b: Rect): boolean {
  return (
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
  );
}

/**
 * Track an element's **viewport rect** live: re-measures on element resize
 * (via `ResizeObserver`), window resize, and any scroll (capture-phase, so
 * nested scroll containers are covered too).
 *
 * Measurements are **rAF-batched** — a burst of scroll/resize events per frame
 * collapses into a single `getBoundingClientRect` call — and state only
 * commits when the rect actually changed, so consumers don't re-render every
 * frame while nothing moves.
 *
 * SSR-safe: measuring happens in an isomorphic layout effect and no
 * `window`/`document` is touched at module scope.
 *
 * @param element - The element to track, or `null` to pause tracking (the
 * returned rect resets to `null`).
 * @returns The element's current viewport rect, or `null` when there is no
 * element (or it hasn't been measured yet on the server).
 *
 * @example
 * ```tsx
 * import { useTargetRect } from "@usefy/spotlight-tour/headless";
 *
 * function Highlight({ element }: { element: Element | null }) {
 *   const rect = useTargetRect(element);
 *   if (!rect) return null;
 *   return (
 *     <div
 *       style={{
 *         position: "fixed",
 *         left: rect.x,
 *         top: rect.y,
 *         width: rect.width,
 *         height: rect.height,
 *         outline: "2px solid hotpink",
 *         pointerEvents: "none",
 *       }}
 *     />
 *   );
 * }
 * ```
 */
export function useTargetRect(element: Element | null): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);
  const rafRef = useRef<number | null>(null);
  const elementRef = useLatest(element);

  /** Measure now and commit only if the rect actually changed. */
  const measure = useCallback(() => {
    const el = elementRef.current;
    if (!el) {
      setRect((prev) => (prev === null ? prev : null));
      return;
    }
    const b = el.getBoundingClientRect();
    const next: Rect = { x: b.x, y: b.y, width: b.width, height: b.height };
    setRect((prev) => (prev && rectsEqual(prev, next) ? prev : next));
  }, [elementRef]);

  /** Schedule a measure on the next animation frame (at most one pending). */
  const schedule = useCallback(() => {
    if (typeof window === "undefined") return;
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      measure();
    });
  }, [measure]);

  // Element resize → rAF-batched re-measure. State updates are disabled on the
  // observer itself; it exists purely to trigger our own measurement.
  const { observe, unobserve } = useResizeObserver({
    updateState: false,
    onResize: schedule,
  });

  // Initial synchronous measure (before paint); reset when the element goes.
  useIsomorphicLayoutEffect(() => {
    if (!element) {
      setRect(null);
      return;
    }
    measure();
  }, [element, measure]);

  // Subscription wiring lives in a *passive* effect on purpose: it must run
  // AFTER use-resize-observer's own mount effect (a passive effect that
  // replaces its internal observer instance). Observing from a layout effect
  // would attach to a pre-mount instance that gets orphaned — the element
  // would stay observed forever and fire into an unmounted hook. Hook order
  // guarantees the right sequence: useResizeObserver above registers its
  // effect before this one.
  useEffect(() => {
    if (!element) return;

    observe(element);
    // Capture-phase scroll catches nested scroll containers, not just window.
    window.addEventListener("scroll", schedule, { passive: true, capture: true });
    window.addEventListener("resize", schedule, { passive: true });

    return () => {
      unobserve(element);
      window.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [element, schedule, observe, unobserve]);

  return rect;
}
