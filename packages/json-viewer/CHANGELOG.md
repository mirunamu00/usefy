# @usefy/json-viewer

## 0.2.0

### Minor Changes

- e5d6c19: Add `@usefy/json-viewer` — a collapsible JSON tree whose DOM stays bounded no matter how big the payload is.

  Rows are computed on demand from an order-statistic index built only over the _expanded_ spine of the tree, so a 53 MB document with ~4.5 M nodes scrolls with 34 rows in the DOM against 375 006 in the document. The index is sparse first (memory proportional to what was actually expanded) and promotes to a Fenwick tree past a measured crossover.

  - `<JsonViewer />` — windowed ARIA tree with exact scroll anchoring, the full WAI-ARIA Tree View key map, `aria-setsize`/`aria-posinset` on every row, light/dark theming, and a full-value overlay that never changes a row's height.
  - Chunked, cancelable search over the **whole** document including collapsed subtrees, yielding to the browser between slices, with the result cap reported rather than hidden.
  - `Map`, `Set`, `Date`, `BigInt`, `undefined`, functions, throwing getters and reference cycles all render as what they are.
  - Copy a path as a JS accessor, an RFC 6901 pointer or an RFC 9535 JSONPath; copy any subtree as re-serialized JSON.
  - `@usefy/json-viewer/headless` ships the engine with zero React and **no `"use client"`**, so it is importable from a React Server Component or a worker.
  - Zero non-`@usefy` runtime dependencies.
