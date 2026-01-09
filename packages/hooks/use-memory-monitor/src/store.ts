import type { MemoryInfo, MemoryStoreState, Severity } from "./types";
import { SSR_INITIAL_STATE } from "./constants";
import { isServer } from "./utils/detection";

type Listener = () => void;

/**
 * Creates an external store for memory state management.
 * Compatible with useSyncExternalStore for React 18+ concurrent rendering.
 */
function createMemoryStore() {
  let state: MemoryStoreState = { ...SSR_INITIAL_STATE };
  const listeners = new Set<Listener>();

  /**
   * Subscribe to store updates
   */
  function subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  /**
   * Get current state snapshot
   */
  function getSnapshot(): MemoryStoreState {
    return state;
  }

  /**
   * Get SSR-safe server snapshot
   */
  function getServerSnapshot(): MemoryStoreState {
    return SSR_INITIAL_STATE;
  }

  /**
   * Notify all listeners of state change
   */
  function notify(): void {
    listeners.forEach((listener) => listener());
  }

  /**
   * Update memory info in store
   */
  function updateMemory(memory: MemoryInfo | null): void {
    if (state.memory === memory) return;

    state = {
      ...state,
      memory,
      lastUpdated: Date.now(),
    };
    notify();
  }

  /**
   * Update DOM node count
   */
  function updateDOMNodes(count: number | null): void {
    if (state.domNodes === count) return;

    state = {
      ...state,
      domNodes: count,
      lastUpdated: Date.now(),
    };
    notify();
  }

  /**
   * Update event listener count
   */
  function updateEventListeners(count: number | null): void {
    if (state.eventListeners === count) return;

    state = {
      ...state,
      eventListeners: count,
      lastUpdated: Date.now(),
    };
    notify();
  }

  /**
   * Update monitoring status
   */
  function updateMonitoringStatus(isMonitoring: boolean): void {
    if (state.isMonitoring === isMonitoring) return;

    state = {
      ...state,
      isMonitoring,
      lastUpdated: Date.now(),
    };
    notify();
  }

  /**
   * Update severity level
   */
  function updateSeverity(severity: Severity): void {
    if (state.severity === severity) return;

    state = {
      ...state,
      severity,
      lastUpdated: Date.now(),
    };
    notify();
  }

  /**
   * Batch update multiple state properties
   */
  function batchUpdate(updates: Partial<MemoryStoreState>): void {
    const newState = { ...state, ...updates, lastUpdated: Date.now() };

    // Check if anything actually changed
    const hasChanges = Object.keys(updates).some(
      (key) => state[key as keyof MemoryStoreState] !== updates[key as keyof MemoryStoreState]
    );

    if (!hasChanges) return;

    state = newState;
    notify();
  }

  /**
   * Reset store to initial state
   */
  function reset(): void {
    state = { ...SSR_INITIAL_STATE };
    notify();
  }

  /**
   * Get current subscriber count (for debugging)
   */
  function getSubscriberCount(): number {
    return listeners.size;
  }

  return {
    subscribe,
    getSnapshot,
    getServerSnapshot,
    updateMemory,
    updateDOMNodes,
    updateEventListeners,
    updateMonitoringStatus,
    updateSeverity,
    batchUpdate,
    reset,
    getSubscriberCount,
  };
}

// Export store type
export type MemoryStore = ReturnType<typeof createMemoryStore>;

/**
 * Creates a new memory store instance.
 * Each hook instance should create its own store to maintain isolation.
 */
export function createStore(): MemoryStore {
  return createMemoryStore();
}

/**
 * Creates an SSR-safe store that returns static values on the server.
 */
export function createSSRSafeStore(): MemoryStore {
  if (isServer()) {
    // Return a no-op store for SSR
    return {
      subscribe: () => () => {},
      getSnapshot: () => SSR_INITIAL_STATE,
      getServerSnapshot: () => SSR_INITIAL_STATE,
      updateMemory: () => {},
      updateDOMNodes: () => {},
      updateEventListeners: () => {},
      updateMonitoringStatus: () => {},
      updateSeverity: () => {},
      batchUpdate: () => {},
      reset: () => {},
      getSubscriberCount: () => 0,
    };
  }

  return createMemoryStore();
}

/**
 * Read current memory from performance.memory API
 */
export function readMemoryFromAPI(): MemoryInfo | null {
  if (isServer()) return null;

  const memory = (performance as { memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } }).memory;

  if (!memory) return null;

  return {
    heapUsed: Math.max(0, memory.usedJSHeapSize),
    heapTotal: Math.max(0, memory.totalJSHeapSize),
    heapLimit: Math.max(0, memory.jsHeapSizeLimit),
    timestamp: Date.now(),
  };
}

/**
 * Count DOM nodes in the document
 */
export function countDOMNodes(): number | null {
  if (isServer()) return null;

  try {
    return document.querySelectorAll("*").length;
  } catch {
    return null;
  }
}

/**
 * Estimate event listener count based on interactive elements.
 * This is an approximation since there's no direct API to count listeners.
 */
export function estimateEventListeners(): number | null {
  if (isServer()) return null;

  try {
    // Count elements that commonly have event listeners
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [onclick], [onchange], [onkeydown], [onkeyup], [onmouseover], [onmouseout], [onfocus], [onblur], [tabindex]'
    );

    // Rough estimate: each interactive element has ~1.5 listeners on average
    return Math.round(interactiveElements.length * 1.5);
  } catch {
    return null;
  }
}
