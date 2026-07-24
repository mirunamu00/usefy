<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-is-first-render</h1>

<p align="center">
  <strong>Returns true only on the first render</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-is-first-render"><img src="https://img.shields.io/npm/v/@usefy/use-is-first-render.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-is-first-render"><img src="https://img.shields.io/npm/dm/@usefy/use-is-first-render.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-is-first-render"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-is-first-render?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-is-first-render.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-useisfirstrender--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useIsFirstRender` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. Returns true only on the first render.

## Features

- **Ref-based** — flips during render, no extra re-render
- **Per-instance** — each component tracks its own first render
- **Simple** — returns a boolean
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — zero dependencies, published as its own package

## Installation

```bash
# npm
npm install @usefy/use-is-first-render

# yarn
yarn add @usefy/use-is-first-render

# pnpm
pnpm add @usefy/use-is-first-render
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useIsFirstRender } from "@usefy/use-is-first-render";

const isFirst = useIsFirstRender();
if (!isFirst) onValueChange(value);
```

## API

`useIsFirstRender(): boolean` — `true` on the first render, `false` on every render thereafter.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/hooks/use-is-first-render/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **3 tests**, 100% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
