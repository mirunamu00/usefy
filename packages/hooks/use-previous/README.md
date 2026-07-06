<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-previous</h1>

<p align="center">
  <strong>Returns the previous distinct value (the value from the last render it changed)</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-previous"><img src="https://img.shields.io/npm/v/@usefy/use-previous.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-previous"><img src="https://img.shields.io/npm/dm/@usefy/use-previous.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-previous"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-previous?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-previous.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-useprevious--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`usePrevious` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. It returns the previous **distinct** value: the value from the last render in which it actually changed (compared with `Object.is` by default), not simply the value one render ago. If a value is unchanged across a re-render, the returned "previous" does not advance — the behavior change-detection logic usually wants. Pass a custom comparator to treat referentially-different-but-equal values as unchanged.

## Features

- **Ref-based** — no extra re-render to track the previous value
- **Distinct tracking** — a value that never changes keeps `undefined`
- **Optional comparator** — ignore new-but-equal values (defaults to `Object.is`)
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — zero dependencies, published as its own package

## Installation

```bash
# npm
npm install @usefy/use-previous

# yarn
yarn add @usefy/use-previous

# pnpm
pnpm add @usefy/use-previous
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { usePrevious } from "@usefy/use-previous";

const [count, setCount] = useState(0);
const prev = usePrevious(count); // undefined, then the previous value
```

## API

`usePrevious<T>(value, isEqual?): T | undefined` — tracks the previous distinct value; pass `isEqual` (defaults to `Object.is`) to ignore new-but-equal values.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-previous/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **6 tests**, 100% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
