import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Force the server code path by making isServer() report true. This is isolated
// to its own file so the module mock does not leak into the main hook suite.
vi.mock("./utils/detection", async (importActual) => {
  const actual =
    await importActual<typeof import("./utils/detection")>();
  return { ...actual, isServer: () => true };
});

import { useMemoryMonitor } from "./useMemoryMonitor";
import { createStore } from "./store";

describe("useMemoryMonitor (SSR / server render)", () => {
  it("returns SSR-safe defaults when running on the server", () => {
    const { result } = renderHook(() => useMemoryMonitor());

    expect(result.current.isSupported).toBe(false);
    expect(result.current.isMonitoring).toBe(false);
    expect(result.current.memory).toBeNull();
    expect(result.current.heapUsed).toBeNull();
    expect(result.current.heapTotal).toBeNull();
    expect(result.current.heapLimit).toBeNull();
    expect(result.current.usagePercentage).toBeNull();
    expect(result.current.domNodes).toBeNull();
    expect(result.current.eventListeners).toBeNull();
    expect(result.current.severity).toBe("normal");
    expect(result.current.supportLevel).toBe("none");
    expect(result.current.availableMetrics).toEqual([]);
    expect(result.current.history).toEqual([]);
    expect(result.current.trend).toBe("stable");
    expect(result.current.leakProbability).toBe(0);
    expect(result.current.isLeakDetected).toBe(false);
    expect(result.current.formatted.heapUsed).toBe("N/A");
  });

  it("exposes safe no-op actions on the server", () => {
    const { result } = renderHook(() => useMemoryMonitor());

    expect(() => result.current.start()).not.toThrow();
    expect(() => result.current.stop()).not.toThrow();
    expect(() => result.current.clearHistory()).not.toThrow();
    expect(() => result.current.requestGC()).not.toThrow();
    expect(result.current.takeSnapshot("x")).toBeNull();
    expect(result.current.compareSnapshots("a", "b")).toBeNull();
  });

  it("store.getServerSnapshot returns the SSR initial state", () => {
    const store = createStore();
    const snapshot = store.getServerSnapshot();

    expect(snapshot.memory).toBeNull();
    expect(snapshot.isMonitoring).toBe(false);
    expect(snapshot.severity).toBe("normal");
  });
});
