<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-memory-monitor</h1>

<p align="center">
  <strong>Advanced React hook for real-time browser memory monitoring</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-memory-monitor">
    <img src="https://img.shields.io/npm/v/@usefy/use-memory-monitor.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-memory-monitor">
    <img src="https://img.shields.io/npm/dm/@usefy/use-memory-monitor.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-memory-monitor">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-memory-monitor?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-memory-monitor.svg?style=flat-square&color=007acc" alt="license" />
  </a>
  <img src="https://img.shields.io/badge/coverage-95%25-brightgreen?style=flat-square" alt="coverage" />
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#examples">Examples</a> •
  <a href="#browser-support">Browser Support</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usememorymonitor--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/use-memory-monitor` is a comprehensive React hook for monitoring browser memory usage in real-time. It provides heap metrics, memory leak detection, threshold-based alerts, history tracking, and snapshot comparison capabilities.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-memory-monitor?

- **Real-time Monitoring** — Track heap usage, total heap, and memory limits in real-time
- **Leak Detection** — Automatic memory leak detection using linear regression analysis
- **Threshold Alerts** — Configure custom `warning`/`critical` severity thresholds
- **Memory Snapshots** — Take named snapshots and compare memory usage between points in time
- **History Tracking** — Maintain a circular buffer of historical memory data with trend analysis
- **Tab Visibility Optimization** — Automatically pauses monitoring when tab is hidden (and resumes only work it paused)
- **TypeScript First** — Full type safety with comprehensive exported interfaces
- **SSR Compatible** — Safe to use with Next.js, Remix, and other SSR frameworks
- **Browser Fallbacks** — Graceful degradation in browsers without full API support
- **Well Tested** — Comprehensive test coverage (242 tests) with Vitest

---

## Installation

```bash
# npm
npm install @usefy/use-memory-monitor

# yarn
yarn add @usefy/use-memory-monitor

# pnpm
pnpm add @usefy/use-memory-monitor
```

### Peer Dependencies

This package requires React 18 or 19:

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  }
}
```

---

## Quick Start

```tsx
import { useMemoryMonitor } from "@usefy/use-memory-monitor";

function MemoryMonitor() {
  const {
    heapUsed,
    heapTotal,
    heapLimit,
    isSupported,
    severity,
    formatted,
  } = useMemoryMonitor({
    interval: 1000,
    autoStart: true,
  });

  if (!isSupported) {
    return <div>Memory monitoring not supported in this browser</div>;
  }

  return (
    <div>
      <h2>Memory Usage</h2>
      <p>Heap Used: {formatted.heapUsed}</p>
      <p>Heap Total: {formatted.heapTotal}</p>
      <p>Heap Limit: {formatted.heapLimit}</p>
      <p>Severity: {severity}</p>
    </div>
  );
}
```

---

## Browser Support

### Full Support (performance.memory API)
- ✅ **Chrome** (all versions)
- ✅ **Edge** (Chromium-based)

### Limited Support (DOM-only metrics)
- ⚠️ **Firefox** - DOM tracking only, no heap metrics
- ⚠️ **Safari** - DOM tracking only, no heap metrics
- ⚠️ **Other browsers** - Fallback strategies available

### Browser Detection

The hook automatically detects browser capabilities and exposes them as return
values. Use the `onUnsupported` callback to learn *why* monitoring is unavailable:

```tsx
const { isSupported, supportLevel, availableMetrics } = useMemoryMonitor({
  onUnsupported: (info) => {
    console.log("Reason:", info.reason); // 'no-api' | 'server-side' | 'insecure-context' | 'browser-restriction'
    console.log("Browser:", info.browser);
    console.log("Fallbacks:", info.availableFallbacks); // ('none' | 'estimation' | 'dom-only')[]
  },
});

console.log("Supported:", isSupported);
console.log("Support level:", supportLevel); // 'full' | 'partial' | 'none'
console.log("Available metrics:", availableMetrics); // ('heapUsed' | 'domNodes' | ...)[]
```

---

## API Reference

### `useMemoryMonitor(options?)`

A hook that monitors browser memory usage in real-time with leak detection and threshold alerts.

#### Parameters

| Parameter | Type                          | Default | Description                        |
| --------- | ----------------------------- | ------- | ---------------------------------- |
| `options` | `UseMemoryMonitorOptions` | `{}`    | Configuration options (see below) |

#### Options (`UseMemoryMonitorOptions`)

| Option                 | Type                    | Default     | Description                                              |
| ---------------------- | ----------------------- | ----------- | ------------------------------------------------------- |
| `interval`             | `number`                | `5000`      | Polling interval in milliseconds                        |
| `autoStart`            | `boolean`               | `true`      | Start monitoring automatically on mount                 |
| `enabled`              | `boolean`               | `true`      | Enable/disable the hook                                 |
| `enableHistory`        | `boolean`               | `false`     | Record memory history into a circular buffer            |
| `historySize`          | `number`                | `50`        | Maximum number of history entries                       |
| `thresholds`           | `ThresholdOptions`      | See below   | Warning/critical usage thresholds                       |
| `leakDetection`        | `LeakDetectionOptions`  | See below   | Leak detection configuration                            |
| `devMode`              | `boolean`               | `false`     | Enable development-mode features                        |
| `trackDOMNodes`        | `boolean`               | `false`     | Track the document's DOM node count                     |
| `trackEventListeners`  | `boolean`               | `false`     | Estimate the event listener count                       |
| `logToConsole`         | `boolean`               | `false`     | Log updates to the console (with `devMode`)             |
| `disableInProduction`  | `boolean`               | `false`     | Disable monitoring in production builds                 |
| `fallbackStrategy`     | `FallbackStrategy`      | `"dom-only"`| Fallback for browsers without the heap API              |
| `onUpdate`             | `(memory) => void`      | -           | Called on each memory update                            |
| `onWarning`            | `(data) => void`        | -           | Called when the warning threshold is exceeded           |
| `onCritical`           | `(data) => void`        | -           | Called when the critical threshold is exceeded          |
| `onLeakDetected`       | `(analysis) => void`    | -           | Called when a memory leak is detected                   |
| `onUnsupported`        | `(info) => void`        | -           | Called when memory monitoring is not supported          |

##### Default Thresholds (`ThresholdOptions`)

```typescript
{
  warning: 70,   // severity becomes "warning" at 70% of the heap limit
  critical: 90,  // severity becomes "critical" at 90% of the heap limit
}
```

##### Default Leak Detection (`LeakDetectionOptions`)

```typescript
{
  enabled: false,         // opt in to enable leak analysis
  sensitivity: "medium",  // 'low' | 'medium' | 'high'
  windowSize: 20,         // number of recent samples to analyze
  threshold: undefined,   // optional custom growth threshold (bytes/sample)
}
```

> Leak detection requires `enableHistory: true` so there are samples to analyze.

#### Returns `UseMemoryMonitorReturn`

| Property           | Type                                        | Description                                       |
| ------------------ | ------------------------------------------- | ------------------------------------------------- |
| `memory`           | `MemoryInfo \| null`                        | Current memory information                        |
| `heapUsed`         | `number \| null`                            | Used heap size in bytes                           |
| `heapTotal`        | `number \| null`                            | Total heap size in bytes                          |
| `heapLimit`        | `number \| null`                            | Heap size limit in bytes                          |
| `usagePercentage`  | `number \| null`                            | Heap usage as a percentage of the limit           |
| `domNodes`         | `number \| null`                            | DOM node count (when `trackDOMNodes` is enabled)  |
| `eventListeners`   | `number \| null`                            | Estimated listener count (when tracking)          |
| `isSupported`      | `boolean`                                   | Whether memory monitoring is supported            |
| `isMonitoring`     | `boolean`                                   | Whether monitoring is currently active            |
| `isLeakDetected`   | `boolean`                                   | Whether a memory leak is currently detected       |
| `severity`         | `Severity`                                  | Current severity level                            |
| `supportLevel`     | `SupportLevel`                              | `'full' \| 'partial' \| 'none'`                   |
| `availableMetrics` | `readonly AvailableMetric[]`                | Metrics available in this browser                 |
| `history`          | `readonly MemoryInfo[]`                     | Historical memory data (empty if history is off)  |
| `trend`            | `Trend`                                     | Memory usage trend                                |
| `leakProbability`  | `number`                                    | Current leak probability (0–100)                  |
| `formatted`        | `FormattedMemory`                           | Human-readable formatted values                   |
| `start`            | `() => void`                                | Start monitoring                                  |
| `stop`             | `() => void`                                | Stop monitoring                                   |
| `takeSnapshot`     | `(id: string) => MemorySnapshot \| null`    | Take a named memory snapshot                      |
| `compareSnapshots` | `(id1: string, id2: string) => SnapshotDiff \| null` | Compare two named snapshots              |
| `clearHistory`     | `() => void`                                | Clear the history buffer                          |
| `requestGC`        | `() => void`                                | Request garbage collection (hint only)            |

### Types

#### `Severity`
```typescript
type Severity = "normal" | "warning" | "critical";
```

#### `Trend`
```typescript
type Trend = "stable" | "increasing" | "decreasing";
```

#### `MemoryInfo`
```typescript
interface MemoryInfo {
  /** Used JS heap size in bytes */
  heapUsed: number;
  /** Total JS heap size in bytes */
  heapTotal: number;
  /** JS heap size limit in bytes */
  heapLimit: number;
  /** Timestamp when this measurement was taken */
  timestamp: number;
}
```

#### `SnapshotDiff`
```typescript
interface SnapshotDiff {
  /** Difference in heap usage (bytes) */
  heapDelta: number;
  /** Percentage change in heap usage */
  heapPercentChange: number;
  /** Difference in DOM node count (if tracked) */
  domNodesDelta?: number;
  /** Difference in event listener count (if tracked) */
  eventListenersDelta?: number;
  /** Time elapsed between snapshots (ms) */
  timeDelta: number;
}
```

#### `FormattedMemory`
```typescript
interface FormattedMemory {
  heapUsed: string;
  heapTotal: string;
  heapLimit: string;
  domNodes?: string;
  eventListeners?: string;
}
```

---

## Examples

### Basic Memory Monitoring

```tsx
import { useMemoryMonitor } from "@usefy/use-memory-monitor";

function BasicMonitor() {
  const { formatted, severity, isMonitoring, start, stop } = useMemoryMonitor({
    interval: 1000,
    autoStart: true,
  });

  return (
    <div>
      <h2>Memory Usage</h2>
      <p>Used: {formatted.heapUsed}</p>
      <p>Total: {formatted.heapTotal}</p>
      <p>Severity: {severity}</p>

      <button onClick={isMonitoring ? stop : start}>
        {isMonitoring ? "Stop" : "Start"}
      </button>
    </div>
  );
}
```

### Memory Leak Detection

```tsx
import { useMemoryMonitor } from "@usefy/use-memory-monitor";

function LeakDetector() {
  const { isLeakDetected, leakProbability, formatted } = useMemoryMonitor({
    interval: 1000,
    enableHistory: true, // required so there are samples to analyze
    leakDetection: {
      enabled: true,
      sensitivity: "high",
      windowSize: 15,
    },
    onLeakDetected: (analysis) => {
      console.warn("Memory leak detected!", {
        probability: analysis.probability,
        confidence: analysis.confidence,
        averageGrowth: analysis.averageGrowth,
      });
    },
  });

  return (
    <div>
      <h2>Leak Detection</h2>
      {isLeakDetected && (
        <div className="alert">
          ⚠️ Memory leak detected!
          <p>Probability: {leakProbability.toFixed(0)}%</p>
        </div>
      )}
      <p>Current Usage: {formatted.heapUsed}</p>
    </div>
  );
}
```

#### How Leak Detection Works

The hook uses an **Enhanced Multi-Factor Analysis** algorithm to detect memory leaks accurately while minimizing false positives:

##### Algorithm Overview

1. **Data Collection**: Requires minimum 10 samples over 30+ seconds of observation
2. **GC Event Detection**: Identifies garbage collection events by detecting significant memory drops (≥10%)
3. **Baseline Calculation**: Calculates baseline from post-GC memory values
4. **Baseline Trend Analysis**: Monitors if post-GC baselines are increasing over time
5. **Weighted Probability Calculation**: Combines multiple factors for accurate detection

##### Probability Factors (Weighted Scoring)

| Factor | Max Points | Description |
|--------|------------|-------------|
| Slope | 30 | How fast memory is growing |
| R² Fit | 20 | How consistent the growth pattern is |
| GC Ineffectiveness | 25 | Whether GC fails to reclaim memory |
| Observation Time | 15 | Longer observation = more confidence |
| Baseline Growth | 10 | Whether post-GC baseline is rising |

**Total: 100 points maximum**

##### Key Principles

- **GC-Aware**: True leaks persist even after garbage collection cycles
- **Time-Based**: Requires sufficient observation time before making judgment
- **Baseline Tracking**: Monitors if the memory "floor" after GC is rising
- **False Positive Reduction**: If GC is effective and baseline is stable, probability is reduced

```
Leak Detection Flow:
1. Collect samples (min 10, min 30 seconds)
   ↓
2. Detect GC events (memory drops ≥10%)
   ↓
3. Calculate baseline (average post-GC memory)
   ↓
4. Analyze baseline trend (is it rising?)
   ↓
5. Calculate weighted probability
   ↓
6. Apply corrections (GC effectiveness, trend)
   ↓
7. Final determination (≥70% = leak detected)
```

##### Sensitivity Levels

| Sensitivity | Min Slope | Min R² | Min GC Cycles | Min Observation |
|-------------|-----------|--------|---------------|-----------------|
| `low` | 100KB/sample | 0.8 | 3 | 60 seconds |
| `medium` | 50KB/sample | 0.7 | 2 | 30 seconds |
| `high` | 10KB/sample | 0.6 | 1 | 15 seconds |

##### LeakAnalysis Response

The `LeakAnalysis` object now includes detailed analysis information:

```typescript
interface LeakAnalysis {
  isLeaking: boolean;           // Whether a leak is detected (probability ≥ 70%)
  probability: number;          // Leak probability (0-100)
  confidence: number;           // Analysis confidence (0-100)
  trend: Trend;                 // 'increasing' | 'stable' | 'decreasing'
  averageGrowth: number;        // Bytes per sample
  rSquared: number;             // Regression fit quality
  observationTime?: number;     // Total observation time in ms
  gcAnalysis?: {
    gcEventCount: number;       // Number of GC events detected
    avgRecoveryRatio: number;   // Average memory recovered per GC
    isGCEffective: boolean;     // Whether GC is reclaiming memory
  };
  baselineAnalysis?: {
    baselineHeap: number;       // Average post-GC memory
    currentHeap: number;        // Current heap usage
    growthRatio: number;        // Growth from baseline
    isSignificantGrowth: boolean;
  };
  factors?: {
    slopeContribution: number;
    rSquaredContribution: number;
    gcContribution: number;
    timeContribution: number;
    baselineContribution: number;
  };
  recommendation?: string;      // Human-readable recommendation
}
```

### Threshold Alerts

```tsx
import { useMemoryMonitor } from "@usefy/use-memory-monitor";

function ThresholdMonitor() {
  const { severity, usagePercentage, formatted } = useMemoryMonitor({
    interval: 1000,
    thresholds: {
      warning: 70,   // severity becomes "warning" at 70%
      critical: 90,  // severity becomes "critical" at 90%
    },
    onWarning: (data) => {
      console.warn(`Memory warning at ${data.usagePercentage.toFixed(1)}%`);
    },
    onCritical: () => {
      alert("Critical memory usage!");
    },
  });

  return (
    <div>
      <h2>Memory Usage: {usagePercentage?.toFixed(1) ?? "0"}%</h2>
      <div className={`alert alert-${severity}`}>
        Severity: {severity}
      </div>
      <p>{formatted.heapUsed} / {formatted.heapLimit}</p>
    </div>
  );
}
```

### Memory Snapshots

```tsx
import { useMemoryMonitor } from "@usefy/use-memory-monitor";
import { useState } from "react";

function SnapshotComparison() {
  const { takeSnapshot, compareSnapshots, formatted } = useMemoryMonitor({
    interval: 1000,
  });

  // The hook stores snapshots internally by id; keep the ids you care about
  // in local state so you can render and compare them.
  const [snapshotIds, setSnapshotIds] = useState<string[]>([]);

  const handleSnapshot = () => {
    const snapshot = takeSnapshot(`snapshot-${Date.now()}`);
    if (snapshot) {
      setSnapshotIds((prev) => [...prev, snapshot.id]);
    }
  };

  const handleCompare = () => {
    if (snapshotIds.length >= 2) {
      const diff = compareSnapshots(
        snapshotIds[0],
        snapshotIds[snapshotIds.length - 1]
      );
      if (diff) {
        console.log("Memory difference:", {
          heapDelta: (diff.heapDelta / 1024 / 1024).toFixed(2) + " MB",
          heapPercentChange: diff.heapPercentChange.toFixed(1) + "%",
          duration: (diff.timeDelta / 1000).toFixed(1) + " seconds",
        });
      }
    }
  };

  return (
    <div>
      <h2>Snapshots ({snapshotIds.length})</h2>
      <p>Current: {formatted.heapUsed}</p>

      <button onClick={handleSnapshot}>Take Snapshot</button>
      <button onClick={handleCompare} disabled={snapshotIds.length < 2}>
        Compare First & Last
      </button>
      <button onClick={() => setSnapshotIds([])}>Clear List</button>

      <ul>
        {snapshotIds.map((id) => (
          <li key={id}>{id}</li>
        ))}
      </ul>
    </div>
  );
}
```

### History & Trend Analysis

```tsx
import { useMemoryMonitor } from "@usefy/use-memory-monitor";

function HistoryTracker() {
  const { history, trend, formatted, clearHistory } = useMemoryMonitor({
    interval: 500,
    enableHistory: true,
    historySize: 30,
  });

  const maxHeapUsed = Math.max(...history.map((h) => h.heapUsed || 0), 1);

  return (
    <div>
      <h2>Memory History</h2>
      <p>Current: {formatted.heapUsed}</p>
      <p>
        Trend: {trend === "increasing" ? "↗" : trend === "decreasing" ? "↘" : "→"} {trend}
      </p>
      <p>History Points: {history.length}</p>

      <button onClick={clearHistory}>Clear History</button>

      {/* Simple bar chart */}
      <div style={{ display: "flex", alignItems: "flex-end", height: 100 }}>
        {history.map((point, i) => {
          const heightPercent = ((point.heapUsed || 0) / maxHeapUsed) * 100;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${heightPercent}%`,
                backgroundColor: "blue",
                margin: "0 1px",
              }}
              title={`${((point.heapUsed || 0) / 1024 / 1024).toFixed(2)} MB`}
            />
          );
        })}
      </div>
    </div>
  );
}
```

### Browser Support Detection

```tsx
import { useMemoryMonitor } from "@usefy/use-memory-monitor";

import { useState } from "react";
import type { UnsupportedInfo } from "@usefy/use-memory-monitor";

function SupportDetection() {
  const [info, setInfo] = useState<UnsupportedInfo | null>(null);

  const { isSupported, supportLevel, availableMetrics } = useMemoryMonitor({
    onUnsupported: setInfo,
  });

  if (!isSupported) {
    return (
      <div>
        <h2>Limited Support</h2>
        <p>Reason: {info?.reason}</p>
        <p>Browser: {info?.browser || "Unknown"}</p>
        <p>Available fallbacks: {info?.availableFallbacks.join(", ")}</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Browser Support</h2>
      <p>Level: {supportLevel}</p>
      <p>Available metrics: {availableMetrics.join(", ")}</p>
    </div>
  );
}
```

### Garbage Collection Request

The `requestGC` function provides a way to request garbage collection. Note that this is a **hint only** and is not guaranteed to trigger GC in all environments.

```tsx
import { useMemoryMonitor } from "@usefy/use-memory-monitor";

function GCExample() {
  const { requestGC, formatted } = useMemoryMonitor({
    devMode: true,
    logToConsole: true, // Enable logging to see GC status
  });

  return (
    <div>
      <p>Heap Used: {formatted.heapUsed}</p>
      <button onClick={requestGC}>Request GC</button>
    </div>
  );
}
```

**How it works:**
- If `globalThis.gc()` is available (Chrome with `--expose-gc` flag or Node.js with `--expose-gc`), it will directly trigger garbage collection
- Otherwise, it creates temporary memory pressure as a hint to the JS engine
- With `devMode` and `logToConsole` enabled, you'll see console logs indicating whether GC was triggered or just hinted

**To enable direct GC in Chrome:**
```bash
# Windows
chrome.exe --js-flags="--expose-gc"

# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --js-flags="--expose-gc"

# Linux
google-chrome --js-flags="--expose-gc"
```

---

## Performance

### Optimizations

1. **Tab Visibility**: Automatically pauses monitoring when the tab is hidden and resumes only work it paused (never work you manually stopped)
2. **Circular Buffer**: Uses efficient circular buffer for history storage (O(1) operations)
3. **Stable References**: All callback functions are memoized with `useCallback`
4. **useSyncExternalStore**: React 18+ concurrent mode safe state management
5. **Minimal Re-renders**: Only triggers re-renders when actual memory data changes

### Bundle Size

The hook is lightweight and tree-shakeable:
- Main hook: ~8KB minified
- With all utilities: ~15KB minified
- Gzipped: ~5KB

---

## TypeScript

This hook is written in TypeScript and exports comprehensive type definitions:

```tsx
import {
  useMemoryMonitor,
  type UseMemoryMonitorOptions,
  type UseMemoryMonitorReturn,
  type MemoryInfo,
  type MemorySnapshot,
  type LeakAnalysis,
  type BrowserSupport,
  type Severity,
  type Trend,
} from "@usefy/use-memory-monitor";

// Full type safety
const options: UseMemoryMonitorOptions = {
  interval: 1000,
  autoStart: true,
};

const monitor: UseMemoryMonitorReturn = useMemoryMonitor(options);
```

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-memory-monitor/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages)

### Test Categories

**242 tests passed** covering:

- **Initialization & Lifecycle**: Mount, unmount, start/stop behavior
- **Memory Tracking**: Polling, history, trend analysis
- **Leak Detection**: Linear regression, sensitivity levels, analysis
- **Thresholds**: Severity calculation, `onWarning`/`onCritical` callbacks
- **Snapshots**: Take and compare named snapshots
- **Tab Visibility**: Pause on hide, resume without overriding manual stop
- **Browser Detection**: API availability, fallback strategies, `onUnsupported`
- **Edge Cases**: SSR server render, unsupported browsers, StrictMode safety
- **Store Management**: State updates, subscribers, batch operations
- **Memory APIs**: performance.memory, DOM nodes, event listeners

---

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>
