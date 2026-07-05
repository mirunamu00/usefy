import { useCallback, useRef, useState } from "react";
import type {
  ObjectStateInitializer,
  ObjectStatePatch,
  ObjectStateReset,
  UseObjectStateReturn,
} from "./types";

/**
 * Resolve an {@link ObjectStateInitializer} to a concrete object. A function
 * initializer is invoked once; a direct object is returned as-is.
 */
function resolveInitial<T extends object>(initial: ObjectStateInitializer<T>): T {
  return typeof initial === "function" ? (initial as () => T)() : initial;
}

/**
 * A React hook for managing object state with immutable partial updates
 * (patch/merge) and reset — the ergonomic middle ground between `useState`
 * (replace the whole value) and `useReducer` (write a reducer).
 *
 * Returns a `useState`-style tuple `[state, patch, reset]`:
 *
 * - **`patch`** shallow-merges a `Partial<T>` into the current state
 *   **immutably** (`{ ...prev, ...partial }`), producing a brand-new object on
 *   every call and never mutating the previous state. Only the provided keys
 *   change; untouched keys are preserved by reference. It also accepts a
 *   functional updater `(prev) => Partial<T>` when the next value depends on the
 *   previous one.
 * - **`reset`** restores the state to the initial value captured on mount, or —
 *   when passed an argument — to that object instead.
 *
 * Both `patch` and `reset` are referentially stable for the lifetime of the
 * component (safe to use as `useEffect` dependencies). The hook is pure state
 * logic, so it is SSR-safe and StrictMode-safe.
 *
 * @remarks
 * - **Objects only.** Intended for plain objects/records (`T extends object`),
 *   not arrays or primitives — for array state use `useList`, and for a single
 *   value use `useState`.
 * - **Shallow merge.** A nested object in the patch replaces the previous nested
 *   object wholesale; it is not deep-merged. Spread the nested object yourself
 *   (`patch({ user: { ...state.user, name } })`) to update one nested field.
 * - **Every patch re-renders.** No shallow-equality dedupe is performed — like
 *   `react-use`'s `useSetState`, each `patch` commits a new object and triggers
 *   a render, even if the merged values are unchanged. This keeps the semantics
 *   simple and predictable; wrap in your own guard if you need to skip no-ops.
 * - **Lazy init is cached once.** If a function initializer is passed, it runs a
 *   single time on mount and the produced value is reused by `reset()`; the
 *   initializer is not re-evaluated on reset.
 *
 * @template T - The object shape held in state.
 * @param initialState - The initial object, or a factory returning it (run once).
 * @returns `[state, patch, reset]`
 *
 * @example
 * ```tsx
 * interface FormState {
 *   name: string;
 *   email: string;
 *   subscribe: boolean;
 * }
 *
 * function SignupForm() {
 *   const [form, patch, reset] = useObjectState<FormState>({
 *     name: "",
 *     email: "",
 *     subscribe: false,
 *   });
 *
 *   return (
 *     <form>
 *       <input
 *         value={form.name}
 *         onChange={(e) => patch({ name: e.target.value })}
 *       />
 *       <input
 *         value={form.email}
 *         onChange={(e) => patch({ email: e.target.value })}
 *       />
 *       <label>
 *         <input
 *           type="checkbox"
 *           checked={form.subscribe}
 *           onChange={(e) => patch({ subscribe: e.target.checked })}
 *         />
 *         Subscribe
 *       </label>
 *       <button type="button" onClick={() => reset()}>Reset</button>
 *     </form>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Functional patch + reset to a provided object
 * const [counter, patch, reset] = useObjectState({ count: 0, step: 1 });
 * patch((prev) => ({ count: prev.count + prev.step })); // compute from prev
 * reset({ count: 10, step: 5 });                         // reset to a new object
 * ```
 */
export function useObjectState<T extends object>(
  initialState: ObjectStateInitializer<T>
): UseObjectStateReturn<T> {
  // Capture the resolved initial value exactly once so `reset()` can restore it
  // without re-running a lazy initializer. `T extends object`, so the resolved
  // value is never null — the null sentinel safely means "not yet resolved".
  const initialRef = useRef<T | null>(null);
  if (initialRef.current === null) {
    initialRef.current = resolveInitial(initialState);
  }

  const [state, setState] = useState<T>(initialRef.current);

  const patch = useCallback<ObjectStatePatch<T>>((update) => {
    setState((prev) => {
      const partial =
        typeof update === "function" ? update(prev) : update;
      // Immutable shallow merge — always a brand-new object; `prev` is untouched.
      return { ...prev, ...partial };
    });
  }, []);

  const reset = useCallback<ObjectStateReset<T>>((nextState) => {
    setState(nextState !== undefined ? nextState : (initialRef.current as T));
  }, []);

  return [state, patch, reset];
}
