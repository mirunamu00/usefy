---
"@usefy/use-reduced-motion": minor
"@usefy/hooks": minor
---

Add an `initializeWithValue` option to `useReducedMotion` (default `true`, matching `useMediaQuery`). Set it to `false` to render `defaultValue` on the first client render and defer the real `matchMedia` read to a post-commit effect, avoiding a React hydration mismatch when the server rendered `defaultValue` but the user prefers reduced motion. Also coerce the `MediaQueryList.matches` read to a strict boolean (`=== true`) so a malformed environment reporting `undefined` can never leak a non-boolean through the `boolean` return type.
