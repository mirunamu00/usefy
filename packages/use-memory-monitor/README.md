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
  <img src="https://img.shields.io/badge/coverage-90%25-brightgreen?style=flat-square" alt="coverage" />
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
- **Threshold Alerts** — Configure custom thresholds for low/medium/high/critical severity levels
- **Memory Snapshots** — Take snapshots and compare memory usage between different points in time
- **History Tracking** — Maintain a circular buffer of historical memory data with trend analysis
- **Tab Visibility Optimization** — Automatically pauses monitoring when tab is hidden
- **TypeScript First** — Full type safety with comprehensive exported interfaces
- **SSR Compatible** — Safe to use with Next.js, Remix, and other SSR frameworks
- **Browser Fallbacks** — Graceful degradation in browsers without full API support
- **Well Tested** — Comprehensive test coverage (175 tests) with Vitest

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

The hook automatically detects browser capabilities and adjusts functionality:

```tsx
const { isSupported, getUnsupportedInfo, getBrowserSupport } = useMemoryMonitor();

if (!isSupported) {
  const info = getUnsupportedInfo();
  console.log("Reason:", info.reason); // 'no-api' | 'browser-restriction' | etc.
  console.log("Browser:", info.browser);
  console.log("Fallbacks:", info.availableFallbacks);
}

const support = getBrowserSupport();
console.log("Support level:", support.level); // 'full' | 'partial' | 'none'
console.log("Available metrics:", support.availableMetrics);
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

| Option               | Type                    | Default  | Description                                      |
| -------------------- | ----------------------- | -------- | ------------------------------------------------ |
| `interval`           | `number`                | `1000`   | Polling interval in milliseconds                 |
| `autoStart`          | `boolean`               | `true`   | Start monitoring automatically on mount          |
| `enabled`            | `boolean`               | `true`   | Enable/disable the hook                          |
| `enableHistory`      | `boolean`               | `true`   | Track memory history                             |
| `historySize`        | `number`                | `50`     | Maximum number of history entries                |
| `thresholds`         | `ThresholdOptions`      | See below | Memory usage thresholds                          |
| `leakDetection`      | `LeakDetectionOptions`  | See below | Leak detection configuration                     |
| `pauseWhenHidden`    | `boolean`               | `true`   | Pause monitoring when tab is hidden              |
| `onThresholdChange`  | `(severity) => void`    | -        | Callback when severity level changes             |
| `onMemoryUpdate`     | `(memory) => void`      | -        | Callback on each memory update                   |
| `onLeakDetected`     | `(analysis) => void`    | -        | Callback when memory leak is detected            |
| `onUnsupported`      | `(info) => void`        | -        | Callback when memory API is not supported        |

##### Default Thresholds

```typescript
{
  medium: 60,    // Yellow alert at 60% usage
  high: 80,      // Orange alert at 80% usage
  critical: 90,  // Red alert at 90% usage
}
```

##### Default Leak Detection

```typescript
{
  enabled: true,
  sensitivity: "medium",  // 'low' | 'medium' | 'high'
  sampleSize: 10,
  minDuration: 30000,     // 30 seconds
}
```

#### Returns `UseMemoryMonitorReturn`

| Property               | Type                                 | Description                                  |
| ---------------------- | ------------------------------------ | -------------------------------------------- |
| `memory`               | `MemoryInfo \| null`                 | Current memory information                   |
| `heapUsed`             | `number \| null`                     | Used heap size in bytes                      |
| `heapTotal`            | `number \| null`                     | Total heap size in bytes                     |
| `heapLimit`            | `number \| null`                     | Heap size limit in bytes                     |
| `isSupported`          | `boolean`                            | Whether memory monitoring is supported       |
| `isMonitoring`         | `boolean`                            | Whether currently monitoring                 |
| `isLeakDetected`       | `boolean`                            | Whether memory leak is detected              |
| `severity`             | `Severity`                           | Current severity level                       |
| `history`              | `MemoryInfo[]`                       | Historical memory data                       |
| `trend`                | `Trend`                              | Memory usage trend                           |
| `formatted`            | `FormattedMemory`                    | Human-readable formatted values              |
| `start`                | `() => void`                         | Start monitoring                             |
| `stop`                 | `() => void`                         | Stop monitoring                              |
| `takeSnapshot`         | `(id: string) => MemorySnapshot \| null` | Take a memory snapshot                       |
| `compareSnapshots`     | `(id1, id2) => MemoryDifference \| null` | Compare two snapshots                        |
| `clearSnapshots`       | `() => void`                         | Clear all snapshots                          |
| `getAllSnapshots`      | `() => MemorySnapshot[]`             | Get all snapshots                            |
| `clearHistory`         | `() => void`                         | Clear history buffer                         |
| `requestGC`            | `() => void`                         | Request garbage collection (hint only)       |
| `getLeakAnalysis`      | `() => LeakAnalysis \| null`         | Get current leak analysis                    |
| `getBrowserSupport`    | `() => BrowserSupport`               | Get browser support information              |
| `getUnsupportedInfo`   | `() => UnsupportedInfo`              | Get info about why monitoring is unsupported |

### Types

#### `Severity`
```typescript
type Severity = "low" | "medium" | "high" | "critical";
```

#### `Trend`
```typescript
type Trend = "increasing" | "stable" | "decreasing";
```

#### `MemoryInfo`
```typescript
interface MemoryInfo {
  heapUsed: number | null;
  heapTotal: number | null;
  heapLimit: number | null;
  timestamp: number;
  domNodes?: number | null;
  eventListeners?: number | null;
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
  const { isLeakDetected, getLeakAnalysis, formatted } = useMemoryMonitor({
    interval: 1000,
    leakDetection: {
      enabled: true,
      sensitivity: "high",
      sampleSize: 15,
      minDuration: 20000, // 20 seconds
    },
    onLeakDetected: (analysis) => {
      console.warn("Memory leak detected!", {
        probability: analysis.probability,
        confidence: analysis.confidence,
        slope: analysis.slope,
      });
    },
  });

  const analysis = getLeakAnalysis();

  return (
    <div>
      <h2>Leak Detection</h2>
      {isLeakDetected && (
        <div className="alert">
          ⚠️ Memory leak detected!
          <p>Probability: {(analysis?.probability ?? 0).toFixed(2)}%</p>
          <p>Confidence: {analysis?.confidence}</p>
        </div>
      )}
      <p>Current Usage: {formatted.heapUsed}</p>
    </div>
  );
}
```

#### How Leak Detection Works

The hook uses **Linear Regression Analysis** to detect memory leaks:

1. **Data Collection**: Collects memory samples over time (configurable via `sampleSize`)
2. **Linear Regression**: Applies least squares regression to find the best-fit line through the memory data points
3. **Slope Analysis**: The slope indicates memory growth rate (bytes per sample)
4. **R² Coefficient**: Measures how well the data fits the linear model (0-1, higher = more consistent growth)
5. **Probability Calculation**: Combines slope and R² to calculate leak probability

```
Leak Probability = f(slope, R², sensitivity)

- High slope + High R² = High probability (consistent memory growth)
- High slope + Low R² = Lower probability (fluctuating memory)
- Low slope = Low probability (stable memory)
```

**Sensitivity Levels:**
| Sensitivity | Min Slope | Min R² | Description |
|-------------|-----------|--------|-------------|
| `low` | 10KB/sample | 0.8 | Only detects obvious leaks |
| `medium` | 5KB/sample | 0.6 | Balanced detection (default) |
| `high` | 1KB/sample | 0.4 | Detects subtle leaks |

### Threshold Alerts

```tsx
import { useMemoryMonitor } from "@usefy/use-memory-monitor";

function ThresholdMonitor() {
  const { severity, heapUsed, heapLimit, formatted } = useMemoryMonitor({
    interval: 1000,
    thresholds: {
      medium: 50,
      high: 75,
      critical: 90,
    },
    onThresholdChange: (newSeverity) => {
      if (newSeverity === "critical") {
        alert("Critical memory usage!");
      }
    },
  });

  const usagePercent = heapUsed && heapLimit
    ? (heapUsed / heapLimit) * 100
    : 0;

  return (
    <div>
      <h2>Memory Usage: {usagePercent.toFixed(1)}%</h2>
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
  const {
    takeSnapshot,
    compareSnapshots,
    getAllSnapshots,
    clearSnapshots,
    formatted,
  } = useMemoryMonitor({ interval: 1000 });

  const [snapshots, setSnapshots] = useState<string[]>([]);

  const handleSnapshot = () => {
    const snapshot = takeSnapshot(`snapshot-${Date.now()}`);
    if (snapshot) {
      setSnapshots([...snapshots, snapshot.id]);
    }
  };

  const handleCompare = () => {
    if (snapshots.length >= 2) {
      const diff = compareSnapshots(snapshots[0], snapshots[snapshots.length - 1]);
      if (diff) {
        console.log("Memory difference:", {
          heapUsed: (diff.heapUsed / 1024 / 1024).toFixed(2) + " MB",
          heapTotal: (diff.heapTotal / 1024 / 1024).toFixed(2) + " MB",
          duration: (diff.duration / 1000).toFixed(1) + " seconds",
        });
      }
    }
  };

  return (
    <div>
      <h2>Snapshots ({snapshots.length})</h2>
      <p>Current: {formatted.heapUsed}</p>

      <button onClick={handleSnapshot}>Take Snapshot</button>
      <button onClick={handleCompare} disabled={snapshots.length < 2}>
        Compare First & Last
      </button>
      <button onClick={clearSnapshots}>Clear All</button>

      <ul>
        {getAllSnapshots().map((snapshot) => (
          <li key={snapshot.id}>
            {snapshot.id}: {(snapshot.data.heapUsed || 0) / 1024 / 1024} MB
          </li>
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

function SupportDetection() {
  const { isSupported, getUnsupportedInfo, getBrowserSupport } = useMemoryMonitor();

  if (!isSupported) {
    const info = getUnsupportedInfo();
    return (
      <div>
        <h2>Limited Support</h2>
        <p>Reason: {info.reason}</p>
        <p>Browser: {info.browser || "Unknown"}</p>
        <p>Available fallbacks: {info.availableFallbacks.join(", ")}</p>
      </div>
    );
  }

  const support = getBrowserSupport();

  return (
    <div>
      <h2>Browser Support</h2>
      <p>Level: {support.level}</p>
      <p>Available metrics: {support.availableMetrics.join(", ")}</p>
      <p>Secure context: {support.isSecureContext ? "Yes" : "No"}</p>
      <p>Cross-origin isolated: {support.isCrossOriginIsolated ? "Yes" : "No"}</p>
      {support.limitations.length > 0 && (
        <ul>
          {support.limitations.map((limitation, i) => (
            <li key={i}>{limitation}</li>
          ))}
        </ul>
      )}
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

1. **Tab Visibility**: Automatically pauses monitoring when tab is hidden (configurable with `pauseWhenHidden`)
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

**225 tests passed** covering:

- **Initialization & Lifecycle**: Mount, unmount, start/stop behavior
- **Memory Tracking**: Polling, history, trend analysis
- **Leak Detection**: Linear regression, sensitivity levels, analysis
- **Thresholds**: Severity calculation, callbacks
- **Snapshots**: Create, compare, clear operations
- **Browser Detection**: API availability, fallback strategies
- **Edge Cases**: SSR, unsupported browsers, invalid inputs
- **Store Management**: State updates, subscribers, batch operations
- **Memory APIs**: Performance.memory, DOM nodes, event listeners

---

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>
