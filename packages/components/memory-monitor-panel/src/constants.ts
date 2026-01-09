import type { PanelSettings, TriggerPosition, Severity } from "./types";

/**
 * Severity color scheme type
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
};

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
 * Maximum number of snapshots to store
 */
export const MAX_SNAPSHOTS = 10;

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
 * Color scheme for severity levels
 */
export const SEVERITY_COLORS: Record<Severity, SeverityColorScheme> = {
  normal: {
    bg: "bg-green-50",
    bgDark: "dark:bg-green-950",
    border: "border-green-200",
    borderDark: "dark:border-green-800",
    text: "text-green-700",
    textDark: "dark:text-green-300",
    accent: "#22c55e",
    accentRgb: "34, 197, 94",
  },
  warning: {
    bg: "bg-amber-50",
    bgDark: "dark:bg-amber-950",
    border: "border-amber-200",
    borderDark: "dark:border-amber-800",
    text: "text-amber-700",
    textDark: "dark:text-amber-300",
    accent: "#f59e0b",
    accentRgb: "245, 158, 11",
  },
  critical: {
    bg: "bg-red-50",
    bgDark: "dark:bg-red-950",
    border: "border-red-200",
    borderDark: "dark:border-red-800",
    text: "text-red-700",
    textDark: "dark:text-red-300",
    accent: "#ef4444",
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
