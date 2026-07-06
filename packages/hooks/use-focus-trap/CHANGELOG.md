# @usefy/use-focus-trap

## 0.20.0

### Patch Changes

- @usefy/use-isomorphic-layout-effect@0.20.0
- @usefy/use-latest@0.20.0

## 0.19.0

### Patch Changes

- @usefy/use-isomorphic-layout-effect@0.19.0
- @usefy/use-latest@0.19.0

## 0.18.0

### Patch Changes

- @usefy/use-isomorphic-layout-effect@0.18.0
- @usefy/use-latest@0.18.0

## 0.17.0

### Minor Changes

- ae97a69: feat(use-focus-trap): add useFocusTrap hook for trapping keyboard focus in modals/dialogs

  - `const ref = useFocusTrap(active, options)` returns a stable callback ref; attach it to the container whose focus should be trapped while `active`.
  - Tab / Shift+Tab wrap-around cycling through the container's focusable descendants, recomputed live on every keypress (never cached). Robust focusable selector excludes `disabled` (including controls inside a `<fieldset disabled>`), `hidden`, `inert`, `tabindex="-1"`, and invisible elements; zero-focusable containers pin focus and block Tab from escaping.
  - Nested/simultaneous traps are handled via a topmost-wins activation stack: when a dialog opens over another dialog, only the most-recently activated trap reacts to Tab and Escape (Escape fires once, the Tab handlers never race), and the trap beneath becomes live again when the top one deactivates.
  - Configurable `initialFocus` (element / ref / getter / `false`; defaults to the first focusable element or the container) and `returnFocus` (restore to the trigger by default, override to any target, or disable). `onEscape` is surfaced so the caller owns open/close state — the hook never manages it.
  - Does one thing (focus only, no scroll lock, renders nothing). Built on `@usefy/use-isomorphic-layout-effect` + `@usefy/use-latest`; SSR-safe and StrictMode-safe with full listener cleanup and correct focus restore across double mounts. Also exports the reusable `getFocusableElements` helper and the `UseFocusTrapOptions` / `UseFocusTrapRef` / `FocusTarget` types.

### Patch Changes

- @usefy/use-isomorphic-layout-effect@0.17.0
- @usefy/use-latest@0.17.0
