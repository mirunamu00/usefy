# @usefy/use-key-press

## 0.3.1

### Patch Changes

- 565a971: docs(use-key-press): add package README and update hooks documentation

  - Add the `@usefy/use-key-press` README with installation, full API reference (target forms, modifier/key aliases, all options), usage examples, behavior notes, and coverage links.
  - Update the `@usefy/hooks` README: add `useKeyPress` to the hooks table with a coverage badge, include it in the Quick Start imports, and add a Keyboard section to the feature list.

## 0.3.0

### Minor Changes

- d0e98cd: feat(use-key-press): add useKeyPress hook for keyboard detection

  Introduces `@usefy/use-key-press`, a hook for detecting key presses, shortcuts, and combinations:

  - Single keys (`"Escape"`), combinations (`"ctrl+s"`, `"mod+shift+k"`), and alternative bindings via arrays (`["ctrl+s", "meta+s"]`, matched as OR)
  - Cross-platform `"mod"` alias (Ctrl on Windows/Linux, Cmd on macOS) and friendly aliases (`esc`, `space`, arrows, etc.)
  - Predicate targets for full control, plus match-by logical key (`event.key`) or physical key (`event.code`)
  - `onPress`/`onRelease` callbacks with the raw event, `preventDefault`/`stopPropagation`, exact/loose modifier matching
  - Robustness: ignores auto-repeat and typing inside editable elements (opt-in), resets on window blur, SSR-safe with automatic cleanup

  Also re-exported from the `@usefy/hooks` umbrella package.
