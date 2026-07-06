import { StrictMode } from "react";
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

  it("tracks the previous DISTINCT value — an unchanged render does not advance it", () => {
    // Sequence 1 -> 1 -> 2. A naive "value one render ago" would report 1 after
    // the second render; the distinct-tracking contract keeps undefined because
    // the value did not change, then reports 1 only once it actually changes.
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: 1 },
    });
    expect(result.current).toBeUndefined();

    rerender({ value: 1 }); // no change -> previous stays undefined
    expect(result.current).toBeUndefined();

    rerender({ value: 2 }); // real change -> previous becomes 1
    expect(result.current).toBe(1);

    rerender({ value: 2 }); // no change -> previous stays 1
    expect(result.current).toBe(1);
  });

  it("is idempotent under StrictMode's double-invoked render", () => {
    // The hook mutates refs during render; StrictMode invokes render twice, so
    // the second (discarded) invocation must not double-advance the stored value.
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: 1 },
      wrapper: StrictMode,
    });
    expect(result.current).toBeUndefined();

    rerender({ value: 2 });
    expect(result.current).toBe(1); // not double-advanced to 2

    rerender({ value: 3 });
    expect(result.current).toBe(2);
  });
});
