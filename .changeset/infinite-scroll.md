---
"@usefy/use-infinite-scroll": minor
"@usefy/hooks": minor
---

Add `useInfiniteScroll` — sentinel-driven infinite loading built on `IntersectionObserver`. Attach the returned callback ref to a sentinel element and `loadMore` fires once per intersection while `hasMore` is true, `loading` is false, and the hook is `enabled`. Composes `@usefy/use-intersection-observer`, adds a latest-callback pattern (changing `loadMore` never re-subscribes), an internal in-flight guard for async loads, `rootMargin`/`threshold`/`root` passthrough, and SSR/StrictMode safety. Re-exported from the `@usefy/hooks` umbrella.
