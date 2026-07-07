import { useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { MemoryMonitor, useMemoryMonitorHeadless } from "@usefy/memory-monitor";

// ============================================================================
// Code Block Component
// ============================================================================

function CodeBlock({ code, title }: { code: string; title?: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
      {title && (
        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</span>
        </div>
      )}
      <pre className="bg-slate-900 text-slate-100 p-4 text-sm overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof MemoryMonitor> = {
  title: "Components/MemoryMonitor",
  component: MemoryMonitor,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    mode: {
      control: "select",
      options: ["development", "production", "always", "headless", "never"],
      description: "When to render the panel. Use 'headless' for production monitoring without UI.",
      table: {
        type: { summary: "'development' | 'production' | 'always' | 'headless' | 'never'" },
        defaultValue: { summary: "'development'" },
      },
    },
    position: {
      control: "select",
      options: ["left", "right"],
      description: "Panel slide-in position",
      table: {
        type: { summary: "'left' | 'right'" },
        defaultValue: { summary: "'right'" },
      },
    },
    defaultOpen: {
      control: "boolean",
      description: "Initial open state",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    showTrigger: {
      control: "boolean",
      description: "Show floating trigger button",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
      },
    },
    defaultWidth: {
      control: { type: "number", min: 320, max: 600, step: 50 },
      description: "Initial panel width in pixels",
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "420" },
      },
    },
    zIndex: {
      control: { type: "number", min: 1000, max: 99999 },
      description: "Panel z-index",
      table: {
        type: { summary: "number" },
        defaultValue: { summary: "9999" },
      },
    },
    shortcut: {
      control: "text",
      description: "Keyboard shortcut to toggle panel",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "'ctrl+shift+m'" },
      },
    },
    enableLeakDetection: {
      control: "boolean",
      description: "Enable memory leak detection",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MemoryMonitor>;

// ============================================================================
// Overview Story
// ============================================================================

const OVERVIEW_CODE = `import { MemoryMonitor } from "@usefy/memory-monitor";

function App() {
  return (
    <div>
      <YourApp />
      {/* Add at the root of your app */}
      <MemoryMonitor />
    </div>
  );
}

// With custom options
<MemoryMonitor
  mode="always"           // 'development' | 'production' | 'always' | 'headless' | 'never'
  position="right"        // 'left' | 'right'
  defaultOpen={false}     // Initial open state
  defaultWidth={420}      // Panel width in pixels
  shortcut="ctrl+shift+m" // Keyboard shortcut
  enableLeakDetection     // Enable memory leak detection
  onOpenChange={(open) => console.log('Panel:', open)}
  onWarning={(data) => console.log('Warning:', data)}
  onAutoGC={(data) => console.log('Auto-GC:', data)}
/>`;

export const Overview: Story = {
  args: {
    mode: "always",
    position: "right",
    defaultOpen: true,
    showTrigger: true,
    defaultWidth: 420,
    enableLeakDetection: true,
  },
  render: (args) => (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
          MemoryMonitor Demo
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mb-8">
          Real-time browser memory monitoring with a slide-in panel UI.
          Click the trigger button or press <kbd className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded text-xs">Ctrl+Shift+M</kbd> to toggle.
        </p>

        <div className="mb-6">
          <CodeBlock code={OVERVIEW_CODE} title="Usage" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">
              Panel Tabs
            </h3>
            <ul className="space-y-2 text-slate-600 dark:text-slate-300">
              <li><strong>Overview:</strong> Real-time memory gauge and metrics</li>
              <li><strong>History:</strong> Time-series chart of memory usage</li>
              <li><strong>Snapshots:</strong> Capture and compare memory states</li>
              <li><strong>Settings:</strong> Configure thresholds and auto-GC</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">
              Keyboard Shortcuts
            </h3>
            <ul className="space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                <kbd className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded text-xs">Ctrl+Shift+M</kbd>{" "}
                Toggle panel
              </li>
              <li>
                <kbd className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded text-xs">Escape</kbd>{" "}
                Close panel
              </li>
            </ul>
          </div>
        </div>
      </div>

      <MemoryMonitor {...args} />
    </div>
  ),
};

// ============================================================================
// Snapshot Settings Story
// ============================================================================

const SNAPSHOT_SETTINGS_CODE = `import { MemoryMonitor } from "@usefy/memory-monitor";

// Snapshot settings are configured in the Settings tab
// - Maximum Snapshots: 1-50 (default: 10)
// - Auto Snapshot Schedule: off | 1min | 5min | 10min | 30min | 1hour | 6hour | 24hour
// - Auto-delete oldest: when max is reached

<MemoryMonitor
  mode="always"
  // Settings are persisted in localStorage
  persistSettings={true}
  storageKey="memory-monitor-settings"
/>`;

export const SnapshotSettings: Story = {
  args: {
    mode: "always",
    position: "right",
    defaultOpen: true,
    showTrigger: true,
    defaultWidth: 420,
  },
  render: (args) => (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
          Snapshot Settings Demo
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mb-8">
          Configure snapshot limits and automatic snapshot schedules in the Settings tab.
        </p>

        <div className="mb-6">
          <CodeBlock code={SNAPSHOT_SETTINGS_CODE} title="Configuration" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
            <h3 className="font-medium text-slate-800 dark:text-white mb-2">
              Configurable Limits
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Set maximum snapshots from 1 to 50. When limit is reached,
              oldest snapshot is auto-deleted if enabled.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
            <h3 className="font-medium text-slate-800 dark:text-white mb-2">
              Scheduled Snapshots
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Automatically capture snapshots at intervals: 1min, 5min, 10min,
              30min, 1hour, 6hours, or 24hours.
            </p>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <p className="text-amber-800 dark:text-amber-200 text-sm">
            <strong>Tip:</strong> Auto-captured snapshots are marked with a purple "Auto" badge
            in the Snapshots tab to distinguish them from manual snapshots.
          </p>
        </div>
      </div>

      <MemoryMonitor {...args} />
    </div>
  ),
};

// ============================================================================
// Left Position Story
// ============================================================================

const LEFT_POSITION_CODE = `import { MemoryMonitor } from "@usefy/memory-monitor";

// Panel slides in from the left
<MemoryMonitor
  position="left"
  mode="always"
/>`;

export const LeftPosition: Story = {
  args: {
    mode: "always",
    position: "left",
    defaultOpen: true,
    showTrigger: true,
  },
  render: (args) => (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
          Left Position Demo
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mb-8">
          The panel slides in from the left side of the screen.
        </p>

        <CodeBlock code={LEFT_POSITION_CODE} title="Usage" />
      </div>
      <MemoryMonitor {...args} />
    </div>
  ),
};

// ============================================================================
// Headless Mode Demo
// ============================================================================

const HEADLESS_MODE_CODE = `import { MemoryMonitor } from "@usefy/memory-monitor";

// Recommended: Use mode="headless" for easy environment switching
function App() {
  return (
    <div>
      <YourApp />
      <MemoryMonitor
        // Switch between dev UI and production headless
        mode={process.env.NODE_ENV === 'development' ? 'always' : 'headless'}
        onWarning={(data) => {
          console.warn("Memory warning:", data);
          analytics.track("memory_warning", data);
        }}
        onCritical={(data) => {
          console.error("Critical memory:", data);
          alertService.send(data);
        }}
        onLeakDetected={(analysis) => {
          Sentry.captureMessage("Memory leak detected", { extra: analysis });
        }}
      />
    </div>
  );
}

// Alternative: useMemoryMonitorHeadless hook for more control
import { useMemoryMonitorHeadless } from "@usefy/memory-monitor";

function ProductionMonitor() {
  const { memory, severity, requestGC } = useMemoryMonitorHeadless({
    interval: 1000,
    warningThreshold: 70,
    criticalThreshold: 90,
    onWarning: (data) => analytics.track("memory_warning", data),
  });

  return null; // No UI
}`;

function HeadlessModeDemo() {
  const [events, setEvents] = useState<Array<{ type: string; time: string; data: string }>>([]);

  const addEvent = (type: string, data: string) => {
    setEvents((prev) => [
      { type, time: new Date().toLocaleTimeString(), data },
      ...prev.slice(0, 9),
    ]);
  };

  const {
    memory,
    severity,
    isLeakDetected,
    trend,
    requestGC,
    isSupported,
  } = useMemoryMonitorHeadless({
    interval: 1000,
    warningThreshold: 70,
    criticalThreshold: 90,
    enableAutoGC: true,
    autoGCThreshold: 85,
    enableLeakDetection: true,
    leakSensitivity: "medium",
    onWarning: (data) => {
      addEvent("warning", `Usage: ${data.usagePercentage.toFixed(1)}%`);
    },
    onCritical: (data) => {
      addEvent("critical", `Usage: ${data.usagePercentage.toFixed(1)}%`);
    },
    onLeakDetected: (analysis) => {
      addEvent("leak", `Probability: ${analysis.probability.toFixed(0)}%`);
    },
    onAutoGC: (data) => {
      addEvent("gc", `Triggered at ${data.usage.toFixed(1)}%`);
    },
  });

  useEffect(() => {
    if (memory) {
      addEvent("update", `${(memory.heapUsed / 1024 / 1024).toFixed(1)} MB`);
    }
  }, [memory?.heapUsed]);

  const severityColors = {
    normal: "bg-green-100 text-green-800 border-green-200",
    warning: "bg-amber-100 text-amber-800 border-amber-200",
    critical: "bg-red-100 text-red-800 border-red-200",
  };

  const eventColors: Record<string, string> = {
    update: "bg-slate-100 text-slate-600",
    warning: "bg-amber-100 text-amber-700",
    critical: "bg-red-100 text-red-700",
    leak: "bg-purple-100 text-purple-700",
    gc: "bg-indigo-100 text-indigo-700",
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Headless Mode Demo
        </h1>
        <p className="text-slate-600 mb-8">
          No visible panel - just monitoring in background with callbacks.
        </p>

        <div className="mb-6">
          <CodeBlock code={HEADLESS_MODE_CODE} title="Usage" />
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Memory</p>
            <p className="text-2xl font-bold text-slate-800">
              {memory ? `${(memory.heapUsed / 1024 / 1024).toFixed(1)} MB` : "N/A"}
            </p>
          </div>
          <div className={`rounded-xl p-4 shadow-sm border ${severityColors[severity]}`}>
            <p className="text-xs uppercase tracking-wider mb-1 opacity-70">Severity</p>
            <p className="text-2xl font-bold capitalize">{severity}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Trend</p>
            <p className="text-2xl font-bold text-slate-800 capitalize">{trend}</p>
          </div>
          <div className={`rounded-xl p-4 shadow-sm border ${isLeakDetected ? "bg-red-100 text-red-800 border-red-200" : "bg-green-100 text-green-800 border-green-200"}`}>
            <p className="text-xs uppercase tracking-wider mb-1 opacity-70">Leak</p>
            <p className="text-2xl font-bold">{isLeakDetected ? "Detected" : "None"}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-800">Manual Actions</h2>
              <p className="text-sm text-slate-500">Request garbage collection manually</p>
            </div>
            <button
              onClick={requestGC}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
            >
              Request GC
            </button>
          </div>
        </div>

        {/* Event Log */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="font-semibold text-slate-800 mb-4">Event Log (Last 10)</h2>
          <div className="space-y-2">
            {events.length === 0 ? (
              <p className="text-slate-400 text-sm">Waiting for events...</p>
            ) : (
              events.map((event, i) => (
                <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${eventColors[event.type] || eventColors.update}`}>
                  <span className="font-mono text-xs opacity-60">{event.time}</span>
                  <span className="font-medium uppercase text-xs w-16">{event.type}</span>
                  <span>{event.data}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {!isSupported && (
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-800 text-sm">
              <strong>Note:</strong> Full memory API not supported in this browser.
              Some metrics may be limited.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export const HeadlessMode: Story = {
  render: () => <HeadlessModeDemo />,
};

// ============================================================================
// Callback Events Demo
// ============================================================================

const CALLBACK_EVENTS_CODE = `import { MemoryMonitor } from "@usefy/memory-monitor";

<MemoryMonitor
  mode="always"
  onOpenChange={(isOpen) => {
    console.log("Panel:", isOpen ? "opened" : "closed");
  }}
  onWarning={(data) => {
    console.warn("Warning at", data.usagePercentage.toFixed(1) + "%");
    // Send to analytics
  }}
  onCritical={(data) => {
    console.error("Critical at", data.usagePercentage.toFixed(1) + "%");
    // Trigger alert
  }}
  onLeakDetected={(analysis) => {
    console.warn("Leak probability:", analysis.probability + "%");
    // Report to error tracking
  }}
  onAutoGC={(data) => {
    console.log("Auto-GC at", data.usage.toFixed(1) + "%");
  }}
  onUpdate={(memory) => {
    // Called on every memory measurement
  }}
/>`;

function CallbackEventsDemo() {
  const [events, setEvents] = useState<Array<{ type: string; time: string; data: string }>>([]);

  const addEvent = (type: string, data: string) => {
    setEvents((prev) => [
      { type, time: new Date().toLocaleTimeString(), data },
      ...prev.slice(0, 19),
    ]);
  };

  const eventColors: Record<string, string> = {
    open: "bg-blue-100 text-blue-700",
    close: "bg-slate-100 text-slate-600",
    warning: "bg-amber-100 text-amber-700",
    critical: "bg-red-100 text-red-700",
    leak: "bg-purple-100 text-purple-700",
    gc: "bg-indigo-100 text-indigo-700",
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Callback Events Demo
        </h1>
        <p className="text-slate-600 mb-8">
          Open the panel and interact to see events logged below.
        </p>

        <div className="mb-6">
          <CodeBlock code={CALLBACK_EVENTS_CODE} title="Available Callbacks" />
        </div>

        {/* Event Log */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8">
          <h2 className="font-semibold text-slate-800 mb-4">Event Stream</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-slate-400 text-sm">Interact with the panel to see events...</p>
            ) : (
              events.map((event, i) => (
                <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${eventColors[event.type] || "bg-slate-100"}`}>
                  <span className="font-mono text-xs opacity-60">{event.time}</span>
                  <span className="font-medium uppercase text-xs w-16">{event.type}</span>
                  <span>{event.data}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Callback Reference */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="font-semibold text-slate-800 mb-4">Callback Reference</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-lg">
              <code className="text-indigo-600 text-sm">onOpenChange</code>
              <p className="text-xs text-slate-500 mt-1">Panel open/close state</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <code className="text-indigo-600 text-sm">onWarning</code>
              <p className="text-xs text-slate-500 mt-1">Warning threshold exceeded</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <code className="text-indigo-600 text-sm">onCritical</code>
              <p className="text-xs text-slate-500 mt-1">Critical threshold exceeded</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <code className="text-indigo-600 text-sm">onLeakDetected</code>
              <p className="text-xs text-slate-500 mt-1">Memory leak detected</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <code className="text-indigo-600 text-sm">onAutoGC</code>
              <p className="text-xs text-slate-500 mt-1">Auto-GC triggered</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <code className="text-indigo-600 text-sm">onUpdate</code>
              <p className="text-xs text-slate-500 mt-1">Every measurement update</p>
            </div>
          </div>
        </div>
      </div>

      <MemoryMonitor
        mode="always"
        position="right"
        defaultOpen={false}
        onOpenChange={(isOpen) => {
          addEvent(isOpen ? "open" : "close", isOpen ? "Panel opened" : "Panel closed");
        }}
        onWarning={(data) => {
          addEvent("warning", `Usage: ${data.usagePercentage.toFixed(1)}% (threshold: ${data.threshold}%)`);
        }}
        onCritical={(data) => {
          addEvent("critical", `Usage: ${data.usagePercentage.toFixed(1)}% (threshold: ${data.threshold}%)`);
        }}
        onLeakDetected={(analysis) => {
          addEvent("leak", `Probability: ${analysis.probability.toFixed(0)}%, Trend: ${analysis.trend}`);
        }}
        onAutoGC={(data) => {
          addEvent("gc", `Triggered at ${data.usage.toFixed(1)}%`);
        }}
      />
    </div>
  );
}

export const CallbackEvents: Story = {
  render: () => <CallbackEventsDemo />,
};

// ============================================================================
// Custom Trigger Story
// ============================================================================

const CUSTOM_TRIGGER_CODE = `import { MemoryMonitor } from "@usefy/memory-monitor";

// Custom trigger content
<MemoryMonitor
  triggerContent={
    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full">
      <span>📊</span>
      <span>Memory</span>
    </div>
  }
/>

// Or hide trigger and control programmatically
const [isOpen, setIsOpen] = useState(false);

<MemoryMonitor
  showTrigger={false}
  defaultOpen={isOpen}
  onOpenChange={setIsOpen}
/>

<button onClick={() => setIsOpen(true)}>Open Memory Panel</button>`;

export const CustomTrigger: Story = {
  args: {
    mode: "always",
    position: "right",
    defaultOpen: false,
    showTrigger: true,
    triggerContent: (
      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all">
        <span className="text-lg">📊</span>
        <span className="font-medium">Memory</span>
      </div>
    ),
  },
  render: (args) => (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
          Custom Trigger Demo
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mb-8">
          Click the custom "Memory" button in the bottom-right corner to open the panel.
        </p>

        <CodeBlock code={CUSTOM_TRIGGER_CODE} title="Customization" />
      </div>
      <MemoryMonitor {...args} />
    </div>
  ),
};

// ============================================================================
// Threshold Configuration Story
// ============================================================================

const THRESHOLD_CODE = `import { MemoryMonitor } from "@usefy/memory-monitor";

<MemoryMonitor
  // Threshold configuration
  warningThreshold={60}   // Yellow indicator at 60%
  criticalThreshold={85}  // Red indicator at 85%

  // Auto-GC configuration
  enableAutoGC={true}
  autoGCThreshold={80}    // Request GC at 80%

  // Callbacks
  onWarning={(data) => console.warn("Warning:", data)}
  onCritical={(data) => console.error("Critical:", data)}
  onAutoGC={(data) => console.log("Auto-GC:", data)}
/>`;

export const ThresholdConfiguration: Story = {
  args: {
    mode: "always",
    position: "right",
    defaultOpen: true,
    warningThreshold: 60,
    criticalThreshold: 85,
    enableAutoGC: true,
    autoGCThreshold: 80,
    persistSettings: false,
  },
  render: (args) => (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
          Threshold Configuration
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mb-8">
          Configure warning, critical, and auto-GC thresholds.
        </p>

        <div className="mb-6">
          <CodeBlock code={THRESHOLD_CODE} title="Configuration" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <h3 className="font-bold text-amber-800 dark:text-amber-200 mb-2">
              Warning: 60%
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Yellow indicator when memory usage exceeds 60%
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <h3 className="font-bold text-red-800 dark:text-red-200 mb-2">
              Critical: 85%
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300">
              Red indicator when memory usage exceeds 85%
            </p>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
            <h3 className="font-bold text-indigo-800 dark:text-indigo-200 mb-2">
              Auto-GC: 80%
            </h3>
            <p className="text-sm text-indigo-700 dark:text-indigo-300">
              Request GC when memory usage exceeds 80%
            </p>
          </div>
        </div>
      </div>
      <MemoryMonitor {...args} />
    </div>
  ),
};

// ============================================================================
// Dark Mode Story
// ============================================================================

const DARK_MODE_CODE = `import { MemoryMonitor } from "@usefy/memory-monitor";

// Theme options
<MemoryMonitor theme="system" />  // Follow OS preference (default)
<MemoryMonitor theme="light" />   // Always light mode
<MemoryMonitor theme="dark" />    // Always dark mode

// Theme can also be changed in Settings tab`;

export const DarkMode: Story = {
  args: {
    mode: "always",
    position: "right",
    defaultOpen: true,
    theme: "dark",
    persistSettings: false,
  },
  render: (args) => (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-4">
          Dark Mode Demo
        </h1>
        <p className="text-slate-300 mb-8">
          MemoryMonitor supports dark mode with automatic system preference detection.
        </p>

        <CodeBlock code={DARK_MODE_CODE} title="Theme Options" />
      </div>
      <MemoryMonitor {...args} />
    </div>
  ),
};

// ============================================================================
// Leak Detection Story
// ============================================================================

const LEAK_DETECTION_CODE = `import { MemoryMonitor } from "@usefy/memory-monitor";

<MemoryMonitor
  enableLeakDetection={true}
  leakSensitivity="medium"  // 'low' | 'medium' | 'high'
  onLeakDetected={(analysis) => {
    console.warn("Leak detected:", {
      probability: analysis.probability,  // 0-100%
      trend: analysis.trend,              // 'increasing' | 'stable' | 'decreasing'
      recommendation: analysis.recommendation,
    });

    // Report to error tracking
    Sentry.captureMessage("Memory leak detected", {
      extra: analysis,
    });
  }}
/>

// Sensitivity levels:
// - low:    100KB/sample growth, R² ≥ 0.8 (fewer false positives)
// - medium: 50KB/sample growth, R² ≥ 0.7 (balanced)
// - high:   10KB/sample growth, R² ≥ 0.6 (quick detection)`;

export const LeakDetection: Story = {
  args: {
    mode: "always",
    position: "right",
    defaultOpen: true,
    enableLeakDetection: true,
    leakSensitivity: "high",
    persistSettings: false,
  },
  render: (args) => (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
          Memory Leak Detection
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mb-8">
          Advanced leak detection using linear regression and GC analysis.
        </p>

        <div className="mb-6">
          <CodeBlock code={LEAK_DETECTION_CODE} title="Configuration" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
            <h3 className="font-medium text-slate-800 dark:text-white mb-2">
              5-Factor Weighted Scoring
            </h3>
            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <li>• Slope (Growth Rate): 30 points</li>
              <li>• R² (Consistency): 20 points</li>
              <li>• GC Ineffectiveness: 25 points</li>
              <li>• Observation Time: 15 points</li>
              <li>• Baseline Growth: 10 points</li>
            </ul>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
            <h3 className="font-medium text-slate-800 dark:text-white mb-2">
              Sensitivity Levels
            </h3>
            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <li>• <strong>Low:</strong> 100KB/sample, R² ≥ 0.8</li>
              <li>• <strong>Medium:</strong> 50KB/sample, R² ≥ 0.7</li>
              <li>• <strong>High:</strong> 10KB/sample, R² ≥ 0.6</li>
            </ul>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <p className="text-amber-800 dark:text-amber-200 text-sm">
            <strong>Tip:</strong> Leak detection requires at least 10 samples and 30 seconds
            of observation before providing accurate results.
          </p>
        </div>
      </div>
      <MemoryMonitor {...args} />
    </div>
  ),
};
