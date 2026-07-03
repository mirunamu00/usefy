<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-event-callback</h1>

<p align="center">
  <strong>A stable callback that always sees the latest props and state</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-event-callback"><img src="https://img.shields.io/npm/v/@usefy/use-event-callback.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-event-callback"><img src="https://img.shields.io/npm/dm/@usefy/use-event-callback.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-event-callback"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-event-callback?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-event-callback.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-useeventcallback--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useEventCallback` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. A stable callback that always sees the latest props and state.

## Features

- **Stable identity** — pass to effects/listeners without re-subscribing
- **Always fresh** — reads the latest props and state when called
- **`useEffectEvent`-style** — the community equivalent
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — zero dependencies, published as its own package

## Installation

```bash
# npm
npm install @usefy/use-event-callback

# yarn
yarn add @usefy/use-event-callback

# pnpm
pnpm add @usefy/use-event-callback
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useEventCallback } from "@usefy/use-event-callback";

const onClick = useEventCallback(() => console.log(count));
// stable identity, always reads the current count
```

## API

`useEventCallback<Args, R>(fn): (...args) => R` — a referentially-stable function that proxies to the latest `fn`.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-event-callback/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **4 tests**, 100% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
