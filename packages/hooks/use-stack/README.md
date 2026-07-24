<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-stack</h1>

<p align="center">
  <strong>A React hook for managing LIFO stack state with immutable updates</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-stack">
    <img src="https://img.shields.io/npm/v/@usefy/use-stack.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-stack">
    <img src="https://img.shields.io/npm/dm/@usefy/use-stack.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-stack">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-stack?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-stack.svg?style=flat-square&color=007acc" alt="license" />
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
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usestack--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/use-stack` manages a **LIFO** (last-in, first-out) stack as React state with immutable, ergonomic updates. It is the LIFO sibling of [`@usefy/use-queue`](https://www.npmjs.com/package/@usefy/use-queue) — identical in shape and conventions, but `push` and `pop` operate on the **same** end (the top). Items are pushed onto the top and popped from the top. Every mutation produces a brand-new array (so React re-renders correctly and the previous state is never mutated), and the returned stack is typed as `readonly T[]` to steer you toward the provided actions.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-stack?

- **Zero Dependencies** — Pure React implementation
- **TypeScript First** — Full `<T>` generics with exported types
- **Immutable Updates** — New array on every change; `readonly T[]` return type prevents accidental in-place mutation
- **True LIFO** — `push` and `pop` both operate on the top; `pop` **returns the popped item**
- **Peek** — Read the top item without mutating; stable and always current
- **Stable Actions** — Action identities never change, so they're safe as `useEffect` dependencies
- **No Wasted Renders** — No-op updates (empty `push`, `pop`/`clear` on an empty stack) are skipped
- **Lazy Initialization** — Accepts an array, an iterable, or a factory — just like `useState`

---

## Installation

```bash
# npm
npm install @usefy/use-stack

# yarn
yarn add @usefy/use-stack

# pnpm
pnpm add @usefy/use-stack
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
import { useStack } from "@usefy/use-stack";

interface Snapshot {
  id: number;
  label: string;
}

function Editor() {
  const [history, { push, pop, peek }] = useStack<Snapshot>([]);

  const undo = () => {
    const last = pop(); // remove + read the most recent change in one call
    if (last) restore(last);
  };

  return (
    <div>
      <button onClick={() => push({ id: Date.now(), label: "Edit" })}>
        Record change
      </button>
      <button onClick={undo} disabled={history.length === 0}>
        Undo {peek()?.label}
      </button>
      <p>History depth: {history.length}</p>
    </div>
  );
}
```

---

## API Reference

### `useStack<T>(initialState?)`

Returns a tuple of the current read-only stack and a stable actions object.

#### Parameters

| Parameter      | Type                   | Default | Description                                                                    |
| -------------- | ---------------------- | ------- | ------------------------------------------------------------------------------ |
| `initialState` | `StackInitializer<T>`  | empty   | An array, an iterable of values, or a factory returning one (evaluated once). The last element becomes the top. |

#### Returns `[stack, actions]`

| Item      | Type                  | Description                                                            |
| --------- | --------------------- | --------------------------------------------------------------------- |
| `stack`   | `readonly T[]`        | Current stack. The **last** item is the top; `stack[0]` is the bottom |
| `actions` | `UseStackActions<T>`  | Stable action handlers (see below)                                    |

#### Actions

| Action  | Signature                    | Description                                                                       |
| ------- | ---------------------------- | --------------------------------------------------------------------------------- |
| `push`  | `(...items: T[]) => void`    | Push one or more items onto the top (the last argument ends up on top). No items is a no-op |
| `pop`   | `() => T \| undefined`       | Remove the top item and return it. Returns `undefined` (no-op) when empty         |
| `peek`  | `() => T \| undefined`       | Read the top item without mutating (stable, always reflects latest state)         |
| `clear` | `() => void`                 | Remove all items. Clearing an empty stack is a no-op                              |
| `reset` | `() => void`                 | Restore the initial values (a fresh copy)                                         |

#### Reading `top` / `bottom` / `size`

The returned stack is a read-only array, so these derive directly from it — no extra state needed:

```tsx
const [stack] = useStack<number>([1, 2, 3]);

const top = stack[stack.length - 1];       // 3  (next to pop)
const bottom = stack[0];                    // 1  (oldest item)
const size = stack.length;                  // 3
```

> The returned `stack` is a `readonly T[]`, so calling `stack.push(...)` directly is a TypeScript error. Use the actions — mutating the array in place would bypass React state and break re-renders.

---

## Examples

### Undo history

```tsx
import { useStack } from "@usefy/use-stack";

function Editor() {
  const [history, { push, pop }] = useStack<Snapshot>([]);

  const record = (snapshot: Snapshot) => push(snapshot);

  const undo = () => {
    const last = pop();
    if (last) restore(last);
  };

  return (
    <div>
      <button onClick={() => record(snapshot())}>Record</button>
      <button onClick={undo} disabled={history.length === 0}>
        Undo ({history.length})
      </button>
    </div>
  );
}
```

### Push, pop from the top (LIFO)

```tsx
const [stack, { push, pop, reset }] = useStack<number>([1, 2]);

push(3, 4);  // stack: [1, 2, 3, 4]  (4 is the top)
pop();       // returns 4, stack: [1, 2, 3]
pop();       // returns 3, stack: [1, 2]
reset();     // back to [1, 2]
```

### Peek before popping

```tsx
const [stack, { peek, pop }] = useStack<Frame>([]);

// Decide based on the top without removing it
if (peek()?.type === "modal") {
  const frame = pop();
  close(frame!);
}
```

### Stable actions as effect dependencies

```tsx
const [stack, actions] = useStack<Route>();

useEffect(() => {
  const unsub = router.onNavigate((route) => actions.push(route));
  return unsub;
}, [actions]); // actions never changes identity — effect runs once
```

---

## TypeScript

```tsx
import {
  useStack,
  type StackInitializer,
  type UseStackActions,
  type UseStackReturn,
} from "@usefy/use-stack";

const [stack, actions]: UseStackReturn<number> = useStack<number>([1, 2, 3]);
```

---

## Behavior Notes

- **LIFO** — `push` appends to the top; `pop` and `peek` operate on the same end (the last element, `stack[stack.length - 1]`).
- **`pop` returns the item** — It removes and returns the top element in one call, or `undefined` when the stack is empty.
- **Batched `pop` caveat** — The value `pop` returns is the top at call time. If you call `pop` multiple times synchronously (before React re-renders), each call returns the same top snapshot, though the settled state shrinks correctly by that many items. Read the returned `stack` array after the render for the final state.
- **Immutable** — Actions never mutate the current array; they replace it with a new one. Any snapshot you captured stays valid.
- **Referentially stable actions** — The actions object and each function keep the same identity for the lifetime of the component.
- **Initial value is copied** — The array/iterable you pass in is never mutated, and `reset` always yields a fresh copy of it.
- **No-op skipping** — Updates that wouldn't change anything don't create a new array or trigger a re-render.

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

📊 <a href="https://mirunamu00.github.io/usefy/coverage/hooks/use-stack/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages)

### Test Files

- `useStack.test.ts` — 25 tests for hook behavior, LIFO semantics, and immutability

**Total: 25 tests**

---

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>
