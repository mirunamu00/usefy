import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useIsClient } from "./useIsClient";

describe("useIsClient", () => {
  it("returns true after mount (hydration) in the browser", () => {
    const { result } = renderHook(() => useIsClient());
    // renderHook flushes effects, so we observe the post-hydration value.
    expect(result.current).toBe(true);
  });

  it("stays true across re-renders", () => {
    const { result, rerender } = renderHook(() => useIsClient());
    expect(result.current).toBe(true);
    rerender();
    expect(result.current).toBe(true);
  });

  it("returns a boolean", () => {
    const { result } = renderHook(() => useIsClient());
    expect(typeof result.current).toBe("boolean");
  });
});
