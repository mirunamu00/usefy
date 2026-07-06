import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { usePagination } from "./usePagination";
import {
  buildPaginationRange,
  clampPage,
  getPageCount,
  toSafeInt,
} from "./utils";

// ============ pure helpers ============

describe("toSafeInt", () => {
  it("floors fractional values", () => {
    expect(toSafeInt(3.9, 0, 0)).toBe(3);
  });

  it("enforces the minimum", () => {
    expect(toSafeInt(-5, 0, 0)).toBe(0);
    expect(toSafeInt(0, 1, 1)).toBe(1);
  });

  it("falls back for non-finite values", () => {
    expect(toSafeInt(NaN, 0, 0)).toBe(0);
    expect(toSafeInt(Infinity, 1, 1)).toBe(1);
    expect(toSafeInt(-Infinity, 1, 7)).toBe(7);
  });
});

describe("getPageCount", () => {
  it("is at least 1 for an empty dataset", () => {
    expect(getPageCount(0, 10)).toBe(1);
  });

  it("rounds up partial pages", () => {
    expect(getPageCount(25, 10)).toBe(3);
    expect(getPageCount(30, 10)).toBe(3);
    expect(getPageCount(31, 10)).toBe(4);
  });

  it("normalizes negative total and non-positive pageSize", () => {
    expect(getPageCount(-5, 10)).toBe(1);
    expect(getPageCount(25, 0)).toBe(25);
    expect(getPageCount(25, -3)).toBe(25);
  });

  it("handles non-finite inputs", () => {
    expect(getPageCount(NaN, 10)).toBe(1);
    expect(getPageCount(25, NaN)).toBe(25);
  });
});

describe("clampPage", () => {
  it("clamps into [1, pageCount] and floors", () => {
    expect(clampPage(0, 5)).toBe(1);
    expect(clampPage(-3, 5)).toBe(1);
    expect(clampPage(99, 5)).toBe(5);
    expect(clampPage(3.7, 5)).toBe(3);
  });

  it("falls back to 1 for non-finite input", () => {
    expect(clampPage(NaN, 5)).toBe(1);
    expect(clampPage(Infinity, 5)).toBe(1);
    expect(clampPage(-Infinity, 5)).toBe(1);
  });
});

describe("buildPaginationRange", () => {
  it("shows all pages when they fit without a gap", () => {
    expect(buildPaginationRange({ page: 2, pageCount: 3 })).toEqual([1, 2, 3]);
    expect(buildPaginationRange({ page: 1, pageCount: 5 })).toEqual([
      1, 2, 3, 4, 5,
    ]);
  });

  it("adds a trailing ellipsis near the start", () => {
    expect(buildPaginationRange({ page: 1, pageCount: 10 })).toEqual([
      1, 2, 3, 4, 5, "ellipsis", 10,
    ]);
  });

  it("adds ellipses on both sides in the middle", () => {
    expect(buildPaginationRange({ page: 6, pageCount: 10 })).toEqual([
      1, "ellipsis", 5, 6, 7, "ellipsis", 10,
    ]);
  });

  it("adds a leading ellipsis near the end", () => {
    expect(buildPaginationRange({ page: 10, pageCount: 10 })).toEqual([
      1, "ellipsis", 6, 7, 8, 9, 10,
    ]);
  });

  it("shows a single hidden page instead of an ellipsis for a 1-page gap", () => {
    // With 7 pages and defaults, no ellipsis is needed on page 4.
    expect(buildPaginationRange({ page: 4, pageCount: 7 })).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
  });

  it("honors siblingCount and boundaryCount", () => {
    expect(
      buildPaginationRange({
        page: 5,
        pageCount: 20,
        siblingCount: 2,
        boundaryCount: 2,
      })
    ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, "ellipsis", 19, 20]);
  });

  it("clamps an out-of-range page argument", () => {
    expect(buildPaginationRange({ page: 999, pageCount: 3 })).toEqual([
      1, 2, 3,
    ]);
  });

  it("handles a single page", () => {
    expect(buildPaginationRange({ page: 1, pageCount: 1 })).toEqual([1]);
  });

  it("supports boundaryCount: 0 (no first/last boundary pages)", () => {
    expect(
      buildPaginationRange({ page: 1, pageCount: 10, boundaryCount: 0 })
    ).toEqual([1, 2, 3, 4, "ellipsis"]);
  });

  it("supports siblingCount: 0 (only the current page in the middle)", () => {
    expect(
      buildPaginationRange({ page: 5, pageCount: 10, siblingCount: 0 })
    ).toEqual([1, "ellipsis", 5, "ellipsis", 10]);
  });

  it("collapses to the full range when siblingCount/boundaryCount cover every page", () => {
    expect(
      buildPaginationRange({
        page: 5,
        pageCount: 7,
        siblingCount: 5,
        boundaryCount: 5,
      })
    ).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});

// ============ hook: initialization / defaults ============

describe("usePagination — defaults", () => {
  it("defaults to page 1, pageSize 10", () => {
    const { result } = renderHook(() => usePagination({ total: 95 }));
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(10);
    expect(result.current.pageCount).toBe(10);
    expect(result.current.canPrev).toBe(false);
    expect(result.current.canNext).toBe(true);
  });

  it("respects defaultPage in uncontrolled mode", () => {
    const { result } = renderHook(() =>
      usePagination({ total: 100, defaultPage: 3 })
    );
    expect(result.current.page).toBe(3);
  });

  it("clamps an out-of-range defaultPage", () => {
    const { result } = renderHook(() =>
      usePagination({ total: 25, defaultPage: 99 })
    );
    expect(result.current.page).toBe(3);
  });

  it("has pageCount 1 for an empty dataset", () => {
    const { result } = renderHook(() => usePagination({ total: 0 }));
    expect(result.current.pageCount).toBe(1);
    expect(result.current.page).toBe(1);
    expect(result.current.canNext).toBe(false);
    expect(result.current.range).toEqual({ start: 0, end: 0 });
  });
});

// ============ hook: navigation ============

describe("usePagination — navigation", () => {
  it("next/prev move within bounds", () => {
    const { result } = renderHook(() => usePagination({ total: 30 })); // 3 pages

    act(() => result.current.next());
    expect(result.current.page).toBe(2);

    act(() => result.current.next());
    expect(result.current.page).toBe(3);
    expect(result.current.canNext).toBe(false);

    act(() => result.current.prev());
    expect(result.current.page).toBe(2);
  });

  it("first/last jump to the edges", () => {
    const { result } = renderHook(() =>
      usePagination({ total: 100, defaultPage: 5 })
    );
    act(() => result.current.last());
    expect(result.current.page).toBe(10);

    act(() => result.current.first());
    expect(result.current.page).toBe(1);
  });

  it("setPage clamps and floors", () => {
    const { result } = renderHook(() => usePagination({ total: 50 })); // 5 pages

    act(() => result.current.setPage(3.9));
    expect(result.current.page).toBe(3);

    act(() => result.current.setPage(99));
    expect(result.current.page).toBe(5);

    act(() => result.current.setPage(-4));
    expect(result.current.page).toBe(1);
  });

  it("next on the last page and prev on the first are no-ops", () => {
    const { result } = renderHook(() => usePagination({ total: 20 })); // 2 pages

    const before = result.current;
    act(() => result.current.prev()); // already on page 1
    expect(result.current).toBe(before); // no re-render (same bundle identity)
    expect(result.current.page).toBe(1);

    act(() => result.current.last());
    const atLast = result.current;
    act(() => result.current.next()); // already on last
    expect(result.current).toBe(atLast);
  });

  it("setPage to the current page is a no-op", () => {
    const { result } = renderHook(() => usePagination({ total: 50 }));
    const before = result.current;
    act(() => result.current.setPage(1));
    expect(result.current).toBe(before);
  });
});

// ============ hook: range ============

describe("usePagination — range", () => {
  it("computes a slice-ready [start, end) window", () => {
    const { result } = renderHook(() =>
      usePagination({ total: 25, pageSize: 10 })
    );
    expect(result.current.range).toEqual({ start: 0, end: 10 });

    act(() => result.current.setPage(3));
    // Last page has only 5 items: 20..24 -> [20, 25).
    expect(result.current.range).toEqual({ start: 20, end: 25 });
  });

  it("slices an array correctly", () => {
    const data = Array.from({ length: 25 }, (_, i) => i);
    const { result } = renderHook(() =>
      usePagination({ total: data.length, pageSize: 10, defaultPage: 3 })
    );
    const { start, end } = result.current.range;
    expect(data.slice(start, end)).toEqual([20, 21, 22, 23, 24]);
  });
});

// ============ hook: items model ============

describe("usePagination — items", () => {
  it("marks the current page as selected", () => {
    const { result } = renderHook(() =>
      usePagination({ total: 100, defaultPage: 1 })
    );
    const selected = result.current.items.filter((i) => i.selected);
    expect(selected).toHaveLength(1);
    expect(selected[0].page).toBe(1);
  });

  it("emits ellipsis tokens with a null page", () => {
    const { result } = renderHook(() =>
      usePagination({ total: 100, defaultPage: 6 })
    );
    const gaps = result.current.items.filter((i) => i.type === "ellipsis");
    expect(gaps.length).toBeGreaterThan(0);
    expect(gaps.every((g) => g.page === null && g.selected === false)).toBe(
      true
    );
  });

  it("respects siblingCount and boundaryCount", () => {
    const { result } = renderHook(() =>
      usePagination({
        total: 200,
        defaultPage: 5,
        siblingCount: 2,
        boundaryCount: 2,
      })
    );
    const pages = result.current.items
      .filter((i) => i.type === "page")
      .map((i) => i.page);
    expect(pages).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 19, 20]);
  });
});

// ============ hook: onChange ============

describe("usePagination — onChange", () => {
  it("fires with the new page after a change (uncontrolled)", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      usePagination({ total: 50, onChange })
    );

    act(() => result.current.next());
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(2);

    act(() => result.current.setPage(4));
    expect(onChange).toHaveBeenLastCalledWith(4);
  });

  it("does not fire on a no-op move", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      usePagination({ total: 50, onChange })
    );
    act(() => result.current.prev()); // already page 1
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not fire on mount even with an out-of-range defaultPage", () => {
    const onChange = vi.fn();
    renderHook(() => usePagination({ total: 25, defaultPage: 99, onChange }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

// ============ hook: controlled mode ============

describe("usePagination — controlled", () => {
  it("mirrors the controlled page prop (clamped)", () => {
    const { result, rerender } = renderHook(
      ({ page }: { page: number }) => usePagination({ total: 50, page }),
      { initialProps: { page: 2 } }
    );
    expect(result.current.page).toBe(2);

    rerender({ page: 99 });
    expect(result.current.page).toBe(5); // clamped to pageCount
  });

  it("calls onChange but does not self-update in controlled mode", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      usePagination({ total: 50, page: 2, onChange })
    );

    act(() => result.current.next());
    // Parent owns the value: page stays 2 until the prop changes.
    expect(result.current.page).toBe(2);
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("does not fire onChange when the controlled request resolves to the current page", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      // controlled page 5 but only 3 pages -> displayed page clamps to 3
      usePagination({ total: 25, page: 5, onChange })
    );
    expect(result.current.page).toBe(3);
    act(() => result.current.next()); // target clamps to 3 === current -> no-op
    expect(onChange).not.toHaveBeenCalled();
  });
});

// ============ hook: stability ============

describe("usePagination — stability", () => {
  it("keeps control identities stable across re-renders", () => {
    const { result, rerender } = renderHook(
      ({ total }: { total: number }) => usePagination({ total }),
      { initialProps: { total: 50 } }
    );

    const controls = {
      setPage: result.current.setPage,
      next: result.current.next,
      prev: result.current.prev,
      first: result.current.first,
      last: result.current.last,
    };

    act(() => result.current.next());
    rerender({ total: 80 });

    expect(result.current.setPage).toBe(controls.setPage);
    expect(result.current.next).toBe(controls.next);
    expect(result.current.prev).toBe(controls.prev);
    expect(result.current.first).toBe(controls.first);
    expect(result.current.last).toBe(controls.last);
  });

  it("keeps control identities stable in controlled mode as the page prop advances", () => {
    // In controlled mode useControllableState's setter re-memoizes on every page
    // change; the ref indirection exists so the exposed controls never churn.
    const { result, rerender } = renderHook(
      ({ page }: { page: number }) => usePagination({ total: 50, page }),
      { initialProps: { page: 1 } }
    );

    const controls = {
      setPage: result.current.setPage,
      next: result.current.next,
      prev: result.current.prev,
      first: result.current.first,
      last: result.current.last,
    };

    rerender({ page: 2 });
    rerender({ page: 3 });

    expect(result.current.setPage).toBe(controls.setPage);
    expect(result.current.next).toBe(controls.next);
    expect(result.current.prev).toBe(controls.prev);
    expect(result.current.first).toBe(controls.first);
    expect(result.current.last).toBe(controls.last);
  });

  it("returns a stable bundle when nothing changes", () => {
    const { result, rerender } = renderHook(() => usePagination({ total: 50 }));
    const before = result.current;
    rerender();
    expect(result.current).toBe(before);
  });
});

// ============ hook: resilience to changing dataset ============

describe("usePagination — resilient to a shrinking dataset", () => {
  it("keeps the derived page within range when total drops", () => {
    const { result, rerender } = renderHook(
      ({ total }: { total: number }) => usePagination({ total, defaultPage: 8 }),
      { initialProps: { total: 100 } }
    );
    expect(result.current.page).toBe(8);

    rerender({ total: 25 }); // now only 3 pages
    expect(result.current.pageCount).toBe(3);
    expect(result.current.page).toBe(3);
    expect(result.current.canNext).toBe(false);
  });

  it("self-heals stored state on the next interaction", () => {
    const { result, rerender } = renderHook(
      ({ total }: { total: number }) => usePagination({ total, defaultPage: 8 }),
      { initialProps: { total: 100 } }
    );
    rerender({ total: 25 }); // clamps display to 3
    act(() => result.current.prev()); // from clamped 3 -> 2
    expect(result.current.page).toBe(2);
  });
});

// ============ hook: pageSize / total guards ============

describe("usePagination — guards", () => {
  it("clamps a non-positive pageSize to 1", () => {
    const { result } = renderHook(() =>
      usePagination({ total: 3, pageSize: 0 })
    );
    expect(result.current.pageSize).toBe(1);
    expect(result.current.pageCount).toBe(3);
  });

  it("treats a negative total as 0", () => {
    const { result } = renderHook(() => usePagination({ total: -10 }));
    expect(result.current.pageCount).toBe(1);
    expect(result.current.page).toBe(1);
  });

  it("recomputes pageCount when pageSize changes", () => {
    const { result, rerender } = renderHook(
      ({ pageSize }: { pageSize: number }) =>
        usePagination({ total: 100, pageSize }),
      { initialProps: { pageSize: 10 } }
    );
    expect(result.current.pageCount).toBe(10);
    rerender({ pageSize: 25 });
    expect(result.current.pageCount).toBe(4);
  });
});
