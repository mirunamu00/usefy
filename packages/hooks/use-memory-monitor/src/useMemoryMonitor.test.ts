import { StrictMode } from "react";
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useMemoryMonitor } from "./useMemoryMonitor";
import {
  mockSupportedBrowser,
  mockUnsupportedBrowser,
} from "../vitest.setup";

/**
 * Install a performance.memory mock whose heap grows by a fixed step on every
 * read, producing a clean monotonically-increasing signal for leak/trend tests.
 */
function mockGrowingMemory(startMB: number, stepMB: number) {
  let reads = 0;
  Object.defineProperty(performance, "memory", {
    configurable: true,
    get() {
      const used = (startMB + reads * stepMB) * 1024 * 1024;
      reads += 1;
      return {
        usedJSHeapSize: used,
        totalJSHeapSize: used + 20 * 1024 * 1024,
        jsHeapSizeLimit: 4 * 1024 * 1024 * 1024,
      };
    },
  });
}

/**
 * Fully remove the performance.memory property so the legacy API detection
 * (`"memory" in performance`) reports the browser as unsupported. The setup
 * mocks assign `undefined`, which still leaves the key present.
 */
function removeMemoryAPI() {
  delete (performance as unknown as Record<string, unknown>).memory;
}

/**
 * Drive a synthetic tab visibility transition and dispatch the event.
 */
function setDocumentHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", {
    value: hidden,
    configurable: true,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("useMemoryMonitor", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Always reset to supported browser for most tests
    mockSupportedBrowser();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.restoreAllMocks();
    // Reset performance.memory to default supported state
    mockSupportedBrowser();
  });

  describe("initialization", () => {
    it("should return all required properties", () => {
      const { result } = renderHook(() => useMemoryMonitor({ autoStart: false }));

      // Current State
      expect(result.current).toHaveProperty("memory");
      expect(result.current).toHaveProperty("heapUsed");
      expect(result.current).toHaveProperty("heapTotal");
      expect(result.current).toHaveProperty("heapLimit");
      expect(result.current).toHaveProperty("usagePercentage");

      // DOM Related
      expect(result.current).toHaveProperty("domNodes");
      expect(result.current).toHaveProperty("eventListeners");

      // Status Flags
      expect(result.current).toHaveProperty("isSupported");
      expect(result.current).toHaveProperty("isMonitoring");
      expect(result.current).toHaveProperty("isLeakDetected");
      expect(result.current).toHaveProperty("severity");

      // Support Details
      expect(result.current).toHaveProperty("supportLevel");
      expect(result.current).toHaveProperty("availableMetrics");

      // Analysis Data
      expect(result.current).toHaveProperty("history");
      expect(result.current).toHaveProperty("trend");
      expect(result.current).toHaveProperty("leakProbability");

      // Actions
      expect(typeof result.current.start).toBe("function");
      expect(typeof result.current.stop).toBe("function");
      expect(typeof result.current.takeSnapshot).toBe("function");
      expect(typeof result.current.compareSnapshots).toBe("function");
      expect(typeof result.current.clearHistory).toBe("function");
      expect(typeof result.current.requestGC).toBe("function");

      // Formatting
      expect(result.current).toHaveProperty("formatted");
    });

    it("should detect browser support correctly", () => {
      const { result } = renderHook(() => useMemoryMonitor({ autoStart: false }));

      expect(result.current.isSupported).toBe(true);
      expect(result.current.supportLevel).toBe("full");
      expect(result.current.availableMetrics).toContain("heapUsed");
    });

    it("should not auto-start when autoStart is false", () => {
      const { result } = renderHook(() => useMemoryMonitor({ autoStart: false }));

      expect(result.current.isMonitoring).toBe(false);
    });

    it("should auto-start when autoStart is true (default)", async () => {
      const { result } = renderHook(() => useMemoryMonitor());

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.isMonitoring).toBe(true);
    });

    it("should have default severity of normal", () => {
      const { result } = renderHook(() => useMemoryMonitor({ autoStart: false }));

      expect(result.current.severity).toBe("normal");
    });

    it("should have default trend of stable", () => {
      const { result } = renderHook(() => useMemoryMonitor({ autoStart: false }));

      expect(result.current.trend).toBe("stable");
    });
  });

  describe("monitoring", () => {
    it("should update memory values when monitoring", async () => {
      const { result } = renderHook(() => useMemoryMonitor({ interval: 1000 }));

      // Wait for auto-start and initial poll
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.memory).not.toBeNull();
      expect(result.current.heapUsed).toBe(50 * 1024 * 1024);
      expect(result.current.heapTotal).toBe(100 * 1024 * 1024);
      expect(result.current.heapLimit).toBe(2 * 1024 * 1024 * 1024);
    });

    it("should calculate usage percentage correctly", async () => {
      const { result } = renderHook(() => useMemoryMonitor({ interval: 1000 }));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      // 50MB / 2GB = 2.44%
      expect(result.current.usagePercentage).toBeCloseTo(2.44, 1);
    });

    it("should stop updating when stop() is called", async () => {
      const { result } = renderHook(() => useMemoryMonitor({ interval: 1000 }));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.isMonitoring).toBe(true);

      act(() => {
        result.current.stop();
      });

      expect(result.current.isMonitoring).toBe(false);
    });

    it("should resume updating when start() is called", async () => {
      const { result } = renderHook(() =>
        useMemoryMonitor({ autoStart: false, interval: 1000 })
      );

      expect(result.current.isMonitoring).toBe(false);

      act(() => {
        result.current.start();
      });

      expect(result.current.isMonitoring).toBe(true);
    });

    it("should cleanup on unmount", async () => {
      const { result, unmount } = renderHook(() =>
        useMemoryMonitor({ interval: 1000 })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.isMonitoring).toBe(true);

      unmount();

      // Should not throw or cause issues
    });
  });

  describe("history", () => {
    it("should not record history when enableHistory is false (default)", async () => {
      const { result } = renderHook(() =>
        useMemoryMonitor({ interval: 1000 })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });

      expect(result.current.history).toHaveLength(0);
    });

    it("should record history when enableHistory is true", async () => {
      const { result } = renderHook(() =>
        useMemoryMonitor({ interval: 1000, enableHistory: true })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3100);
      });

      expect(result.current.history.length).toBeGreaterThan(0);
    });

    it("should limit history to historySize", async () => {
      const { result } = renderHook(() =>
        useMemoryMonitor({
          interval: 100,
          enableHistory: true,
          historySize: 5,
        })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(result.current.history.length).toBeLessThanOrEqual(5);
    });

    it("should clear history when clearHistory() is called", async () => {
      const { result } = renderHook(() =>
        useMemoryMonitor({
          interval: 100,
          enableHistory: true,
          autoStart: false, // Don't auto-start so we can control polling
        })
      );

      // Manually start and poll a few times
      act(() => {
        result.current.start();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });

      const historyLengthBefore = result.current.history.length;
      expect(historyLengthBefore).toBeGreaterThan(0);

      // Stop monitoring so no new polls happen
      act(() => {
        result.current.stop();
      });

      // Clear history
      act(() => {
        result.current.clearHistory();
      });

      // History is derived from the buffer - after clearing it should be empty
      // But due to how useMemo works with storeState.lastUpdated, we need to check the buffer
      // The clearHistory function clears the internal buffer
      // When monitoring is stopped and clearHistory is called, next access should show empty

      // Start again to see the cleared state
      act(() => {
        result.current.start();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      // After clearing and one poll, should have fewer entries than before
      expect(result.current.history.length).toBeLessThan(historyLengthBefore);
    });
  });

  describe("thresholds", () => {
    it("should set severity to warning when usage exceeds warning threshold", async () => {
      // Mock high memory usage (80%)
      mockSupportedBrowser({
        usedJSHeapSize: 1.6 * 1024 * 1024 * 1024, // 1.6GB
        totalJSHeapSize: 1.8 * 1024 * 1024 * 1024,
        jsHeapSizeLimit: 2 * 1024 * 1024 * 1024, // 2GB limit
      });

      const { result } = renderHook(() =>
        useMemoryMonitor({
          interval: 1000,
          thresholds: { warning: 70, critical: 90 },
        })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.severity).toBe("warning");
    });

    it("should set severity to critical when usage exceeds critical threshold", async () => {
      // Mock critical memory usage (95%)
      mockSupportedBrowser({
        usedJSHeapSize: 1.9 * 1024 * 1024 * 1024, // 1.9GB
        totalJSHeapSize: 1.95 * 1024 * 1024 * 1024,
        jsHeapSizeLimit: 2 * 1024 * 1024 * 1024, // 2GB limit
      });

      const { result } = renderHook(() =>
        useMemoryMonitor({
          interval: 1000,
          thresholds: { warning: 70, critical: 90 },
        })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.severity).toBe("critical");
    });

    it("should call onWarning callback when warning threshold is exceeded", async () => {
      mockSupportedBrowser({
        usedJSHeapSize: 1.6 * 1024 * 1024 * 1024,
        totalJSHeapSize: 1.8 * 1024 * 1024 * 1024,
        jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
      });

      const onWarning = vi.fn();

      renderHook(() =>
        useMemoryMonitor({
          interval: 1000,
          thresholds: { warning: 70, critical: 90 },
          onWarning,
        })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(onWarning).toHaveBeenCalled();
    });

    it("should call onCritical callback when critical threshold is exceeded", async () => {
      mockSupportedBrowser({
        usedJSHeapSize: 1.9 * 1024 * 1024 * 1024,
        totalJSHeapSize: 1.95 * 1024 * 1024 * 1024,
        jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
      });

      const onCritical = vi.fn();

      renderHook(() =>
        useMemoryMonitor({
          interval: 1000,
          thresholds: { warning: 70, critical: 90 },
          onCritical,
        })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(onCritical).toHaveBeenCalled();
    });
  });

  describe("snapshots", () => {
    it("should take named snapshots", async () => {
      const { result } = renderHook(() =>
        useMemoryMonitor({ interval: 1000 })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      let snapshot = null as ReturnType<typeof result.current.takeSnapshot>;
      act(() => {
        snapshot = result.current.takeSnapshot("test-snapshot");
      });

      expect(snapshot).not.toBeNull();
      expect(snapshot!.id).toBe("test-snapshot");
      expect(snapshot!.memory).toBeDefined();
    });

    it("should compare two snapshots", async () => {
      const { result } = renderHook(() =>
        useMemoryMonitor({ interval: 1000 })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      act(() => {
        result.current.takeSnapshot("before");
      });

      // Change memory values
      mockSupportedBrowser({
        usedJSHeapSize: 60 * 1024 * 1024,
        totalJSHeapSize: 110 * 1024 * 1024,
        jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1100);
      });

      act(() => {
        result.current.takeSnapshot("after");
      });

      let diff = null as ReturnType<typeof result.current.compareSnapshots>;
      act(() => {
        diff = result.current.compareSnapshots("before", "after");
      });

      expect(diff).not.toBeNull();
      expect(diff!.heapDelta).toBeDefined();
      expect(diff!.heapPercentChange).toBeDefined();
      expect(diff!.timeDelta).toBeDefined();
    });

    it("should return null for non-existent snapshot", async () => {
      const { result } = renderHook(() =>
        useMemoryMonitor({ interval: 1000 })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      let diff = null as ReturnType<typeof result.current.compareSnapshots>;
      act(() => {
        diff = result.current.compareSnapshots("nonexistent1", "nonexistent2");
      });

      expect(diff).toBeNull();
    });

    it("should return null when taking snapshot without memory data", () => {
      mockUnsupportedBrowser();

      const { result } = renderHook(() =>
        useMemoryMonitor({ autoStart: false, fallbackStrategy: "none" })
      );

      let snapshot = null as ReturnType<typeof result.current.takeSnapshot>;
      act(() => {
        snapshot = result.current.takeSnapshot("test");
      });

      expect(snapshot).toBeNull();
    });
  });

  describe("fallback strategies", () => {
    // Note: In jsdom test environment, performance.memory mock may persist
    // These tests verify the fallback strategy options are applied

    it("should handle 'none' strategy configuration", () => {
      // With a supported browser, 'none' strategy has no effect
      const { result } = renderHook(() =>
        useMemoryMonitor({ fallbackStrategy: "none", autoStart: false })
      );

      // In a supported browser, isSupported is true regardless of fallbackStrategy
      expect(result.current.isSupported).toBe(true);
      expect(typeof result.current.formatted.heapUsed).toBe("string");
    });

    it("should handle 'dom-only' strategy configuration", () => {
      // With a supported browser, 'dom-only' strategy has no effect since full support is available
      const { result } = renderHook(() =>
        useMemoryMonitor({ fallbackStrategy: "dom-only", autoStart: false })
      );

      expect(result.current.isSupported).toBe(true);
      expect(result.current.supportLevel).toBe("full");
    });

    it("should return formatted N/A values when memory data is not available", () => {
      // This tests the formatting behavior when memory is null
      const { result } = renderHook(() =>
        useMemoryMonitor({ autoStart: false })
      );

      // Before starting, memory should be null
      expect(result.current.memory).toBeNull();
      expect(result.current.formatted.heapUsed).toBe("N/A");
    });
  });

  describe("callbacks", () => {
    it("should call onUpdate callback on each update", async () => {
      const onUpdate = vi.fn();

      renderHook(() =>
        useMemoryMonitor({
          interval: 1000,
          onUpdate,
        })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(onUpdate).toHaveBeenCalled();
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          heapUsed: expect.any(Number),
          heapTotal: expect.any(Number),
          heapLimit: expect.any(Number),
          timestamp: expect.any(Number),
        })
      );
    });

    it("should not call onUnsupported when browser is supported", () => {
      // In our test environment, browser is supported
      const onUnsupported = vi.fn();

      renderHook(() =>
        useMemoryMonitor({
          fallbackStrategy: "none",
          onUnsupported,
          autoStart: false,
        })
      );

      // Since browser is supported, onUnsupported should NOT be called
      expect(onUnsupported).not.toHaveBeenCalled();
    });
  });

  describe("formatted values", () => {
    it("should provide formatted memory values", async () => {
      const { result } = renderHook(() =>
        useMemoryMonitor({ interval: 1000 })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.formatted.heapUsed).toBe("50 MB");
      expect(result.current.formatted.heapTotal).toBe("100 MB");
      expect(result.current.formatted.heapLimit).toBe("2 GB");
    });

    it("should return N/A for unsupported browser", () => {
      mockUnsupportedBrowser();

      const { result } = renderHook(() =>
        useMemoryMonitor({ fallbackStrategy: "none" })
      );

      expect(result.current.formatted.heapUsed).toBe("N/A");
      expect(result.current.formatted.heapTotal).toBe("N/A");
      expect(result.current.formatted.heapLimit).toBe("N/A");
    });
  });

  describe("DOM tracking", () => {
    it("should track DOM nodes when trackDOMNodes is true", async () => {
      const { result } = renderHook(() =>
        useMemoryMonitor({
          interval: 1000,
          trackDOMNodes: true,
        })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.domNodes).not.toBeNull();
    });

    it("should not track DOM nodes when trackDOMNodes is false (default)", async () => {
      const { result } = renderHook(() =>
        useMemoryMonitor({ interval: 1000 })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.domNodes).toBeNull();
    });
  });

  describe("event listener tracking", () => {
    it("should estimate event listeners when trackEventListeners is true", async () => {
      const { result } = renderHook(() =>
        useMemoryMonitor({
          interval: 1000,
          trackEventListeners: true,
        })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.eventListeners).not.toBeNull();
    });
  });

  describe("requestGC", () => {
    it("should not throw when calling requestGC", async () => {
      const { result } = renderHook(() =>
        useMemoryMonitor({ interval: 1000 })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(() => {
        act(() => {
          result.current.requestGC();
        });
      }).not.toThrow();
    });
  });

  describe("enabled option", () => {
    it("should not start when enabled is false", () => {
      const { result } = renderHook(() =>
        useMemoryMonitor({ enabled: false })
      );

      expect(result.current.isMonitoring).toBe(false);
    });
  });

  describe("multiple instances", () => {
    it("should maintain separate state across multiple hook instances", async () => {
      const { result: result1 } = renderHook(() =>
        useMemoryMonitor({ autoStart: false })
      );
      const { result: result2 } = renderHook(() =>
        useMemoryMonitor({ autoStart: false })
      );

      act(() => {
        result1.current.start();
      });

      expect(result1.current.isMonitoring).toBe(true);
      expect(result2.current.isMonitoring).toBe(false);
    });
  });

  describe("function references", () => {
    it("should maintain stable function references across renders", async () => {
      const { result, rerender } = renderHook(() =>
        useMemoryMonitor({ autoStart: false })
      );

      const initialStart = result.current.start;
      const initialStop = result.current.stop;
      const initialTakeSnapshot = result.current.takeSnapshot;
      const initialCompareSnapshots = result.current.compareSnapshots;
      const initialClearHistory = result.current.clearHistory;
      const initialRequestGC = result.current.requestGC;

      rerender();

      expect(result.current.start).toBe(initialStart);
      expect(result.current.stop).toBe(initialStop);
      expect(result.current.takeSnapshot).toBe(initialTakeSnapshot);
      expect(result.current.compareSnapshots).toBe(initialCompareSnapshots);
      expect(result.current.clearHistory).toBe(initialClearHistory);
      expect(result.current.requestGC).toBe(initialRequestGC);
    });

    it("keeps a stable start reference and re-targets onUpdate without interval churn", async () => {
      // Regression for finding 6: swapping the onUpdate identity across renders
      // must not recreate the polling callback (it lives behind a ref).
      const first = vi.fn();
      const { result, rerender } = renderHook(
        ({ cb }: { cb: () => void }) =>
          useMemoryMonitor({ interval: 1000, onUpdate: cb }),
        { initialProps: { cb: first as unknown as () => void } }
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1100);
      });

      const startRef = result.current.start;

      const second = vi.fn();
      rerender({ cb: second as unknown as () => void });
      first.mockClear();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1100);
      });

      // Same interval keeps running (stable start identity, no restart)…
      expect(result.current.start).toBe(startRef);
      // …but updates now flow to the latest callback only.
      expect(second).toHaveBeenCalled();
      expect(first).not.toHaveBeenCalled();
    });
  });

  describe("leak detection (hook level)", () => {
    it("detects a leak and fires onLeakDetected for monotonically growing heap", async () => {
      // Steep relative growth keeps the normalized slope well above the trend
      // threshold even as absolute heap rises across the analysis window.
      mockGrowingMemory(20, 20);
      const onLeakDetected = vi.fn();

      const { result } = renderHook(() =>
        useMemoryMonitor({
          interval: 1000,
          enableHistory: true,
          historySize: 60,
          leakDetection: {
            enabled: true,
            sensitivity: "high",
            windowSize: 20,
          },
          onLeakDetected,
        })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(25000);
      });

      expect(result.current.leakProbability).toBeGreaterThanOrEqual(70);
      expect(result.current.isLeakDetected).toBe(true);
      expect(onLeakDetected).toHaveBeenCalled();
      expect(onLeakDetected).toHaveBeenCalledWith(
        expect.objectContaining({
          isLeaking: true,
          probability: expect.any(Number),
          trend: "increasing",
        })
      );
    });

    it("does not flag a leak when history/leak detection is disabled", async () => {
      mockGrowingMemory(50, 5);
      const onLeakDetected = vi.fn();

      const { result } = renderHook(() =>
        useMemoryMonitor({ interval: 1000, onLeakDetected })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(50000);
      });

      expect(result.current.isLeakDetected).toBe(false);
      expect(result.current.leakProbability).toBe(0);
      expect(onLeakDetected).not.toHaveBeenCalled();
    });
  });

  describe("trend analysis", () => {
    it("reports an increasing trend when heap grows over time", async () => {
      mockGrowingMemory(50, 5);

      const { result } = renderHook(() =>
        useMemoryMonitor({
          interval: 1000,
          enableHistory: true,
          historySize: 30,
        })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(10000);
      });

      expect(result.current.trend).toBe("increasing");
    });
  });

  describe("tab visibility", () => {
    afterEach(() => {
      setDocumentHidden(false);
    });

    it("pauses on hide and resumes on show when monitoring was active", async () => {
      const { result } = renderHook(() =>
        useMemoryMonitor({ interval: 1000, autoStart: true })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      expect(result.current.isMonitoring).toBe(true);

      act(() => {
        setDocumentHidden(true);
      });
      expect(result.current.isMonitoring).toBe(false);

      act(() => {
        setDocumentHidden(false);
      });
      expect(result.current.isMonitoring).toBe(true);
    });

    it("does not auto-resume monitoring the user manually stopped (finding 10)", async () => {
      const { result } = renderHook(() =>
        useMemoryMonitor({ interval: 1000, autoStart: true })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      expect(result.current.isMonitoring).toBe(true);

      // User explicitly stops monitoring.
      act(() => {
        result.current.stop();
      });
      expect(result.current.isMonitoring).toBe(false);

      // Tab hides then re-shows.
      act(() => {
        setDocumentHidden(true);
      });
      act(() => {
        setDocumentHidden(false);
      });

      // User intent is respected: monitoring stays stopped.
      expect(result.current.isMonitoring).toBe(false);
    });
  });

  describe("history resize", () => {
    it("shrinks the history buffer when historySize is reduced", async () => {
      const { result, rerender } = renderHook(
        ({ size }: { size: number }) =>
          useMemoryMonitor({
            interval: 100,
            enableHistory: true,
            historySize: size,
          }),
        { initialProps: { size: 20 } }
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });
      expect(result.current.history.length).toBeGreaterThan(5);

      rerender({ size: 3 });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(result.current.history.length).toBeLessThanOrEqual(3);
    });
  });

  describe("threshold edge cases", () => {
    it("fires onWarning at 0% usage when the warning threshold is 0 (finding 9)", async () => {
      // heapUsed 0 => usagePercentage 0. A truthiness guard would swallow this.
      mockSupportedBrowser({
        usedJSHeapSize: 0,
        totalJSHeapSize: 100 * 1024 * 1024,
        jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
      });
      const onWarning = vi.fn();

      const { result } = renderHook(() =>
        useMemoryMonitor({
          interval: 1000,
          thresholds: { warning: 0, critical: 90 },
          onWarning,
        })
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.usagePercentage).toBe(0);
      expect(result.current.severity).toBe("warning");
      expect(onWarning).toHaveBeenCalled();
    });
  });

  describe("unsupported environment", () => {
    it("calls onUnsupported once with reason and fallbacks", () => {
      removeMemoryAPI();
      const onUnsupported = vi.fn();

      renderHook(() =>
        useMemoryMonitor({
          fallbackStrategy: "none",
          onUnsupported,
          autoStart: false,
        })
      );

      expect(onUnsupported).toHaveBeenCalledTimes(1);
      expect(onUnsupported).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: expect.any(String),
          availableFallbacks: expect.any(Array),
        })
      );
    });

    it("calls onUnsupported exactly once under StrictMode (finding 5)", () => {
      removeMemoryAPI();
      const onUnsupported = vi.fn();

      renderHook(
        () =>
          useMemoryMonitor({
            fallbackStrategy: "none",
            onUnsupported,
            autoStart: false,
          }),
        { wrapper: StrictMode }
      );

      expect(onUnsupported).toHaveBeenCalledTimes(1);
    });

    it("reports isSupported false and N/A formatting when the memory API is absent", () => {
      removeMemoryAPI();

      const { result } = renderHook(() =>
        useMemoryMonitor({ fallbackStrategy: "none", autoStart: false })
      );

      expect(result.current.isSupported).toBe(false);
      expect(result.current.supportLevel).toBe("none");
      expect(result.current.formatted.heapUsed).toBe("N/A");
    });
  });
});
