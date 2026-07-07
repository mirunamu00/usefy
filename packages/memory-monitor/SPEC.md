# MemoryMonitorPanel Component Specification

## Overview

**Package Name:** `@usefy/memory-monitor-panel`
**Version:** `0.1.0`
**Status:** Draft
**Created:** 2026-01-09
**Author:** usefy team

---

## 1. Executive Summary

### 1.1 Purpose

`MemoryMonitorPanel` is a React component for real-time browser memory monitoring and visualization. It enables developers to intuitively understand application memory status, detect memory leaks early, and manage memory through automated GC triggers.

### 1.2 Target Users

- Frontend Developers (memory debugging)
- QA Engineers (performance testing)
- DevOps (production monitoring)
- Performance Engineers (optimization analysis)

### 1.3 Key Value Propositions

1. **Zero-Config Setup**: Ready to use with default settings
2. **Production-Safe**: Automatic development/production environment detection
3. **Automated Memory Management**: Threshold-based automatic GC triggers
4. **Rich Visualization**: Real-time charts, trend analysis, history view
5. **Developer Experience**: Intuitive UI, keyboard shortcuts, session persistence

---

## 2. Functional Requirements

### 2.1 Core Features

#### 2.1.1 Panel UI

| Feature | Description | Priority |
|---------|-------------|----------|
| Slide-in Panel | Slide in/out animation from the right side | P0 |
| Resizable Width | Drag to resize panel width (300px - 600px) | P1 |
| Collapsible Sections | Expand/collapse each section | P1 |
| Dark/Light Theme | Auto-detect theme and manual toggle | P2 |
| Floating Trigger Button | Button to open panel (customizable position) | P0 |
| Keyboard Shortcuts | Toggle with Ctrl+Shift+M | P1 |

#### 2.1.2 Memory Visualization

| Feature | Description | Priority |
|---------|-------------|----------|
| Real-time Gauge | Current memory usage gauge (RadialBarChart) | P0 |
| History Chart | Memory changes over time (AreaChart) | P0 |
| Heap Breakdown | Used/Total/Limit distribution (BarChart) | P0 |
| DOM Metrics | DOM nodes and event listener counts | P1 |
| Trend Indicator | Memory increasing/decreasing/stable trend | P0 |
| Leak Probability | Leak probability percentage display | P1 |

#### 2.1.3 Threshold Configuration

| Feature | Description | Priority |
|---------|-------------|----------|
| Warning Threshold | Set warning threshold (default 70%) | P0 |
| Critical Threshold | Set critical threshold (default 90%) | P0 |
| Auto-GC Threshold | Set auto GC trigger threshold | P0 |
| Auto-GC Toggle | Enable/disable auto-GC | P0 |
| Visual Threshold Lines | Display threshold lines on charts | P1 |

#### 2.1.4 Memory Management Actions

| Feature | Description | Priority |
|---------|-------------|----------|
| Manual GC | Manual GC request button | P0 |
| Take Snapshot | Save current memory snapshot | P1 |
| Compare Snapshots | Compare and analyze two snapshots | P1 |
| Clear History | Reset history | P2 |
| Export Data | Export memory data as JSON/CSV | P2 |

#### 2.1.5 Alerts & Notifications

| Feature | Description | Priority |
|---------|-------------|----------|
| Visual Alerts | Color change when threshold exceeded | P0 |
| Toast Notifications | Warning/critical status notifications | P1 |
| Sound Alerts | Critical status sound alerts (optional) | P3 |
| Browser Notification | Background tab notifications | P2 |

#### 2.1.6 Environment Awareness

| Feature | Description | Priority |
|---------|-------------|----------|
| Dev-only Panel | Show panel UI only in development environment | P0 |
| Headless Mode | Features work without UI in production | P0 |
| SSR Safe | Server-side rendering compatible | P0 |
| Feature Flags | Control feature activation per environment | P1 |

### 2.2 Advanced Features

#### 2.2.1 Snapshot Management

```typescript
interface Snapshot {
  id: string;
  label: string;
  timestamp: number;
  memory: MemoryInfo;
  domNodes?: number;
  eventListeners?: number;
  notes?: string;
}
```

- Store up to 10 snapshots
- Snapshot labeling and notes
- Comparison table between snapshots

#### 2.2.2 Session Persistence

- Save settings to LocalStorage
- Restore settings after refresh
- Remember panel state (open/closed, width)

#### 2.2.3 Performance Optimization

- Minimize rendering when hidden
- requestAnimationFrame-based updates
- Memoized chart data

---

## 3. Technical Specifications

### 3.1 Component API

```typescript
interface MemoryMonitorPanelProps {
  // === Core Configuration ===
  /** Panel visibility mode */
  mode?: 'development' | 'production' | 'always' | 'never';

  /** Initial panel open state */
  defaultOpen?: boolean;

  /** Position of the panel */
  position?: 'right' | 'left';

  /** Z-index for the panel */
  zIndex?: number;

  // === Monitoring Options ===
  /** Polling interval in milliseconds */
  interval?: number;

  /** Enable memory history tracking */
  enableHistory?: boolean;

  /** History buffer size */
  historySize?: number;

  /** Track DOM node count */
  trackDOMNodes?: boolean;

  /** Track event listeners (estimated) */
  trackEventListeners?: boolean;

  // === Threshold Configuration ===
  /** Warning threshold percentage (0-100) */
  warningThreshold?: number;

  /** Critical threshold percentage (0-100) */
  criticalThreshold?: number;

  /** Auto-GC threshold percentage (0-100), null to disable */
  autoGCThreshold?: number | null;

  /** Enable auto-GC feature */
  enableAutoGC?: boolean;

  // === Leak Detection ===
  /** Enable memory leak detection */
  enableLeakDetection?: boolean;

  /** Leak detection sensitivity */
  leakSensitivity?: 'low' | 'medium' | 'high';

  // === UI Customization ===
  /** Custom trigger button content */
  triggerContent?: React.ReactNode;

  /** Trigger button position */
  triggerPosition?: { top?: number; bottom?: number; right?: number; left?: number };

  /** Initial panel width */
  defaultWidth?: number;

  /** Theme override */
  theme?: 'light' | 'dark' | 'system';

  /** Custom class name for panel */
  className?: string;

  // === Callbacks ===
  /** Called when panel opens/closes */
  onOpenChange?: (open: boolean) => void;

  /** Called on memory warning */
  onWarning?: (data: MemoryWarning) => void;

  /** Called on critical memory */
  onCritical?: (data: MemoryCritical) => void;

  /** Called when leak is detected */
  onLeakDetected?: (analysis: LeakAnalysis) => void;

  /** Called when auto-GC is triggered */
  onAutoGC?: (data: { threshold: number; usage: number }) => void;

  /** Called on each memory update */
  onUpdate?: (memory: MemoryInfo) => void;

  // === Advanced ===
  /** Keyboard shortcut to toggle panel */
  shortcut?: string;

  /** Enable session persistence */
  persistSettings?: boolean;

  /** Storage key for persistence */
  storageKey?: string;

  /** Disable all features in production */
  disableInProduction?: boolean;
}
```

### 3.2 Exported Types

```typescript
// Re-export from @usefy/use-memory-monitor
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
};

// Panel-specific types
export interface PanelSettings {
  warningThreshold: number;
  criticalThreshold: number;
  autoGCThreshold: number | null;
  enableAutoGC: boolean;
  interval: number;
  theme: 'light' | 'dark' | 'system';
  panelWidth: number;
}

export interface PanelState {
  isOpen: boolean;
  activeTab: 'overview' | 'history' | 'snapshots' | 'settings';
  expandedSections: string[];
}
```

### 3.3 Headless Hook

```typescript
/**
 * Headless version for production use (no UI)
 */
export function useMemoryMonitorHeadless(options: HeadlessOptions): {
  memory: MemoryInfo | null;
  isLeakDetected: boolean;
  severity: Severity;
  requestGC: () => void;
  // ... minimal API
};
```

### 3.4 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@usefy/use-memory-monitor` | workspace:* | Core memory monitoring hook |
| `react` | ^18.0.0 | Peer dependency |
| `recharts` | ^2.15.0 | Chart visualization |
| `tailwindcss` | ^3.4.0 | Styling (peer) |
| `clsx` | ^2.0.0 | Conditional classes |
| `tailwind-merge` | ^2.0.0 | Tailwind class merging |

### 3.5 Browser Support

| Browser | Support Level | Notes |
|---------|--------------|-------|
| Chrome 90+ | Full | `performance.memory` API available |
| Edge 90+ | Full | Chromium-based |
| Firefox 90+ | Partial | DOM metrics only |
| Safari 15+ | Partial | DOM metrics only |
| SSR | Safe | Returns null state |

---

## 4. Architecture

### 4.1 Component Structure

```
memory-monitor-panel/
├── src/
│   ├── index.ts                    # Public exports
│   ├── MemoryMonitorPanel.tsx      # Main component
│   ├── types.ts                    # Type definitions
│   ├── constants.ts                # Default values
│   │
│   ├── components/
│   │   ├── Panel/
│   │   │   ├── Panel.tsx           # Slide panel container
│   │   │   ├── PanelHeader.tsx     # Header with controls
│   │   │   ├── PanelTrigger.tsx    # Floating trigger button
│   │   │   └── PanelResizer.tsx    # Width resize handle
│   │   │
│   │   ├── Visualizations/
│   │   │   ├── MemoryGauge.tsx     # Radial usage gauge
│   │   │   ├── HistoryChart.tsx    # Time-series area chart
│   │   │   ├── HeapBreakdown.tsx   # Stacked bar chart
│   │   │   ├── DOMMetrics.tsx      # DOM/Event counters
│   │   │   └── TrendIndicator.tsx  # Trend arrow/badge
│   │   │
│   │   ├── Controls/
│   │   │   ├── ThresholdSlider.tsx # Threshold configuration
│   │   │   ├── AutoGCToggle.tsx    # Auto-GC switch
│   │   │   ├── ActionButtons.tsx   # GC, Snapshot buttons
│   │   │   └── IntervalSelector.tsx# Polling interval
│   │   │
│   │   ├── Snapshots/
│   │   │   ├── SnapshotList.tsx    # Saved snapshots
│   │   │   ├── SnapshotCard.tsx    # Individual snapshot
│   │   │   └── SnapshotCompare.tsx # Comparison view
│   │   │
│   │   └── Alerts/
│   │       ├── StatusBadge.tsx     # Severity indicator
│   │       ├── AlertToast.tsx      # Toast notification
│   │       └── LeakWarning.tsx     # Leak detection alert
│   │
│   ├── hooks/
│   │   ├── useAutoGC.ts            # Auto-GC logic
│   │   ├── usePanelState.ts        # Panel open/close state
│   │   ├── useSettings.ts          # Settings persistence
│   │   ├── useKeyboardShortcut.ts  # Shortcut handler
│   │   └── useTheme.ts             # Theme detection
│   │
│   ├── utils/
│   │   ├── cn.ts                   # clsx + tailwind-merge
│   │   ├── storage.ts              # LocalStorage helpers
│   │   └── formatters.ts           # Data formatting
│   │
│   └── styles/
│       └── animations.css          # Slide animations
│
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── tailwind.config.js
├── SPEC.md                         # This document (English)
├── SPEC_KO.md                      # Korean version
└── README.md                       # Usage documentation
```

### 4.2 State Management

```
┌─────────────────────────────────────────────────────────────┐
│                    MemoryMonitorPanel                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              useMemoryMonitor (core)                 │   │
│  │  - memory, heapUsed, heapTotal, heapLimit           │   │
│  │  - history, trend, leakProbability                  │   │
│  │  - severity, isLeakDetected                         │   │
│  │  - start, stop, takeSnapshot, requestGC             │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│  ┌──────────────┬────────┴────────┬──────────────────┐     │
│  │ usePanelState│  useSettings    │ useAutoGC        │     │
│  │ - isOpen     │  - thresholds   │ - triggerGC      │     │
│  │ - activeTab  │  - persist      │ - lastTriggered  │     │
│  └──────────────┴─────────────────┴──────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Data Flow

```
User Interaction                Memory Update
      │                              │
      ▼                              ▼
┌──────────┐                  ┌──────────────┐
│ Settings │ ──────────────▶  │ useMemory    │
│ Controls │                  │ Monitor      │
└──────────┘                  └──────────────┘
      │                              │
      │                              ▼
      │                       ┌──────────────┐
      │                       │ Auto-GC      │
      │                       │ Check        │
      │                       └──────────────┘
      │                              │
      ▼                              ▼
┌──────────────────────────────────────────┐
│              Visualization               │
│  - Gauge, Charts, Metrics, Alerts        │
└──────────────────────────────────────────┘
```

---

## 5. UI/UX Specifications

### 5.1 Panel Layout

```
┌─────────────────────────────────────────┐
│  Memory Monitor          [_][□][X]      │  <- Header
├─────────────────────────────────────────┤
│  [Overview] [History] [Snapshots] [⚙]   │  <- Tabs
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │         Memory Usage            │    │
│  │     ┌─────────────────┐         │    │
│  │     │      67%        │         │    │  <- Gauge
│  │     │   ████████░░░   │         │    │
│  │     └─────────────────┘         │    │
│  │   45.2 MB / 67.5 MB / 2 GB      │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  History (Last 50 points)       │    │
│  │  ┌───────────────────────────┐  │    │
│  │  │ ▂▃▅▆▇▆▅▄▃▂▃▄▅▆▇▆▅▄▃▂    │  │    │  <- Chart
│  │  └───────────────────────────┘  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Status                         │    │
│  │  Severity: [Normal] ●           │    │
│  │  Trend: → Stable                │    │
│  │  Leak Risk: 12%                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Quick Actions                  │    │
│  │  [🗑 Request GC] [📷 Snapshot]  │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

### 5.2 Color Scheme

```typescript
const colors = {
  severity: {
    normal: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      accent: '#22c55e',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      accent: '#f59e0b',
    },
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      accent: '#ef4444',
    },
  },
  chart: {
    heapUsed: '#6366f1',     // indigo-500
    heapTotal: '#a855f7',    // purple-500
    threshold: {
      warning: '#f59e0b',    // amber-500
      critical: '#ef4444',   // red-500
    },
  },
};
```

### 5.3 Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| < 640px | Full screen panel (modal mode) |
| 640px - 1024px | Fixed panel width (350px) |
| > 1024px | Resizable panel width (300-600px) |

### 5.4 Animation Specs

| Animation | Duration | Easing |
|-----------|----------|--------|
| Panel slide | 300ms | ease-out |
| Section collapse | 200ms | ease-in-out |
| Chart update | 300ms | linear |
| Alert fade | 150ms | ease-in |

---

## 6. Development Milestones

### Phase 1: Foundation (Week 1)

- [ ] Project setup (package.json, tsconfig, tsup, vitest)
- [ ] Type definitions
- [ ] Basic Panel component (slide in/out)
- [ ] Panel trigger button
- [ ] Integration with useMemoryMonitor

### Phase 2: Core Visualization (Week 2)

- [ ] Memory gauge (RadialBarChart)
- [ ] History chart (AreaChart)
- [ ] Heap breakdown display
- [ ] Severity status badge
- [ ] Trend indicator

### Phase 3: Configuration UI (Week 3)

- [ ] Threshold slider controls
- [ ] Auto-GC toggle & threshold
- [ ] Interval selector
- [ ] Settings persistence (LocalStorage)

### Phase 4: Advanced Features (Week 4)

- [ ] Snapshot management UI
- [ ] Snapshot comparison view
- [ ] Keyboard shortcuts
- [ ] Theme support (dark/light)
- [ ] Export functionality

### Phase 5: Polish & Testing (Week 5)

- [ ] Unit tests (90%+ coverage)
- [ ] Integration tests
- [ ] Storybook stories
- [ ] Documentation
- [ ] Performance optimization
- [ ] Accessibility audit

---

## 7. Testing Strategy

### 7.1 Unit Tests

```typescript
describe('MemoryMonitorPanel', () => {
  describe('rendering', () => {
    it('should render trigger button by default');
    it('should not render in production mode');
    it('should render panel when open');
  });

  describe('panel behavior', () => {
    it('should toggle panel on trigger click');
    it('should close on escape key');
    it('should toggle on keyboard shortcut');
  });

  describe('threshold configuration', () => {
    it('should update warning threshold');
    it('should trigger auto-GC at threshold');
    it('should persist settings');
  });

  describe('snapshots', () => {
    it('should take snapshot');
    it('should compare snapshots');
    it('should limit to max snapshots');
  });
});
```

### 7.2 Integration Tests

- Panel + useMemoryMonitor integration
- Settings persistence across sessions
- Auto-GC trigger verification

### 7.3 Visual Tests

- Storybook stories for all states
- Chromatic visual regression (optional)

---

## 8. Performance Considerations

### 8.1 Rendering Optimization

- `useMemo` for chart data transformation
- `useCallback` for all handlers
- `React.memo` for pure components
- Virtualized list for long histories

### 8.2 Memory Footprint

- Limit history to configurable size (default 50)
- Limit snapshots to 10
- Clean up event listeners on unmount
- Avoid memory leaks in the memory monitor itself

### 8.3 Bundle Size

- Tree-shaking friendly exports
- Lazy load chart components
- Target: < 50KB gzipped (excluding recharts)

---

## 9. Accessibility

### 9.1 WCAG 2.1 AA Compliance

- Keyboard navigation (Tab, Enter, Escape)
- Focus management
- Screen reader announcements for alerts
- Sufficient color contrast

### 9.2 ARIA Attributes

```tsx
<div
  role="dialog"
  aria-label="Memory Monitor Panel"
  aria-modal="false"
  aria-describedby="memory-status"
>
  <div id="memory-status" role="status" aria-live="polite">
    Memory usage: 67% (Warning)
  </div>
</div>
```

---

## 10. Security Considerations

- No sensitive data exposure
- LocalStorage data is non-sensitive settings only
- No external network requests
- CSP compatible (no inline styles via style attr)

---

## 11. Documentation Requirements

### 11.1 README.md

- Installation
- Quick start
- API reference
- Examples
- Troubleshooting

### 11.2 Storybook

- Default story
- All configurations
- Interactive controls
- Accessibility tests

### 11.3 JSDoc

- All exported functions/types
- @example for complex APIs

---

## 12. Success Criteria

### 12.1 Functional

- [ ] Panel slides in/out smoothly
- [ ] All memory metrics displayed correctly
- [ ] Thresholds configurable and functional
- [ ] Auto-GC triggers at set threshold
- [ ] Settings persist across sessions
- [ ] Works in development mode only by default

### 12.2 Non-Functional

- [ ] 90%+ test coverage
- [ ] < 50KB bundle size (excluding recharts)
- [ ] No memory leaks
- [ ] WCAG 2.1 AA compliant
- [ ] SSR compatible
- [ ] TypeScript strict mode

---

## 13. Open Questions

1. **Toast Notification Library**: Self-implementation vs external library (react-hot-toast)?
2. **Animation Library**: CSS only vs framer-motion?
3. **Threshold Persistence Scope**: Global vs per-page?
4. **Max History Size**: Should it be user-configurable?

---

## 14. Appendix

### A. Related Packages

- `@usefy/use-memory-monitor` - Core monitoring hook
- `recharts` - Chart library
- `tailwindcss` - Styling

### B. References

- [Chrome DevTools Memory Panel](https://developer.chrome.com/docs/devtools/memory-problems/)
- [performance.memory API](https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory)
- [React Performance Profiling](https://react.dev/reference/react/Profiler)

### C. Glossary

| Term | Definition |
|------|------------|
| Heap | Memory area where JavaScript objects are allocated |
| GC | Garbage Collection - reclaiming unused memory |
| Leak | Memory that is no longer needed but not released |
| Severity | Memory usage status level (normal/warning/critical) |

---

*Document Version: 1.0*
*Last Updated: 2026-01-09*
