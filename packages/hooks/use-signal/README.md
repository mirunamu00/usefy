<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-signal</h1>

<p align="center">
  <strong>A lightweight React hook for event-driven communication between components</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-signal">
    <img src="https://img.shields.io/npm/v/@usefy/use-signal.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-signal">
    <img src="https://img.shields.io/npm/dm/@usefy/use-signal.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-signal">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-signal?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-signal.svg?style=flat-square&color=007acc" alt="license" />
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
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usesignal--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/use-signal` enables event-driven communication between React components without prop drilling or complex state management setup. Components subscribe to a shared "signal" by name, and when any component emits that signal, all subscribers receive an update.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-signal?

- **Zero Dependencies** — Pure React implementation with no external dependencies
- **TypeScript First** — Full type safety with exported interfaces
- **Stable References** — `emit` and `info` maintain stable references across re-renders
- **SSR Compatible** — Works seamlessly with Next.js, Remix, and other SSR frameworks
- **Lightweight** — Minimal bundle footprint (~1KB minified + gzipped)
- **Well Tested** — Comprehensive test coverage with Vitest
- **React 18+ Optimized** — Uses `useSyncExternalStore` for concurrent mode compatibility

### Use Cases

- **Dashboard Refresh** — Refresh multiple widgets with a single button click
- **Form Reset** — Reset multiple form sections simultaneously
- **Cache Invalidation** — Invalidate and reload data across components
- **Multi-step Flows** — Coordinate state across wizard steps
- **Event Broadcasting** — Notify multiple listeners about system events

### ⚠️ What This Hook Is NOT

**`useSignal` is NOT a global state management solution.**

This hook is designed for lightweight event-driven communication—sharing simple "signals" between components without the overhead of complex state management setup.

If you need:
- Complex shared state with derived values
- Persistent state across page navigation
- State that drives business logic
- Fine-grained state updates with selectors

→ Use dedicated state management tools like **React Context**, **Zustand**, **Jotai**, **Recoil**, or **Redux**.

**About `info.data`:** The data payload feature exists for cases where you need to pass contextual information along with a signal (e.g., which item was clicked, what action was performed). It's meant for event metadata, not as a global state container.

```tsx
// ✅ Good: Signal with contextual data
emit({ itemId: "123", action: "refresh" });

// ❌ Bad: Using as global state
emit({ user: userData, cart: cartItems, settings: appSettings });
```

---

## Installation

```bash
# npm
npm install @usefy/use-signal

# yarn
yarn add @usefy/use-signal

# pnpm
pnpm add @usefy/use-signal
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
import { useSignal } from "@usefy/use-signal";
import { useEffect } from "react";

// Emitter Component
function RefreshButton() {
  const { emit } = useSignal("dashboard-refresh");

  return <button onClick={emit}>Refresh Dashboard</button>;
}

// Subscriber Component
function DataWidget() {
  const { signal } = useSignal("dashboard-refresh");

  useEffect(() => {
    fetchData(); // Refetch when signal changes
  }, [signal]);

  return <div>Widget Content</div>;
}
```

---

## API Reference

### `useSignal(name, options?)`

A hook that subscribes to a named signal and provides emit functionality.

#### Parameters

| Parameter | Type            | Description                        |
| --------- | --------------- | ---------------------------------- |
| `name`    | `string`        | Unique identifier for the signal   |
| `options` | `SignalOptions` | Optional configuration (see below) |

#### Options

```typescript
interface SignalOptions {
  emitOnMount?: boolean; // Emit when component mounts (default: false)
  onEmit?: () => void; // Callback executed on emit
  enabled?: boolean; // Enable/disable subscription (default: true)
  debounce?: number; // Debounce emit calls in milliseconds
}
```

#### Returns `UseSignalReturn<T>`

| Property | Type              | Description                                 |
| -------- | ----------------- | ------------------------------------------- |
| `signal` | `number`          | Current version number (use in deps arrays) |
| `emit`   | `(data?: T) => void` | Function to emit the signal with optional data |
| `info`   | `SignalInfo<T>`   | Metadata object (see below)                 |

#### SignalInfo

```typescript
interface SignalInfo<T = unknown> {
  readonly name: string; // Signal name
  readonly subscriberCount: number; // Active subscribers
  readonly timestamp: number; // Last emit timestamp
  readonly emitCount: number; // Total emit count
  readonly data: T | undefined; // Data passed with last emit
}
```

> **Note:** `info` is a stable object whose fields are **read-on-render snapshots, not reactive state**. Reading a field (including `info.subscriberCount`) does _not_ subscribe the component to changes in that value — it only reflects new data on renders that happen for another reason (e.g. after `signal` changes). In particular, `info.subscriberCount` will look stale if you bind it to UI (like a badge or button label) in a component that isn't itself re-rendering when other subscribers mount/unmount. Drive live UI from the `signal` version, and read the latest `info.data` inside a `useEffect` keyed on `signal`.

---

## Examples

### Dashboard Refresh Pattern

```tsx
import { useSignal } from "@usefy/use-signal";
import { useEffect, useState } from "react";

function RefreshButton() {
  const { emit } = useSignal("dashboard-refresh");

  return <button onClick={emit}>Refresh All</button>;
}

function SalesChart() {
  const { signal } = useSignal("dashboard-refresh");
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchSalesData().then(setData);
  }, [signal]);

  return <Chart data={data} />;
}

function UserStats() {
  const { signal } = useSignal("dashboard-refresh");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchUserStats().then(setStats);
  }, [signal]);

  return <Stats data={stats} />;
}
```

### Form Reset

```tsx
import { useSignal } from "@usefy/use-signal";

function ResetButton() {
  const { emit } = useSignal("form-reset");
  return <button onClick={emit}>Reset All Fields</button>;
}

function PersonalInfoSection() {
  const { signal } = useSignal("form-reset");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (signal > 0) {
      setName("");
      setEmail("");
    }
  }, [signal]);

  return (
    <section>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
    </section>
  );
}
```

### With Data Payload

```tsx
import { useSignal } from "@usefy/use-signal";
import { useEffect } from "react";

interface NotificationData {
  type: "success" | "error" | "info";
  message: string;
}

function NotificationEmitter() {
  const { emit } = useSignal<NotificationData>("notification");

  return (
    <button
      onClick={() =>
        emit({ type: "success", message: "Operation completed!" })
      }
    >
      Send Notification
    </button>
  );
}

function NotificationReceiver() {
  const { signal, info } = useSignal<NotificationData>("notification");

  useEffect(() => {
    if (signal > 0 && info.data) {
      // info.data is guaranteed to contain the latest data
      console.log(`[${info.data.type}] ${info.data.message}`);
    }
  }, [signal]);

  return <div>Last: {info.data?.message ?? "No notifications"}</div>;
}
```

### With Debounce

```tsx
import { useSignal } from "@usefy/use-signal";

function SearchInput() {
  const { emit } = useSignal<string>("search-update", { debounce: 300 });

  return (
    <input
      type="text"
      onChange={(e) => {
        emit(e.target.value); // Debounced - uses latest value after 300ms
      }}
    />
  );
}
```

### Conditional Subscription

```tsx
import { useSignal } from "@usefy/use-signal";

function ConditionalWidget({ visible }: { visible: boolean }) {
  // Only subscribe when visible
  const { signal } = useSignal("updates", { enabled: visible });

  useEffect(() => {
    if (signal > 0) {
      refreshData();
    }
  }, [signal]);

  if (!visible) return null;
  return <div>Widget Content</div>;
}
```

### With onEmit Callback

```tsx
import { useSignal } from "@usefy/use-signal";

function LoggingEmitter() {
  const { emit } = useSignal("analytics-event", {
    onEmit: () => {
      console.log("Event emitted at", new Date().toISOString());
      trackAnalytics("signal_emitted");
    },
  });

  return <button onClick={emit}>Track Event</button>;
}
```

### Emit on Mount

```tsx
import { useSignal } from "@usefy/use-signal";

function AutoRefreshComponent() {
  const { signal } = useSignal("data-refresh", { emitOnMount: true });

  useEffect(() => {
    // This runs immediately on mount due to emitOnMount
    fetchLatestData();
  }, [signal]);

  return <div>Auto-refreshed content</div>;
}
```

### Using Info for Conditional Logic

```tsx
import { useSignal } from "@usefy/use-signal";

function SmartEmitter() {
  const { emit, info } = useSignal("notification");

  const handleClick = () => {
    // Reading info in an event handler is the correct pattern: it samples the
    // current value at click time. (Don't rely on info.subscriberCount in JSX
    // for a live count — it won't re-render on its own; see the API note.)
    if (info.subscriberCount > 0) {
      emit();
    } else {
      console.log("No subscribers, skipping emit");
    }
  };

  return <button onClick={handleClick}>Notify</button>;
}
```

---

## TypeScript

This hook is written in TypeScript and exports all interfaces. Use generics to type the data payload.

```tsx
import {
  useSignal,
  type UseSignalReturn,
  type SignalOptions,
  type SignalInfo,
} from "@usefy/use-signal";

// With typed data payload
interface MyEventData {
  action: string;
  payload: Record<string, unknown>;
}

const { signal, emit, info }: UseSignalReturn<MyEventData> = useSignal<MyEventData>(
  "my-signal",
  {
    emitOnMount: true,
    onEmit: () => console.log("emitted"),
    enabled: true,
    debounce: 100,
  }
);

// signal: number
// emit: (data?: MyEventData) => void
// info: SignalInfo<MyEventData>
// info.data: MyEventData | undefined
```

---

## Performance

### Stable References

The `emit` function and `info` object maintain stable references across re-renders:

```tsx
const { emit, info } = useSignal<MyData>("my-signal");

// emit reference remains stable
useEffect(() => {
  // Safe to use as dependencies
}, [emit]);

// info is a ref-based object - stable reference, live values via getters
console.log(info.subscriberCount); // Always current
console.log(info.data); // Latest data from last emit
```

### Data Ordering Guarantee

When `emit(data)` is called, the data is stored **before** the signal version increments:

```tsx
const { signal, info } = useSignal<string>("my-signal");

useEffect(() => {
  // This is guaranteed: info.data contains the data passed to emit()
  // that triggered this signal change
  console.log(info.data); // Always the latest data
}, [signal]);
```

### Minimal Re-renders

- Only subscribed components re-render when signal is emitted
- The signal value is a primitive number, optimized for dependency arrays
- Uses React 18's `useSyncExternalStore` for optimal concurrent mode support

---

## How It Works

1. **Global Store**: A singleton Map stores signal data (version, subscribers, metadata, payload data)
2. **Subscription**: Components subscribe via `useSyncExternalStore`
3. **Emit**: Sets data → Increments version → Updates timestamp → Notifies all subscribers
4. **Cleanup**: Automatic unsubscription on unmount

> **Key Design**: Data is set **before** version increment to ensure `useEffect` callbacks always see the latest `info.data`.

```
┌─────────────┐     emit()      ┌─────────────┐
│  Component  │ ───────────────▶│   Signal    │
│   Emitter   │                 │   Store     │
└─────────────┘                 └──────┬──────┘
                                       │
                        notify all subscribers
                                       │
              ┌────────────────────────┼────────────────────────┐
              ▼                        ▼                        ▼
      ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
      │ Subscriber  │          │ Subscriber  │          │ Subscriber  │
      │     A       │          │     B       │          │     C       │
      └─────────────┘          └─────────────┘          └─────────────┘
```

---

## Testing

This package maintains **98%+ test coverage** (51 tests) to ensure reliability and stability, including StrictMode double-invoke, store eviction, SSR, and debounce edge cases.

### Test Categories

<details>
<summary><strong>Initialization Tests</strong></summary>

- Initial signal value is 0
- Returns all required properties (signal, emit, info)
- Info object contains correct properties
- Subscriber count tracking

</details>

<details>
<summary><strong>Emit Tests</strong></summary>

- Signal increments on emit
- Multiple emits increment correctly
- Emit count and timestamp update
- Rapid successive emits

</details>

<details>
<summary><strong>Data Payload Tests</strong></summary>

- Data stored in info.data on emit
- Data updates on each emit
- Data shared across subscribers
- Data ordering guarantee (available before signal changes)
- Complex object data support
- Debounced emit uses latest data

</details>

<details>
<summary><strong>Multi-Subscriber Tests</strong></summary>

- All subscribers receive signal updates
- Subscriber count accuracy
- Cleanup on unmount

</details>

<details>
<summary><strong>Options Tests</strong></summary>

- emitOnMount behavior
- onEmit callback execution
- enabled option subscription control
- debounce timing

</details>

<details>
<summary><strong>Stable Reference Tests</strong></summary>

- Emit function stability
- Info object stability
- Values update with stable reference
- Changing `onEmit` identity does not resubscribe

</details>

<details>
<summary><strong>StrictMode & SSR Tests</strong></summary>

- `emitOnMount` fires exactly once under `React.StrictMode`
- No double-subscription under StrictMode
- Server snapshot renders `0` without touching the store

</details>

<details>
<summary><strong>Store Eviction Tests</strong></summary>

- Entry is evicted once the last subscriber unmounts
- Version / emitCount reset for a fresh mount of the same name
- Entry survives while at least one subscriber remains

</details>

<details>
<summary><strong>Edge Case Tests</strong></summary>

- Dynamic `enabled` toggle subscribes / unsubscribes correctly
- Pending debounced emit is cancelled when `name` changes mid-flight

</details>

---

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>
