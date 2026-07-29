# JsonViewer Component Specification

## Overview

`@usefy/json-viewer` renders a JSON / JavaScript value as a collapsible tree
with a **bounded DOM**: the number of rendered rows depends on the viewport, not
on the size of the data. A 40 MB payload with ~4.5 M nodes scrolls, expands,
collapses and searches at 60 fps, because the row list is never materialized —
it is computed on demand from an order-statistic index built only over the
*expanded* spine of the tree.

Two entries ship: `.` (the React component) and `./headless` (the pure engine —
zero React, RSC-importable). Styling is SCSS modules compiled to
`dist/styles.css` and injected at runtime by the React entry only.

- Package: `@usefy/json-viewer` · directory `packages/json-viewer/` · initial version `0.1.0`
- Standalone component (no umbrella — CLAUDE.md)
- Decided in `STANDALONE-IDEAS.md` → "Next up" (2026-07-28)

---

## 1. Executive Summary

### 1.1 Purpose

Give React a JSON tree viewer that stays usable when the payload is big — an
API response dump, a trace file, a state snapshot, a log bundle. Today the
honest answer for a 40 MB payload is "don't paste it into the browser". This
package makes that the *normal* case rather than the failure case, and does it
without a virtualization dependency.

### 1.2 The reason to build it (gate ⑤ — measured 2026-07-28, not assumed)

Every incumbent renders the **whole tree**. Checked directly against npm: none
of the five depends on a virtualization library, and none so much as mentions
"virtual" or "window" in its README.

| Package | Weekly | Last publish | Runtime deps | README says "virtual"/"window" |
|---|---:|---:|---|---|
| `react-json-view` | 1,369,700 | **64.7 mo** | flux, react-base16-styling, … | no |
| `@microlink/react-json-view` | 585,076 | 0.0 mo | react-base16-styling, … | no |
| `react-json-view-lite` | 1,583,074 | 10.7 mo | (none) | no |
| `react-json-tree` | 1,048,102 | 16.9 mo | @types/lodash, … | no |
| `json-edit-react` | 329,809 | 1.1 mo | (none) | no |

`react-json-view-lite` does claim "large / huge / performance" — but with no
windowing behind it. That is fast *rendering*, not a bounded DOM.

This is a **living ecosystem**, and that is not a veto (STANDALONE-IDEAS gate
⑤): `confetti` shipped against canvas-confetti at 8.8 M/wk. The claim we make
is narrow, true, and checkable — **window a tree nobody else windows.**

### 1.3 The differentiator, stated once

> The row you are looking at is computed, not stored. Expanding a 1 M-element
> array costs one `Object.keys`-free O(1) index update, and the DOM gains zero
> nodes.

Everything else in this package — search, copy, theming, a11y — is table
stakes that has to be at least as good as the incumbents. The engine is the
reason to install it.

### 1.4 Target users

- Developers debugging large API responses / traces / state dumps in an app UI.
- Internal tools and admin panels that display arbitrary JSON documents.
- Anyone building a devtool panel who currently reaches for `<pre>{JSON.stringify(x, null, 2)}</pre>` and watches the tab die.
- Consumers of `./headless` who want the tree/search model without our markup.

### 1.5 Key value propositions

1. **Bounded DOM at any size.** Rendered rows ≈ viewport height ÷ row height + overscan, always.
2. **No jump on expand/collapse.** The row under the cursor stays under the cursor, exactly, by construction.
3. **Search that does not freeze the tab.** A chunked, cancelable, yielding scan with progress, over the *whole* value including collapsed subtrees.
4. **Zero non-`@usefy` runtime dependencies**, framework-free `./headless`, RSC-importable.
5. **It handles values `JSON.parse` never produces** — cycles, `Map`, `Set`, `Date`, `BigInt`, `undefined`, functions — because real app state is not a JSON document.

---

## 2. Scope & Non-Goals

### 2.1 In scope (v0.1.0 — full scope, single release)

Per CLAUDE.md "build it properly the first time", all of the following ships in
the first release. Nothing here is deferred to a "v0.2".

- **The lazy-flattening engine** — order-statistic index over the expanded spine, `rowAt` / `rowCount` / `rowIndexOf` / `toggle` / `expandTo` / `expandAll` (§4.2).
- **Windowed rendering** with exact **scroll anchoring** across expand, collapse, and programmatic jumps (§4.3).
- **Chunked, cancelable search** with progress, match navigation, ancestor auto-expansion, and row highlight (§4.4).
- **Copy** — copy value (subtree re-serialized) and copy path in three formats: JS accessor, JSON Pointer (RFC 6901), JSONPath (§4.5).
- **Big-payload guards** — value truncation with an overlay for the full text, an expand-all row budget, a parse-size threshold with a visible parsing state, and a result cap on search that is *reported*, never silent (§4.6).
- **Non-JSON JS values + cycle detection** (§4.1).
- **Full keyboard tree navigation + ARIA tree semantics** (§8).
- **Light/dark theming** via CSS custom properties, `prefers-reduced-motion` respected.
- **`./headless`** — the whole engine with no React and no `"use client"`.
- **`pnpm bench` + `pnpm size`**, with the results recorded in §4.7.

### 2.2 Explicit non-goals

- **Editing.** That is `json-edit-react`'s territory and a separate package, standing in the same relation as `qr-code` → `qr-scanner`: two packages, not one split in two (STANDALONE-IDEAS).
- **Filter mode** (hide non-matching rows). This is *not* the missing half of search — it is a distinct feature requiring a **second** order-statistic index over a derived tree whose shape changes on every keystroke. Search here is find-and-jump plus highlight, which is what the incumbents offer and what the engine can do without a second index. Recorded as decision #9 so nobody re-litigates it as an oversight.
- **Syntax-highlighted raw text view.** A different component (`markdown-viewer`/code-view territory).
- **Schema validation, diffing two JSON documents** (`@usefy/diff-viewer` exists), JSON5/JSONC parsing.
- **Fetching JSON from a URL** on the consumer's behalf.

### 2.3 Deliberately deferred elsewhere

`virtualized-list` — extracting a general windowing package. STANDALONE-IDEAS
already says this happens *after* `json-viewer` ships, when two real consumers
(diff-viewer + json-viewer) exist to shape the abstraction. This package
therefore keeps its windowing internal and does **not** try to be general.

---

## 3. Functional Requirements

### 3.1 Value model (`src/model/value.ts`)

- Classify a value into a `JsonKind`: `object` · `array` · `string` · `number` · `boolean` · `null` · `undefined` · `bigint` · `date` · `map` · `set` · `function` · `symbol` · `circular` · `unknown`.
- Child access is **by index**, never by materializing a child array for leaves:
  - array → `value[i]`
  - object → `keys[i]` (the key list is cached on the node's expanded record, allocated only when the node is expanded)
  - `Map` → entries materialized on expansion only; `Set` → values, likewise
- `childCount(value)` is O(1) for arrays / `Map` / `Set`, and O(k) once (cached) for plain objects.
- **Cycle detection**: during descent, a candidate child that is reference-identical to any ancestor is reported as kind `circular` and is never descended into. O(depth) per step, no global `WeakSet` that would outlive the walk.
- A **preview** string for a collapsed container (`{ 3 keys }`, `[ 1 048 576 items ]`) and a **display** string for a leaf, both truncated at `maxValueLength`.

### 3.2 Tree index (`src/model/tree.ts`, `src/model/order.ts`)

- `rowCount()` — total rows in the current expansion state.
- `rowAt(i)` — the descriptor for row `i` in **O(depth · log e)** (§4.2).
- `rowIndexOf(path)` — the inverse; `-1` if any ancestor is collapsed.
- `toggle(path)` / `expand(path)` / `collapse(path)` — O(depth · log e), returns the row-count delta so the caller can anchor the scroll.
- `expandTo(path)` — expands every ancestor of `path`, used by search jump.
- `expandAll(maxDepth?)` — bulk expansion, refused past `maxExpandedRows` with a structured reason (§4.6).
- `collapseAll()` — O(1): drop the expanded spine.
- Expansion state is exportable/importable as a list of path strings so it can be controlled or persisted.

### 3.3 Rendering

- One row per: the root, each leaf, each container's opening line, and each expanded container's **closing line** (`}` / `]`). Empty containers (`{}`, `[]`) are a single non-expandable row.
- Rows are **fixed height** (`--usefy-json-row-height`, default `22px`). This is a hard invariant of the engine: every offset is `index × rowHeight`.
- A row shows: indent guides by depth, a disclosure triangle (containers only), the key, the value or preview, and — on hover/focus — copy affordances.
- Long values are truncated with an ellipsis affordance that opens an **overlay** (§4.6), never an inline row growth.

### 3.4 Search

- Debounced query → chunked scan of the **entire** value (collapsed subtrees included) → ordered list of matching paths.
- Options: match keys, match values, case sensitivity, whole-value vs substring, optional regex.
- Progress (`scanned / total-estimate`) and a cancel that actually stops the walk.
- Navigation: next / previous match, wrapping, with `expandTo` + scroll + a **static** highlight on the current match. Deliberately static rather than a flash: a transient animation on the row you were sent to is exactly the thing `prefers-reduced-motion` exists to suppress, and a marker that stays put is more useful than one that fades.
- Every row on the path to a match is marked so ancestors show a "contains a match" affordance.

### 3.5 React surface

- Controlled **and** uncontrolled expansion (`expanded` / `defaultExpanded` / `onExpandedChange`) and search query, via `@usefy/use-controllable-state`.
- An imperative controller ref: `expand`, `collapse`, `expandAll`, `collapseAll`, `scrollToPath`, `search`, `getRowCount`.
- `onCopy`, `onError`, `onRowClick`, `renderValue` (custom leaf rendering — receives the descriptor, returns `ReactNode`).

---

## 4. Technical Specifications

### 4.1 Data model

```typescript
export type JsonKind =
  | "object" | "array" | "string" | "number" | "boolean" | "null"
  | "undefined" | "bigint" | "date" | "map" | "set"
  | "function" | "symbol" | "circular" | "unknown";

/** A path segment: an object key, or an array/Map/Set index. */
export type PathSegment = string | number;
export type JsonPath = readonly PathSegment[];

/** Everything the renderer needs for one row. Built during descent, never stored. */
export interface JsonRow {
  /** Row index in the current expansion state. */
  index: number;
  path: JsonPath;
  /** The key under the parent; `undefined` for the root. */
  key: PathSegment | undefined;
  kind: JsonKind;
  /** Indentation level; the root is 0. */
  depth: number;
  /** True for the synthetic `}` / `]` line of an expanded container. */
  closing: boolean;
  expandable: boolean;
  expanded: boolean;
  /** Children of a container; 0 for leaves. */
  childCount: number;
  /** Rendered text for a leaf, or the collapsed preview for a container. */
  display: string;
  /** True when `display` was cut at `maxValueLength`. */
  truncated: boolean;
  /** Live reference to the underlying value (not cloned). */
  value: unknown;
}

export interface JsonTreeOptions {
  maxValueLength?: number;        // default 120
  sortKeys?: boolean;             // default false
  defaultExpandDepth?: number;    // default 1
  maxExpandedRows?: number;       // default 100_000
  /** Promote a container's index to a dense Fenwick past this many expanded children. */
  denseThreshold?: number;        // default: measured in Phase 4, see §4.7
}

export interface JsonTreeModel {
  rowCount(): number;
  rowAt(index: number): JsonRow;
  rowIndexOf(path: JsonPath): number;
  isExpanded(path: JsonPath): boolean;
  toggle(path: JsonPath): ExpandResult;
  expand(path: JsonPath): ExpandResult;
  collapse(path: JsonPath): ExpandResult;
  expandTo(path: JsonPath): ExpandResult;
  expandAll(maxDepth?: number): ExpandResult;
  collapseAll(): ExpandResult;
  getExpandedPaths(): string[];
  setExpandedPaths(paths: readonly string[]): ExpandResult;
  /** Version counter — bumped on every mutation, for `useSyncExternalStore`. */
  version(): number;
}

export interface ExpandResult {
  /** Change in total row count. Negative on collapse. */
  delta: number;
  /** Row index of the toggled node before the change, or -1 if not visible. */
  anchorRow: number;
  /** Set when the operation was refused. */
  refused?: { reason: "row-budget" | "not-expandable" | "unreachable"; budget?: number };
}
```

### 4.2 The engine — the part nobody else has

**The premise.** A 4.5 M-node tree cannot be flattened into a row array; the
row descriptors alone are the problem. But it does not need to be: the parsed
value *is* the tree, already in memory, and a collapsed container is exactly
**one** row regardless of what it contains. So the only state we need is
bookkeeping for the nodes the user actually expanded.

**The record.** One record per *expanded* container:

```typescript
interface ExpandedNode {
  /** Cached key list; objects only, allocated on expansion. */
  keys: string[] | null;
  childCount: number;
  /** Total rows this node occupies: 1 (open) + Σ child rows + 1 (close). */
  rows: number;
  /** Expanded children, keyed by child index. */
  children: Map<number, ExpandedNode>;
  /** Order-statistic index over the children — see below. */
  order: SparseOrder | DenseOrder | null;
}
```

With no expanded children, `rows = childCount + 2` and row `r` inside the node
maps to child `r - 1` by **subtraction** — no index at all. This is the common
case and it is O(1).

**The order-statistic index, and why it is sparse first.** When some children
are expanded, child `c` starts at local row `1 + c + extraBefore(c)`, where
`extraBefore(c)` is the total *extra* rows contributed by expanded children
before `c`. Two representations:

- **`SparseOrder`** (default) — a sorted array of expanded child indices plus a running prefix sum of their extras. `rowAt` binary-searches it in **O(log e)** where `e` is the number of *expanded* children. Memory is **O(e), not O(k)**: expanding one element inside a 1 M-item array costs 2 numbers, not a 1 M-entry array. Mutation is an `O(e)` splice + prefix rebuild.
- **`DenseOrder`** — a Fenwick tree over all `k` children, `O(log k)` query *and* update, `O(k)` memory. Only built when `e` exceeds `denseThreshold`, which is where the sparse array's `O(e)` mutation stops being cheaper than a Fenwick's `O(log k)`. **That threshold is measured in Phase 4, not guessed** (qr-scanner's `maxDimension` lesson: a number defended before it is benchmarked usually turns out to cost more than it saves).

Bulk operations (`expandAll`, `setExpandedPaths`) build the index in **one
pass**, never by repeated insertion — otherwise expanding 100 k siblings is
O(e²).

**Complexities.**

| Operation | Cost |
|---|---|
| `rowAt(i)` | O(depth · log e), O(depth) when no siblings are expanded |
| `rowIndexOf(path)` | O(depth · log e) |
| `toggle` / `expand` / `collapse` | O(depth · log e) + O(k) once if the node is an object being expanded (`Object.keys`) |
| `collapseAll` | O(1) |
| Memory | O(total expanded children), independent of tree size |

**Correctness oracle.** A naive model (`__testing__/naive.ts`) flattens the
whole tree into an array for a given expansion state. On small inputs, every
`rowAt(i)` must equal `naive[i]` and `rowCount()` must equal `naive.length`,
across randomized expand/collapse sequences from a seeded generator. This is
the mechanically-checkable definition of "the index is right".

### 4.3 Windowing and scroll anchoring (`src/useRowWindow.ts`)

Windowing follows the shape proven in `@usefy/diff-viewer`
(`src/components/useVirtualRows.ts`): a pure `computeWindow` fed by
rAF-coalesced scroll metrics, an `ESTIMATED_VIEWPORT` constant so the server
render and the first client render agree, and spacer padding above/below.
**What carries over is the know-how, not the code** — the diff engine windows a
*static* list; ours changes length on every toggle.

**Anchoring rule.** Rows are fixed height, so anchoring is exact arithmetic
rather than measurement:

- Toggle a node whose row index is **at or below** the first visible row → the viewport is already anchored; do nothing.
- Toggle a node **above** the first visible row → `scrollTop += delta × rowHeight`, applied in a layout effect **before paint** (`@usefy/use-isomorphic-layout-effect`) so there is no flash.
- Collapsing a node **containing** the viewport → clamp `scrollTop` so the collapsed node's own row is the first visible row (otherwise the user lands somewhere unrelated).
- `scrollToPath` → `expandTo` first, then `rowIndexOf`, then scroll so the row sits ~⅓ down the viewport.

Because `ExpandResult` carries both `delta` and `anchorRow`, the component
never has to re-derive either.

**Container scroll height** is `rowCount() × rowHeight`. Browsers cap element
height around 16–33 M px depending on the engine; at 22 px that is ~750 k rows
on the strictest. Past `maxScrollRows` (derived by probing once at runtime, not
hard-coded per browser) the container switches to a **scaled scrollbar**: the
scroll range is compressed by a factor and `scrollTop` is mapped through it.
Documented as decision #7, tested with a stubbed cap.

### 4.4 Search (`src/search/`)

```typescript
export interface JsonSearchOptions {
  query: string;
  matchKeys?: boolean;      // default true
  matchValues?: boolean;    // default true
  caseSensitive?: boolean;  // default false
  regex?: boolean;          // default false
  maxResults?: number;      // default 10_000
  /** Time slice per chunk, ms. */
  budgetMs?: number;        // default 8
  signal?: AbortSignal;
}

export interface JsonSearchProgress { scanned: number; matches: number; done: boolean; capped: boolean; }

export function searchJson(
  data: unknown,
  options: JsonSearchOptions,
  onProgress?: (p: JsonSearchProgress) => void,
): Promise<{ paths: JsonPath[]; capped: boolean; aborted: boolean }>;
```

- An **explicit stack**, not recursion — a 4.5 M-node tree will blow the call stack, and it must be resumable across time slices anyway.
- Yields when the slice budget is exhausted, via a ladder: `scheduler.postTask({ priority: "background" })` → `requestIdleCallback` → `setTimeout(0)`. The ladder is a module-level pick so it is stub-testable.
- `maxResults` truncation sets `capped: true`, and the UI renders "first 10 000 matches" — **never a silent cap** (STANDALONE-IDEAS "no silent caps").
- Cycles are skipped, so a self-referential object cannot hang the scan.
- Regex mode compiles once and rejects an invalid pattern through `onError` rather than throwing into render.

### 4.5 Paths and copying (`src/model/path.ts`)

Three formats, all exported and all round-trippable:

| Format | `["users", 0, "first name"]` → |
|---|---|
| `"js"` (default) | `users[0]["first name"]` |
| `"pointer"` (RFC 6901) | `/users/0/first name` (with `~0`/`~1` escaping) |
| `"jsonpath"` | `$.users[0]['first name']` |

`copyValue` re-serializes the subtree with `JSON.stringify(value, replacer, 2)`
where the replacer renders non-JSON kinds explicitly (`Map` → entries array,
`BigInt` → string, `Date` → ISO, `undefined`/function → `null` with a comment
row in the UI, cycles → `"[Circular]"`). It refuses past `maxCopyBytes`
(default 32 MB) with a reported reason rather than freezing the tab.

**The independent oracle (gate ⑥).** Our own naive flatten proves the index is
self-consistent; it cannot prove the *paths* are right. So every path the
component can copy is fed, in tests, to **`jsonpath-plus`** (a devDependency, a
completely separate implementation) and must resolve against the original data
to the *identical reference* as the row's `value`. The JSON Pointer format is
checked the same way against a hand-written RFC 6901 resolver derived from the
spec text, not from our formatter. This is the `qr-scanner` lesson applied:
agreeing with ourselves only proves consistency, not correctness.

### 4.6 Big-payload guards

| Guard | Default | Behavior when hit |
|---|---|---|
| `maxValueLength` | 120 chars | Row shows an ellipsis chip; clicking/`Enter` opens a **positioned overlay** with the full value (scrollable, copyable). **The row height never changes** — variable-height rows are exactly the problem `diff-viewer` documented and declined, and they would invalidate every offset in §4.3. Decision #4. |
| `maxExpandedRows` | 100 000 | `expandAll` expands **level by level** and stops at the deepest level that fits, returning `refused: { reason: "row-budget", budget }`. The UI says so. It never *removes* rows: anything already open is kept regardless of the budget, and a single manual expansion is not budgeted at all — including the root's, which is why `defaultExpandDepth` always opens the root even when its children would blow the ceiling. `setExpandedPaths` is likewise unbudgeted; restoring a persisted state is the consumer stating what they want open, not a bulk expansion. |
| `parseSyncLimit` (string input only) | 2 MB | Above it, a "Parsing…" state paints first, then `JSON.parse` runs on the next frame. See decision #5. |
| `maxResults` | 10 000 | Search reports `capped`. |
| `maxCopyBytes` | 32 MB | `copyValue` refuses with a reason. |
| `maxScrollRows` | probed | Scaled scrollbar (§4.3). |

### 4.7 Performance contract

**Measured, not guessed.** Both scripts ship: `pnpm bench` and `pnpm size`,
and both enforce the budgets (`size` exits non-zero on a regression).

**Engine** — 53 MB fixture, 375 000 records ≈ 4.5 M nodes, median of 30 runs
after warm-up, Node 22:

| Operation | Budget | Measured |
|---|---:|---:|
| `JSON.parse` of the fixture | — | 348 ms (p95 600 ms) |
| Build the model (`defaultExpandDepth: 1`) | < 5 ms | **< 0.06 ms** |
| `rowAt` × 60 (one frame's worth of rows) | < 1 ms | **0.06 ms** |
| `toggle` a child inside the 375 000-item array | < 2 ms | **< 0.05 ms** |
| `expandAll` to the 100 000-row budget | < 100 ms | **26.2 ms** |
| Search: work per slice (budget 8 ms) | ≤ 12 ms | **4.3 ms** |

`expandAll` costs more than the 18.6 ms an earlier single-pass version
measured, and the extra is bought deliberately: it now deepens one level at a
time so the budget is spent breadth-first (§4.6), which means re-walking the
open prefix once per level. 26 ms for a correct answer beats 19 ms for an
arbitrary one.

The search figure needs one note. The raw gap between progress callbacks is
15.3 ms, but in Node the yield falls all the way down the ladder to
`setTimeout(0)`, whose own round trip measures **11.0 ms** here; the script
reports that baseline alongside so the slice is read as work rather than as
work-plus-timer. A browser resolves the ladder at `scheduler.postTask` instead.

**Two things the benchmark decided, against the first guess:**

1. **`denseThreshold` is 1024, not 512.** More importantly, the *rule* changed:
   around the crossover the two representations are within noise of each other
   (1.27 ms vs 1.13 ms at e = 512), while the memory gap is 12 KB against
   1563 KB — three orders of magnitude. Picking "the first e where dense is
   faster" would trade 1.5 MB per expanded container for a coin flip. The
   threshold now sits below the point where sparse *clearly* degrades
   (e = 2048, where it costs 8× dense), and the noisy region stays sparse.
2. **The React entry's 15 KB budget was wrong.** Measured 18.05 KB gz, of which
   2.13 KB is the entire stylesheet, inlined and injected on import so
   consumers need no separate CSS import. The budget is now 20 KB, and the
   engine-only path — which is what a headless consumer actually pays — is
   4.32 KB.

**Browser** (Phase 5, Playwright): scrolling the fixture produces no visible
stall, and the DOM row count never exceeds
`viewport / rowHeight + 2 × overscan`.

**Bundle sizes** — `pnpm size`, esbuild, minified, ESM, gzipped:

| Import path | Budget | Measured |
|---|---:|---:|
| `createJsonTree` only (tree-shaken) | 6 KB | **4.46 KB** |
| engine + `searchJson` | 8 KB | **5.31 KB** |
| `./headless`, full surface | 9 KB | **6.70 KB** |
| `.` React entry, full surface | 20 KB | **18.79 KB** |

### 4.8 Dependencies

| Package | Purpose |
|---|---|
| `@usefy/use-controllable-state` | `expanded`, `query` — controlled and uncontrolled |
| `@usefy/use-resize-observer` | Viewport height |
| `@usefy/use-raf-state` | Scroll metrics coalesced to one render per frame |
| `@usefy/use-isomorphic-layout-effect` | Scroll anchoring **before paint**, SSR-safe |
| `@usefy/use-event-listener` | `scroll`, overlay `keydown` |
| `@usefy/use-event-callback` | Stable `onExpandedChange`/`onCopy` without re-subscribing |
| `@usefy/use-debounce-callback` | Search input |
| `@usefy/use-copy-to-clipboard` | Copy path / copy value |
| `@usefy/use-on-click-outside` | Value overlay dismissal |
| `@usefy/use-merged-refs` | Scroll ref + the resize observer's ref callback |
| `react` / `react-dom` (peer) | ^18 \|\| ^19 |
| `jsonpath-plus` (**devDependency**) | The independent path oracle (§4.5) |

Ten hooks, and only ten: `use-reduced-motion`, `use-is-client` and `use-latest`
were in the plan and are **not** dependencies, because the motion is CSS-only,
the height probe already runs in a layout effect, and `use-event-callback`
covers the stale-closure case on its own. A declared-but-unused dependency is a
lie about the dependency graph.

**Zero non-`@usefy` runtime dependencies.** Class-name joining is a four-line
local helper, not `clsx`.

Tree keyboard navigation (roving tabindex + the WAI-ARIA tree key map) stays
**local** to this package: it is genuinely component-specific and not a
generic concern any existing hook covers.

### 4.9 Package surface

```jsonc
// exports
{
  ".":            { "types": "./dist/index.d.ts",    "import": "./dist/index.mjs",    "require": "./dist/index.js" },
  "./headless":   { "types": "./dist/headless.d.ts", "import": "./dist/headless.mjs", "require": "./dist/headless.js" },
  "./styles.css": "./dist/styles.css"
}
// "sideEffects": ["*.css"]
```

**`./headless`** (zero React, no `"use client"`):

```typescript
export { createJsonTree } from "./model/tree";
export { searchJson } from "./search/scan";
export { formatPath, parsePath, pathToPointer, pathToJsonPath } from "./model/path";
export { classify, childCount, childAt, previewOf, displayOf } from "./model/value";
export { serializeSubtree } from "./model/serialize";
export type { JsonKind, JsonPath, PathSegment, JsonRow, JsonTreeModel,
              JsonTreeOptions, ExpandResult, JsonSearchOptions,
              JsonSearchProgress, PathFormat } from "./types";
```

**`.`** (React):

```typescript
export interface JsonViewerController {
  expand(path: JsonPath): void;
  collapse(path: JsonPath): void;
  expandAll(maxDepth?: number): ExpandResult;
  collapseAll(): void;
  scrollToPath(path: JsonPath): void;
  search(query: string): void;
  getRowCount(): number;
}

export interface JsonViewerProps
  extends JsonTreeOptions,
    Omit<React.HTMLAttributes<HTMLDivElement>, "onCopy" | "onError" | "children"> {
  /** The value to render. Prefer this — it is never cloned. */
  data?: unknown;
  /** Convenience: raw JSON text. Parsed per decision #5. */
  json?: string;
  expanded?: readonly string[];
  defaultExpanded?: readonly string[];
  onExpandedChange?: (paths: string[]) => void;
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  searchOptions?: Omit<JsonSearchOptions, "query" | "signal">;
  rowHeight?: number;            // default 22
  height?: number | string;      // default 400
  pathFormat?: PathFormat;       // default "js"
  showSearch?: boolean;          // default true
  showToolbar?: boolean;         // default true
  showDataTypes?: boolean;       // default false
  quoteKeys?: boolean;           // default false
  theme?: "light" | "dark" | "auto";  // default "auto"
  renderValue?: (row: JsonRow) => React.ReactNode;
  onCopy?: (payload: { kind: "path" | "value"; text: string; row: JsonRow }) => void;
  onRowClick?: (row: JsonRow, event: React.MouseEvent) => void;
  onError?: (error: Error) => void;
  controllerRef?: React.Ref<JsonViewerController>;
}

export function JsonViewer(props: JsonViewerProps): React.ReactNode;
export function useJsonTree(options: UseJsonTreeOptions): UseJsonTreeReturn;
export * from "./headless";
```

`useJsonTree` subscribes to the model with `useSyncExternalStore` over
`version()`, so a mutation re-renders without copying any state.

---

## 5. Architecture

### 5.1 File structure

```
packages/json-viewer/
├── src/
│   ├── index.ts                  # "." surface (React; "use client" added per-entry)
│   ├── headless.ts               # "./headless" surface (no banner, no React)
│   ├── types.ts
│   ├── model/
│   │   ├── value.ts              # classify, childCount, childAt, preview/display, cycle guard
│   │   ├── order.ts              # SparseOrder + DenseOrder (Fenwick) + promotion
│   │   ├── tree.ts               # ExpandedNode spine, rowCount/rowAt/rowIndexOf/toggle/expandAll
│   │   ├── path.ts               # js / pointer / jsonpath formatting + parsing
│   │   └── serialize.ts          # subtree re-serialization for copyValue
│   ├── search/
│   │   ├── scan.ts               # explicit-stack chunked scan
│   │   └── scheduler.ts          # postTask → idle → timeout ladder
│   ├── useJsonTree.ts            # useSyncExternalStore binding
│   ├── useRowWindow.ts           # windowing + scroll anchoring + scroll-cap scaling
│   ├── useTreeKeyboard.ts        # roving tabindex, WAI-ARIA tree key map
│   ├── JsonViewer.tsx
│   ├── Row.tsx
│   ├── Toolbar.tsx               # expand/collapse all, copy, counts
│   ├── SearchBar.tsx             # query, progress, match nav, capped notice
│   ├── ValueOverlay.tsx          # full-value popover (fixed row height preserved)
│   ├── styles/*.module.scss
│   ├── __testing__/
│   │   ├── naive.ts              # reference flatten (the internal oracle)
│   │   ├── generate.ts           # seeded random JSON generator
│   │   (fixtures live inline in the suites that use them)
│   └── *.test.ts(x)              # co-located
├── scripts/bench-tree.mjs
├── scripts/measure-size.mjs
├── package.json                  # ".", "./headless", "./styles.css"; sideEffects ["*.css"]
├── tsup.config.ts                # ONE config, TWO entries, SCSS pipeline, PER-ENTRY banner
├── SPEC.md / README.md
└── vitest.config.ts / vitest.setup.ts / tsconfig.json
```

### 5.2 Data flow

```
 data: unknown  (or json: string → decision #5 parse)
      │
      ▼
 createJsonTree(data, options) ──► ExpandedNode spine (only what is expanded)
      │                                    │
      │  version() bump on mutation        │ SparseOrder ⇄ DenseOrder
      ▼                                    ▼
 useSyncExternalStore ──► rowCount()   rowAt(i) : O(depth · log e)
      │
      ▼
 useRowWindow(scrollTop, viewport, rowHeight, rowCount)
      │   computeWindow → { start, end, paddingTop, paddingBottom }
      ▼
 rows = [start, end) .map(rowAt) ──► <Row/>  (bounded: viewport ÷ rowHeight + 2·overscan)
      │
      ├── toggle(path) → ExpandResult{delta, anchorRow}
      │        └─► layout effect: scrollTop += delta × rowHeight  (when anchorRow < start)
      │
      └── searchJson(data, …) ──chunked──► paths[]
               └─► expandTo(path) → rowIndexOf(path) → scrollToRow → highlight
```

---

## 6. Development Milestones

> House loop applies: each phase ends green (`pnpm typecheck` + package tests)
> and passes a `usefy-reviewer` checkpoint (★) before the next begins. Budget
> roughly a third of total effort for the review rounds — the measured normal
> for `qr-code` and `qr-scanner`, not an overrun.

### Phase 0 — Scaffold + oracles (small)
- [ ] `packages/json-viewer/` config cloned from `diff-viewer` (SCSS pipeline) with `qr-code`'s **per-entry** `"use client"` (decision #1): `package.json`, `tsup.config.ts`, `tsconfig.json`, `vitest.config.ts`, `vitest.setup.ts`.
- [x] `__testing__/naive.ts` (reference flatten) and `__testing__/generate.ts` (seeded generator). Fixtures stayed inline in the suites that use them — a shared fixtures module would have been one indirection for no reuse — and the big payload is generated by `scripts/bench-tree.mjs`, never committed.
- [ ] `jsonpath-plus` devDependency wired and proven to resolve a hand-written path.
- [ ] `pnpm install` links the workspace; `pnpm --filter @usefy/json-viewer build` produces both entries and a placeholder `dist/styles.css`.

### Phase 1 — `model/value.ts` + `model/order.ts` ★ (the pure primitives)
- [ ] `classify` / `childCount` / `childAt` for all 15 kinds, incl. `Map`/`Set`/`Date`/`BigInt`/functions.
- [ ] Cycle detection via ancestor identity during descent.
- [ ] `previewOf` / `displayOf` with truncation and correct plural/locale-free counts.
- [ ] `SparseOrder`: insert / remove / `extraBefore` / `childAtLocalRow` with prefix sums; `DenseOrder`: Fenwick with `O(log k)` query and update; bulk build in one pass for both.
- [ ] Property tests: for random (k, expanded-set) pairs, both representations agree with a brute-force prefix sum.

### Phase 2 — `model/tree.ts` ★ (the engine)
- [ ] `ExpandedNode` spine, `rowCount`, `rowAt`, `rowIndexOf`, `toggle`/`expand`/`collapse`/`expandTo`, `collapseAll`, `expandAll` with the row budget, `get/setExpandedPaths`, `version`.
- [ ] Promotion Sparse → Dense at `denseThreshold`, with the *behavior* proven identical across the promotion boundary.
- [ ] **Oracle suite:** seeded random trees × seeded random expand/collapse sequences; after every step `rowCount()` and every `rowAt(i)` match `naive`. Runs a few thousand steps.
- [ ] `rowIndexOf(rowAt(i).path) === i` for every visible row, always.

### Phase 3 — paths, serialization, search ★
- [ ] `formatPath` / `parsePath` round trip for all three formats over generated keys, including keys with quotes, dots, brackets, `~`, `/`, unicode, and empty strings.
- [ ] **`jsonpath-plus` oracle:** every generated path resolves to the identical reference; RFC 6901 checked against an independently written resolver.
- [ ] `serializeSubtree` incl. non-JSON kinds and the `maxCopyBytes` refusal.
- [ ] `searchJson`: explicit stack, slice budget, scheduler ladder (stubbed in tests), abort, progress, `maxResults` cap reported, cycle-safe. Oracle: a naive full-recursion scan on small inputs must produce the identical ordered path list.

### Phase 4 — React layer + windowing + a11y ★
- [ ] `useJsonTree` (`useSyncExternalStore`), `useRowWindow`, `useTreeKeyboard`, `JsonViewer`, `Row`, `Toolbar`, `SearchBar`, `ValueOverlay`.
- [ ] Scroll anchoring: the four cases in §4.3, each with a test asserting the *visible* first row is unchanged.
- [ ] Scroll-height cap probe + scaled scrollbar, tested with a stubbed cap.
- [ ] Full WAI-ARIA tree semantics and key map (§8); axe check in the browser pass.
- [ ] SCSS modules → `dist/styles.css`, light/dark tokens, reduced motion. **No `:global()`** — the tsup scoper does not support it (the `virtual-keyboard` CSS-leak lesson).
- [ ] `scripts/bench-tree.mjs` + `scripts/measure-size.mjs`; **§4.7 filled in with measured numbers**, and `denseThreshold` set from the benchmark rather than from intuition.
- [ ] `dist/headless.*` asserted free of `"use client"` and of React, by a build test.

### Phase 5 — Storybook + browser QA ★ (mandatory)
- [ ] `apps/storybook/src/stories/JsonViewer.stories.tsx` via the **`add-usefy-story`** skill. Demo stories **idle on open**; the flow-driving `play` lives in a dedicated `!autodocs` interaction-test story.
- [ ] The storefront story: a **"Load 40 MB"** button that generates the payload client-side and scrolls at 60 fps. This is the pitch, so it must be the demo.
- [ ] Browser QA (CLAUDE.md quality bar): every story driven in a real browser, both themes, reduced motion, keyboard-only pass, screenshots as evidence, plus a CDP frame-time trace recorded against §4.7.

### Phase 6 — Docs, web, release ★
- [ ] `packages/json-viewer/README.md` + root `README.md` (Overview table, Ecosystem, Packages, Choose-Your-Package) as a sibling of `@usefy/hooks`.
- [ ] `apps/web` presentation — all six touchpoints (skill Phase 7): registry, `PRODUCTS` entry + `demo` union member + `LIVE_DEMO_SLUGS`, `--accent-json-viewer` in all three theme spots, card micro-demo, `product-demos/json-viewer-demo.tsx` + `DEMOS` entry, workspace dep. Browser-verified in both themes.
- [ ] `pnpm changeset` — `@usefy/json-viewer` `minor` (0.1.0). Components version independently; verify with `pnpm changeset status`.
- [ ] `pnpm build && pnpm test && pnpm typecheck` green at the repo root.
- [ ] Prefilled PR link handed to the user (never `gh pr create`).

---

## 7. Testing Strategy

Three sources of truth, two of them outside our own code:

1. **The naive flatten** (`__testing__/naive.ts`) — proves the index is *self-consistent*: same rows, same order, same count, after any expand/collapse sequence.
2. **`jsonpath-plus`** — a separate implementation, proves the *paths* are right. This is the failure mode the naive model structurally cannot catch: a consistently-wrong path.
3. **An independently written RFC 6901 resolver** — derived from the spec text, checks the pointer format's escaping.

Plus:

- **Seeded generation, always.** Random trees and random operation sequences come from a seeded PRNG, so a failure is reproducible from its seed. No flaky "sometimes wrong at row 4 000".
- **Order structures:** brute-force prefix-sum comparison; equality across the Sparse→Dense promotion boundary; bulk build ≡ repeated insert.
- **Value model:** all 15 kinds; cycles (self, mutual, deep); a `Proxy` that throws on access must surface through `onError`, not crash the render.
- **Search:** identical ordered results to a naive recursive scan; abort actually stops (assert the scanned counter freezes); cap reported; longest slice within budget with a stubbed clock.
- **React:** StrictMode double-mount, SSR render + hydration with no mismatch, controlled/uncontrolled expansion, controller ref, `renderValue`, `onCopy`, keyboard map, roving tabindex, DOM row count bounded under a scripted scroll.
- **Build:** `dist/headless.*` carries no `"use client"` and no React import; `dist/styles.css` exists and contains only scoped class names.
- **Browser (Phase 5):** the only place motion, theming and frame time are real. Screenshots + a frame-time trace are the evidence.

**Coverage — measured, not aspirational.** The first draft of this section
claimed 100 % for `src/model/` and `src/search/` and ≥ 95 % for the package.
Measured (`pnpm vitest --coverage`, v8, excluding tests, `__testing__/`, the two
re-export entries and `types.ts`):

| Scope | Statements | Branches |
|---|---:|---:|
| Package | 92.5 % | 87.3 % |
| `src/model/` | 95.3 % | 91.0 % |
| `src/search/` | 93.5 % | 90.5 % |

The floor this package holds itself to is therefore **≥ 90 % statements
package-wide and ≥ 95 % across `src/model/`**, which is where the engine lives.
What is left uncovered is deliberate: unreachable defensive branches (a
`ResizeObserver`-less environment, `probeMaxElementHeight`'s `catch`), and the
handful of `JsonViewer.tsx` paths that only exist in a real layout engine —
scroll anchoring against a live scroll box, which is covered in the browser pass
instead, because jsdom gives every element a zero-height scroll box and would
make those assertions vacuous.

---

## 8. Accessibility

- The scroll container is `role="tree"` with `aria-label`; rows are `role="treeitem"` with `aria-level`, `aria-expanded` (containers only), and — because siblings are windowed out of the DOM — **`aria-setsize` and `aria-posinset` on every row**. Without those two, a screen reader in a windowed tree reports "1 of 12" for a 4.5 M-node document.
- **Roving tabindex**: exactly one row is tabbable; focus follows the active row and is scrolled into view.
- WAI-ARIA Tree View key map: `↑`/`↓` move · `→` expand, or move to the first child if already expanded · `←` collapse, or move to the parent if already collapsed · `Home`/`End` · `PageUp`/`PageDown` · `Enter`/`Space` toggle · `*` expand all siblings (subject to the row budget, with the refusal announced).
- Copy actions are real `<button>`s with labels, keyboard-reachable, with a visible focus ring in **both** themes — never hover-only affordances.
- Search results, progress, the capped notice, and every refusal (`row-budget`, `maxCopyBytes`) are announced through a `role="status"` `aria-live="polite"` region.
- The full-value overlay is a focus-managed popover: focus moves in, and `Escape` closes it, returns focus to the tree, and makes the originating row active again. (The tree is a single tab stop, so "the row" is `aria-activedescendant` — there is no per-row element that can hold focus.)
- Type is conveyed by **text and shape, not color alone**; the disclosure triangle has a non-color state.
- The current-match marker is a static background, not a flash, so there is nothing for `prefers-reduced-motion` to suppress. The one animated thing in the component — the disclosure triangle's rotation — is suppressed.
- Verified with axe in the Phase 5 browser pass, plus a keyboard-only run.

---

## 9. Security & privacy

- **No network, no telemetry.** The value is read in-process; nothing is fetched, uploaded, or persisted.
- **The data is untrusted input.** Values are rendered as **text only** — no `dangerouslySetInnerHTML`, no URL auto-linking that would turn a payload into a click target, and `renderValue` is documented as the consumer's own responsibility if they choose to linkify.
- **The value is never cloned or mutated.** The model holds a live reference and reads it; `data` is treated as read-only. Consumers keep ownership.
- Property access is guarded: a getter or `Proxy` that throws is caught per node and surfaced as an `unknown` row plus `onError`, so one hostile key cannot take down the tree.
- `copyValue` refuses past `maxCopyBytes` rather than attempting a multi-hundred-MB string that would crash the tab.
- Regex search compiles consumer input; catastrophic backtracking is bounded by the per-slice time budget (the scan yields regardless), and an invalid pattern is reported, not thrown.

---

## 10. Success Criteria

### Functional
- [ ] For seeded random trees and thousands of random expand/collapse steps, `rowCount()` and every `rowAt(i)` match the naive reference exactly.
- [ ] `rowIndexOf(rowAt(i).path) === i` for every visible row, in every state tested.
- [ ] Every copyable path resolves through `jsonpath-plus` to the identical reference; every pointer resolves through an independent RFC 6901 resolver.
- [ ] Search returns the identical ordered path list as a naive recursive scan, is abortable mid-scan, and reports its cap.
- [ ] Expanding or collapsing a node above the viewport leaves the first visible row unchanged — asserted, in all four §4.3 cases.
- [ ] Cycles, `Map`, `Set`, `Date`, `BigInt`, `undefined`, functions, and throwing getters all render without crashing.
- [ ] `expandAll` past the row budget refuses with a reason and expands to the deepest level that fits.
- [ ] Keyboard-only: reach any node, expand, collapse, copy, search, and navigate matches — no mouse.

### Non-functional
- [ ] Browser: 5 s of scrolling the 40 MB fixture with **no p95 frame over 16.7 ms**, and DOM rows bounded by `viewport / rowHeight + 2 × overscan`.
- [x] §4.7 filled in with measured numbers; `denseThreshold` chosen by the benchmark.
- [x] Coverage at or above the floor recorded in §7 (measured, not assumed).
- [ ] `dist/headless.*` free of `"use client"` and React; RSC import verified.
- [ ] SSR + StrictMode safe; React 18 & 19; TS strict; **zero non-`@usefy` runtime dependencies**.
- [ ] Browser QA evidence captured: screenshots in both themes, reduced-motion pass, axe clean, re-run green after the review rounds.

---

## 11. Decisions

1. **Per-entry `"use client"`, never a global banner.** `tsup`'s `banner` option is global; `diff-viewer`, `confetti` and `signature-pad` all stamp `"use client"` onto their `dist/headless.*` because of it, which makes those bundles unimportable from a React Server Component. `@usefy/qr-code`'s `tsup.config.ts` solved this by applying the banner in `onSuccess` to the React entry only, and correcting the sourcemap's `mappings` for the inserted line. This package clones **that** banner approach on top of `diff-viewer`'s SCSS pipeline, and a build test asserts the headless output stays clean. *(Resolves review finding #2.)*

2. **The index is sparse first, dense on promotion.** A Fenwick tree over all `k` children is the textbook answer and costs O(k) memory per expanded container — 4 MB to expand one element inside a 1 M-item array. The sparse prefix-sum array costs O(*expanded* children) instead, which is what the user actually clicks. Dense is still needed when bulk expansion makes `e` approach `k`, so both exist with a measured crossover. Rejected: Fenwick-only (memory), sparse-only (O(e²) bulk expansion).

3. **No streaming parser, and no worker for parsing.** 40.5 MB / ~4.5 M nodes parses in **402 ms** on Node 22, and V8's string cap is 512 MB — a streaming parser solves a problem that does not exist. A worker would move the 402 ms off the main thread but then pay `structuredClone` on a 4.5 M-node result, which is not cheaper. **The bottleneck is rendering, not parsing**, and that is where the whole engine goes.

4. **Fixed-height rows; the full value opens in an overlay, not a taller row.** The SPEC's own §4.3 offsets are `index × rowHeight`; a row that grows invalidates every one of them and lands us in measured virtualization — the "different, much larger problem" `diff-viewer` documented and declined. Wrapping the value into several fixed-height rows was considered and rejected: the row count would then depend on container width, so a resize would change `rowCount()` and require re-anchoring. The overlay keeps the engine sound *and* gives the full value, and every incumbent truncates too. *(Resolves review finding #1.)*

5. **`data` is the primary prop; `json` is a convenience with a visible parsing state.** Passing an already-parsed value is the fast path and the documented default. When `json` is given and exceeds `parseSyncLimit` (2 MB), the component paints a "Parsing…" state, yields a frame, then parses — because 402 ms of synchronous work with no feedback reads as a frozen tab even though it is not a bottleneck. A parse error goes to `onError` and renders an error row; it never throws into render. *(Resolves review finding #4.)*

6. **`jsonpath-plus` is the independent oracle.** Our naive flatten proves the index agrees with itself; it cannot catch a consistently-wrong path. Feeding every emitted path to a separate implementation and requiring the identical *reference* back is the `qr-scanner` lesson applied — "agreeing with our own encoder only proves the two halves are consistent". Cost: one devDependency. *(Resolves review finding #3.)*

7. **The scroll-height cap is probed, not assumed.** Browsers cap element height somewhere between ~16 M and ~33 M px; at 22 px rows that is ~750 k rows on the strictest engine, which this package will exceed routinely. The cap is measured once at runtime behind `@usefy/use-is-client` and, past it, the scroll range is compressed with `scrollTop` mapped through the factor. Hard-coding a per-browser constant was rejected — it is exactly the kind of number that silently rots.

8. **`aria-setsize` / `aria-posinset` on every row are mandatory, not optional polish.** In a windowed tree the DOM does not contain the siblings, so without them assistive tech reports the *window* size as the tree size. This is the accessibility defect that windowing introduces, and it is the one thing a viewer that renders everything gets for free. *(Resolves review finding #5, first half.)*

9. **Search is find-and-jump, not filter.** Filtering to matching subtrees needs a second order-statistic index over a *derived* tree that changes shape on every keystroke — a genuinely separate feature, recorded here so it is understood as a decision rather than an omission. Search covers the whole value including collapsed subtrees, which is the part that actually matters.

10. **Editing is a different package.** `json-edit-react` territory; the `qr-code` → `qr-scanner` precedent. In scope here: reading a large document well.

11. **Windowing stays internal.** `virtualized-list` is on the STANDALONE-IDEAS list and is explicitly sequenced *after* this package, so the abstraction can be shaped by two real consumers instead of guessed at from one.

---

## 12. Appendix

### A. Related packages

| Package | Relation |
|---|---|
| `@usefy/diff-viewer` | The windowing know-how (fixed-height rows, rAF-coalesced metrics, `ESTIMATED_VIEWPORT`, spacer padding). **Know-how, not code** — its engine windows a static list. |
| `@usefy/virtual-keyboard` | The SCSS-modules pipeline precedent, and the `:global()` scoper bug to avoid. |
| `@usefy/qr-code` | The per-entry `"use client"` solution (decision #1) and the "measure before defending a number" discipline. |
| `@usefy/hooks` | The ten composed hooks in §4.8, rather than hand-rolled effects. |

### B. Prior art surveyed

npm figures measured 2026-07-28 — see §1.2 and `STANDALONE-IDEAS.md` "Gate ⑤
data". `react-json-view` (1.37 M/wk, 64.7 mo stale) with its maintained fork
`@microlink/react-json-view`; `react-json-view-lite`; `react-json-tree`;
`json-edit-react`. None windows.
