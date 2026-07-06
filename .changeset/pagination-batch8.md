---
"@usefy/use-pagination": minor
"@usefy/hooks": minor
---

feat(use-pagination): add usePagination hook for headless pagination state

A headless pagination state machine: controlled/uncontrolled current page (built on `@usefy/use-controllable-state`), a derived `pageCount`, a slice-ready 0-based `range` (`{ start, end }`, end exclusive and clamped to `total`), and an ellipsis-aware `items` pager model (page numbers + `"ellipsis"` tokens) driven by `siblingCount`/`boundaryCount`. The page is clamped into `[1, pageCount]` everywhere; `setPage`/`next`/`prev`/`first`/`last` are identity-stable and skip no-op moves (no wasted renders, no spurious `onChange`). Exports `usePagination` plus the `getPageCount` and `buildPaginationRange` helpers.
