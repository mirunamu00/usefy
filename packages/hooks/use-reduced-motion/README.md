<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-reduced-motion</h1>

<p align="center">
  <strong>Track the user's reduced-motion preference (prefers-reduced-motion)</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-reduced-motion"><img src="https://img.shields.io/npm/v/@usefy/use-reduced-motion.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-reduced-motion"><img src="https://img.shields.io/npm/dm/@usefy/use-reduced-motion.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-reduced-motion"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-reduced-motion?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-reduced-motion.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usereducedmotion--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useReducedMotion` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. Track the user's reduced-motion preference (prefers-reduced-motion).

## Features

- **A11y-first** — honor motion sensitivity
- **Live** — reflects setting changes immediately
- **SSR-safe** — configurable default
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — zero dependencies, published as its own package

## Installation

```bash
# npm
npm install @usefy/use-reduced-motion

# yarn
yarn add @usefy/use-reduced-motion

# pnpm
pnpm add @usefy/use-reduced-motion
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useReducedMotion } from "@usefy/use-reduced-motion";

const reduced = useReducedMotion();
<div style={{ transition: reduced ? "none" : "transform 300ms" }} />;
```

## API

`useReducedMotion(options?): boolean`

- `options.defaultValue` — value returned on the server / when `matchMedia` is unavailable (default `false`).
- `options.initializeWithValue` — when `true` (default), the real preference is read synchronously on the first client render. Set to `false` to render `defaultValue` on the first client render and defer the real read to a post-commit effect, avoiding a hydration mismatch when the server rendered `defaultValue`.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/hooks/use-reduced-motion/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **9 tests**, 100% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
