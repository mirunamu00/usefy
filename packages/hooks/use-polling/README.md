<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-polling</h1>

<p align="center">
  <strong>Poll an async function on an interval — non-overlapping ticks, pause/resume, an enabled gate, and exponential backoff.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-polling"><img src="https://img.shields.io/npm/v/@usefy/use-polling.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-polling"><img src="https://img.shields.io/npm/dm/@usefy/use-polling.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-polling"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-polling?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-polling.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usepolling--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`usePolling` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. It polls an async function on an interval, exposing the latest result as `{ data, error, status, isLoading }` (the **same shape** as [`useAsyncFn`](https://www.npmjs.com/package/@usefy/use-async-fn) / [`useAsync`](https://www.npmjs.com/package/@usefy/use-async)) plus polling-loop control: `isPolling` and imperative `pause`/`resume` (with `start`/`stop` aliases).

The critical property: the next tick is scheduled **only after** the current poll settles — a self-rescheduling `setTimeout`, never a stacking `setInterval` — so a `fn` slower than the interval can never overlap requests.

## Features

- **No overlapping polls** — at most one poll in flight; the next is scheduled only after the current one settles (self-scheduling `setTimeout`)
- **pause / resume** (and `start` / `stop` aliases) — imperative control; `isPolling` reflects whether the loop is running
- **`enabled` gate** — declarative master switch; while `false` the hook never polls and `resume()` can't start it
- **`immediate`** — the first poll fires right away by default (`immediate: false` waits one interval)
- **Exponential backoff** — grow the delay after consecutive failures (`true`, `{ factor, maxInterval }`, or a custom `(failures, base) => ms`), reset on the next success
- **AbortController** — your `fn` receives an `AbortSignal` first; the in-flight poll is aborted on pause/stop/`enabled:false`/unmount, and a stale-guard discards a torn-down poll's late result
- **Same async state as the family** — `{ data, error, status, isLoading }` where `status` is the source of truth, `isLoading === status === "pending"`, and `data` is retained on error
- **SSR-safe & StrictMode-safe** — no timers/`AbortController` at module/render time; exactly one self-scheduling loop under StrictMode (no runaway duplicate timers)
- **Stable controls & latest refs** — controls are memoized; an inline `fn` and changing options are read through refs, so they never restart the loop or go stale
- **TypeScript-first** — full type inference; reuses the shared `AsyncStatus`/`AsyncState`/`AsyncFnWithSignal` types

## Installation

```bash
# npm
npm install @usefy/use-polling

# yarn
yarn add @usefy/use-polling

# pnpm
pnpm add @usefy/use-polling
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { usePolling } from "@usefy/use-polling";

function LiveStatus() {
  const { data, status, isPolling, pause, resume } = usePolling(
    async (signal: AbortSignal) => {
      const res = await fetch("/api/status", { signal });
      return (await res.json()) as { online: number };
    },
    { interval: 5000, immediate: true, backoff: { factor: 2, maxInterval: 30_000 } },
  );

  return (
    <div>
      <p>{data ? `${data.online} online` : "…"} ({status})</p>
      <button onClick={isPolling ? pause : resume}>
        {isPolling ? "Pause" : "Resume"}
      </button>
    </div>
  );
}
```

## API

```ts
const {
  data, error, status, isLoading,
  isPolling, pause, resume, start, stop,
} = usePolling<T, Args, E>(fn, options?);
```

### Parameters

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `fn` | `(signal: AbortSignal, ...args: Args) => Promise<T>` | The async function to poll. Receives an `AbortSignal` **first**, then `options.args`. Wire the signal into `fetch(url, { signal })`. Read through a ref — an inline function is fine and never goes stale. |
| `options` | `UsePollingOptions<T, Args, E>` | Optional. See below. |

### Options — `UsePollingOptions<T, Args, E>`

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `interval` | `number` | `1000` | Base delay (ms) between one poll settling and the next starting. Applies from the **next** tick — never restarts the loop. |
| `immediate` | `boolean` | `true` | Poll immediately when the loop starts/resumes, vs. waiting one `interval`. |
| `enabled` | `boolean` | `true` | Declarative master gate. `false` → never polls; flipping to `true` (re)starts the loop. While `false`, `resume()` cannot start polling. |
| `backoff` | `boolean \| { factor?, maxInterval? } \| (failures, base) => number` | `false` | Grow the delay on **consecutive** failures, reset on success. `true` → exponential `factor: 2`; object → tuned exponential (`factor` default `2`, `maxInterval` default `Infinity`); function → full control. |
| `args` | `Args` | `[]` | Arguments forwarded to `fn` (after the signal) each poll. Read fresh per tick. |
| `initialData` | `T` | — | Seed for `data` before the first success. Status still starts `"idle"`. |
| `onSuccess` | `(data: T) => void` | — | Called after a successful poll (non-superseded, while polling). Fired from the event turn, never inside a state updater. |
| `onError` | `(error: E) => void` | — | Called after a failed poll. The abort of a paused/stopped/unmounted poll is never reported here. |

### Return — `UsePollingReturn<T, E>`

| Field | Type | Description |
| ----- | ---- | ----------- |
| `data` | `T \| undefined` | The most recent successfully-resolved value. Retained across later `pending`/`error` transitions. |
| `error` | `E \| undefined` | The error from the most recent failed poll. Cleared when a poll starts and on success. |
| `status` | `"idle" \| "pending" \| "success" \| "error"` | The lifecycle status of the latest poll — the source of truth. |
| `isLoading` | `boolean` | Convenience mirror of `status === "pending"`. |
| `isPolling` | `boolean` | Whether the loop is active — i.e. `enabled && !paused`. |
| `pause` / `stop` | `() => void` | Halt the loop: no new polls, clear the pending timeout, abort the in-flight poll. Stable. (`stop` is an alias of `pause`.) |
| `resume` / `start` | `() => void` | Restart the loop (respecting `immediate`). No effect while `enabled` is `false`. Stable. (`start` is an alias of `resume`.) |

### Behavioural guarantees (by design)

- **No overlapping polls:** the next tick is scheduled with `setTimeout` **after** the current poll settles, so a slow `fn` never stacks in-flight requests (unlike a naive `setInterval`).
- **Controls vs. gate precedence:** `enabled` is the declarative master switch; `pause`/`resume` are the imperative override *within* an enabled session. `isPolling === enabled && !paused`. While `enabled` is `false`, `resume()` is inert.
- **Pausing a pending poll:** `pause`/`stop`/`enabled:false`/unmount abort the in-flight poll via its `AbortSignal` and discard its result. If a poll was in flight, `status` settles back to its last resolved value (`success` if there was data, else `idle`) and `isLoading` clears — it never sticks on `pending`.
- **Backoff:** the delay grows only on **consecutive** failures (`baseInterval * factor ** failureCount`, clamped to `maxInterval`) and resets to `interval` the moment a poll succeeds.
- **What restarts the loop:** only `enabled` and `pause`/`resume` state. A changed `interval`, `args`, `backoff`, callbacks, or inline `fn` are read through refs and apply on the next tick **without** tearing the loop down.
- **StrictMode:** the double-invoked mount effect tears its first loop down (clearing the timeout, aborting in-flight) before starting the second, so exactly one self-scheduling loop is ever live.

### Exported types

`UsePollingOptions<T, Args, E>`, `UsePollingReturn<T, E>`, `PollingBackoff`, `BackoffOptions`, `BackoffFn`, plus the pure helper `computePollingDelay(failureCount, baseInterval, backoff?)`, the `DEFAULT_POLLING_INTERVAL` constant, and the shared `AsyncStatus`, `AsyncState<T, E>`, `AsyncFn<T, Args>`, `AsyncFnWithSignal<T, Args>` re-exported from the async siblings.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-polling/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **39 tests**, 97% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
