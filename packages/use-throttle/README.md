<p align="center">
  <img src="https://raw.githubusercontent.com/geon0529/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-throttle</h1>

<p align="center">
  <strong>A high-performance React hook for throttling values with leading/trailing edge support</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-throttle">
    <img src="https://img.shields.io/npm/v/@usefy/use-throttle.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-throttle">
    <img src="https://img.shields.io/npm/dm/@usefy/use-throttle.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-throttle">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-throttle?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/geon0529/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-throttle.svg?style=flat-square&color=007acc" alt="license" />
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

`@usefy/use-throttle` limits value updates to at most once per specified interval, making it perfect for scroll events, resize handlers, mouse movements, and any high-frequency updates that need rate-limiting. Unlike debounce, throttle guarantees regular updates during continuous changes.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-throttle?

- **Zero Dependencies** — Pure React implementation (uses @usefy/use-debounce internally)
- **TypeScript First** — Full type safety with generics and exported interfaces
- **Flexible Options** — Leading edge and trailing edge support
- **Guaranteed Updates** — Regular updates during continuous changes (unlike debounce)
- **SSR Compatible** — Works seamlessly with Next.js, Remix, and other SSR frameworks
- **Lightweight** — Minimal bundle footprint (~200B minified + gzipped)
- **Well Tested** — Comprehensive test coverage with Vitest

### Throttle vs Debounce

| Feature              | Throttle                   | Debounce                      |
| -------------------- | -------------------------- | ----------------------------- |
| First update         | Immediate (leading: true)  | After delay                   |
| During rapid changes | Regular intervals          | Waits for pause               |
| Best for             | Scroll, resize, mouse move | Search input, form validation |

---

## Installation

```bash
# npm
npm install @usefy/use-throttle

# yarn
yarn add @usefy/use-throttle

# pnpm
pnpm add @usefy/use-throttle
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

This package uses [@usefy/use-debounce](https://www.npmjs.com/package/@usefy/use-debounce) internally with `maxWait` set to achieve throttle behavior.

---

## Quick Start

```tsx
import { useThrottle } from "@usefy/use-throttle";

function ScrollTracker() {
  const [scrollY, setScrollY] = useState(0);
  const throttledScrollY = useThrottle(scrollY, 100);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return <div>Scroll position: {throttledScrollY}px</div>;
}
```

---

## API Reference

### `useThrottle<T>(value, delay?, options?)`

A hook that returns a throttled version of the provided value, limiting updates to at most once per interval.

#### Parameters

| Parameter | Type                 | Default | Description                           |
| --------- | -------------------- | ------- | ------------------------------------- |
| `value`   | `T`                  | —       | The value to throttle                 |
| `delay`   | `number`             | `500`   | The throttle interval in milliseconds |
| `options` | `UseThrottleOptions` | `{}`    | Additional configuration options      |

#### Options

| Option     | Type      | Default | Description                                  |
| ---------- | --------- | ------- | -------------------------------------------- |
| `leading`  | `boolean` | `true`  | Update on the leading edge (first change)    |
| `trailing` | `boolean` | `true`  | Update on the trailing edge (after interval) |

#### Returns

| Type | Description         |
| ---- | ------------------- |
| `T`  | The throttled value |

---

## Examples

### Scroll Position Tracking

```tsx
import { useThrottle } from "@usefy/use-throttle";

function ScrollProgress() {
  const [scrollY, setScrollY] = useState(0);
  const throttledScrollY = useThrottle(scrollY, 100);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const progress = Math.min(
    (throttledScrollY / (document.body.scrollHeight - window.innerHeight)) *
      100,
    100
  );

  return <div className="progress-bar" style={{ width: `${progress}%` }} />;
}
```

### Mouse Position Tracker

```tsx
import { useThrottle } from "@usefy/use-throttle";

function MouseTracker() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const throttledPosition = useThrottle(position, 50);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      className="cursor-follower"
      style={{
        transform: `translate(${throttledPosition.x}px, ${throttledPosition.y}px)`,
      }}
    />
  );
}
```

### Window Resize Handler

```tsx
import { useThrottle } from "@usefy/use-throttle";

function ResponsiveLayout() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const throttledSize = useThrottle(windowSize, 200);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const layout = throttledSize.width >= 768 ? "desktop" : "mobile";

  return (
    <div className={`layout-${layout}`}>
      Window: {throttledSize.width} x {throttledSize.height}
    </div>
  );
}
```

### Input Value with Frequent Updates

```tsx
import { useThrottle } from "@usefy/use-throttle";

function RangeSlider() {
  const [value, setValue] = useState(50);
  const throttledValue = useThrottle(value, 200);

  // API call only happens at most every 200ms
  useEffect(() => {
    updateServerValue(throttledValue);
  }, [throttledValue]);

  return (
    <div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => setValue(+e.target.value)}
      />
      <span>Value: {throttledValue}</span>
    </div>
  );
}
```

### Leading Edge Only

```tsx
import { useThrottle } from "@usefy/use-throttle";

function InstantFeedback() {
  const [clicks, setClicks] = useState(0);

  // Update immediately on first click, ignore subsequent clicks for 500ms
  const throttledClicks = useThrottle(clicks, 500, {
    leading: true,
    trailing: false,
  });

  return (
    <button onClick={() => setClicks((c) => c + 1)}>
      Clicks: {throttledClicks}
    </button>
  );
}
```

### Trailing Edge Only

```tsx
import { useThrottle } from "@usefy/use-throttle";

function DelayedUpdate() {
  const [value, setValue] = useState("");

  // Only update after the interval passes
  const throttledValue = useThrottle(value, 300, {
    leading: false,
    trailing: true,
  });

  return (
    <div>
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <p>Throttled: {throttledValue}</p>
    </div>
  );
}
```

---

## TypeScript

This hook is written in TypeScript with full generic support.

```tsx
import { useThrottle, type UseThrottleOptions } from "@usefy/use-throttle";

// Generic type inference
const throttledString = useThrottle("hello", 300); // string
const throttledNumber = useThrottle(42, 300); // number
const throttledObject = useThrottle({ x: 1 }, 300); // { x: number }

// Options type
const options: UseThrottleOptions = {
  leading: true,
  trailing: false,
};
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

### Test Categories

<details>
<summary><strong>Initialization Tests</strong></summary>

- Initialize with string, number, boolean, object, array values
- Use default delay of 500ms when not specified

</details>

<details>
<summary><strong>Throttling Behavior Tests</strong></summary>

- Update immediately on first change (leading edge)
- Throttle rapid updates after leading edge
- Update at most once per interval during continuous changes
- Allow new leading edge after interval passes

</details>

<details>
<summary><strong>Leading/Trailing Edge Tests</strong></summary>

- Update immediately with leading: true (default)
- No immediate update with leading: false
- Update on trailing edge with trailing: true (default)

</details>

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

## Related Packages

Explore other hooks in the **@usefy** collection:

| Package                                                                                    | Description                           |
| ------------------------------------------------------------------------------------------ | ------------------------------------- |
| [@usefy/use-throttle-callback](https://www.npmjs.com/package/@usefy/use-throttle-callback) | Throttled callbacks with cancel/flush |
| [@usefy/use-debounce](https://www.npmjs.com/package/@usefy/use-debounce)                   | Value debouncing                      |
| [@usefy/use-debounce-callback](https://www.npmjs.com/package/@usefy/use-debounce-callback) | Debounced callbacks                   |
| [@usefy/use-toggle](https://www.npmjs.com/package/@usefy/use-toggle)                       | Boolean state management              |
| [@usefy/use-counter](https://www.npmjs.com/package/@usefy/use-counter)                     | Counter state management              |
| [@usefy/use-click-any-where](https://www.npmjs.com/package/@usefy/use-click-any-where)     | Global click detection                |

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/geon0529/usefy/blob/master/CONTRIBUTING.md) for details.

```bash
# Clone the repository
git clone https://github.com/geon0529/usefy.git

# Install dependencies
pnpm install

# Run tests
pnpm test

# Build
pnpm build
```

---

## License

MIT © [mirunamu](https://github.com/geon0529)

This package is part of the [usefy](https://github.com/geon0529/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>
