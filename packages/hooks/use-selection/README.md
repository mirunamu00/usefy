<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-selection</h1>

<p align="center">
  <strong>Multi/single selection state for lists and tables — Set-based, checkbox-ready</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-selection"><img src="https://img.shields.io/npm/v/@usefy/use-selection.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-selection"><img src="https://img.shields.io/npm/dm/@usefy/use-selection.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-selection"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-selection?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-selection.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-useselection--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useSelection` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. It manages which items from a list or table are selected, backed by a `Set` of keys, with everything a checkbox UI needs: per-row selection, a header "select all" with indeterminate state, and an optional single-selection mode.

## Features

- **Set-backed** — stores **keys** (via `getKey`, default identity), so a selection survives new item identities across renders
- **Ergonomic surface** — `selected` items, `isSelected`, `toggle`, `select`, `deselect`, `selectAll`, `clear`
- **Header-checkbox ready** — `isAllSelected` / `isPartiallySelected` / `isNoneSelected` for the indeterminate state
- **Single-selection mode** — `multiple: false` replaces the selection on select (radio-like)
- **Auto-reconciled** — item-facing values derive from the current `items`; removed rows drop out automatically
- **Stable & efficient** — stable action identities; no-op `selectAll`/`clear` skip re-renders; immutable Set updates
- **SSR-safe & StrictMode-safe** — pure state, no mutation of prior state
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — zero dependencies, published as its own package

## Installation

```bash
# npm
npm install @usefy/use-selection

# yarn
yarn add @usefy/use-selection

# pnpm
pnpm add @usefy/use-selection
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useSelection } from "@usefy/use-selection";

type User = { id: number; name: string };

function UserTable({ users }: { users: User[] }) {
  const {
    selected,
    isSelected,
    toggle,
    selectAll,
    clear,
    isAllSelected,
    isPartiallySelected,
  } = useSelection(users, { getKey: (u) => u.id });

  return (
    <table>
      <thead>
        <tr>
          <th>
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = isPartiallySelected;
              }}
              onChange={() => (isAllSelected ? clear() : selectAll())}
            />
          </th>
          <th>Name ({selected.length} selected)</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>
              <input
                type="checkbox"
                checked={isSelected(user)}
                onChange={() => toggle(user)}
              />
            </td>
            <td>{user.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## API

```ts
const result = useSelection<T>(items: T[], options?: UseSelectionOptions<T>);
```

### Options — `UseSelectionOptions<T>`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `getKey` | `(item: T) => string \| number` | identity (`(item) => item`) | Derives the selection key for an item. The `Set` stores these keys, not items, so selection survives new object references. **Provide this for object items** (e.g. `(row) => row.id`); the identity default is only correct for primitive items. |
| `multiple` | `boolean` | `true` | `true` = multi-selection; `false` = single-selection (selecting replaces the current choice, and `selectAll` is a no-op). |

### Return — `UseSelectionReturn<T>`

| Property | Type | Description |
| --- | --- | --- |
| `selected` | `T[]` | The selected items, in `items` order. Derived as `items ∩ selectedKeys` — items removed from `items` drop out automatically. |
| `selectedKeys` | `ReadonlySet<string \| number>` | The raw set of selected keys (source of truth). May contain keys for items no longer in `items`; those are invisible in the derived values. |
| `isSelected` | `(item: T) => boolean` | Whether an item is selected (by key). Stable. |
| `toggle` | `(item: T) => void` | Flip an item's selection. In single mode, selecting a new item replaces the previous one. Stable. |
| `select` | `(item: T) => void` | Select an item (idempotent). In single mode, replaces the selection. Stable. |
| `deselect` | `(item: T) => void` | Deselect an item (idempotent). Stable. |
| `selectAll` | `() => void` | Select every item in `items`. No-op when all are already selected, or in single mode. Stable. |
| `clear` | `() => void` | Clear the whole selection (deselect all). No-op when already empty. Stable. |
| `isAllSelected` | `boolean` | `true` when every item is selected. **Always `false` for an empty `items` array.** |
| `isPartiallySelected` | `boolean` | `true` when some — but not all — items are selected (drives an indeterminate header checkbox). `false` for empty `items`. |
| `isNoneSelected` | `boolean` | `true` when no items are selected (including when `items` is empty). |

### Behavior notes

- **Selection key.** The `Set` stores **keys**, never items. This is what makes a selection stable when `items` is rebuilt with fresh object references each render — as long as `getKey` maps the same logical item to the same key. For primitive `items` (`string`/`number`) the identity default just works.
- **Items-change reconciliation.** `selectedKeys` is the source of truth; every item-facing value is **derived from the current `items`**. Removing a selected row from `items` makes it disappear from `selected` and recomputes `isAllSelected`/`isPartiallySelected` automatically — no manual pruning needed. The removed key stays in `selectedKeys` (harmless and invisible) so it re-appears if the item comes back.
- **Empty list.** `isAllSelected` is `false` for an empty `items` array (there is nothing to have "all" selected); `isNoneSelected` is `true`.
- **Single-selection mode.** With `multiple: false`, `select`/`toggle` of a new item replace the current selection; toggling the already-selected item deselects it. `selectAll` is a no-op (you cannot hold more than one selection).
- **StrictMode / concurrency.** Updates are immutable (a fresh `Set` on every change) and no user callback runs inside a `setState` updater, so it is safe under StrictMode and concurrent rendering.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/hooks/use-selection/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **24 tests**, 100% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
