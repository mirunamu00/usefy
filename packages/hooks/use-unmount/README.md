<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-unmount</h1>

<p align="center">
  <strong>A type-safe React hook that runs a callback when a component unmounts</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-unmount">
    <img src="https://img.shields.io/npm/v/@usefy/use-unmount.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-unmount">
    <img src="https://img.shields.io/npm/dm/@usefy/use-unmount.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-unmount">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-unmount?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-unmount.svg?style=flat-square&color=007acc" alt="license" />
  </a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#examples">Examples</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-useunmount--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/use-unmount` runs a callback exactly when a component unmounts. Unlike a raw `useEffect` cleanup, the callback always sees the **latest** state and props (closure freshness), errors thrown inside it are caught so they never break the rest of the unmount, and cleanup can be turned on or off with the `enabled` option — its value is read at unmount time.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-unmount?

- **Closure Freshness** — The callback always sees the latest state/props at unmount time
- **Runs Only on Unmount** — Toggling `enabled` while mounted never fires the callback; it fires only on real unmount
- **Error Handling** — Errors thrown in the callback are caught and logged, never breaking the component tree unmount
- **TypeScript First** — Full type safety with the exported `UseUnmountOptions` interface
- **SSR Compatible** — Safe to render on the server (Next.js, Remix); the callback never runs during SSR
- **Zero Dependencies** — Pure React implementation with only a peer dependency on React

---

## Installation

```bash
# npm
npm install @usefy/use-unmount

# yarn
yarn add @usefy/use-unmount

# pnpm
pnpm add @usefy/use-unmount
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
import { useUnmount } from "@usefy/use-unmount";

function MyComponent() {
  useUnmount(() => {
    console.log("Component unmounted");
  });

  return <div>Hello</div>;
}
```

---

## API Reference

### `useUnmount(callback, options?)`

Executes `callback` when the component unmounts. Returns `void`.

#### Parameters

| Parameter  | Type                | Default | Description                                  |
| ---------- | ------------------- | ------- | -------------------------------------------- |
| `callback` | `() => void`        | —       | Function to execute when the component unmounts |
| `options`  | `UseUnmountOptions` | `{}`    | Optional configuration                       |

#### `UseUnmountOptions`

| Property  | Type      | Default | Description                                                     |
| --------- | --------- | ------- | --------------------------------------------------------------- |
| `enabled` | `boolean` | `true`  | Whether to run the callback on unmount, read at unmount time    |

> **Runs only on unmount:** the `enabled` value is captured in a ref and read when the component actually unmounts. Flipping `enabled` from `true` to `false` (or back) while the component is still mounted never fires the callback.

---

## Examples

### Save the latest state on unmount

```tsx
import { useState } from "react";
import { useUnmount } from "@usefy/use-unmount";

function FormComponent() {
  const [formData, setFormData] = useState({});

  useUnmount(() => {
    // formData holds the latest value at unmount time
    saveToLocalStorage(formData);
  });

  return <form>...</form>;
}
```

### Conditional cleanup

```tsx
import { useUnmount } from "@usefy/use-unmount";

function TrackingComponent({ trackingEnabled }: { trackingEnabled: boolean }) {
  useUnmount(
    () => {
      sendAnalyticsEvent("component_unmounted");
    },
    { enabled: trackingEnabled }
  );

  return <div>Tracked content</div>;
}
```

### Resource cleanup

```tsx
import { useEffect, useRef } from "react";
import { useUnmount } from "@usefy/use-unmount";

function WebSocketComponent() {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    wsRef.current = new WebSocket("wss://example.com");
  }, []);

  useUnmount(() => {
    wsRef.current?.close();
  });

  return <div>Connected</div>;
}
```

### TypeScript

```tsx
import { useUnmount, type UseUnmountOptions } from "@usefy/use-unmount";

const options: UseUnmountOptions = { enabled: true };

useUnmount(() => {
  console.log("Goodbye");
}, options);
```

### React StrictMode

In development with React StrictMode, components are intentionally mounted, unmounted, and remounted to detect side effects, so the unmount callback may run more than once during development. This is expected behavior and helps surface non-idempotent cleanup logic.

### When to use (and when not to)

Use `useUnmount` to save data before removal, send exit analytics, clean up resources not managed by `useEffect`, or take a final state snapshot. Prefer a plain `useEffect` cleanup for subscriptions, event listeners, and request cancellation — the key difference is that `useUnmount` guarantees access to the latest values, while `useEffect` cleanup captures values at effect creation time.

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

📊 <a href="https://mirunamu00.github.io/usefy/coverage/hooks/use-unmount/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages)

### Test Categories

<details>
<summary><strong>Basic Functionality Tests</strong></summary>

- Callback execution on unmount
- No callback execution on mount
- No callback execution on rerender

</details>

<details>
<summary><strong>Closure Freshness Tests</strong></summary>

- Callback accesses latest values at unmount time
- Updated callback reference is used on unmount
- Latest state values are captured in callback

</details>

<details>
<summary><strong>Enabled Option Tests</strong></summary>

- Default enabled state (true)
- Explicit enabled: true and enabled: false
- Callback does not fire while mounted when enabled toggles
- Latest enabled value is honored at unmount time

</details>

<details>
<summary><strong>Error Handling Tests</strong></summary>

- Errors in callback are caught and logged
- Unmount process continues despite callback errors
- Non-Error objects thrown are handled

</details>

<details>
<summary><strong>Multiple Instances Tests</strong></summary>

- Independent instances work correctly
- Multiple hooks in same component
- Independent enabled states per instance

</details>

<details>
<summary><strong>Edge Cases Tests</strong></summary>

- Rapid mount/unmount cycles
- Undefined options handling
- Empty options object
- Null-ish enabled values

</details>

<details>
<summary><strong>SSR Safety Tests</strong></summary>

- Renders on the server without throwing
- Callback never runs during server rendering

</details>

<details>
<summary><strong>Async Callback Tests</strong></summary>

- Async callbacks are executed on unmount
- Async error handling behavior

</details>

---

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>
