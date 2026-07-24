"use client";

/**
 * Row windowing for large diffs (SPEC §3.3, §6 Phase 3).
 *
 * A 20 000-line diff is ~20 000 `<tr>`s, each with 4–6 cells: enough DOM to
 * make the first paint take seconds and every subsequent scroll janky. This
 * hook answers one question — *which slice of the row list is worth putting
 * in the DOM right now* — and leaves the rendering to the caller.
 *
 * ## Why fixed-height rows
 *
 * Every row is exactly `--usefy-diff-row-height` tall (the same constant
 * that stops a blank line collapsing to nothing), so the scroll offset maps
 * to a row index by division. No measurement, no cumulative-offset cache, no
 * layout thrash — and no scroll-anchor drift when the window changes. That
 * is also why `wrap` **disables** virtualization (SPEC resolved decision
 * #6): wrapped rows are not a fixed height, and measured virtualization is a
 * different, much larger problem.
 *
 * ## SSR
 *
 * Before mount there is no measured viewport, so the hook windows from a
 * fixed `ESTIMATED_VIEWPORT` (see below) on both server and first client
 * render — identical output, no hydration mismatch, and a large whole-file
 * diff never materializes all its rows before windowing. Small diffs below
 * the virtualization threshold still render in full (complete without JS);
 * the real measured viewport takes over on the first client measurement.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** The slice of rows to render, plus the spacers that preserve scroll height. */
export interface RowWindow {
  /** First row index to render (inclusive). */
  start: number;
  /** Last row index to render (exclusive). */
  end: number;
  /** Pixel height of the un-rendered rows above `start`. */
  paddingTop: number;
  /** Pixel height of the un-rendered rows below `end`. */
  paddingBottom: number;
  /** True when the window is a real subset — i.e. virtualization is on. */
  virtualized: boolean;
}

/** Rows kept rendered beyond the viewport, so a fast scroll stays filled. */
const OVERSCAN = 8;

/**
 * Viewport height (px) assumed for the **first** render, before the real
 * container has been measured.
 *
 * Without an estimate the first render would fall into `computeWindow`'s
 * "viewport unknown → render everything" branch, materialising the entire
 * list before the effect narrows it. For a 20 000-row diff that is a ~1.1 s
 * commit of ~120 000 DOM nodes, immediately thrown away. Windowing from an
 * estimate instead makes the first client paint (and the server render for a
 * large diff) already bounded; the effect corrects the exact height a frame
 * later. It is a constant so the server and the client's first render agree,
 * keeping hydration stable.
 */
const ESTIMATED_VIEWPORT = 800;

/**
 * Call `onResize` whenever `node`'s box changes, and return a teardown.
 *
 * `ResizeObserver` is the right tool but is absent in older Safari and in
 * jsdom, so a `window` resize listener stands in. Shared by the two hooks
 * that need it so the fallback exists — and is tested — exactly once.
 *
 * @example
 * ```ts
 * const stop = observeSize(el, () => measure());
 * // …later
 * stop();
 * ```
 */
export function observeSize(node: Element, onResize: () => void): () => void {
  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(onResize);
    observer.observe(node);
    return () => observer.disconnect();
  }
  window.addEventListener?.("resize", onResize);
  return () => window.removeEventListener?.("resize", onResize);
}

/**
 * Compute the visible row window. Pure — the arithmetic is separated from
 * the effects so it can be tested without a layout engine.
 *
 * @example
 * ```ts
 * computeWindow({ total: 1000, rowHeight: 22, scrollTop: 2200, viewport: 440 });
 * // → rows 92…130 rendered, the rest replaced by spacer padding
 * ```
 */
export function computeWindow({
  total,
  rowHeight,
  scrollTop,
  viewport,
  overscan = OVERSCAN,
}: {
  total: number;
  rowHeight: number;
  scrollTop: number;
  viewport: number;
  overscan?: number;
}): RowWindow {
  if (rowHeight <= 0 || viewport <= 0) {
    return { start: 0, end: total, paddingTop: 0, paddingBottom: 0, virtualized: false };
  }

  const first = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visible = Math.ceil(viewport / rowHeight);
  const last = Math.min(total, first + visible + overscan * 2);

  return {
    start: first,
    end: last,
    paddingTop: first * rowHeight,
    paddingBottom: Math.max(0, (total - last) * rowHeight),
    virtualized: first > 0 || last < total,
  };
}

/**
 * Track the scroll offset and viewport height of a scroll container, and
 * derive the row window from them.
 *
 * Returns the full range (and `virtualized: false`) when virtualization is
 * off — because the diff is short, because `wrap` is on, or because the
 * component has not mounted yet — so the caller has exactly one code path.
 *
 * @param enabled Whether to window at all.
 * @param total Number of rows in the full list.
 * @param rowHeight Height of one row in pixels.
 * @param scrollRef The scrolling element.
 */
export function useVirtualRows({
  enabled,
  total,
  rowHeight,
  scrollRef,
}: {
  enabled: boolean;
  total: number;
  rowHeight: number;
  scrollRef: React.RefObject<HTMLElement | null>;
}): RowWindow {
  const [metrics, setMetrics] = useState({ scrollTop: 0, viewport: 0 });
  // Written by the scroll handler, read by the rAF callback — a ref rather
  // than state so a scroll never queues more than one render.
  const pending = useRef<{ scrollTop: number; viewport: number } | null>(null);
  const frame = useRef<number | null>(null);

  const flush = useCallback(() => {
    frame.current = null;
    const next = pending.current;
    if (!next) return;
    setMetrics((current) =>
      current.scrollTop === next.scrollTop && current.viewport === next.viewport
        ? current
        : next,
    );
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const node = scrollRef.current;
    if (!node) return;

    const read = () => {
      pending.current = { scrollTop: node.scrollTop, viewport: node.clientHeight };
      if (frame.current !== null) return;
      frame.current =
        typeof requestAnimationFrame === "function"
          ? requestAnimationFrame(flush)
          : (setTimeout(flush, 16) as unknown as number);
    };

    read();
    node.addEventListener("scroll", read, { passive: true });
    const stopObserving = observeSize(node, read);

    return () => {
      node.removeEventListener("scroll", read);
      stopObserving();
      if (frame.current !== null && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(frame.current);
      }
      frame.current = null;
      pending.current = null;
    };
  }, [enabled, flush, scrollRef]);

  return useMemo(() => {
    if (!enabled) {
      return { start: 0, end: total, paddingTop: 0, paddingBottom: 0, virtualized: false };
    }
    // Before the effect measures the real box, window from an estimate
    // rather than rendering the whole list (see ESTIMATED_VIEWPORT).
    return computeWindow({
      total,
      rowHeight,
      scrollTop: metrics.scrollTop,
      viewport: metrics.viewport || ESTIMATED_VIEWPORT,
    });
  }, [enabled, total, rowHeight, metrics]);
}
