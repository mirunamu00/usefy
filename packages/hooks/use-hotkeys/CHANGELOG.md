# @usefy/use-hotkeys

## 1.1.0

### Patch Changes

- @usefy/use-event-listener@1.1.0
- @usefy/use-latest@1.1.0

## 1.0.0

### Major Changes

- 8924240: usefy 1.0.0 — first stable release.

  All `@usefy/*` packages graduate to a stable **1.0.0** together (they share a
  fixed-version group). No API changes are required by this bump — it marks the
  public API as stable and ready for production semver guarantees.

  Also adds a `homepage` field to every published package, pointing at its page on
  the docs site (https://usefy-web.vercel.app) so the npm listing links straight
  to live docs.

### Patch Changes

- Updated dependencies [8924240]
  - @usefy/use-event-listener@1.0.0
  - @usefy/use-latest@1.0.0

## 0.25.1

### Patch Changes

- @usefy/use-event-listener@0.25.1
- @usefy/use-latest@0.25.1

## 0.25.0

### Patch Changes

- @usefy/use-event-listener@0.25.0
- @usefy/use-latest@0.25.0

## 0.24.0

### Patch Changes

- @usefy/use-event-listener@0.24.0
- @usefy/use-latest@0.24.0

## 0.23.0

### Patch Changes

- @usefy/use-event-listener@0.23.0
- @usefy/use-latest@0.23.0

## 0.22.0

### Patch Changes

- @usefy/use-event-listener@0.22.0
- @usefy/use-latest@0.22.0

## 0.21.1

### Patch Changes

- @usefy/use-event-listener@0.21.1
- @usefy/use-latest@0.21.1

## 0.21.0

### Patch Changes

- Updated dependencies [ba7c5da]
  - @usefy/use-event-listener@0.21.0
  - @usefy/use-latest@0.21.0

## 0.20.0

### Patch Changes

- @usefy/use-event-listener@0.20.0
- @usefy/use-latest@0.20.0

## 0.19.0

### Patch Changes

- @usefy/use-event-listener@0.19.0
- @usefy/use-latest@0.19.0

## 0.18.0

### Patch Changes

- @usefy/use-event-listener@0.18.0
- @usefy/use-latest@0.18.0

## 0.17.0

### Minor Changes

- ae97a69: feat(use-hotkeys): add useHotkeys hook for high-level keyboard shortcuts

  - Register a hotkey string or an array of them against a single handler: `useHotkeys("mod+k", handler, { enabled })`, `useHotkeys(["mod+s", "ctrl+p"], handler)`.
  - Combos (`"ctrl+shift+p"`, `"shift+?"`, `"Escape"`), space-separated sequences (`"g i"`, `"g g"`) with a configurable `sequenceTimeoutMs`, and a cross-platform `mod` alias (Cmd on macOS, Ctrl elsewhere; overridable via `mac`).
  - Exact modifier matching, an input-field guard (`enableOnFormTags`), scoping to `document`/`window`/element/ref, `eventType`, and `preventDefault`.
  - Built on `@usefy/use-event-listener` + `@usefy/use-latest`; SSR-safe and StrictMode-safe with full listener/timer cleanup. Also exports `parseHotkey`, `isMacPlatform`, `isHotkeysSupported`.

### Patch Changes

- @usefy/use-event-listener@0.17.0
- @usefy/use-latest@0.17.0
