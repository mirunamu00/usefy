<h1 align="center">@usefy/use-event-callback</h1>

<p align="center">
  <strong>A stable callback that always sees the latest props and state</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-event-callback"><img src="https://img.shields.io/npm/v/@usefy/use-event-callback.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-event-callback"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-event-callback?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-event-callback.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

---

## Overview

`useEventCallback` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. A stable callback that always sees the latest props and state.

## Installation

```bash
npm install @usefy/use-event-callback
# or: pnpm add @usefy/use-event-callback / yarn add @usefy/use-event-callback
```

Requires React 18 or 19 (`peerDependencies: react ^18 || ^19`).

## Quick Start

```tsx
import { useEventCallback } from "@usefy/use-event-callback";

const onClick = useEventCallback(() => console.log(count));
// stable identity, always reads the current count
```

## API

`useEventCallback<Args, R>(fn): (...args) => R` — referentially-stable function that proxies to the latest `fn` (community `useEffectEvent`).

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-event-callback/src/index.html" target="_blank" rel="noopener noreferrer"><strong>Coverage report</strong></a> — **4 tests**, ~100% coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00) — part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
