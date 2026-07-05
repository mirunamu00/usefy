# @usefy/use-long-press

## 0.17.0

### Minor Changes

- ae97a69: feat(use-long-press): add useLongPress hook for press-and-hold gestures

  - `const bind = useLongPress(callback, options)` returns a stable `bind` object of DOM handler props (`onMouseDown`/`onMouseUp`/`onMouseLeave`/`onMouseMove`/`onTouchStart`/`onTouchEnd`/`onTouchMove`) — spread it onto any element to wire up the whole gesture.
  - Time threshold: the `callback` fires once when the press is held for at least `threshold` ms (default `400`).
  - Movement cancellation: dragging past `moveThreshold` px (default `10`) from the down point cancels the press (reason `"moved"`); pass `moveThreshold: false` to disable.
  - Works for both mouse and touch; the synthetic mouse events browsers emit after a touch are timestamp-guarded and ignored, so a touch long-press never double-fires.
  - Optional `onStart` / `onFinish` / `onCancel` (with a `{ reason }` of `"released"` | `"moved"`) and a `disabled` flag; all callbacks kept in latest-refs (`@usefy/use-latest`) so the handlers stay referentially stable without callers memoizing.
  - Timer cleared on release/cancel/unmount; SSR-safe (no `window`/`document` access) and StrictMode/concurrent-safe (callbacks dispatched from handlers, never inside a `setState` updater). Also exports the `UseLongPressOptions` / `UseLongPressHandlers` / `UseLongPressReturn` / `LongPressEvent` / `LongPressCallback` / `LongPressCancelReason` / `LongPressCancelMeta` types.

### Patch Changes

- @usefy/use-latest@0.17.0
