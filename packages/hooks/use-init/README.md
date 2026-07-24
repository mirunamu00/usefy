<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-init</h1>

<p align="center">
  <strong>A powerful React hook for one-time initialization with async support, retry, timeout, and conditional execution</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-init">
    <img src="https://img.shields.io/npm/v/@usefy/use-init.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-init">
    <img src="https://img.shields.io/npm/dm/@usefy/use-init.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-init">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-init?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-init.svg?style=flat-square&color=007acc" alt="license" />
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
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-useinit--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/use-init` is a React hook for executing initialization logic exactly once when a component mounts. It supports synchronous and asynchronous callbacks, automatic retry on failure, timeout handling, conditional execution, and cleanup functions. Perfect for initializing services, loading configuration, setting up subscriptions, and any one-time setup tasks.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-init?

- **Zero Dependencies** — Pure React implementation with no external dependencies
- **TypeScript First** — Full type safety with exported interfaces
- **One-Time Execution** — Guarantees initialization runs only once per mount
- **Async Support** — Handles both synchronous and asynchronous initialization callbacks
- **Cleanup Functions** — Optional cleanup function support for resource management
- **Retry Logic** — Automatic retry with configurable attempts and delays
- **Timeout Handling** — Built-in timeout support with custom error handling
- **Conditional Execution** — Run initialization only when conditions are met
- **State Tracking** — Track initialization status, loading state, and errors
- **Manual Reinitialize** — Trigger re-initialization programmatically
- **SSR Compatible** — Works seamlessly with Next.js, Remix, and other SSR frameworks
- **Well Tested** — Comprehensive test coverage with Vitest

---

## Installation

```bash
# npm
npm install @usefy/use-init

# yarn
yarn add @usefy/use-init

# pnpm
pnpm add @usefy/use-init
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
import { useInit } from "@usefy/use-init";

function MyComponent() {
  const { isInitialized, isInitializing, error } = useInit(async () => {
    await loadConfiguration();
    console.log("Component initialized!");
  });

  if (isInitializing) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!isInitialized) return null;

  return <div>Ready!</div>;
}
```

---

## API Reference

### `useInit(callback, options?)`

A hook that executes initialization logic exactly once when the component mounts (or when conditions are met).

#### Parameters

| Parameter  | Type             | Default | Description                              |
| ---------- | ---------------- | ------- | ---------------------------------------- |
| `callback` | `InitCallback`   | —       | The initialization function to run       |
| `options`  | `UseInitOptions` | `{}`    | Configuration options for initialization |

#### Callback Type

The callback can be:

- **Synchronous**: `() => void`
- **Asynchronous**: `() => Promise<void>`
- **With cleanup**: `() => void | CleanupFn` or `() => Promise<void | CleanupFn>`

Where `CleanupFn` is `() => void` - a function that will be called when the component unmounts or before re-initialization.

#### Options

| Option       | Type      | Default | Description                                         |
| ------------ | --------- | ------- | --------------------------------------------------- |
| `when`       | `boolean` | `true`  | Only run initialization when this condition is true |
| `retry`      | `number`  | `0`     | Number of retry attempts on failure                 |
| `retryDelay` | `number`  | `1000`  | Delay between retry attempts in milliseconds        |
| `timeout`    | `number`  | —       | Timeout for initialization in milliseconds          |

#### Returns `UseInitResult`

| Property         | Type            | Description                                                    |
| ---------------- | --------------- | -------------------------------------------------------------- |
| `isInitialized`  | `boolean`       | Whether initialization has completed successfully              |
| `isInitializing` | `boolean`       | Whether initialization is currently in progress                |
| `error`          | `Error \| null` | Error that occurred during initialization, if any              |
| `reinitialize`   | `() => void`    | Manually trigger re-initialization (respects `when` condition) |

---

## Examples

### Basic Synchronous Initialization

```tsx
import { useInit } from "@usefy/use-init";

function BasicComponent() {
  useInit(() => {
    console.log("Component initialized!");
    initializeAnalytics();
  });

  return <div>My Component</div>;
}
```

### Async Initialization with Status Tracking

```tsx
import { useInit } from "@usefy/use-init";

function DataLoader() {
  const [data, setData] = useState(null);
  const { isInitialized, isInitializing, error } = useInit(async () => {
    const response = await fetch("/api/data");
    const result = await response.json();
    setData(result);
  });

  if (isInitializing) return <div>Loading data...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!isInitialized) return null;

  return <div>{JSON.stringify(data)}</div>;
}
```

### With Cleanup Function

```tsx
import { useInit } from "@usefy/use-init";

function SubscriptionComponent() {
  useInit(() => {
    const subscription = eventBus.subscribe("event", handleEvent);

    // Return cleanup function
    return () => {
      subscription.unsubscribe();
    };
  });

  return <div>Subscribed to events</div>;
}
```

### Conditional Initialization

```tsx
import { useInit } from "@usefy/use-init";

function ConditionalComponent({ isEnabled }: { isEnabled: boolean }) {
  const { isInitialized } = useInit(
    () => {
      initializeFeature();
    },
    { when: isEnabled }
  );

  if (!isEnabled) return <div>Feature disabled</div>;
  if (!isInitialized) return <div>Initializing...</div>;

  return <div>Feature ready!</div>;
}
```

### With Retry Logic

```tsx
import { useInit } from "@usefy/use-init";

function ResilientComponent() {
  const { isInitialized, error, reinitialize } = useInit(
    async () => {
      await connectToServer();
    },
    {
      retry: 3,
      retryDelay: 1000, // Wait 1 second between retries
    }
  );

  if (error) {
    return (
      <div>
        <p>Failed to connect: {error.message}</p>
        <button onClick={reinitialize}>Retry</button>
      </div>
    );
  }

  if (!isInitialized) return <div>Connecting...</div>;

  return <div>Connected!</div>;
}
```

### With Timeout

```tsx
import { useInit } from "@usefy/use-init";

function TimeoutComponent() {
  const { isInitialized, error } = useInit(
    async () => {
      await slowOperation();
    },
    {
      timeout: 5000, // Fail after 5 seconds
    }
  );

  if (error) {
    return <div>Timeout: {error.message}</div>;
  }

  if (!isInitialized) return <div>Processing...</div>;

  return <div>Completed!</div>;
}
```

### Combined Options: Retry + Timeout + Conditional

```tsx
import { useInit } from "@usefy/use-init";

function AdvancedComponent({ shouldInit }: { shouldInit: boolean }) {
  const { isInitialized, isInitializing, error, reinitialize } = useInit(
    async () => {
      await initializeService();
    },
    {
      when: shouldInit,
      retry: 2,
      retryDelay: 2000,
      timeout: 10000,
    }
  );

  if (!shouldInit) return <div>Waiting for condition...</div>;
  if (isInitializing) return <div>Initializing (attempt in progress)...</div>;
  if (error) {
    return (
      <div>
        <p>Error: {error.message}</p>
        <button onClick={reinitialize}>Try Again</button>
      </div>
    );
  }
  if (!isInitialized) return <div>Not initialized</div>;

  return <div>Service initialized successfully!</div>;
}
```

### Manual Re-initialization

```tsx
import { useInit } from "@usefy/use-init";

function RefreshableComponent() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { isInitialized, reinitialize } = useInit(async () => {
    await loadData();
  });

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    reinitialize();
  };

  return (
    <div>
      <button onClick={handleRefresh}>Refresh Data</button>
      {isInitialized && <div>Data loaded (key: {refreshKey})</div>}
    </div>
  );
}
```

### Async Cleanup Function

```tsx
import { useInit } from "@usefy/use-init";

function AsyncCleanupComponent() {
  useInit(async () => {
    const connection = await establishConnection();

    // Return async cleanup function
    return async () => {
      await connection.close();
      console.log("Connection closed");
    };
  });

  return <div>Connected</div>;
}
```

### Initializing Multiple Services

```tsx
import { useInit } from "@usefy/use-init";

function MultiServiceComponent() {
  const analytics = useInit(() => {
    initializeAnalytics();
    return () => analyticsService.shutdown();
  });

  const logging = useInit(async () => {
    await initializeLogging();
    return () => loggingService.disconnect();
  });

  const config = useInit(async () => {
    const config = await loadConfig();
    return config;
  });

  const allReady =
    analytics.isInitialized && logging.isInitialized && config.isInitialized;

  if (!allReady) return <div>Initializing services...</div>;

  return <div>All services ready!</div>;
}
```

---

## TypeScript

This hook is written in TypeScript with full type safety.

```tsx
import {
  useInit,
  type UseInitOptions,
  type UseInitResult,
  type InitCallback,
  type CleanupFn,
} from "@usefy/use-init";

// Basic usage with type inference
const { isInitialized } = useInit(() => {
  console.log("Init");
});

// With options
const options: UseInitOptions = {
  when: true,
  retry: 3,
  retryDelay: 1000,
  timeout: 5000,
};

const result: UseInitResult = useInit(async () => {
  await initialize();
}, options);

// Cleanup function types
useInit(() => {
  const resource = createResource();
  return () => {
    // TypeScript knows this is a cleanup function
    resource.cleanup();
  };
});
```

---

## Behavior Details

### One-Time Execution

The hook guarantees that initialization runs only once per component mount. Even if the `callback` reference changes, initialization will not run again unless:

- The component unmounts and remounts
- `reinitialize()` is called manually
- The `when` condition changes from `false` to `true` (after initial mount)

### Conditional Execution (`when`)

When `when` is `false`:

- Initialization does not run
- If `when` changes from `false` to `true`, initialization will run
- If initialization was already successful, it will not run again even if `when` becomes `true` again

### Retry Logic

When `retry` is set to `n`, the hook will attempt initialization up to `n + 1` times (initial attempt + `n` retries). Between attempts, it waits for `retryDelay` milliseconds.

### Timeout

When `timeout` is set:

- For async callbacks, a race condition is created between the callback and timeout
- If timeout expires first, an `InitTimeoutError` is thrown
- For sync callbacks, timeout is cleared immediately after execution

> **Note:** If an async callback loses the race but later resolves with a cleanup
> function, that cleanup would otherwise be orphaned (the hook has already moved on
> to retry or failure). `useInit` guards against this by invoking such a
> late-arriving cleanup immediately, so the resource it holds is still released.

### Cleanup Functions

If the callback returns a cleanup function:

- It is called when the component unmounts
- It is called before re-initialization (when `reinitialize()` is called)
- It can be synchronous or asynchronous
- Only one cleanup function is stored at a time

### Error Handling

- Errors during initialization are caught and stored in the `error` property
- If retry is enabled, errors trigger retry attempts
- After all retries fail, the final error is stored
- Errors do not prevent component rendering

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability. The suite (39 tests) covers **100% of statements and lines**, **95% of branches**, and **92% of functions**, including StrictMode double-invocation and throwing-cleanup safety.

### Test Coverage

📊 <a href="https://mirunamu00.github.io/usefy/coverage/hooks/use-init/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages)

### Test Categories

The following categories map directly to the `describe` blocks in [`useInit.test.ts`](./src/useInit.test.ts):

<details>
<summary><strong>Initialization</strong></summary>

- Returns the correct result shape
- Runs the callback once on mount (sync and async)
- Runs only once across re-renders

</details>

<details>
<summary><strong>Cleanup</strong></summary>

- Calls the cleanup function on unmount (sync and async)
- Releases a cleanup that arrives after unmount (async)
- Calls the previous cleanup before re-initialization

</details>

<details>
<summary><strong>Conditional execution (<code>when</code>)</strong></summary>

- Does not run when `when` is `false`
- Runs when `when` is `true`
- Runs when `when` changes from `false` to `true`
- Does not run again after a `true → false → true` toggle once initialized

</details>

<details>
<summary><strong>Retry</strong></summary>

- Retries on failure and succeeds within the attempt budget
- Fails after exhausting retries
- Respects `retryDelay` between attempts

</details>

<details>
<summary><strong>Timeout</strong></summary>

- Times out a callback that takes too long
- Succeeds when the callback completes before the timeout
- Leaves sync callbacks unaffected by the `timeout` option

</details>

<details>
<summary><strong>Reinitialize</strong></summary>

- Allows manual reinitialize
- Respects the `when` condition on reinitialize
- Keeps a stable `reinitialize` reference

</details>

<details>
<summary><strong>Edge cases</strong></summary>

- Handles errors in sync and async callbacks
- Converts non-`Error` throws to `Error`
- Maintains separate state across multiple instances
- Does not update state after unmount

</details>

<details>
<summary><strong>Combined options</strong></summary>

- Works with `retry` and `timeout` together
- Works with `when` and `retry` together

</details>

<details>
<summary><strong>StrictMode</strong></summary>

- Keeps a sync cleanup subscription active after a StrictMode double-mount
- Does not double-invoke an async callback under StrictMode

</details>

<details>
<summary><strong>Resilience</strong></summary>

- Does not wedge the hook when the cleanup throws on reinitialize
- Does not throw on unmount when the cleanup throws
- Ignores reinitialize calls while an init is already in progress
- Invokes the latest callback on reinitialize after the prop changes
- Keeps a stable `reinitialize` identity when `when` or options change
- Stops retrying and does not update state after unmount during a retry
- Releases a cleanup returned by a callback that resolves after the timeout

</details>

<details>
<summary><strong>Initial state</strong></summary>

- Reports `isInitializing` on the first commit when `when` is `true`
- Reports not initializing on the first commit when `when` is `false`

</details>

---

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>
