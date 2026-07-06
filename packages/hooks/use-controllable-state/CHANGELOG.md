# @usefy/use-controllable-state

## 0.21.0

### Minor Changes

- 547ac84: Fix `useControllableState` setter identity so it is genuinely stable in **controlled** mode. Previously the setter listed `controlledValue` in its `useCallback` deps, so it got a new identity on every render where the controlled prop changed — despite the docs promising a permanent identity — causing extra renders / effect re-runs for consumers that pass it to `React.memo` children or effect dependency arrays. The setter now reads the current mode and controlled value from refs (the Radix pattern), so its identity is constant for the component's lifetime in both modes while still resolving updater functions against the freshest prop. Also **removed the internal `isUpdater` and `useCallbackRef` helpers from the package's public entry point** — they were never documented and `useCallbackRef` duplicates `@usefy/use-event-callback`; they remain internal. Added controlled-mode setter-stability tests and a StrictMode test.

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

- 1bcb3ea: Add design-system primitive (Batch 3): `useControllableState` — a controlled/uncontrolled state primitive (Radix/Mantine pattern) that lets a component accept a parent-driven `value`/`onChange` or manage its own state from `defaultValue` with a single hook. `useState` ergonomics (value or updater), stable setter identity, and StrictMode-safe `onChange`. Ships with tests (100% coverage), a Storybook story, a README, and `@usefy/hooks` umbrella re-exports.
