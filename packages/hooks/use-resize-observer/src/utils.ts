import type { ResizeEntry, ResizeObserverBoxOptions } from "./types";

/**
 * Check if ResizeObserver API is supported in the current environment
 */
export function isResizeObserverSupported(): boolean {
  return typeof window !== "undefined" && "ResizeObserver" in window;
}

/**
 * Convert native ResizeObserverEntry to ResizeEntry
 */
export function toResizeEntry(nativeEntry: ResizeObserverEntry): ResizeEntry {
  return {
    entry: nativeEntry,
    target: nativeEntry.target,
    contentRect: nativeEntry.contentRect,
    borderBoxSize: nativeEntry.borderBoxSize || [],
    contentBoxSize: nativeEntry.contentBoxSize || [],
    devicePixelContentBoxSize: nativeEntry.devicePixelContentBoxSize,
  };
}

/**
 * Extract width and height based on box option
 */
export function extractSize(
  entry: ResizeObserverEntry,
  box: ResizeObserverBoxOptions,
  round: (value: number) => number = Math.round
): { width: number; height: number } {
  let width = 0;
  let height = 0;

  switch (box) {
    case "border-box":
      if (entry.borderBoxSize?.[0]) {
        width = entry.borderBoxSize[0].inlineSize;
        height = entry.borderBoxSize[0].blockSize;
      } else {
        // Fallback to contentRect + estimate
        width = entry.contentRect.width;
        height = entry.contentRect.height;
      }
      break;

    case "device-pixel-content-box":
      if (entry.devicePixelContentBoxSize?.[0]) {
        width = entry.devicePixelContentBoxSize[0].inlineSize;
        height = entry.devicePixelContentBoxSize[0].blockSize;
      } else {
        // Fallback to content-box with device pixel ratio
        const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;
        if (entry.contentBoxSize?.[0]) {
          width = entry.contentBoxSize[0].inlineSize * dpr;
          height = entry.contentBoxSize[0].blockSize * dpr;
        } else {
          width = entry.contentRect.width * dpr;
          height = entry.contentRect.height * dpr;
        }
      }
      break;

    case "content-box":
    default:
      if (entry.contentBoxSize?.[0]) {
        width = entry.contentBoxSize[0].inlineSize;
        height = entry.contentBoxSize[0].blockSize;
      } else {
        // Fallback to contentRect
        width = entry.contentRect.width;
        height = entry.contentRect.height;
      }
      break;
  }

  return {
    width: round(width),
    height: round(height),
  };
}

/**
 * Create initial ResizeEntry for SSR or initial state
 */
export function createInitialResizeEntry(
  width?: number,
  height?: number
): ResizeEntry | undefined {
  if (width === undefined && height === undefined) {
    return undefined;
  }

  const w = width ?? 0;
  const h = height ?? 0;

  const emptyRect: DOMRectReadOnly = {
    x: 0,
    y: 0,
    width: w,
    height: h,
    top: 0,
    right: w,
    bottom: h,
    left: 0,
    toJSON: () => ({
      x: 0,
      y: 0,
      width: w,
      height: h,
      top: 0,
      right: w,
      bottom: h,
      left: 0,
    }),
  };

  const emptySize: ResizeObserverSize = {
    inlineSize: w,
    blockSize: h,
  };

  // Create a mock entry for SSR
  const mockNativeEntry = {
    target: null as unknown as Element,
    contentRect: emptyRect,
    borderBoxSize: [emptySize],
    contentBoxSize: [emptySize],
    devicePixelContentBoxSize: [] as ResizeObserverSize[],
  } as unknown as ResizeObserverEntry;

  return {
    entry: mockNativeEntry,
    target: null as unknown as Element,
    contentRect: emptyRect,
    borderBoxSize: [emptySize],
    contentBoxSize: [emptySize],
    devicePixelContentBoxSize: undefined,
  };
}

/**
 * Create a no-op ref callback for SSR
 */
export function createNoopRef<T extends Element>(): (element: T | null) => void {
  return () => {
    // No-op for SSR
  };
}

/**
 * Check if the `device-pixel-content-box` observation mode is supported.
 *
 * Browsers that don't implement this box mode throw synchronously when it's
 * passed to `observe()`, so a non-throwing `observe` is the accepted synchronous
 * capability probe. (The old approach read a flag set inside the observer
 * callback, which fires asynchronously — so it could never return `true`.)
 */
export function isDevicePixelContentBoxSupported(): boolean {
  if (!isResizeObserverSupported()) {
    return false;
  }

  try {
    const observer = new ResizeObserver(() => {});
    const testDiv = document.createElement("div");
    observer.observe(testDiv, { box: "device-pixel-content-box" });
    observer.disconnect();
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate options - warn if both debounce and throttle are set
 */
export function validateOptions(
  debounce?: number,
  throttle?: number
): void {
  if (
    debounce !== undefined &&
    debounce > 0 &&
    throttle !== undefined &&
    throttle > 0
  ) {
    if (typeof window !== "undefined") {
      console.warn(
        "[useResizeObserver] debounce and throttle cannot be used together. Using debounce."
      );
    }
  }
}

/**
 * Check if size has changed
 */
export function hasSizeChanged(
  prevWidth: number | undefined,
  prevHeight: number | undefined,
  newWidth: number,
  newHeight: number
): boolean {
  return prevWidth !== newWidth || prevHeight !== newHeight;
}
