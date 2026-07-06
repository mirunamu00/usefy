---
"@usefy/hooks": minor
"@usefy/use-dark-mode": patch
---

Stop re-exporting the generic `isBrowser`, `readStoredMode`, and `writeStoredMode` helpers from the `@usefy/hooks` umbrella. These are `use-dark-mode` internals that leaked into the umbrella's public namespace — `isBrowser` in particular is a generic SSR guard that would collide with future packages (the umbrella already keeps `useIdle`'s `isBrowser` package-only for exactly this reason). The `useDarkMode` hook, its dark-mode-specific helpers (`prefersDark`, `resolveIsDark`, `applyTheme`), and its types are unchanged. Import the removed generic helpers directly from `@usefy/use-dark-mode` if you were relying on them. Also corrects the `use-dark-mode` README's test count and coverage figures to the real values (21 tests, 94.8%).
