<h1 align="center">@usefy/use-update-effect</h1>

<p align="center">
  <strong>A useEffect variant that skips the first render</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-update-effect"><img src="https://img.shields.io/npm/v/@usefy/use-update-effect.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-update-effect"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-update-effect?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-update-effect.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

---

## Overview

`useUpdateEffect` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. A useEffect variant that skips the first render.

## Installation

```bash
npm install @usefy/use-update-effect
# or: pnpm add @usefy/use-update-effect / yarn add @usefy/use-update-effect
```

Requires React 18 or 19 (`peerDependencies: react ^18 || ^19`).

## Quick Start

```tsx
import { useUpdateEffect } from "@usefy/use-update-effect";

useUpdateEffect(() => {
  // runs only when `query` changes, not on mount
  search(query);
}, [query]);
```

## API

`useUpdateEffect(effect, deps?)` — same as `useEffect` but does not run on the initial render.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-update-effect/src/index.html" target="_blank" rel="noopener noreferrer"><strong>Coverage report</strong></a> — **4 tests**, ~100% coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00) — part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
