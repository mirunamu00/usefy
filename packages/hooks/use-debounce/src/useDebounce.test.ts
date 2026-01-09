import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDebounce } from "./useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with the initial value", () => {
      const { result } = renderHook(() => useDebounce("initial", 500));
      expect(result.current).toBe("initial");
    });

    it("should initialize with number value", () => {
      const { result } = renderHook(() => useDebounce(42, 500));
      expect(result.current).toBe(42);
    });

    it("should initialize with boolean value", () => {
      const { result } = renderHook(() => useDebounce(true, 500));
      expect(result.current).toBe(true);
    });

    it("should initialize with object value", () => {
      const obj = { key: "value" };
      const { result } = renderHook(() => useDebounce(obj, 500));
      expect(result.current).toBe(obj);
    });

    it("should initialize with array value", () => {
      const arr = [1, 2, 3];
      const { result } = renderHook(() => useDebounce(arr, 500));
      expect(result.current).toEqual(arr);
    });

    it("should use default delay of 500ms when not specified", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value),
        { initialProps: { value: "initial" } }
      );

      expect(result.current).toBe("initial");

      rerender({ value: "updated" });
      expect(result.current).toBe("initial");

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe("updated");
    });
  });

  describe("basic debouncing", () => {
    it("should debounce value updates", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: "initial" } }
      );

      expect(result.current).toBe("initial");

      rerender({ value: "updated" });
      expect(result.current).toBe("initial");

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe("updated");
    });

    it("should update after specified delay", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 1000),
        { initialProps: { value: "first" } }
      );

      rerender({ value: "second" });
      expect(result.current).toBe("first");

      act(() => {
        vi.advanceTimersByTime(999);
      });
      expect(result.current).toBe("first");

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(result.current).toBe("second");
    });

    it("should reset timer on rapid value changes", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: "a" } }
      );

      rerender({ value: "b" });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current).toBe("a");

      rerender({ value: "c" });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current).toBe("a");

      rerender({ value: "d" });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe("d");
    });

    it("should handle multiple rapid updates correctly", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 0 } }
      );

      for (let i = 1; i <= 10; i++) {
        rerender({ value: i });
        act(() => {
          vi.advanceTimersByTime(100);
        });
      }

      expect(result.current).toBe(0);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe(10);
    });
  });

  describe("leading edge option", () => {
    it("should update immediately with leading: true on first change after delay", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500, { leading: true }),
        { initialProps: { value: "initial" } }
      );

      expect(result.current).toBe("initial");

      // First change - won't trigger leading because lastCallTime is 0
      rerender({ value: "first" });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe("first");

      // Wait for delay to pass
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Now next change should trigger leading edge
      rerender({ value: "second" });
      expect(result.current).toBe("second");
    });

    it("should not update on trailing edge when leading: true and trailing: false", () => {
      const { result, rerender } = renderHook(
        ({ value }) =>
          useDebounce(value, 500, { leading: true, trailing: false }),
        { initialProps: { value: "first" } }
      );

      // First change - leading edge triggers immediately
      rerender({ value: "second" });
      expect(result.current).toBe("second");

      // Wait - but trailing is false, so no update from trailing edge
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Still second (no trailing update)
      expect(result.current).toBe("second");

      // Wait enough time to allow leading edge on next change
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // This should trigger leading edge again
      rerender({ value: "third" });
      expect(result.current).toBe("third");

      // Trailing should not update
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe("third");
    });

    it("should update on both edges when leading: true and trailing: true", () => {
      const { result, rerender } = renderHook(
        ({ value }) =>
          useDebounce(value, 500, { leading: true, trailing: true }),
        { initialProps: { value: "initial" } }
      );

      rerender({ value: "first" });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe("first");

      // Wait for delay to enable leading edge
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // This should trigger leading edge
      rerender({ value: "second" });
      expect(result.current).toBe("second");

      // Immediately change again
      rerender({ value: "third" });
      expect(result.current).toBe("second");

      // This should trigger trailing edge
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe("third");
    });

    it("should respect delay for leading edge updates", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 1000, { leading: true }),
        { initialProps: { value: "a" } }
      );

      rerender({ value: "b" });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current).toBe("b");

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // After delay has passed, next change should trigger leading edge
      rerender({ value: "c" });
      expect(result.current).toBe("c");

      // Rapid change should not trigger leading
      act(() => {
        vi.advanceTimersByTime(500);
      });

      rerender({ value: "d" });
      expect(result.current).toBe("c");

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current).toBe("d");
    });
  });

  describe("trailing edge option", () => {
    it("should not update on trailing edge when trailing: false", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500, { trailing: false }),
        { initialProps: { value: "initial" } }
      );

      rerender({ value: "updated" });
      expect(result.current).toBe("initial");

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe("initial");
    });

    it("should update on trailing edge by default", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: "initial" } }
      );

      rerender({ value: "updated" });
      expect(result.current).toBe("initial");

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe("updated");
    });
  });

  describe("maxWait option", () => {
    it("should enforce maximum wait time", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500, { maxWait: 1500 }),
        { initialProps: { value: "initial" } }
      );

      rerender({ value: "first" });
      act(() => {
        vi.advanceTimersByTime(400);
      });

      rerender({ value: "second" });
      act(() => {
        vi.advanceTimersByTime(400);
      });

      rerender({ value: "third" });
      act(() => {
        vi.advanceTimersByTime(400);
      });

      expect(result.current).toBe("initial");

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current).toBe("third");
    });

    it("should update at maxWait even during continuous changes", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 1000, { maxWait: 2000 }),
        { initialProps: { value: 0 } }
      );

      for (let i = 1; i <= 5; i++) {
        rerender({ value: i });
        act(() => {
          vi.advanceTimersByTime(500);
        });
      }

      expect(result.current).toBe(4);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe(5);
    });

    it("should respect maxWait with leading edge", () => {
      const { result, rerender } = renderHook(
        ({ value }) =>
          useDebounce(value, 500, { maxWait: 1500, leading: true }),
        { initialProps: { value: "initial" } }
      );

      rerender({ value: "first" });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe("first");

      // Wait for delay to enable leading edge
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // This should trigger leading edge
      rerender({ value: "second" });
      expect(result.current).toBe("second");

      rerender({ value: "third" });
      act(() => {
        vi.advanceTimersByTime(400);
      });

      rerender({ value: "fourth" });
      act(() => {
        vi.advanceTimersByTime(700);
      });

      // Should be enforced by maxWait
      expect(result.current).toBe("fourth");
    });

    it("should not invoke before maxWait when updates stop", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500, { maxWait: 2000 }),
        { initialProps: { value: "a" } }
      );

      rerender({ value: "b" });
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe("b");

      rerender({ value: "c" });
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe("c");
    });
  });

  describe("complex scenarios", () => {
    it("should handle string value changes", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: "" } }
      );

      const searchTerms = ["r", "re", "rea", "reac", "react"];
      searchTerms.forEach((term) => {
        rerender({ value: term });
        act(() => {
          vi.advanceTimersByTime(100);
        });
      });

      expect(result.current).toBe("");

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current).toBe("react");
    });

    it("should handle number increments", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 0 } }
      );

      rerender({ value: 10 });
      rerender({ value: 20 });
      rerender({ value: 30 });

      expect(result.current).toBe(0);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe(30);
    });

    it("should handle object updates", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: { count: 0 } } }
      );

      const obj1 = { count: 1 };
      const obj2 = { count: 2 };

      rerender({ value: obj1 });
      expect(result.current).toEqual({ count: 0 });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toEqual(obj1);

      rerender({ value: obj2 });
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toEqual(obj2);
    });

    it("should handle all options combined", () => {
      const { result, rerender } = renderHook(
        ({ value }) =>
          useDebounce(value, 500, {
            leading: true,
            trailing: true,
            maxWait: 1500,
          }),
        { initialProps: { value: "a" } }
      );

      rerender({ value: "b" });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe("b");

      // Wait for delay to enable leading edge
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Should trigger leading edge
      rerender({ value: "c" });
      expect(result.current).toBe("c");

      // Rapid changes
      rerender({ value: "d" });
      act(() => {
        vi.advanceTimersByTime(400);
      });

      rerender({ value: "e" });
      act(() => {
        vi.advanceTimersByTime(700);
      });

      // Should trigger by maxWait or trailing
      expect(result.current).toBe("e");
    });
  });

  describe("option changes", () => {
    it("should react to delay changes", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: "initial", delay: 500 } }
      );

      rerender({ value: "first", delay: 500 });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe("first");

      rerender({ value: "second", delay: 1000 });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe("first");

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe("second");
    });

    it("should react to maxWait changes", () => {
      const { result, rerender } = renderHook(
        ({ value, maxWait }) => useDebounce(value, 500, { maxWait }),
        { initialProps: { value: "initial", maxWait: 2000 } }
      );

      rerender({ value: "first", maxWait: 1000 });
      act(() => {
        vi.advanceTimersByTime(400);
      });

      rerender({ value: "second", maxWait: 1000 });
      act(() => {
        vi.advanceTimersByTime(400);
      });

      rerender({ value: "third", maxWait: 1000 });
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current).toBe("third");
    });

    it("should react to leading option changes", () => {
      const { result, rerender } = renderHook(
        ({ value, leading }) => useDebounce(value, 500, { leading }),
        { initialProps: { value: "initial", leading: false } }
      );

      rerender({ value: "first", leading: false });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe("first");

      // Wait for delay to pass
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Now with leading enabled, should update immediately
      rerender({ value: "second", leading: true });
      expect(result.current).toBe("second");
    });
  });

  describe("cleanup", () => {
    it("should cleanup timers on unmount", () => {
      const { result, rerender, unmount } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: "initial" } }
      );

      rerender({ value: "updated" });
      unmount();

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe("initial");
    });

    it("should cleanup previous timers on value change", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: "a" } }
      );

      rerender({ value: "b" });
      act(() => {
        vi.advanceTimersByTime(300);
      });

      rerender({ value: "c" });
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current).toBe("a");

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current).toBe("c");
    });

    it("should cleanup maxWait timer when value updates normally", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500, { maxWait: 2000 }),
        { initialProps: { value: "a" } }
      );

      rerender({ value: "b" });
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe("b");

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(result.current).toBe("b");
    });
  });

  describe("leading: false and trailing: false", () => {
    it("should never update when both leading and trailing are false", () => {
      const { result, rerender } = renderHook(
        ({ value }) =>
          useDebounce(value, 500, { leading: false, trailing: false }),
        { initialProps: { value: "initial" } }
      );

      rerender({ value: "updated" });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current).toBe("initial");
    });

    it("should never update even with maxWait when both edges are false", () => {
      const { result, rerender } = renderHook(
        ({ value }) =>
          useDebounce(value, 500, {
            leading: false,
            trailing: false,
            maxWait: 1000,
          }),
        { initialProps: { value: "initial" } }
      );

      // Simulate continuous updates
      for (let i = 1; i <= 10; i++) {
        rerender({ value: `update-${i}` });
        act(() => {
          vi.advanceTimersByTime(200);
        });
      }

      // Even after maxWait time has passed multiple times
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current).toBe("initial");
    });

    it("should never update with continuous rapid changes and maxWait", () => {
      const { result, rerender } = renderHook(
        ({ value }) =>
          useDebounce(value, 300, {
            leading: false,
            trailing: false,
            maxWait: 500,
          }),
        { initialProps: { value: 0 } }
      );

      // Simulate very rapid updates that would normally trigger maxWait
      for (let i = 1; i <= 20; i++) {
        rerender({ value: i });
        act(() => {
          vi.advanceTimersByTime(50);
        });
      }

      // Wait for any potential trailing edge
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Value should never have changed
      expect(result.current).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("should handle zero delay", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 0),
        { initialProps: { value: "initial" } }
      );

      rerender({ value: "updated" });

      act(() => {
        vi.advanceTimersByTime(0);
      });

      expect(result.current).toBe("updated");
    });

    it("should handle very large delay", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 999999),
        { initialProps: { value: "initial" } }
      );

      rerender({ value: "updated" });
      act(() => {
        vi.advanceTimersByTime(999998);
      });

      expect(result.current).toBe("initial");

      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(result.current).toBe("updated");
    });

    it("should handle null value", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce<string | null>(value, 500),
        { initialProps: { value: null as string | null } }
      );

      expect(result.current).toBe(null);

      rerender({ value: "updated" });
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe("updated");
    });

    it("should handle undefined value", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce<string | undefined>(value, 500),
        { initialProps: { value: undefined as string | undefined } }
      );

      expect(result.current).toBe(undefined);

      rerender({ value: "updated" });
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe("updated");
    });

    it("should handle same value updates", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: "same" } }
      );

      rerender({ value: "same" });
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe("same");
    });

    it("should handle maxWait of zero", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500, { maxWait: 0 }),
        { initialProps: { value: "initial" } }
      );

      rerender({ value: "updated" });

      // maxWait 0 is not greater than 0, so it's ignored - trailing edge applies
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe("updated");
    });

    it("should handle maxWait option (maxWait is clamped to at least wait)", () => {
      // Note: maxWait is always >= wait (same as lodash behavior)
      // So maxWait: 500 with delay: 1000 results in effective maxWait: 1000
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 1000, { maxWait: 500 }),
        { initialProps: { value: "a" } }
      );

      // First change - leadingEdge is called (but leading: false by default)
      act(() => {
        rerender({ value: "b" });
      });
      expect(result.current).toBe("a"); // leading: false, so no immediate update

      act(() => {
        vi.advanceTimersByTime(500);
      });

      act(() => {
        rerender({ value: "c" });
      });
      expect(result.current).toBe("a"); // Still waiting

      act(() => {
        vi.advanceTimersByTime(500);
      });

      // 1000ms has passed - timer expires, trailingEdge updates to "c"
      expect(result.current).toBe("c");
    });
  });

  describe("type safety", () => {
    it("should preserve string type", () => {
      const { result } = renderHook(() => useDebounce("test", 500));
      expect(typeof result.current).toBe("string");
    });

    it("should preserve number type", () => {
      const { result } = renderHook(() => useDebounce(123, 500));
      expect(typeof result.current).toBe("number");
    });

    it("should preserve boolean type", () => {
      const { result } = renderHook(() => useDebounce(true, 500));
      expect(typeof result.current).toBe("boolean");
    });

    it("should preserve object type", () => {
      const { result } = renderHook(() => useDebounce({ key: "value" }, 500));
      expect(typeof result.current).toBe("object");
      expect(result.current).toHaveProperty("key");
    });

    it("should preserve array type", () => {
      const { result } = renderHook(() => useDebounce([1, 2, 3], 500));
      expect(Array.isArray(result.current)).toBe(true);
    });
  });

  describe("multiple instances", () => {
    it("should maintain separate state across multiple hook instances", () => {
      const { result: result1, rerender: rerender1 } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: "first" } }
      );

      const { result: result2, rerender: rerender2 } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: "second" } }
      );

      rerender1({ value: "updated1" });
      rerender2({ value: "updated2" });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result1.current).toBe("updated1");
      expect(result2.current).toBe("updated2");
    });

    it("should handle different delays for different instances", () => {
      const { result: result1, rerender: rerender1 } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: "a" } }
      );

      const { result: result2, rerender: rerender2 } = renderHook(
        ({ value }) => useDebounce(value, 600),
        { initialProps: { value: "b" } }
      );

      rerender1({ value: "a1" });
      rerender2({ value: "b1" });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result1.current).toBe("a1");
      expect(result2.current).toBe("b");

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result1.current).toBe("a1");
      expect(result2.current).toBe("b1");
    });
  });
});
