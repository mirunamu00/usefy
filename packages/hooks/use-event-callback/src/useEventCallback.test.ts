import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { useEventCallback } from "./useEventCallback";

describe("useEventCallback", () => {
  it("keeps a stable function identity across re-renders", () => {
    const { result, rerender } = renderHook(({ fn }) => useEventCallback(fn), {
      initialProps: { fn: () => 1 },
    });
    const first = result.current;
    rerender({ fn: () => 2 });
    expect(result.current).toBe(first);
  });

  it("always invokes the latest callback", () => {
    const { result, rerender } = renderHook(({ fn }) => useEventCallback(fn), {
      initialProps: { fn: () => "a" },
    });
    expect(result.current()).toBe("a");
    rerender({ fn: () => "b" });
    expect(result.current()).toBe("b");
  });

  it("sees the latest state (no stale closure)", () => {
    const { result } = renderHook(() => {
      const [count, setCount] = useState(0);
      const read = useEventCallback(() => count);
      return { read, setCount };
    });

    expect(result.current.read()).toBe(0);
    act(() => result.current.setCount(5));
    expect(result.current.read()).toBe(5);
  });

  it("forwards arguments to the latest callback", () => {
    const { result } = renderHook(() =>
      useEventCallback((a: number, b: number) => a + b)
    );
    expect(result.current(2, 3)).toBe(5);
  });
});
