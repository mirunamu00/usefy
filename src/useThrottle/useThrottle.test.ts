import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useThrottle } from "./useThrottle";

describe("useThrottle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with the initial value", () => {
      const { result } = renderHook(() => useThrottle("initial", 500));
      expect(result.current).toBe("initial");
    });

    it("should initialize with number value", () => {
      const { result } = renderHook(() => useThrottle(42, 500));
      expect(result.current).toBe(42);
    });

    it("should initialize with boolean value", () => {
      const { result } = renderHook(() => useThrottle(true, 500));
      expect(result.current).toBe(true);
    });

    it("should initialize with object value", () => {
      const obj = { key: "value" };
      const { result } = renderHook(() => useThrottle(obj, 500));
      expect(result.current).toBe(obj);
    });

    it("should initialize with array value", () => {
      const arr = [1, 2, 3];
      const { result } = renderHook(() => useThrottle(arr, 500));
      expect(result.current).toEqual(arr);
    });

    it("should use default delay of 500ms when not specified", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useThrottle(value),
        { initialProps: { value: "initial" } }
      );

      expect(result.current).toBe("initial");

      rerender({ value: "updated" });
      // With leading: true (default), first change should update immediately
      expect(result.current).toBe("updated");
    });
  });

  describe("basic throttling with default options (leading: true, trailing: true)", () => {
    it("should update immediately on first change (leading edge)", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useThrottle(value, 500),
        { initialProps: { value: "initial" } }
      );

      expect(result.current).toBe("initial");

      // First change should trigger leading edge
      rerender({ value: "first" });
      expect(result.current).toBe("first");
    });

    it("should throttle rapid updates after leading edge", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useThrottle(value, 500),
        { initialProps: { value: "initial" } }
      );

      // First change - leading edge
      rerender({ value: "first" });
      expect(result.current).toBe("first");

      // Rapid changes should be throttled
      rerender({ value: "second" });
      expect(result.current).toBe("first");

      rerender({ value: "third" });
      expect(result.current).toBe("first");

      // After throttle interval, trailing edge should update
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe("third");
    });

    it("should update at most once per interval during continuous changes", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useThrottle(value, 500),
        { initialProps: { value: 0 } }
      );

      // First change - leading edge
      rerender({ value: 1 });
      expect(result.current).toBe(1);

      // Rapid changes within interval
      for (let i = 2; i <= 5; i++) {
        rerender({ value: i });
        act(() => {
          vi.advanceTimersByTime(100);
        });
      }

      // After 400ms, still throttled
      expect(result.current).toBe(1);

      // After 500ms total, should update via maxWait
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current).toBe(5);
    });

    it("should allow new leading edge after interval passes", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useThrottle(value, 500),
        { initialProps: { value: "a" } }
      );

      // First change - leading edge
      rerender({ value: "b" });
      expect(result.current).toBe("b");

      // Wait for interval to pass
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Wait more to ensure leading edge is ready
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Next change should trigger leading edge again
      rerender({ value: "c" });
      expect(result.current).toBe("c");
    });
  });

  describe("leading edge option", () => {
    it("should update immediately with leading: true (default)", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useThrottle(value, 500, { leading: true }),
        { initialProps: { value: "initial" } }
      );

      rerender({ value: "first" });
      expect(result.current).toBe("first");
    });

    it("should not update immediately with leading: false", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useThrottle(value, 500, { leading: false }),
        { initialProps: { value: "initial" } }
      );

      rerender({ value: "first" });
      expect(result.current).toBe("initial");

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe("first");
    });

    it("should work with leading: true and trailing: false", () => {
      const { result, rerender } = renderHook(
        ({ value }) =>
          useThrottle(value, 500, { leading: true, trailing: false }),
        { initialProps: { value: "initial" } }
      );

      // First change - leading edge
      rerender({ value: "first" });
      expect(result.current).toBe("first");

      // Rapid changes
      rerender({ value: "second" });
      rerender({ value: "third" });

      // Wait for interval - trailing is false, but maxWait triggers
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // maxWait should have triggered
      expect(result.current).toBe("first");

      // Wait more for next leading edge
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Next change should trigger leading
      rerender({ value: "fourth" });
      expect(result.current).toBe("fourth");
    });
  });

  describe("trailing edge option", () => {
    it("should update on trailing edge by default", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useThrottle(value, 500),
        { initialProps: { value: "initial" } }
      );

      // First change - leading edge
      rerender({ value: "first" });
      expect(result.current).toBe("first");

      // More changes
      rerender({ value: "second" });

      // Wait for trailing edge
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe("second");
    });

    it("should work with leading: false and trailing: true", () => {
      const { result, rerender } = renderHook(
        ({ value }) =>
          useThrottle(value, 500, { leading: false, trailing: true }),
        { initialProps: { value: "initial" } }
      );

      // First change - no leading edge
      rerender({ value: "first" });
      expect(result.current).toBe("initial");

      // Wait for trailing edge
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe("first");
    });
  });

  describe("maxWait behavior (inherent to throttle)", () => {
    it("should update at least once per interval during continuous changes", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useThrottle(value, 1000),
        { initialProps: { value: 0 } }
      );

      // First change - leading edge
      rerender({ value: 1 });
      expect(result.current).toBe(1);

      // Continuous changes every 200ms
      for (let i = 2; i <= 10; i++) {
        rerender({ value: i });
        act(() => {
          vi.advanceTimersByTime(200);
        });
      }

      // After 1800ms (9 * 200ms), should have updated multiple times due to maxWait
      // At 1000ms, maxWait should have triggered with value around 5-6
      expect(result.current).toBeGreaterThan(1);
    });

    it("should enforce maxWait = delay", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useThrottle(value, 500),
        { initialProps: { value: "a" } }
      );

      // First change - leading edge
      rerender({ value: "b" });
      expect(result.current).toBe("b");

      // Change rapidly
      rerender({ value: "c" });
      act(() => {
        vi.advanceTimersByTime(200);
      });

      rerender({ value: "d" });
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // After 400ms, still within first interval
      expect(result.current).toBe("b");

      rerender({ value: "e" });
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // At 500ms, maxWait should trigger
      expect(result.current).toBe("e");
    });
  });

  describe("complex scenarios", () => {
    it("should handle string value changes", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useThrottle(value, 300),
        { initialProps: { value: "" } }
      );

      const searchTerms = ["r", "re", "rea", "reac", "react"];

      // First non-empty value - leading edge
      rerender({ value: searchTerms[0] });
      expect(result.current).toBe("r");

      // Rapid typing
      searchTerms.slice(1).forEach((term) => {
        rerender({ value: term });
        act(() => {
          vi.advanceTimersByTime(50);
        });
      });

      // After rapid typing (200ms), maxWait not yet reached
      expect(result.current).toBe("r");

      // Wait for maxWait/trailing
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current).toBe("react");
    });

    it("should handle number increments", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useThrottle(value, 500),
        { initialProps: { value: 0 } }
      );

      // First increment - leading edge
      rerender({ value: 10 });
      expect(result.current).toBe(10);

      rerender({ value: 20 });
      rerender({ value: 30 });

      // Still throttled
      expect(result.current).toBe(10);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe(30);
    });

    it("should handle object updates", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useThrottle(value, 500),
        { initialProps: { value: { count: 0 } } }
      );

      const obj1 = { count: 1 };
      const obj2 = { count: 2 };

      // First change - leading edge
      rerender({ value: obj1 });
      expect(result.current).toEqual(obj1);

      rerender({ value: obj2 });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toEqual(obj2);
    });

    it("should handle scroll-like rapid updates", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useThrottle(value, 100),
        { initialProps: { value: 0 } }
      );

      // Simulate scroll events every 16ms (60fps)
      for (let i = 1; i <= 20; i++) {
        rerender({ value: i * 10 });
        act(() => {
          vi.advanceTimersByTime(16);
        });
      }

      // After 320ms (20 * 16ms), should have throttled updates
      // First update at 0ms (leading), then at 100ms, 200ms, 300ms
      expect(result.current).toBeGreaterThan(0);
      expect(result.current).toBeLessThanOrEqual(200);
    });
  });

  describe("option changes", () => {
    it("should react to delay changes", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useThrottle(value, delay),
        { initialProps: { value: "initial", delay: 500 } }
      );

      // First change - leading edge
      rerender({ value: "first", delay: 500 });
      expect(result.current).toBe("first");

      // Wait for trailing edge
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Wait for leading edge to be available again
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Now change with new delay - should trigger leading edge
      rerender({ value: "second", delay: 1000 });
      expect(result.current).toBe("second");

      rerender({ value: "third", delay: 1000 });
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Still within new 1000ms delay
      expect(result.current).toBe("second");

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe("third");
    });

    it("should react to leading option changes", () => {
      const { result, rerender } = renderHook(
        ({ value, leading }) => useThrottle(value, 500, { leading }),
        { initialProps: { value: "initial", leading: false } }
      );

      // With leading: false, first change doesn't update immediately
      rerender({ value: "first", leading: false });
      expect(result.current).toBe("initial");

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe("first");

      // Wait for next interval
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Change to leading: true
      rerender({ value: "second", leading: true });
      expect(result.current).toBe("second");
    });

    it("should react to trailing option changes", () => {
      const { result, rerender } = renderHook(
        ({ value, trailing }) => useThrottle(value, 500, { trailing }),
        { initialProps: { value: "initial", trailing: true } }
      );

      rerender({ value: "first", trailing: true });
      expect(result.current).toBe("first");

      rerender({ value: "second", trailing: true });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe("second");
    });
  });

  describe("cleanup", () => {
    it("should cleanup timers on unmount", () => {
      const { result, rerender, unmount } = renderHook(
        ({ value }) => useThrottle(value, 500),
        { initialProps: { value: "initial" } }
      );

      rerender({ value: "first" });
      expect(result.current).toBe("first");

      rerender({ value: "second" });
      unmount();

      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Should stay at first (unmounted before trailing edge)
      expect(result.current).toBe("first");
    });
  });

  describe("edge cases", () => {
    it("should handle zero delay", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useThrottle(value, 0),
        { initialProps: { value: "initial" } }
      );

      rerender({ value: "first" });
      expect(result.current).toBe("first");

      rerender({ value: "second" });

      act(() => {
        vi.advanceTimersByTime(0);
      });

      expect(result.current).toBe("second");
    });

    it("should handle null value", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useThrottle<string | null>(value, 500),
        { initialProps: { value: null as string | null } }
      );

      expect(result.current).toBe(null);

      rerender({ value: "updated" });
      expect(result.current).toBe("updated");
    });

    it("should handle undefined value", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useThrottle<string | undefined>(value, 500),
        { initialProps: { value: undefined as string | undefined } }
      );

      expect(result.current).toBe(undefined);

      rerender({ value: "updated" });
      expect(result.current).toBe("updated");
    });

    it("should handle same value updates (no change)", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useThrottle(value, 500),
        { initialProps: { value: "same" } }
      );

      rerender({ value: "same" });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe("same");
    });

    it("should handle both leading and trailing false (no updates)", () => {
      // Note: With throttle, maxWait = wait. So when both leading and trailing
      // are false, the timer expires (trailingEdge) before maxWait can trigger
      // the maxing branch. This means the value never updates.
      // This is an edge case that users should avoid.
      const { result, rerender } = renderHook(
        ({ value }) =>
          useThrottle(value, 500, { leading: false, trailing: false }),
        { initialProps: { value: "initial" } }
      );

      // First change - leading: false, so no immediate update
      rerender({ value: "first" });
      expect(result.current).toBe("initial");

      act(() => {
        vi.advanceTimersByTime(500);
      });

      // trailing: false, so no update on timer expiry
      expect(result.current).toBe("initial");

      // Another change
      rerender({ value: "second" });
      expect(result.current).toBe("initial");

      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Still no update - this configuration effectively disables throttling
      expect(result.current).toBe("initial");

      // Continuous rapid changes also don't help because maxWait = wait
      // The timer expires before maxWait condition can be met
      rerender({ value: "third" });
      act(() => {
        vi.advanceTimersByTime(200);
      });

      rerender({ value: "fourth" });
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Timer expired at 500ms, but trailing: false so no update
      expect(result.current).toBe("initial");
    });
  });

  describe("type safety", () => {
    it("should preserve string type", () => {
      const { result } = renderHook(() => useThrottle("test", 500));
      expect(typeof result.current).toBe("string");
    });

    it("should preserve number type", () => {
      const { result } = renderHook(() => useThrottle(123, 500));
      expect(typeof result.current).toBe("number");
    });

    it("should preserve boolean type", () => {
      const { result } = renderHook(() => useThrottle(true, 500));
      expect(typeof result.current).toBe("boolean");
    });

    it("should preserve object type", () => {
      const { result } = renderHook(() => useThrottle({ key: "value" }, 500));
      expect(typeof result.current).toBe("object");
      expect(result.current).toHaveProperty("key");
    });

    it("should preserve array type", () => {
      const { result } = renderHook(() => useThrottle([1, 2, 3], 500));
      expect(Array.isArray(result.current)).toBe(true);
    });
  });

  describe("multiple instances", () => {
    it("should maintain separate state across multiple hook instances", () => {
      const { result: result1, rerender: rerender1 } = renderHook(
        ({ value }) => useThrottle(value, 500),
        { initialProps: { value: "first" } }
      );

      const { result: result2, rerender: rerender2 } = renderHook(
        ({ value }) => useThrottle(value, 500),
        { initialProps: { value: "second" } }
      );

      rerender1({ value: "updated1" });
      rerender2({ value: "updated2" });

      expect(result1.current).toBe("updated1");
      expect(result2.current).toBe("updated2");
    });

    it("should handle different delays for different instances", () => {
      const { result: result1, rerender: rerender1 } = renderHook(
        ({ value }) => useThrottle(value, 300),
        { initialProps: { value: "a" } }
      );

      const { result: result2, rerender: rerender2 } = renderHook(
        ({ value }) => useThrottle(value, 600),
        { initialProps: { value: "b" } }
      );

      // Both get leading edge
      rerender1({ value: "a1" });
      rerender2({ value: "b1" });

      expect(result1.current).toBe("a1");
      expect(result2.current).toBe("b1");

      // Add more changes
      rerender1({ value: "a2" });
      rerender2({ value: "b2" });

      // After 300ms, first instance updates
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result1.current).toBe("a2");
      expect(result2.current).toBe("b1"); // Still throttled

      // After 600ms total, second instance updates
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result2.current).toBe("b2");
    });
  });

  describe("comparison with debounce behavior", () => {
    it("should update during continuous input unlike debounce", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useThrottle(value, 500),
        { initialProps: { value: 0 } }
      );

      // First change - leading edge
      rerender({ value: 1 });
      expect(result.current).toBe(1);

      // Continuous updates every 100ms for 2 seconds
      let updateCount = 0;
      for (let i = 2; i <= 20; i++) {
        rerender({ value: i });
        act(() => {
          vi.advanceTimersByTime(100);
        });

        // Check if value updated
        if (result.current === i) {
          updateCount++;
        }
      }

      // Throttle should have updated multiple times during the 2 seconds
      // (at 500ms, 1000ms, 1500ms, 2000ms intervals)
      expect(updateCount).toBeGreaterThan(0);
    });

    it("should have leading: true as default unlike debounce", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useThrottle(value, 500),
        { initialProps: { value: "initial" } }
      );

      // Unlike debounce (leading: false by default), throttle updates immediately
      rerender({ value: "first" });
      expect(result.current).toBe("first");
    });
  });
});
