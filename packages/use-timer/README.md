<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-timer</h1>

<p align="center">
  <strong>A powerful, accurate countdown timer hook for React applications</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-timer">
    <img src="https://img.shields.io/npm/v/@usefy/use-timer.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-timer">
    <img src="https://img.shields.io/npm/dm/@usefy/use-timer.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-timer">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-timer?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-timer.svg?style=flat-square&color=007acc" alt="license" />
  </a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#examples">Examples</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usetimer--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/use-timer` is a feature-rich countdown timer hook for React applications. It provides accurate time tracking with drift compensation, multiple time formats, flexible controls, and smart render optimization.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-timer?

- **Accurate Timing** — Uses `performance.now()` with drift compensation for precise countdowns
- **Smart Render Optimization** — Only re-renders when the formatted time actually changes
- **Multiple Formats** — Built-in formats (`MM:SS`, `HH:MM:SS`, `mm:ss.SSS`) or custom formatters
- **Full Control** — Start, pause, stop, reset, restart, and toggle controls
- **Time Manipulation** — Add, subtract, or set time dynamically during countdown
- **Background Tab Support** — Visibility API integration for accurate time when switching tabs
- **Loop Mode** — Automatically restart the timer when it completes
- **TypeScript First** — Full type safety with comprehensive type definitions
- **Zero Dependencies** — Pure React implementation
- **Well Tested** — 123 tests with comprehensive coverage

---

## Installation

```bash
# npm
npm install @usefy/use-timer

# yarn
yarn add @usefy/use-timer

# pnpm
pnpm add @usefy/use-timer
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
import { useTimer, ms } from "@usefy/use-timer";

function Timer() {
  const timer = useTimer(ms.minutes(5), { format: "MM:SS" });

  return (
    <div>
      <p>{timer.time}</p>
      <button onClick={timer.toggle}>
        {timer.isRunning ? "Pause" : "Start"}
      </button>
      <button onClick={timer.reset}>Reset</button>
    </div>
  );
}
```

---

## API Reference

### `useTimer(initialTimeMs, options?)`

A hook that manages countdown timer state with comprehensive controls.

#### Parameters

| Parameter       | Type              | Description                            |
| --------------- | ----------------- | -------------------------------------- |
| `initialTimeMs` | `number`          | Initial countdown time in milliseconds |
| `options`       | `UseTimerOptions` | Optional configuration object          |

#### Options

| Option       | Type                          | Default   | Description                                      |
| ------------ | ----------------------------- | --------- | ------------------------------------------------ |
| `interval`   | `number`                      | `1`       | Update interval in milliseconds                  |
| `format`     | `TimeFormat \| TimeFormatter` | `"MM:SS"` | Time display format or custom formatter function |
| `autoStart`  | `boolean`                     | `false`   | Start timer automatically on mount               |
| `loop`       | `boolean`                     | `false`   | Restart timer automatically when it completes    |
| `useRAF`     | `boolean`                     | `false`   | Use `requestAnimationFrame` instead of interval  |
| `onComplete` | `() => void`                  | -         | Callback when timer reaches 0                    |
| `onTick`     | `(remaining: number) => void` | -         | Callback on each tick with remaining time        |
| `onStart`    | `() => void`                  | -         | Callback when timer starts                       |
| `onPause`    | `() => void`                  | -         | Callback when timer is paused                    |
| `onReset`    | `() => void`                  | -         | Callback when timer is reset                     |
| `onStop`     | `() => void`                  | -         | Callback when timer is stopped                   |

#### Time Formats

| Format           | Example        | Description                        |
| ---------------- | -------------- | ---------------------------------- |
| `"MM:SS"`        | `05:30`        | Minutes and seconds                |
| `"HH:MM:SS"`     | `01:05:30`     | Hours, minutes, and seconds        |
| `"SS"`           | `330`          | Total seconds                      |
| `"mm:ss.SSS"`    | `05:30.123`    | Minutes, seconds, and milliseconds |
| `"HH:MM:SS.SSS"` | `01:05:30.123` | Full format with milliseconds      |
| Custom function  | Any string     | `(ms: number) => string`           |

#### Returns `UseTimerReturn`

| Property       | Type                   | Description                                             |
| -------------- | ---------------------- | ------------------------------------------------------- |
| `time`         | `string`               | Formatted time string (e.g., "05:30")                   |
| `progress`     | `number`               | Progress percentage (0-100)                             |
| `status`       | `TimerStatus`          | Current status: `idle`, `running`, `paused`, `finished` |
| `isRunning`    | `boolean`              | Whether timer is running                                |
| `isPaused`     | `boolean`              | Whether timer is paused                                 |
| `isFinished`   | `boolean`              | Whether timer has finished                              |
| `isIdle`       | `boolean`              | Whether timer is idle                                   |
| `start`        | `() => void`           | Start the timer                                         |
| `pause`        | `() => void`           | Pause the timer                                         |
| `stop`         | `() => void`           | Stop timer (keep current time)                          |
| `reset`        | `() => void`           | Reset to initial time                                   |
| `restart`      | `() => void`           | Reset and immediately start                             |
| `toggle`       | `() => void`           | Toggle between start/pause                              |
| `addTime`      | `(ms: number) => void` | Add time to the timer                                   |
| `subtractTime` | `(ms: number) => void` | Subtract time from the timer                            |
| `setTime`      | `(ms: number) => void` | Set timer to a specific value                           |

### `ms` Helper Object

A utility object for converting time units to milliseconds.

```tsx
import { ms } from "@usefy/use-timer";

ms.seconds(30); // 30000
ms.minutes(5); // 300000
ms.hours(1); // 3600000

// Combine them
ms.hours(1) + ms.minutes(30); // 1h 30m = 5400000
```

---

## Examples

### Basic Countdown Timer

```tsx
import { useTimer, ms } from "@usefy/use-timer";

function CountdownTimer() {
  const timer = useTimer(ms.minutes(5), {
    format: "MM:SS",
    onComplete: () => alert("Time's up!"),
  });

  return (
    <div>
      <div className="time-display">{timer.time}</div>
      <div className="controls">
        <button onClick={timer.toggle}>
          {timer.isRunning ? "⏸ Pause" : "▶ Start"}
        </button>
        <button onClick={timer.reset}>↺ Reset</button>
      </div>
    </div>
  );
}
```

### Precision Timer with Milliseconds

```tsx
import { useTimer, ms } from "@usefy/use-timer";

function PrecisionTimer() {
  const timer = useTimer(ms.seconds(10), {
    format: "mm:ss.SSS",
    interval: 1, // Update every 1ms
  });

  return (
    <div>
      <div className="precision-display">{timer.time}</div>
      <button onClick={timer.toggle}>
        {timer.isRunning ? "Pause" : "Start"}
      </button>
    </div>
  );
}
```

### Auto-Start Timer

```tsx
import { useTimer, ms } from "@usefy/use-timer";

function AutoStartTimer() {
  const timer = useTimer(ms.seconds(30), {
    autoStart: true,
    format: "MM:SS",
    onComplete: () => console.log("Completed!"),
  });

  return <div>{timer.time}</div>;
}
```

### Looping Timer

```tsx
import { useTimer, ms } from "@usefy/use-timer";

function LoopingTimer() {
  const timer = useTimer(ms.seconds(10), {
    loop: true,
    format: "MM:SS",
    onComplete: () => console.log("Loop completed!"),
  });

  return (
    <div>
      <p>{timer.time}</p>
      <button onClick={timer.toggle}>
        {timer.isRunning ? "Pause" : "Start"}
      </button>
    </div>
  );
}
```

### Time Manipulation

```tsx
import { useTimer, ms } from "@usefy/use-timer";

function ManipulableTimer() {
  const timer = useTimer(ms.minutes(1), { format: "MM:SS" });

  return (
    <div>
      <p>{timer.time}</p>
      <div className="controls">
        <button onClick={timer.toggle}>
          {timer.isRunning ? "Pause" : "Start"}
        </button>
        <button onClick={() => timer.addTime(ms.seconds(10))}>+10s</button>
        <button onClick={() => timer.subtractTime(ms.seconds(10))}>-10s</button>
        <button onClick={timer.reset}>Reset</button>
      </div>
    </div>
  );
}
```

### Progress Bar

```tsx
import { useTimer, ms } from "@usefy/use-timer";

function TimerWithProgress() {
  const timer = useTimer(ms.minutes(1), { format: "MM:SS" });

  return (
    <div>
      <p>{timer.time}</p>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${100 - timer.progress}%` }}
        />
      </div>
      <button onClick={timer.toggle}>
        {timer.isRunning ? "Pause" : "Start"}
      </button>
    </div>
  );
}
```

### Custom Formatter

```tsx
import { useTimer, ms } from "@usefy/use-timer";

function CustomFormattedTimer() {
  const timer = useTimer(ms.hours(2) + ms.minutes(30), {
    format: (ms) => {
      const hours = Math.floor(ms / 3600000);
      const minutes = Math.floor((ms % 3600000) / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      return `${hours}h ${minutes}m ${seconds}s`;
    },
  });

  return (
    <div>
      <p>{timer.time}</p> {/* "2h 30m 0s" */}
      <button onClick={timer.toggle}>
        {timer.isRunning ? "Pause" : "Start"}
      </button>
    </div>
  );
}
```

### Kitchen Timer with Presets

```tsx
import { useTimer, ms } from "@usefy/use-timer";

function KitchenTimer() {
  const timer = useTimer(ms.minutes(5), {
    format: "MM:SS",
    onComplete: () => playAlarm(),
  });

  const presets = [1, 3, 5, 10, 15, 30];

  return (
    <div>
      <div className="presets">
        {presets.map((min) => (
          <button key={min} onClick={() => timer.setTime(ms.minutes(min))}>
            {min}m
          </button>
        ))}
      </div>
      <p>{timer.time}</p>
      <button onClick={timer.toggle}>
        {timer.isRunning ? "Pause" : "Start"}
      </button>
    </div>
  );
}
```

---

## Render Optimization

The hook is optimized to **only trigger re-renders when the formatted time changes**, not on every interval tick. This means:

| Format      | Re-render frequency |
| ----------- | ------------------- |
| `HH:MM`     | Every minute        |
| `MM:SS`     | Every second        |
| `MM:SS.S`   | Every 100ms         |
| `MM:SS.SS`  | Every 10ms          |
| `MM:SS.SSS` | Every 1ms           |

This optimization is automatic — no configuration needed!

---

## TypeScript

This hook is written in TypeScript and exports comprehensive type definitions.

```tsx
import {
  useTimer,
  ms,
  type UseTimerOptions,
  type UseTimerReturn,
  type TimerStatus,
  type TimeFormat,
  type TimeFormatter,
} from "@usefy/use-timer";

// Full type inference
const timer: UseTimerReturn = useTimer(60000, {
  format: "MM:SS",
  onComplete: () => console.log("Done!"),
});

// Status is typed as union
const status: TimerStatus = timer.status; // "idle" | "running" | "paused" | "finished"
```

---

## Performance

- **Stable Function References** — All control functions are memoized with `useCallback`
- **Smart Re-renders** — Only re-renders when formatted time changes
- **Drift Compensation** — Uses `performance.now()` for accurate timing
- **Background Tab Handling** — Visibility API integration prevents timer drift when tab is inactive

```tsx
const { start, pause, toggle, reset } = useTimer(60000);

// These references remain stable across renders
useEffect(() => {
  // Safe to use as dependencies
}, [start, pause, toggle, reset]);
```

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-timer/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages)

### Test Files

- `useTimer.test.ts` — 67 tests for hook behavior
- `formatUtils.test.ts` — 24 tests for time formatting
- `timeUtils.test.ts` — 32 tests for time utilities

**Total: 123 tests**

---

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>
