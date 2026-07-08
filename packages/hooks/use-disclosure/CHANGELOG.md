# @usefy/use-disclosure

## 0.23.0

## 0.22.0

## 0.21.1

## 0.21.0

### Patch Changes

- ba7c5da: Fix incorrect npm package-provenance metadata. The `repository.directory` field pointed at non-existent paths for these packages (e.g. `packages/use-toggle` instead of `packages/hooks/use-toggle`, and the `@usefy/hooks` umbrella pointed at `packages/usefy`), which broke the "source" link on each npm package page. Each now points at its real location in the monorepo. Additionally, `@usefy/memory-monitor` had its `repository.url`, `bugs.url`, and `homepage` pointing at a non-existent `usefy/usefy` GitHub org and a wrong `packages/components/...` path — these are corrected to `mirunamu00/usefy` and `packages/kits/memory-monitor`. Metadata-only; no code or runtime change.

## 0.20.0

## 0.19.0

## 0.18.0

## 0.17.0

## 0.16.0

## 0.15.0

## 0.14.0

## 0.13.0

### Minor Changes

- 1bcb3ea: Add design-system primitive (Batch 3): `useDisclosure` — open/close/toggle state for modals, drawers, popovers, and accordions. Returns a `[opened, { open, close, toggle }]` tuple (Mantine shape) with stable handler identities and optional `onOpen`/`onClose` callbacks that fire only on a real transition. `open()` while open (and `close()` while closed) is a no-op, and callbacks are StrictMode-safe (never dispatched from inside a setState updater). Includes tests (100% coverage), a Storybook story, a README, and `@usefy/hooks` umbrella re-exports.
