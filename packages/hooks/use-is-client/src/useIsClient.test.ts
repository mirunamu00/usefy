import { createElement } from "react";
import { render, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useIsClient } from "./useIsClient";

describe("useIsClient", () => {
  it("is false on the very first render, then flips to true after mount", () => {
    // This is the hook's entire contract: the first render must match the
    // server (false) to avoid a hydration mismatch, then flip on the client.
    // renderHook hides the pre-effect render, so track every render explicitly.
    const values: boolean[] = [];
    function Probe() {
      values.push(useIsClient());
      return null;
    }
    render(createElement(Probe));

    expect(values[0]).toBe(false);
    expect(values[values.length - 1]).toBe(true);
  });

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
