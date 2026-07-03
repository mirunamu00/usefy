<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-preferred-color-scheme</h1>

<p align="center">
  <strong>Track the user's preferred color scheme (prefers-color-scheme)</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-preferred-color-scheme"><img src="https://img.shields.io/npm/v/@usefy/use-preferred-color-scheme.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-preferred-color-scheme"><img src="https://img.shields.io/npm/dm/@usefy/use-preferred-color-scheme.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-preferred-color-scheme"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-preferred-color-scheme?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-preferred-color-scheme.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usepreferredcolorscheme--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`usePreferredColorScheme` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. Track the user's preferred color scheme (prefers-color-scheme).

## Features

- **Live** — reflects OS theme changes immediately
- **SSR-safe** — configurable default scheme
- **Primitive** — pair with your own persistence for a full theme
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — zero dependencies, published as its own package

## Installation

```bash
# npm
npm install @usefy/use-preferred-color-scheme

# yarn
yarn add @usefy/use-preferred-color-scheme

# pnpm
pnpm add @usefy/use-preferred-color-scheme
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { usePreferredColorScheme } from "@usefy/use-preferred-color-scheme";

const scheme = usePreferredColorScheme(); // "light" | "dark"
```

## API

`usePreferredColorScheme(options?): "light" | "dark"` — `options.defaultScheme` sets the SSR fallback (default `"light"`).

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-preferred-color-scheme/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **6 tests**, 100% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
