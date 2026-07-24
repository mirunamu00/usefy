<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-map</h1>

<p align="center">
  <strong>A React hook for managing Map state with immutable updates</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-map">
    <img src="https://img.shields.io/npm/v/@usefy/use-map.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-map">
    <img src="https://img.shields.io/npm/dm/@usefy/use-map.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-map">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-map?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-map.svg?style=flat-square&color=007acc" alt="license" />
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
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usemap--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/use-map` manages a JavaScript `Map` as React state with immutable, ergonomic updates. Every mutation produces a brand-new `Map` (so React re-renders correctly and the previous state is never mutated), and the returned map is typed as `ReadonlyMap` to steer you toward the provided actions.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-map?

- **Zero Dependencies** — Pure React implementation
- **TypeScript First** — Full `<K, V>` generics with exported types
- **Immutable Updates** — New `Map` on every change; `ReadonlyMap` return type prevents accidental in-place mutation
- **Complete Action Set** — `set`, `setAll`, `remove`, `reset`, `clear`, `get`
- **Stable Actions** — Action identities never change, so they're safe as `useEffect` dependencies
- **No Wasted Renders** — No-op updates (removing an absent key, clearing an empty map, setting a key to its current value) are skipped
- **Lazy Initialization** — Accepts a `Map`, an iterable of tuples, or a factory — just like `useState`

---

## Installation

```bash
# npm
npm install @usefy/use-map

# yarn
yarn add @usefy/use-map

# pnpm
pnpm add @usefy/use-map
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
import { useMap } from "@usefy/use-map";

function Settings() {
  const [prefs, { set, remove, reset }] = useMap<string, boolean>([
    ["darkMode", false],
    ["beta", true],
  ]);

  return (
    <label>
      <input
        type="checkbox"
        checked={prefs.get("darkMode") ?? false}
        onChange={(e) => set("darkMode", e.target.checked)}
      />
      Dark mode
    </label>
  );
}
```

---

## API Reference

### `useMap<K, V>(initialState?)`

Returns a tuple of the current read-only map and a stable actions object.

#### Parameters

| Parameter      | Type                  | Default | Description                                              |
| -------------- | --------------------- | ------- | -------------------------------------------------------- |
| `initialState` | `MapInitializer<K, V>` | empty   | A `Map`, an iterable of `[key, value]` tuples, or a factory returning one (evaluated once) |

#### Returns `[map, actions]`

| Item      | Type                  | Description                                          |
| --------- | --------------------- | --------------------------------------------------- |
| `map`     | `ReadonlyMap<K, V>`   | Current map. Read via `get`/`has`/`size`/iteration  |
| `actions` | `UseMapActions<K, V>` | Stable action handlers (see below)                  |

#### Actions

| Action                 | Signature                                    | Description                                                             |
| ---------------------- | -------------------------------------------- | ---------------------------------------------------------------------- |
| `set`                  | `(key: K, value: V) => void`                 | Set/overwrite a key. Setting a key to its current value is a no-op      |
| `setAll`               | `(entries: Iterable<[K, V]>) => void`        | Replace the entire map with the given entries                          |
| `remove`               | `(key: K) => void`                           | Remove a key. Removing an absent key is a no-op                         |
| `reset`                | `() => void`                                 | Restore the initial entries (a fresh copy)                             |
| `clear`                | `() => void`                                 | Remove all entries. Clearing an empty map is a no-op                    |
| `get`                  | `(key: K) => V \| undefined`                 | Read a key's value (stable, always reflects latest state)              |

> The returned `map` is a `ReadonlyMap`, so calling `map.set(...)` directly is a TypeScript error. Use the actions — mutating the map in place would bypass React state and break re-renders.

---

## Examples

### User directory (objects keyed by id)

```tsx
import { useMap } from "@usefy/use-map";

interface User {
  id: string;
  name: string;
}

function UserDirectory() {
  const [users, { set, remove }] = useMap<string, User>([
    ["1", { id: "1", name: "Alice" }],
    ["2", { id: "2", name: "Bob" }],
  ]);

  const addUser = (user: User) => set(user.id, user);
  const removeUser = (id: string) => remove(id);

  return (
    <ul>
      {[...users.values()].map((user) => (
        <li key={user.id}>
          {user.name}
          <button onClick={() => removeUser(user.id)}>Remove</button>
        </li>
      ))}
    </ul>
  );
}
```

### Replace everything with `setAll`

```tsx
const [cache, { setAll, clear }] = useMap<string, Product>();

async function refresh() {
  const products = await fetchProducts();
  setAll(products.map((p) => [p.id, p])); // replaces the whole cache
}
```

### Reset to initial

```tsx
const [form, { set, reset }] = useMap<string, string>([
  ["email", ""],
  ["name", ""],
]);

set("email", "hi@example.com");
reset(); // both fields back to ""
```

### Stable actions as effect dependencies

```tsx
const [items, actions] = useMap<string, Item>();

useEffect(() => {
  const unsub = subscribe((item) => actions.set(item.id, item));
  return unsub;
}, [actions]); // actions never changes identity — effect runs once
```

---

## TypeScript

```tsx
import {
  useMap,
  type MapInitializer,
  type UseMapActions,
  type UseMapReturn,
} from "@usefy/use-map";

const [map, actions]: UseMapReturn<number, string> = useMap<number, string>([
  [1, "one"],
]);
```

---

## Behavior Notes

- **Immutable** — Actions never mutate the current map; they replace it with a new one. Any snapshot you captured stays valid.
- **Referentially stable actions** — The actions object and each function keep the same identity for the lifetime of the component.
- **Initial value is copied** — The map you pass in is never mutated, and `reset` always yields a fresh copy of it.
- **No-op skipping** — Updates that wouldn't change anything don't create a new map or trigger a re-render.

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

📊 <a href="https://mirunamu00.github.io/usefy/coverage/hooks/use-map/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages)

### Test Files

- `useMap.test.ts` — 22 tests for hook behavior and immutability

**Total: 22 tests**

---

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>
