<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-is-client</h1>

<p align="center">
  <strong>Returns true once the component has hydrated on the client (SSR-safe)</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-is-client"><img src="https://img.shields.io/npm/v/@usefy/use-is-client.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-is-client"><img src="https://img.shields.io/npm/dm/@usefy/use-is-client.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-is-client"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-is-client?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-is-client.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-useisclient--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useIsClient` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. Returns true once the component has hydrated on the client (SSR-safe).

## Features

- **SSR-safe** — the first render matches the server output
- **Zero config** — no arguments, returns a boolean
- **Hydration guard** — enable client-only UI only after mount
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — zero dependencies, published as its own package

## Installation

```bash
# npm
npm install @usefy/use-is-client

# yarn
yarn add @usefy/use-is-client

# pnpm
pnpm add @usefy/use-is-client
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useIsClient } from "@usefy/use-is-client";

const isClient = useIsClient();
return isClient ? <ClientOnly /> : <ServerFallback />;
```

## API

`useIsClient(): boolean` — `false` on the server and the first render, `true` after hydration.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-is-client/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **4 tests**, 100% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
