<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-raf-state</h1>

<p align="center">
  <strong>A drop-in <code>useState</code> that batches updates to <code>requestAnimationFrame</code> — one commit per frame.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-raf-state"><img src="https://img.shields.io/npm/v/@usefy/use-raf-state.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-raf-state"><img src="https://img.shields.io/npm/dm/@usefy/use-raf-state.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-raf-state"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-raf-state?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-raf-state.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-userafstate--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useRafState` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. It's a drop-in replacement for `useState` whose setter **batches** every update to `requestAnimationFrame`, so a burst of rapid `setState` calls (scroll, resize, pointer move, animation loops) coalesces to **at most one commit per frame** — smoother UI and far fewer wasted re-renders.

## Features

- **Drop-in `useState` API** — same `[state, setState]` tuple, direct value or lazy `() => T` init, value-or-updater setter
- **rAF batching** — rapid updates coalesce to a single commit per frame (**last-write-wins**)
- **Stable setter** — wrapped in `useCallback([])`, safe as a child prop or effect dependency
- **Cancel on unmount** — any pending frame is cancelled, so no `setState` fires after unmount
- **SSR-safe** — never touches `requestAnimationFrame` at import; falls back to a synchronous update when rAF is unavailable
- **StrictMode / concurrent-safe** — no leaked or double-applied frames
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — published as its own package

## Installation

```bash
# npm
npm install @usefy/use-raf-state

# yarn
yarn add @usefy/use-raf-state

# pnpm
pnpm add @usefy/use-raf-state
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useEffect } from "react";
import { useRafState } from "@usefy/use-raf-state";

function MouseFollower() {
  const [pos, setPos] = useRafState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [setPos]);

  return (
    <div style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}>
      following you
    </div>
  );
}
```

## API

```ts
function useRafState<T>(initialState: T | (() => T)): [T, Dispatch<SetStateAction<T>>];
function useRafState<T = undefined>(): [T | undefined, Dispatch<SetStateAction<T | undefined>>];
```

The signature mirrors `useState`:

- **`initialState`** — a direct initial value, or a lazy initializer `() => T`. The initializer is forwarded straight to the underlying `useState`, so it runs **exactly once**.
- **Returns** a `[state, setState]` tuple. `setState` accepts a next value **or** a functional updater `(prev) => next` — the `SetStateAction<T>` is forwarded to the real setter, so updater semantics are preserved.

### Coalescing semantics — last-write-wins

When you call `setState`, a frame is scheduled. If you call it **again** before that frame fires, the previously scheduled frame is **cancelled** and a new one is scheduled, so **only the latest call in a frame commits**:

```tsx
setState(10);
setState(20);
setState(30); // → one re-render, commits 30
```

Functional updaters interact with coalescing the **same way** — only the last action survives, and it runs against the currently-committed state:

```tsx
// committed state is 0
setState((n) => n + 1);
setState((n) => n + 1);
setState((n) => n + 1); // → commits 1 (not 3): only the last updater runs
```

This is the correct, expected behaviour for this hook's target use case, where each scroll/resize/pointer event sets an **absolute** value. If you need increments to **accumulate** within a single frame, don't rely on per-call updaters — compute the absolute next value yourself and set that (e.g. `setState(base + delta)`).

### Behaviour notes

- **Stable setter** — the returned setter has a constant identity (`useCallback([])`); pass it to children or list it in effect deps freely.
- **Cancel on unmount** — the pending frame is cancelled on unmount; no state update fires afterwards.
- **SSR / unsupported environments** — if `requestAnimationFrame` is unavailable at call time, the update is applied **synchronously** rather than dropped. The hook never references `requestAnimationFrame` at module top level, so importing/rendering on the server is safe.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/hooks/use-raf-state/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **14 tests**, 100% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
