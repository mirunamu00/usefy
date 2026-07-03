import { renderHook } from "@testing-library/react";
import { useLayoutEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

describe("useIsomorphicLayoutEffect", () => {
  it("resolves to useLayoutEffect in a browser (jsdom) environment", () => {
    expect(useIsomorphicLayoutEffect).toBe(useLayoutEffect);
  });

  it("runs the effect on mount", () => {
    const effect = vi.fn();
    renderHook(() => useIsomorphicLayoutEffect(effect, []));
    expect(effect).toHaveBeenCalledTimes(1);
  });

  it("runs cleanup on unmount", () => {
    const cleanup = vi.fn();
    const { unmount } = renderHook(() =>
      useIsomorphicLayoutEffect(() => cleanup, [])
    );
    expect(cleanup).not.toHaveBeenCalled();
    unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("re-runs when dependencies change", () => {
    const effect = vi.fn();
    const { rerender } = renderHook(({ dep }) => useIsomorphicLayoutEffect(effect, [dep]), {
      initialProps: { dep: 1 },
    });
    expect(effect).toHaveBeenCalledTimes(1);
    rerender({ dep: 2 });
    expect(effect).toHaveBeenCalledTimes(2);
  });
});
