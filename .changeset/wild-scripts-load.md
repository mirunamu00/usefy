---
"@usefy/use-script": minor
"@usefy/hooks": minor
---

feat(use-script): add useScript hook for loading external scripts with status, dedup, and cleanup

`const status = useScript(src, options?)` returns a bare `idle | loading | ready | error` status. A module-level registry keyed by `src` deduplicates the `<script>` tag so multiple components sharing a source load it once and re-render together; pass `null`/`undefined` or `shouldPreventLoad` to stay idle, `attributes` to configure the created tag, and `removeOnUnmount` for ref-counted DOM cleanup. Adopts pre-existing tags, exposes `getScriptStatus(src)`, and is SSR-safe + StrictMode-safe via `useSyncExternalStore`.
