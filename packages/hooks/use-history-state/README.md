<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-history-state</h1>

<p align="center">
  <strong>A React hook for undo/redo state history with time-travel</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-history-state">
    <img src="https://img.shields.io/npm/v/@usefy/use-history-state.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-history-state">
    <img src="https://img.shields.io/npm/dm/@usefy/use-history-state.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-history-state">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-history-state?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-history-state.svg?style=flat-square&color=007acc" alt="license" />
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
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usehistorystate--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/use-history-state` manages state with a built-in **undo/redo timeline**. Every `set` records a new entry, `undo`/`redo` step through the history, and `goTo` jumps to any point — perfect for editors, canvases, forms, and anything a user expects `Ctrl/Cmd+Z` to work in.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-history-state?

- **Zero Dependencies** — Pure React implementation
- **TypeScript First** — Full `<T>` generics with exported types
- **Time Travel** — `undo`, `redo`, and `goTo` over an immutable timeline
- **`useState`-style `set`** — Pass a value or an updater function (`prev => next`)
- **Ready-made Flags** — `canUndo` / `canRedo` for disabling toolbar buttons
- **Inspectable** — The full `history` array plus `currentIndex`
- **Bounded Memory** — Optional `limit` drops the oldest entries automatically
- **Stable Controls** — Every function keeps its identity, so they're safe as `useEffect` dependencies
- **No Wasted Renders** — Setting the current value again records nothing

---

## Installation

```bash
# npm
npm install @usefy/use-history-state

# yarn
yarn add @usefy/use-history-state

# pnpm
pnpm add @usefy/use-history-state
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
import { useHistoryState } from "@usefy/use-history-state";

function Editor() {
  const { state, set, undo, redo, canUndo, canRedo } = useHistoryState(
    initialCanvas,
    { limit: 50 }
  );

  return (
    <div>
      <Canvas data={state} onChange={set} />
      <button onClick={undo} disabled={!canUndo}>
        ⟲ Undo
      </button>
      <button onClick={redo} disabled={!canRedo}>
        ⟳ Redo
      </button>
    </div>
  );
}
```

---

## API Reference

### `useHistoryState<T>(initialState, options?)`

Returns the current state plus a stable set of controls for navigating and mutating the undo/redo timeline.

#### Parameters

| Parameter      | Type                          | Default | Description                                                        |
| -------------- | ----------------------------- | ------- | ------------------------------------------------------------------ |
| `initialState` | `T \| (() => T)`              | —       | Initial state, or a factory returning it (evaluated once on mount) |
| `options`      | `UseHistoryStateOptions`      | `{}`    | Configuration (see below)                                          |

#### Options

| Option  | Type     | Default     | Description                                                                                  |
| ------- | -------- | ----------- | -------------------------------------------------------------------------------------------- |
| `limit` | `number` | `unlimited` | Max entries to keep. When exceeded, oldest entries drop off the front. Values `< 1` = unlimited |

#### Returns

| Field          | Type                            | Description                                                                 |
| -------------- | ------------------------------- | --------------------------------------------------------------------------- |
| `state`        | `T`                             | The current (present) state                                                 |
| `set`          | `(next: T \| (prev: T) => T) => void` | Record a new state (value or updater). Discards any redoable "future" entries |
| `undo`         | `() => void`                    | Step back one entry. No-op when `canUndo` is `false`                        |
| `redo`         | `() => void`                    | Step forward one entry. No-op when `canRedo` is `false`                     |
| `goTo`         | `(index: number) => void`       | Jump to an entry (index clamped to valid range)                            |
| `canUndo`      | `boolean`                       | Whether there is a previous state                                          |
| `canRedo`      | `boolean`                       | Whether there is a next state                                             |
| `clear`        | `() => void`                    | Collapse the timeline down to just the current state                        |
| `reset`        | `() => void`                    | Restore the initial state and wipe the timeline                             |
| `history`      | `readonly T[]`                  | The full timeline, oldest first                                             |
| `currentIndex` | `number`                        | Index of the current state within `history`                                 |

> **Updater vs. value:** like `useState`, if `T` is itself a function type, pass an updater (`set(() => myFn)`) — a bare function argument is always treated as `prev => next`.

---

## Examples

### Counter with undo/redo

```tsx
const { state, set, undo, redo, canUndo, canRedo } = useHistoryState(0);

set((c) => c + 1); // functional update
undo();            // back to the previous value
redo();            // forward again
```

### Keyboard shortcuts (Ctrl/Cmd+Z)

```tsx
const { undo, redo, canUndo, canRedo } = useHistoryState(initialState);

useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "z") {
      e.preventDefault();
      if (e.shiftKey) {
        if (canRedo) redo();
      } else if (canUndo) {
        undo();
      }
    }
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [undo, redo, canUndo, canRedo]); // controls are stable — effect stays cheap
```

### Time-travel history panel

```tsx
const { state, set, history, currentIndex, goTo } = useHistoryState(initialDoc);

return (
  <aside>
    <h3>History</h3>
    <ul>
      {history.map((entry, i) => (
        <li
          key={i}
          aria-current={i === currentIndex}
          onClick={() => goTo(i)}
        >
          Step {i}
        </li>
      ))}
    </ul>
  </aside>
);
```

### Bounded history for a long-running editor

```tsx
// Keep only the last 100 states in memory.
const { state, set } = useHistoryState(initialState, { limit: 100 });
```

---

## TypeScript

```tsx
import {
  useHistoryState,
  type HistoryStateInitializer,
  type HistoryStateUpdater,
  type UseHistoryStateOptions,
  type UseHistoryStateReturn,
} from "@usefy/use-history-state";

const history: UseHistoryStateReturn<number> = useHistoryState<number>(0);
```

---

## Behavior Notes

- **Immutable timeline** — Each entry is the value you passed to `set`; navigating never mutates entries. `undo`/`redo`/`goTo` reuse the same `history` array reference (no reallocation).
- **Branching on `set`** — Calling `set` after an `undo` discards the redoable "future" and starts a new branch from the current point.
- **No-op skipping** — Setting a value equal to the present one (by `Object.is`) records nothing and skips the re-render. `undo` at the start, `redo` at the end, `goTo` to the current index, and `clear` on a single-entry timeline are all no-ops.
- **`limit`** — Applies as new entries are added; the oldest entries drop off the front and `currentIndex` shifts to stay valid. Values below `1` (or non-finite) mean unlimited.
- **Stable controls** — Every returned function keeps the same identity for the component's lifetime, so they're safe as effect dependencies.
- **SSR-safe** — No `window`/`document` access; renders identically on the server.

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-history-state/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages)

### Test Files

- `useHistoryState.test.ts` — 23 tests for history navigation, branching, limits, and stability

**Total: 23 tests**

---

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>
