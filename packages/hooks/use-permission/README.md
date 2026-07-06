<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-permission</h1>

<p align="center">
  <strong>Permissions API status with live updates — SSR-safe, typed, and race-safe.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-permission"><img src="https://img.shields.io/npm/v/@usefy/use-permission.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-permission"><img src="https://img.shields.io/npm/dm/@usefy/use-permission.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-permission"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-permission?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-permission.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usepermission--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`usePermission` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. It reads the [Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API) status of a permission and keeps it up to date live, so your UI reacts when the user grants or revokes access.

## Features

- **Live updates** — subscribes to the `PermissionStatus` `change` event, so `state` reflects grant/revoke without polling or a re-mount.
- **Rich, honest return** — `{ state, status, isSupported, error }` makes the async, unsupported, and error paths explicit instead of hiding them behind a bare `PermissionState`.
- **Any permission name** — accepts a superset of `PermissionDescriptor`, so `camera`, `microphone`, `push`, `midi`, and future names all typecheck.
- **Stable descriptor identity** — keyed on the descriptor's serialized contents, so an inline `{ name: 'camera' }` literal does not re-query every render (no caller-side `useMemo`).
- **SSR-safe & StrictMode-safe** — reports `unsupported` on the server; the async query is race-guarded and the change listener is cleaned up on unmount.
- **TypeScript-first** — full type inference and exported types.
- **Tiny & tree-shakeable** — zero dependencies, published as its own package.

## Installation

```bash
# npm
npm install @usefy/use-permission

# yarn
yarn add @usefy/use-permission

# pnpm
pnpm add @usefy/use-permission
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { usePermission } from "@usefy/use-permission";

function CameraStatus() {
  const { state, status } = usePermission({ name: "camera" });

  // Branch on `status` (deterministic "idle" on the first render, both on the
  // server and client) so the UI is hydration-safe.
  if (status === "idle" || status === "pending") return <span>Checking…</span>;
  if (status === "unsupported") return <span>Permissions API unavailable</span>;
  if (status === "error") return <span>Could not read camera permission</span>;

  return <span>Camera: {state}</span>; // 'granted' | 'denied' | 'prompt'
}
```

## API

### `usePermission(descriptor)`

```ts
function usePermission(descriptor: UsePermissionDescriptor): UsePermissionReturn;
```

#### Parameters

| Param | Type | Description |
| ----- | ---- | ----------- |
| `descriptor` | `UsePermissionDescriptor` | The permission to query, e.g. `{ name: 'camera' }`, `{ name: 'geolocation' }`, `{ name: 'push', userVisibleOnly: true }`, `{ name: 'midi', sysex: true }`. `name` accepts the standard `PermissionName` values (with autocomplete) plus any browser-specific string. Pass an inline literal freely — the hook keys re-queries on the descriptor's serialized contents, not its object identity. |

#### Returns — `UsePermissionReturn`

| Field | Type | Description |
| ----- | ---- | ----------- |
| `state` | `PermissionState \| null` | The raw permission state (`'granted' \| 'denied' \| 'prompt'`), or `null` until the first query resolves and whenever the API is unsupported or the query errored. |
| `status` | `UsePermissionStatus` | Coarse lifecycle: `'idle' \| 'pending' \| 'granted' \| 'denied' \| 'prompt' \| 'unsupported' \| 'error'`. The three permission values mirror `state`, so you can branch on either. |
| `isSupported` | `boolean` | Whether `navigator.permissions.query` is available. Starts `false` (on the server and the first client render, for hydration safety) and becomes `true` after mount in a supporting browser. Branch your first render on `status` (`'idle'`), not `isSupported`. |
| `error` | `Error \| null` | The error thrown by `navigator.permissions.query()`, if the query rejected (e.g. an unknown permission name in a browser that throws). |

#### Helpers

- `isPermissionsSupported(): boolean` — capability check used internally; exported for feature-detection.
- `serializeDescriptor(descriptor): string` — the stable-key function the hook uses to decide when to re-query (exported for advanced use; not part of the umbrella surface).

### Notes on behavior

- **Descriptor identity.** `usePermission({ name: 'camera' })` receives a fresh object literal every render. Rather than require callers to `useMemo` it, the hook derives a stable string key from the descriptor's own fields (sorted, JSON-serialized) and keys its effect on that. It re-queries only when the meaningful contents change, e.g. `name` `'camera'` → `'microphone'` or `userVisibleOnly` `true` → `false`.
- **Unsupported.** If `navigator.permissions` is missing (SSR or an unsupporting browser), `status` is `'unsupported'`, `isSupported` is `false`, and `state` is `null`.
- **Errors.** Some browsers reject `query()` for permission names they don't recognize (e.g. `camera` in Firefox) instead of returning `'denied'`. That surfaces as `status: 'error'` with the thrown `error`.
- **Race safety.** If the component unmounts while a query is in flight, the stale resolution/rejection is ignored — no state update after unmount — and the `change` listener is always removed on cleanup.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-permission/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **18 tests**, 100% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
