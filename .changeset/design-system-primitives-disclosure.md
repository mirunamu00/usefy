---
"@usefy/use-disclosure": minor
"@usefy/hooks": minor
---

Add design-system primitive (Batch 3): `useDisclosure` — open/close/toggle state for modals, drawers, popovers, and accordions. Returns a `[opened, { open, close, toggle }]` tuple (Mantine shape) with stable handler identities and optional `onOpen`/`onClose` callbacks that fire only on a real transition. `open()` while open (and `close()` while closed) is a no-op, and callbacks are StrictMode-safe (never dispatched from inside a setState updater). Includes tests (100% coverage), a Storybook story, a README, and `@usefy/hooks` umbrella re-exports.
