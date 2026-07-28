# @usefy/use-script

## 1.1.0

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

## 0.20.0

### Minor Changes

- 65b754f: feat(use-script): add useScript hook for loading external scripts with status, dedup, and cleanup

  `const status = useScript(src, options?)` returns a bare `idle | loading | ready | error` status. A module-level registry keyed by `src` deduplicates the `<script>` tag so multiple components sharing a source load it once and re-render together; pass `null`/`undefined` or `shouldPreventLoad` to stay idle, `attributes` to configure the created tag, and `removeOnUnmount` for ref-counted DOM cleanup. Adopts pre-existing tags, exposes `getScriptStatus(src)`, and is SSR-safe + StrictMode-safe via `useSyncExternalStore`.
