import React, { useState, useMemo } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useMemoryMonitor } from "@usefy/use-memory-monitor";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";

/**
 * Demo component for basic useMemoryMonitor usage
 */
function MemoryMonitorDemo({
  title = "useMemoryMonitor Demo",
  autoStart = true,
  interval = 1000,
}: {
  title?: string;
  autoStart?: boolean;
  interval?: number;
}) {
  const {
    memory,
    heapUsed,
    heapTotal,
    heapLimit,
    isSupported,
    isMonitoring,
    isLeakDetected,
    severity,
    history,
    trend,
    start,
    stop,
    formatted,
    supportLevel,
  } = useMemoryMonitor({
    interval,
    autoStart,
    enableHistory: true,
    historySize: 20,
  });

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>{title}</h2>
      <p className={storyTheme.subtitle}>
        Real-time browser memory monitoring with leak detection
      </p>

      {/* Support Status */}
      {!isSupported && (
        <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl">
          <h3 className="font-semibold text-yellow-800 mb-2">
            Limited Support
          </h3>
          <p className="text-sm text-yellow-700 mb-2">
            Support Level: {supportLevel}
          </p>
          <p className="text-sm text-yellow-700">
            Memory monitoring is not fully supported in this browser.
          </p>
        </div>
      )}

      {/* Monitoring Status */}
      <div
        className={`mb-6 p-4 rounded-xl border-2 ${
          isMonitoring
            ? "bg-green-50 border-green-300"
            : "bg-gray-50 border-gray-300"
        }`}
        data-testid="monitoring-status"
      >
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-800">
            Status: {isMonitoring ? "Monitoring" : "Stopped"}
          </span>
          <div className="space-x-2">
            {!isMonitoring && (
              <button
                onClick={start}
                className={storyTheme.buttonSuccess}
                data-testid="start-button"
              >
                Start
              </button>
            )}
            {isMonitoring && (
              <button
                onClick={stop}
                className={storyTheme.buttonDanger}
                data-testid="stop-button"
              >
                Stop
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Memory Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div
          className={`p-5 rounded-xl border-2 ${
            severity === "critical"
              ? "bg-red-50 border-red-300"
              : severity === "warning"
              ? "bg-yellow-50 border-yellow-300"
              : "bg-green-50 border-green-300"
          }`}
        >
          <h3 className="font-semibold text-gray-800 mb-3">Heap Used</h3>
          <div
            className="text-4xl font-bold text-center"
            data-testid="heap-used"
          >
            {formatted.heapUsed}
          </div>
          <p className="text-sm text-gray-600 text-center mt-2">
            Severity: {severity}
          </p>
        </div>

        <div className="p-5 rounded-xl border-2 bg-blue-50 border-blue-300">
          <h3 className="font-semibold text-gray-800 mb-3">Heap Total</h3>
          <div
            className="text-4xl font-bold text-center text-blue-600"
            data-testid="heap-total"
          >
            {formatted.heapTotal}
          </div>
          <p className="text-sm text-gray-600 text-center mt-2">
            Limit: {formatted.heapLimit}
          </p>
        </div>
      </div>

      {/* Leak Detection */}
      {isLeakDetected && (
        <div
          className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-xl"
          data-testid="leak-alert"
        >
          <h3 className="font-semibold text-red-800 mb-2">
            ⚠️ Memory Leak Detected
          </h3>
          <p className="text-sm text-red-700">
            Memory usage is continuously increasing. Check for memory leaks in
            your application.
          </p>
        </div>
      )}

      {/* Trend & History */}
      <div className={storyTheme.card + " mb-6"}>
        <h3 className="font-semibold text-gray-800 mb-3">
          Statistics & Trend
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Trend</p>
            <p
              className={`text-2xl font-bold ${
                trend === "increasing"
                  ? "text-red-600"
                  : trend === "decreasing"
                  ? "text-green-600"
                  : "text-gray-600"
              }`}
              data-testid="trend"
            >
              {trend === "increasing"
                ? "↗"
                : trend === "decreasing"
                ? "↘"
                : "→"}{" "}
              {trend}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">History Points</p>
            <p className="text-2xl font-bold text-indigo-600">
              {history.length}
            </p>
          </div>
        </div>
      </div>

      {/* Raw Data */}
      {isSupported && memory && (
        <div className={storyTheme.cardInfo}>
          <h3 className="font-semibold text-gray-800 mb-2">Raw Data</h3>
          <pre
            className="text-xs bg-white/50 p-3 rounded-lg overflow-x-auto"
            data-testid="raw-data"
          >
            {JSON.stringify(memory, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * Demo component showing threshold alerts
 */
function ThresholdAlertsDemo() {
  const { severity, heapUsed, heapLimit, formatted, isSupported } =
    useMemoryMonitor({
      interval: 1000,
      autoStart: true,
      thresholds: {
        warning: 50,
        critical: 90,
      },
    });

  const usagePercent = heapUsed && heapLimit ? (heapUsed / heapLimit) * 100 : 0;

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Threshold Alerts</h2>
      <p className={storyTheme.subtitle}>
        Configure custom thresholds for memory usage alerts
      </p>

      {!isSupported && (
        <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl">
          <p className="text-sm text-yellow-700">
            Memory monitoring not fully supported in this browser. Some features
            may be limited.
          </p>
        </div>
      )}

      {/* Threshold Meter */}
      <div className={storyTheme.gradientBox + " mb-6"}>
        <h3 className="text-white font-semibold text-center mb-4">
          Memory Usage
        </h3>
        <div
          className="text-6xl font-bold text-white text-center mb-4"
          data-testid="usage-percent"
        >
          {usagePercent.toFixed(1)}%
        </div>
        <div className="w-full bg-white/20 rounded-full h-4 mb-2">
          <div
            className={`h-4 rounded-full transition-all duration-300 ${
              severity === "critical"
                ? "bg-red-500"
                : severity === "warning"
                ? "bg-yellow-500"
                : "bg-green-500"
            }`}
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
            data-testid="usage-bar"
          />
        </div>
        <p className="text-white/80 text-center text-sm">
          {formatted.heapUsed} / {formatted.heapLimit}
        </p>
      </div>

      {/* Threshold Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 bg-green-50 border-2 border-green-300 rounded-xl text-center">
          <div className="text-green-700 font-semibold">Normal</div>
          <div className="text-sm text-green-600">&lt; 50%</div>
        </div>
        <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl text-center">
          <div className="text-yellow-700 font-semibold">Warning</div>
          <div className="text-sm text-yellow-600">50-90%</div>
        </div>
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl text-center">
          <div className="text-red-700 font-semibold">Critical</div>
          <div className="text-sm text-red-600">&gt; 90%</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Demo component showing snapshot functionality
 */
function SnapshotDemo() {
  const { takeSnapshot, compareSnapshots } = useMemoryMonitor({
    interval: 1000,
    autoStart: true,
  });

  const [snapshots, setSnapshots] = useState<Array<{ id: string; timestamp: number }>>([]);
  const [comparison, setComparison] = useState<string | null>(null);

  const handleTakeSnapshot = () => {
    const id = `snapshot-${Date.now()}`;
    const snapshot = takeSnapshot(id);
    if (snapshot) {
      setSnapshots((prev) => [...prev, { id: snapshot.id, timestamp: snapshot.timestamp }]);
    }
  };

  const handleCompare = () => {
    if (snapshots.length >= 2) {
      const diff = compareSnapshots(snapshots[0].id, snapshots[snapshots.length - 1].id);
      if (diff) {
        setComparison(
          `Heap Delta: ${diff.heapDelta > 0 ? "+" : ""}${(diff.heapDelta / 1024 / 1024).toFixed(2)} MB (${diff.heapPercentChange.toFixed(1)}%)`
        );
      }
    }
  };

  const handleClear = () => {
    setSnapshots([]);
    setComparison(null);
  };

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Memory Snapshots</h2>
      <p className={storyTheme.subtitle}>
        Take snapshots and compare memory usage over time
      </p>

      {/* Actions */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleTakeSnapshot}
          className={storyTheme.buttonPrimary}
          data-testid="take-snapshot"
        >
          Take Snapshot
        </button>
        <button
          onClick={handleCompare}
          className={storyTheme.buttonNeutral}
          disabled={snapshots.length < 2}
          data-testid="compare-snapshots"
        >
          Compare
        </button>
        <button
          onClick={handleClear}
          className={storyTheme.buttonDanger}
          data-testid="clear-snapshots"
        >
          Clear All
        </button>
      </div>

      {/* Snapshots List */}
      <div className={storyTheme.card + " mb-6"}>
        <h3 className="font-semibold text-gray-800 mb-3">
          Snapshots ({snapshots.length})
        </h3>
        <div
          className="space-y-2 max-h-40 overflow-y-auto"
          data-testid="snapshots-list"
        >
          {snapshots.length === 0 ? (
            <p className="text-gray-400 text-sm">No snapshots yet</p>
          ) : (
            snapshots.map((snapshot, index) => (
              <div
                key={snapshot.id}
                className="p-2 bg-gray-50 rounded text-sm font-mono"
              >
                {index + 1}. {snapshot.id}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Comparison Result */}
      {comparison && (
        <div
          className={storyTheme.cardInfo}
          data-testid="comparison-result"
        >
          <h3 className="font-semibold text-gray-800 mb-2">
            Comparison Result
          </h3>
          <p className="text-sm">{comparison}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Demo component showing history visualization
 */
function HistoryVisualizationDemo() {
  const { history, trend, formatted, isMonitoring } = useMemoryMonitor({
    interval: 500,
    autoStart: true,
    enableHistory: true,
    historySize: 30,
  });

  const maxHeapUsed = Math.max(...history.map((h) => h.heapUsed || 0), 1);

  return (
    <div className={storyTheme.container}>
      <h2 className={storyTheme.title}>Memory History</h2>
      <p className={storyTheme.subtitle}>
        Visualize memory usage over time with trend detection
      </p>

      {/* Current State */}
      <div className={storyTheme.gradientBox + " mb-6"}>
        <div className="flex justify-between items-center text-white">
          <div>
            <p className="text-sm opacity-80">Current Usage</p>
            <p className="text-3xl font-bold">{formatted.heapUsed}</p>
          </div>
          <div>
            <p className="text-sm opacity-80">Trend</p>
            <p className="text-3xl font-bold">
              {trend === "increasing"
                ? "↗"
                : trend === "decreasing"
                ? "↘"
                : "→"}
            </p>
          </div>
          <div>
            <p className="text-sm opacity-80">Monitoring</p>
            <p className="text-3xl font-bold">
              {isMonitoring ? "✓" : "✕"}
            </p>
          </div>
        </div>
      </div>

      {/* Simple Bar Chart */}
      <div className={storyTheme.card}>
        <h3 className="font-semibold text-gray-800 mb-3">
          Recent History ({history.length} points)
        </h3>
        <div className="flex items-end gap-1 h-40" data-testid="history-chart">
          {history.length === 0 ? (
            <p className="text-gray-400 text-sm">Collecting data...</p>
          ) : (
            history.slice(-20).map((point, index) => {
              const heightPercent = ((point.heapUsed || 0) / maxHeapUsed) * 100;
              return (
                <div
                  key={index}
                  className="flex-1 bg-indigo-500 rounded-t transition-all duration-300"
                  style={{ height: `${heightPercent}%` }}
                  title={`${((point.heapUsed || 0) / 1024 / 1024).toFixed(2)} MB`}
                />
              );
            })
          )}
        </div>
        <div className="mt-3 text-xs text-gray-500 text-center">
          Max: {(maxHeapUsed / 1024 / 1024).toFixed(2)} MB
        </div>
      </div>
    </div>
  );
}

// Meta configuration
const meta: Meta<typeof MemoryMonitorDemo> = {
  title: "Hooks/useMemoryMonitor",
  component: MemoryMonitorDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A comprehensive React hook for monitoring browser memory usage in real-time. Provides heap metrics, leak detection, trend analysis, and threshold-based alerts.\n\n" +
          "**Browser Support:**\n" +
          "- ✅ Chrome/Edge: Full support with `performance.memory` API\n" +
          "- ⚠️ Firefox/Safari: Limited support (DOM-only metrics)\n" +
          "- ✅ SSR Compatible: Safe to use in Next.js, Remix, etc.\n\n" +
          "**Key Features:**\n" +
          "- Real-time heap usage monitoring (Chrome/Edge)\n" +
          "- Memory leak detection with linear regression\n" +
          "- Configurable threshold alerts (low/medium/high/critical)\n" +
          "- Memory snapshots and comparison\n" +
          "- History tracking with trend analysis\n" +
          "- Tab visibility optimization (auto pause when hidden)\n" +
          "- TypeScript first with full type safety",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: "text",
      description: "Title displayed in the demo",
      table: {
        type: { summary: "string" },
      },
    },
    autoStart: {
      control: "boolean",
      description: "Start monitoring automatically",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
      },
    },
    interval: {
      control: "number",
      description: "Polling interval in milliseconds",
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "1000" },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MemoryMonitorDemo>;

/**
 * Basic memory monitoring with real-time metrics
 */
export const Default: Story = {
  args: {
    title: "Basic Memory Monitor",
    autoStart: true,
    interval: 1000,
  },
  parameters: {
    docs: {
      source: {
        code: `import { useMemoryMonitor } from "@usefy/use-memory-monitor";

function MemoryMonitor() {
  const {
    heapUsed,
    heapTotal,
    heapLimit,
    isSupported,
    isMonitoring,
    severity,
    start,
    stop,
    formatted,
  } = useMemoryMonitor({
    interval: 1000,
    autoStart: true,
  });

  if (!isSupported) {
    return <div>Memory monitoring not supported</div>;
  }

  return (
    <div>
      <h2>Memory Monitor</h2>
      <p>Heap Used: {formatted.heapUsed}</p>
      <p>Heap Total: {formatted.heapTotal}</p>
      <p>Heap Limit: {formatted.heapLimit}</p>
      <p>Severity: {severity}</p>
      <button onClick={isMonitoring ? stop : start}>
        {isMonitoring ? "Stop" : "Start"}
      </button>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check monitoring status
    await waitFor(() => {
      expect(canvas.getByTestId("monitoring-status")).toBeInTheDocument();
    });

    // Should display memory data
    await waitFor(
      () => {
        expect(canvas.getByTestId("heap-used")).toBeInTheDocument();
        expect(canvas.getByTestId("heap-total")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  },
};

/**
 * Threshold-based alerts with severity levels
 */
export const ThresholdAlerts: Story = {
  render: () => <ThresholdAlertsDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useMemoryMonitor } from "@usefy/use-memory-monitor";

function ThresholdMonitor() {
  const { severity, formatted, heapUsed, heapLimit } = useMemoryMonitor({
    interval: 1000,
    autoStart: true,
    thresholds: {
      medium: 50,  // Yellow alert at 50%
      high: 75,    // Orange alert at 75%
      critical: 90, // Red alert at 90%
    },
  });

  const usagePercent = heapUsed && heapLimit
    ? (heapUsed / heapLimit) * 100
    : 0;

  return (
    <div>
      <h2>Memory Usage: {usagePercent.toFixed(1)}%</h2>
      <p>Severity: {severity}</p>
      <p>Used: {formatted.heapUsed}</p>
      <p>Limit: {formatted.heapLimit}</p>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check usage display
    await waitFor(() => {
      expect(canvas.getByTestId("usage-percent")).toBeInTheDocument();
      expect(canvas.getByTestId("usage-bar")).toBeInTheDocument();
    });
  },
};

/**
 * Memory snapshots and comparison
 */
export const Snapshots: Story = {
  render: () => <SnapshotDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useMemoryMonitor } from "@usefy/use-memory-monitor";
import { useState } from "react";

function SnapshotExample() {
  const {
    takeSnapshot,
    compareSnapshots,
    clearSnapshots,
    getAllSnapshots,
  } = useMemoryMonitor({
    interval: 1000,
    autoStart: true,
  });

  const handleTakeSnapshot = () => {
    const snapshot = takeSnapshot(\`snapshot-\${Date.now()}\`);
    console.log("Snapshot taken:", snapshot);
  };

  const handleCompare = () => {
    const snapshots = getAllSnapshots();
    if (snapshots.length >= 2) {
      const diff = compareSnapshots(
        snapshots[0].id,
        snapshots[snapshots.length - 1].id
      );
      console.log("Memory difference:", diff);
    }
  };

  return (
    <div>
      <button onClick={handleTakeSnapshot}>Take Snapshot</button>
      <button onClick={handleCompare}>Compare</button>
      <button onClick={clearSnapshots}>Clear All</button>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Take a snapshot
    await userEvent.click(canvas.getByTestId("take-snapshot"));

    // Wait a bit and take another
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await userEvent.click(canvas.getByTestId("take-snapshot"));

    // Check snapshots list
    await waitFor(() => {
      const list = canvas.getByTestId("snapshots-list");
      expect(list.textContent).toContain("snapshot-");
    });
  },
};

/**
 * Memory history with visualization
 */
export const HistoryVisualization: Story = {
  render: () => <HistoryVisualizationDemo />,
  parameters: {
    docs: {
      source: {
        code: `import { useMemoryMonitor } from "@usefy/use-memory-monitor";

function HistoryExample() {
  const { history, trend, formatted } = useMemoryMonitor({
    interval: 500,
    autoStart: true,
    enableHistory: true,
    historySize: 30,
  });

  return (
    <div>
      <h2>Memory History</h2>
      <p>Current: {formatted.heapUsed}</p>
      <p>Trend: {trend}</p>
      <p>History Points: {history.length}</p>

      {/* Simple visualization */}
      <div>
        {history.map((point, i) => (
          <div key={i} style={{ height: point.heapUsed / 1024 / 1024 }}>
            {(point.heapUsed / 1024 / 1024).toFixed(2)} MB
          </div>
        ))}
      </div>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for history to populate
    await waitFor(
      () => {
        expect(canvas.getByTestId("history-chart")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  },
};

/**
 * Manual start/stop control
 */
export const ManualControl: Story = {
  args: {
    title: "Manual Control",
    autoStart: false,
    interval: 1000,
  },
  parameters: {
    docs: {
      source: {
        code: `import { useMemoryMonitor } from "@usefy/use-memory-monitor";

function ManualMonitor() {
  const { isMonitoring, start, stop, formatted } = useMemoryMonitor({
    autoStart: false,
    interval: 1000,
  });

  return (
    <div>
      <h2>Manual Control</h2>
      <p>Status: {isMonitoring ? "Monitoring" : "Stopped"}</p>
      <p>Heap Used: {formatted.heapUsed}</p>

      <button onClick={start} disabled={isMonitoring}>
        Start
      </button>
      <button onClick={stop} disabled={!isMonitoring}>
        Stop
      </button>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should start stopped
    await waitFor(() => {
      expect(canvas.getByTestId("start-button")).toBeInTheDocument();
    });

    // Start monitoring
    await userEvent.click(canvas.getByTestId("start-button"));

    // Should show stop button
    await waitFor(() => {
      expect(canvas.getByTestId("stop-button")).toBeInTheDocument();
    });
  },
};

// Chart color constants
const CHART_COLORS = {
  primary: "#6366f1", // indigo-500
  secondary: "#a855f7", // purple-500
  success: "#22c55e", // green-500
  warning: "#f59e0b", // amber-500
  danger: "#ef4444", // red-500
  gray: "#9ca3af", // gray-400
  lightGray: "#e5e7eb", // gray-200
};

const SEVERITY_COLORS = {
  normal: CHART_COLORS.success,
  warning: CHART_COLORS.warning,
  critical: CHART_COLORS.danger,
};

const PIE_COLORS = [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.lightGray];

/**
 * Comprehensive Overview Dashboard with all metrics visualized
 */
function OverviewDashboard() {
  const {
    memory,
    heapUsed,
    heapTotal,
    heapLimit,
    usagePercentage,
    domNodes,
    eventListeners,
    isSupported,
    isMonitoring,
    isLeakDetected,
    severity,
    supportLevel,
    availableMetrics,
    history,
    trend,
    leakProbability,
    start,
    stop,
    takeSnapshot,
    clearHistory,
    requestGC,
    formatted,
  } = useMemoryMonitor({
    interval: 500,
    autoStart: true,
    enableHistory: true,
    historySize: 50,
    trackDOMNodes: true,
    trackEventListeners: true,
    leakDetection: {
      enabled: true,
      sensitivity: "medium",
    },
  });

  const [showRawData, setShowRawData] = useState(false);

  // Transform history for area chart
  const chartData = useMemo(() => {
    return history.map((item, index) => ({
      index,
      time: new Date(item.timestamp).toLocaleTimeString("en-US", {
        hour12: false,
        minute: "2-digit",
        second: "2-digit",
      }),
      heapUsed: Math.round((item.heapUsed || 0) / 1024 / 1024),
      heapTotal: Math.round((item.heapTotal || 0) / 1024 / 1024),
    }));
  }, [history]);

  // Memory distribution for pie chart
  const distributionData = useMemo(() => {
    if (!heapUsed || !heapTotal || !heapLimit) return [];
    return [
      { name: "Used", value: heapUsed },
      { name: "Available", value: heapTotal - heapUsed },
      { name: "Reserved", value: heapLimit - heapTotal },
    ];
  }, [heapUsed, heapTotal, heapLimit]);

  // DOM metrics for bar chart
  const domMetricsData = useMemo(() => {
    return [
      { name: "DOM Nodes", value: domNodes || 0, fill: CHART_COLORS.primary },
      { name: "Event Listeners", value: eventListeners || 0, fill: CHART_COLORS.secondary },
    ];
  }, [domNodes, eventListeners]);

  // Gauge data for radial chart
  const gaugeData = useMemo(() => {
    return [
      {
        name: "Usage",
        value: usagePercentage || 0,
        fill: SEVERITY_COLORS[severity],
      },
    ];
  }, [usagePercentage, severity]);

  const severityColor = SEVERITY_COLORS[severity];

  return (
    <div className="p-8 max-w-[1400px] mx-auto font-sans bg-slate-50 min-h-screen text-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Memory Monitor Overview
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Real-time browser memory monitoring dashboard
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              isMonitoring
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {isMonitoring ? "● Live" : "○ Paused"}
          </span>
          <button
            onClick={isMonitoring ? stop : start}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              isMonitoring
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-indigo-500 hover:bg-indigo-600 text-white"
            }`}
            data-testid="overview-toggle"
          >
            {isMonitoring ? "Stop" : "Start"}
          </button>
          <button
            onClick={requestGC}
            className="px-4 py-2 rounded-lg font-medium bg-gray-200 hover:bg-gray-300 text-gray-700 transition-all"
            title="Request garbage collection hint"
          >
            GC
          </button>
        </div>
      </div>

      {/* Support Warning */}
      {!isSupported && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <p className="text-amber-800 font-medium">
            ⚠️ Limited browser support detected. Support level: {supportLevel}
          </p>
          <p className="text-amber-600 text-sm mt-1">
            Available metrics: {availableMetrics.join(", ") || "None"}
          </p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Heap Used Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <p className="text-slate-500 text-sm font-medium">Heap Used</p>
            <div className="p-2 bg-indigo-50 rounded-lg">
              <div className="w-4 h-4 bg-indigo-500 rounded-full opacity-20" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">
            {formatted.heapUsed}
          </p>
          <p className="text-slate-400 text-xs mt-1 font-medium">of {formatted.heapLimit} allocated</p>
        </div>

        {/* Usage Percentage Card with mini gauge */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <p className="text-slate-500 text-sm font-medium mb-2">Usage</p>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-bold" style={{ color: severityColor }}>
              {usagePercentage?.toFixed(1) || "0"}%
            </p>
            <div className="w-12 h-12">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="60%"
                  outerRadius="100%"
                  data={gaugeData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis
                    type="number"
                    domain={[0, 100]}
                    angleAxisId={0}
                    tick={false}
                  />
                  <RadialBar
                    dataKey="value"
                    cornerRadius={10}
                    background={{ fill: CHART_COLORS.lightGray }}
                    angleAxisId={0}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-slate-400 text-xs mt-1 capitalize font-medium">Status: {severity}</p>
        </div>

        {/* Trend Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <p className="text-slate-500 text-sm font-medium mb-2">Trend</p>
          <div className="flex items-center gap-2">
            <span
              className={`text-3xl font-bold ${
                trend === "increasing"
                  ? "text-red-500"
                  : trend === "decreasing"
                  ? "text-green-500"
                  : "text-gray-400"
              }`}
            >
              {trend === "increasing" ? "↗" : trend === "decreasing" ? "↘" : "→"}
            </span>
            <p className="text-lg font-semibold text-slate-700 capitalize">
              {trend}
            </p>
          </div>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Based on {history.length} samples
          </p>
        </div>

        {/* Leak Detection Card */}
        <div
          className={`rounded-2xl p-5 shadow-sm border hover:shadow-md transition-shadow ${
            isLeakDetected
              ? "bg-red-50 border-red-200"
              : "bg-white border-slate-200"
          }`}
        >
          <p className="text-slate-500 text-sm font-medium mb-2">Leak Detection</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl">
              {isLeakDetected ? "⚠️" : "✅"}
            </span>
            <p
              className={`text-lg font-bold ${
                isLeakDetected ? "text-red-600" : "text-green-600"
              }`}
            >
              {isLeakDetected ? "Detected" : "None"}
            </p>
          </div>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Probability: {leakProbability.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Main Chart - Memory History */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-800">
          Memory History (Real-time)
          </h2>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <div className="w-3 h-3 rounded-full bg-indigo-500"></div> Used
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <div className="w-3 h-3 rounded-full bg-purple-400 opacity-40"></div> Total
            </div>
          </div>
        </div>
        <div className="h-[300px]" data-testid="memory-chart">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="heapUsedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="heapTotalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickFormatter={(value) => `${value} MB`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  }}
                  formatter={(value) => [`${value} MB`]}
                />
                <Area
                  type="monotone"
                  dataKey="heapTotal"
                  stroke={CHART_COLORS.secondary}
                  fillOpacity={1}
                  fill="url(#heapTotalGradient)"
                  name="Heap Total"
                />
                <Area
                  type="monotone"
                  dataKey="heapUsed"
                  stroke={CHART_COLORS.primary}
                  fillOpacity={1}
                  fill="url(#heapUsedGradient)"
                  name="Heap Used"
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Collecting data...
            </div>
          )}
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Memory Breakdown - Shows both metrics meaningfully */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-full">
          <h2 className="text-lg font-bold text-slate-800 mb-6">
            Memory Breakdown
          </h2>
          <div className="flex flex-col gap-8" data-testid="distribution-chart">
            {/* Heap Utilization (heapUsed / heapTotal) - usually higher percentage */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-sm font-medium text-slate-600">Heap Utilization</span>
                <span className="text-xl font-bold text-indigo-600">
                  {heapUsed && heapTotal ? ((heapUsed / heapTotal) * 100).toFixed(1) : "0"}%
                </span>
              </div>
              <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 bg-gradient-to-r from-indigo-400 to-indigo-600"
                  style={{
                    width: `${heapUsed && heapTotal ? Math.max((heapUsed / heapTotal) * 100, 2) : 0}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                <span>{formatted.heapUsed} used</span>
                <span>{formatted.heapTotal} allocated</span>
              </div>
            </div>

            {/* Limit Usage (heapUsed / heapLimit) - your 2% case */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-sm font-medium text-slate-600">Limit Usage</span>
                <span className="text-xl font-bold" style={{ color: severityColor }}>
                  {usagePercentage?.toFixed(1) || "0"}%
                </span>
              </div>
              <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
                {/* Threshold markers */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10" style={{ left: "70%" }} />
                <div className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10" style={{ left: "90%" }} />
                {/* Progress fill - minimum width for visibility */}
                <div
                  className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(usagePercentage || 0, 1)}%`,
                    minWidth: "12px",
                    backgroundColor: severityColor,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                <span>{formatted.heapUsed} used</span>
                <span>{formatted.heapLimit} limit</span>
              </div>
            </div>

            {/* Memory values grid */}
            <div className="grid grid-cols-3 gap-3 mt-auto">
              <div className="text-center p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <div className="text-xs text-indigo-600/70 mb-1 font-medium uppercase tracking-wider">Used</div>
                <div className="font-bold text-indigo-600">{formatted.heapUsed}</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-100">
                <div className="text-xs text-purple-600/70 mb-1 font-medium uppercase tracking-wider">Allocated</div>
                <div className="font-bold text-purple-600">{formatted.heapTotal}</div>
              </div>
              <div className="text-center p-4 bg-slate-100 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">Limit</div>
                <div className="font-bold text-slate-600">{formatted.heapLimit}</div>
              </div>
            </div>

            {/* Severity badge */}
            <div className="flex justify-center">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  severity === "critical"
                    ? "bg-red-100 text-red-700"
                    : severity === "warning"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                Status: {severity === "critical" ? "Critical" : severity === "warning" ? "Warning" : "Normal"}
              </span>
            </div>
          </div>
        </div>

        {/* DOM & Event Listeners Bar Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-full">
          <h2 className="text-lg font-bold text-slate-800 mb-6">
            DOM & Event Metrics
          </h2>
          <div className="h-[300px]" data-testid="dom-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={domMetricsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Status & Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Support Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-3">Browser Support</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Support Level</span>
              <span
                className={`font-medium ${
                  supportLevel === "full"
                    ? "text-green-600"
                    : supportLevel === "partial"
                    ? "text-amber-600"
                    : "text-red-600"
                }`}
              >
                {supportLevel}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Available Metrics</span>
              <span className="font-medium text-gray-700">
                {availableMetrics.length}
              </span>
            </div>
          </div>
        </div>

        {/* Heap Details */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-3">Heap Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Total</span>
              <span className="font-medium text-gray-700">
                {formatted.heapTotal}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Limit</span>
              <span className="font-medium text-gray-700">
                {formatted.heapLimit}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-3">Actions</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => takeSnapshot(`snap-${Date.now()}`)}
              className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
            >
              📷 Snapshot
            </button>
            <button
              onClick={clearHistory}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              🗑️ Clear
            </button>
            <button
              onClick={() => setShowRawData(!showRawData)}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {showRawData ? "Hide" : "Show"} Raw
            </button>
          </div>
        </div>
      </div>

      {/* Raw Data Section */}
      {showRawData && memory && (
        <div className="bg-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-slate-200 mb-3">Raw Memory Data</h3>
          <pre className="text-sm text-slate-300 overflow-x-auto">
            {JSON.stringify(
              {
                memory,
                usagePercentage,
                domNodes,
                eventListeners,
                severity,
                trend,
                leakProbability,
                supportLevel,
                availableMetrics,
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * Comprehensive overview dashboard with all metrics visualized using charts
 */
export const Overview: Story = {
  render: () => <OverviewDashboard />,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        story:
          "A comprehensive dashboard showing all available memory metrics using interactive charts. " +
          "Features real-time memory history (Area Chart), memory distribution (Pie Chart), " +
          "DOM/Event metrics (Bar Chart), and status indicators.",
      },
      source: {
        code: `import { useMemoryMonitor } from "@usefy/use-memory-monitor";
import { AreaChart, PieChart, BarChart } from "recharts";

function MemoryDashboard() {
  const {
    memory,
    heapUsed,
    heapTotal,
    heapLimit,
    usagePercentage,
    domNodes,
    eventListeners,
    isSupported,
    isMonitoring,
    isLeakDetected,
    severity,
    supportLevel,
    availableMetrics,
    history,
    trend,
    leakProbability,
    start,
    stop,
    formatted,
  } = useMemoryMonitor({
    interval: 500,
    autoStart: true,
    enableHistory: true,
    historySize: 50,
    trackDOMNodes: true,
    trackEventListeners: true,
    leakDetection: { enabled: true, sensitivity: "medium" },
  });

  // Transform history for charts
  const chartData = history.map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString(),
    heapUsed: item.heapUsed / 1024 / 1024,
    heapTotal: item.heapTotal / 1024 / 1024,
  }));

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card title="Heap Used" value={formatted.heapUsed} />
        <Card title="Usage" value={\`\${usagePercentage?.toFixed(1)}%\`} />
        <Card title="Trend" value={trend} />
        <Card title="Leak" value={isLeakDetected ? "Detected" : "None"} />
      </div>

      {/* Memory History Chart */}
      <AreaChart data={chartData}>
        <Area dataKey="heapUsed" fill="indigo" />
        <Area dataKey="heapTotal" fill="purple" opacity={0.3} />
      </AreaChart>

      {/* Memory Distribution */}
      <PieChart>
        <Pie data={[
          { name: "Used", value: heapUsed },
          { name: "Free", value: heapTotal - heapUsed },
        ]} />
      </PieChart>

      {/* DOM Metrics */}
      <BarChart data={[
        { name: "DOM Nodes", value: domNodes },
        { name: "Listeners", value: eventListeners },
      ]}>
        <Bar dataKey="value" />
      </BarChart>
    </div>
  );
}`,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for charts to render
    await waitFor(
      () => {
        expect(canvas.getByTestId("memory-chart")).toBeInTheDocument();
        expect(canvas.getByTestId("distribution-chart")).toBeInTheDocument();
        expect(canvas.getByTestId("dom-chart")).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Toggle monitoring
    const toggleButton = canvas.getByTestId("overview-toggle");
    expect(toggleButton).toBeInTheDocument();
  },
};
