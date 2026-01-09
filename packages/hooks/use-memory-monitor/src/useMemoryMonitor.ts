import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import type {
  AvailableMetric,
  FormattedMemory,
  LeakAnalysis,
  MemoryCritical,
  MemoryInfo,
  MemorySnapshot,
  MemoryWarning,
  Severity,
  SnapshotDiff,
  SupportLevel,
  Trend,
  UseMemoryMonitorOptions,
  UseMemoryMonitorReturn,
} from "./types";
import {
  DEFAULT_OPTIONS,
  DEFAULT_SEVERITY,
  DEFAULT_TREND,
  SSR_FORMATTED_MEMORY,
} from "./constants";
import {
  createStore,
  readMemoryFromAPI,
  countDOMNodes,
  estimateEventListeners,
  type MemoryStore,
} from "./store";
import {
  isServer,
  detectSupport,
  createUnsupportedInfo,
  hasLegacyMemoryAPI,
} from "./utils/detection";
import {
  createFormattedMemory,
  calculateUsagePercentage,
} from "./utils/formatting";
import { CircularBuffer } from "./utils/circularBuffer";
import { analyzeLeakProbability, calculateTrend } from "./utils/leakDetection";

/**
 * A React hook for monitoring browser memory usage in real-time.
 * Detects memory leaks, provides threshold alerts, and supports snapshot comparison.
 *
 * Features:
 * - Real-time memory tracking (JS Heap, DOM Nodes)
 * - Memory leak detection with configurable sensitivity
 * - Threshold-based warnings (warning/critical levels)
 * - Memory snapshot comparison
 * - SSR compatible
 * - Graceful degradation for unsupported browsers
 *
 * @param options - Configuration options
 * @returns Memory monitoring state and control functions
 *
 * @example
 * ```tsx
 * // Basic usage
 * function MemoryDisplay() {
 *   const { heapUsed, formatted, isSupported } = useMemoryMonitor();
 *
 *   if (!isSupported) {
 *     return <p>Memory monitoring not available</p>;
 *   }
 *
 *   return <p>Memory: {formatted.heapUsed}</p>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With leak detection
 * const monitor = useMemoryMonitor({
 *   enableHistory: true,
 *   leakDetection: { enabled: true, sensitivity: 'medium' },
 *   onLeakDetected: (analysis) => {
 *     console.warn('Leak detected:', analysis);
 *   },
 * });
 * ```
 *
 * @example
 * ```tsx
 * // With threshold alerts
 * const monitor = useMemoryMonitor({
 *   thresholds: { warning: 70, critical: 90 },
 *   onWarning: (data) => console.warn('Memory warning:', data),
 *   onCritical: (data) => console.error('Memory critical:', data),
 * });
 * ```
 */
export function useMemoryMonitor(
  options: UseMemoryMonitorOptions = {}
): UseMemoryMonitorReturn {
  // Merge options with defaults
  const mergedOptions = useMemo(
    () => ({
      ...DEFAULT_OPTIONS,
      ...options,
      thresholds: {
        ...DEFAULT_OPTIONS.thresholds,
        ...options.thresholds,
      },
      leakDetection: {
        ...DEFAULT_OPTIONS.leakDetection,
        ...options.leakDetection,
      },
    }),
    [options]
  );

  const {
    interval,
    autoStart,
    enabled,
    enableHistory,
    historySize,
    thresholds,
    leakDetection,
    devMode,
    trackDOMNodes,
    trackEventListeners,
    logToConsole,
    disableInProduction,
    fallbackStrategy,
  } = mergedOptions;

  // Check if we should disable in production
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shouldDisable = disableInProduction && typeof (globalThis as any).process !== "undefined" && (globalThis as any).process?.env?.NODE_ENV === "production";

  // Store refs for callbacks to avoid re-renders
  const onUpdateRef = useRef(options.onUpdate);
  const onWarningRef = useRef(options.onWarning);
  const onCriticalRef = useRef(options.onCritical);
  const onLeakDetectedRef = useRef(options.onLeakDetected);
  const onUnsupportedRef = useRef(options.onUnsupported);

  // Update refs when callbacks change
  useEffect(() => {
    onUpdateRef.current = options.onUpdate;
    onWarningRef.current = options.onWarning;
    onCriticalRef.current = options.onCritical;
    onLeakDetectedRef.current = options.onLeakDetected;
    onUnsupportedRef.current = options.onUnsupported;
  }, [options.onUpdate, options.onWarning, options.onCritical, options.onLeakDetected, options.onUnsupported]);

  // Detect browser support
  const browserSupport = useMemo(() => detectSupport(), []);

  // Create store instance (persists across renders)
  const storeRef = useRef<MemoryStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = createStore();
  }
  const store = storeRef.current;

  // Subscribe to store using useSyncExternalStore
  const storeState = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );

  // History buffer
  const historyBufferRef = useRef<CircularBuffer<MemoryInfo> | null>(null);
  if (enableHistory && !historyBufferRef.current) {
    historyBufferRef.current = new CircularBuffer<MemoryInfo>(historySize);
  }

  // Snapshot storage
  const snapshotsRef = useRef<Map<string, MemorySnapshot>>(new Map());

  // Interval ID ref
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Previous severity for callback deduplication
  const prevSeverityRef = useRef<Severity>(DEFAULT_SEVERITY);

  // Previous leak status for callback deduplication
  const prevLeakDetectedRef = useRef<boolean>(false);

  // Monitoring state ref
  const isMonitoringRef = useRef<boolean>(false);

  // Determine if monitoring is supported
  const isSupported = useMemo(() => {
    if (isServer()) return false;
    if (shouldDisable) return false;

    if (fallbackStrategy === "none") {
      return hasLegacyMemoryAPI();
    }

    // With fallback strategies, we can always provide some monitoring
    return true;
  }, [shouldDisable, fallbackStrategy]);

  // Determine support level
  const supportLevel: SupportLevel = useMemo(() => {
    if (!isSupported) return "none";
    return browserSupport.level;
  }, [isSupported, browserSupport.level]);

  // Available metrics
  const availableMetrics: AvailableMetric[] = useMemo(() => {
    if (!isSupported) return [];
    return browserSupport.availableMetrics;
  }, [isSupported, browserSupport.availableMetrics]);

  // Calculate derived values
  const memory = storeState.memory;
  const heapUsed = memory?.heapUsed ?? null;
  const heapTotal = memory?.heapTotal ?? null;
  const heapLimit = memory?.heapLimit ?? null;
  const usagePercentage = calculateUsagePercentage(heapUsed, heapLimit);
  const domNodes = storeState.domNodes;
  const eventListeners = storeState.eventListeners;

  // Calculate severity based on thresholds
  const severity = useMemo((): Severity => {
    if (usagePercentage === null) return DEFAULT_SEVERITY;

    if (usagePercentage >= (thresholds.critical ?? 90)) {
      return "critical";
    }

    if (usagePercentage >= (thresholds.warning ?? 70)) {
      return "warning";
    }

    return "normal";
  }, [usagePercentage, thresholds.critical, thresholds.warning]);

  // Calculate history and trend
  const history = useMemo(() => {
    if (!enableHistory || !historyBufferRef.current) return [];
    return historyBufferRef.current.toArray();
  }, [enableHistory, storeState.lastUpdated]);

  const trend: Trend = useMemo(() => {
    if (!enableHistory || history.length < 3) return DEFAULT_TREND;
    return calculateTrend(history);
  }, [enableHistory, history]);

  // Leak analysis
  const leakAnalysis = useMemo((): LeakAnalysis | null => {
    if (!leakDetection.enabled || !enableHistory) return null;

    const windowSize = leakDetection.windowSize ?? 10;
    const samples = historyBufferRef.current?.getRecent(windowSize) ?? [];

    if (samples.length < 5) return null;

    return analyzeLeakProbability(
      samples,
      leakDetection.sensitivity ?? "medium",
      leakDetection.threshold
    );
  }, [
    leakDetection.enabled,
    leakDetection.sensitivity,
    leakDetection.windowSize,
    leakDetection.threshold,
    enableHistory,
    history,
  ]);

  const isLeakDetected = leakAnalysis?.isLeaking ?? false;
  const leakProbability = leakAnalysis?.probability ?? 0;

  // Formatted values
  const formatted: FormattedMemory = useMemo(() => {
    if (!isSupported) return SSR_FORMATTED_MEMORY;
    return createFormattedMemory(memory, domNodes, eventListeners);
  }, [isSupported, memory, domNodes, eventListeners]);

  // Poll function
  const poll = useCallback(() => {
    if (!isSupported || !enabled) return;

    // Read memory
    const newMemory = readMemoryFromAPI();

    if (newMemory) {
      store.updateMemory(newMemory);

      // Add to history
      if (enableHistory && historyBufferRef.current) {
        historyBufferRef.current.push(newMemory);
      }

      // Call onUpdate callback
      onUpdateRef.current?.(newMemory);

      // Log to console in dev mode
      if (logToConsole && devMode) {
        console.log("[useMemoryMonitor]", {
          heapUsed: newMemory.heapUsed,
          heapTotal: newMemory.heapTotal,
          heapLimit: newMemory.heapLimit,
        });
      }
    }

    // Track DOM nodes if enabled
    if (trackDOMNodes) {
      const nodeCount = countDOMNodes();
      store.updateDOMNodes(nodeCount);
    }

    // Track event listeners if enabled
    if (trackEventListeners) {
      const listenerCount = estimateEventListeners();
      store.updateEventListeners(listenerCount);
    }
  }, [
    isSupported,
    enabled,
    store,
    enableHistory,
    trackDOMNodes,
    trackEventListeners,
    logToConsole,
    devMode,
  ]);

  // Start monitoring
  const start = useCallback(() => {
    if (!isSupported || !enabled || isMonitoringRef.current) return;

    isMonitoringRef.current = true;
    store.updateMonitoringStatus(true);

    // Initial poll
    poll();

    // Set up interval
    intervalIdRef.current = setInterval(poll, interval);

    if (devMode && logToConsole) {
      console.log("[useMemoryMonitor] Monitoring started");
    }
  }, [isSupported, enabled, store, poll, interval, devMode, logToConsole]);

  // Stop monitoring
  const stop = useCallback(() => {
    if (!isMonitoringRef.current) return;

    isMonitoringRef.current = false;
    store.updateMonitoringStatus(false);

    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    if (devMode && logToConsole) {
      console.log("[useMemoryMonitor] Monitoring stopped");
    }
  }, [store, devMode, logToConsole]);

  // Take snapshot
  const takeSnapshot = useCallback(
    (id: string): MemorySnapshot | null => {
      if (!isSupported || !memory) return null;

      const snapshot: MemorySnapshot = {
        id,
        memory: { ...memory },
        domNodes: domNodes ?? undefined,
        eventListeners: eventListeners ?? undefined,
        timestamp: Date.now(),
      };

      snapshotsRef.current.set(id, snapshot);
      return snapshot;
    },
    [isSupported, memory, domNodes, eventListeners]
  );

  // Compare snapshots
  const compareSnapshots = useCallback(
    (id1: string, id2: string): SnapshotDiff | null => {
      const snapshot1 = snapshotsRef.current.get(id1);
      const snapshot2 = snapshotsRef.current.get(id2);

      if (!snapshot1 || !snapshot2) return null;

      return {
        heapDelta: snapshot2.memory.heapUsed - snapshot1.memory.heapUsed,
        heapPercentChange:
          snapshot1.memory.heapUsed > 0
            ? ((snapshot2.memory.heapUsed - snapshot1.memory.heapUsed) /
                snapshot1.memory.heapUsed) *
              100
            : 0,
        domNodesDelta:
          snapshot1.domNodes != null && snapshot2.domNodes != null
            ? snapshot2.domNodes - snapshot1.domNodes
            : undefined,
        eventListenersDelta:
          snapshot1.eventListeners != null && snapshot2.eventListeners != null
            ? snapshot2.eventListeners - snapshot1.eventListeners
            : undefined,
        timeDelta: snapshot2.timestamp - snapshot1.timestamp,
      };
    },
    []
  );

  // Clear history
  const clearHistory = useCallback(() => {
    if (historyBufferRef.current) {
      historyBufferRef.current.clear();
    }
  }, []);

  // Request GC (hint only, NOT guaranteed in standard browsers)
  // JavaScript cannot force GC - this only works with --expose-gc flag
  const requestGC = useCallback(() => {
    if (isServer()) return;

    // Only works with Chrome/Node.js launched with --expose-gc flag
    // In standard browsers, gc() does not exist
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (globalThis as any).gc === "function") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any).gc();
        if (devMode && logToConsole) {
          console.log("[useMemoryMonitor] GC triggered via --expose-gc");
        }
        return;
      } catch {
        // gc() exists but failed
      }
    }

    // Note: No reliable fallback exists for standard browsers.
    // V8 engine controls GC timing based on its own heuristics.
    if (devMode && logToConsole) {
      console.warn(
        "[useMemoryMonitor] GC not available. " +
        "Use Chrome/Node.js with --expose-gc flag to enable manual GC."
      );
    }
  }, [devMode, logToConsole]);

  // Auto-start effect
  useEffect(() => {
    if (autoStart && isSupported && enabled && !shouldDisable) {
      start();
    }

    return () => {
      stop();
    };
  }, [autoStart, isSupported, enabled, shouldDisable, start, stop]);

  // Visibility change effect (pause when tab is hidden)
  useEffect(() => {
    if (isServer()) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stop();
      } else if (autoStart && isSupported && enabled) {
        start();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [autoStart, isSupported, enabled, start, stop]);

  // Severity change callback effect
  useEffect(() => {
    if (severity === prevSeverityRef.current) return;

    const prevSeverity = prevSeverityRef.current;
    prevSeverityRef.current = severity;

    if (!memory || !usagePercentage) return;

    const callbackData = {
      memory,
      usagePercentage,
      threshold: severity === "critical" ? (thresholds.critical ?? 90) : (thresholds.warning ?? 70),
      timestamp: Date.now(),
    };

    // Only call callback when severity increases
    if (severity === "warning" && prevSeverity === "normal") {
      onWarningRef.current?.(callbackData as MemoryWarning);
    } else if (severity === "critical") {
      onCriticalRef.current?.(callbackData as MemoryCritical);
    }
  }, [severity, memory, usagePercentage, thresholds.warning, thresholds.critical]);

  // Leak detection callback effect
  useEffect(() => {
    if (!leakAnalysis) return;

    if (isLeakDetected && !prevLeakDetectedRef.current) {
      onLeakDetectedRef.current?.(leakAnalysis);
    }

    prevLeakDetectedRef.current = isLeakDetected;
  }, [isLeakDetected, leakAnalysis]);

  // Unsupported callback effect
  useEffect(() => {
    if (!isSupported && onUnsupportedRef.current) {
      const unsupportedInfo = createUnsupportedInfo();
      onUnsupportedRef.current(unsupportedInfo);
    }
  }, [isSupported]);

  // SSR early return
  if (isServer()) {
    return {
      memory: null,
      heapUsed: null,
      heapTotal: null,
      heapLimit: null,
      usagePercentage: null,
      domNodes: null,
      eventListeners: null,
      isSupported: false,
      isMonitoring: false,
      isLeakDetected: false,
      severity: DEFAULT_SEVERITY,
      supportLevel: "none",
      availableMetrics: [],
      history: [],
      trend: DEFAULT_TREND,
      leakProbability: 0,
      start: () => {},
      stop: () => {},
      takeSnapshot: () => null,
      compareSnapshots: () => null,
      clearHistory: () => {},
      requestGC: () => {},
      formatted: SSR_FORMATTED_MEMORY,
    };
  }

  return {
    // Current State
    memory,
    heapUsed,
    heapTotal,
    heapLimit,
    usagePercentage,

    // DOM Related
    domNodes,
    eventListeners,

    // Status Flags
    isSupported,
    isMonitoring: storeState.isMonitoring,
    isLeakDetected,
    severity,

    // Support Details
    supportLevel,
    availableMetrics,

    // Analysis Data
    history,
    trend,
    leakProbability,

    // Actions
    start,
    stop,
    takeSnapshot,
    compareSnapshots,
    clearHistory,
    requestGC,

    // Formatting
    formatted,
  };
}
