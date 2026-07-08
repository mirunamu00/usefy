import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isIntersectionObserverSupported,
  toIntersectionEntry,
  createInitialEntry,
  normalizeThreshold,
  createNoopRef,
} from "./utils";

describe("utils", () => {
  // ============ isIntersectionObserverSupported Tests ============
  describe("isIntersectionObserverSupported", () => {
    beforeEach(() => {
      // Ensure IntersectionObserver is stubbed for this test suite
      // vitest.setup.ts's afterEach unstubs globals, so we need to re-stub
      if (typeof window !== "undefined" && !window.IntersectionObserver) {
        vi.stubGlobal(
          "IntersectionObserver",
          class MockIntersectionObserver {
            constructor() {}
            observe() {}
            unobserve() {}
            disconnect() {}
            takeRecords() {
              return [];
            }
          }
        );
      }
    });

    it("should return true when IntersectionObserver is available", () => {
      expect(isIntersectionObserverSupported()).toBe(true);
    });

    it("should return false when window is undefined (SSR)", () => {
      const originalWindow = (globalThis as any).window;

      // Testing SSR environment - window should be undefined
      delete (globalThis as any).window;

      const result = isIntersectionObserverSupported();

      // Restore immediately
      (globalThis as any).window = originalWindow;

      expect(result).toBe(false);
    });

    it("should return false when IntersectionObserver is not in window", () => {
      const originalIO = window.IntersectionObserver;

      // @ts-expect-error - Testing unsupported environment
      delete window.IntersectionObserver;

      const result = isIntersectionObserverSupported();

      // Restore immediately
      window.IntersectionObserver = originalIO;

      expect(result).toBe(false);
    });
  });

  // ============ toIntersectionEntry Tests ============
  describe("toIntersectionEntry", () => {
    it("should convert native entry to IntersectionEntry", () => {
      const target = document.createElement("div");
      const rect: DOMRectReadOnly = {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        top: 0,
        right: 100,
        bottom: 100,
        left: 0,
        toJSON: () => ({}),
      };

      const nativeEntry = {
        target,
        isIntersecting: true,
        intersectionRatio: 0.5,
        boundingClientRect: rect,
        intersectionRect: rect,
        rootBounds: rect,
        time: 1234.5,
      } as IntersectionObserverEntry;

      const result = toIntersectionEntry(nativeEntry);

      expect(result.entry).toBe(nativeEntry);
      expect(result.isIntersecting).toBe(true);
      expect(result.intersectionRatio).toBe(0.5);
      expect(result.target).toBe(target);
      expect(result.boundingClientRect).toBe(rect);
      expect(result.intersectionRect).toBe(rect);
      expect(result.rootBounds).toBe(rect);
      expect(result.time).toBe(1234.5);
    });

    it("should handle non-intersecting entry", () => {
      const target = document.createElement("div");
      const rect: DOMRectReadOnly = {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        top: 0,
        right: 100,
        bottom: 100,
        left: 0,
        toJSON: () => ({}),
      };

      const nativeEntry = {
        target,
        isIntersecting: false,
        intersectionRatio: 0,
        boundingClientRect: rect,
        intersectionRect: rect,
        rootBounds: null,
        time: 5678.9,
      } as IntersectionObserverEntry;

      const result = toIntersectionEntry(nativeEntry);

      expect(result.isIntersecting).toBe(false);
      expect(result.intersectionRatio).toBe(0);
      expect(result.rootBounds).toBeNull();
    });

    it("should preserve all native entry properties", () => {
      const target = document.createElement("span");
      const rect1: DOMRectReadOnly = {
        x: 10,
        y: 20,
        width: 150,
        height: 200,
        top: 20,
        right: 160,
        bottom: 220,
        left: 10,
        toJSON: () => ({}),
      };
      const rect2: DOMRectReadOnly = {
        x: 5,
        y: 10,
        width: 75,
        height: 100,
        top: 10,
        right: 80,
        bottom: 110,
        left: 5,
        toJSON: () => ({}),
      };

      const nativeEntry = {
        target,
        isIntersecting: true,
        intersectionRatio: 0.75,
        boundingClientRect: rect1,
        intersectionRect: rect2,
        rootBounds: rect1,
        time: 9999.99,
      } as IntersectionObserverEntry;

      const result = toIntersectionEntry(nativeEntry);

      expect(result.boundingClientRect).toBe(rect1);
      expect(result.intersectionRect).toBe(rect2);
      expect(result.time).toBe(9999.99);
    });
  });

  // ============ createInitialEntry Tests ============
  describe("createInitialEntry", () => {
    it("should return null when isIntersecting is false", () => {
      const result = createInitialEntry(false);
      expect(result).toBeNull();
    });

    it("should return null when isIntersecting is false with target", () => {
      const target = document.createElement("div");
      const result = createInitialEntry(false, target);
      expect(result).toBeNull();
    });

    it("should create initial entry when isIntersecting is true", () => {
      const result = createInitialEntry(true);

      expect(result).not.toBeNull();
      expect(result?.isIntersecting).toBe(true);
      expect(result?.intersectionRatio).toBe(1);
      expect(result?.rootBounds).toBeNull();
    });

    it("should create entry with target element", () => {
      const target = document.createElement("div");
      const result = createInitialEntry(true, target);

      expect(result?.target).toBe(target);
      expect(result?.isIntersecting).toBe(true);
    });

    it("should create entry with empty rects", () => {
      const result = createInitialEntry(true);

      expect(result?.boundingClientRect).toEqual({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        toJSON: expect.any(Function),
      });

      expect(result?.intersectionRect).toEqual({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        toJSON: expect.any(Function),
      });
    });

    it("should include timestamp", () => {
      const beforeTime = performance.now();
      const result = createInitialEntry(true);
      const afterTime = performance.now();

      expect(result?.time).toBeGreaterThanOrEqual(beforeTime);
      expect(result?.time).toBeLessThanOrEqual(afterTime);
    });

    it("should include native entry reference", () => {
      const result = createInitialEntry(true);

      expect(result?.entry).toBeDefined();
      expect(result?.entry.isIntersecting).toBe(true);
      expect(result?.entry.intersectionRatio).toBe(1);
    });

    it("should handle null target", () => {
      const result = createInitialEntry(true, null);

      expect(result).not.toBeNull();
      expect(result?.isIntersecting).toBe(true);
    });
  });

  // ============ normalizeThreshold Tests ============
  describe("normalizeThreshold", () => {
    it("should return [0] for undefined", () => {
      expect(normalizeThreshold(undefined)).toEqual([0]);
    });

    it("should wrap single number in array", () => {
      expect(normalizeThreshold(0.5)).toEqual([0.5]);
    });

    it("should return array as-is", () => {
      expect(normalizeThreshold([0, 0.5, 1])).toEqual([0, 0.5, 1]);
    });

    it("should handle threshold of 0", () => {
      expect(normalizeThreshold(0)).toEqual([0]);
    });

    it("should handle threshold of 1", () => {
      expect(normalizeThreshold(1)).toEqual([1]);
    });

    it("should handle empty array", () => {
      expect(normalizeThreshold([])).toEqual([]);
    });

    it("should handle single-element array", () => {
      expect(normalizeThreshold([0.7])).toEqual([0.7]);
    });

    it("should handle multiple thresholds", () => {
      expect(normalizeThreshold([0, 0.25, 0.5, 0.75, 1])).toEqual([
        0, 0.25, 0.5, 0.75, 1,
      ]);
    });

    it("should handle decimal values", () => {
      expect(normalizeThreshold(0.123456)).toEqual([0.123456]);
    });

    it("should handle very small values", () => {
      expect(normalizeThreshold(0.001)).toEqual([0.001]);
    });
  });

  // ============ createNoopRef Tests ============
  describe("createNoopRef", () => {
    it("should return a function", () => {
      const ref = createNoopRef();
      expect(typeof ref).toBe("function");
    });

    it("should accept Element argument", () => {
      const ref = createNoopRef();
      const element = document.createElement("div");

      expect(() => ref(element)).not.toThrow();
    });

    it("should accept null argument", () => {
      const ref = createNoopRef();

      expect(() => ref(null)).not.toThrow();
    });

    it("should do nothing when called", () => {
      const ref = createNoopRef();
      const element = document.createElement("div");

      const result = ref(element);
      expect(result).toBeUndefined();
    });

    it("should return different function instances", () => {
      const ref1 = createNoopRef();
      const ref2 = createNoopRef();

      expect(ref1).not.toBe(ref2);
    });

    it("should be callable multiple times", () => {
      const ref = createNoopRef();
      const element = document.createElement("div");

      expect(() => {
        ref(element);
        ref(null);
        ref(element);
      }).not.toThrow();
    });
  });
});
