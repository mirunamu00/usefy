<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-interval</h1>

<p align="center">
  <strong>A lightweight, type-safe React hook for declarative setInterval with automatic cleanup and start/stop controls</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-interval">
    <img src="https://img.shields.io/npm/v/@usefy/use-interval.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-interval">
    <img src="https://img.shields.io/npm/dm/@usefy/use-interval.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-interval">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-interval?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-interval.svg?style=flat-square&color=007acc" alt="license" />
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
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-useinterval--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/use-interval` is a React hook that wraps `setInterval` for declarative, safe, repeated execution. It cleans up automatically on unmount, keeps the latest callback without restarting the timer, disables via a `null` delay, and exposes `start`/`stop`/`toggle` controls plus an `isRunning` flag.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-interval?

- **Zero Dependencies** — Pure React implementation with no external dependencies
- **TypeScript First** — Full type safety with exported interfaces
- **Memory Safe** — Automatic cleanup on unmount prevents memory leaks
- **Stale Closure Free** — Always executes the latest callback without restarting the interval
- **Conditional Execution** — Pass `null`/`undefined` to disable the timer
- **Full Control** — `start`, `stop`, `toggle`, and an `isRunning` flag
- **Immediate Option** — Optionally run once immediately, then at each interval
- **StrictMode Safe** — Symmetric setup/teardown; no leaked or duplicated timers
- **SSR Compatible** — Works seamlessly with Next.js, Remix, and other SSR frameworks

---

## Installation

```bash
# npm
npm install @usefy/use-interval

# yarn
yarn add @usefy/use-interval

# pnpm
pnpm add @usefy/use-interval
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
import { useState } from "react";
import { useInterval } from "@usefy/use-interval";

function Clock() {
  const [time, setTime] = useState(() => new Date());

  useInterval(() => {
    setTime(new Date());
  }, 1000);

  return <div>{time.toLocaleTimeString()}</div>;
}
```

---

## API Reference

### `useInterval(callback, delay, options?)`

Runs `callback` every `delay` milliseconds until unmount or stopped.

#### Parameters

| Parameter  | Type                          | Description                                                     |
| ---------- | ----------------------------- | --------------------------------------------------------------- |
| `callback` | `() => void`                  | Function to run on each tick (always the latest reference)      |
| `delay`    | `number \| null \| undefined` | Interval in ms, or `null`/`undefined` to disable                |
| `options`  | `UseIntervalOptions`          | `{ immediate?: boolean; autoStart?: boolean }`                  |

#### Options

| Option      | Type      | Default | Description                                                         |
| ----------- | --------- | ------- | ------------------------------------------------------------------- |
| `immediate` | `boolean` | `false` | Run the callback immediately on (re)start, then at each interval    |
| `autoStart` | `boolean` | `true`  | Start automatically on mount; when `false`, call `start()`          |

#### Returns `UseIntervalReturn`

| Property    | Type         | Description                                                    |
| ----------- | ------------ | ------------------------------------------------------------- |
| `start`     | `() => void` | Start the interval (idempotent while already running)         |
| `stop`      | `() => void` | Stop the interval (idempotent while already stopped)          |
| `toggle`    | `() => void` | Toggle between running and stopped                            |
| `isRunning` | `boolean`    | Whether the interval is ticking (started **and** valid delay) |

---

## Examples

### Polling

```tsx
import { useState } from "react";
import { useInterval } from "@usefy/use-interval";

function Dashboard() {
  const [data, setData] = useState<Data | null>(null);

  useInterval(() => {
    fetchData().then(setData);
  }, 5000);

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```

### Countdown (disable via `null`)

```tsx
import { useState } from "react";
import { useInterval } from "@usefy/use-interval";

function Countdown() {
  const [count, setCount] = useState(10);

  // Passing null once count hits 0 stops the interval.
  useInterval(() => setCount((c) => c - 1), count > 0 ? 1000 : null);

  return <div>Countdown: {count}</div>;
}
```

### Pause / Resume

```tsx
import { useInterval } from "@usefy/use-interval";

function Ticker() {
  const { toggle, isRunning } = useInterval(() => {
    console.log("tick");
  }, 1000);

  return (
    <button onClick={toggle}>{isRunning ? "Pause" : "Resume"}</button>
  );
}
```

### Manual Control (`autoStart: false`)

```tsx
import { useInterval } from "@usefy/use-interval";

function AutoRefresh() {
  const { start, stop, isRunning } = useInterval(() => refresh(), 3000, {
    autoStart: false,
  });

  return (
    <div>
      <button onClick={start} disabled={isRunning}>
        Start
      </button>
      <button onClick={stop} disabled={!isRunning}>
        Stop
      </button>
    </div>
  );
}
```

### Immediate Execution

```tsx
import { useInterval } from "@usefy/use-interval";

function Logger() {
  // Runs once immediately, then every 2 seconds.
  useInterval(() => log(`ping @ ${Date.now()}`), 2000, { immediate: true });
  return null;
}
```

---

## TypeScript

```tsx
import {
  useInterval,
  type UseIntervalReturn,
  type UseIntervalOptions,
  type IntervalDelay,
  type UseIntervalCallback,
} from "@usefy/use-interval";

const { start, stop, toggle, isRunning }: UseIntervalReturn = useInterval(
  () => {},
  1000
);
```

---

## Edge Cases

| Scenario                     | Behavior                                                   |
| ---------------------------- | ---------------------------------------------------------- |
| `delay < 0`                  | Clamped to `0` (browser clamps a 0ms interval to ~4ms)     |
| `delay === 0`                | Runs as fast as the environment allows                     |
| `delay === null`/`undefined` | Interval disabled, `isRunning` is `false`                  |
| Unmount                      | Interval cleared automatically                             |
| Callback changes             | Interval keeps running; the latest callback is used        |
| `start()` while running      | No effect (idempotent) — no duplicate intervals            |

---

## Performance

`start`, `stop`, and `toggle` are memoized with `useCallback` for stable
references, and the callback is read through a ref so changing it never
re-subscribes the interval.

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-interval/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages)

---

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>
