# @usefy/use-measure

## 0.21.0

### Patch Changes

- @usefy/use-resize-observer@0.21.0

## 0.20.0

### Patch Changes

- @usefy/use-resize-observer@0.20.0

## 0.19.0

### Patch Changes

- @usefy/use-resize-observer@0.19.0

## 0.18.0

### Patch Changes

- @usefy/use-resize-observer@0.18.0

## 0.17.0

### Patch Changes

- @usefy/use-resize-observer@0.17.0

## 0.16.0

### Patch Changes

- @usefy/use-resize-observer@0.16.0

## 0.15.0

### Patch Changes

- @usefy/use-resize-observer@0.15.0

## 0.14.0

### Minor Changes

- ff59cfe: feat(use-measure): add useMeasure hook for reactive element bounds

  `const [ref, bounds] = useMeasure()` returns an element's live bounds — its size
  and viewport-relative position (`x, y, width, height, top, right, bottom, left`)
  — and keeps them in sync via ResizeObserver. It is the ergonomic "just give me
  the bounds" convenience layer over `@usefy/use-resize-observer`, reusing that
  hook internally rather than re-implementing observer wiring. SSR-safe,
  StrictMode-safe, with a stable callback ref and equality-guarded updates.

### Patch Changes

- @usefy/use-resize-observer@0.14.0
