<h1 align="center">@usefy/use-is-first-render</h1>

<p align="center">
  <strong>Returns true only on the first render</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-is-first-render"><img src="https://img.shields.io/npm/v/@usefy/use-is-first-render.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-is-first-render"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-is-first-render?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-is-first-render.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

---

## Overview

`useIsFirstRender` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. Returns true only on the first render.

## Installation

```bash
npm install @usefy/use-is-first-render
# or: pnpm add @usefy/use-is-first-render / yarn add @usefy/use-is-first-render
```

Requires React 18 or 19 (`peerDependencies: react ^18 || ^19`).

## Quick Start

```tsx
import { useIsFirstRender } from "@usefy/use-is-first-render";

const isFirst = useIsFirstRender();
if (!isFirst) onValueChange(value);
```

## API

`useIsFirstRender(): boolean` — `true` on the first render, `false` on every render thereafter.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-is-first-render/src/index.html" target="_blank" rel="noopener noreferrer"><strong>Coverage report</strong></a> — **3 tests**, ~100% coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00) — part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
