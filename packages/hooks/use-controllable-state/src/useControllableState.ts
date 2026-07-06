import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type {
  UseControllableStateOptions,
  UseControllableStateReturn,
} from "./types";
import { isUpdater, useCallbackRef } from "./utils";

/**
 * A state primitive that works in both **controlled** and **uncontrolled**
 * modes — the building block every component library needs so a component can
 * accept `value`/`onChange` (controlled by the parent) *or* manage its own state
 * from `defaultValue`, with one hook and no `if` branches at the call site.
 *
 * Mode is decided per-render by whether `value` is `undefined`:
 *
 * - **Controlled** (`value` is defined): the returned value always mirrors
 *   `value`. The setter does **not** mutate internal state — it only calls
 *   `onChange` with the requested next value (and only when it actually differs),
 *   leaving the parent to update `value`.
 * - **Uncontrolled** (`value` is `undefined`): the hook owns the state, seeded
 *   from `defaultValue`. The setter updates that state and `onChange` fires with
 *   the committed value whenever it changes.
 *
 * The returned tuple has the exact ergonomics of `useState`: `setValue` accepts
 * a next value **or** an updater function `(prev) => next`. `onChange` may change
 * identity between renders — the latest one is always used.
 *
 * @typeParam T - The type of the state value.
 * @param options - `{ value, defaultValue, onChange }`.
 * @returns A `[value, setValue]` tuple.
 *
 * @example
 * ```tsx
 * // A component that is controllable but works standalone.
 * function Switch({ checked, defaultChecked, onCheckedChange }: {
 *   checked?: boolean;
 *   defaultChecked?: boolean;
 *   onCheckedChange?: (checked: boolean) => void;
 * }) {
 *   const [on, setOn] = useControllableState({
 *     value: checked,
 *     defaultValue: defaultChecked ?? false,
 *     onChange: onCheckedChange,
 *   });
 *
 *   return (
 *     <button role="switch" aria-checked={on} onClick={() => setOn((p) => !p)}>
 *       {on ? "On" : "Off"}
 *     </button>
 *   );
 * }
 *
 * // Uncontrolled: <Switch defaultChecked />
 * // Controlled:   <Switch checked={value} onCheckedChange={setValue} />
 * ```
 *
 * @remarks
 * `onChange` in uncontrolled mode is fired from an effect after the value
 * commits, so it is safe under React StrictMode / concurrent rendering (it never
 * runs inside a `setState` updater and never double-fires on mount).
 */
export function useControllableState<T>(
  options: UseControllableStateOptions<T>
): UseControllableStateReturn<T> {
  const { value: controlledValue, defaultValue, onChange } = options;

  const isControlled = controlledValue !== undefined;

  const [uncontrolledValue, setUncontrolledValue] = useState<T | undefined>(
    defaultValue
  );

  const value = (isControlled ? controlledValue : uncontrolledValue) as T;

  const handleChange = useCallbackRef(onChange);

  // Fire onChange when the *uncontrolled* value actually changes. Doing this in
  // an effect (rather than inside the setter's updater) keeps it free of side
  // effects during render and safe against StrictMode double-invocation — the
  // prevValueRef guard makes it a no-op on mount and on the strict re-run.
  const prevValueRef = useRef(uncontrolledValue);
  useEffect(() => {
    if (isControlled) {
      return;
    }
    if (!Object.is(prevValueRef.current, uncontrolledValue)) {
      handleChange(uncontrolledValue as T);
      prevValueRef.current = uncontrolledValue;
    }
  }, [uncontrolledValue, isControlled, handleChange]);

  // Mirror the mode and the current controlled prop into refs so the setter can
  // read the freshest values without listing them as deps — that keeps its
  // identity permanent even in controlled mode where `controlledValue` changes
  // every render (the Radix pattern). handleChange is already permanently stable.
  const isControlledRef = useRef(isControlled);
  isControlledRef.current = isControlled;
  const controlledValueRef = useRef(controlledValue);
  controlledValueRef.current = controlledValue;

  const setValue = useCallback<Dispatch<SetStateAction<T>>>(
    (next) => {
      if (isControlledRef.current) {
        // Controlled: resolve against the current prop, notify only on a real
        // change, and let the parent own the update.
        const current = controlledValueRef.current as T;
        const resolved = isUpdater(next) ? next(current) : next;
        if (!Object.is(resolved, current)) {
          handleChange(resolved);
        }
      } else {
        // Uncontrolled: pass the action straight through to setState so updater
        // functions resolve against the freshest state; onChange fires from the
        // effect above once the new value commits.
        setUncontrolledValue(next as SetStateAction<T | undefined>);
      }
    },
    [handleChange]
  );

  return [value, setValue] as const;
}
