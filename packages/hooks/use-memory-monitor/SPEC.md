### useMemoryMonitor

**Purpose**: Monitor browser memory usage in real-time and detect memory leaks to ensure application performance and stability

**Key Features**:

- Real-time memory usage tracking (JS Heap, DOM Nodes, Event Listeners)
- Memory leak pattern detection and warnings
- Threshold-based alert system
- Memory snapshot comparison and analysis
- GC (Garbage Collection) hint triggering
- Memory usage history and trend analysis
- Development mode exclusive detailed debugging info
- Graceful degradation for unsupported environments

**API**:

```typescript
const {
  // Current State
  memory, // Current memory info object
  heapUsed, // Used JS Heap (bytes)
  heapTotal, // Total JS Heap size (bytes)
  heapLimit, // JS Heap limit (bytes)
  usagePercentage, // Memory usage rate (0-100)

  // DOM Related
  domNodes, // Current DOM node count
  eventListeners, // Registered event listener count

  // Status Flags
  isSupported, // API support status
  isMonitoring, // Monitoring active status
  isLeakDetected, // Memory leak detection status
  severity, // Severity level ('normal' | 'warning' | 'critical')

  // Support Details
  supportLevel, // 'full' | 'partial' | 'none'
  availableMetrics, // Array of available metric names

  // Analysis Data
  history, // Memory history array
  trend, // Memory trend ('stable' | 'increasing' | 'decreasing')
  leakProbability, // Leak probability (0-100)

  // Actions
  start, // Start monitoring
  stop, // Stop monitoring
  takeSnapshot, // Save current snapshot
  compareSnapshots, // Compare two snapshots
  clearHistory, // Clear history
  requestGC, // Request GC hint (if available)

  // Formatting
  formatted, // Formatted memory values { heapUsed: '45.2 MB', ... }
} = useMemoryMonitor(options);
```

**Usage Example**:

```typescript
// Basic usage
const { heapUsed, usagePercentage, isLeakDetected } = useMemoryMonitor();

// Detailed monitoring with threshold configuration
const monitor = useMemoryMonitor({
  interval: 2000,
  enableHistory: true,
  historySize: 100,
  thresholds: {
    warning: 70, // Warning at 70% usage
    critical: 90, // Critical at 90% usage
  },
  leakDetection: {
    enabled: true,
    sensitivity: "medium",
    windowSize: 10, // Based on last 10 samples
  },
  onWarning: (data) => console.warn("Memory warning:", data),
  onCritical: (data) => captureErrorLog(data),
  onLeakDetected: (analysis) => reportToMonitoring(analysis),
});

// Debugging in development environment
const debugMonitor = useMemoryMonitor({
  devMode: true,
  trackDOMNodes: true,
  trackEventListeners: true,
  logToConsole: true,
});

// Memory leak tracking via snapshot comparison
useEffect(() => {
  monitor.takeSnapshot("before-action");

  return () => {
    monitor.takeSnapshot("after-action");
    const diff = monitor.compareSnapshots("before-action", "after-action");
    if (diff.heapDelta > 1024 * 1024) {
      // Over 1MB increase
      console.warn("Potential memory leak:", diff);
    }
  };
}, []);

// Handle unsupported environments gracefully
const monitor = useMemoryMonitor({
  onUnsupported: (info) => {
    console.info("Memory API not fully supported:", info.reason);
    // Fallback to alternative monitoring strategy
  },
});

if (!monitor.isSupported) {
  return <div>Memory monitoring not available in this browser</div>;
}

// Check specific metric availability
if (monitor.availableMetrics.includes("heapUsed")) {
  console.log("Heap tracking available");
}

return (
  <div>
    <p>Heap Used: {monitor.formatted.heapUsed}</p>
    <p>Usage: {monitor.usagePercentage.toFixed(1)}%</p>
    <p>Trend: {monitor.trend}</p>
    {monitor.isLeakDetected && (
      <Alert severity="warning">
        Memory leak detected! Probability: {monitor.leakProbability}%
      </Alert>
    )}
    <MemoryChart data={monitor.history} />
  </div>
);
```

**Implementation Points**:

- Utilize `performance.measureUserAgentSpecificMemory()` or `performance.memory` API
- Graceful degradation for unsupported browsers
- Manage interval ID and history with `useRef`
- Cleanup monitoring with `useEffect`
- Web Worker option (prevent main thread blocking)
- Linear regression algorithm for memory trend analysis
- Circular buffer for history memory efficiency
- Track DOM node changes with `MutationObserver`
- `getEventListeners()` polyfill (development environment)
- Byte unit formatting utilities (B, KB, MB, GB)
- TypeScript strict type safety
- Auto-disable option in production builds
- Consider `useSyncExternalStore` (concurrent mode stability)
- Memoization to prevent unnecessary re-renders

**Options Interface**:

```typescript
interface UseMemoryMonitorOptions {
  // Basic Settings
  interval?: number; // Monitoring interval (ms), default: 5000
  autoStart?: boolean; // Auto start, default: true
  enabled?: boolean; // Enable status, default: true

  // History
  enableHistory?: boolean; // Save history, default: false
  historySize?: number; // Max history size, default: 50

  // Thresholds
  thresholds?: {
    warning?: number; // Warning threshold (%), default: 70
    critical?: number; // Critical threshold (%), default: 90
  };

  // Leak Detection
  leakDetection?: {
    enabled?: boolean; // Enable leak detection, default: false
    sensitivity?: "low" | "medium" | "high"; // Sensitivity, default: 'medium'
    windowSize?: number; // Analysis window size, default: 10
    threshold?: number; // Growth rate threshold (bytes/sample)
  };

  // Additional Tracking (Development)
  devMode?: boolean; // Development mode, default: false
  trackDOMNodes?: boolean; // Track DOM nodes, default: false
  trackEventListeners?: boolean; // Track event listeners, default: false
  logToConsole?: boolean; // Console logging, default: false

  // Callbacks
  onUpdate?: (memory: MemoryInfo) => void;
  onWarning?: (data: MemoryWarning) => void;
  onCritical?: (data: MemoryCritical) => void;
  onLeakDetected?: (analysis: LeakAnalysis) => void;
  onUnsupported?: (info: UnsupportedInfo) => void;

  // Advanced Settings
  useWorker?: boolean; // Use Web Worker, default: false
  disableInProduction?: boolean; // Disable in production, default: false
  fallbackStrategy?: "none" | "estimation" | "dom-only"; // Fallback for unsupported browsers
}
```

**Return Types**:

```typescript
interface MemoryInfo {
  heapUsed: number;
  heapTotal: number;
  heapLimit: number;
  timestamp: number;
}

interface MemorySnapshot {
  id: string;
  memory: MemoryInfo;
  domNodes?: number;
  eventListeners?: number;
  timestamp: number;
}

interface LeakAnalysis {
  isLeaking: boolean;
  probability: number; // 0-100
  trend: "stable" | "increasing" | "decreasing";
  averageGrowth: number; // bytes per interval
  samples: MemoryInfo[];
  recommendation?: string;
}

interface SnapshotDiff {
  heapDelta: number;
  heapPercentChange: number;
  domNodesDelta?: number;
  eventListenersDelta?: number;
  timeDelta: number;
}

interface UnsupportedInfo {
  reason: "no-api" | "server-side" | "insecure-context" | "browser-restriction";
  browser?: string;
  availableFallbacks: string[];
}
```

**Browser Compatibility**:

```typescript
// API Support Matrix
┌─────────────────────────────────────────────────────────────────────────────┐
│ API                                  │ Chrome │ Firefox │ Safari │ Edge    │
├─────────────────────────────────────────────────────────────────────────────┤
│ performance.memory                   │ ✅      │ ❌       │ ❌      │ ✅      │
│ ├─ usedJSHeapSize                    │ ✅      │ ❌       │ ❌      │ ✅      │
│ ├─ totalJSHeapSize                   │ ✅      │ ❌       │ ❌      │ ✅      │
│ └─ jsHeapSizeLimit                   │ ✅      │ ❌       │ ❌      │ ✅      │
│ measureUserAgentSpecificMemory()     │ ✅ 89+  │ ❌       │ ❌      │ ✅ 89+  │
│ PerformanceObserver ('memory')       │ 🔶      │ ❌       │ ❌      │ 🔶      │
│ document.querySelectorAll (DOM count)│ ✅      │ ✅       │ ✅      │ ✅      │
│ MutationObserver                     │ ✅      │ ✅       │ ✅      │ ✅      │
│ getEventListeners() (DevTools only)  │ ✅      │ ✅       │ ✅      │ ✅      │
└─────────────────────────────────────────────────────────────────────────────┘
✅ Supported  🔶 Partial/Flag Required  ❌ Not Supported

// Support Level Detection
type SupportLevel = 'full' | 'partial' | 'none';

interface BrowserSupport {
  level: SupportLevel;
  availableMetrics: AvailableMetric[];
  limitations: string[];
}

type AvailableMetric =
  | 'heapUsed'
  | 'heapTotal'
  | 'heapLimit'
  | 'domNodes'
  | 'eventListeners';

// Detection Implementation
function detectSupport(): BrowserSupport {
  // Full support: Chrome/Edge with performance.memory
  // Partial support: Any browser with DOM tracking only
  // None: SSR or no relevant APIs available
}
```

**Fallback Strategies**:

```typescript
// Strategy 1: 'none' - Return unsupported state, no monitoring
// Strategy 2: 'estimation' - Estimate memory via object allocation tracking
// Strategy 3: 'dom-only' - Track only DOM nodes and event listeners

interface FallbackBehavior {
  none: {
    isSupported: false;
    // All memory values return null
    heapUsed: null;
    heapTotal: null;
    heapLimit: null;
  };
  estimation: {
    isSupported: true; // partial
    // Rough estimation based on tracked object sizes
    // Less accurate but provides trend data
    heapUsed: number; // estimated
    heapTotal: null;
    heapLimit: null;
  };
  "dom-only": {
    isSupported: true; // partial
    // Only DOM-related metrics available
    heapUsed: null;
    domNodes: number;
    eventListeners: number; // via manual tracking
  };
}
```

**Server-Side Rendering (SSR) Compatibility**:

```typescript
// SSR Detection & Handling
const isServer = typeof window === "undefined";
const isClient = !isServer;

// SSR-Safe Implementation Pattern
function useMemoryMonitor(options?: UseMemoryMonitorOptions) {
  // 1. Early return for SSR - return safe default values
  if (typeof window === "undefined") {
    return {
      isSupported: false,
      isServer: true,
      heapUsed: null,
      heapTotal: null,
      heapLimit: null,
      usagePercentage: null,
      // ... all values null/false
      start: () => {}, // no-op functions
      stop: () => {},
      takeSnapshot: () => null,
      // ...
    };
  }

  // 2. Client-side initialization with useEffect
  useEffect(() => {
    // All browser API access happens here
    // Safe from SSR hydration mismatches
  }, []);

  // 3. Use lazy initialization for browser APIs
  const memoryAPIRef = useRef<Performance["memory"] | null>(null);

  useEffect(() => {
    memoryAPIRef.current = (performance as any).memory ?? null;
  }, []);
}

// Framework-Specific Considerations
/*
 * Next.js:
 *   - Use dynamic import with { ssr: false } for memory-heavy visualizations
 *   - Wrap in ClientOnly component if needed
 *
 * Remix:
 *   - Use clientLoader for memory data
 *   - Ensure no window access in loader functions
 *
 * Gatsby:
 *   - Use useEffect for all browser API access
 *   - Check typeof window in gatsby-browser.js
 */

// Hydration Mismatch Prevention
interface SSRSafeState {
  // Use null instead of undefined for SSR consistency
  heapUsed: number | null;
  // Avoid Date.now() in initial state
  timestamp: number | null;
  // Initialize as false, update in useEffect
  isMonitoring: boolean;
}
```

**Secure Context Requirements**:

```typescript
// measureUserAgentSpecificMemory() requires:
// 1. Secure context (HTTPS)
// 2. Cross-origin isolation headers:
//    - Cross-Origin-Opener-Policy: same-origin
//    - Cross-Origin-Embedder-Policy: require-corp

function checkSecureContextRequirements(): {
  isSecureContext: boolean;
  isCrossOriginIsolated: boolean;
  canUsePreciseMemory: boolean;
  missingRequirements: string[];
} {
  const isSecureContext = window.isSecureContext ?? false;
  const isCrossOriginIsolated = window.crossOriginIsolated ?? false;

  const missing: string[] = [];
  if (!isSecureContext) missing.push("HTTPS required");
  if (!isCrossOriginIsolated) {
    missing.push("Cross-Origin-Opener-Policy: same-origin");
    missing.push("Cross-Origin-Embedder-Policy: require-corp");
  }

  return {
    isSecureContext,
    isCrossOriginIsolated,
    canUsePreciseMemory: isSecureContext && isCrossOriginIsolated,
    missingRequirements: missing,
  };
}
```

**Advanced Features**:

- Per-component memory impact analysis (React DevTools integration)
- Memory profiling data export (JSON, CSV)
- Real-time memory chart rendering optimization
- Custom memory metrics extension support
- SSR environment safe handling (window undefined)
- React Strict Mode compatibility
- External monitoring service integration (Sentry, DataDog, etc.)
- Auto cleanup trigger under memory pressure
- Background tab detection and monitoring interval adjustment
- Cross-origin iframe memory tracking option

**Testing Considerations**:

- Mock `performance.memory` for unit tests
- Memory leak simulation test cases
- Boundary value tests (0%, 100%, negative values)
- Long-running stability tests
- Concurrent multiple instance tests
- SSR environment simulation tests
- Cross-browser compatibility tests
- Secure context requirement tests
