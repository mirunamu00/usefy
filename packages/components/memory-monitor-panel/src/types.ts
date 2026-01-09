import type { ReactNode } from "react";

// Re-export types from @usefy/use-memory-monitor
export type {
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
} from "@usefy/use-memory-monitor";

/**
 * Panel visibility mode
 */
export type PanelMode = "development" | "production" | "always" | "never";

/**
 * Panel position
 */
export type PanelPosition = "right" | "left";

/**
 * Theme setting
 */
export type ThemeSetting = "light" | "dark" | "system";

/**
 * Active tab in the panel
 */
export type PanelTab = "overview" | "history" | "snapshots" | "settings";

/**
 * Leak detection sensitivity
 */
export type LeakSensitivity = "low" | "medium" | "high";

/**
 * Trigger button position
 */
export interface TriggerPosition {
  top?: number | string;
  bottom?: number | string;
  right?: number | string;
  left?: number | string;
}

/**
 * Snapshot schedule interval options
 */
export type SnapshotScheduleInterval =
  | "off"      // Disabled
  | "1sec"     // Every 1 second (for testing)
  | "10sec"    // Every 10 seconds (for testing)
  | "1min"     // Every 1 minute
  | "5min"     // Every 5 minutes
  | "10min"    // Every 10 minutes
  | "30min"    // Every 30 minutes
  | "1hour"    // Every 1 hour
  | "6hour"    // Every 6 hours
  | "24hour";  // Every 24 hours

/**
 * Snapshot settings
 */
export interface SnapshotSettings {
  /** Maximum number of snapshots to store (1-50) */
  maxSnapshots: number;
  /** Automatic snapshot schedule interval */
  scheduleInterval: SnapshotScheduleInterval;
  /** Auto-delete oldest snapshot when max reached */
  autoDeleteOldest: boolean;
}

/**
 * Panel settings that can be persisted
 */
export interface PanelSettings {
  /** Warning threshold percentage (0-100) */
  warningThreshold: number;
  /** Critical threshold percentage (0-100) */
  criticalThreshold: number;
  /** Auto-GC threshold percentage (0-100), null to disable */
  autoGCThreshold: number | null;
  /** Enable auto-GC feature */
  enableAutoGC: boolean;
  /** Polling interval in milliseconds */
  interval: number;
  /** Theme setting */
  theme: ThemeSetting;
  /** Panel width in pixels */
  panelWidth: number;
  /** Snapshot configuration */
  snapshot: SnapshotSettings;
}

/**
 * Panel UI state
 */
export interface PanelState {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Currently active tab */
  activeTab: PanelTab;
  /** List of expanded section IDs */
  expandedSections: string[];
}

/**
 * Leak probability contributing factors
 */
export interface LeakProbabilityFactors {
  /** Contribution from memory growth slope (0-30) */
  slopeContribution: number;
  /** Contribution from regression fit quality (0-20) */
  rSquaredContribution: number;
  /** Contribution from GC ineffectiveness (0-25) */
  gcContribution: number;
  /** Contribution from observation duration (0-15) */
  timeContribution: number;
  /** Contribution from baseline growth (0-10) */
  baselineContribution: number;
}

/**
 * GC analysis data captured at snapshot time
 */
export interface SnapshotGCAnalysis {
  /** Number of GC events detected */
  gcEventCount: number;
  /** Average memory recovery ratio (0-1) */
  avgRecoveryRatio: number;
  /** Whether GC is effective (recovering significant memory) */
  isGCEffective: boolean;
}

/**
 * Baseline analysis data captured at snapshot time
 */
export interface SnapshotBaselineAnalysis {
  /** Established baseline heap (post-GC minimum) in bytes */
  baselineHeap: number;
  /** Growth ratio from baseline (0-1) */
  growthRatio: number;
  /** Whether growth is significant (above threshold) */
  isSignificantGrowth: boolean;
}

/**
 * Analysis context captured at the time of snapshot
 * Contains memory analysis state for comprehensive reporting
 */
export interface SnapshotAnalysisContext {
  // === Core Analysis ===
  /** Memory trend at snapshot time */
  trend: "stable" | "increasing" | "decreasing";
  /** Leak probability at snapshot time (0-100) */
  leakProbability: number;
  /** Severity level at snapshot time */
  severity: "normal" | "warning" | "critical";
  /** Usage percentage at snapshot time (0-100) */
  usagePercentage: number;

  // === Leak Factor Analysis (optional) ===
  /** Breakdown of leak probability contributing factors */
  leakFactors?: LeakProbabilityFactors;

  // === GC Analysis (optional) ===
  /** Garbage collection analysis data */
  gcAnalysis?: SnapshotGCAnalysis;

  // === Baseline Analysis (optional) ===
  /** Baseline memory analysis data */
  baselineAnalysis?: SnapshotBaselineAnalysis;

  // === Quality Metrics (optional) ===
  /** Confidence level of the analysis (0-100) */
  confidence?: number;
  /** R-squared value from regression analysis (0-1) */
  rSquared?: number;
  /** Average memory growth rate in bytes per sample */
  averageGrowth?: number;
}

/**
 * Snapshot with additional metadata
 */
export interface PanelSnapshot {
  id: string;
  label: string;
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  heapLimit: number;
  domNodes?: number;
  eventListeners?: number;
  notes?: string;
  /** Whether this snapshot was created automatically by scheduler */
  isAuto?: boolean;
  /** Analysis context captured at the time of snapshot */
  analysisContext?: SnapshotAnalysisContext;
}

/**
 * Auto-GC event data
 */
export interface AutoGCEventData {
  threshold: number;
  usage: number;
  timestamp: number;
}

/**
 * Memory warning callback data
 */
export interface MemoryWarningData {
  memory: {
    heapUsed: number;
    heapTotal: number;
    heapLimit: number;
    timestamp: number;
  };
  usagePercentage: number;
  threshold: number;
  timestamp: number;
}

/**
 * Memory critical callback data
 */
export interface MemoryCriticalData {
  memory: {
    heapUsed: number;
    heapTotal: number;
    heapLimit: number;
    timestamp: number;
  };
  usagePercentage: number;
  threshold: number;
  timestamp: number;
}

/**
 * Leak analysis data
 */
export interface LeakAnalysisData {
  isLeaking: boolean;
  probability: number;
  trend: "increasing" | "decreasing" | "stable";
  recommendation?: string;
}

/**
 * Props for MemoryMonitorPanel component
 */
export interface MemoryMonitorPanelProps {
  // === Core Configuration ===
  /**
   * Panel visibility mode
   * - 'development': Show only in development (default)
   * - 'production': Show only in production
   * - 'always': Always show
   * - 'never': Never show (useful for headless mode)
   * @default 'development'
   */
  mode?: PanelMode;

  /**
   * Initial panel open state
   * @default false
   */
  defaultOpen?: boolean;

  /**
   * Position of the panel
   * @default 'right'
   */
  position?: PanelPosition;

  /**
   * Z-index for the panel
   * @default 9999
   */
  zIndex?: number;

  // === Monitoring Options ===
  /**
   * Polling interval in milliseconds
   * @default 1000
   */
  interval?: number;

  /**
   * Enable memory history tracking
   * @default true
   */
  enableHistory?: boolean;

  /**
   * History buffer size
   * @default 50
   */
  historySize?: number;

  /**
   * Track DOM node count
   * @default true
   */
  trackDOMNodes?: boolean;

  /**
   * Track event listeners (estimated)
   * @default true
   */
  trackEventListeners?: boolean;

  // === Threshold Configuration ===
  /**
   * Warning threshold percentage (0-100)
   * @default 70
   */
  warningThreshold?: number;

  /**
   * Critical threshold percentage (0-100)
   * @default 90
   */
  criticalThreshold?: number;

  /**
   * Auto-GC threshold percentage (0-100), null to disable
   * @default null
   */
  autoGCThreshold?: number | null;

  /**
   * Enable auto-GC feature
   * @default false
   */
  enableAutoGC?: boolean;

  // === Leak Detection ===
  /**
   * Enable memory leak detection
   * @default true
   */
  enableLeakDetection?: boolean;

  /**
   * Leak detection sensitivity
   * @default 'medium'
   */
  leakSensitivity?: LeakSensitivity;

  // === UI Customization ===
  /**
   * Custom trigger button content
   */
  triggerContent?: ReactNode;

  /**
   * Trigger button position
   * @default { bottom: 20, right: 20 }
   */
  triggerPosition?: TriggerPosition;

  /**
   * Initial panel width
   * @default 400
   */
  defaultWidth?: number;

  /**
   * Minimum panel width
   * @default 320
   */
  minWidth?: number;

  /**
   * Maximum panel width
   * @default 600
   */
  maxWidth?: number;

  /**
   * Theme override
   * @default 'system'
   */
  theme?: ThemeSetting;

  /**
   * Custom class name for panel
   */
  className?: string;

  /**
   * Show trigger button
   * @default true
   */
  showTrigger?: boolean;

  // === Callbacks ===
  /**
   * Called when panel opens/closes
   */
  onOpenChange?: (open: boolean) => void;

  /**
   * Called on memory warning
   */
  onWarning?: (data: MemoryWarningData) => void;

  /**
   * Called on critical memory
   */
  onCritical?: (data: MemoryCriticalData) => void;

  /**
   * Called when leak is detected
   */
  onLeakDetected?: (analysis: LeakAnalysisData) => void;

  /**
   * Called when auto-GC is triggered
   */
  onAutoGC?: (data: AutoGCEventData) => void;

  /**
   * Called on each memory update
   */
  onUpdate?: (memory: {
    heapUsed: number;
    heapTotal: number;
    heapLimit: number;
    timestamp: number;
  }) => void;

  // === Advanced ===
  /**
   * Keyboard shortcut to toggle panel
   * @default 'ctrl+shift+m'
   */
  shortcut?: string;

  /**
   * Enable session persistence
   * @default true
   */
  persistSettings?: boolean;

  /**
   * Storage key for persistence
   * @default 'memory-monitor-panel-settings'
   */
  storageKey?: string;

  /**
   * Disable all features in production
   * @default false
   */
  disableInProduction?: boolean;
}

/**
 * Headless hook options
 */
export interface MemoryMonitorHeadlessOptions {
  /**
   * Polling interval in milliseconds
   * @default 1000
   */
  interval?: number;

  /**
   * Enable memory history tracking
   * @default false
   */
  enableHistory?: boolean;

  /**
   * History buffer size
   * @default 50
   */
  historySize?: number;

  /**
   * Warning threshold percentage (0-100)
   * @default 70
   */
  warningThreshold?: number;

  /**
   * Critical threshold percentage (0-100)
   * @default 90
   */
  criticalThreshold?: number;

  /**
   * Auto-GC threshold percentage (0-100), null to disable
   * @default null
   */
  autoGCThreshold?: number | null;

  /**
   * Enable auto-GC feature
   * @default false
   */
  enableAutoGC?: boolean;

  /**
   * Enable memory leak detection
   * @default false
   */
  enableLeakDetection?: boolean;

  /**
   * Leak detection sensitivity
   * @default 'medium'
   */
  leakSensitivity?: LeakSensitivity;

  /**
   * Called on memory warning
   */
  onWarning?: (data: MemoryWarningData) => void;

  /**
   * Called on critical memory
   */
  onCritical?: (data: MemoryCriticalData) => void;

  /**
   * Called when leak is detected
   */
  onLeakDetected?: (analysis: LeakAnalysisData) => void;

  /**
   * Called when auto-GC is triggered
   */
  onAutoGC?: (data: AutoGCEventData) => void;
}

/**
 * Return type for headless hook
 */
export interface MemoryMonitorHeadlessReturn {
  /** Current memory info */
  memory: {
    heapUsed: number;
    heapTotal: number;
    heapLimit: number;
    timestamp: number;
  } | null;

  /** Usage percentage (heapUsed / heapLimit * 100) */
  usagePercentage: number | null;

  /** Current severity level */
  severity: "normal" | "warning" | "critical";

  /** Whether memory leak is detected */
  isLeakDetected: boolean;

  /** Leak probability (0-100) */
  leakProbability: number;

  /** Memory trend */
  trend: "increasing" | "decreasing" | "stable";

  /** Request garbage collection hint */
  requestGC: () => void;

  /** Whether browser supports memory monitoring */
  isSupported: boolean;
}
