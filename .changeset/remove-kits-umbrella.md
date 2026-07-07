---
"@usefy/memory-monitor": patch
---

Restructure: remove the `@usefy/kits` umbrella package and flatten standalone
components to the top level of `packages/`.

Feature components are independent and share no common surface, so bundling them
behind a single `@usefy/kits` install was not meaningful. The umbrella is removed;
each component is published and installed on its own (e.g. `@usefy/memory-monitor`).

`@usefy/memory-monitor` moves from `packages/kits/memory-monitor` to
`packages/memory-monitor`; its `repository.directory` and `homepage` metadata are
updated to the new path. No runtime/API changes.
