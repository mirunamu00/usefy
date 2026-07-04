import { expect, afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

// ============ MutationObserver Mock Types ============

export interface MockMutationObserverInstance {
  callback: MutationCallback;
  observedElements: Map<Node, MutationObserverInit>;
  queue: MutationRecord[];
  observe: (target: Node, options?: MutationObserverInit) => void;
  disconnect: () => void;
  takeRecords: () => MutationRecord[];
}

// Store every observer instance so tests can drive them.
export const mockObserverInstances: MockMutationObserverInstance[] = [];

// ============ Mock MutationObserver Class ============

class MockMutationObserver implements MutationObserver {
  private readonly _callback: MutationCallback;
  readonly observedElements: Map<Node, MutationObserverInit> = new Map();
  queue: MutationRecord[] = [];

  constructor(callback: MutationCallback) {
    this._callback = callback;
    mockObserverInstances.push(this as unknown as MockMutationObserverInstance);
  }

  get callback(): MutationCallback {
    return this._callback;
  }

  observe(target: Node, options?: MutationObserverInit): void {
    this.observedElements.set(target, options ?? {});
  }

  disconnect(): void {
    this.observedElements.clear();
    this.queue = [];
  }

  takeRecords(): MutationRecord[] {
    const records = this.queue;
    this.queue = [];
    return records;
  }
}

// ============ Mock Record Helpers ============

/**
 * Create a mock MutationRecord for testing.
 */
export function createMockMutationRecord(
  target: Node,
  overrides: Partial<MutationRecord> = {}
): MutationRecord {
  return {
    type: "childList",
    target,
    addedNodes: [] as unknown as NodeList,
    removedNodes: [] as unknown as NodeList,
    previousSibling: null,
    nextSibling: null,
    attributeName: null,
    attributeNamespace: null,
    oldValue: null,
    ...overrides,
  } as MutationRecord;
}

/**
 * Simulate a mutation firing on the observer that is observing `target`.
 */
export function simulateMutation(
  target: Node,
  records?: MutationRecord[],
  observerIndex?: number
): void {
  const idx = observerIndex ?? mockObserverInstances.length - 1;
  const observer = mockObserverInstances[idx];

  if (!observer) {
    throw new Error(`No observer found at index ${idx}`);
  }

  const mutationRecords = records ?? [createMockMutationRecord(target)];
  observer.callback(mutationRecords, observer as unknown as MutationObserver);
}

/**
 * Get the most recently created observer.
 */
export function getLatestObserver(): MockMutationObserverInstance | undefined {
  return mockObserverInstances[mockObserverInstances.length - 1];
}

/**
 * Clear all recorded observer instances.
 */
export function clearObserverInstances(): void {
  mockObserverInstances.length = 0;
}

/**
 * Check whether an element is currently observed by any (or a specific) observer.
 */
export function isElementObserved(
  element: Node,
  observerIndex?: number
): boolean {
  if (observerIndex !== undefined) {
    const observer = mockObserverInstances[observerIndex];
    return observer?.observedElements.has(element) ?? false;
  }

  return mockObserverInstances.some((observer) =>
    observer.observedElements.has(element)
  );
}

/**
 * Get the options an element was observed with.
 */
export function getObserveOptions(
  element: Node,
  observerIndex?: number
): MutationObserverInit | undefined {
  const idx = observerIndex ?? mockObserverInstances.length - 1;
  const observer = mockObserverInstances[idx];
  return observer?.observedElements.get(element);
}

// ============ Setup and Teardown ============

beforeEach(() => {
  clearObserverInstances();
  vi.stubGlobal("MutationObserver", MockMutationObserver);
});

afterEach(() => {
  clearObserverInstances();
  vi.unstubAllGlobals();
});
