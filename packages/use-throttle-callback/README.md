<p align="center">
  <img src="https://raw.githubusercontent.com/geon0529/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-throttle-callback</h1>

<p align="center">
  <strong>A powerful React hook for throttled callbacks with cancel, flush, and pending methods</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-throttle-callback">
    <img src="https://img.shields.io/npm/v/@usefy/use-throttle-callback.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-throttle-callback">
    <img src="https://img.shields.io/npm/dm/@usefy/use-throttle-callback.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-throttle-callback">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-throttle-callback?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/geon0529/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-throttle-callback.svg?style=flat-square&color=007acc" alt="license" />
  </a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#examples">Examples</a> •
  <a href="#license">License</a>
</p>

---

## Overview

`@usefy/use-throttle-callback` provides a throttled version of your callback function that limits invocations to at most once per specified interval. Perfect for scroll handlers, resize events, mouse movement tracking, and any high-frequency event that needs rate-limiting with full control methods.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-throttle-callback?

- **Zero Dependencies** — Pure React implementation (uses @usefy/use-debounce-callback internally)
- **TypeScript First** — Full type safety with generics and exported interfaces
- **Full Control** — `cancel()`, `flush()`, and `pending()` methods
- **Flexible Options** — Leading edge and trailing edge support
- **Guaranteed Execution** — Regular invocations during continuous calls (unlike debounce)
- **SSR Compatible** — Works seamlessly with Next.js, Remix, and other SSR frameworks
- **Lightweight** — Minimal bundle footprint (~200B minified + gzipped)

### Throttle vs Debounce Callbacks

| Feature            | Throttle Callback          | Debounce Callback       |
| ------------------ | -------------------------- | ----------------------- |
| First invocation   | Immediate (leading: true)  | After delay             |
| During rapid calls | Regular intervals          | Waits for pause         |
| Best for           | Scroll, resize, mouse move | Search, form validation |

---

## Installation

```bash
# npm
npm install @usefy/use-throttle-callback

# yarn
yarn add @usefy/use-throttle-callback

# pnpm
pnpm add @usefy/use-throttle-callback
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

### Internal Dependencies

This package uses [@usefy/use-debounce-callback](https://www.npmjs.com/package/@usefy/use-debounce-callback) internally with `maxWait` set to achieve throttle behavior.

---

## Quick Start

```tsx
import { useThrottleCallback } from "@usefy/use-throttle-callback";

function ScrollTracker() {
  const handleScroll = useThrottleCallback(() => {
    console.log("Scroll position:", window.scrollY);
  }, 100);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      handleScroll.cancel();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  return <div>Scroll to see throttled logs</div>;
}
```

---

## API Reference

### `useThrottleCallback<T>(callback, delay?, options?)`

A hook that returns a throttled version of the provided callback function.

#### Parameters

| Parameter  | Type                                | Default | Description                           |
| ---------- | ----------------------------------- | ------- | ------------------------------------- |
| `callback` | `T extends (...args: any[]) => any` | —       | The callback function to throttle     |
| `delay`    | `number`                            | `500`   | The throttle interval in milliseconds |
| `options`  | `UseThrottleCallbackOptions`        | `{}`    | Additional configuration options      |

#### Options

| Option     | Type      | Default | Description                                  |
| ---------- | --------- | ------- | -------------------------------------------- |
| `leading`  | `boolean` | `true`  | Invoke on the leading edge (first call)      |
| `trailing` | `boolean` | `true`  | Invoke on the trailing edge (after interval) |

#### Returns `ThrottledFunction<T>`

| Property    | Type            | Description                                         |
| ----------- | --------------- | --------------------------------------------------- |
| `(...args)` | `ReturnType<T>` | The throttled function (same signature as original) |
| `cancel`    | `() => void`    | Cancels any pending invocation                      |
| `flush`     | `() => void`    | Immediately invokes any pending invocation          |
| `pending`   | `() => boolean` | Returns `true` if there's a pending invocation      |

---

## Examples

### Scroll Event Handler

```tsx
import { useThrottleCallback } from "@usefy/use-throttle-callback";

function InfiniteScroll() {
  const [items, setItems] = useState([]);

  const handleScroll = useThrottleCallback(() => {
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;

    if (scrollTop + windowHeight >= docHeight - 100) {
      loadMoreItems();
    }
  }, 200);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      handleScroll.cancel();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  return (
    <div>
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
```

### Mouse Movement Tracking

```tsx
import { useThrottleCallback } from "@usefy/use-throttle-callback";

function HeatmapTracker() {
  const recordPosition = useThrottleCallback((x: number, y: number) => {
    analytics.recordMousePosition({ x, y, timestamp: Date.now() });
  }, 50);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      recordPosition(e.clientX, e.clientY);
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      recordPosition.cancel();
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [recordPosition]);

  return <div>Tracking mouse movement...</div>;
}
```

### Window Resize Handler

```tsx
import { useThrottleCallback } from "@usefy/use-throttle-callback";

function ResponsiveChart() {
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  const handleResize = useThrottleCallback(() => {
    const container = document.getElementById("chart-container");
    if (container) {
      setDimensions({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    }
  }, 150);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      handleResize.cancel();
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  return (
    <div id="chart-container">
      <Chart width={dimensions.width} height={dimensions.height} />
    </div>
  );
}
```

### Drag Handler with Flush

```tsx
import { useThrottleCallback } from "@usefy/use-throttle-callback";

function Draggable() {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const updatePosition = useThrottleCallback((x: number, y: number) => {
    setPosition({ x, y });
    syncPositionToServer({ x, y });
  }, 100);

  const handleDrag = (e: DragEvent) => {
    updatePosition(e.clientX, e.clientY);
  };

  const handleDragEnd = () => {
    // Ensure final position is synced
    updatePosition.flush();
  };

  return (
    <div
      draggable
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      Drag me
    </div>
  );
}
```

### Real-time Input Sync

```tsx
import { useThrottleCallback } from "@usefy/use-throttle-callback";

function CollaborativeEditor() {
  const [content, setContent] = useState("");

  const syncToServer = useThrottleCallback((text: string) => {
    webSocket.send(JSON.stringify({ type: "update", content: text }));
  }, 200);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    syncToServer(newContent);
  };

  // Ensure sync on unmount
  useEffect(() => {
    return () => {
      syncToServer.flush();
    };
  }, [syncToServer]);

  return (
    <textarea
      value={content}
      onChange={handleChange}
      placeholder="Start typing..."
    />
  );
}
```

### Leading Edge Only (Immediate Response)

```tsx
import { useThrottleCallback } from "@usefy/use-throttle-callback";

function ButtonWithCooldown() {
  const [clickCount, setClickCount] = useState(0);

  // First click is immediate, then 1 second cooldown
  const handleClick = useThrottleCallback(
    () => {
      setClickCount((c) => c + 1);
    },
    1000,
    { leading: true, trailing: false }
  );

  return (
    <button onClick={handleClick}>
      Clicked {clickCount} times (1s cooldown)
    </button>
  );
}
```

### Pending State Indicator

```tsx
import { useThrottleCallback } from "@usefy/use-throttle-callback";

function SaveIndicator() {
  const [data, setData] = useState({});

  const save = useThrottleCallback((newData: object) => {
    fetch("/api/save", {
      method: "POST",
      body: JSON.stringify(newData),
    });
  }, 500);

  return (
    <div>
      <button onClick={() => save(data)}>Save</button>
      {save.pending() && <span className="saving-indicator">Saving...</span>}
    </div>
  );
}
```

---

## TypeScript

This hook is written in TypeScript with full generic support.

```tsx
import {
  useThrottleCallback,
  type UseThrottleCallbackOptions,
  type ThrottledFunction,
} from "@usefy/use-throttle-callback";

// Type inference from callback
const throttledFn = useThrottleCallback((x: number, y: number) => {
  return { x, y };
}, 100);

// throttledFn(number, number) => { x: number, y: number } | undefined
// throttledFn.cancel() => void
// throttledFn.flush() => void
// throttledFn.pending() => boolean
```

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

| Category   | Coverage   |
| ---------- | ---------- |
| Statements | 100% (2/2) |
| Branches   | 100% (4/4) |
| Functions  | 100% (1/1) |
| Lines      | 100% (2/2) |

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test --coverage
```

---

## License

MIT © [mirunamu](https://github.com/geon0529)

This package is part of the [usefy](https://github.com/geon0529/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>
