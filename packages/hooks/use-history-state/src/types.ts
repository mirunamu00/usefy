/**
 * Accepted initial value for {@link useHistoryState}.
 *
 * Mirrors `useState`'s lazy-initializer support: pass a value directly, or a
 * function returning it (evaluated once on mount). This becomes the first — and
 * initially only — entry in the history timeline.
 *
 * @template T - State type.
 */
export type HistoryStateInitializer<T> = T | (() => T);

/**
 * The argument accepted by {@link UseHistoryStateReturn.set}: either the next
 * value directly, or an updater function that receives the current (present)
 * state and returns the next one — just like `useState`'s setter.
 *
 * @template T - State type.
 */
export type HistoryStateUpdater<T> = T | ((prev: T) => T);

/**
 * Options for {@link useHistoryState}.
 *
 * @template T - State type.
 */
export interface UseHistoryStateOptions {
  /**
   * Maximum number of entries to keep in the history timeline. When a new entry
   * would exceed this limit, the oldest entries are dropped from the front.
   *
   * Values below `1` (or non-finite values) are ignored and treated as
   * unlimited. Defaults to unlimited — set this for long-running editors to
   * bound memory usage.
   */
  limit?: number;
}

/**
 * Return value of {@link useHistoryState}: the current state plus a stable set
 * of controls for navigating and mutating the undo/redo timeline.
 *
 * Every function keeps a stable identity across renders, so they're safe to use
 * as `useEffect`/`useMemo` dependencies (e.g. for keyboard-shortcut effects).
 *
 * @template T - State type.
 */
export interface UseHistoryStateReturn<T> {
  /** The current (present) state. */
  state: T;

  /**
   * Push a new state onto the timeline. Accepts a value or an updater function
   * (`prev => next`), like `useState`. Any "future" states (entries after the
   * current position, reachable via `redo`) are discarded. Setting a value
   * equal to the current one (by `Object.is`) is a no-op and records nothing.
   *
   * Note: as with `useState`, if `T` is itself a function type, pass an updater
   * (`() => myFn`) — a bare function argument is always treated as an updater.
   */
  set: (next: HistoryStateUpdater<T>) => void;

  /** Move one step back in history. No-op when {@link canUndo} is `false`. */
  undo: () => void;

  /** Move one step forward in history. No-op when {@link canRedo} is `false`. */
  redo: () => void;

  /**
   * Jump to a specific entry by index. The index is clamped to the valid range
   * `[0, history.length - 1]`; jumping to the current index is a no-op.
   */
  goTo: (index: number) => void;

  /** Whether there is a previous state to {@link undo} to. */
  canUndo: boolean;

  /** Whether there is a next state to {@link redo} to. */
  canRedo: boolean;

  /**
   * Collapse the timeline down to just the current state, discarding all past
   * and future entries. No-op when the timeline already holds a single entry.
   */
  clear: () => void;

  /**
   * Reset back to the initial state provided at mount and wipe the entire
   * timeline. The restored value is a reference to the original initial value.
   */
  reset: () => void;

  /**
   * The full history timeline, oldest first. Read-only — mutating it would
   * bypass React state. Use `history[currentIndex]` for the present (same as
   * `state`).
   */
  history: readonly T[];

  /** The index of the current state within {@link history}. */
  currentIndex: number;
}
