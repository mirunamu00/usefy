---
"@usefy/use-previous": patch
"@usefy/hooks": patch
---

Clarify that `usePrevious` returns the previous **distinct** value — the value from the last render in which it actually changed — not simply "the value one render ago". The behavior is unchanged (it always tracked distinct values); the JSDoc summary, README, and umbrella descriptions now lead with the distinct-value semantic instead of burying it, so consumers aren't surprised when an unchanged re-render leaves the returned "previous" un-advanced. Added a test pinning the `1 → 1 → 2` distinct-tracking contract.
