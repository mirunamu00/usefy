# NetworkIndicator Component Specification

## Overview

**Package Name:** `@usefy/network-indicator`
**Version:** `0.1.0`
**Status:** Implemented
**Created:** 2026-07-22
**Author:** usefy team

---

## 1. Purpose

`<NetworkIndicator />` is a drop-in online/offline status banner. Mount it once
at the app root and it:

1. Renders **nothing while online** (steady state).
2. Shows a fixed **offline banner** the moment connectivity is lost.
3. Swaps to a brief **"Back online" confirmation** when connectivity returns,
   which auto-dismisses after `onlineDuration` ms (default `3000`), then renders
   nothing again.
4. Never flashes "Back online" on first mount — the reconnected state only ever
   follows an *observed* offline → online transition.

If the page mounts while already offline, the offline banner shows immediately
(that is not a "flash": it reflects the real current state).

## 2. Composition (house hooks — no reinvented listeners)

| Concern | Hook |
| ------- | ---- |
| Online/offline connectivity (SSR-safe, tear-free) | `@usefy/use-network-state` |
| Auto-dismiss timer (cleanup on unmount, `null` disables) | `@usefy/use-timeout` |
| Stable `onStatusChange` identity (fired post-commit) | `@usefy/use-event-callback` |

The component itself owns only the tiny "reconnected flash" state machine.

## 3. API

### 3.1 Props (`NetworkIndicatorProps`)

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `position` | `"top" \| "bottom"` | `"top"` | Which screen edge the fixed banner is pinned to. |
| `offlineMessage` | `ReactNode` | `"You're offline. Some features may not work."` | Content of the offline banner. |
| `onlineMessage` | `ReactNode` | `"Back online"` | Content of the reconnected confirmation. |
| `onlineDuration` | `number` | `3000` | How long (ms) the reconnected confirmation stays visible. `0` or a negative value disables the confirmation entirely (reconnect goes straight back to rendering nothing). |
| `render` | `(state: NetworkIndicatorState) => ReactNode` | — | Escape hatch: fully own the UI. When provided, the default banner is never rendered and `render` is called on **every** render (including steady-state online) with `{ online, reconnected }`; return `null` to render nothing. The offline/reconnected state machine (including `onlineDuration`) still runs. |
| `onStatusChange` | `(online: boolean) => void` | — | Called after each online/offline **transition** (never on mount), from a post-commit effect — safe under StrictMode/concurrent rendering. |
| `className` | `string` | — | Class applied to the default banner element. |
| `style` | `CSSProperties` | — | Merged **over** the default inline styles (user styles win). |

### 3.2 Exports

- `NetworkIndicator` — the component.
- `NetworkIndicatorProps`, `NetworkIndicatorState`, `NetworkIndicatorPosition` — types.
- `DEFAULT_OFFLINE_MESSAGE`, `DEFAULT_ONLINE_MESSAGE`, `DEFAULT_ONLINE_DURATION` — defaults, for reuse in custom `render` UIs.

### 3.3 `NetworkIndicatorState`

```ts
interface NetworkIndicatorState {
  online: boolean;      // current connectivity (navigator.onLine)
  reconnected: boolean; // true during the "back online" confirmation window
}
```

## 4. State machine

```
            offline event                online event
  ONLINE ─────────────────▶ OFFLINE ─────────────────▶ RECONNECTED
    ▲                          ▲                            │
    │   onlineDuration elapsed │  offline event             │
    └──────────────────────────┼────────────────────────────┘
                               └── (offline during the flash returns to OFFLINE)
```

- Initial state is derived from the current connectivity (`ONLINE` or `OFFLINE`),
  never `RECONNECTED`.
- `onlineDuration <= 0` removes the `RECONNECTED` state: offline → online goes
  straight to `ONLINE`. If `onlineDuration` is changed to `<= 0` *while* the
  confirmation is visible, it dismisses immediately.
- The dismiss timer is cancelled on unmount and whenever the state leaves
  `RECONNECTED` (handled by `useTimeout`).

## 5. Default presentation

A fixed, full-width, non-interactive strip (`pointer-events: none`) pinned to
`position`, `z-index: 9999`, centered 14px system-font text on a colored
background: red (`#b91c1c`) while offline, green (`#15803d`) while reconnected.
All inline styles — no CSS import, zero-config. `style`/`className` customize it;
`render` replaces it entirely.

`data-status="offline" | "reconnected"` and `data-position` attributes are set on
the banner for styling/testing hooks.

## 6. Accessibility

- The banner has `aria-atomic="true"` and is non-interactive.
- **Offline uses `role="alert"`** (implicitly assertive) — losing connectivity
  is time-sensitive, and `alert` is the one live-region role screen readers
  reliably announce even when the element is inserted already populated.
  **Reconnected uses `role="status"`** (implicitly polite) — a confirmation
  can wait; some screen readers may skip a pre-populated inserted live region,
  which is acceptable for a nicety.
- Changing `onlineDuration` while the confirmation is visible restarts the
  dismiss timer from zero with the new duration (elapsed time is discarded).

## 7. SSR & StrictMode

- No `window`/`navigator` access during render. On the server
  `useNetworkState` reports `online: true`, so SSR/hydration renders nothing
  (or `render({ online: true, reconnected: false })`).
- The transition detector is a post-commit effect keyed on a ref of the previous
  online value; StrictMode's double effect invocation cannot fire callbacks or
  the reconnected flash on mount.
- `onStatusChange` is never called from a `setState` updater.
- Supports React 18 and 19 (`peerDependencies: ^18 || ^19`).
