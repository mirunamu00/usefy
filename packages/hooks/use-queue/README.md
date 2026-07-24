<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-queue</h1>

<p align="center">
  <strong>A React hook for managing FIFO queue state with immutable updates</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-queue">
    <img src="https://img.shields.io/npm/v/@usefy/use-queue.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-queue">
    <img src="https://img.shields.io/npm/dm/@usefy/use-queue.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-queue">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-queue?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-queue.svg?style=flat-square&color=007acc" alt="license" />
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
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usequeue--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/use-queue` manages a **FIFO** (first-in, first-out) queue as React state with immutable, ergonomic updates. Items are enqueued to the back and dequeued from the front. Every mutation produces a brand-new array (so React re-renders correctly and the previous state is never mutated), and the returned queue is typed as `readonly T[]` to steer you toward the provided actions.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-queue?

- **Zero Dependencies** — Pure React implementation
- **TypeScript First** — Full `<T>` generics with exported types
- **Immutable Updates** — New array on every change; `readonly T[]` return type prevents accidental in-place mutation
- **True FIFO** — `add` enqueues to the back, `remove` dequeues from the front **and returns the item**
- **Peek** — Read the front item without mutating; stable and always current
- **Stable Actions** — Action identities never change, so they're safe as `useEffect` dependencies
- **No Wasted Renders** — No-op updates (empty `add`, `remove`/`clear` on an empty queue) are skipped
- **Lazy Initialization** — Accepts an array, an iterable, or a factory — just like `useState`

---

## Installation

```bash
# npm
npm install @usefy/use-queue

# yarn
yarn add @usefy/use-queue

# pnpm
pnpm add @usefy/use-queue
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
import { useQueue } from "@usefy/use-queue";

interface Task {
  id: number;
  label: string;
}

function TaskRunner() {
  const [queue, { add, remove, peek }] = useQueue<Task>([]);

  const processNext = () => {
    const task = remove(); // dequeue + get the item in one call
    if (task) runTask(task);
  };

  return (
    <div>
      <button onClick={() => add({ id: Date.now(), label: "New" })}>
        Add task
      </button>
      <button onClick={processNext} disabled={queue.length === 0}>
        Process next {peek()?.label}
      </button>
      <p>Pending: {queue.length}</p>
    </div>
  );
}
```

---

## API Reference

### `useQueue<T>(initialState?)`

Returns a tuple of the current read-only queue and a stable actions object.

#### Parameters

| Parameter      | Type                   | Default | Description                                                                    |
| -------------- | ---------------------- | ------- | ------------------------------------------------------------------------------ |
| `initialState` | `QueueInitializer<T>`  | empty   | An array, an iterable of values, or a factory returning one (evaluated once). The first element becomes the front. |

#### Returns `[queue, actions]`

| Item      | Type                  | Description                                                            |
| --------- | --------------------- | --------------------------------------------------------------------- |
| `queue`   | `readonly T[]`        | Current queue. `queue[0]` is the front; the last item is the back     |
| `actions` | `UseQueueActions<T>`  | Stable action handlers (see below)                                    |

#### Actions

| Action   | Signature                    | Description                                                                       |
| -------- | ---------------------------- | --------------------------------------------------------------------------------- |
| `add`    | `(...items: T[]) => void`    | Enqueue one or more items to the back. Calling with no items is a no-op           |
| `remove` | `() => T \| undefined`       | Dequeue the front item and return it. Returns `undefined` (no-op) when empty      |
| `peek`   | `() => T \| undefined`       | Read the front item without mutating (stable, always reflects latest state)       |
| `clear`  | `() => void`                 | Remove all items. Clearing an empty queue is a no-op                              |
| `reset`  | `() => void`                 | Restore the initial values (a fresh copy)                                         |

#### Reading `first` / `last` / `size`

The returned queue is a read-only array, so these derive directly from it — no extra state needed:

```tsx
const [queue] = useQueue<number>([1, 2, 3]);

const first = queue[0];                    // 1  (front, next to dequeue)
const last = queue[queue.length - 1];      // 3  (back, most recently added)
const size = queue.length;                 // 3
```

> The returned `queue` is a `readonly T[]`, so calling `queue.push(...)` directly is a TypeScript error. Use the actions — mutating the array in place would bypass React state and break re-renders.

---

## Examples

### Task processor

```tsx
import { useQueue } from "@usefy/use-queue";

function TaskProcessor() {
  const [queue, { add, remove }] = useQueue<Task>([]);

  const enqueue = (task: Task) => add(task);

  const processNext = () => {
    const task = remove();
    if (task) handle(task);
  };

  return (
    <div>
      <button onClick={() => enqueue(makeTask())}>Add</button>
      <button onClick={processNext} disabled={queue.length === 0}>
        Process ({queue.length})
      </button>
    </div>
  );
}
```

### Batch enqueue, drain from the front

```tsx
const [queue, { add, remove, reset }] = useQueue<number>([1, 2]);

add(3, 4);   // queue: [1, 2, 3, 4]
remove();    // returns 1, queue: [2, 3, 4]
remove();    // returns 2, queue: [3, 4]
reset();     // back to [1, 2]
```

### Peek before processing

```tsx
const [queue, { peek, remove }] = useQueue<Job>([]);

// Decide based on the front without dequeuing
if (peek()?.priority === "high") {
  const job = remove();
  runNow(job!);
}
```

### Stable actions as effect dependencies

```tsx
const [queue, actions] = useQueue<Message>();

useEffect(() => {
  const unsub = socket.onMessage((msg) => actions.add(msg));
  return unsub;
}, [actions]); // actions never changes identity — effect runs once
```

---

## TypeScript

```tsx
import {
  useQueue,
  type QueueInitializer,
  type UseQueueActions,
  type UseQueueReturn,
} from "@usefy/use-queue";

const [queue, actions]: UseQueueReturn<number> = useQueue<number>([1, 2, 3]);
```

---

## Behavior Notes

- **FIFO** — `add` appends to the back; `remove` and `peek` operate on the front (`queue[0]`).
- **`remove` returns the item** — It dequeues and returns the front element in one call, or `undefined` when the queue is empty.
- **Synchronous dequeue** — The queue advances immediately, so calling `remove` several times in a row within the same event (before React re-renders) dequeues successive items: the first call returns the current front, the second returns the next item, and so on. Read the returned `queue` array after the render for the settled state.
- **Immutable** — Actions never mutate the current array; they replace it with a new one. Any snapshot you captured stays valid.
- **Referentially stable actions** — The actions object and each function keep the same identity for the lifetime of the component.
- **Initial value is copied** — The array/iterable you pass in is never mutated, and `reset` yields a fresh copy of it.
- **No-op skipping** — Updates that wouldn't change anything don't create a new array or trigger a re-render. This includes `reset` when the queue already equals its initial value.

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

📊 <a href="https://mirunamu00.github.io/usefy/coverage/hooks/use-queue/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages)

### Test Files

- `useQueue.test.ts` — 28 tests for hook behavior, FIFO semantics, and immutability

**Total: 28 tests**

---

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>
