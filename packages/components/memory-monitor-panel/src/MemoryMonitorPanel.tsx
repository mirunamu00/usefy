import React, { forwardRef, useState, useEffect, useCallback, useMemo } from "react";
import { useMemoryMonitor } from "@usefy/use-memory-monitor";
import type { MemoryMonitorPanelProps, PanelTab, Severity, PanelSnapshot, SnapshotAnalysisContext } from "./types";
import {
  DEFAULT_SETTINGS,
  DEFAULT_TRIGGER_POSITION,
  DEFAULT_SHORTCUT,
  PANEL_DIMENSIONS,
  Z_INDEX,
  SEVERITY_COLORS,
  formatBytes,
  SNAPSHOT_SCHEDULE_OPTIONS,
} from "./constants";
import { cn, isSSR, getShouldRender, getShouldActivate } from "./utils";
import {
  useKeyboardShortcut,
  useEscapeKey,
  usePanelState,
  useSettings,
  useAutoGC,
  useTheme,
} from "./hooks";
import {
  Panel,
  PanelTrigger,
  PanelHeader,
  PanelTabs,
  PanelResizer,
} from "./components/Panel";
import {
  MemoryGauge,
  HistoryChart,
  HeapBreakdown,
  DOMMetrics,
  TrendIndicator,
} from "./components/Visualizations";
import { StatusBadge, LeakWarning } from "./components/Alerts";
import {
  ThresholdSlider,
  AutoGCToggle,
  ActionButtons,
  IntervalSelector,
  SnapshotSettings,
} from "./components/Controls";
import { SnapshotList, SnapshotCompare, ReportButton } from "./components/Snapshots";

/**
 * Enterprise-grade React component for real-time browser memory monitoring.
 *
 * Features:
 * - Real-time memory visualization with charts
 * - Threshold-based alerts (warning/critical)
 * - Automatic garbage collection triggers
 * - Memory leak detection
 * - Snapshot comparison
 * - Settings persistence
 * - Environment-aware (dev/prod modes)
 * - Keyboard shortcuts (Ctrl+Shift+M)
 *
 * @example
 * ```tsx
 * // Basic usage - shows only in development
 * function App() {
 *   return (
 *     <>
 *       <YourApp />
 *       <MemoryMonitorPanel />
 *     </>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With custom configuration
 * <MemoryMonitorPanel
 *   mode="development"
 *   warningThreshold={70}
 *   criticalThreshold={90}
 *   enableAutoGC
 *   autoGCThreshold={85}
 *   onWarning={(data) => console.warn('Memory warning!', data)}
 * />
 * ```
 */
export const MemoryMonitorPanel = forwardRef<HTMLDivElement, MemoryMonitorPanelProps>(
  (props, ref) => {
    const {
      // Core Configuration
      mode = "development",
      defaultOpen = false,
      position = "right",
      zIndex = Z_INDEX.panel,

      // Monitoring Options
      interval = DEFAULT_SETTINGS.interval,
      enableHistory = true,
      historySize = 50,
      trackDOMNodes = true,
      trackEventListeners = true,

      // Threshold Configuration
      warningThreshold = DEFAULT_SETTINGS.warningThreshold,
      criticalThreshold = DEFAULT_SETTINGS.criticalThreshold,
      autoGCThreshold = DEFAULT_SETTINGS.autoGCThreshold,
      enableAutoGC = DEFAULT_SETTINGS.enableAutoGC,

      // Leak Detection
      enableLeakDetection = true,
      leakSensitivity = "medium",

      // UI Customization
      triggerContent,
      triggerPosition = DEFAULT_TRIGGER_POSITION,
      defaultWidth = PANEL_DIMENSIONS.defaultWidth,
      minWidth = PANEL_DIMENSIONS.minWidth,
      maxWidth = PANEL_DIMENSIONS.maxWidth,
      theme: themeProp = "system",
      className,
      showTrigger = true,

      // Callbacks
      onOpenChange,
      onWarning,
      onCritical,
      onLeakDetected,
      onAutoGC,
      onUpdate,

      // Advanced
      shortcut = DEFAULT_SHORTCUT,
      persistSettings = true,
      storageKey,
      disableInProduction = false,
    } = props;

    // SSR check - don't render anything on server
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
      setMounted(true);
    }, []);

    // Determine if we should render and activate
    const shouldRender = getShouldRender(mode);
    const shouldActivate = getShouldActivate(mode, disableInProduction);

    // Settings persistence
    const { settings, updateSettings, isLoaded } = useSettings({
      storageKey,
      persist: persistSettings,
      initialSettings: {
        warningThreshold,
        criticalThreshold,
        autoGCThreshold,
        enableAutoGC,
        interval,
        theme: themeProp,
        panelWidth: defaultWidth,
      },
    });

    // Panel state
    const { isOpen, toggle, close, activeTab, setActiveTab } = usePanelState({
      defaultOpen,
      onOpenChange,
    });

    // Theme
    const { resolvedTheme } = useTheme({
      theme: settings.theme,
    });
    const isDark = resolvedTheme === "dark";

    // Panel width state
    const [panelWidth, setPanelWidth] = useState(settings.panelWidth);

    // Update settings when width changes
    const handleWidthChange = useCallback(
      (width: number) => {
        setPanelWidth(width);
        updateSettings({ panelWidth: width });
      },
      [updateSettings]
    );

    // Core memory monitor hook
    const monitor = useMemoryMonitor({
      interval: settings.interval,
      autoStart: shouldActivate,
      enabled: shouldActivate,
      enableHistory,
      historySize,
      trackDOMNodes,
      trackEventListeners,
      thresholds: {
        warning: settings.warningThreshold,
        critical: settings.criticalThreshold,
      },
      leakDetection: {
        enabled: enableLeakDetection,
        sensitivity: leakSensitivity,
      },
      onUpdate: onUpdate
        ? (memory) => {
            onUpdate({
              heapUsed: memory.heapUsed,
              heapTotal: memory.heapTotal,
              heapLimit: memory.heapLimit,
              timestamp: memory.timestamp,
            });
          }
        : undefined,
      onWarning: onWarning
        ? (data) => {
            onWarning({
              memory: {
                heapUsed: data.memory.heapUsed,
                heapTotal: data.memory.heapTotal,
                heapLimit: data.memory.heapLimit,
                timestamp: data.memory.timestamp,
              },
              usagePercentage: data.usagePercentage,
              threshold: data.threshold,
              timestamp: data.timestamp,
            });
          }
        : undefined,
      onCritical: onCritical
        ? (data) => {
            onCritical({
              memory: {
                heapUsed: data.memory.heapUsed,
                heapTotal: data.memory.heapTotal,
                heapLimit: data.memory.heapLimit,
                timestamp: data.memory.timestamp,
              },
              usagePercentage: data.usagePercentage,
              threshold: data.threshold,
              timestamp: data.timestamp,
            });
          }
        : undefined,
      onLeakDetected: onLeakDetected
        ? (analysis) => {
            onLeakDetected({
              isLeaking: analysis.isLeaking,
              probability: analysis.probability,
              trend: analysis.trend,
              recommendation: analysis.recommendation,
            });
          }
        : undefined,
    });

    // Auto-GC
    useAutoGC({
      enabled: settings.enableAutoGC,
      threshold: settings.autoGCThreshold,
      usagePercentage: monitor.usagePercentage,
      requestGC: monitor.requestGC,
      onAutoGC,
    });

    // Keyboard shortcuts
    useKeyboardShortcut(shortcut, toggle, mounted && shouldRender);
    useEscapeKey(close, mounted && shouldRender && isOpen);

    // Snapshot scheduler ref to track last auto-snapshot time
    const lastAutoSnapshotRef = React.useRef<number>(0);

    // Current severity
    const severity: Severity = monitor.severity;

    // Snapshot state management
    const [snapshots, setSnapshots] = useState<PanelSnapshot[]>([]);
    const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
    const [compareSnapshotId, setCompareSnapshotId] = useState<string | null>(null);
    // Counter for sequential snapshot numbering (persists through auto-delete cycles)
    const snapshotCounterRef = React.useRef(0);

    // Get selected snapshots
    const selectedSnapshot = useMemo(
      () => snapshots.find((s) => s.id === selectedSnapshotId) ?? null,
      [snapshots, selectedSnapshotId]
    );
    const compareSnapshot = useMemo(
      () => snapshots.find((s) => s.id === compareSnapshotId) ?? null,
      [snapshots, compareSnapshotId]
    );

    // Take snapshot handler
    const handleTakeSnapshot = useCallback((isAuto = false) => {
      const maxSnapshots = settings.snapshot?.maxSnapshots ?? DEFAULT_SETTINGS.snapshot.maxSnapshots;
      const autoDeleteOldest = settings.snapshot?.autoDeleteOldest ?? true;

      // Capture current analysis context
      const analysisContext: SnapshotAnalysisContext = {
        trend: monitor.trend,
        leakProbability: monitor.leakProbability,
        severity: monitor.severity,
        usagePercentage: monitor.usagePercentage ?? 0,
      };

      // Increment counter for sequential numbering
      snapshotCounterRef.current += 1;
      const snapshotNumber = snapshotCounterRef.current;

      // If at max capacity
      if (snapshots.length >= maxSnapshots) {
        if (autoDeleteOldest) {
          // Delete oldest and add new one
          setSnapshots((prev) => {
            const remaining = prev.slice(1);
            const id = `snapshot-${Date.now()}`;
            const label = isAuto ? `Auto ${snapshotNumber}` : `Snapshot ${snapshotNumber}`;
            const newSnapshot: PanelSnapshot = {
              id,
              label,
              timestamp: Date.now(),
              heapUsed: monitor.memory?.heapUsed ?? 0,
              heapTotal: monitor.memory?.heapTotal ?? 0,
              heapLimit: monitor.memory?.heapLimit ?? 0,
              domNodes: monitor.domNodes ?? undefined,
              eventListeners: monitor.eventListeners ?? undefined,
              isAuto,
              analysisContext,
            };
            monitor.takeSnapshot(id);
            return [...remaining, newSnapshot];
          });
        }
        return;
      }

      const id = `snapshot-${Date.now()}`;
      const label = isAuto ? `Auto ${snapshotNumber}` : `Snapshot ${snapshotNumber}`;

      const newSnapshot: PanelSnapshot = {
        id,
        label,
        timestamp: Date.now(),
        heapUsed: monitor.memory?.heapUsed ?? 0,
        heapTotal: monitor.memory?.heapTotal ?? 0,
        heapLimit: monitor.memory?.heapLimit ?? 0,
        domNodes: monitor.domNodes ?? undefined,
        eventListeners: monitor.eventListeners ?? undefined,
        isAuto,
        analysisContext,
      };

      setSnapshots((prev) => [...prev, newSnapshot]);
      monitor.takeSnapshot(id);
    }, [snapshots.length, monitor, settings.snapshot]);

    // Ref for the latest handleTakeSnapshot to avoid stale closure in interval
    const handleTakeSnapshotRef = React.useRef(handleTakeSnapshot);
    useEffect(() => {
      handleTakeSnapshotRef.current = handleTakeSnapshot;
    }, [handleTakeSnapshot]);

    // Snapshot scheduler effect
    useEffect(() => {
      const scheduleInterval = settings.snapshot?.scheduleInterval ?? "off";
      if (scheduleInterval === "off" || !shouldActivate) {
        return;
      }

      const scheduleOption = SNAPSHOT_SCHEDULE_OPTIONS.find(
        (opt) => opt.value === scheduleInterval
      );
      if (!scheduleOption || scheduleOption.intervalMs === 0) {
        return;
      }

      // Take first snapshot immediately when schedule is enabled
      lastAutoSnapshotRef.current = Date.now();
      handleTakeSnapshotRef.current(true);

      const intervalId = setInterval(() => {
        lastAutoSnapshotRef.current = Date.now();
        handleTakeSnapshotRef.current(true);
      }, scheduleOption.intervalMs);

      return () => {
        clearInterval(intervalId);
      };
    }, [settings.snapshot?.scheduleInterval, shouldActivate]);

    // Select snapshot handler
    const handleSelectSnapshot = useCallback((snapshot: PanelSnapshot) => {
      if (selectedSnapshotId === snapshot.id) {
        // Deselect if clicking the same
        setSelectedSnapshotId(null);
        setCompareSnapshotId(null);
      } else if (selectedSnapshotId === null) {
        // First selection
        setSelectedSnapshotId(snapshot.id);
      } else {
        // Second selection - set as compare target
        setCompareSnapshotId(selectedSnapshotId);
        setSelectedSnapshotId(snapshot.id);
      }
    }, [selectedSnapshotId]);

    // Delete snapshot handler
    const handleDeleteSnapshot = useCallback((id: string) => {
      setSnapshots((prev) => prev.filter((s) => s.id !== id));
      if (selectedSnapshotId === id) setSelectedSnapshotId(null);
      if (compareSnapshotId === id) setCompareSnapshotId(null);
    }, [selectedSnapshotId, compareSnapshotId]);

    // Delete all snapshots handler
    const handleDeleteAllSnapshots = useCallback(() => {
      setSnapshots([]);
      setSelectedSnapshotId(null);
      setCompareSnapshotId(null);
    }, []);

    // Memoized tab content
    const tabContent = useMemo(() => {
      switch (activeTab) {
        case "overview":
          return (
            <OverviewTab
              monitor={monitor}
              settings={settings}
              isDark={isDark}
              onTakeSnapshot={handleTakeSnapshot}
            />
          );
        case "history":
          return (
            <HistoryTab
              history={monitor.history}
              trend={monitor.trend}
              leakProbability={monitor.leakProbability}
              severity={monitor.severity}
              heapLimit={monitor.memory?.heapLimit ?? null}
              warningThreshold={settings.warningThreshold}
              criticalThreshold={settings.criticalThreshold}
              isDark={isDark}
            />
          );
        case "snapshots":
          return (
            <SnapshotsTab
              snapshots={snapshots}
              selectedSnapshot={selectedSnapshot}
              compareSnapshot={compareSnapshot}
              onSelect={handleSelectSnapshot}
              onDelete={handleDeleteSnapshot}
              onDeleteAll={handleDeleteAllSnapshots}
              onTakeSnapshot={() => handleTakeSnapshot(false)}
              maxSnapshots={settings.snapshot?.maxSnapshots ?? DEFAULT_SETTINGS.snapshot.maxSnapshots}
              autoDeleteOldest={settings.snapshot?.autoDeleteOldest ?? true}
              isDark={isDark}
            />
          );
        case "settings":
          return (
            <SettingsTab
              settings={settings}
              updateSettings={updateSettings}
              isSupported={monitor.isSupported}
              isDark={isDark}
            />
          );
        default:
          return null;
      }
    }, [
      activeTab,
      monitor,
      settings,
      updateSettings,
      isDark,
      snapshots,
      selectedSnapshot,
      compareSnapshot,
      handleTakeSnapshot,
      handleSelectSnapshot,
      handleDeleteSnapshot,
      handleDeleteAllSnapshots,
    ]);

    // Don't render on server
    if (!mounted || isSSR()) {
      return null;
    }

    // Don't render if mode says not to
    if (!shouldRender) {
      return null;
    }

    // Don't render until settings are loaded
    if (!isLoaded) {
      return null;
    }

    return (
      <>
        {/* Floating trigger button */}
        {showTrigger && !isOpen && (
          <PanelTrigger
            onClick={toggle}
            position={triggerPosition}
            zIndex={zIndex - 1}
            severity={severity}
            isDark={isDark}
          >
            {triggerContent}
          </PanelTrigger>
        )}

        {/* Main panel */}
        <Panel
          ref={ref}
          isOpen={isOpen}
          position={position}
          width={panelWidth}
          zIndex={zIndex}
          isDark={isDark}
          className={className}
        >
          {/* Resizer */}
          <PanelResizer
            width={panelWidth}
            onWidthChange={handleWidthChange}
            position={position}
            minWidth={minWidth}
            maxWidth={maxWidth}
          />

          {/* Header */}
          <PanelHeader
            severity={severity}
            isMonitoring={monitor.isMonitoring}
            onClose={close}
          />

          {/* Tabs */}
          <PanelTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isAutoSnapshotActive={(settings.snapshot?.scheduleInterval ?? "off") !== "off"}
          />

          {/* Tab content */}
          <div
            className="flex-1 p-4 thin-scrollbar"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(148, 163, 184, 0.4) transparent",
            }}
          >
            {tabContent}
          </div>
        </Panel>
      </>
    );
  }
);

MemoryMonitorPanel.displayName = "MemoryMonitorPanel";

// ============================================================================
// Tab Components
// ============================================================================

interface OverviewTabProps {
  monitor: ReturnType<typeof useMemoryMonitor>;
  settings: ReturnType<typeof useSettings>["settings"];
  isDark: boolean;
  onTakeSnapshot: () => void;
}

function OverviewTab({ monitor, settings, isDark, onTakeSnapshot }: OverviewTabProps) {
  return (
    <div className="space-y-4">
      {/* Memory Gauge */}
      <MemoryGauge
        usagePercentage={monitor.usagePercentage ?? 0}
        severity={monitor.severity}
        heapUsed={monitor.formatted.heapUsed}
        heapLimit={monitor.formatted.heapLimit}
        warningThreshold={settings.warningThreshold}
        criticalThreshold={settings.criticalThreshold}
      />

      {/* Status and Trend */}
      <div className="flex items-center justify-between">
        <StatusBadge severity={monitor.severity} />
        <TrendIndicator
          trend={monitor.trend}
          leakProbability={monitor.leakProbability}
          compact
        />
      </div>

      {/* Heap Breakdown */}
      <HeapBreakdown
        heapUsed={monitor.memory?.heapUsed ?? 0}
        heapTotal={monitor.memory?.heapTotal ?? 0}
        heapLimit={monitor.memory?.heapLimit ?? 0}
        severity={monitor.severity}
        warningThreshold={settings.warningThreshold}
        criticalThreshold={settings.criticalThreshold}
      />

      {/* DOM Metrics */}
      <DOMMetrics
        domNodes={monitor.domNodes}
        eventListeners={monitor.eventListeners}
      />

      {/* Leak Warning */}
      <LeakWarning
        isLeaking={monitor.isLeakDetected}
        probability={monitor.leakProbability}
        trend={monitor.trend}
        recommendation={
          monitor.leakProbability >= 70
            ? "High probability of memory leak. Check for unsubscribed subscriptions."
            : monitor.leakProbability >= 40
              ? "Moderate risk. Monitor memory usage closely."
              : undefined
        }
        compact
      />

      {/* Quick Actions */}
      <ActionButtons
        onRequestGC={monitor.requestGC}
        onTakeSnapshot={onTakeSnapshot}
        gcSupported={monitor.isSupported}
        snapshotEnabled
        exportEnabled={false}
      />
    </div>
  );
}

interface HistoryTabProps {
  history: ReturnType<typeof useMemoryMonitor>["history"];
  trend: ReturnType<typeof useMemoryMonitor>["trend"];
  leakProbability: number;
  severity: Severity;
  heapLimit: number | null;
  warningThreshold: number;
  criticalThreshold: number;
  isDark: boolean;
}

function HistoryTab({
  history,
  trend,
  leakProbability,
  heapLimit,
  warningThreshold,
  criticalThreshold,
}: HistoryTabProps) {
  return (
    <div className="space-y-4">
      {/* History Chart */}
      <HistoryChart
        history={history}
        heapLimit={heapLimit}
        warningThreshold={warningThreshold}
        criticalThreshold={criticalThreshold}
        height={200}
      />

      {/* Trend Indicator */}
      <TrendIndicator
        trend={trend}
        leakProbability={leakProbability}
        sampleCount={history.length}
      />

      {/* Stats */}
      {history.length > 0 && (
        <div className={cn(
          "p-3 rounded-lg",
          "bg-slate-50 dark:bg-slate-800",
          "border border-slate-200 dark:border-slate-700"
        )}>
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Statistics
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-slate-500">Min:</span>{" "}
              <span className="font-mono text-slate-900 dark:text-slate-100">
                {formatBytes(Math.min(...history.map(h => h.heapUsed)))}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Max:</span>{" "}
              <span className="font-mono text-slate-900 dark:text-slate-100">
                {formatBytes(Math.max(...history.map(h => h.heapUsed)))}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Avg:</span>{" "}
              <span className="font-mono text-slate-900 dark:text-slate-100">
                {formatBytes(history.reduce((sum, h) => sum + h.heapUsed, 0) / history.length)}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Samples:</span>{" "}
              <span className="font-mono text-slate-900 dark:text-slate-100">
                {history.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SnapshotsTabProps {
  snapshots: PanelSnapshot[];
  selectedSnapshot: PanelSnapshot | null;
  compareSnapshot: PanelSnapshot | null;
  onSelect: (snapshot: PanelSnapshot) => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
  onTakeSnapshot: () => void;
  maxSnapshots: number;
  autoDeleteOldest: boolean;
  isDark: boolean;
}

function SnapshotsTab({
  snapshots,
  selectedSnapshot,
  compareSnapshot,
  onSelect,
  onDelete,
  onDeleteAll,
  onTakeSnapshot,
  maxSnapshots,
  autoDeleteOldest,
}: SnapshotsTabProps) {
  const isAtCapacity = snapshots.length >= maxSnapshots;
  const canTakeSnapshot = !isAtCapacity || autoDeleteOldest;

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-2">
        {/* Take Snapshot Button */}
        <button
          type="button"
          onClick={onTakeSnapshot}
          disabled={!canTakeSnapshot}
          className={cn(
            "flex-1 px-4 py-2 text-sm font-medium rounded-lg",
            "bg-blue-500 hover:bg-blue-600 text-white",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors"
          )}
        >
          {isAtCapacity && autoDeleteOldest
            ? "Take Snapshot (replace oldest)"
            : "Take Snapshot"}
        </button>

        {/* Delete All Button */}
        <button
          type="button"
          onClick={onDeleteAll}
          disabled={snapshots.length === 0}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg",
            "bg-red-500 hover:bg-red-600 text-white",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors"
          )}
          title="Delete all snapshots"
        >
          Delete All
        </button>
      </div>

      {/* Report Button */}
      <ReportButton snapshots={snapshots} />

      {/* Capacity indicator */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{snapshots.length} / {maxSnapshots} snapshots</span>
        {autoDeleteOldest && isAtCapacity && (
          <span className="text-amber-500">Auto-delete enabled</span>
        )}
      </div>

      {/* Snapshot Comparison */}
      {selectedSnapshot && compareSnapshot && (
        <SnapshotCompare
          baseline={compareSnapshot}
          current={selectedSnapshot}
        />
      )}

      {/* Snapshot List */}
      <SnapshotList
        snapshots={snapshots}
        selectedId={selectedSnapshot?.id}
        onSelect={onSelect}
        onDelete={onDelete}
        maxSnapshots={maxSnapshots}
      />

      {/* Help text */}
      {snapshots.length >= 2 && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select two snapshots to compare them
        </p>
      )}
    </div>
  );
}

interface SettingsTabProps {
  settings: ReturnType<typeof useSettings>["settings"];
  updateSettings: ReturnType<typeof useSettings>["updateSettings"];
  isSupported: boolean;
  isDark: boolean;
}

function SettingsTab({ settings, updateSettings, isSupported }: SettingsTabProps) {
  const handleWarningChange = useCallback((value: number) => {
    updateSettings({ warningThreshold: value });
  }, [updateSettings]);

  const handleCriticalChange = useCallback((value: number) => {
    updateSettings({ criticalThreshold: value });
  }, [updateSettings]);

  const handleAutoGCToggle = useCallback((enabled: boolean) => {
    updateSettings({ enableAutoGC: enabled });
  }, [updateSettings]);

  const handleAutoGCThresholdChange = useCallback((threshold: number | null) => {
    updateSettings({ autoGCThreshold: threshold });
  }, [updateSettings]);

  const handleIntervalChange = useCallback((interval: number) => {
    updateSettings({ interval });
  }, [updateSettings]);

  const handleSnapshotSettingsChange = useCallback(
    (snapshotSettings: typeof settings.snapshot) => {
      updateSettings({ snapshot: snapshotSettings });
    },
    [updateSettings]
  );

  return (
    <div className="space-y-6">
      {/* Threshold Settings */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
          Thresholds
        </h4>
        <ThresholdSlider
          label="Warning Threshold"
          value={settings.warningThreshold}
          onChange={handleWarningChange}
          color={SEVERITY_COLORS.warning.accent}
          helperText="Alert when memory usage exceeds this level"
        />
        <ThresholdSlider
          label="Critical Threshold"
          value={settings.criticalThreshold}
          onChange={handleCriticalChange}
          color={SEVERITY_COLORS.critical.accent}
          helperText="Critical alert threshold"
        />
      </div>

      {/* Auto-GC Settings */}
      <AutoGCToggle
        enabled={settings.enableAutoGC}
        onToggle={handleAutoGCToggle}
        threshold={settings.autoGCThreshold}
        onThresholdChange={handleAutoGCThresholdChange}
        isSupported={isSupported}
      />

      {/* Polling Interval */}
      <IntervalSelector
        value={settings.interval}
        onChange={handleIntervalChange}
      />

      {/* Snapshot Settings */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
        <SnapshotSettings
          value={settings.snapshot ?? DEFAULT_SETTINGS.snapshot}
          onChange={handleSnapshotSettingsChange}
        />
      </div>

      {/* Theme Settings */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
          Theme
        </h4>
        <div className="flex gap-2">
          {(["system", "light", "dark"] as const).map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => updateSettings({ theme })}
              className={cn(
                "flex-1 px-3 py-2 text-sm font-medium rounded-lg capitalize",
                "transition-colors",
                settings.theme === theme
                  ? "bg-blue-500 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              )}
            >
              {theme}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
