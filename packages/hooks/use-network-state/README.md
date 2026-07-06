<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-network-state</h1>

<p align="center">
  <strong>Track online/offline status and the Network Information API in one SSR-safe hook.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-network-state"><img src="https://img.shields.io/npm/v/@usefy/use-network-state.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-network-state"><img src="https://img.shields.io/npm/dm/@usefy/use-network-state.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-network-state"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-network-state?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-network-state.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-usenetworkstate--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useNetworkState` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks. It combines `navigator.onLine` with the [Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation) (`navigator.connection`) to give you a single, reactive snapshot of the device's connectivity and connection quality.

## Features

- **Online / offline** — `navigator.onLine`, updated on the window `online`/`offline` events, with a `since` timestamp of the last transition
- **Network Information** — `effectiveType`, `downlink`, `downlinkMax`, `rtt`, `saveData`, `type` from `navigator.connection` (with `mozConnection`/`webkitConnection` fallback), updated on its `change` event
- **Graceful degradation** — every Network Information field is `undefined` where the API is unsupported (Firefox, Safari); `online` always works and the hook never throws
- **SSR-safe & concurrent-safe** — built on `useSyncExternalStore`; returns a deterministic `{ online: true }` on the server, so there is no hydration mismatch
- **TypeScript-first** — full type inference and exported types (including the `EffectiveConnectionType` and `ConnectionType` unions)
- **Tiny & tree-shakeable** — zero dependencies, published as its own package

## Installation

```bash
# npm
npm install @usefy/use-network-state

# yarn
yarn add @usefy/use-network-state

# pnpm
pnpm add @usefy/use-network-state
```

Requires React 18 or 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

## Quick Start

```tsx
import { useNetworkState } from "@usefy/use-network-state";

function ConnectivityBanner() {
  const { online } = useNetworkState();
  if (online) return null;
  return <div role="alert">You are offline.</div>;
}
```

Adapt behaviour to connection quality:

```tsx
import { useNetworkState } from "@usefy/use-network-state";

function Hero() {
  const { effectiveType, saveData } = useNetworkState();
  const lowData = saveData || effectiveType === "slow-2g" || effectiveType === "2g";
  return lowData ? <LowResImage /> : <HighResImage />;
}
```

## API

### `useNetworkState(): NetworkState`

Takes no arguments and returns the current network state. The object identity is
stable between updates that don't change any observed value (safe as an effect
dependency).

#### `NetworkState`

| Field           | Type                                              | Description                                                                                     |
| --------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `online`        | `boolean`                                          | From `navigator.onLine`. Defaults to `true` on the server / without a `navigator`.              |
| `since`         | `Date \| undefined`                               | Timestamp of the last online/offline transition. `undefined` until the first transition occurs. |
| `downlink`      | `number \| undefined`                             | Estimated downlink speed in Mb/s.                                                                |
| `downlinkMax`   | `number \| undefined`                             | Maximum downlink speed of the underlying technology, in Mb/s.                                    |
| `effectiveType` | `"slow-2g" \| "2g" \| "3g" \| "4g" \| undefined`  | Effective connection type.                                                                       |
| `rtt`           | `number \| undefined`                             | Estimated effective round-trip time in ms.                                                       |
| `saveData`      | `boolean \| undefined`                            | Whether the user has requested reduced data usage ("Data Saver").                               |
| `type`          | `ConnectionType \| undefined`                     | Physical connection type (`"wifi"`, `"cellular"`, `"ethernet"`, …).                             |

All fields except `online` are `undefined` when the Network Information API is
unsupported.

#### Exported types & helpers

```ts
import {
  useNetworkState,
  getNetworkState,               // read a one-off snapshot outside React
  getConnection,                 // resolve navigator.connection (+ vendor prefixes)
  isNavigatorAvailable,          // SSR guard
  isNetworkInformationSupported, // feature detection
  areNetworkStatesEqual,         // field-by-field comparison
  SERVER_NETWORK_STATE,          // the inert server snapshot ({ online: true })
  type NetworkState,
  type UseNetworkStateReturn,
  type EffectiveConnectionType,
  type ConnectionType,
  type NetworkInformationLike,
} from "@usefy/use-network-state";
```

## Browser Support

- **Online/offline** (`online`, `since`) works everywhere.
- **Network Information** fields require a Chromium-based browser
  (Chrome, Edge, Opera, most Android browsers). Firefox and Safari do not
  implement the API, so those fields are `undefined` — always treat them as
  optional.

## Testing

📊 <a href="https://mirunamu00.github.io/usefy/coverage/use-network-state/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages) — **34 tests**, 95% statement coverage.

## License

MIT © [mirunamu](https://github.com/mirunamu00)

This package is part of the [usefy](https://github.com/mirunamu00/usefy) monorepo.
