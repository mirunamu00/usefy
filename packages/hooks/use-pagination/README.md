<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-pagination</h1>

<p align="center">
  <strong>A headless pagination state machine — current page, page count, a slice-ready range, and an ellipsis-aware pager model</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-pagination"><img src="https://img.shields.io/npm/v/@usefy/use-pagination.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-pagination"><img src="https://img.shields.io/npm/dm/@usefy/use-pagination.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-pagination"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-pagination?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-pagination.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usepagination--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`usePagination` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. It owns **pagination state** — nothing else — so you can render the pager however you like: a table footer, a numbered button row, a "load more" counter, an API cursor.

From `total` and `pageSize` it derives the page count, keeps the current page clamped in range, hands you a **slice-ready index window** (`range`) for your data array, and builds the **ellipsis-aware page-number model** (`items`) you need for a `1 … 24 25 26 … 50` pager — the same model as MUI/Mantine's `usePagination`. The current page works in both **controlled** and **uncontrolled** modes, composing [`@usefy/use-controllable-state`](https://www.npmjs.com/package/@usefy/use-controllable-state).

## Features

- **Controlled & uncontrolled** — pass `page` + `onChange`, or let the hook own the page from `defaultPage`
- **Slice-ready `range`** — a 0-based `{ start, end }` window (end **exclusive**, clamped to `total`) so `data.slice(start, end)` just works
- **Ellipsis-aware `items`** — page numbers + `"ellipsis"` tokens driven by `siblingCount` / `boundaryCount`, each flagged `selected` for the current page
- **Always in range** — the page is clamped into `[1, pageCount]`; when the dataset shrinks the current page follows it, no dangling out-of-range page
- **No wasted renders** — `next`/`prev` at a bound and `setPage` to the current page are no-ops (no re-render, no `onChange`)
- **Stable controls** — `setPage`/`next`/`prev`/`first`/`last` keep their identity across renders, safe as effect deps
- **Robust guards** — non-positive `pageSize` is coerced to `1`, negative/`NaN` `total` to `0`, fractional pages floored
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — one tiny dependency, published as its own package

## Installation

```bash
# npm
npm install @usefy/use-pagination

# yarn
yarn add @usefy/use-pagination

# pnpm
pnpm add @usefy/use-pagination
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { usePagination } from "@usefy/use-pagination";

function UsersTable({ users }: { users: User[] }) {
  const { page, pageCount, range, items, setPage, next, prev, canNext, canPrev } =
    usePagination({ total: users.length, pageSize: 10 });

  const visible = users.slice(range.start, range.end);

  return (
    <>
      <ul>
        {visible.map((u) => (
          <li key={u.id}>{u.name}</li>
        ))}
      </ul>

      <nav>
        <button onClick={prev} disabled={!canPrev}>‹ Prev</button>
        {items.map((item, i) =>
          item.type === "ellipsis" ? (
            <span key={`gap-${i}`}>…</span>
          ) : (
            <button
              key={item.page}
              aria-current={item.selected ? "page" : undefined}
              onClick={() => setPage(item.page!)}
            >
              {item.page}
            </button>
          )
        )}
        <button onClick={next} disabled={!canNext}>Next ›</button>
      </nav>

      <p>Page {page} of {pageCount}</p>
    </>
  );
}
```

## API

```ts
const pagination = usePagination(options);
```

### Options — `UsePaginationOptions`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `total` | `number` | — (required) | Total number of items across all pages. Values below `0` and non-finite values are treated as `0`; fractions are floored. |
| `pageSize` | `number` | `10` | Items per page. Clamped to a minimum of `1`. |
| `page` | `number` | `undefined` | **Controlled** current page (1-based). When provided, the returned `page` mirrors this prop (clamped) and the controls only call `onChange`. |
| `defaultPage` | `number` | `1` | Initial page in **uncontrolled** mode. Ignored while controlled. |
| `siblingCount` | `number` | `1` | Pages shown on each side of the current page in `items`. |
| `boundaryCount` | `number` | `1` | Pages shown at the start and end in `items`. |
| `onChange` | `(page: number) => void` | `undefined` | Called with the next page whenever the page changes. Its identity may change between renders freely. |

### Returns — `UsePaginationReturn`

| Property | Type | Description |
| --- | --- | --- |
| `page` | `number` | Current page, 1-based, always within `[1, pageCount]`. |
| `pageCount` | `number` | Number of pages, always `>= 1` (an empty dataset still has one empty page). |
| `pageSize` | `number` | The effective page size (clamped to `>= 1`). |
| `setPage` | `(page: number) => void` | Go to a specific page. Argument is clamped and floored; going to the current page is a no-op. Stable identity. |
| `next` | `() => void` | Go to the next page (no-op on the last). Stable identity. |
| `prev` | `() => void` | Go to the previous page (no-op on the first). Stable identity. |
| `first` | `() => void` | Go to the first page. Stable identity. |
| `last` | `() => void` | Go to the last page. Stable identity. |
| `canNext` | `boolean` | `true` when `page < pageCount`. |
| `canPrev` | `boolean` | `true` when `page > 1`. |
| `range` | `PaginationRange` | 0-based `{ start, end }` window of the current page — see below. |
| `items` | `PaginationItem[]` | Ellipsis-aware pager model — see below. |

### `range` — `PaginationRange`

The 0-based index window for slicing your data array:

- `start` — index of the first item on the current page (**inclusive**).
- `end` — index **one past** the last item (**exclusive**), clamped to `total`.

So `array.slice(range.start, range.end)` yields exactly the current page's items. For an empty dataset, `start === end === 0`.

```ts
// total: 25, pageSize: 10, page: 3  →  { start: 20, end: 25 }
data.slice(20, 25); // the last 5 items
```

### `items` — `PaginationItem[]`

The ordered model for rendering a pager, MUI/Mantine-style. Each entry is either a page button or an `"ellipsis"` gap:

```ts
interface PaginationItem {
  type: "page" | "ellipsis";
  page: number | null; // 1-based page for "page", null for "ellipsis"
  selected: boolean; // true only for the current page
}
```

`siblingCount` (pages around the current page) and `boundaryCount` (pages pinned at each end) control how the middle collapses. When a gap would hide exactly one page, that page is shown instead of an ellipsis:

```ts
// pageCount 50, page 25, siblingCount 1, boundaryCount 1:
// [1, "ellipsis", 24, 25, 26, "ellipsis", 50]
```

The pure builder is also exported for non-React use:

```ts
import { buildPaginationRange, getPageCount } from "@usefy/use-pagination";

getPageCount(95, 10); // 10
buildPaginationRange({ page: 1, pageCount: 10 }); // [1, 2, 3, 4, 5, "ellipsis", 10]
```

### Behavior notes

- **Clamping is derived.** The current page is clamped **presentationally** into `[1, pageCount]` — it is never written back into state, so shrinking `total` never fires a surprise `onChange`. In **controlled** mode this means a `page` prop that is out of range is displayed clamped but not corrected via `onChange`; pass a valid `page`. Any navigation interaction (`next`/`prev`/`setPage`) commits a fresh in-range value.
- **No-op skipping.** Moving to the page you're already on — including `next`/`prev` at a bound — does not re-render or call `onChange`.
- **SSR-safe.** Pure state and math; there is no `window`/`document` access, so it renders identically on the server and client.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/hooks/use-pagination/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **48 tests**, 100% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
