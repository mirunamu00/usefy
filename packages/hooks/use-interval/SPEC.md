### useInterval

**Purpose**: Wrap setInterval as a React hook for declarative and safe repeated execution

**Key Features**:

- Repeated callback execution at specified intervals (setInterval wrapper)
- Automatic cleanup on component unmount (prevents memory leaks)
- Dynamic interval adjustment without losing timing
- Timer control via start/stop/reset functions
- Disable interval when delay is null (conditional execution)
- Always maintain latest callback reference (prevents stale closure)
- isRunning state to check interval execution status
- Immediate execution option (run callback immediately, then at intervals)

**API**:

```typescript
// Basic usage (auto-starts)
useInterval(callback, delay);

// With control functions
const { start, stop, toggle, isRunning } = useInterval(callback, delay);

// Conditional execution (disabled when delay is null)
useInterval(callback, isEnabled ? 1000 : null);

// With options
useInterval(callback, delay, { immediate: true });
```

**Return Interface**:

```typescript
interface UseIntervalReturn {
  start: () => void; // Start the interval
  stop: () => void; // Stop the interval
  toggle: () => void; // Toggle between start/stop
  isRunning: boolean; // Whether interval is currently running
}
```

**Options Interface**:

```typescript
interface UseIntervalOptions {
  immediate?: boolean; // Execute callback immediately on start (default: false)
  autoStart?: boolean; // Start interval automatically (default: true)
}
```

**Usage Example**:

```typescript
// 1. Basic polling
const [data, setData] = useState(null);

useInterval(() => {
  fetchData().then(setData);
}, 5000); // Poll every 5 seconds

// 2. Countdown timer
const [count, setCount] = useState(10);

useInterval(
  () => {
    setCount((c) => c - 1);
  },
  count > 0 ? 1000 : null // Stop when count reaches 0
);

return <div>Countdown: {count}</div>;

// 3. Auto-refresh with manual control
const [isAutoRefresh, setIsAutoRefresh] = useState(true);

const { start, stop, isRunning } = useInterval(
  () => {
    refreshData();
  },
  isAutoRefresh ? 3000 : null
);

return (
  <div>
    <button onClick={() => setIsAutoRefresh(!isAutoRefresh)}>
      {isRunning ? "Stop Auto-Refresh" : "Start Auto-Refresh"}
    </button>
  </div>
);

// 4. Animation frame counter
const [frame, setFrame] = useState(0);

useInterval(() => {
  setFrame((f) => f + 1);
}, 16); // ~60fps

// 5. Real-time clock
const [time, setTime] = useState(new Date());

useInterval(() => {
  setTime(new Date());
}, 1000);

return <div>{time.toLocaleTimeString()}</div>;

// 6. With immediate execution
const [logs, setLogs] = useState<string[]>([]);

useInterval(
  () => {
    setLogs((prev) => [...prev, `Log at ${new Date().toISOString()}`]);
  },
  2000,
  { immediate: true } // Execute immediately, then every 2 seconds
);

// 7. Pause/Resume functionality
const { toggle, isRunning } = useInterval(() => {
  console.log("Tick!");
}, 1000);

return (
  <button onClick={toggle}>{isRunning ? "Pause" : "Resume"}</button>
);
```

**Implementation Points**:

- Manage interval ID with `useRef` (prevents memory leaks)
- Maintain latest callback reference with `useRef` (solves stale closure problem)
- Handle cleanup with `useEffect` (on component unmount)
- Don't set interval when delay is `null` (conditional execution)
- Restart interval when delay changes (with new interval value)
- Memoize start/stop/toggle functions with `useCallback`
- TypeScript strict type safety
- Support immediate execution option

**Edge Cases & Error Handling**:

- `delay < 0`: Treat as 0 (execute as fast as possible, not recommended)
- `delay === 0`: Execute as fast as possible (caution: may cause performance issues)
- `delay === null | undefined`: Disable interval
- `callback` changes: Don't restart interval (only maintain latest reference)
- Component unmount: Clear interval immediately
- `start()` when already running: No effect (idempotent)
- `stop()` when already stopped: No effect (idempotent)

**TypeScript Types**:

```typescript
type IntervalDelay = number | null | undefined;

type UseIntervalCallback = () => void;

interface UseIntervalOptions {
  immediate?: boolean;
  autoStart?: boolean;
}

interface UseIntervalReturn {
  start: () => void;
  stop: () => void;
  toggle: () => void;
  isRunning: boolean;
}

function useInterval(
  callback: UseIntervalCallback,
  delay: IntervalDelay,
  options?: UseIntervalOptions
): UseIntervalReturn;
```

**Testing Scenarios**:

1. Basic behavior: Callback executes repeatedly at interval
2. Auto cleanup: Interval cleared on unmount
3. Delay change: Interval restarts with new delay
4. Null delay: Interval not set when delay is null
5. Start function: Interval starts on call
6. Stop function: Interval stops on call
7. Toggle function: Alternates between start/stop
8. isRunning state: Accurately reflects interval status
9. Callback change: Latest callback executes without interval restart
10. Immediate option: Callback executes immediately then at intervals
11. AutoStart option: Interval starts/doesn't start based on option
12. Multiple start calls: Idempotent (no duplicate intervals)
13. SSR environment: Works without errors on server-side

**Performance Considerations**:

- start/stop/toggle functions memoized with `useCallback` for reference stability
- Callback reference managed with `useRef` to prevent unnecessary interval restarts
- Minimize isRunning state updates
- Warn developers about very small delay values (< 10ms)

**Comparison with Similar Hooks**:

| Feature              | useTimeout | useInterval | useTimer |
| -------------------- | ---------- | ----------- | -------- |
| One-time execution   | ✅         | ❌          | ❌       |
| Repeated execution   | ❌         | ✅          | ❌       |
| Countdown            | ❌         | ❌          | ✅       |
| Remaining time       | ❌         | ❌          | ✅       |
| start/stop controls  | ❌         | ✅          | ✅       |
| reset/clear controls | ✅         | ❌          | ✅       |
| Conditional exec     | ✅         | ✅          | ✅       |
| Immediate exec       | ❌         | ✅          | ❌       |

**Dependencies**:

- No external dependencies (React only)

**Browser Support**:

- All modern browsers supported
- Uses setInterval API (IE6+)
- Safe operation in SSR environment (typeof window check)
