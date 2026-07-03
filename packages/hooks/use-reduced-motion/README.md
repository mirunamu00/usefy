<h1 align="center">@usefy/use-reduced-motion</h1>

<p align="center">
  <strong>Track the user's reduced-motion preference (prefers-reduced-motion)</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-reduced-motion"><img src="https://img.shields.io/npm/v/@usefy/use-reduced-motion.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-reduced-motion"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-reduced-motion?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-reduced-motion.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

---

## Overview

`useReducedMotion` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — production-ready, TypeScript-first, SSR-safe React hooks. Track the user's reduced-motion preference (prefers-reduced-motion).

## Installation

```bash
npm install @usefy/use-reduced-motion
# or: pnpm add @usefy/use-reduced-motion / yarn add @usefy/use-reduced-motion
```

Requires React 18 or 19 (`peerDependencies: react ^18 || ^19`).

## Quick Start

```tsx
import { useReducedMotion } from "@usefy/use-reduced-motion";

const reduced = useReducedMotion();
<div style={{ transition: reduced ? "none" : "transform 300ms" }} />;
```

## API

`useReducedMotion(options?): boolean` — `options.defaultValue` sets the SSR fallback (default `false`).

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-reduced-motion/src/index.html" target="_blank" rel="noopener noreferrer"><strong>Coverage report</strong></a> — **6 tests**, 100% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00) — part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
