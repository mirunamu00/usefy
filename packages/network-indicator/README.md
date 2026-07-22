<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/network-indicator</h1>

<p align="center">
  <strong>Drop-in React online/offline status banner</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/network-indicator">
    <img src="https://img.shields.io/npm/v/@usefy/network-indicator.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/network-indicator">
    <img src="https://img.shields.io/npm/dm/@usefy/network-indicator.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/network-indicator">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/network-indicator?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/network-indicator.svg?style=flat-square&color=007acc" alt="license" />
  </a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#examples">Examples</a> •
  <a href="#accessibility">Accessibility</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/story/network-indicator--overview" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`@usefy/network-indicator` is the online/offline banner every app needs, as a single drop-in component. Mount `<NetworkIndicator />` once at your app root:

- **While online** it renders **nothing** (steady state).
- When the connection is **lost** it shows a fixed offline banner — *"You're offline. Some features may not work."*
- When the connection **returns** it swaps to a brief **"Back online"** confirmation that auto-dismisses (default 3s), then renders nothing again.
- It **never flashes "Back online" on first mount** — the confirmation only ever follows an observed offline → online transition.

Built on the [`@usefy/use-network-state`](https://www.npmjs.com/package/@usefy/use-network-state) hook — SSR-safe, StrictMode-safe, tear-free under concurrent rendering.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem.**

### Why network-indicator?

- **Zero-config** — sensible default messages and inline styling; no CSS import required
- **Correct state machine** — no reconnect flash on mount, offline-during-flash handled, timers cleaned up on unmount
- **Fully customizable** — ReactNode messages, `className`/`style` passthrough, or take over the UI entirely with `render`
- **Accessible by default** — non-interactive banner; offline is an assertive `role="alert"`, reconnected a polite `role="status"`
- **SSR compatible** — no `window` access at render; Next.js/Remix-safe
- **TypeScript first** — every prop and state shape exported

---

## Installation

```bash
# npm
npm install @usefy/network-indicator

# yarn
yarn add @usefy/network-indicator

# pnpm
pnpm add @usefy/network-indicator
```

### Peer Dependencies

Requires React 18 or 19:

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  }
}
```

---

## Quick Start

```tsx
import { NetworkIndicator } from "@usefy/network-indicator";

function App() {
  return (
    <>
      <YourApp />
      {/* Mount once at the root — renders nothing while online */}
      <NetworkIndicator />
    </>
  );
}
```

> **Note:** Styling is inline — no CSS import required.

---

## Features

### Offline banner

The moment `navigator.onLine` flips to `false` (window `offline` event), a fixed, full-width, non-interactive banner appears at the chosen edge. It stays until connectivity returns — there is no auto-dismiss while offline.

### "Back online" confirmation

On reconnect the banner swaps to a green confirmation that auto-dismisses after `onlineDuration` ms (default `3000`). Set `onlineDuration={0}` (or any value ≤ 0) to skip the confirmation entirely. Mounting while already offline shows the offline banner immediately; mounting while online shows nothing — no flash, ever.

### Bring your own UI

Pass `render` to keep the state machine but own every pixel:

```tsx
<NetworkIndicator
  render={({ online, reconnected }) => {
    if (online && !reconnected) return null;
    return <MyToast tone={online ? "success" : "danger"} />;
  }}
/>
```

---

## API Reference

### `<NetworkIndicator />` Props

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `position` | `"top" \| "bottom"` | `"top"` | Which screen edge the fixed banner is pinned to. |
| `offlineMessage` | `ReactNode` | `"You're offline. Some features may not work."` | Content of the offline banner. |
| `onlineMessage` | `ReactNode` | `"Back online"` | Content of the reconnected confirmation. |
| `onlineDuration` | `number` | `3000` | How long (ms) the confirmation stays before auto-dismissing. `0` or negative disables it. Changing it mid-confirmation restarts the timer from zero with the new duration. |
| `render` | `(state: NetworkIndicatorState) => ReactNode` | — | Escape hatch: replaces the default banner entirely; called on every render (including steady-state online) with `{ online, reconnected }`. |
| `onStatusChange` | `(online: boolean) => void` | — | Called after each online/offline transition (never on mount). |
| `className` | `string` | — | Class applied to the default banner element. |
| `style` | `CSSProperties` | — | Inline styles merged over the defaults (yours win). |

### `NetworkIndicatorState`

```ts
interface NetworkIndicatorState {
  /** Current connectivity, from navigator.onLine (true on the server). */
  online: boolean;
  /** True during the "back online" confirmation window. */
  reconnected: boolean;
}
```

### Other exports

| Export | Description |
| ------ | ----------- |
| `NetworkIndicatorProps` | Props type. |
| `NetworkIndicatorPosition` | `"top" \| "bottom"`. |
| `DEFAULT_OFFLINE_MESSAGE` / `DEFAULT_ONLINE_MESSAGE` / `DEFAULT_ONLINE_DURATION` | The defaults, for reuse in custom `render` UIs. |

The default banner also exposes `data-status="offline" | "reconnected"` and `data-position` attributes for styling and testing.

---

## Examples

### Custom messages and bottom position

```tsx
<NetworkIndicator
  position="bottom"
  offlineMessage={<span>⚠️ Connection lost — changes will sync when you're back.</span>}
  onlineMessage={<span>✅ Connection restored</span>}
  onlineDuration={5000}
/>
```

### Disable the reconnected confirmation

```tsx
<NetworkIndicator onlineDuration={0} />
```

### React to connectivity changes

```tsx
<NetworkIndicator
  onStatusChange={(online) => {
    analytics.track(online ? "connection_restored" : "connection_lost");
  }}
/>
```

### Restyle the default banner

```tsx
<NetworkIndicator
  className="my-banner"
  style={{ backgroundColor: "#111827", fontSize: 16 }}
/>
```

---

## Accessibility

- The banner is **non-interactive** (`pointer-events: none`) and never steals focus or clicks.
- The **offline** banner is a `role="alert"` live region (implicitly assertive) with `aria-atomic="true"` — losing connectivity is time-sensitive, and `alert` is the one live-region role screen readers reliably announce even when the element is inserted already populated.
- The **reconnected** confirmation is a `role="status"` live region (implicitly polite) — a confirmation can wait its turn. Note: some screen readers skip announcing a live region that enters the DOM pre-populated; the confirmation is a visual nicety, not critical information.

## SSR

No `window` or `navigator` access happens during render. On the server the component assumes `online: true` and renders nothing (or `render({ online: true, reconnected: false })`), so there is never a hydration mismatch.

---

## License

MIT © [usefy](https://github.com/mirunamu00/usefy)
