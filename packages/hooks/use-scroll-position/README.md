<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-scroll-position</h1>

<p align="center">
  <strong>Track the throttled scroll offset (x, y) of the window or a given element</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-scroll-position"><img src="https://img.shields.io/npm/v/@usefy/use-scroll-position.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-scroll-position"><img src="https://img.shields.io/npm/dm/@usefy/use-scroll-position.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-scroll-position"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-scroll-position?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-scroll-position.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#examples">Examples</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usescrollposition--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useScrollPosition` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. It reports the current scroll offset `{ x, y }` of the window (default) or a specific element, re-rendering as you scroll and throttling the work so it stays cheap.

The scroll listener is attached with `{ passive: true }` and the handler is throttled with **leading + trailing** edges, so the first move updates immediately and the final resting position is never dropped.

## Features

- **Window or element** — omit `element` to track the page scroll, or pass a raw `HTMLElement` or a `RefObject<HTMLElement>`
- **Throttled** — `throttleMs` (default `100`) with leading + trailing edges; set `0` to update on every scroll event
- **Synchronous initial read** — the real offset is read on mount (via `useIsomorphicLayoutEffect`), so the first commit is never a stale `0, 0`
- **Passive listener** — registered with `{ passive: true }` for smooth scrolling
- **Stable reference** — a scroll that doesn't change the offset keeps the same returned object (no needless re-render)
- **SSR-safe** — no `window`/`document` access on the server; returns `{ x: 0, y: 0 }`
- **StrictMode / concurrent-safe** — listener and pending timers are cleaned up on unmount and when the target changes; no leaks
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — published as its own package

## Installation

```bash
# npm
npm install @usefy/use-scroll-position

# yarn
yarn add @usefy/use-scroll-position

# pnpm
pnpm add @usefy/use-scroll-position
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useScrollPosition } from "@usefy/use-scroll-position";

function ScrollIndicator() {
  const { x, y } = useScrollPosition();

  return <div>Scrolled to {x}, {y}</div>;
}
```

## API

### `useScrollPosition(options?)`

Returns the current scroll offset of the tracked target, re-rendering (throttled) as it scrolls.

#### Options — `UseScrollPositionOptions`

| Option       | Type                                                      | Default  | Description                                                                                     |
| ------------ | -------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `element`    | `HTMLElement \| RefObject<HTMLElement> \| null`          | `window` | The element (or a ref to it) whose scroll to track. Omit / `null` tracks the window/document    |
| `throttleMs` | `number`                                                 | `100`    | Throttle interval in ms (leading + trailing). `0` updates on every scroll event (no throttle)   |

#### Returns — `UseScrollPositionReturn` (`ScrollPosition`)

| Property | Type     | Description                                                                    |
| -------- | -------- | ------------------------------------------------------------------------------ |
| `x`      | `number` | Horizontal offset — `window.scrollX` or the element's `scrollLeft`             |
| `y`      | `number` | Vertical offset — `window.scrollY` or the element's `scrollTop`               |

Also exported: the `ZERO_SCROLL_POSITION` sentinel and the `ScrollPosition`, `ScrollPositionTarget`, `UseScrollPositionOptions`, and `UseScrollPositionReturn` types.

## Examples

### Track a scrollable element via a ref

```tsx
import { useRef } from "react";
import { useScrollPosition } from "@usefy/use-scroll-position";

function Pane() {
  const ref = useRef<HTMLDivElement>(null);
  const { y } = useScrollPosition({ element: ref, throttleMs: 0 });

  return (
    <div ref={ref} style={{ overflow: "auto", height: 200 }}>
      <p>scrollTop: {y}</p>
      <div style={{ height: 2000 }} />
    </div>
  );
}
```

### A page scroll progress bar

```tsx
import { useScrollPosition } from "@usefy/use-scroll-position";

function ReadingProgress() {
  const { y } = useScrollPosition({ throttleMs: 50 });
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? (y / max) * 100 : 0;

  return <div style={{ width: `${progress}%`, height: 4, background: "indigo" }} />;
}
```

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/hooks/use-scroll-position/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **27 tests**, 100% statement coverage.

- `useScrollPosition.test.ts` — hook behavior (window & element targets, ref targets, synchronous initial read, leading/trailing throttle, `throttleMs: 0`, reference stability, dynamic throttle without re-subscribe, listener cleanup on unmount / target change) plus the pure `utils` helpers (target resolution, offset reading, SSR guard, equality)

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
