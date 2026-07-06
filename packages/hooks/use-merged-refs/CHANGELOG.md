# @usefy/use-merged-refs

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
