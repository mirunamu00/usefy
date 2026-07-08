# @usefy/use-dark-mode

## 0.24.0

## 0.23.0

## 0.22.0

## 0.21.1

## 0.21.0

### Patch Changes

- 547ac84: Stop re-exporting the generic `isBrowser`, `readStoredMode`, and `writeStoredMode` helpers from the `@usefy/hooks` umbrella. These are `use-dark-mode` internals that leaked into the umbrella's public namespace — `isBrowser` in particular is a generic SSR guard that would collide with future packages (the umbrella already keeps `useIdle`'s `isBrowser` package-only for exactly this reason). The `useDarkMode` hook, its dark-mode-specific helpers (`prefersDark`, `resolveIsDark`, `applyTheme`), and its types are unchanged. Import the removed generic helpers directly from `@usefy/use-dark-mode` if you were relying on them. Also corrects the `use-dark-mode` README's test count and coverage figures to the real values (21 tests, 94.8%).

## 0.20.0

## 0.19.0

## 0.18.0

## 0.17.0

## 0.16.0

## 0.15.0

## 0.14.0

## 0.13.0

## 0.12.2

### Patch Changes

- a188dd9: Fix two StrictMode correctness bugs and harden related hooks:

  - **useIsFirstRender**: no longer returns `false` on the first render under React StrictMode. The flag now flips in an effect (after commit) instead of during render, so it is correct under StrictMode's double-invoked render and concurrent rendering.
  - **useUpdateEffect**: no longer runs the effect on mount under React StrictMode. A mount-tracking ref is reset on unmount so a StrictMode dev remount (or any real remount) correctly skips its first run again.
  - **useDarkMode**: when the `element`/`attribute`/`darkClass` options change, the previous DOM write is now reverted so no stale class/attribute is left behind; fixed the `element` option docs; documented the SSR/hydration caveat.
  - **usePrevious / useLatest / useEventCallback**: documented render-phase / layout-effect caveats (concurrent rendering; do-not-call-during-render).

## 0.12.1

### Patch Changes

- b850ad8: Standardize the per-package READMEs (consistent header, badges, a nav row, the "View Storybook Demo" link, and Overview/Features/Installation/Quick Start/API/Testing/License sections) so they render consistently on npm.

## 0.12.0

### Minor Changes

- af0c72e: Add responsive & theme hooks (Batch 2): `useMediaQuery`, `usePreferredColorScheme`, `useReducedMotion`, `useDarkMode`, and `useDocumentTitle`. Each ships with tests, a Storybook story, a README, and `@usefy/hooks` umbrella re-exports.
