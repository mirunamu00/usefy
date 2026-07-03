<h1 align="center">@usefy/use-previous</h1>

<p align="center">
  <strong>Returns the value from the previous render</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-previous"><img src="https://img.shields.io/npm/v/@usefy/use-previous.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-previous"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-previous?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-previous.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

---

## Overview

`usePrevious` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. Returns the value from the previous render.

## Installation

```bash
npm install @usefy/use-previous
# or: pnpm add @usefy/use-previous / yarn add @usefy/use-previous
```

Requires React 18 or 19 (`peerDependencies: react ^18 || ^19`).

## Quick Start

```tsx
import { usePrevious } from "@usefy/use-previous";

const [count, setCount] = useState(0);
const prev = usePrevious(count); // undefined, then previous value
```

## API

`usePrevious<T>(value, isEqual?): T | undefined` — tracks the previous distinct value; pass `isEqual` (defaults to `Object.is`) to ignore new-but-equal values.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-previous/src/index.html" target="_blank" rel="noopener noreferrer"><strong>Coverage report</strong></a> — **4 tests**, ~100% coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00) — part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
