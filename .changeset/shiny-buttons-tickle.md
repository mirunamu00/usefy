---
"@usefy/confetti": minor
---

New standalone package: canvas confetti & celebration engine for React.

- **Three consumption layers, one `FireOptions`**: `fireConfetti()` one-liner on an auto-managed viewport canvas (SSR no-op, idle auto-teardown) → `<Confetti />` overlay/inline component (imperative `controllerRef`, `onComplete`, `fireOnMount`) + `useConfetti()` hook (edge-only `isActive` re-renders) → framework-free `createConfettiEngine` via `@usefy/confetti/headless` (zero dependencies).
- **Hand-written particle physics**: gravity, drag, drift, 3D tumble, wobble, lifetime fade — exact time-based integration (identical motion at any frame rate, no catch-up after background tabs), object pooling with zero steady-state allocations, and a single rAF loop that provably stops when idle.
- **Shapes**: square/circle/strip/star built-ins plus `textShape` (emoji sprites), `imageShape` (async-decoded image sprites), and `pathShape` (palette-colored `Path2D`).
- **Presets**: `celebration`, `fireworks`, `sideCannons`, `pride`, `stars`, and continuous `snow`/`rain` — deep-frozen tree-shakeable data executed by a cancelable `runPreset` runner on any layer.
- **Respectful by default**: `prefers-reduced-motion` no-ops, page-visibility pausing, `aria-hidden` + `pointer-events: none` overlay that never blocks the UI. React 18 + 19, StrictMode-safe.
