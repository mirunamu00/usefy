import { expect, afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

// ============ IntersectionObserver Mock ============
//
// useInfiniteScroll composes @usefy/use-intersection-observer, which uses the
// real IntersectionObserver. jsdom does not implement it, so we stub a minimal
// mock that records instances and lets tests drive intersection callbacks.

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

    mockObserverInstances.push(
      this as unknown as MockIntersectionObserverInstance
    );
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

// Helper to create a mock IntersectionObserverEntry
export function createMockEntry(
  target: Element,
  isIntersecting: boolean,
  options: { intersectionRatio?: number; time?: number } = {}
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
    boundingClientRect: defaultRect,
    intersectionRect: isIntersecting
      ? defaultRect
      : { ...defaultRect, width: 0, height: 0 },
    rootBounds: defaultRect,
    time: options.time ?? performance.now(),
  };
}

// Drive an intersection on the latest (or an indexed) observer instance
export function simulateIntersection(
  target: Element,
  isIntersecting: boolean,
  options: { intersectionRatio?: number; observerIndex?: number } = {}
): void {
  const observerIndex =
    options.observerIndex ?? mockObserverInstances.length - 1;
  const observer = mockObserverInstances[observerIndex];

  if (!observer) {
    throw new Error(`No observer found at index ${observerIndex}`);
  }

  const entry = createMockEntry(target, isIntersecting, {
    intersectionRatio: options.intersectionRatio,
  });

  observer.callback([entry], observer as unknown as IntersectionObserver);
}

export function getLatestObserver():
  | MockIntersectionObserverInstance
  | undefined {
  return mockObserverInstances[mockObserverInstances.length - 1];
}

export function clearObserverInstances(): void {
  mockObserverInstances.length = 0;
}

beforeEach(() => {
  clearObserverInstances();
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
});

afterEach(() => {
  clearObserverInstances();
  vi.unstubAllGlobals();
});
