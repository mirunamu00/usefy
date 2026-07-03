<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-window-size</h1>

<p align="center">
  <strong>A React hook for tracking the browser window size with debounce/throttle and SSR support</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-window-size">
    <img src="https://img.shields.io/npm/v/@usefy/use-window-size.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-window-size">
    <img src="https://img.shields.io/npm/dm/@usefy/use-window-size.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-window-size">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-window-size?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-window-size.svg?style=flat-square&color=007acc" alt="license" />
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
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usewindowsize--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/use-window-size` is a React hook for tracking the browser window's dimensions in real time. It updates on every resize, supports debounce and throttle to limit update frequency, is safe to render on the server, and skips re-renders when the size hasn't actually changed.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-window-size?

- **Zero Dependencies** — Pure React implementation with no external dependencies
- **TypeScript First** — Full type safety with comprehensive type definitions
- **Debounce / Throttle** — Limit how often updates fire during rapid resizes
- **SSR Compatible** — Configurable initial size avoids hydration mismatches
- **No Wasted Renders** — Bails out when width/height are unchanged
- **Scrollbar Control** — Include or exclude the scrollbar in the measurement
- **onChange Callback** — React to size changes imperatively
- **Well Tested** — 100% test coverage with Vitest

---

## Installation

```bash
# npm
npm install @usefy/use-window-size

# yarn
yarn add @usefy/use-window-size

# pnpm
pnpm add @usefy/use-window-size
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
import { useWindowSize } from "@usefy/use-window-size";

function MyComponent() {
  const { width, height } = useWindowSize();

  return (
    <div>
      {width} × {height}
      {width < 768 ? <MobileView /> : <DesktopView />}
    </div>
  );
}
```

---

## API Reference

### `useWindowSize(options?)`

A hook that tracks the browser window size and returns `{ width, height }`.

#### Parameters

| Parameter | Type                   | Description                   |
| --------- | ---------------------- | ----------------------------- |
| `options` | `UseWindowSizeOptions` | Optional configuration object |

#### Options

| Option             | Type                            | Default | Description                                                                                              |
| ------------------ | ------------------------------- | ------- | -------------------------------------------------------------------------------------------------------- |
| `initialWidth`     | `number`                        | `0`     | Width returned before the window can be measured (SSR / first server render)                             |
| `initialHeight`    | `number`                        | `0`     | Height returned before the window can be measured (SSR / first server render)                            |
| `debounceMs`       | `number`                        | `0`     | Debounce resize updates by this many ms. Takes precedence over `throttleMs`                              |
| `throttleMs`       | `number`                        | `0`     | Throttle resize updates to at most once per this many ms. Ignored when `debounceMs` is set               |
| `includeScrollbar` | `boolean`                       | `true`  | `true` uses `innerWidth`/`innerHeight` (includes scrollbar); `false` uses `documentElement` client sizes |
| `enabled`          | `boolean`                       | `true`  | When `false`, no resize listener is attached and the last known size is kept                             |
| `onChange`         | `(size: WindowSize) => void`    | —       | Callback fired whenever the window size changes                                                          |

#### Returns `WindowSize`

| Property | Type     | Description                       |
| -------- | -------- | --------------------------------- |
| `width`  | `number` | Current window width in pixels    |
| `height` | `number` | Current window height in pixels   |

#### Exported Helpers

| Helper                              | Description                                                              |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `isWindowAvailable()`               | Returns `true` in a browser environment, `false` in SSR                 |
| `getWindowSize(includeScrollbar?)`  | Reads the current window size (returns `{ width: 0, height: 0 }` in SSR) |
| `areSizesEqual(a, b)`               | Compares two `WindowSize` values for equality                           |

---

## Examples

### Responsive Breakpoints

```tsx
import { useWindowSize } from "@usefy/use-window-size";

function Layout() {
  const { width } = useWindowSize();

  if (width < 640) return <MobileView />;
  if (width < 1024) return <TabletView />;
  return <DesktopView />;
}
```

### Debounced Updates

```tsx
import { useWindowSize } from "@usefy/use-window-size";

function Chart() {
  // Only recompute the layout 200ms after the user stops resizing
  const { width, height } = useWindowSize({ debounceMs: 200 });

  return <Canvas width={width} height={height} />;
}
```

### Throttled Updates with a Callback

```tsx
import { useWindowSize } from "@usefy/use-window-size";

function Sidebar() {
  const { width } = useWindowSize({
    throttleMs: 100,
    onChange: ({ width }) => {
      if (width < 768) closeSidebar();
    },
  });

  return <aside style={{ display: width < 768 ? "none" : "block" }} />;
}
```

### SSR-Safe Initial Size

```tsx
import { useWindowSize } from "@usefy/use-window-size";

function App() {
  // Provide sensible defaults so server and first client render agree
  const { width, height } = useWindowSize({
    initialWidth: 1024,
    initialHeight: 768,
  });

  return <div>{width} × {height}</div>;
}
```

### Excluding the Scrollbar

```tsx
import { useWindowSize } from "@usefy/use-window-size";

function Measurer() {
  // Uses document.documentElement.clientWidth/clientHeight
  const { width, height } = useWindowSize({ includeScrollbar: false });

  return <div>Content area: {width} × {height}</div>;
}
```

### Freezing the Readout

```tsx
import { useState } from "react";
import { useWindowSize } from "@usefy/use-window-size";

function ToggleTracking() {
  const [enabled, setEnabled] = useState(true);
  const { width, height } = useWindowSize({ enabled });

  return (
    <div>
      <button onClick={() => setEnabled((e) => !e)}>
        {enabled ? "Tracking" : "Frozen"}
      </button>
      {width} × {height}
    </div>
  );
}
```

---

## TypeScript

This hook is written in TypeScript and exports comprehensive type definitions.

```tsx
import {
  useWindowSize,
  type WindowSize,
  type UseWindowSizeOptions,
  type UseWindowSizeReturn,
  type OnWindowSizeChange,
} from "@usefy/use-window-size";

const size: WindowSize = useWindowSize({
  debounceMs: 200,
  onChange: ({ width, height }) => {
    console.log("Resized to", width, height);
  },
});
```

---

## Performance

- **No-op Skipping** — State is only updated when width or height actually change
- **Stable Listener** — The `resize` handler reads the latest callback from a ref, so changing `onChange` never re-registers the listener
- **Debounce / Throttle** — Rein in expensive re-renders during rapid resizes
- **Listener Cleanup** — Automatically removes the listener and clears pending timers on unmount
- **SSR Compatible** — Gracefully returns the configured initial size on the server

---

## Browser Support

This hook uses `window.innerWidth`/`innerHeight`, `document.documentElement`, and the `resize` event — supported in all modern browsers:

- Chrome 1+
- Firefox 1+
- Safari 1+
- Edge 12+
- Opera 7+

For SSR environments, the hook returns the configured initial size until it mounts on the client.

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-window-size/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages)

### Test Files

- `useWindowSize.test.ts` — 25 tests for hook behavior and utilities

**Total: 25 tests**

---

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>
