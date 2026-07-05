---
"@usefy/use-selection": minor
"@usefy/hooks": minor
---

feat(use-selection): add useSelection hook for multi/single selection state in lists and tables

Set-backed selection for checkbox lists and data tables. Stores keys (via a
`getKey` option, default identity for primitives), so a selection survives new
item identities across renders. Returns `selected` items (derived from the
current `items`), `isSelected`/`toggle`/`select`/`deselect`/`selectAll`/`clear`,
and `isAllSelected`/`isPartiallySelected`/`isNoneSelected` flags for an
indeterminate header checkbox. Supports a single-selection mode
(`multiple: false`) that replaces the selection. Item-facing values reconcile
automatically when `items` changes; immutable Set updates, stable actions,
no-op skipping, and SSR/StrictMode safe.
