<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-document-title</h1>

<p align="center">
  <strong>Set document.title with restore-on-unmount</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-document-title"><img src="https://img.shields.io/npm/v/@usefy/use-document-title.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-document-title"><img src="https://img.shields.io/npm/dm/@usefy/use-document-title.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-document-title"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-document-title?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-document-title.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usedocumenttitle--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useDocumentTitle` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. Set document.title with restore-on-unmount.

## Features

- **Reactive** — updates the tab title whenever the value changes
- **Restore on unmount** — optionally put the previous title back
- **SSR-safe** — no-op when `document` is unavailable
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — zero dependencies, published as its own package

## Installation

```bash
# npm
npm install @usefy/use-document-title

# yarn
yarn add @usefy/use-document-title

# pnpm
pnpm add @usefy/use-document-title
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useDocumentTitle } from "@usefy/use-document-title";

useDocumentTitle(`Inbox (${unread})`);
```

## API

`useDocumentTitle(title, options?)` — `options.restoreOnUnmount` (default `false`) restores the title present at mount when the component unmounts.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-document-title/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **5 tests**, 92% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
