import type { IntersectionEntry } from "./types";

/**
 * Check if IntersectionObserver API is supported in the current environment
 * Returns false in SSR environments or browsers without support
 */
export function isIntersectionObserverSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "IntersectionObserver" in window
  );
}

/**
 * Convert a native IntersectionObserverEntry to our IntersectionEntry type
 * Provides a consistent interface with additional convenience properties
 *
 * @param nativeEntry - The native IntersectionObserverEntry from the browser
 * @returns IntersectionEntry with all properties
 */
export function toIntersectionEntry(
  nativeEntry: IntersectionObserverEntry
): IntersectionEntry {
  return {
    entry: nativeEntry,
    isIntersecting: nativeEntry.isIntersecting,
    intersectionRatio: nativeEntry.intersectionRatio,
    target: nativeEntry.target,
    boundingClientRect: nativeEntry.boundingClientRect,
    intersectionRect: nativeEntry.intersectionRect,
    rootBounds: nativeEntry.rootBounds,
    time: nativeEntry.time,
  };
}

/**
 * Create an initial IntersectionEntry for SSR or before first observation
 * Used when initialIsIntersecting is true
 *
 * @param isIntersecting - Whether to set initial state as intersecting
 * @param target - Optional target element (null for SSR)
 * @returns A mock IntersectionEntry
 */
export function createInitialEntry(
  isIntersecting: boolean,
  target: Element | null = null
): IntersectionEntry | null {
  if (!isIntersecting) {
    return null;
  }

  // Create a placeholder DOMRect for SSR
  const emptyRect: DOMRectReadOnly = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    toJSON: () => ({}),
  };

  // Create a mock native entry
  const mockNativeEntry = {
    target: target as Element,
    isIntersecting,
    intersectionRatio: isIntersecting ? 1 : 0,
    boundingClientRect: emptyRect,
    intersectionRect: emptyRect,
    rootBounds: null,
    time: typeof performance !== "undefined" ? performance.now() : Date.now(),
  } as IntersectionObserverEntry;

  return {
    entry: mockNativeEntry,
    isIntersecting,
    intersectionRatio: isIntersecting ? 1 : 0,
    target: target as Element,
    boundingClientRect: emptyRect,
    intersectionRect: emptyRect,
    rootBounds: null,
    time: mockNativeEntry.time,
  };
}

/**
 * Normalize threshold to always be an array
 * Handles both single number and array inputs
 *
 * @param threshold - Single threshold or array of thresholds
 * @returns Array of threshold values
 */
export function normalizeThreshold(
  threshold: number | number[] | undefined
): number[] {
  if (threshold === undefined) {
    return [0];
  }
  if (Array.isArray(threshold)) {
    return threshold;
  }
  return [threshold];
}

/**
 * Deep compare two IntersectionObserverInit options objects
 * Used to determine if observer needs to be recreated
 *
 * @param a - First options object
 * @param b - Second options object
 * @returns true if options are equal
 */
export function areOptionsEqual(
  a: IntersectionObserverInit,
  b: IntersectionObserverInit
): boolean {
  // Compare root
  if (a.root !== b.root) {
    return false;
  }

  // Compare rootMargin
  if (a.rootMargin !== b.rootMargin) {
    return false;
  }

  // Compare threshold (normalize to arrays for comparison)
  const thresholdA = normalizeThreshold(a.threshold);
  const thresholdB = normalizeThreshold(b.threshold);

  if (thresholdA.length !== thresholdB.length) {
    return false;
  }

  for (let i = 0; i < thresholdA.length; i++) {
    if (thresholdA[i] !== thresholdB[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Create a no-op ref callback for SSR environments
 * Returns a function that does nothing when called
 */
export function createNoopRef(): (node: Element | null) => void {
  return () => {
    // No-op for SSR
  };
}

/**
 * Validate rootMargin string format
 * rootMargin follows CSS margin syntax: "10px", "10px 20px", "10px 20px 30px 40px"
 *
 * @param rootMargin - The rootMargin string to validate
 * @returns true if valid format
 */
export function isValidRootMargin(rootMargin: string): boolean {
  // Basic validation - rootMargin should contain px or %
  // Browser will handle more detailed validation
  const pattern = /^(-?\d+(\.\d+)?(px|%)?\s*){1,4}$/;
  return pattern.test(rootMargin.trim());
}
