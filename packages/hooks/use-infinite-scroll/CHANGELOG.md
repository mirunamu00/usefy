# @usefy/use-infinite-scroll

## 0.22.0

### Patch Changes

- @usefy/use-intersection-observer@0.22.0

## 0.21.1

### Patch Changes

- @usefy/use-intersection-observer@0.21.1

## 0.21.0

### Patch Changes

- Updated dependencies [ba7c5da]
  - @usefy/use-intersection-observer@0.21.0

## 0.20.0

### Minor Changes

- 65b754f: Add `useInfiniteScroll` — sentinel-driven infinite loading built on `IntersectionObserver`. Attach the returned callback ref to a sentinel element and `loadMore` fires once per intersection while `hasMore` is true, `loading` is false, and the hook is `enabled`. Composes `@usefy/use-intersection-observer`, adds a latest-callback pattern (changing `loadMore` never re-subscribes), an internal in-flight guard for async loads, `rootMargin`/`threshold`/`root` passthrough, and SSR/StrictMode safety. Re-exported from the `@usefy/hooks` umbrella.

### Patch Changes

- @usefy/use-intersection-observer@0.20.0
