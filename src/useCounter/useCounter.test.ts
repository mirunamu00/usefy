import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useCounter } from "./useCounter";

describe("useCounter", () => {
  describe("initialization", () => {
    it("should initialize with default value of 0", () => {
      const { result } = renderHook(() => useCounter());
      expect(result.current.count).toBe(0);
    });

    it("should initialize with provided initial value", () => {
      const { result } = renderHook(() => useCounter(10));
      expect(result.current.count).toBe(10);
    });

    it("should initialize with negative initial value", () => {
      const { result } = renderHook(() => useCounter(-5));
      expect(result.current.count).toBe(-5);
    });

    it("should initialize with large initial value", () => {
      const { result } = renderHook(() => useCounter(1000000));
      expect(result.current.count).toBe(1000000);
    });

    it("should initialize with zero explicitly", () => {
      const { result } = renderHook(() => useCounter(0));
      expect(result.current.count).toBe(0);
    });
  });

  describe("increment", () => {
    it("should increment count from 0", () => {
      const { result } = renderHook(() => useCounter(0));

      act(() => {
        result.current.increment();
      });

      expect(result.current.count).toBe(1);
    });

    it("should increment count from positive value", () => {
      const { result } = renderHook(() => useCounter(10));

      act(() => {
        result.current.increment();
      });

      expect(result.current.count).toBe(11);
    });

    it("should increment count from negative value", () => {
      const { result } = renderHook(() => useCounter(-5));

      act(() => {
        result.current.increment();
      });

      expect(result.current.count).toBe(-4);
    });

    it("should handle multiple increments", () => {
      const { result } = renderHook(() => useCounter(0));

      act(() => {
        result.current.increment();
        result.current.increment();
        result.current.increment();
      });

      expect(result.current.count).toBe(3);
    });
  });

  describe("decrement", () => {
    it("should decrement count from positive value", () => {
      const { result } = renderHook(() => useCounter(5));

      act(() => {
        result.current.decrement();
      });

      expect(result.current.count).toBe(4);
    });

    it("should decrement count from 0 to negative", () => {
      const { result } = renderHook(() => useCounter(0));

      act(() => {
        result.current.decrement();
      });

      expect(result.current.count).toBe(-1);
    });

    it("should decrement count from negative value", () => {
      const { result } = renderHook(() => useCounter(-3));

      act(() => {
        result.current.decrement();
      });

      expect(result.current.count).toBe(-4);
    });

    it("should handle multiple decrements", () => {
      const { result } = renderHook(() => useCounter(10));

      act(() => {
        result.current.decrement();
        result.current.decrement();
        result.current.decrement();
      });

      expect(result.current.count).toBe(7);
    });
  });

  describe("reset", () => {
    it("should reset count to initial value after increment", () => {
      const { result } = renderHook(() => useCounter(10));

      act(() => {
        result.current.increment();
        result.current.increment();
      });

      expect(result.current.count).toBe(12);

      act(() => {
        result.current.reset();
      });

      expect(result.current.count).toBe(10);
    });

    it("should reset count to initial value after decrement", () => {
      const { result } = renderHook(() => useCounter(5));

      act(() => {
        result.current.decrement();
        result.current.decrement();
      });

      expect(result.current.count).toBe(3);

      act(() => {
        result.current.reset();
      });

      expect(result.current.count).toBe(5);
    });

    it("should reset to negative initial value", () => {
      const { result } = renderHook(() => useCounter(-5));

      act(() => {
        result.current.increment();
        result.current.increment();
        result.current.increment();
      });

      expect(result.current.count).toBe(-2);

      act(() => {
        result.current.reset();
      });

      expect(result.current.count).toBe(-5);
    });

    it("should reset to 0 when that is the initial value", () => {
      const { result } = renderHook(() => useCounter(0));

      act(() => {
        result.current.increment();
        result.current.increment();
        result.current.decrement();
      });

      expect(result.current.count).toBe(1);

      act(() => {
        result.current.reset();
      });

      expect(result.current.count).toBe(0);
    });

    it("should handle multiple resets", () => {
      const { result } = renderHook(() => useCounter(7));

      act(() => {
        result.current.increment();
        result.current.reset();
      });

      expect(result.current.count).toBe(7);

      act(() => {
        result.current.decrement();
        result.current.reset();
      });

      expect(result.current.count).toBe(7);
    });
  });

  describe("complex scenarios", () => {
    it("should handle multiple operations in sequence", () => {
      const { result } = renderHook(() => useCounter(0));

      act(() => {
        result.current.increment();
        result.current.increment();
        result.current.increment();
      });

      expect(result.current.count).toBe(3);

      act(() => {
        result.current.decrement();
      });

      expect(result.current.count).toBe(2);

      act(() => {
        result.current.reset();
      });

      expect(result.current.count).toBe(0);
    });

    it("should handle crossing zero boundary", () => {
      const { result } = renderHook(() => useCounter(2));

      act(() => {
        result.current.decrement();
        result.current.decrement();
      });

      expect(result.current.count).toBe(0);

      act(() => {
        result.current.decrement();
      });

      expect(result.current.count).toBe(-1);

      act(() => {
        result.current.increment();
        result.current.increment();
      });

      expect(result.current.count).toBe(1);
    });

    it("should maintain count stability with no operations", () => {
      const { result } = renderHook(() => useCounter(5));

      expect(result.current.count).toBe(5);
      expect(result.current.count).toBe(5);
    });

    it("should handle alternating increment and decrement", () => {
      const { result } = renderHook(() => useCounter(0));

      act(() => {
        result.current.increment();
        result.current.decrement();
        result.current.increment();
        result.current.decrement();
        result.current.increment();
      });

      expect(result.current.count).toBe(1);
    });

    it("should handle large number operations", () => {
      const { result } = renderHook(() => useCounter(999999));

      act(() => {
        result.current.increment();
      });

      expect(result.current.count).toBe(1000000);

      act(() => {
        result.current.decrement();
        result.current.decrement();
      });

      expect(result.current.count).toBe(999998);
    });

    it("should maintain separate state across multiple hook instances", () => {
      const { result: result1 } = renderHook(() => useCounter(0));
      const { result: result2 } = renderHook(() => useCounter(10));

      act(() => {
        result1.current.increment();
        result2.current.decrement();
      });

      expect(result1.current.count).toBe(1);
      expect(result2.current.count).toBe(9);
    });
  });

  describe("function references", () => {
    it("should maintain stable function references across renders", () => {
      const { result, rerender } = renderHook(() => useCounter(0));

      const initialIncrement = result.current.increment;
      const initialDecrement = result.current.decrement;
      const initialReset = result.current.reset;

      act(() => {
        result.current.increment();
      });

      rerender();

      expect(result.current.increment).toBe(initialIncrement);
      expect(result.current.decrement).toBe(initialDecrement);
      expect(result.current.reset).toBe(initialReset);
    });
  });
});
