# Per-package README template (standardized)

Every `packages/hooks/use-<name>/README.md` MUST follow this structure so all
packages read consistently on npm and GitHub. Substitute the `{{...}}` fields.
Do not omit the **📚 View Storybook Demo** link — that was the most common
inconsistency.

The Storybook link path is derived from the story title `Hooks/useX`:
`hooks-` + the hook name lowercased + `--docs`. So `useMediaQuery` →
`hooks-usemediaquery--docs`, matching `apps/storybook/.../useMediaQuery.stories.tsx`
(`title: "Hooks/useMediaQuery"`).

````markdown
<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-{{name}}</h1>

<p align="center">
  <strong>{{one-line tagline}}</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-{{name}}"><img src="https://img.shields.io/npm/v/@usefy/use-{{name}}.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-{{name}}"><img src="https://img.shields.io/npm/dm/@usefy/use-{{name}}.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-{{name}}"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-{{name}}?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-{{name}}.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-use{{hooklower}}--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`use{{Hook}}` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. {{tagline}}.

## Features

- {{hook-specific bullet}}
- {{hook-specific bullet}}
- {{hook-specific bullet}}
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — zero dependencies, published as its own package

## Installation

```bash
# npm
npm install @usefy/use-{{name}}

# yarn
yarn add @usefy/use-{{name}}

# pnpm
pnpm add @usefy/use-{{name}}
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { use{{Hook}} } from "@usefy/use-{{name}}";

{{minimal runnable usage}}
```

## API

{{signature + options table / prose}}

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/hooks/use-{{name}}/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **{{N}} tests**, {{NN%}} statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
````

Notes:
- Rich hooks whose options visibly change behavior (e.g. `use-hover`,
  `use-window-size`) may add extra sections (`## Examples`, `## Performance`,
  `## Browser Support`) — but the backbone above (header + badges + nav + **the
  Storybook link** + Overview + Features + Installation + Quick Start + API +
  Testing + License) is the required, consistent minimum for every package.
- Coverage % and test count must be the real numbers from `pnpm test:coverage`,
  not a blanket "100%".
- To standardize many packages at once, drive this template from a small
  data-per-hook table in a node script rather than hand-editing each file.
