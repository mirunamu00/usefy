<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-isomorphic-layout-effect</h1>

<p align="center">
  <strong>An SSR-safe useLayoutEffect that falls back to useEffect on the server</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-isomorphic-layout-effect"><img src="https://img.shields.io/npm/v/@usefy/use-isomorphic-layout-effect.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-isomorphic-layout-effect"><img src="https://img.shields.io/npm/dm/@usefy/use-isomorphic-layout-effect.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-isomorphic-layout-effect"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-isomorphic-layout-effect?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-isomorphic-layout-effect.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-useisomorphiclayouteffect--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useIsomorphicLayoutEffect` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. An SSR-safe useLayoutEffect that falls back to useEffect on the server.

## Features

- **No SSR warning** — uses `useEffect` on the server
- **Synchronous on client** — measure/mutate the DOM before paint
- **Drop-in** — same signature as `useLayoutEffect`
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — zero dependencies, published as its own package

## Installation

```bash
# npm
npm install @usefy/use-isomorphic-layout-effect

# yarn
yarn add @usefy/use-isomorphic-layout-effect

# pnpm
pnpm add @usefy/use-isomorphic-layout-effect
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useIsomorphicLayoutEffect } from "@usefy/use-isomorphic-layout-effect";

useIsomorphicLayoutEffect(() => {
  const rect = ref.current?.getBoundingClientRect();
  setSize(rect);
}, []);
```

## API

`useIsomorphicLayoutEffect` — resolves to `useLayoutEffect` in the browser and `useEffect` on the server. Same signature as `useLayoutEffect`.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-isomorphic-layout-effect/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **4 tests**, 100% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
