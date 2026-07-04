<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-merged-refs</h1>

<p align="center">
  <strong>Merge multiple refs into one — the missing piece for forwardRef components</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-merged-refs"><img src="https://img.shields.io/npm/v/@usefy/use-merged-refs.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-merged-refs"><img src="https://img.shields.io/npm/dm/@usefy/use-merged-refs.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-merged-refs"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-merged-refs?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-merged-refs.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usemergedrefs--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useMergedRefs` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. It merges any mix of callback refs and ref objects into a single stable callback ref, so a `forwardRef` component can keep its **own** ref to a node while still honoring a forwarded ref.

## Features

- **Any ref shape** — callback refs, ref objects, and `null` / `undefined`, mixed freely
- **React 18 & 19** — supports React 19 callback-ref cleanup functions, with the classic "set `null` on unmount" fallback for the rest
- **Stable identity** — memoized on the given refs, so React re-runs the ref only when a ref actually changes
- **`mergeRefs` helper** — a non-hook version for composing refs outside of render
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — zero dependencies, published as its own package

## Installation

```bash
# npm
npm install @usefy/use-merged-refs

# yarn
yarn add @usefy/use-merged-refs

# pnpm
pnpm add @usefy/use-merged-refs
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { forwardRef, useRef } from "react";
import { useMergedRefs } from "@usefy/use-merged-refs";

const Input = forwardRef<HTMLInputElement, InputProps>((props, forwardedRef) => {
  // The component needs its own ref (to measure, focus, observe…) *and* must
  // honor the forwarded ref. Merge them into one.
  const localRef = useRef<HTMLInputElement>(null);
  const ref = useMergedRefs(localRef, forwardedRef);

  return <input {...props} ref={ref} />;
});
```

## API

### `useMergedRefs(...refs)`

```ts
function useMergedRefs<T>(
  ...refs: PossibleRef<T>[]
): (node: T | null) => (() => void) | void;
```

Merges the given refs into a single, memoized callback ref. Pass any number of callback refs, ref objects, or `null` / `undefined`. The returned callback assigns the node to every ref and only changes identity when one of the refs does.

| Param     | Type               | Description                                                                 |
| --------- | ------------------ | --------------------------------------------------------------------------- |
| `...refs` | `PossibleRef<T>[]` | The refs to merge. `PossibleRef<T>` is `Ref<T> \| undefined`; nullish entries are skipped. |

**Returns** a callback ref. When any provided callback ref returns a React 19 cleanup, the callback returns a cleanup that runs each ref's cleanup (resetting the others to `null`); otherwise it returns `void`.

### `mergeRefs(...refs)`

The non-hook core of `useMergedRefs` — same merging logic, without memoization. Use it when composing refs outside of render (e.g. in a class component or a one-off).

```ts
import { mergeRefs } from "@usefy/use-merged-refs";

const ref = mergeRefs(refA, refB);
```

### `setRef(ref, value)`

Assign a single value to one ref, whatever its form (callback ref → invoked; ref object → `.current` set; nullish → ignored). Returns the callback ref's cleanup if it returned one.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-merged-refs/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **15 tests**, 100% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
