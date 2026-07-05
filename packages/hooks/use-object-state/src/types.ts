/**
 * Accepted initial value for {@link useObjectState}.
 *
 * Mirrors `useState`'s lazy-initializer support: pass a plain object, or a
 * function returning one (evaluated **once** on mount). The resolved value is
 * captured for {@link ObjectStateReset | reset()}.
 *
 * @template T - The object shape held in state.
 *
 * @example
 * ```ts
 * useObjectState({ name: "", age: 0 });         // direct object
 * useObjectState(() => ({ name: "", age: 0 })); // lazy (run once)
 * ```
 */
export type ObjectStateInitializer<T extends object> = T | (() => T);

/**
 * The `patch` updater returned by {@link useObjectState}.
 *
 * Shallow-merges a partial into the current state **immutably** — it always
 * produces a brand-new object (`{ ...prev, ...partial }`) and never mutates the
 * previous state. Only the provided keys change; untouched keys are preserved by
 * reference.
 *
 * Two forms are accepted:
 * - a `Partial<T>` object — merged directly, and
 * - a functional updater `(prev: T) => Partial<T>` — computes the partial from
 *   the current state (use this when the next value depends on the previous one).
 *
 * The merge is **shallow**: a nested object in the partial replaces the previous
 * nested object wholesale, it is not deep-merged.
 *
 * @template T - The object shape held in state.
 */
export type ObjectStatePatch<T extends object> = (
  patch: Partial<T> | ((prev: T) => Partial<T>)
) => void;

/**
 * The `reset` action returned by {@link useObjectState}.
 *
 * - `reset()` — restores the state to the initial value captured on mount (if a
 *   lazy initializer was used, the value it produced is cached once and reused;
 *   the initializer is not re-run).
 * - `reset(nextState)` — replaces the state with the provided object instead.
 *
 * @template T - The object shape held in state.
 */
export type ObjectStateReset<T extends object> = (nextState?: T) => void;

/**
 * Return type of {@link useObjectState}: a tuple of the current state, the
 * `patch` updater, and the `reset` action — mirroring the `useState` tuple shape
 * but with partial-merge semantics.
 *
 * @template T - The object shape held in state.
 */
export type UseObjectStateReturn<T extends object> = [
  T,
  ObjectStatePatch<T>,
  ObjectStateReset<T>,
];
