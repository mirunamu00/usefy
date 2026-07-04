import type { Dispatch, SetStateAction } from "react";

/**
 * Options for the {@link useControllableState} hook.
 *
 * @typeParam T - The type of the state value.
 */
export interface UseControllableStateOptions<T> {
  /**
   * The controlled value. When this is **not** `undefined`, the hook is in
   * *controlled* mode: the returned value always mirrors this prop, and calling
   * the setter only notifies `onChange` (it does not update any internal state —
   * the parent owns the value).
   *
   * Pass `undefined` to run in *uncontrolled* mode, where the hook manages its
   * own state seeded from `defaultValue`.
   */
  value?: T;

  /**
   * The initial value used in *uncontrolled* mode (when `value` is `undefined`).
   * Ignored while controlled.
   *
   * @remarks Passed to `useState`, so a function value is treated as a lazy
   * initializer. Avoid a function `defaultValue` unless that is intended.
   */
  defaultValue?: T;

  /**
   * Called whenever the value changes — via the setter in uncontrolled mode, or
   * when the setter requests a *different* value in controlled mode. Receives
   * the next resolved value. Its identity may change between renders without
   * causing listeners to re-subscribe (the latest callback is always used).
   */
  onChange?: (value: T) => void;
}

/**
 * Return value of {@link useControllableState}: a `[value, setValue]` tuple with
 * the same ergonomics as `useState` — `setValue` accepts either the next value
 * or an updater function `(prev) => next`.
 *
 * @typeParam T - The type of the state value.
 */
export type UseControllableStateReturn<T> = readonly [
  T,
  Dispatch<SetStateAction<T>>,
];
