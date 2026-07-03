import { renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { describe, expect, it } from "vitest";
import { useIsFirstRender } from "./useIsFirstRender";

describe("useIsFirstRender", () => {
  it("returns true on the first render", () => {
    const { result } = renderHook(() => useIsFirstRender());
    expect(result.current).toBe(true);
  });

  it("returns true on the first render under StrictMode (double-invoke safe)", () => {
    const { result } = renderHook(() => useIsFirstRender(), {
      wrapper: StrictMode,
    });
    expect(result.current).toBe(true);
  });

  it("returns false on every subsequent render", () => {
    const { result, rerender } = renderHook(() => useIsFirstRender());
    expect(result.current).toBe(true);
    rerender();
    expect(result.current).toBe(false);
    rerender();
    expect(result.current).toBe(false);
  });

  it("is independent per hook instance", () => {
    const a = renderHook(() => useIsFirstRender());
    const b = renderHook(() => useIsFirstRender());
    expect(a.result.current).toBe(true);
    expect(b.result.current).toBe(true);
    a.rerender();
    expect(a.result.current).toBe(false);
    // b untouched
    expect(b.result.current).toBe(true);
  });
});
