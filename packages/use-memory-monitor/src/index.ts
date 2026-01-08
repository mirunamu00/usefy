// Main hook
export { useMemoryMonitor } from "./useMemoryMonitor";

// Types
export type {
  // Core types
  MemoryInfo,
  MemorySnapshot,
  SnapshotDiff,
  LeakAnalysis,
  UnsupportedInfo,

  // Configuration types
  UseMemoryMonitorOptions,
  UseMemoryMonitorReturn,
  LeakDetectionOptions,
  ThresholdOptions,

  // Callback data types
  MemoryWarning,
  MemoryCritical,

  // Enum/union types
  SupportLevel,
  AvailableMetric,
  Severity,
  Trend,
  FallbackStrategy,
  LeakSensitivity,
  UnsupportedReason,

  // Display types
  FormattedMemory,
  BrowserSupport,
} from "./types";

// Utilities (for advanced usage)
export {
  formatBytes,
  formatPercentage,
  formatNumber,
  formatDuration,
  calculateUsagePercentage,
} from "./utils/formatting";

export {
  detectSupport,
  isServer,
  isClient,
  hasLegacyMemoryAPI,
  hasPreciseMemoryAPI,
  canMonitorMemory,
  detectBrowser,
} from "./utils/detection";

export { CircularBuffer } from "./utils/circularBuffer";

export {
  linearRegression,
  calculateTrend,
  analyzeLeakProbability,
  type RegressionResult,
} from "./utils/leakDetection";
