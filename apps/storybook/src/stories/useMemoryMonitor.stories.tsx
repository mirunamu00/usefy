import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useMemoryMonitor } from "@usefy/use-memory-monitor";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { storyTheme } from "../styles/storyTheme";

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
