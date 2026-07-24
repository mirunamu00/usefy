<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-measure</h1>

<p align="center">
  <strong>Reactively measure an element's bounds — size and viewport position — via ResizeObserver</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-measure"><img src="https://img.shields.io/npm/v/@usefy/use-measure.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-measure"><img src="https://img.shields.io/npm/dm/@usefy/use-measure.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-measure"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-measure?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-measure.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#usemeasure-vs-useresizeobserver">vs useResizeObserver</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usemeasure--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useMeasure` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. It gives you an element's live **bounds** — its size _and_ its viewport-relative position (`x, y, width, height, top, right, bottom, left`) — and keeps them in sync as the element resizes.

It is the ergonomic **"just give me the bounds"** convenience layer over [`@usefy/use-resize-observer`](https://www.npmjs.com/package/@usefy/use-resize-observer): it reuses that hook internally as the low-level observer and returns the full rect from `getBoundingClientRect()`, so you don't have to wire up `ResizeObserver` yourself.

## Features

- **Full bounds object** — position (`x, y, top, right, bottom, left`) and size (`width, height`) from `getBoundingClientRect()`
- **Reactive** — updates automatically whenever the element resizes, powered by `ResizeObserver`
- **Simple callback ref** — `const [ref, bounds] = useMeasure()`, no manual observer wiring
- **SSR-safe** — returns all-zero bounds on the server, measures on attach in the browser
- **StrictMode / concurrent-safe** — equality-guarded state updates and a stable callback ref
- **TypeScript-first** — generic over the element type, with exported `Bounds` types
- **Tiny & tree-shakeable** — published as its own package

## Installation

```bash
# npm
npm install @usefy/use-measure

# yarn
yarn add @usefy/use-measure

# pnpm
pnpm add @usefy/use-measure
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useMeasure } from "@usefy/use-measure";

function Card() {
  const [ref, bounds] = useMeasure<HTMLDivElement>();

  return (
    <div ref={ref} style={{ resize: "both", overflow: "auto" }}>
      {Math.round(bounds.width)} × {Math.round(bounds.height)}
      <br />
      at ({Math.round(bounds.x)}, {Math.round(bounds.y)})
    </div>
  );
}
```

## API

### `useMeasure<T extends Element = Element>(): [ref, bounds]`

Returns a tuple:

| Index | Name     | Type                        | Description                                             |
| ----- | -------- | --------------------------- | ------------------------------------------------------- |
| `0`   | `ref`    | `(element: T \| null) => void` | Callback ref to attach to the element you want to measure |
| `1`   | `bounds` | `Bounds`                    | The element's current bounds (all-zero until measured)  |

#### `Bounds`

Mirrors the shape of a `DOMRect`. `width` / `height` are the rendered size; the rest are positions relative to the viewport (as reported by `getBoundingClientRect()`).

| Field    | Type     | Description                                     |
| -------- | -------- | ----------------------------------------------- |
| `x`      | `number` | Left edge, relative to the viewport             |
| `y`      | `number` | Top edge, relative to the viewport              |
| `width`  | `number` | Rendered width in pixels                        |
| `height` | `number` | Rendered height in pixels                       |
| `top`    | `number` | Distance from viewport top to the top edge      |
| `right`  | `number` | Distance from viewport left to the right edge   |
| `bottom` | `number` | Distance from viewport top to the bottom edge   |
| `left`   | `number` | Distance from viewport left to the left edge    |

Also exported: `EMPTY_BOUNDS` (the frozen all-zero bounds used as the initial / SSR value) and the `Bounds`, `UseMeasureRef`, and `UseMeasureReturn` types.

> **Note:** bounds come from `getBoundingClientRect()`, so they update on **resize** (via `ResizeObserver`), not on **scroll** — scrolling does not change an element's size. If you need scroll-driven position tracking, re-measure on scroll separately.

## useMeasure vs useResizeObserver

Both live in the `@usefy` ecosystem and both observe an element with `ResizeObserver`, but they sit at different levels:

| | [`useResizeObserver`](https://www.npmjs.com/package/@usefy/use-resize-observer) | `useMeasure` |
| --- | --- | --- |
| **Role** | Low-level observer primitive | High-level "give me the bounds" convenience layer |
| **Returns** | `width` / `height`, raw `entry`, box-model sizes, `observe`/`unobserve`/`disconnect` | A single `bounds` object with all 8 rect fields |
| **Options** | `box`, `debounce`, `throttle`, `onResize`, `round`, `enabled`, … | none — zero-config |
| **Reach for it when** | You need callbacks, box models, debounce/throttle, or manual control | You just want the current position + size |

`useMeasure` is implemented _on top of_ `useResizeObserver`, so there's no duplicated observer logic.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/hooks/use-measure/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **19 tests**, 100% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
