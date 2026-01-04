<p align="center">
  <img src="https://raw.githubusercontent.com/geon0529/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
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
  <a href="https://github.com/geon0529/usefy/blob/master/LICENSE">
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
  <a href="https://geon0529.github.io/usefy/?path=/docs/hooks-useinit--docs" target="_blank" rel="noopener noreferrer">
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

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

📊 <a href="https://geon0529.github.io/usefy/coverage/use-init/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages)

### Test Categories

<details>
<summary><strong>Basic Initialization Tests</strong></summary>

- Run callback once on mount
- Not run callback again on re-render
- Support synchronous callbacks
- Support asynchronous callbacks
- Track initialization state correctly

</details>

<details>
<summary><strong>Cleanup Function Tests</strong></summary>

- Call cleanup function on unmount
- Call cleanup function before re-initialization
- Support synchronous cleanup functions
- Support asynchronous cleanup functions
- Handle cleanup function errors gracefully
- Not call cleanup if callback doesn't return one

</details>

<details>
<summary><strong>Conditional Execution Tests</strong></summary>

- Not run when `when` is false
- Run when `when` changes from false to true
- Not run again if already initialized
- Respect `when` condition in `reinitialize()`

</details>

<details>
<summary><strong>Retry Logic Tests</strong></summary>

- Retry on failure with correct number of attempts
- Wait correct delay between retries
- Stop retrying after successful attempt
- Store final error after all retries fail
- Not retry if component unmounts during retry

</details>

<details>
<summary><strong>Timeout Tests</strong></summary>

- Timeout async callbacks that exceed timeout
- Not timeout sync callbacks
- Clear timeout after successful execution
- Throw InitTimeoutError on timeout
- Handle timeout with retry logic

</details>

<details>
<summary><strong>Manual Re-initialization Tests</strong></summary>

- Reinitialize when `reinitialize()` is called
- Respect `when` condition in `reinitialize()`
- Clean up previous initialization before re-running
- Update state correctly after re-initialization

</details>

<details>
<summary><strong>State Management Tests</strong></summary>

- Track `isInitializing` state correctly
- Track `isInitialized` state correctly
- Track `error` state correctly
- Update state only when component is mounted
- Handle rapid state changes correctly

</details>

<details>
<summary><strong>Edge Cases Tests</strong></summary>

- Handle component unmount during initialization
- Handle component unmount during retry
- Prevent concurrent initializations
- Handle callback reference changes
- Handle undefined/null errors gracefully

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

## License

MIT © [mirunamu](https://github.com/geon0529)

This package is part of the [usefy](https://github.com/geon0529/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>
