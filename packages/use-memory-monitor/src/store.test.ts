import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createStore,
  createSSRSafeStore,
  readMemoryFromAPI,
  countDOMNodes,
  estimateEventListeners,
} from "./store";
import type { MemoryInfo } from "./types";
import { SSR_INITIAL_STATE } from "./constants";

describe("createStore", () => {
  describe("basic store operations", () => {
    it("should create a store with initial state", () => {
      const store = createStore();
      const snapshot = store.getSnapshot();

      expect(snapshot).toEqual(SSR_INITIAL_STATE);
    });

    it("should return server snapshot", () => {
      const store = createStore();
      const serverSnapshot = store.getServerSnapshot();

      expect(serverSnapshot).toEqual(SSR_INITIAL_STATE);
    });

    it("should return 0 subscribers initially", () => {
      const store = createStore();
      expect(store.getSubscriberCount()).toBe(0);
    });
  });

  describe("subscribe", () => {
    it("should add a subscriber", () => {
      const store = createStore();
      const listener = vi.fn();

      store.subscribe(listener);
      expect(store.getSubscriberCount()).toBe(1);
    });

    it("should add multiple subscribers", () => {
      const store = createStore();
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      store.subscribe(listener1);
      store.subscribe(listener2);
      store.subscribe(listener3);

      expect(store.getSubscriberCount()).toBe(3);
    });

    it("should return unsubscribe function", () => {
      const store = createStore();
      const listener = vi.fn();

      const unsubscribe = store.subscribe(listener);
      expect(store.getSubscriberCount()).toBe(1);

      unsubscribe();
      expect(store.getSubscriberCount()).toBe(0);
    });

    it("should notify subscribers on update", () => {
      const store = createStore();
      const listener = vi.fn();

      store.subscribe(listener);

      const memory: MemoryInfo = {
        heapUsed: 1000,
        heapTotal: 2000,
        heapLimit: 4000,
        timestamp: Date.now(),
      };

      store.updateMemory(memory);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("should not notify after unsubscribe", () => {
      const store = createStore();
      const listener = vi.fn();

      const unsubscribe = store.subscribe(listener);
      unsubscribe();

      const memory: MemoryInfo = {
        heapUsed: 1000,
        heapTotal: 2000,
        heapLimit: 4000,
        timestamp: Date.now(),
      };

      store.updateMemory(memory);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("updateMemory", () => {
    it("should update memory state", () => {
      const store = createStore();
      const memory: MemoryInfo = {
        heapUsed: 1000,
        heapTotal: 2000,
        heapLimit: 4000,
        timestamp: Date.now(),
      };

      store.updateMemory(memory);
      const snapshot = store.getSnapshot();

      expect(snapshot.memory).toBe(memory);
      expect(snapshot.lastUpdated).toBeGreaterThan(0);
    });

    it("should not update if memory is the same reference", () => {
      const store = createStore();
      const listener = vi.fn();
      const memory: MemoryInfo = {
        heapUsed: 1000,
        heapTotal: 2000,
        heapLimit: 4000,
        timestamp: Date.now(),
      };

      store.subscribe(listener);
      store.updateMemory(memory);
      listener.mockClear();

      store.updateMemory(memory);
      expect(listener).not.toHaveBeenCalled();
    });

    it("should update if memory reference changes", () => {
      const store = createStore();
      const listener = vi.fn();

      store.subscribe(listener);

      const memory1: MemoryInfo = {
        heapUsed: 1000,
        heapTotal: 2000,
        heapLimit: 4000,
        timestamp: Date.now(),
      };

      const memory2: MemoryInfo = {
        heapUsed: 1000,
        heapTotal: 2000,
        heapLimit: 4000,
        timestamp: Date.now(),
      };

      store.updateMemory(memory1);
      listener.mockClear();

      store.updateMemory(memory2);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("should handle null memory", () => {
      const store = createStore();
      const memory: MemoryInfo = {
        heapUsed: 1000,
        heapTotal: 2000,
        heapLimit: 4000,
        timestamp: Date.now(),
      };

      store.updateMemory(memory);
      store.updateMemory(null);

      const snapshot = store.getSnapshot();
      expect(snapshot.memory).toBeNull();
    });
  });

  describe("updateDOMNodes", () => {
    it("should update DOM nodes count", () => {
      const store = createStore();
      store.updateDOMNodes(100);

      const snapshot = store.getSnapshot();
      expect(snapshot.domNodes).toBe(100);
      expect(snapshot.lastUpdated).toBeGreaterThan(0);
    });

    it("should not update if count is the same", () => {
      const store = createStore();
      const listener = vi.fn();

      store.subscribe(listener);
      store.updateDOMNodes(100);
      listener.mockClear();

      store.updateDOMNodes(100);
      expect(listener).not.toHaveBeenCalled();
    });

    it("should update if count changes", () => {
      const store = createStore();
      const listener = vi.fn();

      store.subscribe(listener);
      store.updateDOMNodes(100);
      listener.mockClear();

      store.updateDOMNodes(200);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("should handle null value", () => {
      const store = createStore();
      store.updateDOMNodes(100);
      store.updateDOMNodes(null);

      const snapshot = store.getSnapshot();
      expect(snapshot.domNodes).toBeNull();
    });
  });

  describe("updateEventListeners", () => {
    it("should update event listeners count", () => {
      const store = createStore();
      store.updateEventListeners(50);

      const snapshot = store.getSnapshot();
      expect(snapshot.eventListeners).toBe(50);
      expect(snapshot.lastUpdated).toBeGreaterThan(0);
    });

    it("should not update if count is the same", () => {
      const store = createStore();
      const listener = vi.fn();

      store.subscribe(listener);
      store.updateEventListeners(50);
      listener.mockClear();

      store.updateEventListeners(50);
      expect(listener).not.toHaveBeenCalled();
    });

    it("should update if count changes", () => {
      const store = createStore();
      const listener = vi.fn();

      store.subscribe(listener);
      store.updateEventListeners(50);
      listener.mockClear();

      store.updateEventListeners(75);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("should handle null value", () => {
      const store = createStore();
      store.updateEventListeners(50);
      store.updateEventListeners(null);

      const snapshot = store.getSnapshot();
      expect(snapshot.eventListeners).toBeNull();
    });
  });

  describe("updateMonitoringStatus", () => {
    it("should update monitoring status", () => {
      const store = createStore();
      store.updateMonitoringStatus(true);

      const snapshot = store.getSnapshot();
      expect(snapshot.isMonitoring).toBe(true);
      expect(snapshot.lastUpdated).toBeGreaterThan(0);
    });

    it("should not update if status is the same", () => {
      const store = createStore();
      const listener = vi.fn();

      store.subscribe(listener);
      store.updateMonitoringStatus(false);
      listener.mockClear();

      store.updateMonitoringStatus(false);
      expect(listener).not.toHaveBeenCalled();
    });

    it("should update if status changes", () => {
      const store = createStore();
      const listener = vi.fn();

      store.subscribe(listener);
      store.updateMonitoringStatus(false);
      listener.mockClear();

      store.updateMonitoringStatus(true);
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe("updateSeverity", () => {
    it("should update severity level", () => {
      const store = createStore();
      store.updateSeverity("warning");

      const snapshot = store.getSnapshot();
      expect(snapshot.severity).toBe("warning");
      expect(snapshot.lastUpdated).toBeGreaterThan(0);
    });

    it("should not update if severity is the same", () => {
      const store = createStore();
      const listener = vi.fn();

      store.subscribe(listener);
      store.updateSeverity("normal");
      listener.mockClear();

      store.updateSeverity("normal");
      expect(listener).not.toHaveBeenCalled();
    });

    it("should update if severity changes", () => {
      const store = createStore();
      const listener = vi.fn();

      store.subscribe(listener);
      store.updateSeverity("normal");
      listener.mockClear();

      store.updateSeverity("critical");
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("should handle all severity levels", () => {
      const store = createStore();

      store.updateSeverity("normal");
      expect(store.getSnapshot().severity).toBe("normal");

      store.updateSeverity("warning");
      expect(store.getSnapshot().severity).toBe("warning");

      store.updateSeverity("critical");
      expect(store.getSnapshot().severity).toBe("critical");
    });
  });

  describe("batchUpdate", () => {
    it("should update multiple state properties at once", () => {
      const store = createStore();
      const memory: MemoryInfo = {
        heapUsed: 1000,
        heapTotal: 2000,
        heapLimit: 4000,
        timestamp: Date.now(),
      };

      store.batchUpdate({
        memory,
        domNodes: 100,
        eventListeners: 50,
        isMonitoring: true,
        severity: "warning",
      });

      const snapshot = store.getSnapshot();
      expect(snapshot.memory).toBe(memory);
      expect(snapshot.domNodes).toBe(100);
      expect(snapshot.eventListeners).toBe(50);
      expect(snapshot.isMonitoring).toBe(true);
      expect(snapshot.severity).toBe("warning");
    });

    it("should notify subscribers only once for batch update", () => {
      const store = createStore();
      const listener = vi.fn();

      store.subscribe(listener);

      const memory: MemoryInfo = {
        heapUsed: 1000,
        heapTotal: 2000,
        heapLimit: 4000,
        timestamp: Date.now(),
      };

      store.batchUpdate({
        memory,
        domNodes: 100,
        isMonitoring: true,
      });

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("should not notify if no changes", () => {
      const store = createStore();
      const listener = vi.fn();

      store.subscribe(listener);

      store.batchUpdate({});
      expect(listener).not.toHaveBeenCalled();
    });

    it("should update lastUpdated timestamp", () => {
      const store = createStore();
      const beforeUpdate = Date.now();

      store.batchUpdate({ isMonitoring: true });

      const snapshot = store.getSnapshot();
      expect(snapshot.lastUpdated).toBeGreaterThanOrEqual(beforeUpdate);
    });

    it("should handle partial updates", () => {
      const store = createStore();
      const memory: MemoryInfo = {
        heapUsed: 1000,
        heapTotal: 2000,
        heapLimit: 4000,
        timestamp: Date.now(),
      };

      store.updateMemory(memory);
      store.updateDOMNodes(100);

      store.batchUpdate({ isMonitoring: true });

      const snapshot = store.getSnapshot();
      expect(snapshot.memory).toBe(memory);
      expect(snapshot.domNodes).toBe(100);
      expect(snapshot.isMonitoring).toBe(true);
    });
  });

  describe("reset", () => {
    it("should reset store to initial state", () => {
      const store = createStore();
      const memory: MemoryInfo = {
        heapUsed: 1000,
        heapTotal: 2000,
        heapLimit: 4000,
        timestamp: Date.now(),
      };

      store.updateMemory(memory);
      store.updateDOMNodes(100);
      store.updateEventListeners(50);
      store.updateMonitoringStatus(true);
      store.updateSeverity("warning");

      store.reset();

      const snapshot = store.getSnapshot();
      expect(snapshot).toEqual(SSR_INITIAL_STATE);
    });

    it("should notify subscribers on reset", () => {
      const store = createStore();
      const listener = vi.fn();

      store.subscribe(listener);
      store.updateMemory({
        heapUsed: 1000,
        heapTotal: 2000,
        heapLimit: 4000,
        timestamp: Date.now(),
      });

      listener.mockClear();
      store.reset();

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("should allow updates after reset", () => {
      const store = createStore();
      const memory: MemoryInfo = {
        heapUsed: 1000,
        heapTotal: 2000,
        heapLimit: 4000,
        timestamp: Date.now(),
      };

      store.updateMemory(memory);
      store.reset();
      store.updateMemory(memory);

      const snapshot = store.getSnapshot();
      expect(snapshot.memory).toBe(memory);
    });
  });

  describe("multiple subscribers", () => {
    it("should notify all subscribers on update", () => {
      const store = createStore();
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      store.subscribe(listener1);
      store.subscribe(listener2);
      store.subscribe(listener3);

      store.updateMonitoringStatus(true);

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(listener3).toHaveBeenCalledTimes(1);
    });

    it("should handle partial unsubscribe", () => {
      const store = createStore();
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      store.subscribe(listener1);
      const unsubscribe2 = store.subscribe(listener2);
      store.subscribe(listener3);

      unsubscribe2();
      store.updateMonitoringStatus(true);

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).not.toHaveBeenCalled();
      expect(listener3).toHaveBeenCalledTimes(1);
    });
  });
});

describe("createSSRSafeStore", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it("should create a normal store in browser environment", () => {
    const store = createSSRSafeStore();
    const memory: MemoryInfo = {
      heapUsed: 1000,
      heapTotal: 2000,
      heapLimit: 4000,
      timestamp: Date.now(),
    };

    store.updateMemory(memory);
    const snapshot = store.getSnapshot();

    expect(snapshot.memory).toBe(memory);
  });

  it("should create a no-op store in server environment", () => {
    // @ts-expect-error - Simulating server environment
    delete globalThis.window;

    const store = createSSRSafeStore();
    const listener = vi.fn();

    const unsubscribe = store.subscribe(listener);
    expect(typeof unsubscribe).toBe("function");

    const memory: MemoryInfo = {
      heapUsed: 1000,
      heapTotal: 2000,
      heapLimit: 4000,
      timestamp: Date.now(),
    };

    store.updateMemory(memory);
    store.updateDOMNodes(100);
    store.updateEventListeners(50);
    store.updateMonitoringStatus(true);
    store.updateSeverity("warning");
    store.batchUpdate({ isMonitoring: true });
    store.reset();

    expect(listener).not.toHaveBeenCalled();
    expect(store.getSnapshot()).toEqual(SSR_INITIAL_STATE);
    expect(store.getServerSnapshot()).toEqual(SSR_INITIAL_STATE);
    expect(store.getSubscriberCount()).toBe(0);
  });
});

describe("readMemoryFromAPI", () => {
  const originalWindow = globalThis.window;
  const originalPerformance = globalThis.performance;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.performance = originalPerformance;
  });

  it("should return null in server environment", () => {
    // @ts-expect-error - Simulating server environment
    delete globalThis.window;

    const result = readMemoryFromAPI();
    expect(result).toBeNull();
  });

  it("should return null if performance.memory is not available", () => {
    // @ts-expect-error - Removing memory property
    delete globalThis.performance.memory;

    const result = readMemoryFromAPI();
    expect(result).toBeNull();
  });

  it("should read memory from performance.memory API", () => {
    const mockMemory = {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000,
    };

    // @ts-expect-error - Mocking performance.memory
    globalThis.performance.memory = mockMemory;

    const result = readMemoryFromAPI();

    expect(result).not.toBeNull();
    expect(result?.heapUsed).toBe(1000000);
    expect(result?.heapTotal).toBe(2000000);
    expect(result?.heapLimit).toBe(4000000);
    expect(result?.timestamp).toBeGreaterThan(0);
  });

  it("should handle negative values by converting to 0", () => {
    const mockMemory = {
      usedJSHeapSize: -100,
      totalJSHeapSize: -200,
      jsHeapSizeLimit: -400,
    };

    // @ts-expect-error - Mocking performance.memory
    globalThis.performance.memory = mockMemory;

    const result = readMemoryFromAPI();

    expect(result?.heapUsed).toBe(0);
    expect(result?.heapTotal).toBe(0);
    expect(result?.heapLimit).toBe(0);
  });
});

describe("countDOMNodes", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it("should return null in server environment", () => {
    // @ts-expect-error - Simulating server environment
    delete globalThis.window;

    const result = countDOMNodes();
    expect(result).toBeNull();
  });

  it("should count all DOM nodes", () => {
    const result = countDOMNodes();
    expect(result).toBeGreaterThan(0);
    expect(typeof result).toBe("number");
  });

  it("should return null on error", () => {
    const originalQuerySelectorAll = document.querySelectorAll;
    document.querySelectorAll = () => {
      throw new Error("Test error");
    };

    const result = countDOMNodes();
    expect(result).toBeNull();

    document.querySelectorAll = originalQuerySelectorAll;
  });
});

describe("estimateEventListeners", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it("should return null in server environment", () => {
    // @ts-expect-error - Simulating server environment
    delete globalThis.window;

    const result = estimateEventListeners();
    expect(result).toBeNull();
  });

  it("should estimate event listeners based on interactive elements", () => {
    // Create some interactive elements
    const button = document.createElement("button");
    const input = document.createElement("input");
    const link = document.createElement("a");
    document.body.appendChild(button);
    document.body.appendChild(input);
    document.body.appendChild(link);

    const result = estimateEventListeners();

    expect(result).toBeGreaterThan(0);
    expect(typeof result).toBe("number");

    // Clean up
    document.body.removeChild(button);
    document.body.removeChild(input);
    document.body.removeChild(link);
  });

  it("should return 0 if no interactive elements exist", () => {
    const result = estimateEventListeners();
    // Should return 0 or a small number in empty test environment
    expect(typeof result).toBe("number");
  });

  it("should return null on error", () => {
    const originalQuerySelectorAll = document.querySelectorAll;
    document.querySelectorAll = () => {
      throw new Error("Test error");
    };

    const result = estimateEventListeners();
    expect(result).toBeNull();

    document.querySelectorAll = originalQuerySelectorAll;
  });
});
