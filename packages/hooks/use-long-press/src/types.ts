import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from "react";

/**
 * The synthetic event that triggers a long-press interaction. Because the hook
 * returns DOM handler props that you spread onto a JSX element, the events are
 * React's synthetic {@link ReactMouseEvent} (for `onMouseDown`/`onMouseUp`/…) and
 * {@link ReactTouchEvent} (for `onTouchStart`/`onTouchEnd`/…).
 *
 * @typeParam T - The element type the `bind` object is spread onto.
 */
export type LongPressEvent<T extends Element = Element> =
  | ReactMouseEvent<T>
  | ReactTouchEvent<T>;

/**
 * The main long-press callback. Fires once, when the press has been held for at
 * least `threshold` milliseconds without being cancelled by release or movement.
 *
 * It receives the **originating pointer-down event** — the `mousedown` or
 * `touchstart` that started the gesture — not a synthetic event created when the
 * timer elapses.
 *
 * @typeParam T - The element type the `bind` object is spread onto.
 */
export type LongPressCallback<T extends Element = Element> = (
  event: LongPressEvent<T>
) => void;

/**
 * Why a long press ended before it completed, passed to {@link
 * UseLongPressOptions.onCancel}.
 *
 * - `"released"` — the pointer was lifted (or left the element) before the
 *   threshold elapsed.
 * - `"moved"` — the pointer moved farther than `moveThreshold` pixels from where
 *   it went down before the threshold elapsed.
 */
export type LongPressCancelReason = "released" | "moved";

/**
 * The metadata object passed as the second argument to {@link
 * UseLongPressOptions.onCancel}.
 */
export interface LongPressCancelMeta {
  /** The reason the press was cancelled — see {@link LongPressCancelReason}. */
  reason: LongPressCancelReason;
}

/**
 * Configuration for {@link useLongPress}.
 *
 * Every callback is stored in a latest-ref internally, so you can pass fresh
 * inline functions on every render without breaking the referential stability of
 * the returned `bind` handlers.
 *
 * @typeParam T - The element type the `bind` object is spread onto.
 */
export interface UseLongPressOptions<T extends Element = Element> {
  /**
   * How long, in milliseconds, the press must be held before the long-press
   * `callback` fires.
   *
   * @defaultValue `400`
   */
  threshold?: number;

  /**
   * How far, in pixels, the pointer may drift from its initial down position
   * before the long press is cancelled (with reason `"moved"`). The distance is
   * the straight-line (Euclidean) distance from the down point.
   *
   * Pass `false` to disable movement cancellation entirely — the press then
   * completes purely on the timer regardless of how far the pointer moves.
   *
   * @defaultValue `10`
   */
  moveThreshold?: number | false;

  /**
   * When `true`, the returned handlers become no-ops: pressing the element never
   * starts a long press and no callbacks fire. Read at press-start, so a press
   * already in progress is unaffected.
   *
   * @defaultValue `false`
   */
  disabled?: boolean;

  /**
   * Called synchronously when a valid press begins (pointer down while enabled),
   * before the threshold timer starts. Receives the originating pointer-down
   * event.
   */
  onStart?: (event: LongPressEvent<T>) => void;

  /**
   * Called when a completed long press ends — i.e. the `callback` already fired
   * (threshold reached) and the pointer is then released. Receives the release
   * event. Not called if the press was cancelled before the threshold.
   */
  onFinish?: (event: LongPressEvent<T>) => void;

  /**
   * Called when a press ends **before** it completed — either the pointer was
   * released too early (`reason: "released"`) or it moved beyond `moveThreshold`
   * (`reason: "moved"`). Receives the triggering event and a {@link
   * LongPressCancelMeta}.
   */
  onCancel?: (event: LongPressEvent<T>, meta: LongPressCancelMeta) => void;
}

/**
 * The `bind` object returned by {@link useLongPress} — a set of DOM event
 * handler props to spread onto the target element: `<button {...bind}>`.
 *
 * All handlers are referentially stable across renders (memoized), so spreading
 * `bind` does not churn the element's listeners.
 *
 * @typeParam T - The element type the object is spread onto.
 */
export interface UseLongPressHandlers<T extends Element = Element> {
  onMouseDown: (event: ReactMouseEvent<T>) => void;
  onMouseUp: (event: ReactMouseEvent<T>) => void;
  onMouseLeave: (event: ReactMouseEvent<T>) => void;
  onMouseMove: (event: ReactMouseEvent<T>) => void;
  onTouchStart: (event: ReactTouchEvent<T>) => void;
  onTouchEnd: (event: ReactTouchEvent<T>) => void;
  onTouchMove: (event: ReactTouchEvent<T>) => void;
}

/**
 * The return type of {@link useLongPress}: the {@link UseLongPressHandlers}
 * `bind` object.
 *
 * @typeParam T - The element type the object is spread onto.
 */
export type UseLongPressReturn<T extends Element = Element> =
  UseLongPressHandlers<T>;
