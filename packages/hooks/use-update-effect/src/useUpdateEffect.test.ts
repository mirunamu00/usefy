import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useUpdateEffect } from "./useUpdateEffect";

describe("useUpdateEffect", () => {
  it("does not run on the first render", () => {
    const effect = vi.fn();
    renderHook(() => useUpdateEffect(effect, [0]));
    expect(effect).not.toHaveBeenCalled();
  });

  it("runs when dependencies change after mount", () => {
    const effect = vi.fn();
    const { rerender } = renderHook(({ dep }) => useUpdateEffect(effect, [dep]), {
      initialProps: { dep: 0 },
    });
    expect(effect).not.toHaveBeenCalled();

    rerender({ dep: 1 });
    expect(effect).toHaveBeenCalledTimes(1);

    rerender({ dep: 2 });
    expect(effect).toHaveBeenCalledTimes(2);
  });

  it("does not run when deps are unchanged", () => {
    const effect = vi.fn();
    const { rerender } = renderHook(({ dep }) => useUpdateEffect(effect, [dep]), {
      initialProps: { dep: 0 },
    });
    rerender({ dep: 0 });
    expect(effect).not.toHaveBeenCalled();
  });

  it("runs cleanup on subsequent updates and unmount", () => {
    const cleanup = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ dep }) => useUpdateEffect(() => cleanup, [dep]),
      { initialProps: { dep: 0 } }
    );
    rerender({ dep: 1 }); // effect runs (no cleanup yet)
    rerender({ dep: 2 }); // cleanup from previous run
    expect(cleanup).toHaveBeenCalledTimes(1);
    unmount();
    expect(cleanup).toHaveBeenCalledTimes(2);
  });
});
