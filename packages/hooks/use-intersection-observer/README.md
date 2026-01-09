<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-intersection-observer</h1>

<p align="center">
  <strong>A powerful React hook for observing element visibility using the Intersection Observer API</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-intersection-observer">
    <img src="https://img.shields.io/npm/v/@usefy/use-intersection-observer.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-intersection-observer">
    <img src="https://img.shields.io/npm/dm/@usefy/use-intersection-observer.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-intersection-observer">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-intersection-observer?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-intersection-observer.svg?style=flat-square&color=007acc" alt="license" />
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
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-useintersectionobserver--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/use-intersection-observer` is a feature-rich React hook for efficiently detecting element visibility in the viewport using the Intersection Observer API. It provides a simple API for lazy loading, infinite scroll, scroll animations, and more.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-intersection-observer?

- **Zero Dependencies** — Pure React implementation with no external dependencies
- **TypeScript First** — Full type safety with comprehensive type definitions
- **Efficient Detection** — Leverages native Intersection Observer API for optimal performance
- **Threshold-based Callbacks** — Fine-grained visibility ratio tracking with multiple thresholds
- **TriggerOnce Support** — Perfect for lazy loading patterns
- **Dynamic Enable/Disable** — Conditional observation support
- **Custom Root Containers** — Observe elements within custom scroll containers
- **Root Margin Support** — Expand or shrink detection boundaries
- **SSR Compatible** — Works seamlessly with Next.js, Remix, and other SSR frameworks
- **Optimized Re-renders** — Only updates when meaningful values change
- **Well Tested** — Comprehensive test coverage with Vitest

---

## Installation

```bash
# npm
npm install @usefy/use-intersection-observer

# yarn
yarn add @usefy/use-intersection-observer

# pnpm
pnpm add @usefy/use-intersection-observer
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
import { useIntersectionObserver } from "@usefy/use-intersection-observer";

function MyComponent() {
  const { ref, inView, entry } = useIntersectionObserver();

  return <div ref={ref}>{inView ? "👁️ Visible!" : "👻 Not visible"}</div>;
}
```

---

## API Reference

### `useIntersectionObserver(options?)`

A hook that observes element visibility using the Intersection Observer API.

#### Parameters

| Parameter | Type                             | Description                   |
| --------- | -------------------------------- | ----------------------------- |
| `options` | `UseIntersectionObserverOptions` | Optional configuration object |

#### Options

| Option                  | Type                                                  | Default | Description                                                                                         |
| ----------------------- | ----------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `threshold`             | `number \| number[]`                                  | `0`     | Visibility ratio(s) that trigger updates (0.0 to 1.0). Updates occur when crossing these boundaries |
| `root`                  | `Element \| Document \| null`                         | `null`  | Root element for intersection (null = viewport)                                                     |
| `rootMargin`            | `string`                                              | `"0px"` | Margin around root (CSS margin syntax). Positive expands, negative shrinks detection area           |
| `triggerOnce`           | `boolean`                                             | `false` | Stop observing after element first becomes visible                                                  |
| `enabled`               | `boolean`                                             | `true`  | Enable/disable observer. When false, observer disconnects and stops all updates                     |
| `initialIsIntersecting` | `boolean`                                             | `false` | Initial intersection state before first observation (useful for SSR/SSG)                            |
| `onChange`              | `(entry: IntersectionEntry, inView: boolean) => void` | —       | Callback fired when isIntersecting or intersectionRatio changes                                     |
| `delay`                 | `number`                                              | `0`     | Delay in milliseconds before creating the observer (not individual events)                          |

#### Returns `UseIntersectionObserverReturn`

| Property | Type                              | Description                                                                    |
| -------- | --------------------------------- | ------------------------------------------------------------------------------ |
| `entry`  | `IntersectionEntry \| null`       | Intersection entry data (null if not yet observed). Updates trigger re-renders |
| `inView` | `boolean`                         | Whether the element is currently intersecting (convenience derived from entry) |
| `ref`    | `(node: Element \| null) => void` | Callback ref to attach to the target element you want to observe               |

#### `IntersectionEntry`

Extended intersection entry with convenience properties:

| Property             | Type                        | Description                                                      |
| -------------------- | --------------------------- | ---------------------------------------------------------------- |
| `entry`              | `IntersectionObserverEntry` | Original native IntersectionObserverEntry from the browser API   |
| `isIntersecting`     | `boolean`                   | Whether target is intersecting with root                         |
| `intersectionRatio`  | `number`                    | Ratio of target visible (0.0 to 1.0)                             |
| `target`             | `Element`                   | The observed DOM element                                         |
| `boundingClientRect` | `DOMRectReadOnly`           | Target element's bounding box relative to viewport               |
| `intersectionRect`   | `DOMRectReadOnly`           | Visible portion's bounding box (intersection of target and root) |
| `rootBounds`         | `DOMRectReadOnly \| null`   | Root element's bounding box (null if root is the viewport)       |
| `time`               | `number`                    | DOMHighResTimeStamp when intersection was recorded               |

---

## Examples

### Basic Usage

```tsx
import { useIntersectionObserver } from "@usefy/use-intersection-observer";

function VisibilityChecker() {
  const { ref, inView } = useIntersectionObserver();

  return <div ref={ref}>{inView ? "👁️ Visible!" : "👻 Not visible"}</div>;
}
```

### Lazy Loading Images

```tsx
import { useState } from "react";
import { useIntersectionObserver } from "@usefy/use-intersection-observer";

function LazyImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);

  const { ref, inView } = useIntersectionObserver({
    triggerOnce: true, // Stop observing after first detection
    threshold: 0.1, // Trigger when 10% visible
    rootMargin: "50px", // Start loading 50px before entering viewport
  });

  return (
    <div ref={ref}>
      {inView ? (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          style={{ opacity: loaded ? 1 : 0 }}
        />
      ) : (
        <div className="placeholder">Loading...</div>
      )}
    </div>
  );
}
```

### Infinite Scroll

```tsx
import { useState, useEffect } from "react";
import { useIntersectionObserver } from "@usefy/use-intersection-observer";

function InfiniteList() {
  const [items, setItems] = useState([...initialItems]);
  const [loading, setLoading] = useState(false);

  const { ref, inView } = useIntersectionObserver({
    threshold: 1.0, // Trigger when sentinel is fully visible
    rootMargin: "100px", // Start loading 100px before sentinel enters viewport
  });

  useEffect(() => {
    if (inView && !loading) {
      setLoading(true);
      fetchMoreItems().then((newItems) => {
        setItems((prev) => [...prev, ...newItems]);
        setLoading(false);
      });
    }
  }, [inView, loading]);

  return (
    <div>
      {items.map((item) => (
        <Item key={item.id} {...item} />
      ))}
      {/* Sentinel Element - triggers loading when visible */}
      <div ref={ref}>{loading && <Spinner />}</div>
    </div>
  );
}
```

### Scroll Animations

```tsx
import { useIntersectionObserver } from "@usefy/use-intersection-observer";

function AnimatedCard({ children }: { children: React.ReactNode }) {
  const { ref, inView } = useIntersectionObserver({
    triggerOnce: true, // Animate only once
    threshold: 0.3, // Trigger when 30% visible
  });

  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(30px)",
        transition: "all 0.6s ease",
      }}
    >
      {children}
    </div>
  );
}
```

### Reading Progress Tracker

```tsx
import { useState } from "react";
import { useIntersectionObserver } from "@usefy/use-intersection-observer";

function ProgressTracker() {
  const [progress, setProgress] = useState(0);

  // 101 thresholds (0%, 1%, 2%, ... 100%) for fine-grained tracking
  const thresholds = Array.from({ length: 101 }, (_, i) => i / 100);

  const { ref } = useIntersectionObserver({
    threshold: thresholds,
    onChange: (entry) => {
      // Update progress when crossing any threshold boundary
      setProgress(Math.round(entry.intersectionRatio * 100));
    },
  });

  return (
    <>
      <div className="progress-bar" style={{ width: `${progress}%` }} />
      <article ref={ref}>{/* Long content */}</article>
    </>
  );
}
```

### Custom Scroll Container

```tsx
import { useRef } from "react";
import { useIntersectionObserver } from "@usefy/use-intersection-observer";

function ScrollContainer() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { ref, inView } = useIntersectionObserver({
    root: containerRef.current,
    rootMargin: "0px",
  });

  return (
    <div ref={containerRef} style={{ overflow: "auto", height: 400 }}>
      <div style={{ height: 1000 }}>
        <div ref={ref}>{inView ? "Visible in container" : "Not visible"}</div>
      </div>
    </div>
  );
}
```

### Section Navigation Highlighting

```tsx
import { useState } from "react";
import { useIntersectionObserver } from "@usefy/use-intersection-observer";

function SectionNavigation() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  return (
    <>
      <nav>
        {sections.map((section) => (
          <button
            key={section.id}
            className={activeSection === section.id ? "active" : ""}
          >
            {section.name}
          </button>
        ))}
      </nav>

      {sections.map((section) => (
        <Section
          key={section.id}
          id={section.id}
          onVisible={() => setActiveSection(section.id)}
        />
      ))}
    </>
  );
}

function Section({ id, onVisible }: { id: string; onVisible: () => void }) {
  const { ref } = useIntersectionObserver({
    threshold: 0.6, // Activate when 60% visible
    onChange: (_, inView) => {
      // Called when section enters or exits the 60% visibility threshold
      if (inView) onVisible();
    },
  });

  return (
    <section ref={ref} id={id}>
      ...
    </section>
  );
}
```

### Dynamic Enable/Disable

```tsx
import { useState } from "react";
import { useIntersectionObserver } from "@usefy/use-intersection-observer";

function ConditionalObserver() {
  const [isLoading, setIsLoading] = useState(true);

  const { ref, inView } = useIntersectionObserver({
    enabled: !isLoading, // Observer is disconnected when disabled
  });

  return <div ref={ref}>{inView ? "Observing" : "Not observing"}</div>;
}
```

### SSR/SSG Support

```tsx
import { useIntersectionObserver } from "@usefy/use-intersection-observer";

function SSRComponent() {
  // Set initial state for server-side rendering
  const { ref, inView } = useIntersectionObserver({
    initialIsIntersecting: true, // Assume visible during SSR
  });

  // During SSR/first render, inView will be true
  // After hydration, actual intersection state takes over
  return <div ref={ref}>{inView ? "Initially visible" : "Not visible"}</div>;
}
```

### Delay Observer Creation

```tsx
import { useIntersectionObserver } from "@usefy/use-intersection-observer";

function DelayedObserver() {
  const { ref, inView } = useIntersectionObserver({
    delay: 500, // Wait 500ms before creating the observer
  });

  // Observer is NOT created until 500ms after component mount
  // This delays the CREATION of the observer, not individual intersection events
  // Useful for preventing premature observations during page load or fast scrolling
  return <div ref={ref}>{inView ? "Observing" : "Not observing"}</div>;
}
```

---

## Performance Optimization

The Intersection Observer API fires callbacks when threshold boundaries are crossed or when `isIntersecting` changes (e.g., during user scroll interactions). When a callback fires:

- The `entry` object is updated with new values including `time` (timestamp of the intersection event)
- `setEntry()` is called → **re-render occurs**

The hook includes a safeguard: it compares the previous `isIntersecting` and `intersectionRatio` values with the new ones before calling `setEntry()`. This prevents redundant re-renders in edge cases where the observer might report the same state multiple times.

```tsx
// Inside the hook's callback:
const hasChanged =
  !prevEntry ||
  prevEntry.isIntersecting !== nativeEntry.isIntersecting ||
  prevEntry.intersectionRatio !== nativeEntry.intersectionRatio;

if (hasChanged) {
  setEntry(intersectionEntry); // Re-render triggered
}
```

---

## TypeScript

This hook is written in TypeScript and exports comprehensive type definitions.

```tsx
import {
  useIntersectionObserver,
  type UseIntersectionObserverOptions,
  type UseIntersectionObserverReturn,
  type IntersectionEntry,
  type OnChangeCallback,
} from "@usefy/use-intersection-observer";

// Full type inference
const { ref, inView, entry }: UseIntersectionObserverReturn =
  useIntersectionObserver({
    threshold: 0.5,
    onChange: (entry, inView) => {
      console.log("Visibility changed:", inView);
    },
  });
```

---

## Performance

- **Stable Function References** — The `ref` callback is memoized with `useCallback`
- **Smart Re-renders** — Only re-renders when `isIntersecting` or `intersectionRatio` changes
- **Native API** — Leverages browser's Intersection Observer API for optimal performance
- **SSR Compatible** — Gracefully degrades in server environments

```tsx
const { ref } = useIntersectionObserver({
  threshold: [0, 0.5, 1.0],
});

// ref reference remains stable across renders
useEffect(() => {
  // Safe to use as dependency
}, [ref]);
```

---

## Browser Support

This hook uses the [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), which is supported in:

- Chrome 51+
- Firefox 55+
- Safari 12.1+
- Edge 15+
- Opera 38+

For unsupported browsers, the hook gracefully degrades and returns the initial state.

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-intersection-observer/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages)

### Test Files

- `useIntersectionObserver.test.ts` — 87 tests for hook behavior
- `utils.test.ts` — 63 tests for utility functions

**Total: 150 tests**

---

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>
