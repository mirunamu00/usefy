import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePrevious } from "./usePrevious";

describe("usePrevious", () => {
  it("returns undefined on the first render", () => {
    const { result } = renderHook(() => usePrevious(0));
    expect(result.current).toBeUndefined();
  });

  it("returns the value from the previous render", () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: 1 },
    });
    expect(result.current).toBeUndefined();

    rerender({ value: 2 });
    expect(result.current).toBe(1);

    rerender({ value: 3 });
    expect(result.current).toBe(2);
  });

  it("keeps the previous value when the comparator reports equality", () => {
    const isEqual = (a: { id: number } | undefined, b: { id: number }) =>
      a?.id === b.id;
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value, isEqual),
      { initialProps: { value: { id: 1 } } }
    );

    // Different reference, same id -> previous should NOT update.
    rerender({ value: { id: 1 } });
    expect(result.current).toBeUndefined();

    rerender({ value: { id: 2 } });
    expect(result.current).toEqual({ id: 1 });
  });

  it("works with changing types/values", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => usePrevious(value),
      { initialProps: { value: "a" } }
    );
    rerender({ value: "b" });
    expect(result.current).toBe("a");
  });
});
