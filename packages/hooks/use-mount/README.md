<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-mount</h1>

<p align="center">
  <strong>Runs a callback once when the component mounts</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-mount"><img src="https://img.shields.io/npm/v/@usefy/use-mount.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-mount"><img src="https://img.shields.io/npm/dm/@usefy/use-mount.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-mount"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-mount?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-mount.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usemount--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useMount` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. Runs a callback once when the component mounts.

## Features

- **Mount-only** — clear intent, runs once
- **Optional cleanup** — return a function to run on unmount
- **Readable** — an alias for `useEffect(fn, [])`
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — zero dependencies, published as its own package

## Installation

```bash
# npm
npm install @usefy/use-mount

# yarn
yarn add @usefy/use-mount

# pnpm
pnpm add @usefy/use-mount
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useMount } from "@usefy/use-mount";

useMount(() => {
  analytics.page();
  return () => cleanup();
});
```

## API

`useMount(effect)` — runs `effect` once on mount; an optional returned function runs on unmount.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/hooks/use-mount/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **3 tests**, 100% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
