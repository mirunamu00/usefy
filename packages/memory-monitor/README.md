<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/memory-monitor</h1>

<p align="center">
  <strong>React component for real-time browser memory monitoring</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/memory-monitor">
    <img src="https://img.shields.io/npm/v/@usefy/memory-monitor.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/memory-monitor">
    <img src="https://img.shields.io/npm/dm/@usefy/memory-monitor.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/memory-monitor">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/memory-monitor?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/memory-monitor.svg?style=flat-square&color=007acc" alt="license" />
  </a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#examples">Examples</a> •
  <a href="#browser-support">Browser Support</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/story/memory-monitor--overview" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/memory-monitor` is a React component for real-time browser memory monitoring with a slide-in panel UI. It provides memory visualization, leak detection, automatic GC triggers, snapshot management, and HTML report generation.

**Includes `useMemoryMonitorHeadless` hook** for programmatic memory monitoring without UI — perfect for production environments where you only need data and callbacks.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem.**

### Why memory-monitor?

- **Real-time Memory Visualization** — Live gauges, charts, and heap breakdowns with configurable refresh intervals
- **Advanced Leak Detection** — Multi-factor algorithm using linear regression, GC analysis, and baseline tracking
- **Auto-GC Trigger** — Automatically request garbage collection when thresholds are exceeded
- **Snapshot System** — Manual and scheduled snapshots with comparison capabilities
- **Professional Reports** — Generate comprehensive HTML diagnostic reports with charts and recommendations
- **Settings Persistence** — All configurations saved to LocalStorage automatically
- **TypeScript First** — Full type safety with comprehensive exported interfaces
- **SSR Compatible** — Safe to use with Next.js, Remix, and other SSR frameworks

---

## Installation

```bash
# npm
npm install @usefy/memory-monitor

# yarn
yarn add @usefy/memory-monitor

# pnpm
pnpm add @usefy/memory-monitor
```

### Peer Dependencies

This package requires React 18+ and Recharts:

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0",
    "recharts": "^2.0.0"
  }
}
```

---

## Quick Start

```tsx
import { MemoryMonitor } from "@usefy/memory-monitor";

function App() {
  return (
    <div>
      <YourApp />
      {/* Add at the root of your app */}
      <MemoryMonitor />
    </div>
  );
}
```

> **Note:** Styles are automatically injected. No CSS import required!

The panel renders only in development mode by default. A floating trigger button appears in the corner, and pressing `Ctrl+Shift+M` toggles the panel.

---

## Features

### Real-time Memory Monitoring

The panel provides comprehensive real-time memory visualization:

- **Memory Gauge** — Custom SVG radial gauge (180° arc) showing current heap usage percentage with severity-based colors
- **Heap Breakdown** — Visual representation of Used/Total/Limit with progress bars
- **DOM Metrics** — Track DOM node count and estimated event listeners
- **Configurable Interval** — Set polling frequency from 500ms to 10 seconds

```tsx
<MemoryMonitor
  interval={1000}
  trackDOMNodes={true}
  trackEventListeners={true}
/>
```

### Threshold-based Alerts

Configure custom thresholds to receive alerts when memory usage exceeds limits:

```tsx
<MemoryMonitor
  warningThreshold={70}    // Yellow alert at 70%
  criticalThreshold={90}   // Red alert at 90%
  onWarning={(data) => {
    console.warn('Memory warning!', data.usagePercentage);
  }}
  onCritical={(data) => {
    console.error('Memory critical!', data.usagePercentage);
    // Send to monitoring service
  }}
/>
```

**Severity Levels:**
| Level | Color | Description |
|-------|-------|-------------|
| `normal` | Green | Memory usage below warning threshold |
| `warning` | Amber | Memory usage exceeds warning threshold |
| `critical` | Red | Memory usage exceeds critical threshold |

### Memory Leak Detection Algorithm

The component uses a sophisticated multi-factor algorithm to detect memory leaks with high accuracy while minimizing false positives.

#### Algorithm Overview

1. **Linear Regression Analysis** — Uses the least squares method to calculate memory growth trend
2. **R² Calculation** — Measures regression fit quality (coefficient of determination)
3. **GC Event Detection** — Identifies garbage collection events by detecting ≥10% memory drops
4. **Baseline Analysis** — Tracks post-GC memory "floor" to identify true leaks
5. **Weighted Probability** — Combines multiple factors for accurate detection

#### Probability Factors (Weighted Scoring)

The algorithm calculates leak probability using 5 weighted factors totaling 100 points:

| Factor | Max Points | Description |
|--------|------------|-------------|
| **Slope** | 30 | Memory growth rate (bytes per sample) |
| **R² Fit** | 20 | How consistent the growth pattern is (0-1) |
| **GC Ineffectiveness** | 25 | Whether GC fails to reclaim memory |
| **Observation Time** | 15 | Longer observation increases confidence |
| **Baseline Growth** | 10 | Whether post-GC baseline is rising |

#### Sensitivity Levels

| Level | Min Slope | Min R² | Min GC Cycles | Min Observation |
|-------|-----------|--------|---------------|-----------------|
| `low` | 100 KB/sample | 0.8 | 3 | 60 seconds |
| `medium` | 50 KB/sample | 0.7 | 2 | 30 seconds |
| `high` | 10 KB/sample | 0.6 | 1 | 15 seconds |

#### Detection Flow

```
┌─────────────────────────────────────┐
│  Collect Samples (min 10, min 30s)  │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│    Detect GC Events (≥10% drop)     │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│   Calculate Baseline (post-GC avg)  │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│       Analyze Baseline Trend        │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│   Calculate Weighted Probability    │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  Apply False Positive Reduction     │
│  - GC effective → reduce score      │
│  - Stable trend → cap score         │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  Final: Probability ≥70% = Leak     │
└─────────────────────────────────────┘
```

#### Usage

```tsx
<MemoryMonitor
  enableLeakDetection={true}
  leakSensitivity="medium"
  onLeakDetected={(analysis) => {
    console.warn('Leak detected!', {
      probability: analysis.probability,
      trend: analysis.trend,
      recommendation: analysis.recommendation,
    });
  }}
/>
```

### Auto-GC Trigger

Automatically request garbage collection when memory usage exceeds a threshold:

```tsx
<MemoryMonitor
  enableAutoGC={true}
  autoGCThreshold={85}  // Trigger at 85%
  onAutoGC={(event) => {
    console.log('Auto-GC triggered at', event.usage + '%');
  }}
/>
```

**Key Features:**
- **10-second Cooldown** — Prevents excessive GC requests (thrashing prevention)
- **Browser Support Check** — Gracefully handles unsupported browsers
- **Callback Notification** — Get notified when auto-GC triggers

> **Note:** JavaScript cannot force GC. This feature sends a hint to the browser's garbage collector via `performance.memory` API. Works best in Chrome/Edge with DevTools open.

### Snapshot System

Capture memory states at specific points for analysis and comparison.

#### Manual Snapshots

Take snapshots on-demand via the UI or programmatically:
- Sequential numbering that persists across sessions
- Captures full memory metadata (heapUsed, heapTotal, heapLimit, domNodes, eventListeners)
- Stores analysis context at capture time

#### Auto-Scheduled Snapshots

Configure automatic snapshot capture at regular intervals:

| Schedule Option | Interval |
|-----------------|----------|
| Off | Disabled |
| Every 1 minute | 60,000 ms |
| Every 5 minutes | 300,000 ms |
| Every 10 minutes | 600,000 ms |
| Every 30 minutes | 1,800,000 ms |
| Every 1 hour | 3,600,000 ms |
| Every 6 hours | 21,600,000 ms |
| Every 24 hours | 86,400,000 ms |

Auto-captured snapshots are marked with an "Auto" badge in the UI.

#### Snapshot Capacity Management

- **Max Snapshots** — Configure 1 to 50 snapshots (default: 10)
- **Auto-delete Oldest** — When enabled, oldest snapshot is automatically deleted when capacity is reached

#### Snapshot Comparison

Select two snapshots to compare:
- **Heap Delta** — Difference in heap usage (bytes and percentage)
- **DOM Nodes Delta** — Change in DOM node count
- **Event Listeners Delta** — Change in event listener count
- **Time Delta** — Duration between snapshots

#### Analysis Context

Each snapshot captures the current analysis state:

```typescript
interface SnapshotAnalysisContext {
  trend: "stable" | "increasing" | "decreasing";
  leakProbability: number;  // 0-100
  severity: "normal" | "warning" | "critical";
  usagePercentage: number;  // 0-100
}
```

### Report Generation

Generate professional HTML diagnostic reports for debugging and documentation.

#### Requirements

- Minimum **5 snapshots** required to generate a report
- Progress indicator shows "Generate Report (X/5)" until requirement is met

#### Report Sections

The generated HTML report contains 9 comprehensive sections:

1. **Header**
   - Application name
   - Report generation timestamp
   - Time range covered (start - end)
   - Number of snapshots analyzed

2. **Executive Summary**
   - Health score ring visualization (0-100)
   - Health grade (A, B, C, D, F)
   - Leak probability gauge
   - Key metrics cards

3. **Memory Trends**
   - Heap memory over time (line chart)
   - Heap Used vs Heap Total visualization

4. **Usage Distribution**
   - Min, Q1, Median, Q3, Max visualization
   - Trend analysis distribution (pie chart)

5. **DOM & Event Listeners**
   - Dual-axis line chart
   - Node count and listener count over time

6. **Statistical Analysis**
   - Comprehensive table with metrics:
     - Min, Max, Mean, Median, Std Dev
     - Outlier detection (2+ standard deviations)

7. **Leak Pattern Analysis**
   - Pattern classification: `gradual`, `sudden`, `intermittent`, `none`
   - Confidence score visualization
   - Suspected causes (contextual)
   - Investigation guidance steps

8. **Recommendations**
   - Dynamic suggestions based on analysis
   - Prioritized action items

9. **Snapshot Details Table**
   - Complete data for all snapshots
   - Sortable columns

#### Health Score Calculation

```
Base Score: 100

Deductions:
- High usage (>90%): -30 points
- Warning usage (>70%): -15 points
- Leak probability: -(probability × 0.3) points
- High variability (CV > 0.5): -20 points
- Moderate variability (CV > 0.3): -10 points
- Outliers: -5 points each (max -20)
- Increasing trend (>50% samples): -10 points

Final Score: max(0, min(100, score))
```

**Grade Mapping:**
| Grade | Score Range | Description |
|-------|-------------|-------------|
| **A** | 90-100 | Excellent - Healthy memory usage |
| **B** | 80-89 | Good - Minor optimizations possible |
| **C** | 70-79 | Moderate - Investigation recommended |
| **D** | 60-69 | Poor - Issues detected |
| **F** | 0-59 | Critical - Immediate action required |

#### Example Reports

View example reports demonstrating different memory scenarios:

- **[Healthy Report](https://mirunamu00.github.io/usefy/reports/memory-healthy-report.html)** — Stable memory with effective GC
- **[Leak Report](https://mirunamu00.github.io/usefy/reports/memory-leak-report.html)** — Gradual memory leak detection
- **[Spike Report](https://mirunamu00.github.io/usefy/reports/memory-spike-report.html)** — Sudden memory spikes
- **[Critical Report](https://mirunamu00.github.io/usefy/reports/memory-critical-report.html)** — Critical memory pressure

### Panel UI

The panel provides a tabbed interface with four main sections:

#### Overview Tab
- Memory gauge with severity indicator
- Heap breakdown (Used/Total/Limit)
- DOM and event listener metrics
- Quick action buttons (GC, Snapshot)
- Leak warning display

#### History Tab
- Time-series line chart of memory usage
- Visual threshold markers
- Statistics (Min, Max, Avg, Sample count)
- Trend indicator with leak probability

#### Snapshots Tab
- Take/Delete snapshot buttons
- Report generation button
- Capacity indicator
- Snapshot list with selection
- Comparison view for two snapshots

#### Settings Tab
- Warning/Critical threshold sliders
- Auto-GC toggle and threshold
- Polling interval selector
- Snapshot settings (max, schedule, auto-delete)
- Theme selector (System/Light/Dark)

#### Panel Customization

```tsx
<MemoryMonitor
  position="right"        // "left" | "right"
  defaultWidth={420}      // Initial width (px)
  minWidth={320}          // Minimum width (px)
  maxWidth={600}          // Maximum width (px)
  defaultOpen={false}     // Initial open state
  showTrigger={true}      // Show floating button
/>
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+M` | Toggle panel (customizable) |
| `Escape` | Close panel |

```tsx
<MemoryMonitor
  shortcut="ctrl+shift+k"  // Custom shortcut
/>
```

**Supported Modifiers:**
- `ctrl` / `control`
- `shift`
- `alt`
- `meta` / `cmd` / `command`

### Theme Support

The panel supports three theme modes:

| Mode | Description |
|------|-------------|
| `system` | Automatically follows OS preference (default) |
| `light` | Force light theme |
| `dark` | Force dark theme |

```tsx
<MemoryMonitor theme="dark" />
```

The component uses CSS Modules with a `.dark` class selector for dark mode and automatically detects OS preference changes.

### Settings Persistence

All settings are automatically persisted to LocalStorage:

**Persisted Settings:**
- Warning threshold
- Critical threshold
- Auto-GC enabled/threshold
- Polling interval
- Theme preference
- Panel width
- Snapshot settings (max, schedule, auto-delete)

```tsx
<MemoryMonitor
  persistSettings={true}                    // Enable persistence (default)
  storageKey="my-app-memory-monitor"        // Custom storage key
/>
```

---

## API Reference

### Props

#### Core Configuration

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `'development' \| 'production' \| 'always' \| 'headless' \| 'never'` | `'development'` | When to render the panel. See [Mode Options](#mode-options) below |
| `defaultOpen` | `boolean` | `false` | Initial open state |
| `position` | `'left' \| 'right'` | `'right'` | Panel slide-in position |
| `zIndex` | `number` | `9999` | Panel z-index |
| `disableInProduction` | `boolean` | `false` | Disable all features in production |

##### Mode Options

The `mode` prop controls when the Memory Monitor UI is rendered:

| Mode | Development | Production | Use Case |
|------|-------------|------------|----------|
| `'development'` | UI visible | UI hidden | Default. Debug during development only |
| `'production'` | UI hidden | UI visible | Show only in production (rare) |
| `'always'` | UI visible | UI visible | Always show regardless of environment |
| `'headless'` | UI hidden | UI hidden | No UI, but monitoring + callbacks still run |
| `'never'` | UI hidden | UI hidden | Completely disabled (no monitoring) |

> **Note:** Environment detection uses `process.env.NODE_ENV`. If unavailable, it falls back to hostname check (`localhost`, `127.0.0.1`, etc.).

**Common patterns:**

```tsx
// Default: Only visible during local development
<MemoryMonitor />

// Always visible (e.g., for internal tools or debugging pages)
<MemoryMonitor mode="always" />

// Production monitoring with callbacks, no UI
<MemoryMonitor
  mode="headless"
  onWarning={(data) => analytics.track('memory_warning', data)}
  onCritical={(data) => errorReporter.capture(data)}
/>

// Environment-based switching
<MemoryMonitor
  mode={process.env.NODE_ENV === 'development' ? 'always' : 'headless'}
/>
```

#### Monitoring Options

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `interval` | `number` | `1000` | Polling interval in milliseconds |
| `enableHistory` | `boolean` | `true` | Enable memory history tracking |
| `historySize` | `number` | `50` | Maximum history entries |
| `trackDOMNodes` | `boolean` | `true` | Track DOM node count |
| `trackEventListeners` | `boolean` | `true` | Track event listener count |

#### Threshold Configuration

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `warningThreshold` | `number` | `70` | Warning threshold percentage (0-100) |
| `criticalThreshold` | `number` | `90` | Critical threshold percentage (0-100) |
| `autoGCThreshold` | `number \| null` | `null` | Auto-GC trigger threshold (null to disable) |
| `enableAutoGC` | `boolean` | `false` | Enable automatic GC trigger |

#### Leak Detection

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableLeakDetection` | `boolean` | `true` | Enable memory leak detection |
| `leakSensitivity` | `'low' \| 'medium' \| 'high'` | `'medium'` | Leak detection sensitivity |

#### UI Customization

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `triggerContent` | `ReactNode` | - | Custom trigger button content |
| `triggerPosition` | `{ top?: number; right?: number; bottom?: number; left?: number }` | `{ bottom: 20, right: 20 }` | Trigger button position |
| `defaultWidth` | `number` | `420` | Initial panel width (px) |
| `minWidth` | `number` | `320` | Minimum panel width (px) |
| `maxWidth` | `number` | `600` | Maximum panel width (px) |
| `theme` | `'system' \| 'light' \| 'dark'` | `'system'` | Theme setting |
| `className` | `string` | - | Additional CSS class |
| `showTrigger` | `boolean` | `true` | Show floating trigger button |

#### Callbacks

| Prop | Type | Description |
|------|------|-------------|
| `onOpenChange` | `(open: boolean) => void` | Called when panel opens/closes |
| `onWarning` | `(data: MemoryWarningData) => void` | Called when warning threshold exceeded |
| `onCritical` | `(data: MemoryCriticalData) => void` | Called when critical threshold exceeded |
| `onLeakDetected` | `(analysis: LeakAnalysis) => void` | Called when leak is detected |
| `onAutoGC` | `(event: AutoGCEventData) => void` | Called when auto-GC triggers |
| `onUpdate` | `(memory: MemoryInfo) => void` | Called on each memory update |

#### Advanced

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `shortcut` | `string` | `'ctrl+shift+m'` | Keyboard shortcut to toggle |
| `persistSettings` | `boolean` | `true` | Persist settings to LocalStorage |
| `storageKey` | `string` | `'memory-monitor-panel-settings'` | LocalStorage key |

### Types

```typescript
// Severity levels
type Severity = "normal" | "warning" | "critical";

// Theme settings
type ThemeSetting = "system" | "light" | "dark";

// Leak sensitivity
type LeakSensitivity = "low" | "medium" | "high";

// Memory trend
type Trend = "stable" | "increasing" | "decreasing";

// Panel snapshot
interface PanelSnapshot {
  id: string;
  label: string;
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  heapLimit: number;
  domNodes?: number;
  eventListeners?: number;
  isAuto?: boolean;
  analysisContext?: SnapshotAnalysisContext;
}

// Snapshot analysis context
interface SnapshotAnalysisContext {
  trend: Trend;
  leakProbability: number;
  severity: Severity;
  usagePercentage: number;
}

// Leak analysis result
interface LeakAnalysis {
  isLeaking: boolean;
  probability: number;
  trend: Trend;
  recommendation?: string;
}

// Memory warning data
interface MemoryWarningData {
  memory: MemoryInfo;
  usagePercentage: number;
  threshold: number;
  timestamp: number;
}

// Auto-GC event data
interface AutoGCEventData {
  threshold: number;
  usage: number;
  timestamp: number;
}
```

---

## Examples

### Basic Usage

```tsx
import { MemoryMonitor } from "@usefy/memory-monitor";

function App() {
  return (
    <div>
      <YourApp />
      <MemoryMonitor />
    </div>
  );
}
```

### Custom Thresholds

```tsx
<MemoryMonitor
  warningThreshold={60}
  criticalThreshold={85}
  onWarning={(data) => {
    // Log to analytics
    analytics.track('memory_warning', {
      usage: data.usagePercentage,
      threshold: data.threshold,
    });
  }}
  onCritical={(data) => {
    // Alert on-call team
    alertService.send({
      level: 'critical',
      message: `Memory critical: ${data.usagePercentage}%`,
    });
  }}
/>
```

### Auto-GC Configuration

```tsx
<MemoryMonitor
  enableAutoGC={true}
  autoGCThreshold={80}
  onAutoGC={(event) => {
    console.log(`Auto-GC triggered at ${event.usage}%`);
    // Track GC events
    metrics.increment('auto_gc_triggered');
  }}
/>
```

### Leak Detection with Callbacks

```tsx
<MemoryMonitor
  enableLeakDetection={true}
  leakSensitivity="high"
  onLeakDetected={(analysis) => {
    if (analysis.probability > 80) {
      // High confidence leak
      errorReporting.captureMessage('Memory leak detected', {
        probability: analysis.probability,
        trend: analysis.trend,
        recommendation: analysis.recommendation,
      });
    }
  }}
/>
```

### Snapshot Management

```tsx
import { MemoryMonitor } from "@usefy/memory-monitor";

function DebugPage() {
  return (
    <MemoryMonitor
      mode="always"
      defaultOpen={true}
      // Snapshot configuration via Settings tab:
      // - Max snapshots: 20
      // - Schedule: Every 5 minutes
      // - Auto-delete oldest: enabled
    />
  );
}
```

### Report Generation

After capturing 5+ snapshots, click "Generate Report" in the Snapshots tab to download a comprehensive HTML diagnostic report. The report includes:

- Memory trends visualization
- Statistical analysis
- Leak pattern detection
- Health score and grade
- Recommendations

### Custom Theme and Styling

```tsx
<MemoryMonitor
  theme="dark"
  position="left"
  defaultWidth={450}
  className="my-custom-panel"
  triggerContent={
    <span className="flex items-center gap-2">
      <MemoryIcon />
      Monitor
    </span>
  }
/>
```

### Headless Mode (Production)

For production monitoring without the UI, use `mode="headless"`. This keeps the same component API, making it easy to switch between development and production:

```tsx
import { MemoryMonitor } from "@usefy/memory-monitor";

function App() {
  return (
    <div>
      <YourApp />
      <MemoryMonitor
        // Easy environment switching with same API
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
        onAutoGC={(data) => {
          console.log("Auto-GC triggered:", data);
        }}
      />
    </div>
  );
}
```

**Mode Comparison:**

| Mode | UI | Monitoring | Use Case |
|------|:---:|:----------:|----------|
| `development` | Dev only | Active | Default for dev |
| `production` | Prod only | Active | Debug in prod |
| `always` | Always | Active | Demo/testing |
| `headless` | Never | Active | Production callbacks |
| `never` | Never | Disabled | Completely off |

#### Alternative: useMemoryMonitorHeadless Hook

For more fine-grained control, you can also use the `useMemoryMonitorHeadless` hook directly:

```tsx
import { useMemoryMonitorHeadless } from "@usefy/memory-monitor";

function ProductionMonitor() {
  const {
    memory,
    usagePercentage,
    severity,
    isLeakDetected,
    requestGC,
  } = useMemoryMonitorHeadless({
    interval: 5000,
    warningThreshold: 70,
    criticalThreshold: 90,
    enableAutoGC: true,
    autoGCThreshold: 85,
    onWarning: (data) => analytics.track("memory_warning", data),
    onCritical: (data) => alertService.send(data),
  });

  return null; // No UI rendered
}
```

---

## Browser Support

Memory monitoring uses the `performance.memory` API which has varying support across browsers:

| Browser | Support Level | Features Available |
|---------|---------------|-------------------|
| **Chrome** | Full | All features including heap metrics |
| **Edge** | Full | All features (Chromium-based) |
| **Firefox** | Limited | DOM metrics only, no heap data |
| **Safari** | Limited | DOM metrics only, no heap data |
| **Brave** | Full | All features (Chromium-based) |

In unsupported browsers, the panel will render but show "Limited Support" status with available fallback metrics.

---

## Testing

The component includes comprehensive tests covering:

**Rendering Tests (6 tests)**
- Renders trigger button by default
- Respects mode prop (development/production/always/never)
- Shows panel when defaultOpen is true
- Hides trigger when showTrigger is false

**Panel Interactions (4 tests)**
- Opens panel on trigger click
- Closes panel on close button click
- Calls onOpenChange callbacks correctly

**Tab Navigation (4 tests)**
- Shows overview tab by default
- Switches between tabs correctly
- Maintains tab state

**Keyboard Shortcuts (3 tests)**
- Toggles panel with Ctrl+Shift+M
- Closes panel with Escape
- Respects custom shortcut configuration

**Browser Compatibility (1 test)**
- Renders in unsupported browsers with fallback UI

**Props Customization (4 tests)**
- Applies custom zIndex
- Applies custom className
- Renders in left/right positions
- Renders custom trigger content

**Leak Detection Algorithm Tests**
- Linear regression accuracy validation
- GC event detection logic
- Baseline calculation correctness
- Probability calculation verification
- Sensitivity level behavior

---

## Performance

The component is optimized for minimal performance impact:

- **Memoized Tab Content** — Uses `useMemo` to prevent unnecessary re-renders
- **Debounced Persistence** — Settings are saved with 500ms debounce
- **Efficient History Buffer** — Circular buffer implementation for O(1) operations
- **Non-blocking Reports** — Report generation is asynchronous
- **Tab Visibility** — Automatically pauses monitoring when tab is hidden

---

## Styling

**Styles are automatically injected** when you import the component. No additional CSS imports or Tailwind configuration required!

If you prefer to import styles manually (e.g., for SSR or custom loading), you can use:

```tsx
import "@usefy/memory-monitor/styles.css";
```

---

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>
