import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLatest } from "@usefy/use-latest";
import type {
  LongPressCallback,
  LongPressCancelReason,
  LongPressEvent,
  UseLongPressOptions,
  UseLongPressReturn,
} from "./types";
import {
  DEFAULT_MOVE_THRESHOLD,
  DEFAULT_THRESHOLD,
  TOUCH_MOUSE_GUARD_MS,
  getDistance,
  getPositionFromEvent,
  now,
} from "./utils";

/**
 * Recognise a **long-press** ("press and hold") gesture on any element, for both
 * mouse and touch, and get back a `bind` object of DOM handler props to spread
 * onto the target.
 *
 * The `callback` fires exactly once, when the pointer has been held down on the
 * element for at least `threshold` milliseconds without being released or moved
 * too far. Releasing early, or dragging farther than `moveThreshold` pixels from
 * the down point before the threshold elapses, cancels the gesture.
 *
 * ### Usage
 * ```tsx
 * const bind = useLongPress(() => console.log("held!"));
 * return <button {...bind}>Press and hold</button>;
 * ```
 *
 * ### Behaviour & guarantees
 * - **Mouse + touch** — the same gesture works with either input. Browsers emit
 *   synthetic `mouse*` events after a touch sequence; those are detected by
 *   timestamp ({@link TOUCH_MOUSE_GUARD_MS}) and ignored, so a single touch
 *   long-press never double-fires through the mouse handlers.
 * - **Movement cancellation** — the down position is captured from the down
 *   event and compared on every move; drifting past `moveThreshold` cancels with
 *   reason `"moved"`. Pass `moveThreshold: false` to disable this.
 * - **Lifecycle callbacks** — optional `onStart` (press began), `onFinish` (a
 *   completed long press was then released) and `onCancel` (ended early, with a
 *   `{ reason }`). All are kept in latest-refs, so passing new inline functions
 *   every render never destabilises the returned handlers or re-runs effects.
 * - **Stable handlers** — every handler is `useCallback`-wrapped and the `bind`
 *   object is `useMemo`-ised, so its identity never changes; spreading it does
 *   not churn the element's listeners.
 * - **Cleanup** — the pending threshold timer is always cleared on release,
 *   cancel, and unmount, so nothing fires after the element is gone.
 * - **SSR-safe** — the hook only returns handlers and touches no
 *   `window`/`document` at module or render time.
 * - **StrictMode / concurrent-safe** — user callbacks are dispatched from the
 *   event handlers (never from inside a `setState` updater), and there is no
 *   render-time side effect to double-run.
 *
 * ### `preventDefault` caveat
 * React attaches `onTouchStart`/`onTouchMove` as **passive** listeners, so you
 * cannot call `event.preventDefault()` from these handlers to stop scrolling or
 * the long-press context menu — the browser ignores it (and may warn). Prevent
 * those natively with CSS on the target instead: `touch-action: none` (stop
 * scroll/pan) and `user-select: none` / `-webkit-touch-callout: none` (stop text
 * selection and the iOS callout). This hook deliberately does not call
 * `preventDefault`.
 *
 * @typeParam T - The element type you spread the `bind` object onto.
 * @param callback - Fires once when the press reaches `threshold`. Receives the
 *   originating pointer-down event.
 * @param options - {@link UseLongPressOptions}.
 * @returns A stable `bind` object of DOM handler props — see {@link
 *   UseLongPressReturn}.
 *
 * @example
 * ```tsx
 * // Basic press-and-hold.
 * function DeleteButton() {
 *   const bind = useLongPress(() => deleteItem(), { threshold: 600 });
 *   return <button {...bind}>Hold to delete</button>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Full lifecycle with movement cancellation disabled.
 * const bind = useLongPress(
 *   (event) => console.log("long press", event.type),
 *   {
 *     threshold: 500,
 *     moveThreshold: 20,
 *     onStart: () => setState("pressing"),
 *     onFinish: () => setState("done"),
 *     onCancel: (_event, { reason }) => setState(`cancelled: ${reason}`),
 *   }
 * );
 * ```
 */
export function useLongPress<T extends Element = Element>(
  callback: LongPressCallback<T>,
  options: UseLongPressOptions<T> = {}
): UseLongPressReturn<T> {
  const {
    threshold = DEFAULT_THRESHOLD,
    moveThreshold = DEFAULT_MOVE_THRESHOLD,
    disabled = false,
    onStart,
    onFinish,
    onCancel,
  } = options;

  // Latest-refs: read fresh values inside the stable handlers without
  // re-creating them (and without callers needing to memoize).
  const callbackRef = useLatest(callback);
  const thresholdRef = useLatest(threshold);
  const moveThresholdRef = useLatest(moveThreshold);
  const disabledRef = useLatest(disabled);
  const onStartRef = useLatest(onStart);
  const onFinishRef = useLatest(onFinish);
  const onCancelRef = useLatest(onCancel);

  // Mutable per-gesture state (no re-renders).
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const pressingRef = useRef(false); // a press is currently in progress
  const triggeredRef = useRef(false); // the threshold fired for this press
  const lastTouchRef = useRef(0); // timestamp of the most recent touch event

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(
    (event: LongPressEvent<T>) => {
      // Disabled, or a press is already tracking (ignore duplicate downs).
      if (disabledRef.current || pressingRef.current) return;

      pressingRef.current = true;
      triggeredRef.current = false;
      startPosRef.current = getPositionFromEvent(event);
      onStartRef.current?.(event);

      clearTimer();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        triggeredRef.current = true;
        callbackRef.current(event);
      }, thresholdRef.current);
    },
    [clearTimer, callbackRef, disabledRef, onStartRef, thresholdRef]
  );

  const end = useCallback(
    (event: LongPressEvent<T>, reason: LongPressCancelReason) => {
      if (!pressingRef.current) return;

      const wasTriggered = triggeredRef.current;
      pressingRef.current = false;
      triggeredRef.current = false;
      startPosRef.current = null;
      clearTimer();

      if (wasTriggered) {
        // A completed long press that is now being released/ended.
        onFinishRef.current?.(event);
      } else {
        // Ended before the threshold — a cancellation.
        onCancelRef.current?.(event, { reason });
      }
    },
    [clearTimer, onFinishRef, onCancelRef]
  );

  const move = useCallback(
    (event: LongPressEvent<T>) => {
      // Only relevant while pressing and before the threshold has fired.
      if (!pressingRef.current || triggeredRef.current) return;

      const limit = moveThresholdRef.current;
      if (limit === false) return; // movement cancellation disabled

      const startPos = startPosRef.current;
      const pos = getPositionFromEvent(event);
      if (!startPos || !pos) return;

      if (getDistance(startPos, pos) > limit) {
        end(event, "moved");
      }
    },
    [end, moveThresholdRef]
  );

  // Ignore browser-synthesised mouse events that follow a touch sequence.
  const isSyntheticMouse = useCallback(
    () => now() - lastTouchRef.current < TOUCH_MOUSE_GUARD_MS,
    []
  );

  const onMouseDown = useCallback(
    (event: LongPressEvent<T>) => {
      if (isSyntheticMouse()) return;
      start(event);
    },
    [start, isSyntheticMouse]
  );

  const onMouseMove = useCallback(
    (event: LongPressEvent<T>) => {
      move(event);
    },
    [move]
  );

  const onMouseUp = useCallback(
    (event: LongPressEvent<T>) => {
      end(event, "released");
    },
    [end]
  );

  const onMouseLeave = useCallback(
    (event: LongPressEvent<T>) => {
      end(event, "released");
    },
    [end]
  );

  const onTouchStart = useCallback(
    (event: LongPressEvent<T>) => {
      lastTouchRef.current = now();
      start(event);
    },
    [start]
  );

  const onTouchMove = useCallback(
    (event: LongPressEvent<T>) => {
      lastTouchRef.current = now();
      move(event);
    },
    [move]
  );

  const onTouchEnd = useCallback(
    (event: LongPressEvent<T>) => {
      lastTouchRef.current = now();
      end(event, "released");
    },
    [end]
  );

  // Clear any pending timer on unmount (covers StrictMode's double mount too).
  useEffect(() => clearTimer, [clearTimer]);

  return useMemo<UseLongPressReturn<T>>(
    () => ({
      onMouseDown,
      onMouseUp,
      onMouseLeave,
      onMouseMove,
      onTouchStart,
      onTouchEnd,
      onTouchMove,
    }),
    [
      onMouseDown,
      onMouseUp,
      onMouseLeave,
      onMouseMove,
      onTouchStart,
      onTouchEnd,
      onTouchMove,
    ]
  ) as UseLongPressReturn<T>;
}
