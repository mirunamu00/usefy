import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useMount } from "./useMount";

describe("useMount", () => {
  it("runs the callback once on mount", () => {
    const fn = vi.fn();
    renderHook(() => useMount(fn));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does not run again on re-render", () => {
    const fn = vi.fn();
    const { rerender } = renderHook(() => useMount(fn));
    rerender();
    rerender();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("runs the returned cleanup on unmount", () => {
    const cleanup = vi.fn();
    const { unmount } = renderHook(() => useMount(() => cleanup));
    expect(cleanup).not.toHaveBeenCalled();
    unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
