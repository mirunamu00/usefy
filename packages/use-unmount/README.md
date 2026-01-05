# @usefy/use-unmount

A React hook that executes a callback when the component unmounts.

## Features

- **Closure Freshness**: Callback always has access to the latest state/props values
- **Error Handling**: Errors in callback are caught and don't break unmount
- **Conditional Execution**: Enable/disable cleanup via `enabled` option
- **SSR Compatible**: Works safely with server-side rendering
- **TypeScript Support**: Full type definitions included
- **Zero Dependencies**: Only peer dependency on React

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-useunmount--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

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

| Name       | Type                | Description                                 |
| ---------- | ------------------- | ------------------------------------------- |
| `callback` | `() => void`        | Function to execute when component unmounts |
| `options`  | `UseUnmountOptions` | Optional configuration                      |

#### Options

| Name      | Type      | Default | Description                            |
| --------- | --------- | ------- | -------------------------------------- |
| `enabled` | `boolean` | `true`  | Whether to execute callback on unmount |

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

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-unmount/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages)

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
- Explicit enabled: true
- Disabled when enabled: false
- Dynamic enabled state changes
- Multiple enabled toggles

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
<summary><strong>Callback Reference Stability Tests</strong></summary>

- Effect doesn't re-run when callback reference changes

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
