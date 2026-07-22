# @usefy/use-preferred-color-scheme

## 1.0.0

### Major Changes

- 8924240: usefy 1.0.0 — first stable release.

  All `@usefy/*` packages graduate to a stable **1.0.0** together (they share a
  fixed-version group). No API changes are required by this bump — it marks the
  public API as stable and ready for production semver guarantees.

  Also adds a `homepage` field to every published package, pointing at its page on
  the docs site (https://usefy-web.vercel.app) so the npm listing links straight
  to live docs.

## 0.25.1

## 0.25.0

## 0.24.0

## 0.23.0

## 0.22.0

## 0.21.1

## 0.21.0

### Minor Changes

- 547ac84: Add an `initializeWithValue` option to `usePreferredColorScheme` (default `true`, matching `useMediaQuery`). Set it to `false` to render `defaultScheme` on the first client render and defer the real `matchMedia` read to a post-commit effect, avoiding a React hydration mismatch when the server rendered `defaultScheme` but the user's system preference differs.

## 0.20.0

## 0.19.0

## 0.18.0

## 0.17.0

## 0.16.0

## 0.15.0

## 0.14.0

## 0.13.0

## 0.12.2

## 0.12.1

### Patch Changes

- b850ad8: Standardize the per-package READMEs (consistent header, badges, a nav row, the "View Storybook Demo" link, and Overview/Features/Installation/Quick Start/API/Testing/License sections) so they render consistently on npm.

## 0.12.0

### Minor Changes

- af0c72e: Add responsive & theme hooks (Batch 2): `useMediaQuery`, `usePreferredColorScheme`, `useReducedMotion`, `useDarkMode`, and `useDocumentTitle`. Each ships with tests, a Storybook story, a README, and `@usefy/hooks` umbrella re-exports.
