---
"@usefy/use-scroll-position": minor
"@usefy/hooks": minor
---

feat(use-scroll-position): add useScrollPosition hook for tracking the throttled scroll offset of the window or an element

- `const { x, y } = useScrollPosition({ element?, throttleMs? })`
- Tracks the window/document scroll by default, or a given `HTMLElement` / `RefObject<HTMLElement>`
- Leading + trailing throttle (default 100ms; `0` disables) so the settled resting position is never dropped
- Synchronous initial read on mount via `useIsomorphicLayoutEffect`, `{ passive: true }` listener, SSR-safe (`{ x: 0, y: 0 }`) and StrictMode-safe with listener/timer cleanup on unmount and target change
- Re-exported from `@usefy/hooks` (hook, `ZERO_SCROLL_POSITION`, and the `ScrollPosition`, `ScrollPositionTarget`, `UseScrollPositionOptions`, `UseScrollPositionReturn` types)
