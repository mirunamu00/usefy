### useTimer

**Purpose**: Manage countdown timers with control over various time units

**Key Features**:

- Support for multiple time units (ms, seconds, minutes, hours)
- Play, pause, stop, reset controls
- Timer completion callback
- Auto-start option
- Return remaining time in various formats
- Progress calculation (percentage)
- Add/subtract time functionality

**API**:

```typescript
const {
  time, // Remaining time (ms)
  formattedTime, // Formatted time string (HH:MM:SS)
  progress, // Progress percentage (0-100)
  isRunning, // Whether timer is running
  isFinished, // Whether timer is finished
  start, // Start timer
  pause, // Pause timer
  stop, // Stop and reset timer
  reset, // Reset to initial time
  addTime, // Add time
  subtractTime, // Subtract time
} = useTimer(initialTime, options);
```

**Usage Example**:

```typescript
// Basic usage (seconds)
const timer = useTimer(60, {
  interval: 1000,
  onComplete: () => alert("Time is up!"),
  autoStart: true,
});

// 10-minute timer with minutes unit
const timer = useTimer(10, {
  unit: "minutes",
  interval: 1000,
  onComplete: () => console.log("Done!"),
  onTick: (remainingTime) => console.log(remainingTime),
});

// Precise timer with milliseconds unit
const preciseTimer = useTimer(5000, {
  unit: "ms",
  interval: 10, // Update every 10ms
  format: "mm:ss:SSS",
});

return (
  <div>
    <p>Time: {timer.formattedTime}</p>
    <p>Progress: {timer.progress}%</p>
    <button onClick={timer.isRunning ? timer.pause : timer.start}>
      {timer.isRunning ? "Pause" : "Start"}
    </button>
    <button onClick={timer.stop}>Stop</button>
    <button onClick={timer.reset}>Reset</button>
    <button onClick={() => timer.addTime(10, "seconds")}>+10s</button>
  </div>
);
```

**Implementation Points**:

- Manage interval ID with `useRef` to prevent memory leaks
- Handle cleanup with `useEffect` (on component unmount)
- Time unit conversion utility functions (ms, seconds, minutes, hours)
- Use `Date.now()` or `performance.now()` for accurate time measurement
- Provide requestAnimationFrame option (for smoother animations)
- Format options: 'HH:MM:SS', 'MM:SS', 'SS', 'mm:ss:SSS', etc.
- Protect timer from going below 0
- TypeScript type safety (unit, format enums, etc.)
- Maintain accurate time even when browser tab is inactive
- Memoize options object to prevent unnecessary re-renders

**Options Interface**:

```typescript
interface UseTimerOptions {
  unit?: "ms" | "seconds" | "minutes" | "hours";
  interval?: number; // Update interval (ms)
  format?: "HH:MM:SS" | "MM:SS" | "SS" | "mm:ss:SSS" | "custom";
  autoStart?: boolean;
  onComplete?: () => void;
  onTick?: (remainingTime: number) => void;
  onStart?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  useRAF?: boolean; // Whether to use requestAnimationFrame
}
```

**Advanced Features**:

- Save/restore timer state (localStorage integration)
- Manage multiple timers simultaneously
- Timer chaining (sequential execution)
- Repeating timer (loop option)
- Maintain accurate time in background (using Visibility API)
