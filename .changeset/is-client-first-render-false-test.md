---
"@usefy/use-is-client": patch
---

Add a test pinning the hook's core contract — that it returns `false` on the very first render (matching the server output to avoid a hydration mismatch) before flipping to `true` after mount. The prior suite only asserted the settled `true` value, so a regression to `useState(true)` — the exact hydration bug this hook exists to prevent — would have passed. Test-only; no runtime change.
