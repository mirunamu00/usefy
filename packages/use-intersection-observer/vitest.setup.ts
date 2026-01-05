import { expect, afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

// ============ IntersectionObserver Mock ============

export type MockIntersectionObserverCallback = (
  entries: IntersectionObserverEntry[]
) => void;

export interface MockIntersectionObserverInstance {
  root: Element | Document | null;
  rootMargin: string;
  thresholds: ReadonlyArray<number>;
  observedElements: Set<Element>;
  callback: IntersectionObserverCallback;
  observe: (target: Element) => void;
  unobserve: (target: Element) => void;
  disconnect: () => void;
  takeRecords: () => IntersectionObserverEntry[];
}

// Store all observer instances for test access
export const mockObserverInstances: MockIntersectionObserverInstance[] = [];

// Create mock IntersectionObserver class
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;
  readonly observedElements: Set<Element> = new Set();
  private readonly _callback: IntersectionObserverCallback;

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ) {
    this._callback = callback;
    this.root = options?.root ?? null;
    this.rootMargin = options?.rootMargin ?? "0px";
    this.thresholds = Array.isArray(options?.threshold)
      ? options.threshold
      : [options?.threshold ?? 0];

    // Store instance for test access
    mockObserverInstances.push(this as unknown as MockIntersectionObserverInstance);
  }

  get callback(): IntersectionObserverCallback {
    return this._callback;
  }

  observe(target: Element): void {
    this.observedElements.add(target);
  }

  unobserve(target: Element): void {
    this.observedElements.delete(target);
  }

  disconnect(): void {
    this.observedElements.clear();
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

// Helper to create mock IntersectionObserverEntry
export function createMockEntry(
  target: Element,
  isIntersecting: boolean,
  options: {
    intersectionRatio?: number;
    boundingClientRect?: DOMRectReadOnly;
    intersectionRect?: DOMRectReadOnly;
    rootBounds?: DOMRectReadOnly | null;
    time?: number;
  } = {}
): IntersectionObserverEntry {
  const defaultRect: DOMRectReadOnly = {
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

  return {
    target,
    isIntersecting,
    intersectionRatio: options.intersectionRatio ?? (isIntersecting ? 1 : 0),
    boundingClientRect: options.boundingClientRect ?? defaultRect,
    intersectionRect: options.intersectionRect ?? (isIntersecting ? defaultRect : { ...defaultRect, width: 0, height: 0 }),
    rootBounds: options.rootBounds ?? defaultRect,
    time: options.time ?? performance.now(),
  };
}

// Helper to simulate intersection
export function simulateIntersection(
  target: Element,
  isIntersecting: boolean,
  options: {
    intersectionRatio?: number;
    observerIndex?: number;
  } = {}
): void {
  const observerIndex = options.observerIndex ?? mockObserverInstances.length - 1;
  const observer = mockObserverInstances[observerIndex];

  if (!observer) {
    throw new Error(`No observer found at index ${observerIndex}`);
  }

  const entry = createMockEntry(target, isIntersecting, {
    intersectionRatio: options.intersectionRatio,
  });

  observer.callback([entry], observer as unknown as IntersectionObserver);
}

// Helper to simulate multiple intersections
export function simulateMultipleIntersections(
  entries: Array<{
    target: Element;
    isIntersecting: boolean;
    intersectionRatio?: number;
  }>,
  observerIndex?: number
): void {
  const index = observerIndex ?? mockObserverInstances.length - 1;
  const observer = mockObserverInstances[index];

  if (!observer) {
    throw new Error(`No observer found at index ${index}`);
  }

  const mockEntries = entries.map(({ target, isIntersecting, intersectionRatio }) =>
    createMockEntry(target, isIntersecting, { intersectionRatio })
  );

  observer.callback(mockEntries, observer as unknown as IntersectionObserver);
}

// Get the last created observer
export function getLatestObserver(): MockIntersectionObserverInstance | undefined {
  return mockObserverInstances[mockObserverInstances.length - 1];
}

// Clear all observer instances
export function clearObserverInstances(): void {
  mockObserverInstances.length = 0;
}

// Mock IntersectionObserverEntry with intersectionRatio property on prototype
class MockIntersectionObserverEntry {
  readonly target: Element;
  readonly isIntersecting: boolean;
  readonly intersectionRatio: number;
  readonly boundingClientRect: DOMRectReadOnly;
  readonly intersectionRect: DOMRectReadOnly;
  readonly rootBounds: DOMRectReadOnly | null;
  readonly time: number;

  constructor() {
    const defaultRect: DOMRectReadOnly = {
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

    this.target = document.createElement("div");
    this.isIntersecting = false;
    this.intersectionRatio = 0;
    this.boundingClientRect = defaultRect;
    this.intersectionRect = defaultRect;
    this.rootBounds = defaultRect;
    this.time = performance.now();
  }
}

// Setup and teardown
beforeEach(() => {
  clearObserverInstances();
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  vi.stubGlobal("IntersectionObserverEntry", MockIntersectionObserverEntry);
});

afterEach(() => {
  clearObserverInstances();
  vi.unstubAllGlobals();
});
