<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-hover</h1>

<p align="center">
  <strong>A powerful React hook for detecting hover state on elements with delay support</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-hover">
    <img src="https://img.shields.io/npm/v/@usefy/use-hover.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-hover">
    <img src="https://img.shields.io/npm/dm/@usefy/use-hover.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-hover">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-hover?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-hover.svg?style=flat-square&color=007acc" alt="license" />
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
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usehover--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/use-hover` is a feature-rich React hook for efficiently detecting hover state on elements. It provides configurable enter/leave delays, touch event support, and conditional enabling — perfect for tooltips, dropdowns, and interactive UI components.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-hover?

- **Zero Dependencies** — Pure React implementation with no external dependencies
- **TypeScript First** — Full type safety with comprehensive type definitions
- **Configurable Delays** — Separate enter/leave delays for tooltips and dropdowns
- **Touch Support** — Optional touch event detection for hybrid devices
- **Flexible API** — Both object and tuple destructuring support
- **Dynamic Enable/Disable** — Conditional hover detection support
- **SSR Compatible** — Works seamlessly with Next.js, Remix, and other SSR frameworks
- **Optimized Re-renders** — Only updates when hover state changes
- **Well Tested** — Comprehensive test coverage with Vitest

---

## Installation

```bash
# npm
npm install @usefy/use-hover

# yarn
yarn add @usefy/use-hover

# pnpm
pnpm add @usefy/use-hover
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
import { useHover } from "@usefy/use-hover";

function MyComponent() {
  const { ref, isHovered } = useHover<HTMLDivElement>();

  return (
    <div ref={ref} style={{ background: isHovered ? "lightblue" : "white" }}>
      {isHovered ? "Hovering!" : "Hover me"}
    </div>
  );
}
```

### Tuple Destructuring

```tsx
// Alternative syntax using tuple destructuring
const [ref, isHovered] = useHover<HTMLDivElement>();
```

---

## API Reference

### `useHover<T>(options?)`

A hook that detects hover state on elements using mouseenter/mouseleave events.

#### Type Parameter

| Parameter | Constraint | Default       | Description                        |
| --------- | ---------- | ------------- | ---------------------------------- |
| `T`       | `Element`  | `HTMLElement` | The type of element to attach to   |

#### Parameters

| Parameter | Type              | Description                   |
| --------- | ----------------- | ----------------------------- |
| `options` | `UseHoverOptions` | Optional configuration object |

#### Options

| Option           | Type                                                | Default | Description                                                                    |
| ---------------- | --------------------------------------------------- | ------- | ------------------------------------------------------------------------------ |
| `enabled`        | `boolean`                                           | `true`  | Enable/disable hover detection. When false, isHovered is always false          |
| `delay`          | `number \| { enter?: number; leave?: number }`      | `0`     | Delay in ms before hover state changes. Can be separate for enter/leave        |
| `onChange`       | `(isHovered: boolean, event?: MouseEvent) => void`  | —       | Callback fired when hover state changes                                        |
| `initialHovered` | `boolean`                                           | `false` | Initial hover state (useful for SSR)                                           |
| `detectTouch`    | `boolean`                                           | `false` | Whether to detect touch events (touchstart/touchend) for hybrid devices        |

#### Returns `UseHoverReturn<T>`

| Property    | Type                          | Description                                                        |
| ----------- | ----------------------------- | ------------------------------------------------------------------ |
| `ref`       | `(node: T \| null) => void`   | Callback ref to attach to the target element                       |
| `isHovered` | `boolean`                     | Whether the element is currently being hovered                     |

The return value also supports tuple destructuring via `Symbol.iterator`:
```tsx
const [ref, isHovered] = useHover();
```

---

## Examples

### Basic Usage

```tsx
import { useHover } from "@usefy/use-hover";

function HoverCard() {
  const { ref, isHovered } = useHover<HTMLDivElement>();

  return (
    <div
      ref={ref}
      style={{
        padding: 20,
        background: isHovered ? "#e0e7ff" : "#f3f4f6",
        transition: "background 0.2s",
      }}
    >
      {isHovered ? "Hovering!" : "Hover me"}
    </div>
  );
}
```

### Tooltip with Delay

```tsx
import { useHover } from "@usefy/use-hover";

function TooltipButton() {
  const { ref, isHovered } = useHover<HTMLButtonElement>({
    delay: { enter: 500, leave: 100 }, // Show after 500ms, hide after 100ms
  });

  return (
    <div className="relative">
      <button ref={ref}>Hover for tooltip</button>
      {isHovered && (
        <div className="tooltip">
          This tooltip appears after a 500ms delay!
        </div>
      )}
    </div>
  );
}
```

### Dropdown Menu

```tsx
import { useHover } from "@usefy/use-hover";

function DropdownMenu() {
  const { ref, isHovered } = useHover<HTMLDivElement>({
    delay: { leave: 300 }, // Keep open for 300ms after mouse leaves
  });

  return (
    <div ref={ref} className="relative">
      <button>Menu</button>
      {isHovered && (
        <ul className="dropdown">
          <li>Profile</li>
          <li>Settings</li>
          <li>Logout</li>
        </ul>
      )}
    </div>
  );
}
```

### With onChange Callback

```tsx
import { useHover } from "@usefy/use-hover";

function TrackedElement() {
  const { ref, isHovered } = useHover<HTMLDivElement>({
    onChange: (hovered, event) => {
      if (hovered) {
        console.log("Mouse entered at:", event?.clientX, event?.clientY);
        analytics.track("element_hovered");
      } else {
        console.log("Mouse left");
      }
    },
  });

  return <div ref={ref}>Tracked element</div>;
}
```

### Conditional Enabling

```tsx
import { useState } from "react";
import { useHover } from "@usefy/use-hover";

function ConditionalHover() {
  const [enabled, setEnabled] = useState(true);
  const { ref, isHovered } = useHover<HTMLDivElement>({ enabled });

  return (
    <div>
      <button onClick={() => setEnabled(!enabled)}>
        Toggle: {enabled ? "On" : "Off"}
      </button>
      <div ref={ref}>
        {enabled
          ? isHovered
            ? "Hovering!"
            : "Hover me"
          : "Hover disabled"}
      </div>
    </div>
  );
}
```

### Touch Support for Mobile

```tsx
import { useHover } from "@usefy/use-hover";

function MobileTooltip() {
  const { ref, isHovered } = useHover<HTMLButtonElement>({
    detectTouch: true,
    delay: { enter: 0, leave: 1500 }, // Stay visible for 1.5s after touch ends
  });

  return (
    <button ref={ref}>
      {isHovered ? "Tapped/Hovered!" : "Tap or hover"}
    </button>
  );
}
```

### SVG Elements

```tsx
import { useHover } from "@usefy/use-hover";

function HoverableSVG() {
  const { ref, isHovered } = useHover<SVGCircleElement>();

  return (
    <svg width="100" height="100">
      <circle
        ref={ref}
        cx="50"
        cy="50"
        r="40"
        fill={isHovered ? "#6366f1" : "#e5e7eb"}
        style={{ transition: "fill 0.2s" }}
      />
    </svg>
  );
}
```

### Interactive Card Grid

```tsx
import { useHover } from "@usefy/use-hover";

function CardGrid() {
  const cards = [
    { id: 1, title: "Card 1", description: "Description 1" },
    { id: 2, title: "Card 2", description: "Description 2" },
    { id: 3, title: "Card 3", description: "Description 3" },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((card) => (
        <HoverCard key={card.id} {...card} />
      ))}
    </div>
  );
}

function HoverCard({ title, description }: { title: string; description: string }) {
  const { ref, isHovered } = useHover<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`card ${isHovered ? "card--hovered" : ""}`}
      style={{
        transform: isHovered ? "translateY(-4px)" : "none",
        boxShadow: isHovered ? "0 10px 25px rgba(0,0,0,0.15)" : "none",
        transition: "all 0.2s",
      }}
    >
      <h3>{title}</h3>
      <p>{description}</p>
      {isHovered && <button>Learn More</button>}
    </div>
  );
}
```

---

## TypeScript

This hook is written in TypeScript and exports comprehensive type definitions.

```tsx
import {
  useHover,
  type UseHoverOptions,
  type UseHoverReturn,
  type HoverDelayConfig,
  type OnHoverChangeCallback,
} from "@usefy/use-hover";

// Full type inference
const { ref, isHovered }: UseHoverReturn<HTMLDivElement> = useHover<HTMLDivElement>({
  delay: { enter: 200, leave: 500 },
  onChange: (hovered, event) => {
    console.log("Hover changed:", hovered);
  },
});

// Works with SVG elements too
const svgHover: UseHoverReturn<SVGSVGElement> = useHover<SVGSVGElement>();
```

---

## Performance

- **Stable Function References** — The `ref` callback is memoized with `useCallback`
- **Smart Re-renders** — Only re-renders when `isHovered` state actually changes
- **Timeout Cleanup** — Automatically clears pending timeouts on unmount
- **SSR Compatible** — Gracefully degrades in server environments

```tsx
const { ref } = useHover();

// ref reference remains stable across renders
useEffect(() => {
  // Safe to use as dependency
}, [ref]);
```

---

## Browser Support

This hook uses standard DOM events (`mouseenter`, `mouseleave`, `touchstart`, `touchend`), which are supported in all modern browsers:

- Chrome 1+
- Firefox 1+
- Safari 1+
- Edge 12+
- Opera 7+

For SSR environments, the hook gracefully degrades and returns the initial state.

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-hover/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages)

### Test Files

- `useHover.test.ts` — 60 tests for hook behavior and utilities

**Total: 60 tests**

---

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>
