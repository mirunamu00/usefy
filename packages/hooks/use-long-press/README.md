<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-long-press</h1>

<p align="center">
  <strong>Long-press ("press and hold") gestures for mouse and touch — time threshold, movement cancellation, and lifecycle callbacks.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-long-press"><img src="https://img.shields.io/npm/v/@usefy/use-long-press.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-long-press"><img src="https://img.shields.io/npm/dm/@usefy/use-long-press.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-long-press"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-long-press?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-long-press.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-uselongpress--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useLongPress` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. It recognises a **long-press** gesture — a pointer held down on an element for at least a time threshold — and returns a `bind` object of DOM handler props you spread onto the target: `<button {...bind}>`.

## Features

- **`bind` object** — spread the memoized handlers onto any element; they're referentially stable so spreading never churns the element's listeners.
- **Time threshold** — the `callback` fires only after the press is held for `threshold` ms (default `400`).
- **Movement cancellation** — dragging farther than `moveThreshold` px (default `10`) from the down point cancels the press; pass `moveThreshold: false` to disable.
- **Mouse + touch** — one gesture for both inputs; the synthetic mouse events browsers emit after a touch are detected and ignored, so a touch long-press never double-fires.
- **Lifecycle callbacks** — optional `onStart`, `onFinish`, and `onCancel` (with a `{ reason }` of `"released"` | `"moved"`), all kept in latest-refs so inline functions never destabilise the handlers.
- **Safe by default** — the pending timer is cleared on release, cancel, and unmount; SSR-safe (no `window`/`document` access) and StrictMode/concurrent-safe.
- **TypeScript-first** — full type inference and exported types.
- **Tiny & tree-shakeable** — published as its own package.

## Installation

```bash
# npm
npm install @usefy/use-long-press

# yarn
yarn add @usefy/use-long-press

# pnpm
pnpm add @usefy/use-long-press
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useLongPress } from "@usefy/use-long-press";

function DeleteButton() {
  const bind = useLongPress(() => deleteItem(), { threshold: 600 });

  return (
    <button {...bind} style={{ touchAction: "none", userSelect: "none" }}>
      Hold to delete
    </button>
  );
}
```

## API

```ts
const bind = useLongPress(callback, options?);
// <button {...bind}>Press and hold</button>
```

### Parameters

| Parameter  | Type                        | Description                                                                 |
| ---------- | --------------------------- | --------------------------------------------------------------------------- |
| `callback` | `(event) => void`           | Fires once when the press reaches `threshold`. Receives the originating pointer-down event. |
| `options`  | `UseLongPressOptions`       | Optional configuration (see below).                                         |

### Options

| Option          | Type                                       | Default | Description                                                                                          |
| --------------- | ------------------------------------------ | ------- | -------------------------------------------------------------------------------------------------- |
| `threshold`     | `number`                                   | `400`   | Milliseconds the press must be held before `callback` fires.                                        |
| `moveThreshold` | `number \| false`                          | `10`    | Pixels the pointer may drift from the down point before cancelling (reason `"moved"`). `false` disables movement cancellation. |
| `disabled`      | `boolean`                                  | `false` | When `true`, the handlers are no-ops (read at press-start).                                         |
| `onStart`       | `(event) => void`                          | —       | Fires when a valid press begins, before the timer starts.                                            |
| `onFinish`      | `(event) => void`                          | —       | Fires when a **completed** long press is then released.                                              |
| `onCancel`      | `(event, { reason }) => void`              | —       | Fires when a press ends early — `reason` is `"released"` or `"moved"`.                               |

### Returns

`bind` — a stable object of DOM handler props: `onMouseDown`, `onMouseUp`, `onMouseLeave`, `onMouseMove`, `onTouchStart`, `onTouchEnd`, `onTouchMove`. Spread it onto the target element to wire up the whole gesture.

### `preventDefault` caveat

React attaches `onTouchStart`/`onTouchMove` as **passive** listeners, so calling `event.preventDefault()` inside them will **not** stop scrolling or the long-press context menu (the browser ignores it). Prevent those with CSS on the target instead:

```css
.long-press-target {
  touch-action: none;      /* stop scroll/pan while pressing */
  user-select: none;       /* stop text selection */
  -webkit-touch-callout: none; /* stop the iOS callout menu */
}
```

This hook deliberately never calls `preventDefault`.

### Touch / mouse de-duplication

After a touch sequence, browsers emit synthetic `mousedown`/`mouseup`/`click` events. `useLongPress` timestamps the last touch event and ignores any `mousedown` that arrives within a short guard window, so a single touch long-press fires exactly once. Pure-mouse and pure-touch devices are unaffected.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-long-press/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **29 tests**, 100% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
