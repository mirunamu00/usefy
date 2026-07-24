<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-scroll-lock</h1>

<p align="center">
  <strong>Lock the page scroll for modals, drawers, and menus — iOS-aware, nested-lock counted, with scroll-position restore</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-scroll-lock"><img src="https://img.shields.io/npm/v/@usefy/use-scroll-lock.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-scroll-lock"><img src="https://img.shields.io/npm/dm/@usefy/use-scroll-lock.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-scroll-lock"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-scroll-lock?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-scroll-lock.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#examples">Examples</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usescrolllock--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useScrollLock` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. It locks the page (`document.body`) scroll — the reliable way to keep the background from scrolling behind a modal, drawer, or menu — and cleanly restores it.

Locking sets `overflow: hidden` on the body and adds `padding-right` equal to the scrollbar width so the content never jumps sideways when the scrollbar disappears. On iOS/Safari — where `overflow: hidden` does **not** stop touch scrolling — it instead pins the body with `position: fixed` and restores the scroll position with `window.scrollTo` on unlock.

A single module-level **reference counter** is shared by every instance, so N stacked locks (e.g. two nested modals) apply the body styles once and only restore the body when the **last** lock is released.

## Features

- **Nested / reference-counted** — a shared counter means multiple simultaneous locks apply the body styles once and restore only on the last release
- **iOS-aware** — `position: fixed` body fix plus scroll-position restore on Apple touch devices (where `overflow: hidden` isn't enough)
- **No layout shift** — compensates for the vanished scrollbar with matching `padding-right`
- **Idempotent per instance** — calling `lock()` twice never double-counts against the shared counter
- **StrictMode / concurrent-safe** — an unmount always releases a still-held lock; React 18's double mount never leaks
- **Original styles preserved** — the exact inline body styles (and scroll position) are captured on lock and written back on unlock
- **`enabled` convenience** — optionally hand the lock's lifetime to a boolean
- **SSR-safe** — no `window`/`document` access on the server; `isLocked` is `false` and `lock`/`unlock` are no-ops
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — published as its own package

## Installation

```bash
# npm
npm install @usefy/use-scroll-lock

# yarn
yarn add @usefy/use-scroll-lock

# pnpm
pnpm add @usefy/use-scroll-lock
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useEffect, useState } from "react";
import { useScrollLock } from "@usefy/use-scroll-lock";

function Modal() {
  const [open, setOpen] = useState(false);
  const { lock, unlock } = useScrollLock();

  useEffect(() => {
    if (open) lock();
    else unlock();
  }, [open, lock, unlock]);

  return (
    <>
      <button onClick={() => setOpen(true)}>Open modal</button>
      {open && (
        <div role="dialog" aria-modal="true">
          <button onClick={() => setOpen(false)}>Close</button>
        </div>
      )}
    </>
  );
}
```

## API

### `useScrollLock(options?)`

Returns `{ lock, unlock, isLocked }` for locking the page scroll.

#### Options — `UseScrollLockOptions`

| Option    | Type      | Default | Description                                                                                                                                                          |
| --------- | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled` | `boolean` | `false` | When `true`, hold a lock automatically for as long as it stays `true` (locks on mount, releases on unmount / when it flips `false`). Let it own the lock — don't also call `lock`/`unlock` on the same instance |

#### Returns — `UseScrollLockReturn`

| Property   | Type         | Description                                                                                                                             |
| ---------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `lock`     | `() => void` | Acquire a lock for this instance. **Stable** (`useCallback`) and idempotent — never double-counts against the shared counter          |
| `unlock`   | `() => void` | Release this instance's lock. **Stable** and idempotent. The body is only restored once the **last** lock across all instances is gone |
| `isLocked` | `boolean`    | Whether **this** instance currently holds a lock (the body may still be locked by another instance)                                    |

Also exported: the `isIOS` and `getScrollbarWidth` helpers, and the `UseScrollLockOptions` / `UseScrollLockReturn` types.

## Examples

### Nested locks (stacked modals)

Because the lock counter is shared, a second modal opened on top of the first doesn't re-apply the body styles, and closing it doesn't unlock the page while the first is still open:

```tsx
import { useScrollLock } from "@usefy/use-scroll-lock";

function Dialog({ open }: { open: boolean }) {
  // Each dialog holds its own lock; the body unlocks only when both are closed.
  useScrollLock({ enabled: open });
  return open ? <div role="dialog">…</div> : null;
}
```

### Declarative with `enabled`

```tsx
import { useState } from "react";
import { useScrollLock } from "@usefy/use-scroll-lock";

function Drawer() {
  const [open, setOpen] = useState(false);

  // The option owns the lock for the drawer's lifetime — no effect wiring.
  useScrollLock({ enabled: open });

  return (
    <>
      <button onClick={() => setOpen((v) => !v)}>Toggle drawer</button>
      {open && <aside>Drawer content</aside>}
    </>
  );
}
```

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/hooks/use-scroll-lock/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **37 tests**, 100% statement coverage.

- `useScrollLock.test.ts` — hook behavior (imperative lock/unlock, per-instance idempotency, nested locks across two instances, per-instance `isLocked`, unmount cleanup, the `enabled` option, and StrictMode double-mount safety)
- `scrollLockManager.test.ts` — the shared reference counter (single apply/restore, scrollbar-width padding, original-style preservation, the iOS `position: fixed` branch + `scrollTo` restore, negative-count guard, SSR no-op)
- `utils.test.ts` — the pure `isBrowser` / `isIOS` (iPhone, iPad, iPadOS-as-MacIntel, desktop Mac) / `getScrollbarWidth` helpers, including SSR guards

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
