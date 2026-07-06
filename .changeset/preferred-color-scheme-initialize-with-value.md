---
"@usefy/use-preferred-color-scheme": minor
"@usefy/hooks": minor
---

Add an `initializeWithValue` option to `usePreferredColorScheme` (default `true`, matching `useMediaQuery`). Set it to `false` to render `defaultScheme` on the first client render and defer the real `matchMedia` read to a post-commit effect, avoiding a React hydration mismatch when the server rendered `defaultScheme` but the user's system preference differs.
