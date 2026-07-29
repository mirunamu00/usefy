import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  anchorTop,
  computeWindow,
  DEFAULT_OVERSCAN,
  useRowWindow,
} from "./useRowWindow";

const MAX = 16_777_216;

describe("computeWindow", () => {
  it("renders everything when the list fits", () => {
    const result = computeWindow({
      total: 10,
      rowHeight: 22,
      scrollTop: 0,
      viewport: 400,
      maxHeight: MAX,
    });
    expect(result).toMatchObject({ start: 0, end: 10, offset: 0, virtualized: false });
    expect(result.contentHeight).toBe(220);
  });

  it("windows a long list to the viewport plus overscan", () => {
    const result = computeWindow({
      total: 100_000,
      rowHeight: 22,
      scrollTop: 22_000,
      viewport: 440,
      maxHeight: MAX,
    });
    expect(result.start).toBe(1000 - DEFAULT_OVERSCAN);
    expect(result.end - result.start).toBeLessThanOrEqual(
      Math.ceil(440 / 22) + DEFAULT_OVERSCAN * 2,
    );
    expect(result.offset).toBe(result.start * 22);
    expect(result.virtualized).toBe(true);
  });

  it("keeps the DOM bounded no matter how far down the list is", () => {
    const budget = Math.ceil(600 / 22) + DEFAULT_OVERSCAN * 2;
    for (const scrollTop of [0, 1e5, 1e7, 2.2e7]) {
      const result = computeWindow({
        total: 4_500_000,
        rowHeight: 22,
        scrollTop,
        viewport: 600,
        maxHeight: MAX,
      });
      expect(result.end - result.start).toBeLessThanOrEqual(budget);
    }
  });

  it("falls back to rendering everything before the viewport is known", () => {
    const result = computeWindow({
      total: 50,
      rowHeight: 22,
      scrollTop: 0,
      viewport: 0,
      maxHeight: MAX,
    });
    expect(result).toMatchObject({ start: 0, end: 50, virtualized: false });
  });

  it("handles an empty list", () => {
    expect(
      computeWindow({ total: 0, rowHeight: 22, scrollTop: 0, viewport: 400, maxHeight: MAX }),
    ).toMatchObject({ start: 0, end: 0, contentHeight: 0 });
  });

  describe("past the browser's element-height cap", () => {
    // 1 M rows at 22 px is 22 M px — more than a Firefox element will be.
    const base = {
      total: 1_000_000,
      rowHeight: 22,
      viewport: 600,
      maxHeight: 10_000_000,
    };

    it("compresses the scroll range instead of clipping the document", () => {
      const top = computeWindow({ ...base, scrollTop: 0 });
      expect(top.scaled).toBe(true);
      expect(top.contentHeight).toBe(10_000_000);
      expect(top.start).toBe(0);
    });

    it("still reaches the last row at the bottom of the track", () => {
      const bottom = computeWindow({
        ...base,
        scrollTop: base.maxHeight - base.viewport,
      });
      expect(bottom.end).toBe(base.total);
    });

    it("positions the rendered block under the cursor, not at its row offset", () => {
      const middle = computeWindow({ ...base, scrollTop: 5_000_000 });
      // The rows block sits near the current scroll offset — the whole point
      // of the compression is that row 500 000's natural 11 M px position is
      // not addressable.
      expect(middle.offset).toBeGreaterThan(4_900_000);
      expect(middle.offset).toBeLessThan(5_100_000);
      expect(middle.start).toBeGreaterThan(400_000);
    });
  });
});

describe("anchorTop", () => {
  // "The row under the cursor does not move" is the property; these are the
  // four cases from SPEC §4.3.
  it("does nothing when the toggled row is on screen", () => {
    expect(
      anchorTop({ virtualTop: 2200, rowHeight: 22, anchorRow: 120, delta: 9 }),
    ).toBeNull();
  });

  it("does nothing when nothing changed", () => {
    expect(
      anchorTop({ virtualTop: 2200, rowHeight: 22, anchorRow: 5, delta: 0 }),
    ).toBeNull();
  });

  it("pushes the viewport down when rows appear above it", () => {
    // Row 100 was at the top; after 5 rows appear above, it must still be.
    const next = anchorTop({ virtualTop: 2200, rowHeight: 22, anchorRow: 10, delta: 5 });
    expect(next).toBe(2200 + 5 * 22);
    expect(Math.floor(next! / 22)).toBe(105);
  });

  it("pulls the viewport up when rows disappear above it", () => {
    const next = anchorTop({ virtualTop: 2200, rowHeight: 22, anchorRow: 10, delta: -5 });
    expect(next).toBe(2200 - 5 * 22);
  });

  it("lands on the collapsed node when the viewport was inside it", () => {
    // Row 100 is on screen; collapsing row 10 removes rows 11…210, so there is
    // no "same content" to stay on. Landing anywhere else is disorienting.
    const next = anchorTop({
      virtualTop: 2200,
      rowHeight: 22,
      anchorRow: 10,
      delta: -200,
    });
    expect(next).toBe(10 * 22);
  });

  it("ignores an invalid anchor", () => {
    expect(
      anchorTop({ virtualTop: 100, rowHeight: 22, anchorRow: -1, delta: 4 }),
    ).toBeNull();
  });
});

describe("useRowWindow — an explicit scroll beats anchoring", () => {
  /** jsdom will not give a div a real scroll box, so the container is faked. */
  function fakeScroller() {
    return {
      current: {
        scrollTop: 0,
        clientHeight: 440,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      } as unknown as HTMLElement,
    };
  }

  it("lands on the requested row even when rows were added in the same tick", () => {
    // The search-jump sequence: expand the ancestors (which queues an anchor
    // correction) and then ask to scroll to the match. Anchoring must not
    // claw the viewport back — and the scroll must be clamped against the
    // *post*-expansion row count, which only the next render knows.
    const scrollRef = fakeScroller();
    const { result, rerender } = renderHook(
      ({ rowCount }) =>
        useRowWindow({ scrollRef, rowHeight: 22, rowCount, viewportHeight: 440 }),
      { initialProps: { rowCount: 10 } },
    );

    act(() => {
      result.current.anchor({ delta: 20_000, anchorRow: 1 });
      result.current.scrollToRow(19_000);
    });
    // The model grew; React only learns about it on the next render.
    rerender({ rowCount: 20_010 });

    const lead = Math.floor(440 / 22 / 3);
    expect(scrollRef.current!.scrollTop).toBe((19_000 - lead) * 22);
  });

  it("does not move at all when the target row is already on screen", () => {
    // Arrow-key navigation. Re-centring on every keystroke pins the highlight
    // one third down and slides the document under it, so the rows below the
    // cursor can never be reached.
    const scrollRef = fakeScroller();
    scrollRef.current!.scrollTop = 0;

    const { result } = renderHook(() =>
      useRowWindow({ scrollRef, rowHeight: 22, rowCount: 1000, viewportHeight: 440 }),
    );

    // 440 / 22 = 20 rows visible, so rows 0…19 need no scrolling at all.
    for (const row of [0, 5, 12, 19]) {
      act(() => result.current.ensureRowVisible(row));
      expect(scrollRef.current!.scrollTop, `row ${row}`).toBe(0);
    }
  });

  it("scrolls by the minimum needed when the target is just off screen", () => {
    const scrollRef = fakeScroller();
    const { result } = renderHook(() =>
      useRowWindow({ scrollRef, rowHeight: 22, rowCount: 1000, viewportHeight: 440 }),
    );

    // One row past the bottom edge: bring exactly that row into view.
    act(() => result.current.ensureRowVisible(20));
    expect(scrollRef.current!.scrollTop).toBe(22);

    // Above the top edge: land on it, not a third of the way down.
    act(() => result.current.ensureRowVisible(0));
    expect(scrollRef.current!.scrollTop).toBe(0);
  });

  it("still anchors when no explicit scroll was requested", () => {
    const scrollRef = fakeScroller();
    scrollRef.current!.scrollTop = 2200;

    const { result, rerender } = renderHook(
      ({ rowCount }) =>
        useRowWindow({ scrollRef, rowHeight: 22, rowCount, viewportHeight: 440 }),
      { initialProps: { rowCount: 1000 } },
    );

    act(() => {
      result.current.anchor({ delta: 5, anchorRow: 3 });
    });
    rerender({ rowCount: 1005 });

    expect(scrollRef.current!.scrollTop).toBe(2200 + 5 * 22);
  });
});
