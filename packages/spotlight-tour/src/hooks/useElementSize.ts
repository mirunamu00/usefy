import { useCallback, useEffect, useRef, useState } from "react";
import { useIsomorphicLayoutEffect } from "@usefy/use-isomorphic-layout-effect";
import { useLatest } from "@usefy/use-latest";
import { useResizeObserver } from "@usefy/use-resize-observer";

/** A measured border-box size. */
export interface ElementSize {
  width: number;
  height: number;
}

/**
 * Track an element's **border-box size** (width/height only — no position, so
 * repositioning the element never causes a new commit). Used internally to
 * measure the tooltip box for `computeTooltipPosition`.
 *
 * Measures synchronously on attach (layout effect, before paint) and again on
 * element resize via `ResizeObserver`, rAF-batched; state commits only when
 * the size actually changed. SSR-safe.
 *
 * Note: a `0x0` measurement still counts as "measured" — jsdom reports zero
 * sizes, and treating that as unmeasured would deadlock position resolution.
 *
 * @param element - The element to measure, or `null` (returns `null`).
 * @param remeasureKey - When this value changes (`Object.is`), the hook
 * re-enters the unmeasured state (`null`) in the very same commit and
 * re-measures before paint. Pass the tour's step index so a step change never
 * positions the new tooltip content with the previous step's stale size.
 * @returns The current `{ width, height }`, or `null` when there is no
 * element / it hasn't been measured yet.
 *
 * @internal
 */
export function useElementSize(
  element: Element | null,
  remeasureKey?: unknown
): ElementSize | null {
  const [size, setSize] = useState<ElementSize | null>(null);
  const rafRef = useRef<number | null>(null);
  const elementRef = useLatest(element);

  // Render-phase reset (the React "derive state from props" pattern): a key
  // change drops the stale size within the current commit, so consumers see
  // "unmeasured" — never a position computed from the previous key's box.
  const [prevKey, setPrevKey] = useState(remeasureKey);
  if (!Object.is(prevKey, remeasureKey)) {
    setPrevKey(remeasureKey);
    setSize(null);
  }

  const measure = useCallback(() => {
    const el = elementRef.current;
    if (!el) {
      setSize((prev) => (prev === null ? prev : null));
      return;
    }
    const b = el.getBoundingClientRect();
    setSize((prev) =>
      prev && prev.width === b.width && prev.height === b.height
        ? prev
        : { width: b.width, height: b.height }
    );
  }, [elementRef]);

  const schedule = useCallback(() => {
    if (typeof window === "undefined") return;
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      measure();
    });
  }, [measure]);

  const { observe, unobserve } = useResizeObserver({
    updateState: false,
    onResize: schedule,
  });

  // Synchronous measure before paint — on attach and again whenever the
  // remeasure key changes (fresh content, fresh box). Reset when the element
  // goes.
  useIsomorphicLayoutEffect(() => {
    if (!element) {
      setSize(null);
      return;
    }
    measure();
  }, [element, measure, remeasureKey]);

  // Observer wiring in a passive effect — must run after use-resize-observer's
  // own mount effect (see useTargetRect for the orphaned-observer rationale).
  useEffect(() => {
    if (!element) return;
    observe(element);
    return () => {
      unobserve(element);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [element, observe, unobserve]);

  return size;
}
