import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useStep } from "./useStep";

describe("useStep", () => {
  // ============ Initialization ============
  describe("initialization", () => {
    it("starts at step 0 by default", () => {
      const { result } = renderHook(() => useStep(4));
      expect(result.current[0]).toBe(0);
      expect(result.current[1].canGoToPrevStep).toBe(false);
      expect(result.current[1].canGoToNextStep).toBe(true);
    });

    it("starts at the provided initialStep", () => {
      const { result } = renderHook(() => useStep(4, 2));
      expect(result.current[0]).toBe(2);
      expect(result.current[1].canGoToPrevStep).toBe(true);
      expect(result.current[1].canGoToNextStep).toBe(true);
    });

    it("clamps an out-of-range initialStep into bounds", () => {
      const high = renderHook(() => useStep(3, 99));
      expect(high.result.current[0]).toBe(2);

      const low = renderHook(() => useStep(3, -5));
      expect(low.result.current[0]).toBe(0);
    });

    it("floors a fractional initialStep", () => {
      const { result } = renderHook(() => useStep(5, 2.9));
      expect(result.current[0]).toBe(2);
    });

    it("treats count < 1 or non-finite as a single step", () => {
      const zero = renderHook(() => useStep(0));
      expect(zero.result.current[0]).toBe(0);
      expect(zero.result.current[1].canGoToNextStep).toBe(false);
      expect(zero.result.current[1].canGoToPrevStep).toBe(false);

      const nan = renderHook(() => useStep(Number.NaN));
      expect(nan.result.current[1].canGoToNextStep).toBe(false);
    });
  });

  // ============ goToNextStep / goToPrevStep ============
  describe("navigation", () => {
    it("advances and retreats through steps", () => {
      const { result } = renderHook(() => useStep(3));

      act(() => result.current[1].goToNextStep());
      expect(result.current[0]).toBe(1);

      act(() => result.current[1].goToNextStep());
      expect(result.current[0]).toBe(2);
      expect(result.current[1].canGoToNextStep).toBe(false);

      act(() => result.current[1].goToPrevStep());
      expect(result.current[0]).toBe(1);
    });

    it("does not advance past the last step (no-op, stable value)", () => {
      const { result } = renderHook(() => useStep(2, 1));
      expect(result.current[0]).toBe(1);

      act(() => result.current[1].goToNextStep());
      expect(result.current[0]).toBe(1);
      expect(result.current[1].canGoToNextStep).toBe(false);
    });

    it("does not retreat before the first step (no-op, stable value)", () => {
      const { result } = renderHook(() => useStep(2));
      expect(result.current[0]).toBe(0);

      act(() => result.current[1].goToPrevStep());
      expect(result.current[0]).toBe(0);
      expect(result.current[1].canGoToPrevStep).toBe(false);
    });
  });

  // ============ setStep ============
  describe("setStep", () => {
    it("jumps to a specific index", () => {
      const { result } = renderHook(() => useStep(5));

      act(() => result.current[1].setStep(3));
      expect(result.current[0]).toBe(3);
    });

    it("accepts an updater function", () => {
      const { result } = renderHook(() => useStep(5, 2));

      act(() => result.current[1].setStep((s) => s + 2));
      expect(result.current[0]).toBe(4);

      act(() => result.current[1].setStep((s) => s - 3));
      expect(result.current[0]).toBe(1);
    });

    it("clamps and floors out-of-range / fractional targets", () => {
      const { result } = renderHook(() => useStep(4));

      act(() => result.current[1].setStep(99));
      expect(result.current[0]).toBe(3);

      act(() => result.current[1].setStep(-10));
      expect(result.current[0]).toBe(0);

      act(() => result.current[1].setStep(2.8));
      expect(result.current[0]).toBe(2);
    });
  });

  // ============ reset ============
  describe("reset", () => {
    it("returns to the initial step", () => {
      const { result } = renderHook(() => useStep(5, 1));

      act(() => result.current[1].setStep(4));
      expect(result.current[0]).toBe(4);

      act(() => result.current[1].reset());
      expect(result.current[0]).toBe(1);
    });
  });

  // ============ Dynamic count ============
  describe("dynamic count", () => {
    it("keeps the current step within range when count shrinks", () => {
      const { result, rerender } = renderHook(({ count }) => useStep(count), {
        initialProps: { count: 5 },
      });

      act(() => result.current[1].setStep(4));
      expect(result.current[0]).toBe(4);

      // Shrink the total number of steps below the current index.
      rerender({ count: 3 });
      expect(result.current[0]).toBe(2); // clamped to new last index
      expect(result.current[1].canGoToNextStep).toBe(false);
    });

    it("allows advancing again after count grows", () => {
      const { result, rerender } = renderHook(({ count }) => useStep(count), {
        initialProps: { count: 2 },
      });

      act(() => result.current[1].goToNextStep());
      expect(result.current[0]).toBe(1);
      expect(result.current[1].canGoToNextStep).toBe(false);

      rerender({ count: 4 });
      expect(result.current[1].canGoToNextStep).toBe(true);

      act(() => result.current[1].goToNextStep());
      expect(result.current[0]).toBe(2);
    });
  });

  // ============ Reference stability ============
  describe("reference stability", () => {
    it("keeps navigation functions stable across renders", () => {
      const { result, rerender } = renderHook(() => useStep(4));
      const before = result.current[1];

      rerender();

      const after = result.current[1];
      expect(after.goToNextStep).toBe(before.goToNextStep);
      expect(after.goToPrevStep).toBe(before.goToPrevStep);
      expect(after.setStep).toBe(before.setStep);
      expect(after.reset).toBe(before.reset);
    });

    it("keeps functions stable even after the step changes", () => {
      const { result } = renderHook(() => useStep(4));
      const nextBefore = result.current[1].goToNextStep;

      act(() => result.current[1].goToNextStep());

      expect(result.current[1].goToNextStep).toBe(nextBefore);
    });

    it("updates the controls object identity only when a flag flips", () => {
      const { result } = renderHook(() => useStep(3));

      const atStart = result.current[1]; // canPrev:false, canNext:true

      // Moving from 0 -> 1 flips canGoToPrevStep, so identity changes.
      act(() => result.current[1].goToNextStep());
      const atMiddle = result.current[1]; // canPrev:true, canNext:true
      expect(atMiddle).not.toBe(atStart);

      // Moving from 1 -> 2 flips canGoToNextStep, so identity changes again.
      act(() => result.current[1].goToNextStep());
      const atEnd = result.current[1]; // canPrev:true, canNext:false
      expect(atEnd).not.toBe(atMiddle);
    });
  });
});
