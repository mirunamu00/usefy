import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useSignal } from "./useSignal";
import { clearAllSignals } from "./store";

describe("useSignal", () => {
  beforeEach(() => {
    clearAllSignals();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initialization", () => {
    it("should initialize with signal value of 0", () => {
      const { result } = renderHook(() => useSignal("test"));
      expect(result.current.signal).toBe(0);
    });

    it("should return all required properties", () => {
      const { result } = renderHook(() => useSignal("test"));

      expect(result.current).toHaveProperty("signal");
      expect(result.current).toHaveProperty("emit");
      expect(result.current).toHaveProperty("info");

      expect(typeof result.current.signal).toBe("number");
      expect(typeof result.current.emit).toBe("function");
      expect(typeof result.current.info).toBe("object");
    });

    it("should return info object with correct properties", () => {
      const { result } = renderHook(() => useSignal("test-signal"));

      expect(result.current.info).toHaveProperty("name", "test-signal");
      expect(result.current.info).toHaveProperty("subscriberCount");
      expect(result.current.info).toHaveProperty("timestamp");
      expect(result.current.info).toHaveProperty("emitCount");
      expect(result.current.info).toHaveProperty("data");
    });

    it("should have undefined data initially", () => {
      const { result } = renderHook(() => useSignal("test"));
      expect(result.current.info.data).toBeUndefined();
    });

    it("should have subscriberCount of 1 when one component subscribes", () => {
      const { result } = renderHook(() => useSignal("test"));
      expect(result.current.info.subscriberCount).toBe(1);
    });
  });

  describe("emit", () => {
    it("should increment signal on emit", () => {
      const { result } = renderHook(() => useSignal("test"));

      expect(result.current.signal).toBe(0);

      act(() => {
        result.current.emit();
      });

      expect(result.current.signal).toBe(1);
    });

    it("should increment signal multiple times", () => {
      const { result } = renderHook(() => useSignal("test"));

      act(() => {
        result.current.emit();
      });
      expect(result.current.signal).toBe(1);

      act(() => {
        result.current.emit();
      });
      expect(result.current.signal).toBe(2);

      act(() => {
        result.current.emit();
      });
      expect(result.current.signal).toBe(3);
    });

    it("should update emitCount on emit", () => {
      const { result } = renderHook(() => useSignal("test"));

      expect(result.current.info.emitCount).toBe(0);

      act(() => {
        result.current.emit();
      });

      expect(result.current.info.emitCount).toBe(1);
    });

    it("should update timestamp on emit", () => {
      const { result } = renderHook(() => useSignal("test"));

      const beforeTimestamp = result.current.info.timestamp;
      expect(beforeTimestamp).toBe(0);

      vi.setSystemTime(new Date("2024-01-01T12:00:00.000Z"));

      act(() => {
        result.current.emit();
      });

      expect(result.current.info.timestamp).toBe(
        new Date("2024-01-01T12:00:00.000Z").getTime()
      );
    });
  });

  describe("emit with data", () => {
    it("should store data in info.data when emit is called with data", () => {
      const { result } = renderHook(() =>
        useSignal<{ message: string }>("test")
      );

      expect(result.current.info.data).toBeUndefined();

      act(() => {
        result.current.emit({ message: "hello" });
      });

      expect(result.current.info.data).toEqual({ message: "hello" });
    });

    it("should update data on each emit", () => {
      const { result } = renderHook(() => useSignal<string>("test"));

      act(() => {
        result.current.emit("first");
      });
      expect(result.current.info.data).toBe("first");

      act(() => {
        result.current.emit("second");
      });
      expect(result.current.info.data).toBe("second");
    });

    it("should allow undefined data after having data", () => {
      const { result } = renderHook(() => useSignal<string>("test"));

      act(() => {
        result.current.emit("some data");
      });
      expect(result.current.info.data).toBe("some data");

      act(() => {
        result.current.emit();
      });
      expect(result.current.info.data).toBeUndefined();
    });

    it("should share data across multiple subscribers", () => {
      const { result: result1 } = renderHook(() =>
        useSignal<number>("shared-data")
      );
      const { result: result2 } = renderHook(() =>
        useSignal<number>("shared-data")
      );

      act(() => {
        result1.current.emit(42);
      });

      expect(result1.current.info.data).toBe(42);
      expect(result2.current.info.data).toBe(42);
    });

    it("should have data available before signal triggers useEffect", () => {
      // This test verifies the core guarantee: data is set BEFORE signal changes
      const dataLog: Array<{ signal: number; data: unknown }> = [];

      const { result } = renderHook(() => {
        const { signal, emit, info } = useSignal<string>("test");

        // Simulate what happens in useEffect - capture both values
        if (signal > 0) {
          dataLog.push({ signal, data: info.data });
        }

        return { signal, emit, info };
      });

      act(() => {
        result.current.emit("test-data");
      });

      // Verify data was available when signal changed
      expect(dataLog.length).toBeGreaterThan(0);
      expect(dataLog[0].data).toBe("test-data");
    });

    it("should work with complex object data", () => {
      interface UserAction {
        userId: string;
        action: string;
        timestamp: number;
      }

      const { result } = renderHook(() => useSignal<UserAction>("user-action"));

      const actionData: UserAction = {
        userId: "user-123",
        action: "click",
        timestamp: 1234567890,
      };

      act(() => {
        result.current.emit(actionData);
      });

      expect(result.current.info.data).toEqual(actionData);
    });

    it("should handle null as valid data", () => {
      const { result } = renderHook(() => useSignal<null | string>("test"));

      act(() => {
        result.current.emit(null);
      });

      expect(result.current.info.data).toBeNull();
    });
  });

  describe("multi-subscriber synchronization", () => {
    it("should sync signal across multiple subscribers with same name", () => {
      const { result: result1 } = renderHook(() => useSignal("shared"));
      const { result: result2 } = renderHook(() => useSignal("shared"));

      expect(result1.current.signal).toBe(0);
      expect(result2.current.signal).toBe(0);

      act(() => {
        result1.current.emit();
      });

      expect(result1.current.signal).toBe(1);
      expect(result2.current.signal).toBe(1);
    });

    it("should show correct subscriberCount for multiple subscribers", () => {
      const { result: result1 } = renderHook(() => useSignal("shared"));
      expect(result1.current.info.subscriberCount).toBe(1);

      const { result: result2 } = renderHook(() => useSignal("shared"));
      expect(result1.current.info.subscriberCount).toBe(2);
      expect(result2.current.info.subscriberCount).toBe(2);

      const { result: result3 } = renderHook(() => useSignal("shared"));
      expect(result1.current.info.subscriberCount).toBe(3);
      expect(result2.current.info.subscriberCount).toBe(3);
      expect(result3.current.info.subscriberCount).toBe(3);
    });

    it("should decrement subscriberCount on unmount", () => {
      const { result: result1 } = renderHook(() => useSignal("shared"));
      const { result: result2, unmount } = renderHook(() =>
        useSignal("shared")
      );

      expect(result1.current.info.subscriberCount).toBe(2);

      unmount();

      // Need to trigger a re-render to see updated count
      act(() => {
        result1.current.emit();
      });

      expect(result1.current.info.subscriberCount).toBe(1);
    });
  });

  describe("independent signals", () => {
    it("should keep different signal names independent", () => {
      const { result: result1 } = renderHook(() => useSignal("signal-a"));
      const { result: result2 } = renderHook(() => useSignal("signal-b"));

      act(() => {
        result1.current.emit();
      });

      expect(result1.current.signal).toBe(1);
      expect(result2.current.signal).toBe(0);
    });

    it("should maintain separate subscriberCounts for different signals", () => {
      const { result: result1 } = renderHook(() => useSignal("signal-a"));
      const { result: result2 } = renderHook(() => useSignal("signal-b"));

      expect(result1.current.info.subscriberCount).toBe(1);
      expect(result2.current.info.subscriberCount).toBe(1);
    });
  });

  describe("options", () => {
    describe("emitOnMount", () => {
      it("should emit on mount when emitOnMount is true", () => {
        const { result } = renderHook(() =>
          useSignal("test", { emitOnMount: true })
        );

        expect(result.current.signal).toBe(1);
        expect(result.current.info.emitCount).toBe(1);
      });

      it("should not emit on mount by default", () => {
        const { result } = renderHook(() => useSignal("test"));

        expect(result.current.signal).toBe(0);
        expect(result.current.info.emitCount).toBe(0);
      });
    });

    describe("onEmit", () => {
      it("should call onEmit callback when emit is called", () => {
        const onEmit = vi.fn();
        const { result } = renderHook(() => useSignal("test", { onEmit }));

        act(() => {
          result.current.emit();
        });

        expect(onEmit).toHaveBeenCalledTimes(1);
      });

      it("should call onEmit on each emit", () => {
        const onEmit = vi.fn();
        const { result } = renderHook(() => useSignal("test", { onEmit }));

        act(() => {
          result.current.emit();
          result.current.emit();
          result.current.emit();
        });

        expect(onEmit).toHaveBeenCalledTimes(3);
      });

      it("should call onEmit when emitOnMount triggers", () => {
        const onEmit = vi.fn();
        renderHook(() => useSignal("test", { emitOnMount: true, onEmit }));

        expect(onEmit).toHaveBeenCalledTimes(1);
      });
    });

    describe("enabled", () => {
      it("should not subscribe when enabled is false", () => {
        const { result: result1 } = renderHook(() => useSignal("test"));
        const { result: result2 } = renderHook(() =>
          useSignal("test", { enabled: false })
        );

        // Only first one subscribes
        expect(result1.current.info.subscriberCount).toBe(1);

        act(() => {
          result1.current.emit();
        });

        // First subscriber receives update, second does not
        expect(result1.current.signal).toBe(1);
        expect(result2.current.signal).toBe(0);
      });

      it("should return 0 for signal when disabled", () => {
        const { result } = renderHook(() =>
          useSignal("test", { enabled: false })
        );

        expect(result.current.signal).toBe(0);
      });
    });

    describe("debounce", () => {
      it("should debounce emit calls", () => {
        const { result } = renderHook(() =>
          useSignal("test", { debounce: 100 })
        );

        act(() => {
          result.current.emit();
          result.current.emit();
          result.current.emit();
        });

        // Signal should still be 0 (debounced)
        expect(result.current.signal).toBe(0);

        // Advance timers
        act(() => {
          vi.advanceTimersByTime(100);
        });

        // Now signal should be 1 (only one emit after debounce)
        expect(result.current.signal).toBe(1);
      });

      it("should reset debounce timer on each emit call", () => {
        const { result } = renderHook(() =>
          useSignal("test", { debounce: 100 })
        );

        act(() => {
          result.current.emit();
        });

        act(() => {
          vi.advanceTimersByTime(50);
        });

        act(() => {
          result.current.emit(); // Reset timer
        });

        act(() => {
          vi.advanceTimersByTime(50);
        });

        // Still waiting
        expect(result.current.signal).toBe(0);

        act(() => {
          vi.advanceTimersByTime(50);
        });

        // Now should emit
        expect(result.current.signal).toBe(1);
      });

      it("should not debounce when debounce is 0", () => {
        const { result } = renderHook(() =>
          useSignal("test", { debounce: 0 })
        );

        act(() => {
          result.current.emit();
          result.current.emit();
          result.current.emit();
        });

        expect(result.current.signal).toBe(3);
      });

      it("should use the latest data when debounced emit fires", () => {
        const { result } = renderHook(() =>
          useSignal<string>("test", { debounce: 100 })
        );

        act(() => {
          result.current.emit("first");
          result.current.emit("second");
          result.current.emit("third");
        });

        // Signal should still be 0 (debounced)
        expect(result.current.signal).toBe(0);
        expect(result.current.info.data).toBeUndefined();

        // Advance timers
        act(() => {
          vi.advanceTimersByTime(100);
        });

        // Now signal should be 1 and data should be "third" (latest)
        expect(result.current.signal).toBe(1);
        expect(result.current.info.data).toBe("third");
      });
    });
  });

  describe("stable references", () => {
    it("should maintain stable emit function reference", () => {
      const { result, rerender } = renderHook(() => useSignal("test"));

      const initialEmit = result.current.emit;

      act(() => {
        result.current.emit();
      });

      rerender();

      expect(result.current.emit).toBe(initialEmit);
    });

    it("should maintain stable info object reference", () => {
      const { result, rerender } = renderHook(() => useSignal("test"));

      const initialInfo = result.current.info;

      act(() => {
        result.current.emit();
      });

      rerender();

      expect(result.current.info).toBe(initialInfo);
    });

    it("should update info values while keeping reference stable", () => {
      const { result } = renderHook(() => useSignal("test"));

      const info = result.current.info;
      expect(info.emitCount).toBe(0);

      act(() => {
        result.current.emit();
      });

      // Same reference, updated value
      expect(result.current.info).toBe(info);
      expect(result.current.info.emitCount).toBe(1);
    });
  });

  describe("edge cases", () => {
    it("should handle rapid successive emits", () => {
      const { result } = renderHook(() => useSignal("test"));

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.emit();
        }
      });

      expect(result.current.signal).toBe(100);
      expect(result.current.info.emitCount).toBe(100);
    });

    it("should handle emit after unmount gracefully", () => {
      const { result, unmount } = renderHook(() => useSignal("test"));

      const emit = result.current.emit;
      unmount();

      // Should not throw
      expect(() => emit()).not.toThrow();
    });

    it("should handle changing signal name", () => {
      const { result, rerender } = renderHook(
        ({ name }) => useSignal(name),
        { initialProps: { name: "signal-a" } }
      );

      act(() => {
        result.current.emit();
      });

      expect(result.current.signal).toBe(1);
      expect(result.current.info.name).toBe("signal-a");

      rerender({ name: "signal-b" });

      expect(result.current.signal).toBe(0);
      expect(result.current.info.name).toBe("signal-b");
    });

    it("should cleanup debounce timer on unmount", () => {
      const { result, unmount } = renderHook(() =>
        useSignal("test", { debounce: 100 })
      );

      act(() => {
        result.current.emit();
      });

      unmount();

      // Should not throw when timers advance
      expect(() => {
        act(() => {
          vi.advanceTimersByTime(200);
        });
      }).not.toThrow();
    });
  });

  describe("complex scenarios", () => {
    it("should handle mixed enabled/disabled subscribers", () => {
      const { result: enabled1 } = renderHook(() => useSignal("test"));
      const { result: disabled } = renderHook(() =>
        useSignal("test", { enabled: false })
      );
      const { result: enabled2 } = renderHook(() => useSignal("test"));

      expect(enabled1.current.info.subscriberCount).toBe(2);

      act(() => {
        enabled1.current.emit();
      });

      expect(enabled1.current.signal).toBe(1);
      expect(disabled.current.signal).toBe(0);
      expect(enabled2.current.signal).toBe(1);
    });

    it("should handle emitOnMount with multiple subscribers", () => {
      const { result: result1 } = renderHook(() => useSignal("test"));
      const { result: result2 } = renderHook(() =>
        useSignal("test", { emitOnMount: true })
      );

      // Both should see the emit from result2's mount
      expect(result1.current.signal).toBe(1);
      expect(result2.current.signal).toBe(1);
    });

    it("should handle combined options", () => {
      const onEmit = vi.fn();
      const { result } = renderHook(() =>
        useSignal("test", {
          emitOnMount: true,
          onEmit,
          debounce: 100,
        })
      );

      // emitOnMount bypasses debounce (uses baseEmit directly)
      expect(result.current.signal).toBe(1);
      expect(onEmit).toHaveBeenCalledTimes(1);

      // Manual emit should be debounced
      act(() => {
        result.current.emit();
        result.current.emit();
      });

      expect(result.current.signal).toBe(1); // Still 1, waiting for debounce

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.signal).toBe(2);
      expect(onEmit).toHaveBeenCalledTimes(2);
    });
  });
});
