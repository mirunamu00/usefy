<h1 align="center">@usefy/use-media-query</h1>

<p align="center">
  <strong>Match CSS media queries with matchMedia and SSR support</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-media-query"><img src="https://img.shields.io/npm/v/@usefy/use-media-query.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-media-query"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-media-query?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-media-query.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

---

## Overview

`useMediaQuery` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — production-ready, TypeScript-first, SSR-safe React hooks. Match CSS media queries with matchMedia and SSR support.

## Installation

```bash
npm install @usefy/use-media-query
# or: pnpm add @usefy/use-media-query / yarn add @usefy/use-media-query
```

Requires React 18 or 19 (`peerDependencies: react ^18 || ^19`).

## Quick Start

```tsx
import { useMediaQuery } from "@usefy/use-media-query";

const isDesktop = useMediaQuery("(min-width: 1024px)");
return isDesktop ? <DesktopNav /> : <MobileNav />;
```

## API

`useMediaQuery(query, options?): boolean` — `options`: `defaultValue` (SSR value, default `false`), `initializeWithValue` (read eagerly on first client render, default `true`).

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-media-query/src/index.html" target="_blank" rel="noopener noreferrer"><strong>Coverage report</strong></a> — **12 tests**, 100% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00) — part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
