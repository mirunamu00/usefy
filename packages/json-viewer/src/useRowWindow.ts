"use client";

/**
 * Windowing and scroll anchoring (SPEC.md §4.3).
 *
 * The windowing shape is the one proven in `@usefy/diff-viewer` — a pure
 * `computeWindow` fed by coalesced scroll metrics, an estimated viewport so the
 * server render and the first client render agree, and a spacer that preserves
 * the scroll height. **The know-how carries over, the code does not**: that
 * engine windows a *static* list, and a JSON tree changes length on every
 * expand and collapse. Two things follow from that difference, and they are
 * the whole content of this module:
 *
 *  1. **Anchoring.** When rows appear or disappear above the viewport, the
 *     content under the cursor must not move. Because rows are a fixed height
 *     this is exact arithmetic rather than measurement — which is precisely
 *     why SPEC decision #4 refuses to let a row grow.
 *  2. **The browser's element-height cap.** At 22 px a row, a document with
 *     more than ~750 k visible rows exceeds what the strictest engine will
 *     make an element, and the scrollbar silently stops mapping to content.
 *     Past the cap the scroll range is compressed and mapped through a ratio.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { useEventListener } from "@usefy/use-event-listener";
import { useIsomorphicLayoutEffect } from "@usefy/use-isomorphic-layout-effect";
import { useRafState } from "@usefy/use-raf-state";
import type { ExpandResult } from "./types";

/** Rows kept rendered beyond the viewport so a fast scroll stays filled. */
export const DEFAULT_OVERSCAN = 8;

/**
 * Viewport height (px) assumed for the **first** render, before the real
 * container has been measured.
 *
 * A constant rather than `0`, so the server and the client's first render agree
 * (no hydration mismatch) and a large document never materialises every row for
 * one commit before the measurement narrows it.
 */
export const ESTIMATED_VIEWPORT = 480;

/**
 * Fallback element-height cap for environments without a DOM to probe.
 *
 * 16 777 216 px is the smallest cap in use across current engines, so assuming
 * it can only ever make the scrollbar *more* conservative than it needs to be.
 */
const FALLBACK_MAX_HEIGHT = 16_777_216;

/** The slice of rows to render, and where to put it. */
export interface RowWindow {
  /** First row index to render (inclusive). */
  start: number;
  /** Last row index to render (exclusive). */
  end: number;
  /** `top` for the absolutely positioned block of rendered rows. */
  offset: number;
  /** Height of the scroll spacer. */
  contentHeight: number;
  /** True when the window is a real subset — i.e. virtualization is on. */
  virtualized: boolean;
  /** True when the scroll range is compressed past the element-height cap. */
  scaled: boolean;
}

interface WindowInput {
  total: number;
  rowHeight: number;
  scrollTop: number;
  viewport: number;
  maxHeight: number;
  overscan?: number;
}

/**
 * Map a scroll offset to a position in the (possibly much taller) row space.
 *
 * Identity until the row space passes the element-height cap; a linear
 * compression after that.
 */
function toVirtualTop(
  scrollTop: number,
  naturalHeight: number,
  contentHeight: number,
  viewport: number,
): number {
  if (naturalHeight <= contentHeight) return scrollTop;
  const track = Math.max(1, contentHeight - viewport);
  return (scrollTop / track) * (naturalHeight - viewport);
}

/** The inverse of {@link toVirtualTop} — what to assign to `scrollTop`. */
function toScrollTop(
  virtualTop: number,
  naturalHeight: number,
  contentHeight: number,
  viewport: number,
): number {
  if (naturalHeight <= contentHeight) {
    return clamp(virtualTop, 0, Math.max(0, naturalHeight - viewport));
  }
  const range = Math.max(1, naturalHeight - viewport);
  const track = Math.max(0, contentHeight - viewport);
  return clamp((virtualTop / range) * track, 0, track);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Compute the visible row window. Pure — the arithmetic is separated from the
 * effects so it can be tested without a layout engine.
 *
 * @example
 * ```ts
 * computeWindow({ total: 1000, rowHeight: 22, scrollTop: 2200, viewport: 440,
 *                 maxHeight: 16_777_216 });
 * // → rows 92…130 rendered, positioned at offset 2024
 * ```
 */
export function computeWindow({
  total,
  rowHeight,
  scrollTop,
  viewport,
  maxHeight,
  overscan = DEFAULT_OVERSCAN,
}: WindowInput): RowWindow {
  if (rowHeight <= 0 || viewport <= 0 || total <= 0) {
    return {
      start: 0,
      end: total,
      offset: 0,
      contentHeight: Math.max(0, total * rowHeight),
      virtualized: false,
      scaled: false,
    };
  }

  const naturalHeight = total * rowHeight;
  const contentHeight = Math.min(naturalHeight, maxHeight);
  const scaled = naturalHeight > maxHeight;
  const virtualTop = toVirtualTop(scrollTop, naturalHeight, contentHeight, viewport);

  const first = Math.max(0, Math.floor(virtualTop / rowHeight) - overscan);
  const visible = Math.ceil(viewport / rowHeight);
  const last = Math.min(total, first + visible + overscan * 2);

  return {
    start: first,
    end: last,
    offset: scaled ? scrollTop - (virtualTop - first * rowHeight) : first * rowHeight,
    contentHeight,
    virtualized: first > 0 || last < total,
    scaled,
  };
}

/**
 * Where the viewport should sit after an expansion change, or `null` to leave
 * it alone.
 *
 * Pure, and separate from the effect that applies it, because "the row under
 * the cursor did not move" is the property worth asserting and a layout engine
 * is not needed to assert it. All positions are in *row space* (pixels of the
 * uncompressed row list), which is what makes this identical whether or not
 * the scroll range is scaled.
 *
 * @example
 * ```ts
 * // Expanding a node above the viewport pushes everything down by `delta`.
 * anchorTop({ virtualTop: 2200, rowHeight: 22, anchorRow: 10, delta: 5 });
 * // → 2310
 * ```
 */
export function anchorTop({
  virtualTop,
  rowHeight,
  anchorRow,
  delta,
}: {
  virtualTop: number;
  rowHeight: number;
  anchorRow: number;
  delta: number;
}): number | null {
  if (delta === 0 || anchorRow < 0 || rowHeight <= 0) return null;

  const firstRow = Math.floor(virtualTop / rowHeight);

  // The toggled row is on screen: everything moves *below* the cursor, which
  // is what the user asked for. Nothing to correct.
  if (anchorRow >= firstRow) return null;

  // The viewport was inside the subtree that just disappeared. Land on the
  // node that swallowed it rather than somewhere unrelated.
  if (delta < 0 && firstRow <= anchorRow - delta) return anchorRow * rowHeight;

  return virtualTop + delta * rowHeight;
}

let probedMaxHeight: number | null = null;

/**
 * The largest height this browser will honour on an element, measured once.
 *
 * Hard-coding a per-engine constant is exactly the kind of number that rots
 * silently (SPEC decision #7), and getting it wrong means the scrollbar stops
 * reaching the end of the document with no visible symptom. The probe doubles
 * from a height every engine accepts until one is clipped, then keeps the last
 * height that was honoured.
 */
export function probeMaxElementHeight(): number {
  if (probedMaxHeight !== null) return probedMaxHeight;
  if (typeof document === "undefined" || !document.body) return FALLBACK_MAX_HEIGHT;

  const probe = document.createElement("div");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText =
    "position:absolute;top:0;left:0;width:1px;visibility:hidden;pointer-events:none";

  let accepted = FALLBACK_MAX_HEIGHT;
  try {
    document.body.appendChild(probe);
    for (let height = 1_000_000; height <= 200_000_000; height *= 2) {
      probe.style.height = `${height}px`;
      if (probe.offsetHeight < height) break;
      accepted = height;
    }
  } catch {
    accepted = FALLBACK_MAX_HEIGHT;
  } finally {
    probe.remove();
  }

  // jsdom reports 0 for every layout query; keep the conservative floor there.
  probedMaxHeight = accepted > 0 ? accepted : FALLBACK_MAX_HEIGHT;
  return probedMaxHeight;
}

/** Test hook: forget the probe result so a stubbed cap takes effect. */
export function resetProbedMaxHeight(value: number | null = null): void {
  probedMaxHeight = value;
}

export interface UseRowWindowOptions {
  scrollRef: React.RefObject<HTMLElement | null>;
  rowHeight: number;
  rowCount: number;
  /** Measured height of the scroll container; `undefined` before first measure. */
  viewportHeight: number | undefined;
  overscan?: number;
}

export interface UseRowWindowReturn {
  window: RowWindow;
  /**
   * Keep the content under the cursor still across an expansion change.
   * Call with the {@link ExpandResult} the model returned.
   */
  anchor: (result: ExpandResult) => void;
  /** Scroll so `row` sits roughly a third of the way down the viewport. */
  scrollToRow: (row: number) => void;
  /**
   * Scroll only far enough to bring `row` on screen, and not at all when it
   * already is.
   *
   * What arrow-key navigation needs. Re-centring on every keystroke pins the
   * highlight and slides the document under it, so the rows below the cursor
   * can never be walked to — a bug that no unit test can see, because jsdom
   * has no scroll box.
   */
  ensureRowVisible: (row: number) => void;
  /** Row index at the top of the viewport right now. */
  firstVisibleRow: number;
}

/**
 * Track the scroll offset of a container and derive the row window from it.
 *
 * @example
 * ```tsx
 * const { window, anchor } = useRowWindow({ scrollRef, rowHeight: 22,
 *                                           rowCount, viewportHeight });
 * const result = model.toggle(path);
 * anchor(result);
 * ```
 */
export function useRowWindow({
  scrollRef,
  rowHeight,
  rowCount,
  viewportHeight,
  overscan = DEFAULT_OVERSCAN,
}: UseRowWindowOptions): UseRowWindowReturn {
  // Coalesced to one render per frame: a fast scroll fires many `scroll`
  // events per frame and re-rendering the window for each of them is work
  // nobody sees.
  const [scrollTop, setScrollTop] = useRafState(0);
  const maxHeight = useMaxElementHeight();
  const viewport = viewportHeight || ESTIMATED_VIEWPORT;

  // Written in the toggle handler, consumed by the layout effect below — a ref
  // rather than state so anchoring costs no extra render.
  const pending = useRef<{ delta: number; anchorRow: number } | null>(null);
  /**
   * An explicit scroll target, applied after the render that follows it.
   *
   * Deferring matters: a search jump expands the ancestors and *then* asks to
   * scroll, all inside one event handler, so at that moment `rowCount` is still
   * the pre-expansion figure and clamping against it would stop the scroll
   * short of the match. The layout effect below sees the fresh count.
   */
  const pendingScroll = useRef<number | null>(null);

  const readScroll = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;
    setScrollTop(node.scrollTop);
  }, [scrollRef]);

  useEventListener("scroll", readScroll, scrollRef, { passive: true });

  const rowWindow = useMemo(
    () =>
      computeWindow({
        total: rowCount,
        rowHeight,
        scrollTop,
        viewport,
        maxHeight,
        overscan,
      }),
    [rowCount, rowHeight, scrollTop, viewport, maxHeight, overscan],
  );

  const setScroll = useCallback(
    (virtualTop: number) => {
      const node = scrollRef.current;
      if (!node) return;
      const naturalHeight = rowCount * rowHeight;
      const contentHeight = Math.min(naturalHeight, maxHeight);
      const next = toScrollTop(virtualTop, naturalHeight, contentHeight, viewport);
      node.scrollTop = next;
      setScrollTop(next);
    },
    [scrollRef, rowCount, rowHeight, maxHeight, viewport],
  );

  const anchor = useCallback((result: ExpandResult) => {
    if (result.delta === 0 || result.anchorRow < 0) return;
    pending.current = { delta: result.delta, anchorRow: result.anchorRow };
  }, []);

  // Runs before paint, so the correction is never visible as a jump.
  useIsomorphicLayoutEffect(() => {
    // An explicit target always wins over anchoring: the caller asked to go
    // somewhere specific, and holding the old content still would defeat that.
    if (pendingScroll.current !== null) {
      const row = pendingScroll.current;
      pendingScroll.current = null;
      pending.current = null;
      const lead = Math.floor(viewport / rowHeight / 3);
      setScroll(Math.max(0, row - lead) * rowHeight);
      return;
    }

    const request = pending.current;
    if (!request) return;
    pending.current = null;

    const node = scrollRef.current;
    if (!node) return;

    const naturalHeight = rowCount * rowHeight;
    const contentHeight = Math.min(naturalHeight, maxHeight);
    const virtualTop = toVirtualTop(
      node.scrollTop,
      naturalHeight,
      contentHeight,
      viewport,
    );

    const next = anchorTop({
      virtualTop,
      rowHeight,
      anchorRow: request.anchorRow,
      delta: request.delta,
    });
    if (next !== null) setScroll(next);
  });

  const scrollToRow = useCallback(
    (row: number) => {
      // Applied twice on purpose: now, so a move that triggers no re-render
      // still scrolls, and again in the layout effect with the post-expansion
      // row count. The operation is idempotent.
      pendingScroll.current = row;
      pending.current = null;
      const lead = Math.floor(viewport / rowHeight / 3);
      setScroll(Math.max(0, row - lead) * rowHeight);
    },
    [setScroll, viewport, rowHeight],
  );

  const ensureRowVisible = useCallback(
    (row: number) => {
      const node = scrollRef.current;
      if (!node || row < 0) return;

      const naturalHeight = rowCount * rowHeight;
      const contentHeight = Math.min(naturalHeight, maxHeight);
      const virtualTop = toVirtualTop(
        node.scrollTop,
        naturalHeight,
        contentHeight,
        viewport,
      );
      const first = Math.floor(virtualTop / rowHeight);
      // A partially visible last row does not count as visible.
      const visible = Math.max(1, Math.floor(viewport / rowHeight));

      if (row < first) setScroll(row * rowHeight);
      else if (row >= first + visible) setScroll((row - visible + 1) * rowHeight);
    },
    [scrollRef, rowCount, rowHeight, maxHeight, viewport, setScroll],
  );

  const firstVisibleRow = Math.floor(
    toVirtualTop(
      scrollTop,
      rowCount * rowHeight,
      Math.min(rowCount * rowHeight, maxHeight),
      viewport,
    ) / rowHeight,
  );

  return { window: rowWindow, anchor, scrollToRow, ensureRowVisible, firstVisibleRow };
}

/** Probe the element-height cap after mount, never during the server render. */
function useMaxElementHeight(): number {
  const [maxHeight, setMaxHeight] = useState(FALLBACK_MAX_HEIGHT);
  useIsomorphicLayoutEffect(() => {
    setMaxHeight(probeMaxElementHeight());
  }, []);
  return maxHeight;
}
