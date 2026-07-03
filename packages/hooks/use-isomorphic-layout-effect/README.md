<h1 align="center">@usefy/use-isomorphic-layout-effect</h1>

<p align="center">
  <strong>An SSR-safe useLayoutEffect that falls back to useEffect on the server</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-isomorphic-layout-effect"><img src="https://img.shields.io/npm/v/@usefy/use-isomorphic-layout-effect.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-isomorphic-layout-effect"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-isomorphic-layout-effect?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-isomorphic-layout-effect.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

---

## Overview

`useIsomorphicLayoutEffect` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. An SSR-safe useLayoutEffect that falls back to useEffect on the server.

## Installation

```bash
npm install @usefy/use-isomorphic-layout-effect
# or: pnpm add @usefy/use-isomorphic-layout-effect / yarn add @usefy/use-isomorphic-layout-effect
```

Requires React 18 or 19 (`peerDependencies: react ^18 || ^19`).

## Quick Start

```tsx
import { useIsomorphicLayoutEffect } from "@usefy/use-isomorphic-layout-effect";

useIsomorphicLayoutEffect(() => {
  const rect = ref.current?.getBoundingClientRect();
  setSize(rect);
}, []);
```

## API

`useIsomorphicLayoutEffect` — `useLayoutEffect` in the browser, `useEffect` on the server. Same signature as `useLayoutEffect`.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-isomorphic-layout-effect/src/index.html" target="_blank" rel="noopener noreferrer"><strong>Coverage report</strong></a> — **4 tests**, ~100% coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00) — part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
