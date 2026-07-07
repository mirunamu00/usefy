// Main Component
export { MemoryMonitor } from "./MemoryMonitor";

// Backwards compatibility alias
export { MemoryMonitor as MemoryMonitorPanel } from "./MemoryMonitor";

// Headless Hook (for production use without UI)
export { useMemoryMonitorHeadless } from "./MemoryMonitorHeadless";

// Types
export type {
  // Main component props
  MemoryMonitorProps,
  MemoryMonitorHeadlessOptions,
  MemoryMonitorHeadlessReturn,

  // Backwards compatibility alias
  MemoryMonitorProps as MemoryMonitorPanelProps,

  // Panel types
  PanelMode,
  PanelPosition,
  PanelTab,
  PanelSettings,
  PanelState,
  PanelSnapshot,
  ThemeSetting,
  TriggerPosition,
  LeakSensitivity,

  // Callback data types
  AutoGCEventData,
  MemoryWarningData,
  MemoryCriticalData,
  LeakAnalysisData,

  // Re-exported from @usefy/use-memory-monitor
  MemoryInfo,
  MemoryWarning,
  MemoryCritical,
  LeakAnalysis,
  MemorySnapshot,
  SnapshotDiff,
  Severity,
  Trend,
  SupportLevel,
  FormattedMemory,
  AvailableMetric,
} from "./types";

// Constants (for customization)
export {
  DEFAULT_SETTINGS,
  DEFAULT_TRIGGER_POSITION,
  DEFAULT_STORAGE_KEY,
  DEFAULT_SHORTCUT,
  PANEL_DIMENSIONS,
  ANIMATION_DURATION,
  AUTO_GC_COOLDOWN_MS,
  MAX_SNAPSHOTS,
  INTERVAL_OPTIONS,
  SEVERITY_COLORS,
  CHART_COLORS,
  TREND_COLORS,
  Z_INDEX,
  PANEL_TABS,

  // Formatting helpers
  formatBytes,
  formatNumber,
  formatPercentage,
  formatTime,
} from "./constants";

// Hooks (for advanced usage)
export { useKeyboardShortcut, useEscapeKey } from "./hooks/useKeyboardShortcut";
export { usePanelState } from "./hooks/usePanelState";
export type { UsePanelStateOptions, UsePanelStateReturn } from "./hooks/usePanelState";
export { useSettings } from "./hooks/useSettings";
export type { UseSettingsOptions, UseSettingsReturn } from "./hooks/useSettings";
export { useAutoGC } from "./hooks/useAutoGC";
export type { UseAutoGCOptions, UseAutoGCReturn } from "./hooks/useAutoGC";
export { useTheme } from "./hooks/useTheme";
export type { UseThemeOptions, UseThemeReturn, ResolvedTheme } from "./hooks/useTheme";

// Utilities (for advanced usage)
export {
  isBrowser,
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  safeGetJSON,
  safeSetJSON,
} from "./utils/storage";
export {
  isSSR,
  isDevelopment,
  isProduction,
  getShouldRender,
  getShouldActivate,
} from "./utils/environment";
