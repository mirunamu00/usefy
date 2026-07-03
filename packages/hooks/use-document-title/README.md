<h1 align="center">@usefy/use-document-title</h1>

<p align="center">
  <strong>Set document.title with restore-on-unmount</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-document-title"><img src="https://img.shields.io/npm/v/@usefy/use-document-title.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-document-title"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-document-title?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-document-title.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

---

## Overview

`useDocumentTitle` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — production-ready, TypeScript-first, SSR-safe React hooks. Set document.title with restore-on-unmount.

## Installation

```bash
npm install @usefy/use-document-title
# or: pnpm add @usefy/use-document-title / yarn add @usefy/use-document-title
```

Requires React 18 or 19 (`peerDependencies: react ^18 || ^19`).

## Quick Start

```tsx
import { useDocumentTitle } from "@usefy/use-document-title";

useDocumentTitle(`Inbox (${unread})`);
```

## API

`useDocumentTitle(title, options?)` — `options.restoreOnUnmount` (default `false`) restores the title present at mount when the component unmounts.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-document-title/src/index.html" target="_blank" rel="noopener noreferrer"><strong>Coverage report</strong></a> — **5 tests**, 92% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00) — part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
