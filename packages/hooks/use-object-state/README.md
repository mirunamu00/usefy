<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-object-state</h1>

<p align="center">
  <strong>Object state with immutable partial updates (patch/merge) and reset</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-object-state"><img src="https://img.shields.io/npm/v/@usefy/use-object-state.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-object-state"><img src="https://img.shields.io/npm/dm/@usefy/use-object-state.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-object-state"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-object-state?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-object-state.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-useobjectstate--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useObjectState` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. It manages object state with immutable partial updates and reset — the ergonomic middle ground between `useState` (which replaces the whole value) and `useReducer` (which makes you write a reducer).

It returns a `useState`-style tuple `[state, patch, reset]`. `patch` shallow-merges a partial into the current state **immutably**, so you update one field without spreading the whole object yourself, and `reset` restores the initial value (or a provided one).

## Features

- **Partial merge** — `patch({ field })` shallow-merges immutably (`{ ...prev, ...partial }`); untouched keys are preserved by reference
- **Functional updater** — `patch(prev => ({ ... }))` computes the next patch from the current state
- **Reset** — `reset()` restores the captured initial value; `reset(next)` swaps in a provided object
- **Stable actions** — `patch` and `reset` keep a stable identity for the component's lifetime (safe as `useEffect` dependencies)
- **Lazy init** — accepts a factory (run once), just like `useState`; the produced value is cached for `reset()`
- **SSR- & StrictMode-safe** — pure state logic, no side effects, no globals
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — zero dependencies, published as its own package

## Installation

```bash
# npm
npm install @usefy/use-object-state

# yarn
yarn add @usefy/use-object-state

# pnpm
pnpm add @usefy/use-object-state
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useObjectState } from "@usefy/use-object-state";

interface FormState {
  name: string;
  email: string;
  subscribe: boolean;
}

function SignupForm() {
  const [form, patch, reset] = useObjectState<FormState>({
    name: "",
    email: "",
    subscribe: false,
  });

  return (
    <form>
      <input
        value={form.name}
        onChange={(e) => patch({ name: e.target.value })}
      />
      <input
        value={form.email}
        onChange={(e) => patch({ email: e.target.value })}
      />
      <label>
        <input
          type="checkbox"
          checked={form.subscribe}
          onChange={(e) => patch({ subscribe: e.target.checked })}
        />
        Subscribe
      </label>
      <button type="button" onClick={() => reset()}>
        Reset
      </button>
    </form>
  );
}
```

## API

### `useObjectState<T extends object>(initialState)`

Returns a `[state, patch, reset]` tuple.

#### Parameters

| Parameter      | Type                        | Description                                                                          |
| -------------- | --------------------------- | ------------------------------------------------------------------------------------ |
| `initialState` | `T \| (() => T)`            | The initial object, or a factory returning it (evaluated once on mount, then cached) |

`T` must be a plain object/record — this hook is for objects, not arrays (use [`useList`](https://www.npmjs.com/package/@usefy/use-list)) or primitives (use `useState`).

#### Returns `[state, patch, reset]`

| Item    | Type                    | Description                                                       |
| ------- | ----------------------- | ---------------------------------------------------------------- |
| `state` | `T`                     | The current object                                               |
| `patch` | `ObjectStatePatch<T>`   | Immutably shallow-merge a `Partial<T>` (or a functional updater) |
| `reset` | `ObjectStateReset<T>`   | Restore the initial value, or set a provided object              |

#### `patch(partial | updater)`

```tsx
patch({ field: newValue });                 // shallow-merge a partial
patch((prev) => ({ count: prev.count + 1 })); // compute the patch from prev
```

- Accepts a `Partial<T>` and shallow-merges it immutably: `{ ...prev, ...partial }`. It always produces a **new** object; the previous state is never mutated.
- Also accepts a functional updater `(prev: T) => Partial<T>` for when the next value depends on the current one.
- Only the provided keys change; untouched keys are preserved by reference.
- **Every `patch` triggers a re-render** — there is no shallow-equality dedupe (matching `react-use`'s `useSetState`). This keeps the semantics simple and predictable; add your own guard if you need to skip no-ops.

#### `reset(next?)`

```tsx
reset();              // back to the initial state captured on mount
reset(nextState);     // set to the provided object instead
```

- `reset()` restores the value captured on mount. If a lazy initializer was used, the value it produced is cached once and reused — the initializer is **not** re-run.
- `reset(nextState)` replaces the state with the provided object.

### Shallow-merge caveat

The merge is **shallow** — a nested object in the patch replaces the previous nested object wholesale, it is not deep-merged:

```tsx
const [state, patch] = useObjectState({ user: { name: "Alice", age: 30 } });
patch({ user: { name: "Bob" } });
// state.user is now { name: "Bob" } — `age` is gone.

// Spread the nested object yourself to update one nested field:
patch({ user: { ...state.user, name: "Bob" } });
```

### Types

```tsx
import {
  useObjectState,
  type ObjectStateInitializer,
  type ObjectStatePatch,
  type ObjectStateReset,
  type UseObjectStateReturn,
} from "@usefy/use-object-state";
```

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-object-state/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **22 tests**, 100% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
