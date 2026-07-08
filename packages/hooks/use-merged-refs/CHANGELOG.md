# @usefy/use-merged-refs

## 0.25.1

## 0.25.0

## 0.24.0

## 0.23.0

## 0.22.0

## 0.21.1

## 0.21.0

### Patch Changes

- ba7c5da: Fix incorrect npm package-provenance metadata. The `repository.directory` field pointed at non-existent paths for these packages (e.g. `packages/use-toggle` instead of `packages/hooks/use-toggle`, and the `@usefy/hooks` umbrella pointed at `packages/usefy`), which broke the "source" link on each npm package page. Each now points at its real location in the monorepo. Additionally, `@usefy/memory-monitor` had its `repository.url`, `bugs.url`, and `homepage` pointing at a non-existent `usefy/usefy` GitHub org and a wrong `packages/components/...` path — these are corrected to `mirunamu00/usefy` and `packages/kits/memory-monitor`. Metadata-only; no code or runtime change.

## 0.20.0

## 0.19.0

## 0.18.0

## 0.17.0

## 0.16.0

## 0.15.0

## 0.14.0

## 0.13.0

### Minor Changes

- 1bcb3ea: Add design-system primitive (Batch 3): `useMergedRefs` — merges any mix of callback refs and ref objects into a single stable callback ref, the essential helper for `forwardRef` components that also need their own ref to a node. Supports React 19 callback-ref cleanup functions with a "set null on unmount" fallback for React 18, and ships a non-hook `mergeRefs` for composing refs outside render. Includes tests (100% coverage), a Storybook story, a README, and `@usefy/hooks` umbrella re-exports.
