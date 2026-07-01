<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-list</h1>

<p align="center">
  <strong>A React hook for managing array state with immutable updates</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-list">
    <img src="https://img.shields.io/npm/v/@usefy/use-list.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-list">
    <img src="https://img.shields.io/npm/dm/@usefy/use-list.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-list">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-list?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-list.svg?style=flat-square&color=007acc" alt="license" />
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
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-uselist--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/use-list` manages an array as React state with immutable, ergonomic updates. Every mutation produces a brand-new array (so React re-renders correctly and the previous state is never mutated), and the returned list is typed as `readonly T[]` to steer you toward the provided actions.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-list?

- **Zero Dependencies** — Pure React implementation
- **TypeScript First** — Full `<T>` generics with exported types
- **Immutable Updates** — New array on every change; `readonly T[]` return type prevents accidental in-place mutation
- **Rich Action Set** — `set`, `push`, `filter`, `sort`, `clear`, `removeAt`, `insertAt`, `updateAt`, `reset`
- **`set` with updater** — `set(prev => [...prev, item])`, just like `useState`
- **Stable Actions** — Action identities never change, so they're safe as `useEffect` dependencies
- **No Wasted Renders** — No-op updates (out-of-range index, empty clear, unchanged value, filtering out nothing) are skipped
- **Lazy Initialization** — Accepts an array/iterable or a factory

---

## Installation

```bash
# npm
npm install @usefy/use-list

# yarn
yarn add @usefy/use-list

# pnpm
pnpm add @usefy/use-list
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
import { useList } from "@usefy/use-list";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

function TodoApp() {
  const [todos, { push, removeAt, updateAt }] = useList<Todo>([]);

  const addTodo = (text: string) =>
    push({ id: Date.now(), text, completed: false });

  const toggleTodo = (index: number) => {
    const todo = todos[index];
    updateAt(index, { ...todo, completed: !todo.completed });
  };

  return (
    <ul>
      {todos.map((todo, i) => (
        <li key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(i)}
          />
          {todo.text}
          <button onClick={() => removeAt(i)}>×</button>
        </li>
      ))}
    </ul>
  );
}
```

---

## API Reference

### `useList<T>(initialState?)`

Returns a tuple of the current read-only list and a stable actions object.

#### Parameters

| Parameter      | Type                  | Default | Description                                                    |
| -------------- | --------------------- | ------- | -------------------------------------------------------------- |
| `initialState` | `ListInitializer<T>`  | empty   | An array/iterable of items, or a factory returning one (evaluated once) |

#### Returns `[list, actions]`

| Item      | Type                 | Description                                    |
| --------- | -------------------- | ---------------------------------------------- |
| `list`    | `readonly T[]`       | Current list. Read via index, `map`, iteration |
| `actions` | `UseListActions<T>`  | Stable action handlers (see below)             |

#### Actions

| Action     | Signature                                                       | Description                                                            |
| ---------- | -------------------------------------------------------------- | --------------------------------------------------------------------- |
| `set`      | `(next: T[] \| ((prev: readonly T[]) => T[])) => void`         | Replace the whole list, by value or updater                          |
| `push`     | `(...items: T[]) => void`                                      | Append one or more items                                             |
| `filter`   | `(predicate: (item: T, index: number) => boolean) => void`    | Keep only matching items (no-op if nothing removed)                  |
| `sort`     | `(compareFn?: (a: T, b: T) => number) => void`                | Sort immutably (the current list is not mutated)                    |
| `clear`    | `() => void`                                                   | Remove all items (no-op if already empty)                           |
| `removeAt` | `(index: number) => void`                                     | Remove the item at `index` (no-op if out of range)                  |
| `insertAt` | `(index: number, ...items: T[]) => void`                      | Insert item(s) at `index` (index clamped to `[0, length]`)          |
| `updateAt` | `(index: number, item: T) => void`                            | Replace the item at `index` (no-op if out of range or unchanged)    |
| `reset`    | `() => void`                                                   | Restore the initial items (a fresh copy)                            |

> The returned `list` is `readonly T[]`, so calling `list.push(...)` directly is a TypeScript error. Use the actions — mutating the array in place would bypass React state and break re-renders.

---

## Examples

### Functional set, sort, filter

```tsx
const [nums, { set, sort, filter }] = useList<number>([3, 1, 2]);

set((prev) => [...prev, 4]);   // append via updater
sort((a, b) => a - b);          // immutable ascending sort
filter((n) => n % 2 === 0);     // keep evens
```

### Insert and reorder

```tsx
const [steps, { insertAt, removeAt }] = useList<string>(["start", "end"]);

insertAt(1, "middle");   // ["start", "middle", "end"]
removeAt(0);             // ["middle", "end"]
```

### Reset to initial

```tsx
const [items, { push, reset }] = useList<string>(["a", "b"]);

push("c");
reset(); // back to ["a", "b"]
```

### Stable actions as effect dependencies

```tsx
const [log, actions] = useList<string>();

useEffect(() => {
  const unsub = subscribe((line) => actions.push(line));
  return unsub;
}, [actions]); // actions never changes identity — effect runs once
```

---

## TypeScript

```tsx
import {
  useList,
  type ListInitializer,
  type UseListActions,
  type UseListReturn,
} from "@usefy/use-list";

const [list, actions]: UseListReturn<number> = useList<number>([1, 2, 3]);
```

---

## Behavior Notes

- **Immutable** — Actions never mutate the current list; they replace it with a new one. Any snapshot you captured stays valid.
- **Referentially stable actions** — The actions object and each function keep the same identity for the lifetime of the component.
- **Initial value is copied** — The array you pass in is never mutated, and `reset` always yields a fresh copy of it.
- **No-op skipping** — Updates that wouldn't change anything don't create a new array or trigger a re-render.

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-list/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages)

### Test Files

- `useList.test.ts` — 30 tests for hook behavior and immutability

**Total: 30 tests**

---

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>
