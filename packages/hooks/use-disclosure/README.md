<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-disclosure</h1>

<p align="center">
  <strong>open / close / toggle state for modals, drawers, popovers &amp; accordions</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-disclosure"><img src="https://img.shields.io/npm/v/@usefy/use-disclosure.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-disclosure"><img src="https://img.shields.io/npm/dm/@usefy/use-disclosure.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-disclosure"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-disclosure?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-disclosure.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usedisclosure--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useDisclosure` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. It manages a boolean "open" state with `open` / `close` / `toggle` handlers, the ergonomic primitive behind modals, drawers, popovers, dropdowns, and accordions.

## Features

- **`open` / `close` / `toggle`** — with **stable identities**, safe to pass as props or list in effect dependencies
- **Transition callbacks** — optional `onOpen` / `onClose`, fired only on a *real* state change
- **No-op safe** — `open()` while already open (and `close()` while already closed) does nothing and fires nothing
- **StrictMode-safe** — callbacks are dispatched from the event handler, never from inside a `setState` updater, so they never double-fire
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — zero dependencies, published as its own package

## Installation

```bash
# npm
npm install @usefy/use-disclosure

# yarn
yarn add @usefy/use-disclosure

# pnpm
pnpm add @usefy/use-disclosure
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useDisclosure } from "@usefy/use-disclosure";

function Example() {
  const [opened, { open, close, toggle }] = useDisclosure(false);

  return (
    <>
      <button onClick={open}>Open</button>
      <button onClick={toggle}>Toggle</button>
      {opened && (
        <div role="dialog">
          Modal content
          <button onClick={close}>Close</button>
        </div>
      )}
    </>
  );
}
```

## API

```ts
const [opened, { open, close, toggle }] = useDisclosure(
  initialState, // boolean — starts open? (default: false)
  options,      // { onOpen?, onClose? } — optional transition callbacks
);
```

### Parameters

| Param          | Type                   | Default | Description                                                        |
| -------------- | ---------------------- | ------- | ------------------------------------------------------------------ |
| `initialState` | `boolean`              | `false` | Whether the disclosure starts open.                                |
| `options`      | `UseDisclosureOptions` | `{}`    | `{ onOpen?, onClose? }` — called on closed→open / open→closed.     |

### Returns — `UseDisclosureReturn`

A `readonly [opened, handlers]` tuple:

- **`opened: boolean`** — the current state.
- **`handlers: { open, close, toggle }`** — control functions with stable identities.
  - **`open()`** — set to `true`; fires `onOpen` only on a real closed → open change.
  - **`close()`** — set to `false`; fires `onClose` only on a real open → closed change.
  - **`toggle()`** — flip the state, firing the matching `onOpen` / `onClose`.

### Example — reacting to transitions

```tsx
const [opened, handlers] = useDisclosure(false, {
  onOpen: () => trackEvent("drawer_opened"),
  onClose: () => trackEvent("drawer_closed"),
});
```

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-disclosure/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **13 tests**, 100% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
