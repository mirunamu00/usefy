---
"@usefy/use-is-first-render": patch
"@usefy/use-update-effect": patch
"@usefy/use-dark-mode": patch
"@usefy/use-previous": patch
"@usefy/use-latest": patch
"@usefy/use-event-callback": patch
---

Fix two StrictMode correctness bugs and harden related hooks:

- **useIsFirstRender**: no longer returns `false` on the first render under React StrictMode. The flag now flips in an effect (after commit) instead of during render, so it is correct under StrictMode's double-invoked render and concurrent rendering.
- **useUpdateEffect**: no longer runs the effect on mount under React StrictMode. A mount-tracking ref is reset on unmount so a StrictMode dev remount (or any real remount) correctly skips its first run again.
- **useDarkMode**: when the `element`/`attribute`/`darkClass` options change, the previous DOM write is now reverted so no stale class/attribute is left behind; fixed the `element` option docs; documented the SSR/hydration caveat.
- **usePrevious / useLatest / useEventCallback**: documented render-phase / layout-effect caveats (concurrent rendering; do-not-call-during-render).
