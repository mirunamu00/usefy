<h1 align="center">@usefy/use-latest</h1>

<p align="center">
  <strong>Returns a ref that always holds the latest value</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-latest"><img src="https://img.shields.io/npm/v/@usefy/use-latest.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-latest"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-latest?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-latest.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

---

## Overview

`useLatest` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. Returns a ref that always holds the latest value.

## Installation

```bash
npm install @usefy/use-latest
# or: pnpm add @usefy/use-latest / yarn add @usefy/use-latest
```

Requires React 18 or 19 (`peerDependencies: react ^18 || ^19`).

## Quick Start

```tsx
import { useLatest } from "@usefy/use-latest";

const latest = useLatest(value);
// read latest.current inside stable callbacks / listeners
```

## API

`useLatest<T>(value): { readonly current: T }` — stable ref whose `current` is updated to the latest `value` on every render.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-latest/src/index.html" target="_blank" rel="noopener noreferrer"><strong>Coverage report</strong></a> — **3 tests**, ~100% coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00) — part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
