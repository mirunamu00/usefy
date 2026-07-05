# @usefy/use-hotkeys

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
