<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-latest</h1>

<p align="center">
  <strong>Returns a ref that always holds the latest value</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-latest"><img src="https://img.shields.io/npm/v/@usefy/use-latest.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-latest"><img src="https://img.shields.io/npm/dm/@usefy/use-latest.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-latest"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-latest?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-latest.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-uselatest--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useLatest` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. Returns a ref that always holds the latest value.

## Features

- **Stable identity** — safe as an effect dependency
- **No stale closures** — long-lived callbacks read the newest value
- **Synchronous** — `.current` updates on every render
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — zero dependencies, published as its own package

## Installation

```bash
# npm
npm install @usefy/use-latest

# yarn
yarn add @usefy/use-latest

# pnpm
pnpm add @usefy/use-latest
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useLatest } from "@usefy/use-latest";

const latest = useLatest(value);
// read latest.current inside stable callbacks / listeners
```

## API

`useLatest<T>(value): { readonly current: T }` — a stable ref whose `current` is updated to the latest `value` on every render.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-latest/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **3 tests**, 100% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
