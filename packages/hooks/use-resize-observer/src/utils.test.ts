import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isResizeObserverSupported,
  isDevicePixelContentBoxSupported,
  toResizeEntry,
  extractSize,
  createInitialResizeEntry,
  createNoopRef,
  validateOptions,
  hasSizeChanged,
} from "./utils";
import { createMockResizeEntry } from "../vitest.setup";

describe("utils", () => {
  // ============ isResizeObserverSupported ============
  describe("isResizeObserverSupported", () => {
    it("should return true when ResizeObserver is available", () => {
      expect(isResizeObserverSupported()).toBe(true);
    });

    it("should return false when window is undefined (SSR)", () => {
      const originalWindow = globalThis.window;
      // @ts-expect-error - intentionally removing window for SSR test
      delete globalThis.window;

      const result = isResizeObserverSupported();

      globalThis.window = originalWindow;
      expect(result).toBe(false);
    });

    it("should return false when ResizeObserver is not in window", () => {
      const originalRO = window.ResizeObserver;
      // @ts-expect-error - intentionally removing ResizeObserver
      delete window.ResizeObserver;

      const result = isResizeObserverSupported();

      window.ResizeObserver = originalRO;
      expect(result).toBe(false);
    });
  });

  // ============ toResizeEntry ============
  describe("toResizeEntry", () => {
    let targetElement: HTMLDivElement;

    beforeEach(() => {
      targetElement = document.createElement("div");
    });

    it("should convert native entry to ResizeEntry", () => {
      const nativeEntry = createMockResizeEntry(targetElement, {
        width: 200,
        height: 150,
      });

      const result = toResizeEntry(nativeEntry);

      expect(result.entry).toBe(nativeEntry);
      expect(result.target).toBe(targetElement);
      expect(result.contentRect.width).toBe(200);
      expect(result.contentRect.height).toBe(150);
    });

    it("should handle missing borderBoxSize", () => {
      const nativeEntry = {
        target: targetElement,
        contentRect: {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          top: 0,
          right: 100,
          bottom: 100,
          left: 0,
          toJSON: () => ({}),
        },
        borderBoxSize: undefined,
        contentBoxSize: [{ inlineSize: 100, blockSize: 100 }],
        devicePixelContentBoxSize: undefined,
      } as unknown as ResizeObserverEntry;

      const result = toResizeEntry(nativeEntry);

      expect(result.borderBoxSize).toEqual([]);
    });

    it("should handle missing contentBoxSize", () => {
      const nativeEntry = {
        target: targetElement,
        contentRect: {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          top: 0,
          right: 100,
          bottom: 100,
          left: 0,
          toJSON: () => ({}),
        },
        borderBoxSize: [{ inlineSize: 100, blockSize: 100 }],
        contentBoxSize: undefined,
        devicePixelContentBoxSize: undefined,
      } as unknown as ResizeObserverEntry;

      const result = toResizeEntry(nativeEntry);

      expect(result.contentBoxSize).toEqual([]);
    });

    it("should preserve devicePixelContentBoxSize when present", () => {
      const nativeEntry = createMockResizeEntry(targetElement, {
        width: 100,
        height: 100,
        devicePixelWidth: 200,
        devicePixelHeight: 200,
      });

      const result = toResizeEntry(nativeEntry);

      expect(result.devicePixelContentBoxSize?.[0].inlineSize).toBe(200);
      expect(result.devicePixelContentBoxSize?.[0].blockSize).toBe(200);
    });
  });

  // ============ extractSize ============
  describe("extractSize", () => {
    let targetElement: HTMLDivElement;

    beforeEach(() => {
      targetElement = document.createElement("div");
    });

    it("should extract content-box size by default", () => {
      const entry = createMockResizeEntry(targetElement, {
        width: 100,
        height: 80,
      });

      const result = extractSize(entry, "content-box");

      expect(result.width).toBe(100);
      expect(result.height).toBe(80);
    });

    it("should extract border-box size", () => {
      const entry = createMockResizeEntry(targetElement, {
        width: 100,
        height: 80,
        borderBoxWidth: 120,
        borderBoxHeight: 100,
      });

      const result = extractSize(entry, "border-box");

      expect(result.width).toBe(120);
      expect(result.height).toBe(100);
    });

    it("should extract device-pixel-content-box size", () => {
      const entry = createMockResizeEntry(targetElement, {
        width: 100,
        height: 80,
        devicePixelWidth: 200,
        devicePixelHeight: 160,
      });

      const result = extractSize(entry, "device-pixel-content-box");

      expect(result.width).toBe(200);
      expect(result.height).toBe(160);
    });

    it("should apply custom round function", () => {
      const entry = createMockResizeEntry(targetElement, {
        width: 100,
        height: 80,
      });
      // Mock contentBoxSize with decimal values
      (entry as any).contentBoxSize = [
        { inlineSize: 100.7, blockSize: 80.3 },
      ];

      const resultRound = extractSize(entry, "content-box", Math.round);
      expect(resultRound.width).toBe(101);
      expect(resultRound.height).toBe(80);

      const resultFloor = extractSize(entry, "content-box", Math.floor);
      expect(resultFloor.width).toBe(100);
      expect(resultFloor.height).toBe(80);

      const resultCeil = extractSize(entry, "content-box", Math.ceil);
      expect(resultCeil.width).toBe(101);
      expect(resultCeil.height).toBe(81);
    });

    it("should fallback to contentRect for content-box when contentBoxSize is missing", () => {
      const entry = {
        target: targetElement,
        contentRect: {
          x: 0,
          y: 0,
          width: 100,
          height: 80,
          top: 0,
          right: 100,
          bottom: 80,
          left: 0,
          toJSON: () => ({}),
        },
        borderBoxSize: [],
        contentBoxSize: [],
        devicePixelContentBoxSize: undefined,
      } as unknown as ResizeObserverEntry;

      const result = extractSize(entry, "content-box");

      expect(result.width).toBe(100);
      expect(result.height).toBe(80);
    });

    it("should fallback to contentRect for border-box when borderBoxSize is missing", () => {
      const entry = {
        target: targetElement,
        contentRect: {
          x: 0,
          y: 0,
          width: 100,
          height: 80,
          top: 0,
          right: 100,
          bottom: 80,
          left: 0,
          toJSON: () => ({}),
        },
        borderBoxSize: [],
        contentBoxSize: [],
        devicePixelContentBoxSize: undefined,
      } as unknown as ResizeObserverEntry;

      const result = extractSize(entry, "border-box");

      expect(result.width).toBe(100);
      expect(result.height).toBe(80);
    });
  });

  // ============ createInitialResizeEntry ============
  describe("createInitialResizeEntry", () => {
    it("should return undefined when no dimensions provided", () => {
      const result = createInitialResizeEntry();
      expect(result).toBeUndefined();
    });

    it("should return undefined when both dimensions are undefined", () => {
      const result = createInitialResizeEntry(undefined, undefined);
      expect(result).toBeUndefined();
    });

    it("should create entry with specified width", () => {
      const result = createInitialResizeEntry(200, undefined);

      expect(result).toBeDefined();
      expect(result?.contentRect.width).toBe(200);
      expect(result?.contentRect.height).toBe(0);
    });

    it("should create entry with specified height", () => {
      const result = createInitialResizeEntry(undefined, 150);

      expect(result).toBeDefined();
      expect(result?.contentRect.width).toBe(0);
      expect(result?.contentRect.height).toBe(150);
    });

    it("should create entry with both dimensions", () => {
      const result = createInitialResizeEntry(200, 150);

      expect(result).toBeDefined();
      expect(result?.contentRect.width).toBe(200);
      expect(result?.contentRect.height).toBe(150);
      expect(result?.borderBoxSize[0].inlineSize).toBe(200);
      expect(result?.borderBoxSize[0].blockSize).toBe(150);
      expect(result?.contentBoxSize[0].inlineSize).toBe(200);
      expect(result?.contentBoxSize[0].blockSize).toBe(150);
    });

    it("should create valid DOMRectReadOnly structure", () => {
      const result = createInitialResizeEntry(100, 50);

      expect(result?.contentRect.x).toBe(0);
      expect(result?.contentRect.y).toBe(0);
      expect(result?.contentRect.top).toBe(0);
      expect(result?.contentRect.left).toBe(0);
      expect(result?.contentRect.right).toBe(100);
      expect(result?.contentRect.bottom).toBe(50);
      expect(typeof result?.contentRect.toJSON).toBe("function");
    });
  });

  // ============ createNoopRef ============
  describe("createNoopRef", () => {
    it("should return a function", () => {
      const ref = createNoopRef();
      expect(typeof ref).toBe("function");
    });

    it("should accept element argument without error", () => {
      const ref = createNoopRef<HTMLDivElement>();
      const div = document.createElement("div");

      expect(() => ref(div)).not.toThrow();
    });

    it("should accept null argument without error", () => {
      const ref = createNoopRef<HTMLDivElement>();

      expect(() => ref(null)).not.toThrow();
    });
  });

  // ============ validateOptions ============
  describe("validateOptions", () => {
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it("should warn when both debounce and throttle are set", () => {
      validateOptions(100, 200);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("debounce and throttle cannot be used together")
      );
    });

    it("should not warn when only debounce is set", () => {
      validateOptions(100, undefined);

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it("should not warn when only throttle is set", () => {
      validateOptions(undefined, 200);

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it("should not warn when neither is set", () => {
      validateOptions(undefined, undefined);

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it("should not warn when debounce is 0", () => {
      validateOptions(0, 200);

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it("should not warn when throttle is 0", () => {
      validateOptions(100, 0);

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  // ============ hasSizeChanged ============
  describe("hasSizeChanged", () => {
    it("should return false when sizes are the same", () => {
      expect(hasSizeChanged(100, 80, 100, 80)).toBe(false);
    });

    it("should return true when width changed", () => {
      expect(hasSizeChanged(100, 80, 150, 80)).toBe(true);
    });

    it("should return true when height changed", () => {
      expect(hasSizeChanged(100, 80, 100, 120)).toBe(true);
    });

    it("should return true when both changed", () => {
      expect(hasSizeChanged(100, 80, 150, 120)).toBe(true);
    });

    it("should return true when previous width is undefined", () => {
      expect(hasSizeChanged(undefined, 80, 100, 80)).toBe(true);
    });

    it("should return true when previous height is undefined", () => {
      expect(hasSizeChanged(100, undefined, 100, 80)).toBe(true);
    });

    it("should return true when both previous values are undefined", () => {
      expect(hasSizeChanged(undefined, undefined, 100, 80)).toBe(true);
    });
  });

  // ============ isDevicePixelContentBoxSupported ============
  describe("isDevicePixelContentBoxSupported", () => {
    it("should return true when observe accepts the device-pixel-content-box mode", () => {
      // Regression: the previous implementation read a flag set inside the
      // observer callback (which fires asynchronously) and could therefore
      // never return true. The synchronous probe returns true when observe
      // does not throw.
      expect(isDevicePixelContentBoxSupported()).toBe(true);
    });

    it("should return false when ResizeObserver is unavailable", () => {
      const originalRO = window.ResizeObserver;
      // @ts-expect-error - intentionally removing ResizeObserver
      delete window.ResizeObserver;

      const result = isDevicePixelContentBoxSupported();

      window.ResizeObserver = originalRO;
      expect(result).toBe(false);
    });

    it("should return false when observe throws for the box mode", () => {
      const originalRO = window.ResizeObserver;

      class ThrowingResizeObserver {
        constructor(_cb: ResizeObserverCallback) {}
        observe(): void {
          throw new TypeError("device-pixel-content-box not supported");
        }
        unobserve(): void {}
        disconnect(): void {}
      }

      vi.stubGlobal("ResizeObserver", ThrowingResizeObserver);

      const result = isDevicePixelContentBoxSupported();

      vi.stubGlobal("ResizeObserver", originalRO);
      expect(result).toBe(false);
    });
  });
});
