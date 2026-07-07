import type { PanelSettings, TriggerPosition, Severity, SnapshotSettings, SnapshotScheduleInterval } from "./types";

/**
 * Severity color scheme type (CSS values, not Tailwind classes)
 */
export interface SeverityColorScheme {
  bg: string;
  bgDark: string;
  border: string;
  borderDark: string;
  text: string;
  textDark: string;
  accent: string;
  accentRgb: string;
}

/**
 * Default storage key for settings persistence
 */
export const DEFAULT_STORAGE_KEY = "memory-monitor-panel-settings";

/**
 * Default panel settings
 */
export const DEFAULT_SETTINGS: PanelSettings = {
  warningThreshold: 70,
  criticalThreshold: 90,
  autoGCThreshold: null,
  enableAutoGC: false,
  interval: 1000,
  theme: "system",
  panelWidth: 400,
  snapshot: {
    maxSnapshots: 10,
    scheduleInterval: "off",
    autoDeleteOldest: true,
  },
  historySize: 50,
};

/**
 * History size constraints
 */
export const HISTORY_SIZE_LIMITS = {
  min: 10,
  max: 200,
  default: 50,
} as const;

/**
 * Default trigger button position
 */
export const DEFAULT_TRIGGER_POSITION: TriggerPosition = {
  bottom: 20,
  right: 20,
};

/**
 * Panel dimension constraints
 */
export const PANEL_DIMENSIONS = {
  minWidth: 420,
  maxWidth: 600,
  defaultWidth: 420,
} as const;

/**
 * Animation durations in milliseconds
 */
export const ANIMATION_DURATION = {
  panelSlide: 300,
  sectionCollapse: 200,
  chartUpdate: 300,
  alertFade: 150,
} as const;

/**
 * Auto-GC cooldown period in milliseconds
 */
export const AUTO_GC_COOLDOWN_MS = 10000;

/**
 * Default maximum number of snapshots to store
 */
export const DEFAULT_MAX_SNAPSHOTS = 10;

/**
 * Maximum allowed snapshots limit
 */
export const MAX_SNAPSHOTS_LIMIT = 50;

/**
 * Minimum allowed snapshots
 */
export const MIN_SNAPSHOTS_LIMIT = 1;

/**
 * Snapshot schedule options with their interval in milliseconds
 */
export const SNAPSHOT_SCHEDULE_OPTIONS: readonly {
  label: string;
  value: SnapshotScheduleInterval;
  intervalMs: number;
}[] = [
  { label: "Off", value: "off", intervalMs: 0 },
  { label: "Every 1 sec", value: "1sec", intervalMs: 1000 },
  { label: "Every 10 sec", value: "10sec", intervalMs: 10 * 1000 },
  { label: "Every 1 min", value: "1min", intervalMs: 60 * 1000 },
  { label: "Every 5 min", value: "5min", intervalMs: 5 * 60 * 1000 },
  { label: "Every 10 min", value: "10min", intervalMs: 10 * 60 * 1000 },
  { label: "Every 30 min", value: "30min", intervalMs: 30 * 60 * 1000 },
  { label: "Every 1 hour", value: "1hour", intervalMs: 60 * 60 * 1000 },
  { label: "Every 6 hours", value: "6hour", intervalMs: 6 * 60 * 60 * 1000 },
  { label: "Every 24 hours", value: "24hour", intervalMs: 24 * 60 * 60 * 1000 },
] as const;

/**
 * Default snapshot settings
 */
export const DEFAULT_SNAPSHOT_SETTINGS: SnapshotSettings = {
  maxSnapshots: DEFAULT_MAX_SNAPSHOTS,
  scheduleInterval: "off",
  autoDeleteOldest: true,
};

/**
 * @deprecated Use DEFAULT_MAX_SNAPSHOTS instead
 * Maximum number of snapshots to store (legacy)
 */
export const MAX_SNAPSHOTS = DEFAULT_MAX_SNAPSHOTS;

/**
 * Polling interval options in milliseconds
 */
export const INTERVAL_OPTIONS = [
  { label: "500ms", value: 500 },
  { label: "1s", value: 1000 },
  { label: "2s", value: 2000 },
  { label: "5s", value: 5000 },
  { label: "10s", value: 10000 },
] as const;

/**
 * Color scheme for severity levels (CSS hex values)
 */
export const SEVERITY_COLORS: Record<Severity, SeverityColorScheme> = {
  normal: {
    bg: "#f0fdf4",           // green-50
    bgDark: "#052e16",       // green-950
    border: "#bbf7d0",       // green-200
    borderDark: "#166534",   // green-800
    text: "#15803d",         // green-700
    textDark: "#86efac",     // green-300
    accent: "#22c55e",       // green-500
    accentRgb: "34, 197, 94",
  },
  warning: {
    bg: "#fffbeb",           // amber-50
    bgDark: "#451a03",       // amber-950
    border: "#fde68a",       // amber-200
    borderDark: "#92400e",   // amber-800
    text: "#b45309",         // amber-700
    textDark: "#fcd34d",     // amber-300
    accent: "#f59e0b",       // amber-500
    accentRgb: "245, 158, 11",
  },
  critical: {
    bg: "#fef2f2",           // red-50
    bgDark: "#450a0a",       // red-950
    border: "#fecaca",       // red-200
    borderDark: "#991b1b",   // red-800
    text: "#b91c1c",         // red-700
    textDark: "#fca5a5",     // red-300
    accent: "#ef4444",       // red-500
    accentRgb: "239, 68, 68",
  },
};

/**
 * Chart color palette
 */
export const CHART_COLORS = {
  primary: "#6366f1", // indigo-500
  primaryLight: "#818cf8", // indigo-400
  secondary: "#a855f7", // purple-500
  secondaryLight: "#c084fc", // purple-400
  success: "#22c55e", // green-500
  warning: "#f59e0b", // amber-500
  danger: "#ef4444", // red-500
  gray: "#9ca3af", // gray-400
  grayLight: "#e5e7eb", // gray-200
  grayDark: "#4b5563", // gray-600
} as const;

/**
 * Trend colors
 */
export const TREND_COLORS = {
  increasing: CHART_COLORS.danger,
  decreasing: CHART_COLORS.success,
  stable: CHART_COLORS.gray,
} as const;

/**
 * Default keyboard shortcut
 */
export const DEFAULT_SHORTCUT = "ctrl+shift+m";

/**
 * Z-index defaults
 */
export const Z_INDEX = {
  trigger: 9998,
  panel: 9999,
  overlay: 9997,
} as const;

/**
 * Tab configuration
 */
export const PANEL_TABS = [
  { id: "overview", label: "Overview", icon: "chart" },
  { id: "history", label: "History", icon: "clock" },
  { id: "snapshots", label: "Snapshots", icon: "camera" },
  { id: "settings", label: "Settings", icon: "cog" },
] as const;

/**
 * Leak sensitivity thresholds
 */
export const LEAK_SENSITIVITY_THRESHOLDS = {
  low: { minSamples: 10, threshold: 0.8 },
  medium: { minSamples: 5, threshold: 0.6 },
  high: { minSamples: 3, threshold: 0.4 },
} as const;

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return "N/A";
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  return `${value.toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num: number | null | undefined): string {
  if (num == null) return "N/A";
  return num.toLocaleString();
}

/**
 * Format percentage
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value == null) return "N/A";
  return `${value.toFixed(1)}%`;
}

/**
 * Format timestamp to locale time string
 */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
