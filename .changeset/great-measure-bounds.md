---
"@usefy/use-measure": minor
"@usefy/hooks": minor
---

feat(use-measure): add useMeasure hook for reactive element bounds

`const [ref, bounds] = useMeasure()` returns an element's live bounds — its size
and viewport-relative position (`x, y, width, height, top, right, bottom, left`)
— and keeps them in sync via ResizeObserver. It is the ergonomic "just give me
the bounds" convenience layer over `@usefy/use-resize-observer`, reusing that
hook internally rather than re-implementing observer wiring. SSR-safe,
StrictMode-safe, with a stable callback ref and equality-guarded updates.
