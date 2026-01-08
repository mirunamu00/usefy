// Browser detection utilities
export {
  isServer,
  isClient,
  hasLegacyMemoryAPI,
  hasPreciseMemoryAPI,
  isSecureContext,
  isCrossOriginIsolated,
  hasMutationObserver,
  detectBrowser,
  determineSupportLevel,
  getAvailableMetrics,
  getLimitations,
  detectSupport,
  getUnsupportedReason,
  getAvailableFallbacks,
  createUnsupportedInfo,
  canUsePreciseMemoryAPI,
  canMonitorMemory,
} from "./detection";

// Formatting utilities
export {
  formatBytes,
  formatPercentage,
  formatNumber,
  createFormattedMemory,
  calculateUsagePercentage,
  formatDuration,
} from "./formatting";

// Circular buffer for history
export { CircularBuffer } from "./circularBuffer";

// Leak detection utilities
export {
  linearRegression,
  calculateTrend,
  calculateAverageGrowth,
  generateRecommendation,
  analyzeLeakProbability,
  isMemoryGrowing,
  type RegressionResult,
} from "./leakDetection";
