import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useMemoryMonitorHeadless } from "./MemoryMonitorHeadless";
import { mockSupportedBrowser } from "../vitest.setup";

describe("useMemoryMonitorHeadless", () => {
  beforeEach(() => {
    mockSupportedBrowser();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Auto GC", () => {
    it("should trigger auto GC when usage exceeds threshold", async () => {
      // Mock high memory usage (95% of limit)
      const heapLimit = 2 * 1024 * 1024 * 1024; // 2GB
      const heapUsed = heapLimit * 0.95; // 95% usage
      mockSupportedBrowser({
        usedJSHeapSize: heapUsed,
        totalJSHeapSize: heapLimit,
        jsHeapSizeLimit: heapLimit,
      });

      const onAutoGC = vi.fn();

      renderHook(() =>
        useMemoryMonitorHeadless({
          enableAutoGC: true,
          autoGCThreshold: 90, // 90% threshold
          interval: 50,
          onAutoGC,
        })
      );

      // Wait for the hook to process and trigger auto GC
      await waitFor(
        () => {
          expect(onAutoGC).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      expect(onAutoGC).toHaveBeenCalledWith(
        expect.objectContaining({
          threshold: 90,
          usage: expect.any(Number),
          timestamp: expect.any(Number),
        })
      );
    });

    it("should NOT trigger auto GC when disabled", async () => {
      // Mock high memory usage
      const heapLimit = 2 * 1024 * 1024 * 1024;
      const heapUsed = heapLimit * 0.95;
      mockSupportedBrowser({
        usedJSHeapSize: heapUsed,
        totalJSHeapSize: heapLimit,
        jsHeapSizeLimit: heapLimit,
      });

      const onAutoGC = vi.fn();

      renderHook(() =>
        useMemoryMonitorHeadless({
          enableAutoGC: false, // Disabled
          autoGCThreshold: 90,
          interval: 50,
          onAutoGC,
        })
      );

      // Wait a bit and ensure it's not called
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(onAutoGC).not.toHaveBeenCalled();
    });

    it("should NOT trigger auto GC when usage is below threshold", async () => {
      // Mock low memory usage (50% of limit)
      const heapLimit = 2 * 1024 * 1024 * 1024;
      const heapUsed = heapLimit * 0.5; // 50% usage
      mockSupportedBrowser({
        usedJSHeapSize: heapUsed,
        totalJSHeapSize: heapLimit,
        jsHeapSizeLimit: heapLimit,
      });

      const onAutoGC = vi.fn();

      renderHook(() =>
        useMemoryMonitorHeadless({
          enableAutoGC: true,
          autoGCThreshold: 90, // 90% threshold
          interval: 50,
          onAutoGC,
        })
      );

      // Wait a bit and ensure it's not called
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(onAutoGC).not.toHaveBeenCalled();
    });

    it("should NOT trigger auto GC when autoGCThreshold is null", async () => {
      const heapLimit = 2 * 1024 * 1024 * 1024;
      const heapUsed = heapLimit * 0.95;
      mockSupportedBrowser({
        usedJSHeapSize: heapUsed,
        totalJSHeapSize: heapLimit,
        jsHeapSizeLimit: heapLimit,
      });

      const onAutoGC = vi.fn();

      renderHook(() =>
        useMemoryMonitorHeadless({
          enableAutoGC: true,
          autoGCThreshold: null, // null threshold
          interval: 50,
          onAutoGC,
        })
      );

      // Wait a bit and ensure it's not called
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(onAutoGC).not.toHaveBeenCalled();
    });

    it("should respect cooldown period between auto GC calls", async () => {
      // Mock high memory usage
      const heapLimit = 2 * 1024 * 1024 * 1024;
      const heapUsed = heapLimit * 0.95;
      mockSupportedBrowser({
        usedJSHeapSize: heapUsed,
        totalJSHeapSize: heapLimit,
        jsHeapSizeLimit: heapLimit,
      });

      const onAutoGC = vi.fn();

      renderHook(() =>
        useMemoryMonitorHeadless({
          enableAutoGC: true,
          autoGCThreshold: 90,
          interval: 50,
          onAutoGC,
        })
      );

      // Wait for first trigger
      await waitFor(
        () => {
          expect(onAutoGC).toHaveBeenCalledTimes(1);
        },
        { timeout: 3000 }
      );

      // Wait more but should still be 1 call due to cooldown (10s)
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Should still be 1 call (cooldown not expired - 10s cooldown)
      expect(onAutoGC).toHaveBeenCalledTimes(1);
    });
  });

  describe("Severity callbacks", () => {
    it("should call onWarning when usage exceeds warning threshold", async () => {
      const heapLimit = 2 * 1024 * 1024 * 1024;
      const heapUsed = heapLimit * 0.75; // 75% usage
      mockSupportedBrowser({
        usedJSHeapSize: heapUsed,
        totalJSHeapSize: heapLimit,
        jsHeapSizeLimit: heapLimit,
      });

      const onWarning = vi.fn();

      renderHook(() =>
        useMemoryMonitorHeadless({
          warningThreshold: 70,
          criticalThreshold: 90,
          interval: 50,
          onWarning,
        })
      );

      await waitFor(
        () => {
          expect(onWarning).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      expect(onWarning).toHaveBeenCalledWith(
        expect.objectContaining({
          usagePercentage: expect.any(Number),
          threshold: 70,
          timestamp: expect.any(Number),
        })
      );
    });

    it("should call onCritical when usage exceeds critical threshold", async () => {
      const heapLimit = 2 * 1024 * 1024 * 1024;
      const heapUsed = heapLimit * 0.95; // 95% usage
      mockSupportedBrowser({
        usedJSHeapSize: heapUsed,
        totalJSHeapSize: heapLimit,
        jsHeapSizeLimit: heapLimit,
      });

      const onCritical = vi.fn();

      renderHook(() =>
        useMemoryMonitorHeadless({
          warningThreshold: 70,
          criticalThreshold: 90,
          interval: 50,
          onCritical,
        })
      );

      await waitFor(
        () => {
          expect(onCritical).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      expect(onCritical).toHaveBeenCalledWith(
        expect.objectContaining({
          usagePercentage: expect.any(Number),
          threshold: 90,
          timestamp: expect.any(Number),
        })
      );
    });

    it("should only call warning callback once per severity transition", async () => {
      const heapLimit = 2 * 1024 * 1024 * 1024;
      const heapUsed = heapLimit * 0.75;
      mockSupportedBrowser({
        usedJSHeapSize: heapUsed,
        totalJSHeapSize: heapLimit,
        jsHeapSizeLimit: heapLimit,
      });

      const onWarning = vi.fn();

      renderHook(() =>
        useMemoryMonitorHeadless({
          warningThreshold: 70,
          interval: 50,
          onWarning,
        })
      );

      // Wait for callback
      await waitFor(
        () => {
          expect(onWarning).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      // Wait more and ensure it's only called once
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(onWarning).toHaveBeenCalledTimes(1);
    });
  });

  describe("Return values", () => {
    it("should return correct severity based on usage", async () => {
      const heapLimit = 2 * 1024 * 1024 * 1024;

      // Test normal severity (50% usage)
      mockSupportedBrowser({
        usedJSHeapSize: heapLimit * 0.5,
        totalJSHeapSize: heapLimit,
        jsHeapSizeLimit: heapLimit,
      });

      const { result } = renderHook(() =>
        useMemoryMonitorHeadless({
          warningThreshold: 70,
          criticalThreshold: 90,
          interval: 50,
        })
      );

      await waitFor(
        () => {
          expect(result.current.usagePercentage).not.toBeNull();
        },
        { timeout: 3000 }
      );

      expect(result.current.severity).toBe("normal");
    });

    it("should return memory data", async () => {
      mockSupportedBrowser({
        usedJSHeapSize: 100 * 1024 * 1024,
        totalJSHeapSize: 200 * 1024 * 1024,
        jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
      });

      const { result } = renderHook(() =>
        useMemoryMonitorHeadless({ interval: 50 })
      );

      await waitFor(
        () => {
          expect(result.current.memory).not.toBeNull();
        },
        { timeout: 3000 }
      );

      expect(result.current.memory?.heapUsed).toBe(100 * 1024 * 1024);
      expect(result.current.memory?.heapTotal).toBe(200 * 1024 * 1024);
      expect(result.current.memory?.heapLimit).toBe(2 * 1024 * 1024 * 1024);
    });

    it("should return usagePercentage", async () => {
      const heapLimit = 1000;
      const heapUsed = 500; // 50%
      mockSupportedBrowser({
        usedJSHeapSize: heapUsed,
        totalJSHeapSize: heapLimit,
        jsHeapSizeLimit: heapLimit,
      });

      const { result } = renderHook(() =>
        useMemoryMonitorHeadless({ interval: 50 })
      );

      await waitFor(
        () => {
          expect(result.current.usagePercentage).not.toBeNull();
        },
        { timeout: 3000 }
      );

      expect(result.current.usagePercentage).toBe(50);
    });

    it("should provide requestGC function", () => {
      const { result } = renderHook(() => useMemoryMonitorHeadless());

      expect(typeof result.current.requestGC).toBe("function");
    });

    it("should return isSupported", () => {
      mockSupportedBrowser();
      const { result } = renderHook(() => useMemoryMonitorHeadless());

      expect(result.current.isSupported).toBe(true);
    });
  });
});
