<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-set</h1>

<p align="center">
  <strong>A React hook for managing Set state with immutable updates</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-set">
    <img src="https://img.shields.io/npm/v/@usefy/use-set.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-set">
    <img src="https://img.shields.io/npm/dm/@usefy/use-set.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-set">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-set?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-set.svg?style=flat-square&color=007acc" alt="license" />
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
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-useset--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/use-set` manages a JavaScript `Set` as React state with immutable, ergonomic updates. Every mutation produces a brand-new `Set` (so React re-renders correctly and the previous state is never mutated), and the returned set is typed as `ReadonlySet` to steer you toward the provided actions.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-set?

- **Zero Dependencies** — Pure React implementation
- **TypeScript First** — Full `<T>` generics with exported types
- **Immutable Updates** — New `Set` on every change; `ReadonlySet` return type prevents accidental in-place mutation
- **Complete Action Set** — `add`, `remove`, `toggle`, `has`, `clear`, `reset`
- **Smart `toggle`** — Optional `force` argument to set membership explicitly (like `DOMTokenList.toggle`)
- **Stable Actions** — Action identities never change, so they're safe as `useEffect` dependencies
- **No Wasted Renders** — No-op updates (adding an existing value, removing an absent value, clearing an empty set) are skipped
- **Lazy Initialization** — Accepts a `Set`, an iterable, or a factory — just like `useState`

---

## Installation

```bash
# npm
npm install @usefy/use-set

# yarn
yarn add @usefy/use-set

# pnpm
pnpm add @usefy/use-set
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
import { useSet } from "@usefy/use-set";

function ItemList({ items }: { items: Item[] }) {
  const [selected, { toggle, has }] = useSet<string>();

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          <label>
            <input
              type="checkbox"
              checked={has(item.id)}
              onChange={() => toggle(item.id)}
            />
            {item.name}
          </label>
        </li>
      ))}
    </ul>
  );
}
```

---

## API Reference

### `useSet<T>(initialState?)`

Returns a tuple of the current read-only set and a stable actions object.

#### Parameters

| Parameter      | Type                 | Default | Description                                              |
| -------------- | -------------------- | ------- | -------------------------------------------------------- |
| `initialState` | `SetInitializer<T>`  | empty   | A `Set`, an iterable of values, or a factory returning one (evaluated once) |

#### Returns `[set, actions]`

| Item      | Type                | Description                                       |
| --------- | ------------------- | ------------------------------------------------- |
| `set`     | `ReadonlySet<T>`    | Current set. Read via `has`/`size`/iteration      |
| `actions` | `UseSetActions<T>`  | Stable action handlers (see below)                |

#### Actions

| Action   | Signature                              | Description                                                                    |
| -------- | -------------------------------------- | ------------------------------------------------------------------------------ |
| `add`    | `(value: T) => void`                   | Add a value. Adding an existing value is a no-op                               |
| `remove` | `(value: T) => void`                   | Remove a value. Removing an absent value is a no-op                             |
| `toggle` | `(value: T, force?: boolean) => void`  | Flip membership, or set it explicitly with `force` (`true` = add, `false` = remove) |
| `has`    | `(value: T) => boolean`                | Whether the set contains a value (stable, always reflects latest state)        |
| `clear`  | `() => void`                           | Remove all values. Clearing an empty set is a no-op                            |
| `reset`  | `() => void`                           | Restore the initial values (a fresh copy)                                      |

> The returned `set` is a `ReadonlySet`, so calling `set.add(...)` directly is a TypeScript error. Use the actions — mutating the set in place would bypass React state and break re-renders.

---

## Examples

### Multi-select with `toggle`

```tsx
import { useSet } from "@usefy/use-set";

function SelectableList({ items }: { items: Item[] }) {
  const [selectedIds, { toggle, has, clear }] = useSet<string>(["1", "2"]);

  return (
    <div>
      {items.map((item) => (
        <Checkbox
          key={item.id}
          checked={has(item.id)}
          onChange={() => toggle(item.id)}
        />
      ))}
      <button onClick={clear}>Clear ({selectedIds.size})</button>
    </div>
  );
}
```

### `toggle` with force (controlled membership)

```tsx
const [enabled, { toggle }] = useSet<string>();

// Ensure present / absent regardless of current state
toggle("darkMode", true);  // add
toggle("darkMode", false); // remove
```

### Tag filter with reset

```tsx
const [activeTags, { add, remove, reset }] = useSet<string>(["react", "hooks"]);

add("typescript");
remove("hooks");
reset(); // back to the initial tags
```

### Stable actions as effect dependencies

```tsx
const [ids, actions] = useSet<string>();

useEffect(() => {
  const unsub = subscribe((id) => actions.add(id));
  return unsub;
}, [actions]); // actions never changes identity — effect runs once
```

---

## TypeScript

```tsx
import {
  useSet,
  type SetInitializer,
  type UseSetActions,
  type UseSetReturn,
} from "@usefy/use-set";

const [set, actions]: UseSetReturn<number> = useSet<number>([1, 2, 3]);
```

---

## Behavior Notes

- **Immutable** — Actions never mutate the current set; they replace it with a new one. Any snapshot you captured stays valid.
- **Referentially stable actions** — The actions object and each function keep the same identity for the lifetime of the component.
- **Initial value is copied** — The set you pass in is never mutated, and `reset` always yields a fresh copy of it.
- **No-op skipping** — Updates that wouldn't change anything don't create a new set or trigger a re-render.

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-set/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages)

### Test Files

- `useSet.test.ts` — 21 tests for hook behavior and immutability

**Total: 21 tests**

---

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>
