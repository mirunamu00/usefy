# @usefy/use-script

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
