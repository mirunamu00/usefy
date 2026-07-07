### useTimeout

**Purpose**: Wrap setTimeout as a React hook for declarative and safe delayed execution

**Key Features**:

- Delayed callback execution (setTimeout wrapper)
- Automatic cleanup on component unmount (prevents memory leaks)
- Auto-reset timer when delay changes
- Timer control via reset/clear functions
- Disable timer when delay is null (conditional execution)
- Always maintain latest callback reference (prevents stale closure)
- isPending state to check timer execution status

**API**:

```typescript
// Basic usage (no return value needed)
useTimeout(callback, delay);

// With control functions
const { reset, clear, isPending } = useTimeout(callback, delay);

// Conditional execution (disabled when delay is null)
useTimeout(callback, isEnabled ? 3000 : null);
```

**Return Interface**:

```typescript
interface UseTimeoutReturn {
  reset: () => void; // Reset timer (restart from beginning)
  clear: () => void; // Cancel timer (callback won't execute)
  isPending: boolean; // Whether timer is pending
}
```

**Usage Example**:

```typescript
// 1. Auto-dismissing Toast message
const [show, setShow] = useState(true);

useTimeout(() => {
  setShow(false);
}, 3000);

return show && <Toast message="Will disappear in 3 seconds" />;

// 2. Debounced auto-save
const [content, setContent] = useState("");
const [isSaving, setIsSaving] = useState(false);

const { reset } = useTimeout(() => {
  saveToServer(content);
  setIsSaving(false);
}, 2000);

const handleChange = (value: string) => {
  setContent(value);
  setIsSaving(true);
  reset(); // Reset timer on every keystroke
};

// 3. Conditional timer
const [isLoggedIn, setIsLoggedIn] = useState(true);

useTimeout(
  () => {
    logout();
    alert("Session expired");
  },
  isLoggedIn ? 30 * 60 * 1000 : null // Auto-logout after 30 min only when logged in
);

// 4. Delayed redirect
const [countdown, setCountdown] = useState(5);
const { clear } = useTimeout(() => {
  navigate("/home");
}, 5000);

return (
  <div>
    <p>Redirecting to home in {countdown} seconds</p>
    <button onClick={clear}>Cancel</button>
  </div>
);

// 5. Check timer status
const { isPending, reset, clear } = useTimeout(() => {
  console.log("Executed!");
}, 5000);

return (
  <div>
    <p>Status: {isPending ? "Pending..." : "Completed or Cancelled"}</p>
    <button onClick={reset} disabled={isPending}>
      Restart
    </button>
    <button onClick={clear} disabled={!isPending}>
      Cancel
    </button>
  </div>
);
```

**Implementation Points**:

- Manage timer ID with `useRef` (prevents memory leaks)
- Maintain latest callback reference with `useRef` (solves stale closure problem)
- Handle cleanup with `useEffect` (on component unmount)
- Don't set timer when delay is `null` (conditional execution)
- Cancel existing timer and set new one when delay changes
- Memoize reset/clear functions with `useCallback`
- TypeScript strict type safety

**Options Interface**:

```typescript
// Keep simple API for now (no options object)
// Extensible structure for future:
interface UseTimeoutOptions {
  immediate?: boolean; // Execute immediately, then again after delay
  onClear?: () => void; // Callback when timer is cancelled
  onReset?: () => void; // Callback when timer is reset
}
```

**Edge Cases & Error Handling**:

- `delay < 0`: Treat as 0 (immediate execution)
- `delay === 0`: Execute immediately (next event loop)
- `delay === null | undefined`: Disable timer
- `callback` changes: Don't reset timer (only maintain latest reference)
- Component unmount: Don't execute callback

**TypeScript Types**:

```typescript
type TimeoutDelay = number | null | undefined;

type UseTimeoutCallback = () => void;

interface UseTimeoutReturn {
  reset: () => void;
  clear: () => void;
  isPending: boolean;
}

function useTimeout(
  callback: UseTimeoutCallback,
  delay: TimeoutDelay
): UseTimeoutReturn;
```

**Testing Scenarios**:

1. Basic behavior: Callback executes after delay
2. Auto cleanup: Callback doesn't execute on unmount
3. Delay change: Timer resets when delay changes
4. Null delay: Timer not set when delay is null
5. Reset function: Timer restarts from beginning on reset call
6. Clear function: Timer cancelled on clear call
7. isPending state: Timer status accurately reflected
8. Callback change: Latest callback executes without timer reset
9. Negative delay: Treated as 0
10. SSR environment: Works without errors on server-side

**Performance Considerations**:

- reset/clear functions memoized with `useCallback` for reference stability
- Callback reference managed with `useRef` to prevent unnecessary timer resets
- Minimize isPending state updates

**Comparison with Similar Hooks**:

| Feature              | useTimeout | useInterval | useTimer |
| -------------------- | ---------- | ----------- | -------- |
| One-time execution   | ✅         | ❌          | ❌       |
| Repeated execution   | ❌         | ✅          | ❌       |
| Countdown            | ❌         | ❌          | ✅       |
| Remaining time       | ❌         | ❌          | ✅       |
| reset/clear controls | ✅         | ✅          | ✅       |
| Conditional exec     | ✅         | ✅          | ✅       |

**Dependencies**:

- No external dependencies (React only)

**Browser Support**:

- All modern browsers supported
- Uses setTimeout API (IE6+)
- Safe operation in SSR environment (scheduling happens only inside `useEffect`, which never runs on the server, so no timer is created during server rendering)
