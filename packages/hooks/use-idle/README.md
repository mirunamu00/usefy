<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-idle</h1>

<p align="center">
  <strong>Report user inactivity after a timeout, with throttled activity listeners.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-idle"><img src="https://img.shields.io/npm/v/@usefy/use-idle.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-idle"><img src="https://img.shields.io/npm/dm/@usefy/use-idle.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-idle"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-idle?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-idle.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-useidle--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useIdle` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. It tells you whether the user has gone **inactive**: it returns `false` while the user is active and flips to `true` once no listened activity (mouse, keyboard, touch, wheel, resize, tab focus) has occurred for a given timeout. The next activity flips it back to `false`. Use it for auto-away presence, idle timeouts / session expiry, pausing expensive work, or "are you still there?" prompts.

## Features

- **Boolean-first** — `const idle = useIdle(60_000)` returns a plain `boolean`, matching the natural call site
- **Throttled activity** — high-frequency events (`mousemove`, `wheel`, `resize`) reset the idle timer at most once every ~200ms (leading-edge), so React state never thrashes
- **Visibility-aware** — returning to a backgrounded tab counts as activity; backgrounding the tab does **not** reset the timer, so the user is allowed to fall idle (the `react-use`/`@mantine/hooks` convention)
- **Configurable** — customize the activity `events`, the `initialState`, and the target `element`
- **SSR-safe** — no listeners are attached on the server; the hook returns `initialState` inertly, avoiding hydration mismatches
- **Concurrent- & StrictMode-safe** — state is only set from event handlers and timers (never during render); every listener + timer is cleaned up on unmount or when the inputs change, so there are no leaks or double timers
- **TypeScript-first** — full type inference and exported types (`UseIdleOptions`, `IdleEventTarget`, `UseIdleReturn`)
- **Tiny & tree-shakeable** — zero dependencies, published as its own package

## Installation

```bash
# npm
npm install @usefy/use-idle

# yarn
yarn add @usefy/use-idle

# pnpm
pnpm add @usefy/use-idle
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useIdle } from "@usefy/use-idle";

function AwayBadge() {
  const idle = useIdle(60_000); // one minute
  return <span>{idle ? "💤 Away" : "🟢 Active"}</span>;
}
```

Log the user out after 5 minutes of inactivity:

```tsx
import { useIdle } from "@usefy/use-idle";
import { useEffect } from "react";

function SessionGuard() {
  const idle = useIdle(5 * 60_000);
  useEffect(() => {
    if (idle) logout();
  }, [idle]);
  return null;
}
```

Only listen to keyboard activity, and start in the idle state:

```tsx
import { useIdle } from "@usefy/use-idle";

const idle = useIdle(30_000, {
  events: ["keydown"],
  initialState: true,
});
```

## API

### `useIdle(timeout?, options?): boolean`

Returns `true` once the user has been inactive for `timeout` milliseconds, and `false` while active. Any listened activity marks the user active and restarts the timer.

| Parameter | Type            | Description                                                                          |
| --------- | --------------- | ----------------------------------------------------------------------------------- |
| `timeout` | `number`        | Inactivity threshold in milliseconds before the user is considered idle. Default `60_000` (one minute). |
| `options` | `UseIdleOptions`| Optional configuration (see below).                                                 |

#### `UseIdleOptions`

| Option         | Type                                  | Default                                                                                      | Description                                                                                                              |
| -------------- | ------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `events`       | `string[]`                            | `["mousemove", "mousedown", "resize", "keydown", "touchstart", "wheel", "visibilitychange"]` | Activity events that reset the idle timer. `"visibilitychange"` is always bound to `document` and handled specially.    |
| `initialState` | `boolean`                             | `false`                                                                                      | The initial idle state (also the SSR/inert value). Set `true` to start idle until the first activity.                  |
| `element`      | `HTMLElement \| Document \| Window`   | `window`                                                                                     | The target the generic activity events attach to. `"visibilitychange"` is always attached to `document`, independent of this. |

**Returns:** `boolean` — `true` when idle, `false` when active. On the server (no `window`) it returns `initialState`.

### Behavior notes

- **Throttling** — activity is throttled with a leading-edge guard: the idle timer is reset at most once per ~200ms (the window is clamped to the `timeout` if you pick a smaller one). Because that window is at most the timeout, the timer never elapses during continuous activity, but rapid `mousemove`/`wheel`/`resize` bursts do not re-run state work on every event.
- **Visibility** — `visibilitychange` is routed through a dedicated handler on `document`. Returning to a visible tab (`document.hidden === false`) counts as activity and resets the timer; backgrounding the tab is **not** treated as activity, so the timer keeps running and the user falls idle naturally. Remove `"visibilitychange"` from `events` to opt out.
- **Changing `timeout`** — passing a new `timeout` (or `events`/`element`) tears down and restarts the listeners and timer.

#### Exported helpers

```ts
import {
  useIdle,
  DEFAULT_IDLE_EVENTS,   // the default activity event list
  ACTIVITY_THROTTLE_MS,  // 200 — the leading-edge throttle window
  type UseIdleOptions,
  type IdleEventTarget,  // HTMLElement | Document | Window
  type UseIdleReturn,    // boolean
} from "@usefy/use-idle";
```

## Browser Support

Works in every modern browser (Chrome, Edge, Firefox, Safari, and their mobile counterparts). In an environment without a `window` (SSR, tests without a DOM) no listeners are attached and the hook returns its inert `initialState` value without throwing.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/hooks/use-idle/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **29 tests**, 98% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
