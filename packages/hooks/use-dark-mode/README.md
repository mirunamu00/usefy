<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-dark-mode</h1>

<p align="center">
  <strong>Dark mode with system detection, persistence, and DOM application</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-dark-mode"><img src="https://img.shields.io/npm/v/@usefy/use-dark-mode.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-dark-mode"><img src="https://img.shields.io/npm/dm/@usefy/use-dark-mode.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-dark-mode"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-dark-mode?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-dark-mode.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usedarkmode--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useDarkMode` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. Dark mode with system detection, persistence, and DOM application.

## Features

- **Three modes** — `system` follows the OS; `light`/`dark` override
- **Persisted + synced** — saved to `localStorage`, kept in sync across tabs
- **DOM application** — toggles a class or writes an attribute for you
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — zero dependencies, published as its own package

## Installation

```bash
# npm
npm install @usefy/use-dark-mode

# yarn
yarn add @usefy/use-dark-mode

# pnpm
pnpm add @usefy/use-dark-mode
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useDarkMode } from "@usefy/use-dark-mode";

const { isDark, toggle } = useDarkMode();
<button onClick={toggle}>{isDark ? "🌙" : "☀️"}</button>;
```

## API

`useDarkMode(options?): { mode, isDark, setMode, toggle, enable, disable }` — `mode` is `"system" | "light" | "dark"`. Options: `defaultMode` (`"system"`), `storageKey` (`"usefy-dark-mode"`), `element` (`<html>`), `attribute` (write an attribute instead of a class), `darkClass` (`"dark"`).

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-dark-mode/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **18 tests**, 96% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
