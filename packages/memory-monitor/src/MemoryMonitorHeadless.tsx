import { useCallback, useEffect, useRef } from "react";
import { useMemoryMonitor } from "@usefy/use-memory-monitor";
import type {
  MemoryMonitorHeadlessOptions,
  MemoryMonitorHeadlessReturn,
  LeakAnalysisData,
} from "./types";
import { AUTO_GC_COOLDOWN_MS } from "./constants";

/**
 * Headless memory monitoring hook for production environments
 *
 * This hook provides memory monitoring functionality without any UI,
 * perfect for production environments where you want to track memory
 * usage and trigger callbacks without showing a visible panel.
 *
 * @example
 * ```tsx
 * function App() {
 *   const {
 *     memory,
 *     usagePercentage,
 *     severity,
 *     isLeakDetected,
 *     requestGC,
 *   } = useMemoryMonitorHeadless({
 *     warningThreshold: 70,
 *     criticalThreshold: 90,
 *     onWarning: (data) => {
 *       console.warn('Memory warning:', data);
 *       analytics.track('memory_warning', data);
 *     },
 *     onCritical: (data) => {
 *       console.error('Critical memory:', data);
 *       analytics.track('memory_critical', data);
 *     },
 *   });
 *
 *   return <YourApp />;
 * }
 * ```
 */
export function useMemoryMonitorHeadless(
  options: MemoryMonitorHeadlessOptions = {}
): MemoryMonitorHeadlessReturn {
  const {
    interval = 1000,
    enableHistory = false,
    historySize = 50,
    warningThreshold = 70,
    criticalThreshold = 90,
    autoGCThreshold = null,
    enableAutoGC = false,
    enableLeakDetection = false,
    leakSensitivity = "medium",
    onWarning,
    onCritical,
    onLeakDetected,
    onAutoGC,
  } = options;

  // Track last auto-GC timestamp for cooldown
  const lastAutoGCRef = useRef<number>(0);

  // Track if warning/critical callbacks have been fired for current state
  const warningFiredRef = useRef(false);
  const criticalFiredRef = useRef(false);

  // Use the core memory monitor hook
  const {
    memory,
    isSupported,
    usagePercentage,
    trend,
    leakProbability,
    requestGC,
  } = useMemoryMonitor({
    interval,
    enableHistory,
    historySize,
    leakDetection: {
      enabled: enableLeakDetection,
      sensitivity: leakSensitivity,
    },
  });

  // Calculate current severity
  const severity =
    usagePercentage !== null
      ? usagePercentage >= criticalThreshold
        ? "critical"
        : usagePercentage >= warningThreshold
          ? "warning"
          : "normal"
      : "normal";

  // Check if leak is detected
  const isLeakDetected =
    enableLeakDetection && trend === "increasing" && leakProbability >= 50;

  // Handle warning callback
  useEffect(() => {
    if (severity === "warning" && !warningFiredRef.current && onWarning) {
      warningFiredRef.current = true;
      onWarning({
        memory: {
          heapUsed: memory?.heapUsed ?? 0,
          heapTotal: memory?.heapTotal ?? 0,
          heapLimit: memory?.heapLimit ?? 0,
          timestamp: Date.now(),
        },
        usagePercentage: usagePercentage ?? 0,
        threshold: warningThreshold,
        timestamp: Date.now(),
      });
    } else if (severity !== "warning") {
      warningFiredRef.current = false;
    }
  }, [severity, memory, usagePercentage, warningThreshold, onWarning]);

  // Handle critical callback
  useEffect(() => {
    if (severity === "critical" && !criticalFiredRef.current && onCritical) {
      criticalFiredRef.current = true;
      onCritical({
        memory: {
          heapUsed: memory?.heapUsed ?? 0,
          heapTotal: memory?.heapTotal ?? 0,
          heapLimit: memory?.heapLimit ?? 0,
          timestamp: Date.now(),
        },
        usagePercentage: usagePercentage ?? 0,
        threshold: criticalThreshold,
        timestamp: Date.now(),
      });
    } else if (severity !== "critical") {
      criticalFiredRef.current = false;
    }
  }, [severity, memory, usagePercentage, criticalThreshold, onCritical]);

  // Handle leak detection callback
  useEffect(() => {
    if (isLeakDetected && onLeakDetected) {
      const analysis: LeakAnalysisData = {
        isLeaking: true,
        probability: leakProbability,
        trend,
        recommendation:
          leakProbability >= 70
            ? "High probability of memory leak. Check for unsubscribed subscriptions, detached event listeners, or closure leaks."
            : leakProbability >= 40
              ? "Moderate risk of memory leak. Monitor memory usage and consider taking snapshots to identify the source."
              : "Low risk of memory leak. Continue monitoring.",
      };
      onLeakDetected(analysis);
    }
  }, [isLeakDetected, leakProbability, trend, onLeakDetected]);

  // Handle auto-GC
  useEffect(() => {
    if (
      enableAutoGC &&
      autoGCThreshold !== null &&
      usagePercentage !== null &&
      usagePercentage >= autoGCThreshold
    ) {
      const now = Date.now();
      if (now - lastAutoGCRef.current >= AUTO_GC_COOLDOWN_MS) {
        lastAutoGCRef.current = now;
        requestGC();
        onAutoGC?.({
          threshold: autoGCThreshold,
          usage: usagePercentage,
          timestamp: now,
        });
      }
    }
  }, [enableAutoGC, autoGCThreshold, usagePercentage, requestGC, onAutoGC]);

  // Memoized requestGC
  const handleRequestGC = useCallback(() => {
    requestGC();
  }, [requestGC]);

  return {
    memory: memory
      ? {
          heapUsed: memory.heapUsed,
          heapTotal: memory.heapTotal,
          heapLimit: memory.heapLimit,
          timestamp: Date.now(),
        }
      : null,
    usagePercentage,
    severity,
    isLeakDetected,
    leakProbability,
    trend,
    requestGC: handleRequestGC,
    isSupported,
  };
}
