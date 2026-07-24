<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-mutation-observer</h1>

<p align="center">
  <strong>Watch an element for DOM mutations — child, attribute, and character-data changes — with the MutationObserver API</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-mutation-observer"><img src="https://img.shields.io/npm/v/@usefy/use-mutation-observer.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-mutation-observer"><img src="https://img.shields.io/npm/dm/@usefy/use-mutation-observer.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-mutation-observer"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-mutation-observer?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-mutation-observer.svg?style=flat-square&color=007acc" alt="license" /></a>
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
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usemutationobserver--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useMutationObserver` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. It wraps the browser's [`MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) API so you can react to DOM mutations — child nodes added/removed, attributes changing, or character data changing — by attaching a single callback `ref`.

It is the low-level observer primitive, a sibling to [`@usefy/use-resize-observer`](https://www.npmjs.com/package/@usefy/use-resize-observer) and [`@usefy/use-intersection-observer`](https://www.npmjs.com/package/@usefy/use-intersection-observer), and follows the same `ref` / `enabled` / `onXxx` / `updateState` conventions.

## Features

- **Callback ref** — attach `ref` to a node to observe it; pass `null` to disconnect
- **Full `MutationObserverInit` surface** — `childList`, `attributes`, `attributeFilter`, `attributeOldValue`, `characterData`, `characterDataOldValue`, `subtree`
- **Sensible default** — defaults to `childList: true` (and implies `attributes`/`characterData` from their sub-options) so `observe()` never throws
- **Callback + state** — react via `onMutation`, or the reactive `records` state, or both; `updateState: false` for zero-re-render callback-only mode
- **Stable callback** — `onMutation` is stored in a ref, so changing its identity every render does **not** tear down and re-create the observer
- **`enabled` toggle & manual controls** — pause observation, or drive `observe` / `disconnect` / `takeRecords` yourself
- **SSR-safe** — no `MutationObserver`/DOM access on the server; degrades to `isSupported: false`
- **StrictMode / concurrent-safe** — clean connect/disconnect with no leaked observers
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — zero dependencies, published as its own package

## Installation

```bash
# npm
npm install @usefy/use-mutation-observer

# yarn
yarn add @usefy/use-mutation-observer

# pnpm
pnpm add @usefy/use-mutation-observer
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useMutationObserver } from "@usefy/use-mutation-observer";

function Watched() {
  const { ref, records } = useMutationObserver<HTMLDivElement>({
    childList: true,
    subtree: true,
    onMutation: (mutations) => {
      for (const m of mutations) console.log(m.type, m.target);
    },
  });

  return <div ref={ref}>{records.length} recent mutations</div>;
}
```

## API

### `useMutationObserver<T>(options?)`

Observes the element attached via the returned `ref` for DOM mutations.

#### Options — `UseMutationObserverOptions<T>`

| Option                  | Type                                                        | Default  | Description                                                                                 |
| ----------------------- | ---------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `childList`             | `boolean`                                                  | `true`\* | Observe additions/removals of the target's child nodes                                      |
| `attributes`            | `boolean`                                                  | `false`  | Observe attribute changes (implied `true` when `attributeFilter`/`attributeOldValue` is set)|
| `attributeFilter`       | `string[]`                                                 | —        | Only observe the named attributes (implies `attributes: true`)                              |
| `attributeOldValue`     | `boolean`                                                  | `false`  | Record the previous attribute value in `MutationRecord.oldValue` (implies `attributes`)     |
| `characterData`         | `boolean`                                                  | `false`  | Observe character-data changes                                                              |
| `characterDataOldValue` | `boolean`                                                  | `false`  | Record the previous character data in `oldValue` (implies `characterData`)                  |
| `subtree`               | `boolean`                                                  | `false`  | Extend observation to the whole subtree, not just direct children                           |
| `onMutation`            | `(mutations: MutationRecord[], observer: MutationObserver) => void` | — | Callback fired with each batch of records (stored in a ref — safe to pass inline)   |
| `enabled`               | `boolean`                                                  | `true`   | When `false`, disconnects and stops reporting; flip back to `true` to re-observe            |
| `updateState`           | `boolean`                                                  | `true`   | Whether to mirror the latest batch into the `records` state. `false` = callback-only        |

\* `childList` defaults to `true` only when none of `childList`/`attributes`/`characterData` is enabled — the DOM API requires at least one.

#### Returns — `UseMutationObserverReturn<T>`

| Property      | Type                              | Description                                                             |
| ------------- | --------------------------------- | ----------------------------------------------------------------------- |
| `ref`         | `(element: T \| null) => void`    | Callback ref to attach to the target; `null` disconnects                |
| `records`     | `readonly MutationRecord[]`       | The latest batch of records (empty until the first mutation)            |
| `isSupported` | `boolean`                         | Whether the MutationObserver API is available                           |
| `isObserving` | `boolean`                         | Whether the hook is currently observing an element                      |
| `observe`     | `(element: T) => void`            | Manually start observing an element (escape hatch alongside `ref`)      |
| `disconnect`  | `() => void`                      | Disconnect the observer, stopping all observation                       |
| `takeRecords` | `() => MutationRecord[]`          | Flush and return any queued-but-undelivered records                     |

> **Note:** `MutationObserver` has no per-target `unobserve`; `disconnect()` (dropping all observation) is the only way to stop, matching the native API.
>
> `disconnect()` is **terminal**: after calling it, re-attaching the same `ref` does **not** restart observation (the ref only re-observes when the element changes, and the internal observer is torn down). To resume, call `observe(element)` again, or remount the component.

Also exported: `isMutationObserverSupported()` and `resolveMutationConfig(options)` (pure helpers), the `EMPTY_RECORDS` sentinel, and the `UseMutationObserverOptions`, `UseMutationObserverReturn`, `OnMutationCallback` types.

## Examples

### Callback-only mode (zero re-renders)

```tsx
import { useMutationObserver } from "@usefy/use-mutation-observer";

function ClassWatcher() {
  const { ref } = useMutationObserver({
    attributeFilter: ["class"],
    attributeOldValue: true,
    updateState: false, // skip state, handle everything in the callback
    onMutation: (mutations) => {
      const last = mutations[mutations.length - 1];
      console.log(last?.attributeName, "was", last?.oldValue);
    },
  });

  return <div ref={ref} className="box" />;
}
```

### Pause and resume observation

```tsx
import { useState } from "react";
import { useMutationObserver } from "@usefy/use-mutation-observer";

function Toggleable() {
  const [enabled, setEnabled] = useState(true);
  const { ref, records } = useMutationObserver({ childList: true, enabled });

  return (
    <div>
      <button onClick={() => setEnabled((e) => !e)}>
        {enabled ? "Pause" : "Resume"} observing
      </button>
      <div ref={ref}>{records.length} recent child mutations</div>
    </div>
  );
}
```

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/hooks/use-mutation-observer/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **62 tests**, 99% statement coverage.

- `useMutationObserver.test.ts` — 44 tests for hook behavior (observation, options passthrough, callback-ref, `enabled`, stable callback, manual control, cleanup, StrictMode, unsupported env)
- `utils.test.ts` — 18 tests for the config resolver and helpers

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
