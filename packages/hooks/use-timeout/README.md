<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-timeout</h1>

<p align="center">
  <strong>A lightweight, type-safe React hook for declarative setTimeout with automatic cleanup</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-timeout">
    <img src="https://img.shields.io/npm/v/@usefy/use-timeout.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-timeout">
    <img src="https://img.shields.io/npm/dm/@usefy/use-timeout.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-timeout">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-timeout?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-timeout.svg?style=flat-square&color=007acc" alt="license" />
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
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usetimeout--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/use-timeout` is a powerful React hook that wraps `setTimeout` for declarative and safe delayed execution. It provides automatic cleanup on unmount, reset/clear controls, and conditional execution with `null` delay.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-timeout?

- **Zero Dependencies** — Pure React implementation with no external dependencies
- **TypeScript First** — Full type safety with exported interfaces
- **Memory Safe** — Automatic cleanup on unmount prevents memory leaks
- **Stale Closure Free** — Always executes the latest callback reference
- **Conditional Execution** — Pass `null` to disable the timer
- **Full Control** — Reset and clear functions for timer management
- **SSR Compatible** — Works seamlessly with Next.js, Remix, and other SSR frameworks
- **Lightweight** — Minimal bundle footprint (~400B minified + gzipped)
- **Well Tested** — Comprehensive test coverage with Vitest

---

## Installation

```bash
# npm
npm install @usefy/use-timeout

# yarn
yarn add @usefy/use-timeout

# pnpm
pnpm add @usefy/use-timeout
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
import { useTimeout } from "@usefy/use-timeout";

function Toast({ message }: { message: string }) {
  const [show, setShow] = useState(true);

  useTimeout(() => {
    setShow(false);
  }, 3000);

  return show ? <div className="toast">{message}</div> : null;
}
```

---

## API Reference

### `useTimeout(callback, delay)`

A hook that executes a callback after a specified delay with automatic cleanup and controls.

#### Parameters

| Parameter  | Type                          | Description                                             |
| ---------- | ----------------------------- | ------------------------------------------------------- |
| `callback` | `() => void`                  | Function to execute after the delay                     |
| `delay`    | `number \| null \| undefined` | Delay in milliseconds, or `null`/`undefined` to disable |

#### Returns `UseTimeoutReturn`

| Property    | Type         | Description                               |
| ----------- | ------------ | ----------------------------------------- |
| `reset`     | `() => void` | Restart the timer from the beginning      |
| `clear`     | `() => void` | Cancel the timer (callback won't execute) |
| `isPending` | `boolean`    | Whether the timer is currently pending    |

---

## Examples

### Auto-Dismissing Toast

```tsx
import { useState } from "react";
import { useTimeout } from "@usefy/use-timeout";

function AutoDismissToast({ message }: { message: string }) {
  const [show, setShow] = useState(true);

  useTimeout(() => {
    setShow(false);
  }, 3000);

  return show ? <div className="toast">{message}</div> : null;
}
```

### Debounced Auto-Save

```tsx
import { useState } from "react";
import { useTimeout } from "@usefy/use-timeout";

function Editor() {
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { reset } = useTimeout(() => {
    saveToServer(content);
    setIsSaving(false);
  }, 2000);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsSaving(true);
    reset(); // Reset timer on every keystroke
  };

  return (
    <div>
      <textarea value={content} onChange={handleChange} />
      <span>{isSaving ? "Saving..." : "Saved"}</span>
    </div>
  );
}
```

### Conditional Timer (Session Timeout)

```tsx
import { useTimeout } from "@usefy/use-timeout";

function SessionManager({ isLoggedIn }: { isLoggedIn: boolean }) {
  useTimeout(
    () => {
      logout();
      alert("Session expired due to inactivity");
    },
    isLoggedIn ? 30 * 60 * 1000 : null // 30 minutes, disabled when logged out
  );

  return <div>Your session is active</div>;
}
```

### Delayed Redirect

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTimeout } from "@usefy/use-timeout";

function PaymentSuccess() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  const { clear } = useTimeout(() => {
    navigate("/dashboard");
  }, 5000);

  // Countdown effect
  useInterval(() => {
    setCountdown((c) => c - 1);
  }, 1000);

  return (
    <div>
      <h1>Payment Successful!</h1>
      <p>Redirecting to dashboard in {countdown} seconds...</p>
      <button onClick={clear}>Stay on this page</button>
    </div>
  );
}
```

### Timer Status Display

```tsx
import { useTimeout } from "@usefy/use-timeout";

function TimerStatus() {
  const { isPending, reset, clear } = useTimeout(() => {
    console.log("Timer executed!");
  }, 5000);

  return (
    <div>
      <p>Status: {isPending ? "Pending..." : "Completed or Cancelled"}</p>
      <button onClick={reset} disabled={isPending}>
        Restart
      </button>
      <button onClick={clear} disabled={!isPending}>
        Cancel
      </button>
    </div>
  );
}
```

### Notification Queue

```tsx
import { useState, useCallback } from "react";
import { useTimeout } from "@usefy/use-timeout";

function NotificationBanner() {
  const [notification, setNotification] = useState<string | null>(null);

  const { reset } = useTimeout(
    () => {
      setNotification(null);
    },
    notification ? 4000 : null
  );

  const showNotification = useCallback(
    (message: string) => {
      setNotification(message);
      reset();
    },
    [reset]
  );

  return (
    <>
      {notification && (
        <div className="notification-banner">{notification}</div>
      )}
      <button onClick={() => showNotification("New message!")}>
        Show Notification
      </button>
    </>
  );
}
```

---

## TypeScript

This hook is written in TypeScript and exports all necessary types.

```tsx
import {
  useTimeout,
  type UseTimeoutReturn,
  type TimeoutDelay,
  type UseTimeoutCallback,
} from "@usefy/use-timeout";

// Return type is fully typed
const { reset, clear, isPending }: UseTimeoutReturn = useTimeout(() => {
  console.log("Executed!");
}, 3000);

// reset: () => void
// clear: () => void
// isPending: boolean
```

---

## Performance

All functions returned by the hook are memoized using `useCallback`, ensuring stable references across re-renders. The callback reference is maintained with `useRef` to prevent timer resets when the callback changes.

```tsx
const { reset, clear } = useTimeout(callback, 1000);

// These references remain stable across renders
useEffect(() => {
  // Safe to use as dependencies
}, [reset, clear]);

// Changing callback doesn't reset the timer
// Only the latest callback will be executed
```

---

## Edge Cases

| Scenario                         | Behavior                                  |
| -------------------------------- | ----------------------------------------- |
| `delay < 0`                      | Treated as 0 (immediate execution)        |
| `delay === 0`                    | Executes on next event loop               |
| `delay === null`                 | Timer disabled, `isPending` is `false`    |
| `delay === undefined`            | Timer disabled, `isPending` is `false`    |
| Unmount before delay             | Callback not executed, timer cleaned up   |
| Callback changes                 | Timer continues, latest callback executed |
| `reset()` when `delay` is `null` | No effect                                 |

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-timeout/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages)

---

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>
