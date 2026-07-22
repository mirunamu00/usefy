# @usefy/network-indicator

## 0.1.0

### Minor Changes

- c949924: Add `@usefy/network-indicator` — a drop-in online/offline status banner built on `@usefy/use-network-state`.

  - Renders **nothing while online**; shows a fixed, non-interactive **offline banner** when connectivity is lost; swaps to a brief **"Back online" confirmation** on reconnect that auto-dismisses after `onlineDuration` ms (default 3000, `0` disables it). Never flashes "Back online" on first mount.
  - Props: `position` (`"top" | "bottom"`), `offlineMessage` / `onlineMessage` (ReactNode), `onlineDuration`, a `render` escape hatch receiving `{ online, reconnected }`, `onStatusChange(online)`, and `className` / `style` passthrough over zero-config inline styling.
  - Accessibility: `role="status"` + `aria-atomic`; offline announces with `aria-live="assertive"` (time-sensitive), the reconnected confirmation with `aria-live="polite"`. `pointer-events: none` — the banner never intercepts the app underneath.
  - SSR-safe (no `window` access at render; servers render nothing) and StrictMode-safe (transition detection in a post-commit effect; dismiss timer via `@usefy/use-timeout` with unmount cleanup). React 18 and 19.
