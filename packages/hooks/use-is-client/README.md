<h1 align="center">@usefy/use-is-client</h1>

<p align="center">
  <strong>Returns true once the component has hydrated on the client (SSR-safe)</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-is-client"><img src="https://img.shields.io/npm/v/@usefy/use-is-client.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-is-client"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-is-client?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-is-client.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

---

## Overview

`useIsClient` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. Returns true once the component has hydrated on the client (SSR-safe).

## Installation

```bash
npm install @usefy/use-is-client
# or: pnpm add @usefy/use-is-client / yarn add @usefy/use-is-client
```

Requires React 18 or 19 (`peerDependencies: react ^18 || ^19`).

## Quick Start

```tsx
import { useIsClient } from "@usefy/use-is-client";

const isClient = useIsClient();
return isClient ? <ClientOnly /> : <ServerFallback />;
```

## API

`useIsClient(): boolean` — `false` on the server and first render, `true` after hydration.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-is-client/src/index.html" target="_blank" rel="noopener noreferrer"><strong>Coverage report</strong></a> — **3 tests**, ~100% coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00) — part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
