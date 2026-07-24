<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-resize-observer</h1>

<p align="center">
  <strong>A powerful React hook for observing element size changes using the Resize Observer API</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-resize-observer">
    <img src="https://img.shields.io/npm/v/@usefy/use-resize-observer.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-resize-observer">
    <img src="https://img.shields.io/npm/dm/@usefy/use-resize-observer.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-resize-observer">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-resize-observer?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-resize-observer.svg?style=flat-square&color=007acc" alt="license" />
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
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-useresizeobserver--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/use-resize-observer` is a feature-rich React hook for efficiently detecting element size changes using the Resize Observer API. It provides a simple API for responsive layouts, dynamic UI adjustments, canvas rendering, and more.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-resize-observer?

- **Zero Dependencies** — Pure React implementation with no external dependencies
- **TypeScript First** — Full type safety with comprehensive type definitions
- **Efficient Detection** — Leverages native Resize Observer API for optimal performance
- **Box Model Support** — Observe content-box, border-box, or device-pixel-content-box
- **Debounce & Throttle** — Built-in rate limiting for high-frequency resize events
- **Custom Rounding** — Configure how size values are rounded (Math.round, Math.floor, Math.ceil)
- **Callback Mode** — Skip state updates and handle resizes directly in callbacks
- **Manual Control** — Programmatically observe/unobserve/disconnect
- **SSR Compatible** — Works seamlessly with Next.js, Remix, and other SSR frameworks
- **Initial Dimensions** — Support for SSR with initial width/height values
- **Dynamic Enable/Disable** — Conditional observation support
- **Optimized Re-renders** — Only updates when meaningful values change
- **Well Tested** — Comprehensive test coverage with Vitest

---

## Installation

```bash
# npm
npm install @usefy/use-resize-observer

# yarn
yarn add @usefy/use-resize-observer

# pnpm
pnpm add @usefy/use-resize-observer
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
import { useResizeObserver } from "@usefy/use-resize-observer";

function MyComponent() {
  const { ref, width, height } = useResizeObserver();

  return (
    <div ref={ref}>
      Size: {width} x {height}
    </div>
  );
}
```

---

## API Reference

### `useResizeObserver(options?)`

A hook that observes element size changes using the Resize Observer API.

#### Parameters

| Parameter | Type                        | Description                   |
| --------- | --------------------------- | ----------------------------- |
| `options` | `UseResizeObserverOptions`  | Optional configuration object |

#### Options

| Option           | Type                                 | Default         | Description                                                                                    |
| ---------------- | ------------------------------------ | --------------- | ---------------------------------------------------------------------------------------------- |
| `box`            | `ResizeObserverBoxOptions`           | `"content-box"` | Box model to observe: `"content-box"`, `"border-box"`, or `"device-pixel-content-box"`         |
| `debounce`       | `number`                             | `0`             | Debounce delay in milliseconds. Waits until resizing stops before updating                     |
| `throttle`       | `number`                             | `0`             | Throttle interval in milliseconds. Updates at most once per interval                           |
| `round`          | `(value: number) => number`          | `Math.round`    | Function to round size values. Use `Math.floor`, `Math.ceil`, or custom function               |
| `enabled`        | `boolean`                            | `true`          | Enable/disable observer. When false, observer disconnects and stops all updates                |
| `updateState`    | `boolean`                            | `true`          | Whether to update React state. Set to `false` for callback-only mode                           |
| `initialWidth`   | `number`                             | —               | Initial width value for SSR or before first observation                                        |
| `initialHeight`  | `number`                             | —               | Initial height value for SSR or before first observation                                       |
| `onResize`       | `OnResizeCallback`                   | —               | Callback fired on every resize with entry, width, and height                                   |
| `onError`        | `OnErrorCallback`                    | —               | Callback fired when ResizeObserver encounters an error                                         |

#### Returns `UseResizeObserverReturn`

| Property      | Type                              | Description                                                        |
| ------------- | --------------------------------- | ------------------------------------------------------------------ |
| `ref`         | `(node: Element \| null) => void` | Callback ref to attach to the target element you want to observe   |
| `width`       | `number \| undefined`             | Current width of the observed element                              |
| `height`      | `number \| undefined`             | Current height of the observed element                             |
| `entry`       | `ResizeEntry \| undefined`        | Full resize entry data (undefined if not yet observed)             |
| `isSupported` | `boolean`                         | Whether ResizeObserver API is supported in the current environment |
| `observe`     | `(target: Element) => void`       | Manually start observing a specific element                        |
| `unobserve`   | `(target: Element) => void`       | Stop observing a specific element                                  |
| `disconnect`  | `() => void`                      | Disconnect the observer completely                                 |

#### `ResizeEntry`

Extended resize entry with convenience properties:

| Property                    | Type                        | Description                                                |
| --------------------------- | --------------------------- | ---------------------------------------------------------- |
| `entry`                     | `ResizeObserverEntry`       | Original native ResizeObserverEntry from the browser API   |
| `target`                    | `Element`                   | The observed DOM element                                   |
| `contentRect`               | `DOMRectReadOnly`           | Content rectangle (same as contentRect from native entry)  |
| `borderBoxSize`             | `ResizeObserverSize[]`      | Border box dimensions array                                |
| `contentBoxSize`            | `ResizeObserverSize[]`      | Content box dimensions array                               |
| `devicePixelContentBoxSize` | `ResizeObserverSize[]`      | Device pixel content box dimensions (if supported)         |

#### `ResizeObserverBoxOptions`

```typescript
type ResizeObserverBoxOptions =
  | "content-box"              // Content area only (default)
  | "border-box"               // Content + padding + border
  | "device-pixel-content-box" // Physical pixels (for canvas)
```

---

## Examples

### Basic Usage

```tsx
import { useResizeObserver } from "@usefy/use-resize-observer";

function SizeDisplay() {
  const { ref, width, height } = useResizeObserver();

  return (
    <div ref={ref} style={{ resize: "both", overflow: "auto" }}>
      <p>Width: {width}px</p>
      <p>Height: {height}px</p>
    </div>
  );
}
```

### Box Model Options

```tsx
import { useResizeObserver } from "@usefy/use-resize-observer";

function BoxComparison() {
  const contentBox = useResizeObserver({ box: "content-box" });
  const borderBox = useResizeObserver({ box: "border-box" });

  return (
    <div style={{ padding: 20, border: "5px solid black" }}>
      <div ref={(el) => { contentBox.ref(el); borderBox.ref(el); }}>
        <p>Content Box: {contentBox.width} x {contentBox.height}</p>
        <p>Border Box: {borderBox.width} x {borderBox.height}</p>
      </div>
    </div>
  );
}
```

### Debounced Resize

```tsx
import { useResizeObserver } from "@usefy/use-resize-observer";

function DebouncedResize() {
  const { ref, width, height } = useResizeObserver({
    debounce: 200, // Wait 200ms after resizing stops
  });

  return (
    <div ref={ref}>
      <p>Debounced: {width} x {height}</p>
      <p>Updates 200ms after you stop resizing</p>
    </div>
  );
}
```

### Throttled Resize

```tsx
import { useResizeObserver } from "@usefy/use-resize-observer";

function ThrottledResize() {
  const { ref, width, height } = useResizeObserver({
    throttle: 100, // Update at most every 100ms
  });

  return (
    <div ref={ref}>
      <p>Throttled: {width} x {height}</p>
      <p>Updates at most every 100ms</p>
    </div>
  );
}
```

### Callback-Only Mode

```tsx
import { useState } from "react";
import { useResizeObserver } from "@usefy/use-resize-observer";

function CallbackMode() {
  const [resizeCount, setResizeCount] = useState(0);

  const { ref } = useResizeObserver({
    updateState: false, // Don't update React state
    onResize: (entry, width, height) => {
      console.log(`Resized to ${width} x ${height}`);
      setResizeCount((c) => c + 1);
    },
  });

  return (
    <div ref={ref}>
      <p>Resize count: {resizeCount}</p>
      <p>Handled via callback only</p>
    </div>
  );
}
```

### Responsive Layout

```tsx
import { useResizeObserver } from "@usefy/use-resize-observer";

function ResponsiveGrid() {
  const { ref, width } = useResizeObserver();

  const columns = width
    ? width >= 800 ? 4
    : width >= 600 ? 3
    : width >= 400 ? 2
    : 1
    : 1;

  return (
    <div ref={ref}>
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 16
      }}>
        {items.map(item => <Card key={item.id} {...item} />)}
      </div>
    </div>
  );
}
```

### Canvas with Device Pixel Ratio

```tsx
import { useRef, useEffect } from "react";
import { useResizeObserver } from "@usefy/use-resize-observer";

function HiDPICanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { ref, width, height } = useResizeObserver({
    box: "device-pixel-content-box", // Physical pixels
    round: Math.floor,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width || !height) return;

    // Set canvas internal resolution to device pixels
    canvas.width = width;
    canvas.height = height;

    // Draw crisp graphics
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "blue";
      ctx.fillRect(0, 0, width, height);
    }
  }, [width, height]);

  return (
    <div ref={ref} style={{ width: "100%", height: 300 }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
```

### Manual Control

```tsx
import { useRef } from "react";
import { useResizeObserver } from "@usefy/use-resize-observer";

function ManualObserver() {
  const boxRef = useRef<HTMLDivElement>(null);

  const { width, height, observe, unobserve, disconnect } = useResizeObserver();

  return (
    <div>
      <div ref={boxRef} style={{ width: 200, height: 150 }}>
        Size: {width ?? "?"} x {height ?? "?"}
      </div>

      <button onClick={() => boxRef.current && observe(boxRef.current)}>
        Start Observing
      </button>
      <button onClick={() => boxRef.current && unobserve(boxRef.current)}>
        Stop Observing
      </button>
      <button onClick={disconnect}>
        Disconnect
      </button>
    </div>
  );
}
```

### Multiple Elements

```tsx
import { useResizeObserver } from "@usefy/use-resize-observer";

function MultipleObservers() {
  const box1 = useResizeObserver();
  const box2 = useResizeObserver();
  const box3 = useResizeObserver();

  return (
    <div style={{ display: "flex", gap: 16 }}>
      <div ref={box1.ref} style={{ flex: 1, resize: "both", overflow: "auto" }}>
        Box 1: {box1.width} x {box1.height}
      </div>
      <div ref={box2.ref} style={{ flex: 1, resize: "both", overflow: "auto" }}>
        Box 2: {box2.width} x {box2.height}
      </div>
      <div ref={box3.ref} style={{ flex: 1, resize: "both", overflow: "auto" }}>
        Box 3: {box3.width} x {box3.height}
      </div>
    </div>
  );
}
```

### Custom Rounding

```tsx
import { useResizeObserver } from "@usefy/use-resize-observer";

function CustomRounding() {
  const rounded = useResizeObserver({ round: Math.round });
  const floored = useResizeObserver({ round: Math.floor });
  const ceiled = useResizeObserver({ round: Math.ceil });
  const noRound = useResizeObserver({ round: (v) => v }); // No rounding

  return (
    <div>
      <div ref={(el) => {
        rounded.ref(el);
        floored.ref(el);
        ceiled.ref(el);
        noRound.ref(el);
      }}>
        <p>Math.round: {rounded.width} x {rounded.height}</p>
        <p>Math.floor: {floored.width} x {floored.height}</p>
        <p>Math.ceil: {ceiled.width} x {ceiled.height}</p>
        <p>No rounding: {noRound.width} x {noRound.height}</p>
      </div>
    </div>
  );
}
```

### Enable/Disable Toggle

```tsx
import { useState } from "react";
import { useResizeObserver } from "@usefy/use-resize-observer";

function ToggleObserver() {
  const [enabled, setEnabled] = useState(true);

  const { ref, width, height } = useResizeObserver({
    enabled,
  });

  return (
    <div>
      <button onClick={() => setEnabled(!enabled)}>
        {enabled ? "Disable" : "Enable"} Observer
      </button>

      <div ref={ref} style={{ resize: "both", overflow: "auto" }}>
        <p>Status: {enabled ? "Observing" : "Paused"}</p>
        <p>Size: {width} x {height}</p>
      </div>
    </div>
  );
}
```

### SSR Support with Initial Dimensions

```tsx
import { useResizeObserver } from "@usefy/use-resize-observer";

function SSRComponent() {
  const { ref, width, height, isSupported } = useResizeObserver({
    initialWidth: 300,  // Used during SSR
    initialHeight: 200, // Used during SSR
  });

  return (
    <div ref={ref}>
      <p>Size: {width} x {height}</p>
      <p>API Supported: {isSupported ? "Yes" : "No"}</p>
    </div>
  );
}
```

---

## Performance Optimization

The Resize Observer API fires callbacks when element dimensions change. When a callback fires:

- The `entry` object is updated with new size values
- `width` and `height` state are updated → **re-render occurs**

The hook includes several optimizations:

### 1. Size Change Detection

Only updates state when actual dimensions have changed:

```tsx
// Inside the hook:
if (hasSizeChanged(prevWidth, prevHeight, newWidth, newHeight)) {
  setWidth(newWidth);
  setHeight(newHeight);
}
```

### 2. Debounce for Rapid Resizing

Use debounce when you only need the final size:

```tsx
const { ref, width, height } = useResizeObserver({
  debounce: 200, // Only update 200ms after resizing stops
});
```

### 3. Throttle for Continuous Updates

Use throttle when you need periodic updates during resizing:

```tsx
const { ref, width, height } = useResizeObserver({
  throttle: 100, // Update at most every 100ms
});
```

### 4. Callback-Only Mode

Skip React state updates entirely for maximum performance:

```tsx
const { ref } = useResizeObserver({
  updateState: false,
  onResize: (entry, width, height) => {
    // Handle resize directly without causing re-renders
    element.style.fontSize = `${width / 10}px`;
  },
});
```

---

## TypeScript

This hook is written in TypeScript and exports comprehensive type definitions.

```tsx
import {
  useResizeObserver,
  type UseResizeObserverOptions,
  type UseResizeObserverReturn,
  type ResizeEntry,
  type ResizeObserverBoxOptions,
  type OnResizeCallback,
  type OnErrorCallback,
} from "@usefy/use-resize-observer";

// Full type inference
const { ref, width, height, entry }: UseResizeObserverReturn =
  useResizeObserver({
    box: "border-box",
    debounce: 100,
    onResize: (entry, width, height) => {
      console.log(`Resized to ${width} x ${height}`);
    },
  });
```

---

## Performance

- **Stable Function References** — The `ref` callback and control methods are memoized
- **Smart Re-renders** — Only re-renders when width or height actually changes
- **Built-in Rate Limiting** — Debounce and throttle options for high-frequency events
- **Native API** — Leverages browser's Resize Observer API for optimal performance
- **SSR Compatible** — Gracefully degrades in server environments

```tsx
const { ref, observe, unobserve, disconnect } = useResizeObserver();

// All references remain stable across renders
useEffect(() => {
  // Safe to use as dependencies
}, [ref, observe, unobserve, disconnect]);
```

---

## Browser Support

This hook uses the [Resize Observer API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver), which is supported in:

- Chrome 64+
- Firefox 69+
- Safari 13.1+
- Edge 79+
- Opera 51+

For unsupported browsers, the hook gracefully degrades and returns `isSupported: false` with initial dimension values.

> **Note**: `device-pixel-content-box` support varies by browser. The hook automatically falls back to `content-box` with device pixel ratio when not supported.

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

📊 <a href="https://mirunamu00.github.io/usefy/coverage/hooks/use-resize-observer/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages)

### Test Files

- `useResizeObserver.test.ts` — 63 tests for hook behavior
- `utils.test.ts` — 44 tests for utility functions

**Total: 107 tests**

---

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>
