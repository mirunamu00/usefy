import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { MemoryMonitorPanel } from "@usefy/memory-monitor-panel";

/**
 * MemoryMonitorPanel is an enterprise-grade React component for real-time
 * browser memory monitoring with a slide-in panel UI.
 *
 * ## Features
 * - Real-time memory usage visualization with gauges and charts
 * - Slide-in panel UI (left or right position)
 * - Keyboard shortcuts (Ctrl+Shift+M to toggle)
 * - Auto-GC trigger when thresholds are exceeded
 * - Memory leak detection and warnings
 * - Snapshot comparison for debugging
 * - Settings persistence via LocalStorage
 * - Dark mode support
 *
 * ## Browser Support
 * - Chrome/Edge: Full support with `performance.memory` API
 * - Firefox/Safari: Limited support (DOM-only metrics)
 *
 * ## Usage
 * Add the component at the root of your app. It renders a floating trigger
 * button that opens the panel when clicked.
 */
const meta: Meta<typeof MemoryMonitorPanel> = {
  title: "Components/MemoryMonitorPanel",
  component: MemoryMonitorPanel,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Enterprise-grade React component for real-time browser memory monitoring with a slide-in panel UI.\n\n" +
          "**Key Features:**\n" +
          "- Real-time memory gauges and time-series charts\n" +
          "- Keyboard shortcuts (Ctrl+Shift+M)\n" +
          "- Auto-GC trigger with configurable thresholds\n" +
          "- Memory leak detection\n" +
          "- Snapshot comparison\n" +
          "- Settings persistence via LocalStorage\n" +
          "- Dark mode support\n" +
          "- SSR compatible",
      },
    },
  },
  argTypes: {
    mode: {
      control: "select",
      options: ["development", "production", "always", "never"],
      description: "When to render the panel",
      table: {
        type: { summary: "'development' | 'production' | 'always' | 'never'" },
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
type Story = StoryObj<typeof MemoryMonitorPanel>;

/**
 * Interactive overview of the MemoryMonitorPanel component.
 *
 * **How to use:**
 * 1. Click the floating trigger button (bottom-right) or press `Ctrl+Shift+M` to open the panel
 * 2. Explore the tabs:
 *    - **Overview**: Real-time memory gauge, heap breakdown, DOM metrics
 *    - **History**: Time-series chart of memory usage
 *    - **Snapshots**: Capture and compare memory snapshots
 *    - **Settings**: Configure thresholds, auto-GC, polling interval
 * 3. Try the keyboard shortcuts:
 *    - `Ctrl+Shift+M`: Toggle panel
 *    - `Escape`: Close panel
 */
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
      {/* Demo content */}
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
          MemoryMonitorPanel Demo
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mb-8">
          This is a demo page showing the MemoryMonitorPanel component. The
          panel is open by default for demonstration purposes.
        </p>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg mb-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
            Quick Start
          </h2>
          <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
            {`import { MemoryMonitorPanel } from "@usefy/memory-monitor-panel";

function App() {
  return (
    <div>
      <YourApp />
      {/* Add at the root of your app */}
      <MemoryMonitorPanel />
    </div>
  );
}`}
          </pre>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">
              Panel Tabs
            </h3>
            <ul className="space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                <strong>Overview:</strong> Real-time memory gauge and metrics
              </li>
              <li>
                <strong>History:</strong> Time-series chart of memory usage
              </li>
              <li>
                <strong>Snapshots:</strong> Capture and compare memory states
              </li>
              <li>
                <strong>Settings:</strong> Configure thresholds and auto-GC
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">
              Keyboard Shortcuts
            </h3>
            <ul className="space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                <kbd className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded text-xs">
                  Ctrl+Shift+M
                </kbd>{" "}
                Toggle panel
              </li>
              <li>
                <kbd className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded text-xs">
                  Escape
                </kbd>{" "}
                Close panel
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* The panel component */}
      <MemoryMonitorPanel {...args} />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `import { MemoryMonitorPanel } from "@usefy/memory-monitor-panel";

// Basic usage - renders in development mode only
<MemoryMonitorPanel />

// With custom options
<MemoryMonitorPanel
  mode="always"           // 'development' | 'production' | 'always' | 'never'
  position="right"        // 'left' | 'right'
  defaultOpen={false}     // Initial open state
  defaultWidth={420}      // Panel width in pixels
  shortcut="ctrl+shift+m" // Keyboard shortcut
  enableLeakDetection     // Enable memory leak detection
  onOpenChange={(open) => console.log('Panel:', open)}
  onWarning={(data) => console.log('Warning:', data)}
  onAutoGC={(data) => console.log('Auto-GC:', data)}
/>`,
        language: "tsx",
        type: "code",
      },
    },
  },
};
