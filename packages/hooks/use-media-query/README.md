<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-media-query</h1>

<p align="center">
  <strong>Match CSS media queries with matchMedia and SSR support</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-media-query"><img src="https://img.shields.io/npm/v/@usefy/use-media-query.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-media-query"><img src="https://img.shields.io/npm/dm/@usefy/use-media-query.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-media-query"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-media-query?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-media-query.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usemediaquery--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useMediaQuery` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. Match CSS media queries with matchMedia and SSR support.

## Features

- **Live updates** — re-renders when the query starts/stops matching
- **SSR-safe** — configurable default + deferred initialization
- **Any query** — breakpoints, orientation, `prefers-*`, etc.
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — zero dependencies, published as its own package

## Installation

```bash
# npm
npm install @usefy/use-media-query

# yarn
yarn add @usefy/use-media-query

# pnpm
pnpm add @usefy/use-media-query
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useMediaQuery } from "@usefy/use-media-query";

const isDesktop = useMediaQuery("(min-width: 1024px)");
return isDesktop ? <DesktopNav /> : <MobileNav />;
```

## API

`useMediaQuery(query, options?): boolean` — `options`: `defaultValue` (SSR value, default `false`), `initializeWithValue` (read eagerly on the first client render, default `true`).

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-media-query/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **12 tests**, 100% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
