# @usefy/use-unmount

A React hook that executes a callback when the component unmounts.

## Features

- **Closure Freshness**: Callback always has access to the latest state/props values
- **Error Handling**: Errors in callback are caught and don't break unmount
- **Conditional Execution**: Enable/disable cleanup via `enabled` option
- **SSR Compatible**: Works safely with server-side rendering
- **TypeScript Support**: Full type definitions included
- **Zero Dependencies**: Only peer dependency on React

## Installation

```bash
npm install @usefy/use-unmount
# or
pnpm add @usefy/use-unmount
# or
yarn add @usefy/use-unmount
```

## Usage

### Basic Usage

```tsx
import { useUnmount } from "@usefy/use-unmount";

function MyComponent() {
  useUnmount(() => {
    console.log("Component unmounted");
  });

  return <div>Hello</div>;
}
```

### With Latest State Access

```tsx
import { useState } from "react";
import { useUnmount } from "@usefy/use-unmount";

function FormComponent() {
  const [formData, setFormData] = useState({});

  useUnmount(() => {
    // formData will have the latest value at unmount time
    saveToLocalStorage(formData);
  });

  return <form>...</form>;
}
```

### Conditional Cleanup

```tsx
import { useUnmount } from "@usefy/use-unmount";

function TrackingComponent({ trackingEnabled }) {
  useUnmount(
    () => {
      sendAnalyticsEvent("component_unmounted");
    },
    { enabled: trackingEnabled }
  );

  return <div>Tracked content</div>;
}
```

### Resource Cleanup

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

## API

### `useUnmount(callback, options?)`

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `callback` | `() => void` | Function to execute when component unmounts |
| `options` | `UseUnmountOptions` | Optional configuration |

#### Options

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Whether to execute callback on unmount |

## React StrictMode

In development with React StrictMode, components are intentionally mounted, unmounted, and remounted to detect side effects. This means the unmount callback may be called multiple times during development. This is expected behavior.

## Error Handling

If the callback throws an error, it will be caught and logged to the console. This prevents unmount errors from breaking the entire component tree unmount process.

## When to Use

Use `useUnmount` when you need to:

- Save data before component removal
- Send analytics events on component exit
- Clean up resources that aren't managed by useEffect
- Log component lifecycle events
- Perform final state snapshots

## When NOT to Use

Consider using `useEffect` cleanup instead when:

- Cleaning up subscriptions (use `useEffect` return function)
- Removing event listeners (use `useEventListener` hook)
- Canceling requests (use abort controllers in `useEffect`)

The key difference is that `useUnmount` guarantees access to the latest values, while `useEffect` cleanup captures values at effect creation time.

## License

MIT
