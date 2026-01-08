/**
 * Memory information at a point in time
 */
export interface MemoryInfo {
  /** Used JS heap size in bytes */
  heapUsed: number;
  /** Total JS heap size in bytes */
  heapTotal: number;
  /** JS heap size limit in bytes */
  heapLimit: number;
  /** Timestamp when this measurement was taken */
  timestamp: number;
}

/**
 * A named memory snapshot for comparison
 */
export interface MemorySnapshot {
  /** Unique identifier for this snapshot */
  id: string;
  /** Memory information at snapshot time */
  memory: MemoryInfo;
  /** Number of DOM nodes (if tracking enabled) */
  domNodes?: number;
  /** Estimated event listener count (if tracking enabled) */
  eventListeners?: number;
  /** Timestamp when snapshot was taken */
  timestamp: number;
}

/**
 * Result of comparing two memory snapshots
 */
export interface SnapshotDiff {
  /** Difference in heap usage (bytes) */
  heapDelta: number;
  /** Percentage change in heap usage */
  heapPercentChange: number;
  /** Difference in DOM node count */
  domNodesDelta?: number;
  /** Difference in event listener count */
  eventListenersDelta?: number;
  /** Time elapsed between snapshots (ms) */
  timeDelta: number;
}

/**
 * Result of memory leak analysis
 */
export interface LeakAnalysis {
  /** Whether a memory leak is detected */
  isLeaking: boolean;
  /** Probability of memory leak (0-100) */
  probability: number;
  /** Memory usage trend */
  trend: Trend;
  /** Average memory growth per interval (bytes) */
  averageGrowth: number;
  /** R-squared value indicating regression fit quality (0-1) */
  rSquared: number;
  /** Samples used for analysis */
  samples: MemoryInfo[];
  /** Human-readable recommendation */
  recommendation?: string;
}

/**
 * Information about why memory monitoring is not supported
 */
export interface UnsupportedInfo {
  /** Reason for lack of support */
  reason: UnsupportedReason;
  /** Browser name if detected */
  browser?: string;
  /** Available fallback strategies */
  availableFallbacks: FallbackStrategy[];
}

/**
 * Reason why memory API is not supported
 */
export type UnsupportedReason =
  | "no-api"
  | "server-side"
  | "insecure-context"
  | "browser-restriction";

/**
 * Level of memory API support
 */
export type SupportLevel = "full" | "partial" | "none";

/**
 * Available memory metrics based on browser support
 */
export type AvailableMetric =
  | "heapUsed"
  | "heapTotal"
  | "heapLimit"
  | "domNodes"
  | "eventListeners";

/**
 * Memory usage severity level
 */
export type Severity = "normal" | "warning" | "critical";

/**
 * Memory usage trend direction
 */
export type Trend = "stable" | "increasing" | "decreasing";

/**
 * Fallback strategy for unsupported browsers
 */
export type FallbackStrategy = "none" | "estimation" | "dom-only";

/**
 * Leak detection sensitivity level
 */
export type LeakSensitivity = "low" | "medium" | "high";

/**
 * Warning data passed to onWarning callback
 */
export interface MemoryWarning {
  /** Current memory info */
  memory: MemoryInfo;
  /** Current usage percentage */
  usagePercentage: number;
  /** Warning threshold that was exceeded */
  threshold: number;
  /** Timestamp of warning */
  timestamp: number;
}

/**
 * Critical alert data passed to onCritical callback
 */
export interface MemoryCritical {
  /** Current memory info */
  memory: MemoryInfo;
  /** Current usage percentage */
  usagePercentage: number;
  /** Critical threshold that was exceeded */
  threshold: number;
  /** Timestamp of critical alert */
  timestamp: number;
}

/**
 * Browser support detection result
 */
export interface BrowserSupport {
  /** Level of support */
  level: SupportLevel;
  /** Available metrics in this browser */
  availableMetrics: AvailableMetric[];
  /** Any limitations or caveats */
  limitations: string[];
  /** Whether secure context requirements are met */
  isSecureContext: boolean;
  /** Whether cross-origin isolated */
  isCrossOriginIsolated: boolean;
  /** Whether precise memory API is available */
  hasPreciseMemoryAPI: boolean;
}

/**
 * Formatted memory values for display
 */
export interface FormattedMemory {
  /** Formatted heap used (e.g., "45.2 MB") */
  heapUsed: string;
  /** Formatted heap total (e.g., "100 MB") */
  heapTotal: string;
  /** Formatted heap limit (e.g., "2 GB") */
  heapLimit: string;
  /** Formatted DOM node count */
  domNodes?: string;
  /** Formatted event listener count */
  eventListeners?: string;
}

/**
 * Leak detection configuration
 */
export interface LeakDetectionOptions {
  /** Enable leak detection */
  enabled?: boolean;
  /** Detection sensitivity */
  sensitivity?: LeakSensitivity;
  /** Number of samples to analyze */
  windowSize?: number;
  /** Custom growth rate threshold (bytes/sample) */
  threshold?: number;
}

/**
 * Threshold configuration for alerts
 */
export interface ThresholdOptions {
  /** Warning threshold percentage (0-100) */
  warning?: number;
  /** Critical threshold percentage (0-100) */
  critical?: number;
}

/**
 * Configuration options for useMemoryMonitor hook
 */
export interface UseMemoryMonitorOptions {
  // Basic Settings
  /** Monitoring interval in milliseconds (default: 5000) */
  interval?: number;
  /** Auto-start monitoring on mount (default: true) */
  autoStart?: boolean;
  /** Enable monitoring (default: true) */
  enabled?: boolean;

  // History
  /** Enable history recording (default: false) */
  enableHistory?: boolean;
  /** Maximum history size (default: 50) */
  historySize?: number;

  // Thresholds
  /** Threshold configuration for warnings/alerts */
  thresholds?: ThresholdOptions;

  // Leak Detection
  /** Leak detection configuration */
  leakDetection?: LeakDetectionOptions;

  // Development Features
  /** Enable development mode features (default: false) */
  devMode?: boolean;
  /** Track DOM node count (default: false) */
  trackDOMNodes?: boolean;
  /** Track event listener count (default: false) */
  trackEventListeners?: boolean;
  /** Log updates to console (default: false) */
  logToConsole?: boolean;

  // Callbacks
  /** Called on each memory update */
  onUpdate?: (memory: MemoryInfo) => void;
  /** Called when warning threshold is exceeded */
  onWarning?: (data: MemoryWarning) => void;
  /** Called when critical threshold is exceeded */
  onCritical?: (data: MemoryCritical) => void;
  /** Called when memory leak is detected */
  onLeakDetected?: (analysis: LeakAnalysis) => void;
  /** Called when monitoring is not supported */
  onUnsupported?: (info: UnsupportedInfo) => void;

  // Advanced Settings
  /** Disable in production builds (default: false) */
  disableInProduction?: boolean;
  /** Fallback strategy for unsupported browsers (default: 'dom-only') */
  fallbackStrategy?: FallbackStrategy;
}

/**
 * Return type for useMemoryMonitor hook
 */
export interface UseMemoryMonitorReturn {
  // Current State
  /** Current memory information (null if unsupported) */
  memory: MemoryInfo | null;
  /** Used JS heap in bytes (null if unsupported) */
  heapUsed: number | null;
  /** Total JS heap in bytes (null if unsupported) */
  heapTotal: number | null;
  /** JS heap limit in bytes (null if unsupported) */
  heapLimit: number | null;
  /** Memory usage percentage (null if unsupported) */
  usagePercentage: number | null;

  // DOM Related
  /** Current DOM node count (null if not tracking) */
  domNodes: number | null;
  /** Estimated event listener count (null if not tracking) */
  eventListeners: number | null;

  // Status Flags
  /** Whether memory API is supported */
  isSupported: boolean;
  /** Whether monitoring is currently active */
  isMonitoring: boolean;
  /** Whether a memory leak is detected */
  isLeakDetected: boolean;
  /** Current severity level */
  severity: Severity;

  // Support Details
  /** Level of API support */
  supportLevel: SupportLevel;
  /** List of available metrics */
  availableMetrics: AvailableMetric[];

  // Analysis Data
  /** Memory history array (empty if history disabled) */
  history: MemoryInfo[];
  /** Memory usage trend */
  trend: Trend;
  /** Probability of memory leak (0-100) */
  leakProbability: number;

  // Actions
  /** Start monitoring */
  start: () => void;
  /** Stop monitoring */
  stop: () => void;
  /** Take a named snapshot */
  takeSnapshot: (id: string) => MemorySnapshot | null;
  /** Compare two snapshots */
  compareSnapshots: (id1: string, id2: string) => SnapshotDiff | null;
  /** Clear history */
  clearHistory: () => void;
  /** Request garbage collection hint */
  requestGC: () => void;

  // Formatting
  /** Formatted memory values for display */
  formatted: FormattedMemory;
}

/**
 * Internal memory store state
 */
export interface MemoryStoreState {
  memory: MemoryInfo | null;
  domNodes: number | null;
  eventListeners: number | null;
  isMonitoring: boolean;
  severity: Severity;
  lastUpdated: number;
}
