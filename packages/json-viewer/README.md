<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/json-viewer</h1>

<p align="center">
  <strong>Virtualized JSON tree viewer for React — a bounded DOM at any payload size, chunked search, and a zero-dependency headless engine</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/json-viewer">
    <img src="https://img.shields.io/npm/v/@usefy/json-viewer.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/json-viewer">
    <img src="https://img.shields.io/npm/dm/@usefy/json-viewer.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/json-viewer">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/json-viewer?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/json-viewer.svg?style=flat-square&color=007acc" alt="license" />
  </a>
</p>

<p align="center">
  <a href="#installation">Installation</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#props">Props</a> ·
  <a href="#headless-usage">Headless</a> ·
  <a href="#search">Search</a> ·
  <a href="#copying-paths-and-values">Copying</a> ·
  <a href="#theming">Theming</a> ·
  <a href="#big-payload-guards">Guards</a> ·
  <a href="#accessibility">Accessibility</a> ·
  <a href="#performance">Performance</a> ·
  <a href="#limitations">Limitations</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/story/json-viewer--large-payload" target="_blank" rel="noopener noreferrer">
    <strong>🔍 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/json-viewer` renders a JSON or JavaScript value as a collapsible tree
whose **DOM stays bounded no matter how big the payload is**. A 50 MB document
with millions of nodes scrolls, expands, collapses and searches at full speed,
because the row list is never materialised — rows are computed on demand from an
order-statistic index built only over the *expanded* spine of the tree.

Every other React JSON viewer renders the whole tree.

One model works across **two layers**:

1. **Component** — `<JsonViewer />`: an ARIA tree with keyboard navigation, chunked search, copy-path/copy-value, light and dark themes.
2. **Headless** — `createJsonTree(data)` and `searchJson(data, options)` from `@usefy/json-viewer/headless`: pure TypeScript, zero React, no `"use client"` — importable from a React Server Component, a worker, or plain Node.

### Why @usefy/json-viewer?

- **Bounded DOM at any size.** `rowAt(i)` resolves in `O(depth · log e)` where `e` is the number of children you actually expanded. Expanding one element inside a million-item array costs two numbers of bookkeeping, and the DOM gains nothing.
- **Nothing jumps.** Rows are a fixed height, so keeping the content under the cursor still across an expand or collapse is exact arithmetic rather than a measurement pass.
- **Search that does not freeze the tab.** A chunked, cancelable scan over the **whole** document — collapsed subtrees included — yielding to the browser between slices, with the result cap reported rather than hidden.
- **Real app state, not just JSON.** `Map`, `Set`, `Date`, `BigInt`, `undefined`, functions, throwing getters and reference cycles all render as what they are. A self-referential object can never hang the tab.
- **Zero non-`@usefy` runtime dependencies.** Ten composed `@usefy/use-*` hooks, no `clsx`, no virtualization library.

---

## Installation

```bash
npm install @usefy/json-viewer
# pnpm add @usefy/json-viewer
# yarn add @usefy/json-viewer
```

**No CSS import needed** — the stylesheet is injected on import. If your bundler
strips that side effect, or you prefer to control the load order, the raw file is
exported too:

```ts
import "@usefy/json-viewer/styles.css";
```

Requires React 18 or 19 as a peer dependency.

---

## Quick Start

```tsx
import { JsonViewer } from "@usefy/json-viewer";

export function ResponseInspector({ payload }: { payload: unknown }) {
  return <JsonViewer data={payload} height={480} />;
}
```

`data` takes **any JavaScript value**, held by reference — it is never cloned and
never mutated. If all you have is text, `json` parses it for you:

```tsx
<JsonViewer json={rawResponseText} height={480} onError={console.error} />
```

Above `parseSyncLimit` (2 MB by default) a "Parsing…" state paints before the
parse runs, because ~400 ms of synchronous work with no feedback reads as a
frozen tab even though it is not the bottleneck.

---

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `unknown` | — | The value to render. Preferred — never parsed, cloned or mutated. Identity matters: the model is rebuilt when the reference changes, so an inline literal (`data={{ … }}`) resets the expansion state on every parent render. Memoise it, or hold it in state. |
| `json` | `string` | — | Raw JSON text, parsed for you. Use `data` when you already have a value. |
| `parseSyncLimit` | `number` | `2097152` | Above this many characters of `json`, a parsing state paints first. |
| `expanded` | `readonly string[]` | — | Controlled expansion state, as RFC 6901 pointers. |
| `defaultExpanded` | `readonly string[]` | — | Uncontrolled initial expansion. |
| `onExpandedChange` | `(paths: string[]) => void` | — | Fires on every expansion change. |
| `defaultExpandDepth` | `number` | `1` | How deep the tree starts open. `0` shows only the root row. |
| `query` / `defaultQuery` / `onQueryChange` | `string` / `string` / `fn` | — | Controlled or uncontrolled search query. |
| `searchOptions` | `JsonSearchOptions` | — | `matchKeys`, `matchValues`, `caseSensitive`, `regex`, `maxResults`, `budgetMs`. |
| `rowHeight` | `number` | `22` | Row height in pixels. Fixed by design — see [Limitations](#limitations). |
| `height` | `number \| string` | `400` | Height of the component. |
| `pathFormat` | `"js" \| "pointer" \| "jsonpath"` | `"js"` | Format used by "copy path". |
| `maxValueLength` | `number` | `120` | Characters of a leaf rendered inline before truncation. |
| `maxExpandedRows` | `number` | `100000` | Ceiling for "expand all". |
| `sortKeys` | `boolean` | `false` | Sort object keys alphabetically (the data is not touched). |
| `showSearch` / `showToolbar` | `boolean` | `true` | Show the search bar / toolbar. |
| `showDataTypes` | `boolean` | `false` | Add a type badge to primitive rows. |
| `quoteKeys` | `boolean` | `false` | Render object keys in quotes. |
| `theme` | `"light" \| "dark" \| "auto"` | `"auto"` | `"auto"` follows `prefers-color-scheme`. |
| `renderValue` | `(row: JsonRow) => ReactNode` | — | Custom rendering for a row's value. |
| `onCopy` | `({ kind, text, row }) => void` | — | Fires after a path or value is copied. |
| `onRowClick` | `(row, event) => void` | — | Fires when a row is clicked. |
| `onError` | `(error: Error) => void` | — | Parse failures, clipboard failures, invalid regular expressions. |
| `controllerRef` | `Ref<JsonViewerController>` | — | Imperative handle (below). |

Any other `div` prop is forwarded to the root element.

### `JsonViewerController`

```tsx
const controller = useRef<JsonViewerController>(null);

controller.current?.expandAll();          // subject to maxExpandedRows
controller.current?.collapseAll();
controller.current?.expand(["user", "roles"]);
controller.current?.scrollToPath(["items", 4, "title"]);  // expands ancestors first
controller.current?.search("error");
controller.current?.getRowCount();
```

---

## Headless usage

`@usefy/json-viewer/headless` carries **no `"use client"` banner and no React**,
so it is safe to import from a Server Component, a worker or a Node script.

```ts
import { createJsonTree, searchJson, formatPath } from "@usefy/json-viewer/headless";

const tree = createJsonTree(data, { defaultExpandDepth: 2 });

tree.rowCount();              // total rows in the current expansion state
tree.rowAt(120);              // the descriptor for row 120 — O(depth · log e)
tree.toggle(["users", 0]);    // → { delta, anchorRow }
tree.rowIndexOf(["users", 0]); // the inverse of rowAt
tree.getExpandedPaths();      // RFC 6901 pointers, for persistence
```

The model holds a **live reference** to `data`. It never clones and never
mutates; changing the data means creating a new model.

---

## Search

Search covers the whole document, including collapsed subtrees, in slices that
yield to the browser:

```ts
const controller = new AbortController();

const { paths, capped } = await searchJson(
  data,
  { query: "timeout", regex: false, maxResults: 10_000, signal: controller.signal },
  (progress) => console.log(progress.scanned, progress.matches),
);
```

The walk uses an explicit stack — a 4.5 M-node document would overflow the call
stack, and a recursive walk cannot be suspended and resumed across slices anyway.
Cycles are skipped, so self-referential data cannot hang the scan.

When `maxResults` truncates the results, `capped` is `true` and the UI says so.
It is never silent.

---

## Copying paths and values

"Copy path" emits one of three formats, all round-trippable through `parsePath`:

| `pathFormat` | `["users", 0, "first name"]` becomes |
|---|---|
| `"js"` (default) | `users[0]["first name"]` |
| `"pointer"` | `/users/0/first name` (RFC 6901) |
| `"jsonpath"` | `$.users[0]['first name']` (RFC 9535 escaping) |

"Copy value" re-serialises the subtree, rendering the things JSON has no syntax
for: a `Map` becomes an array of `[key, value]` pairs that feeds straight back
into `new Map()`, a `Set` becomes an array, `BigInt` a decimal string, `Date` an
ISO string, and a cycle the literal `"[Circular]"`.

Keyboard: `p` copies the active row's path, `c` copies its value.

---

## Theming

Every colour is a CSS custom property on the root element, so a consumer can
restyle the tree without knowing a generated class name:

```css
.my-inspector {
  --usefy-json-row-height: 20px;
  --usefy-json-key: #7c3aed;
  --usefy-json-string: #0ea5e9;
  --usefy-json-bg: #fbfbfd;
}
```

`theme="auto"` follows `prefers-color-scheme`; `"light"` and `"dark"` pin it in
both directions. The disclosure triangle's rotation is suppressed under
`prefers-reduced-motion`.

---

## Big-payload guards

| Guard | Default | What happens |
|---|---|---|
| `maxValueLength` | 120 chars | The row shows a `…` chip; clicking it opens the full value in an overlay. The row height never changes. |
| `maxExpandedRows` | 100 000 | "Expand all" works level by level and stops at the deepest one that fits, saying so in the live region. It never closes anything that was already open, and it does not apply to a single expansion — clicking one container, or restoring a saved `expanded` set, is always honoured. |
| `parseSyncLimit` | 2 MB | A visible "Parsing…" state paints before a large `JSON.parse`. |
| `maxResults` | 10 000 | Search reports that the results were capped. |
| copy ceiling | 32 MB | "Copy value" refuses rather than building a string that would crash the tab. |
| element-height cap | probed | Past the browser's maximum element height the scroll range is compressed and mapped through a ratio, so the scrollbar keeps reaching the end of the document. |

---

## Accessibility

- `role="tree"` on the scroll container, `role="treeitem"` on rows, with `aria-level`, `aria-expanded`, and — because the siblings are windowed out of the DOM — **`aria-posinset` and `aria-setsize` on every row**. Without those two, a screen reader reports the size of the *window* as the size of the tree.
- A single tab stop with `aria-activedescendant`, which is the correct composite-widget pattern for a virtualized tree.
- The WAI-ARIA Tree View key map: `↑`/`↓` move · `→` expands, or moves to the first child · `←` collapses, or moves to the parent · `Home`/`End` · `PageUp`/`PageDown` · `Enter`/`Space` toggles · `*` expands all siblings · `p`/`c` copy the path/value. Arrow keys scroll only when the target row is off screen, so the highlight walks the visible rows instead of the document sliding under it.
- **Type-ahead is not implemented**, and `c`/`p` claim those letters for copy. A tree of arbitrary JSON has no stable label alphabet to type ahead *to* — half the rows are array indices — while copying a path out of a payload is what people actually reach for.
- Search results, progress, the capped notice, and every refusal are announced through a `role="status"` live region.
- The full-value overlay is focus-managed: focus moves in, `Escape` closes it and returns focus to the tree.
- Type is conveyed by text and shape, never by colour alone.

---

## Performance

Measured with `pnpm bench` on a 53 MB fixture (375 000 records, ~4.5 M nodes),
median of 30 runs after warm-up, Node 22:

| Operation | Measured |
|---|---:|
| Build the model (`defaultExpandDepth: 1`) | < 0.05 ms |
| `rowAt` × 60 (one frame's worth of rows) | 0.05 ms |
| `toggle` a child inside the 375 000-item array | 0.01 ms |
| `expandAll` to the 100 000-row budget | 18.6 ms |
| Search: work per slice (8 ms budget) | 6.5 ms |

In a browser, scrolling that fixture holds a **16.6 ms median frame** with 34
rows in the DOM against 375 006 in the document.

Bundle sizes (`pnpm size`, esbuild, minified, ESM, gzipped):

| Import path | Size |
|---|---:|
| `createJsonTree` only (tree-shaken) | 4.32 KB |
| engine + `searchJson` | 5.18 KB |
| `./headless`, full surface | 6.40 KB |
| `.` React entry, full surface | 18.05 KB |

---

## Limitations

- **Rows are a fixed height.** That is what makes every scroll offset exact
  arithmetic and anchoring free; a row that grows would invalidate all of it and
  turn this into measured virtualization, a much larger problem. Long values
  truncate and open in an overlay instead of wrapping.
- **No editing.** Reading a large document well is the whole scope; editing is a
  different package.
- **Search finds and jumps, it does not filter.** Hiding non-matching rows needs
  a second order-statistic index over a derived tree that changes shape on every
  keystroke — a separate feature, not the missing half of this one.
- **`Map` and `Set` children are addressed positionally** (their keys need not be
  strings), so a copied path into a `Map` is an index, not the map key. The key
  is still what the row displays.

---

## License

MIT © [usefy](https://github.com/mirunamu00/usefy)
