# @usefy/use-infinite-scroll

## 1.1.0

### Patch Changes

- @usefy/use-intersection-observer@1.1.0

## 1.0.0

### Major Changes

- 8924240: usefy 1.0.0 — first stable release.

  All `@usefy/*` packages graduate to a stable **1.0.0** together (they share a
  fixed-version group). No API changes are required by this bump — it marks the
  public API as stable and ready for production semver guarantees.

  Also adds a `homepage` field to every published package, pointing at its page on
  the docs site (https://usefy-web.vercel.app) so the npm listing links straight
  to live docs.

### Patch Changes

- Updated dependencies [8924240]
  - @usefy/use-intersection-observer@1.0.0

## 0.25.1

### Patch Changes

- @usefy/use-intersection-observer@0.25.1

## 0.25.0

### Patch Changes

- @usefy/use-intersection-observer@0.25.0

## 0.24.0

### Patch Changes

- @usefy/use-intersection-observer@0.24.0

## 0.23.0

### Patch Changes

- @usefy/use-intersection-observer@0.23.0

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
