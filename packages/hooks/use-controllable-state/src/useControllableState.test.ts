import { StrictMode } from "react";
import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useControllableState } from "./useControllableState";
import { isUpdater } from "./utils";

describe("useControllableState", () => {
  describe("uncontrolled mode", () => {
    it("seeds from defaultValue", () => {
      const { result } = renderHook(() =>
        useControllableState({ defaultValue: "hello" })
      );
      expect(result.current[0]).toBe("hello");
    });

    it("starts undefined when neither value nor defaultValue is given", () => {
      const { result } = renderHook(() =>
        useControllableState<string>({})
      );
      expect(result.current[0]).toBeUndefined();
    });

    it("updates its own state via the setter", () => {
      const { result } = renderHook(() =>
        useControllableState({ defaultValue: 0 })
      );

      act(() => result.current[1](5));
      expect(result.current[0]).toBe(5);
    });

    it("supports functional updater form", () => {
      const { result } = renderHook(() =>
        useControllableState({ defaultValue: 1 })
      );

      act(() => result.current[1]((prev) => prev + 10));
      expect(result.current[0]).toBe(11);

      act(() => result.current[1]((prev) => prev * 2));
      expect(result.current[0]).toBe(22);
    });

    it("resolves multiple synchronous updater calls against the freshest state", () => {
      const { result } = renderHook(() =>
        useControllableState({ defaultValue: 0 })
      );

      act(() => {
        result.current[1]((p) => p + 1);
        result.current[1]((p) => p + 1);
        result.current[1]((p) => p + 1);
      });
      expect(result.current[0]).toBe(3);
    });

    it("fires onChange with the committed value when it changes", () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useControllableState({ defaultValue: "a", onChange })
      );

      act(() => result.current[1]("b"));
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith("b");
    });

    it("does not fire onChange on mount", () => {
      const onChange = vi.fn();
      renderHook(() =>
        useControllableState({ defaultValue: "a", onChange })
      );
      expect(onChange).not.toHaveBeenCalled();
    });

    it("does not fire onChange when the value does not actually change", () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useControllableState({ defaultValue: 7, onChange })
      );

      act(() => result.current[1](7));
      expect(onChange).not.toHaveBeenCalled();
    });

    it("uses the latest onChange without re-subscribing", () => {
      const first = vi.fn();
      const second = vi.fn();
      const { result, rerender } = renderHook(
        ({ onChange }) => useControllableState({ defaultValue: 0, onChange }),
        { initialProps: { onChange: first } }
      );

      rerender({ onChange: second });
      act(() => result.current[1](1));

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledWith(1);
    });
  });

  describe("controlled mode", () => {
    it("always reflects the controlled value prop", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useControllableState({ value }),
        { initialProps: { value: "x" } }
      );
      expect(result.current[0]).toBe("x");

      rerender({ value: "y" });
      expect(result.current[0]).toBe("y");
    });

    it("does not mutate internal state — setter only notifies onChange", () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useControllableState({ value: "fixed", onChange })
      );

      act(() => result.current[1]("next"));
      // Value stays pinned to the prop (parent owns it).
      expect(result.current[0]).toBe("fixed");
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith("next");
    });

    it("resolves updater functions against the current controlled prop", () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useControllableState({ value: 10, onChange })
      );

      act(() => result.current[1]((prev) => prev + 5));
      expect(onChange).toHaveBeenCalledWith(15);
    });

    it("does not fire onChange when the requested value equals the current value", () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useControllableState({ value: 3, onChange })
      );

      act(() => result.current[1](3));
      expect(onChange).not.toHaveBeenCalled();
    });

    it("treats value === 0 / false as controlled (not undefined)", () => {
      const { result: zero } = renderHook(() =>
        useControllableState({ value: 0, defaultValue: 99 })
      );
      expect(zero.current[0]).toBe(0);

      const { result: bool } = renderHook(() =>
        useControllableState({ value: false, defaultValue: true })
      );
      expect(bool.current[0]).toBe(false);
    });
  });

  describe("mode transitions", () => {
    it("switches from uncontrolled to controlled", () => {
      const { result, rerender } = renderHook(
        ({ value }: { value?: number }) =>
          useControllableState({ value, defaultValue: 1 }),
        { initialProps: { value: undefined as number | undefined } }
      );

      act(() => result.current[1](2));
      expect(result.current[0]).toBe(2);

      // Now become controlled — the prop wins.
      rerender({ value: 50 });
      expect(result.current[0]).toBe(50);
    });

    it("falls back to the last uncontrolled value when control is removed", () => {
      const { result, rerender } = renderHook(
        ({ value }: { value?: number }) =>
          useControllableState({ value, defaultValue: 1 }),
        { initialProps: { value: 50 as number | undefined } }
      );
      expect(result.current[0]).toBe(50);

      rerender({ value: undefined });
      // Back to the internal state (still the default, never updated).
      expect(result.current[0]).toBe(1);
    });
  });

  describe("stability", () => {
    it("keeps a stable setter identity across renders", () => {
      const { result, rerender } = renderHook(() =>
        useControllableState({ defaultValue: 0 })
      );
      const first = result.current[1];

      rerender();
      expect(result.current[1]).toBe(first);

      act(() => result.current[1](1));
      expect(result.current[1]).toBe(first);
    });

    it("keeps a stable setter identity in controlled mode as the value prop changes", () => {
      const onChange = vi.fn();
      const { result, rerender } = renderHook(
        ({ value }) => useControllableState({ value, onChange }),
        { initialProps: { value: "a" } }
      );
      const first = result.current[1];

      rerender({ value: "b" });
      expect(result.current[1]).toBe(first);

      rerender({ value: "c" });
      expect(result.current[1]).toBe(first);

      // Still resolves against the freshest prop despite the stable identity.
      act(() => result.current[1]("d"));
      expect(onChange).toHaveBeenCalledWith("d");
    });

    it("keeps a stable setter identity across a controlled/uncontrolled switch", () => {
      const { result, rerender } = renderHook(
        ({ value }: { value?: number }) =>
          useControllableState({ value, defaultValue: 0 }),
        { initialProps: { value: undefined as number | undefined } }
      );
      const first = result.current[1];

      rerender({ value: 5 });
      expect(result.current[1]).toBe(first);

      rerender({ value: undefined });
      expect(result.current[1]).toBe(first);
    });
  });

  describe("StrictMode", () => {
    it("fires onChange exactly once on a real uncontrolled change", () => {
      const onChange = vi.fn();
      const { result } = renderHook(
        () => useControllableState({ defaultValue: "a", onChange }),
        { wrapper: StrictMode }
      );

      expect(onChange).not.toHaveBeenCalled();

      act(() => result.current[1]("b"));
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith("b");
    });
  });
});

describe("isUpdater", () => {
  it("returns true for functions", () => {
    expect(isUpdater((prev: number) => prev + 1)).toBe(true);
  });

  it("returns false for plain values", () => {
    expect(isUpdater(5)).toBe(false);
    expect(isUpdater("s")).toBe(false);
    expect(isUpdater(null as unknown as number)).toBe(false);
    expect(isUpdater({ a: 1 })).toBe(false);
  });
});
