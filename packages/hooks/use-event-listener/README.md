<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-event-listener</h1>

<p align="center">
  <strong>A React hook for adding event listeners to DOM elements with automatic cleanup</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-event-listener">
    <img src="https://img.shields.io/npm/v/@usefy/use-event-listener.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-event-listener">
    <img src="https://img.shields.io/npm/dm/@usefy/use-event-listener.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-event-listener">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-event-listener?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-event-listener.svg?style=flat-square&color=007acc" alt="license" />
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
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-useeventlistener--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/use-event-listener` provides a simple way to add event listeners to DOM elements with automatic cleanup on unmount. It supports window, document, HTMLElement, and RefObject targets with full TypeScript type inference.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-event-listener?

- **Zero Dependencies** — Pure React implementation with no external dependencies
- **TypeScript First** — Full type safety with automatic event type inference
- **Multiple Targets** — Support for window, document, HTMLElement, and RefObject
- **Automatic Cleanup** — Event listeners are removed on unmount
- **Handler Stability** — No re-registration when handler changes
- **Conditional Activation** — Enable/disable via the `enabled` option
- **Performance Options** — Support for `passive`, `capture`, and `once` options
- **SSR Compatible** — Works seamlessly with Next.js, Remix, and other SSR frameworks
- **Well Tested** — Comprehensive test coverage with Vitest

---

## Installation

```bash
# npm
npm install @usefy/use-event-listener

# yarn
yarn add @usefy/use-event-listener

# pnpm
pnpm add @usefy/use-event-listener
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
import { useEventListener } from "@usefy/use-event-listener";

function WindowResizeTracker() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEventListener("resize", () => {
    setSize({ width: window.innerWidth, height: window.innerHeight });
  });

  return (
    <div>
      Window size: {size.width} × {size.height}
    </div>
  );
}
```

---

## API Reference

### `useEventListener(eventName, handler, element?, options?)`

A hook that adds an event listener to the specified target.

#### Parameters

| Parameter   | Type                      | Description                                            |
| ----------- | ------------------------- | ------------------------------------------------------ |
| `eventName` | `string`                  | The event type to listen for (e.g., "click", "resize") |
| `handler`   | `(event: Event) => void`  | Callback function called when the event fires          |
| `element`   | `EventTargetType`         | Target element (defaults to window)                    |
| `options`   | `UseEventListenerOptions` | Configuration options                                  |

#### Options

| Option    | Type      | Default     | Description                                |
| --------- | --------- | ----------- | ------------------------------------------ |
| `enabled` | `boolean` | `true`      | Whether the event listener is active       |
| `capture` | `boolean` | `false`     | Use event capture phase instead of bubble  |
| `passive` | `boolean` | `undefined` | Use passive event listener for performance |
| `once`    | `boolean` | `false`     | Handler is invoked once and then removed   |

#### Supported Target Types

```typescript
type EventTargetType<T extends HTMLElement = HTMLElement> =
  | Window // window object
  | Document // document object
  | HTMLElement // any HTML element
  | React.RefObject<T> // React ref
  | null // no listener
  | undefined; // defaults to window
```

#### Returns

`void`

---

## Examples

### Window Events (Default)

When no element is provided, events are attached to the window:

```tsx
import { useEventListener } from "@usefy/use-event-listener";

function ResizeHandler() {
  useEventListener("resize", (e) => {
    console.log("Window resized:", window.innerWidth, window.innerHeight);
  });

  return <div>Resize the window</div>;
}
```

### Document Events

```tsx
import { useEventListener } from "@usefy/use-event-listener";

function KeyboardHandler() {
  useEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape") {
        console.log("Escape pressed");
      }
    },
    document
  );

  return <div>Press Escape</div>;
}
```

### HTMLElement Events

```tsx
import { useEventListener } from "@usefy/use-event-listener";

function ElementClickHandler() {
  const button = document.getElementById("myButton");

  useEventListener(
    "click",
    (e) => {
      console.log("Button clicked");
    },
    button
  );

  return <button id="myButton">Click me</button>;
}
```

### RefObject Events

```tsx
import { useEventListener } from "@usefy/use-event-listener";
import { useRef } from "react";

function ScrollableBox() {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  useEventListener(
    "scroll",
    () => {
      if (boxRef.current) {
        setScrollTop(boxRef.current.scrollTop);
      }
    },
    boxRef,
    { passive: true }
  );

  return (
    <div ref={boxRef} style={{ height: 200, overflow: "auto" }}>
      <div style={{ height: 1000 }}>Scroll position: {scrollTop}px</div>
    </div>
  );
}
```

### Conditional Activation

```tsx
import { useEventListener } from "@usefy/use-event-listener";

function ConditionalListener() {
  const [isListening, setIsListening] = useState(true);

  useEventListener(
    "click",
    () => {
      console.log("Clicked!");
    },
    document,
    { enabled: isListening }
  );

  return (
    <button onClick={() => setIsListening(!isListening)}>
      {isListening ? "Disable" : "Enable"} Listener
    </button>
  );
}
```

### Passive Scroll Listener

Use `passive: true` for better scroll performance:

```tsx
import { useEventListener } from "@usefy/use-event-listener";

function OptimizedScrollHandler() {
  useEventListener(
    "scroll",
    (e) => {
      // Handle scroll without blocking
      console.log("Scroll position:", window.scrollY);
    },
    window,
    { passive: true }
  );

  return <div>Scroll the page</div>;
}
```

### One-time Event Handler

```tsx
import { useEventListener } from "@usefy/use-event-listener";

function OneTimeHandler() {
  useEventListener(
    "click",
    () => {
      console.log("This only fires once!");
    },
    document,
    { once: true }
  );

  return <div>Click anywhere (only works once)</div>;
}
```

### Multiple Event Listeners

```tsx
import { useEventListener } from "@usefy/use-event-listener";

function MultipleListeners() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isPressed, setIsPressed] = useState(false);

  useEventListener("mousemove", (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  });

  useEventListener("mousedown", () => {
    setIsPressed(true);
  });

  useEventListener("mouseup", () => {
    setIsPressed(false);
  });

  return (
    <div>
      Position: ({mousePos.x}, {mousePos.y})
      <br />
      {isPressed ? "Mouse down" : "Mouse up"}
    </div>
  );
}
```

### Network Status

```tsx
import { useEventListener } from "@usefy/use-event-listener";

function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEventListener("online", () => setIsOnline(true));
  useEventListener("offline", () => setIsOnline(false));

  return <div>Network: {isOnline ? "Online" : "Offline"}</div>;
}
```

---

## TypeScript

This hook provides full type inference for event types:

```tsx
import { useEventListener } from "@usefy/use-event-listener";
import type {
  UseEventListenerOptions,
  EventTargetType,
} from "@usefy/use-event-listener";

// MouseEvent is automatically inferred
useEventListener("click", (e) => {
  console.log(e.clientX, e.clientY); // e is MouseEvent
});

// KeyboardEvent is automatically inferred
useEventListener(
  "keydown",
  (e) => {
    console.log(e.key); // e is KeyboardEvent
  },
  document
);

// FocusEvent is automatically inferred
useEventListener(
  "focus",
  (e) => {
    console.log(e.relatedTarget); // e is FocusEvent
  },
  inputRef
);

// Options type
const options: UseEventListenerOptions = {
  enabled: true,
  capture: false,
  passive: true,
  once: false,
};
```

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-event-listener/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages)

### Test Categories

<details>
<summary><strong>Basic Functionality Tests</strong></summary>

- Add event listener to window by default
- Call handler when event fires
- Add event listener to document
- Add event listener to HTMLElement
- Add event listener to RefObject
- Handle multiple events

</details>

<details>
<summary><strong>Enabled Option Tests</strong></summary>

- Not add listener when enabled is false
- Add listener when enabled changes to true
- Remove listener when enabled changes to false
- Default enabled to true

</details>

<details>
<summary><strong>Capture Option Tests</strong></summary>

- Use capture phase when capture is true
- Use bubble phase when capture is false
- Re-register listener when capture changes

</details>

<details>
<summary><strong>Passive Option Tests</strong></summary>

- Pass passive: true to addEventListener
- Pass passive: false to addEventListener
- Use browser default when passive is undefined

</details>

<details>
<summary><strong>Once Option Tests</strong></summary>

- Pass once: true to addEventListener
- Default once to false

</details>

<details>
<summary><strong>Handler Stability Tests</strong></summary>

- Not re-register listener when handler changes
- Call updated handler after change

</details>

<details>
<summary><strong>Cleanup Tests</strong></summary>

- Remove event listener on unmount
- Not call handler after unmount
- Remove listener with correct capture option

</details>

---

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>
