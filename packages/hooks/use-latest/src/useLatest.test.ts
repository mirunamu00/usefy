import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useLatest } from "./useLatest";

describe("useLatest", () => {
  it("returns a ref holding the initial value", () => {
    const { result } = renderHook(() => useLatest(1));
    expect(result.current.current).toBe(1);
  });

  it("updates current to the latest value on re-render", () => {
    const { result, rerender } = renderHook(({ value }) => useLatest(value), {
      initialProps: { value: 1 },
    });
    expect(result.current.current).toBe(1);

    rerender({ value: 2 });
    expect(result.current.current).toBe(2);

    rerender({ value: 3 });
    expect(result.current.current).toBe(3);
  });

  it("keeps a stable ref identity across re-renders", () => {
    const { result, rerender } = renderHook(({ value }) => useLatest(value), {
      initialProps: { value: 1 },
    });
    const first = result.current;
    rerender({ value: 2 });
    expect(result.current).toBe(first);
  });
});
