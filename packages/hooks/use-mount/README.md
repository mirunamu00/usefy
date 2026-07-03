<h1 align="center">@usefy/use-mount</h1>

<p align="center">
  <strong>Runs a callback once when the component mounts</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-mount"><img src="https://img.shields.io/npm/v/@usefy/use-mount.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-mount"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-mount?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-mount.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

---

## Overview

`useMount` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. Runs a callback once when the component mounts.

## Installation

```bash
npm install @usefy/use-mount
# or: pnpm add @usefy/use-mount / yarn add @usefy/use-mount
```

Requires React 18 or 19 (`peerDependencies: react ^18 || ^19`).

## Quick Start

```tsx
import { useMount } from "@usefy/use-mount";

useMount(() => {
  analytics.page();
  return () => cleanup();
});
```

## API

`useMount(effect)` — runs `effect` once on mount; an optional returned function runs on unmount.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-mount/src/index.html" target="_blank" rel="noopener noreferrer"><strong>Coverage report</strong></a> — **3 tests**, ~100% coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00) — part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
