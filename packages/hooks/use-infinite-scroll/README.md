<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-infinite-scroll</h1>

<p align="center">
  <strong>Sentinel-driven infinite loading built on IntersectionObserver — attach one ref, load more automatically</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-infinite-scroll"><img src="https://img.shields.io/npm/v/@usefy/use-infinite-scroll.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-infinite-scroll"><img src="https://img.shields.io/npm/dm/@usefy/use-infinite-scroll.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-infinite-scroll"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-infinite-scroll?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-infinite-scroll.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-useinfinitescroll--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useInfiniteScroll` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. It turns "load the next page when the user reaches the bottom" into a one-liner: render a small **sentinel** element at the end of your list, attach the returned ref, and your `loadMore` callback fires whenever that sentinel scrolls into view — once per intersection, never while a load is already in flight.

Built on top of [`@usefy/use-intersection-observer`](https://www.npmjs.com/package/@usefy/use-intersection-observer), so it inherits its SSR-safe and StrictMode-safe behavior — no scroll listeners, no offset math.

## Features

- **One ref, that's it** — `const ref = useInfiniteScroll(loadMore, { hasMore, loading })`; attach `ref` to a sentinel
- **Fires once per intersection** — it does not re-fire while the sentinel stays in view (the sentinel must leave and re-enter)
- **Respects `hasMore` / `loading` / `enabled`** — stops observing entirely once exhausted or disabled
- **No double-fire on async loads** — honours the `loading` flag *and* an internal in-flight guard: if `loadMore` returns a promise, it won't fire again until it settles
- **Latest-callback pattern** — changing `loadMore` (or the flags) never re-subscribes the observer
- **Prefetch support** — `rootMargin` fires `loadMore` before the sentinel is on screen; custom `root`, `threshold` supported
- **SSR-safe & StrictMode-safe** — returns an inert no-op ref on the server; no observer leaks
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — one small dependency, published as its own package

## Installation

```bash
# npm
npm install @usefy/use-infinite-scroll

# yarn
yarn add @usefy/use-infinite-scroll

# pnpm
pnpm add @usefy/use-infinite-scroll
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useState } from "react";
import { useInfiniteScroll } from "@usefy/use-infinite-scroll";

function Feed() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    setLoading(true);
    const { data, done } = await fetchNextPage(items.length);
    setItems((prev) => [...prev, ...data]);
    setHasMore(!done);
    setLoading(false);
  };

  const sentinelRef = useInfiniteScroll(loadMore, { hasMore, loading });

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.title}</li>
      ))}
      {/* Render the sentinel only while there is more to load. */}
      {hasMore && <li ref={sentinelRef} aria-hidden />}
    </ul>
  );
}
```

## API

```ts
const sentinelRef = useInfiniteScroll(loadMore, options?);
```

### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `loadMore` | `() => void \| Promise<void>` | Called to load the next page when the sentinel enters view. May be sync or async — when it returns a promise, the hook treats the load as in-flight and won't fire again until it settles. Changing this reference never re-subscribes the observer. |
| `options` | `UseInfiniteScrollOptions` | Optional configuration (see below). |

### Options — `UseInfiniteScrollOptions`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `hasMore` | `boolean` | `true` | Whether there is more to load. When `false`, the sentinel is **no longer observed** and `loadMore` never fires. Set it `false` after the last page. |
| `loading` | `boolean` | `false` | Whether a load is in progress. When `true`, an intersection will not trigger `loadMore`. Wire this to your own loading state. |
| `enabled` | `boolean` | `true` | Master switch. When `false`, the sentinel is not observed and `loadMore` never fires, regardless of `hasMore`/`loading`. |
| `rootMargin` | `string` | `"0px"` | CSS margin around the root. A positive value like `"300px"` fires `loadMore` *before* the sentinel is on screen (prefetch). |
| `threshold` | `number \| number[]` | `0` | Intersection ratio(s) that trigger a load. `0` fires as soon as a single pixel is visible. |
| `root` | `Element \| Document \| null` | `null` | The scroll container used as the observer root. `null` uses the browser viewport; pass a scrollable element to run infinite scroll inside a fixed-height panel. |

### Returns — `UseInfiniteScrollRef`

A **callback ref** — `(node: Element | null) => void` — to attach to your sentinel element. It has a stable identity across renders, so it is safe to pass directly to a `ref` prop.

### Behavior notes

- **Once per intersection.** `loadMore` fires when the sentinel *enters* view; it does not re-fire while the sentinel stays visible. If a load doesn't fill the viewport and the sentinel is still visible, the user scrolls (or the sentinel re-enters) to trigger the next page — this matches native infinite-scroll UX and avoids runaway loops.
- **No double-fire.** Two guards prevent overlapping loads: the `loading` prop you control, and an internal in-flight guard for the async case (a second intersection while the returned promise is pending is ignored). The hook does **not** surface `loadMore` errors — handle them inside `loadMore` (e.g. `try/catch` and reset your `loading` state).
- **Stops observing when exhausted.** Once `hasMore` is `false` (or `enabled` is `false`), the underlying observer disconnects — no wasted work.
- **SSR / StrictMode.** On the server (or where `IntersectionObserver` is unavailable) the returned ref is an inert no-op and nothing fires. Under StrictMode's double-mount the observer is set up and torn down cleanly.
- **Memoize `threshold` / `root`.** Changing `loadMore` and the `hasMore` / `loading` / `enabled` flags never re-subscribes the observer, but `threshold` and `root` are observer configuration — passing a fresh inline array (`threshold={[0, 0.5]}`) or element every render re-subscribes it. Hoist them to a constant or `useMemo`/ref if they are non-primitive.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/hooks/use-infinite-scroll/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **19 tests**, 100% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
