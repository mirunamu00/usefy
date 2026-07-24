<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-update-effect</h1>

<p align="center">
  <strong>A useEffect variant that skips the first render</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-update-effect"><img src="https://img.shields.io/npm/v/@usefy/use-update-effect.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-update-effect"><img src="https://img.shields.io/npm/dm/@usefy/use-update-effect.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-update-effect"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-update-effect?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-update-effect.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-useupdateeffect--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useUpdateEffect` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. A useEffect variant that skips the first render.

## Features

- **Skips mount** — no effect on the first render
- **Same signature** — `(effect, deps)` just like `useEffect`
- **Cleanup supported** — return a cleanup as usual
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — zero dependencies, published as its own package

## Installation

```bash
# npm
npm install @usefy/use-update-effect

# yarn
yarn add @usefy/use-update-effect

# pnpm
pnpm add @usefy/use-update-effect
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useUpdateEffect } from "@usefy/use-update-effect";

useUpdateEffect(() => {
  // runs only when `query` changes, not on mount
  search(query);
}, [query]);
```

## API

`useUpdateEffect(effect, deps?)` — same as `useEffect` but does not run on the initial render.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/hooks/use-update-effect/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **6 tests**, 100% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
