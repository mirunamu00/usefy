<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-script</h1>

<p align="center">
  <strong>Load an external script with idle/loading/ready/error status, tag deduplication, and ref-counted cleanup.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-script"><img src="https://img.shields.io/npm/v/@usefy/use-script.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-script"><img src="https://img.shields.io/npm/dm/@usefy/use-script.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-script"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-script?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-script.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usescript--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useScript` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. It injects an external `<script>` and tracks its loading status, deduplicating the tag so multiple components that need the same source share a single load.

## Features

- **Lifecycle status** — returns a bare `idle | loading | ready | error` string, so `const status = useScript(src)` reads true
- **Deduplication** — a module-level registry keyed by `src` guarantees **one** shared `<script>` tag no matter how many components request the same source; all subscribers re-render together when it resolves
- **Conditional loading** — pass `null`/`undefined` (or `shouldPreventLoad`) to stay `idle` and inject nothing
- **Adopts existing tags** — reuses a matching `<script>` already in the DOM (server-rendered or added by another library) instead of re-injecting
- **Ref-counted cleanup** — `removeOnUnmount` removes the tag only when the last subscriber unmounts
- **SSR-safe & StrictMode-safe** — built on `useSyncExternalStore`; returns `idle` on the server and a double-mount never injects two tags
- **TypeScript-first** — full type inference and exported types
- **Tiny & tree-shakeable** — zero dependencies, published as its own package

## Installation

```bash
# npm
npm install @usefy/use-script

# yarn
yarn add @usefy/use-script

# pnpm
pnpm add @usefy/use-script
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useScript } from "@usefy/use-script";

function StripeCheckout() {
  const status = useScript("https://js.stripe.com/v3", {
    attributes: { id: "stripe-js" },
  });

  if (status === "loading") return <span>Loading payment form…</span>;
  if (status === "error") return <span>Failed to load Stripe.</span>;
  if (status !== "ready") return null;

  return <PaymentForm stripe={window.Stripe(PUBLISHABLE_KEY)} />;
}
```

## API

```ts
const status = useScript(src, options?);
```

### Parameters

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `src` | `string \| null \| undefined` | The script URL. `null`/`undefined` keeps the hook `idle` and injects nothing — the idiomatic way to load conditionally. |
| `options` | `UseScriptOptions` | Optional. See below. |

### `UseScriptOptions`

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `removeOnUnmount` | `boolean` | `false` | Remove the injected `<script>` on unmount, **only** if no other mounted `useScript` for the same `src` remains (ref-counted). Removing a script does not un-run its side effects. |
| `shouldPreventLoad` | `boolean` | `false` | When `true`, the hook stays `idle` and loads nothing regardless of `src` — gate a load behind consent or a feature flag. |
| `attributes` | `Record<string, string>` | — | Extra attributes for the **created** tag (`id`, `data-*`, `crossorigin`, `async`, `defer`, …). Applied only on creation; an adopted pre-existing tag is left untouched. Defaults to `async` unless `async`/`defer` is supplied here. |

### Returns

`ScriptStatus` — one of:

| Value | Meaning |
| ----- | ------- |
| `"idle"` | Nothing is loading (`src` is `null`/`undefined`, `shouldPreventLoad` is set, or on the server). |
| `"loading"` | The `<script>` has been injected and is downloading/executing. |
| `"ready"` | The script fired `load` (or an already-loaded tag was adopted). |
| `"error"` | The script fired `error` (network failure, blocked, …). |

### Deduplication & shared status

All state lives in a **module-level registry keyed by `src`**. The first `useScript(src)` to mount creates one `<script>` (or adopts a matching tag already in the DOM) and sets a `data-status` attribute; every later `useScript(src)` shares that single tag and its status. When the script resolves, the registry flips the shared status and notifies **all** subscribers, so every component re-renders together.

```tsx
// Two components, one <script> tag — both observe the same status.
function WidgetA() {
  const status = useScript("https://cdn.example.com/widget.js");
  return <div>A: {status}</div>;
}

function WidgetB() {
  const status = useScript("https://cdn.example.com/widget.js");
  return <div>B: {status}</div>;
}
```

### Adopting an existing tag

If a matching `<script>` is already in the DOM, `useScript` adopts it instead of re-injecting. When it carries a `data-status` attribute, that status is trusted; a tag **without** `data-status` (e.g. server-rendered or added by another library) is treated as `ready`, because a `load` listener attached after the fact would never fire for a script that has already executed.

### `getScriptStatus(src)`

Read the current shared status for a `src` imperatively (outside React), once some component has begun loading it:

```ts
import { getScriptStatus } from "@usefy/use-script";

if (getScriptStatus("https://cdn.example.com/sdk.js") === "ready") {
  window.SDK.init();
}
```

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-script/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **30 tests**, 96% statement coverage (100% line coverage).

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
