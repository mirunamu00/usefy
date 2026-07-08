import { useCallback, useRef, useState } from "react";
import type {
  HistoryStateInitializer,
  HistoryStateUpdater,
  UseHistoryStateOptions,
  UseHistoryStateReturn,
} from "./types";

/** Internal timeline representation: the full history plus the current pointer. */
interface Timeline<T> {
  history: T[];
  index: number;
}

/** Resolve a {@link HistoryStateInitializer} to a concrete value (once). */
function resolveInitial<T>(initial: HistoryStateInitializer<T>): T {
  return typeof initial === "function"
    ? (initial as () => T)()
    : initial;
}

/**
 * Normalize the `limit` option to a positive integer cap, or `Infinity` when
 * unset/invalid (values below 1 or non-finite mean "unlimited").
 */
function resolveLimit(limit: number | undefined): number {
  return limit != null && Number.isFinite(limit) && limit >= 1
    ? Math.floor(limit)
    : Infinity;
}

/**
 * A React hook for state with built-in undo/redo history (time travel).
 *
 * Tracks a timeline of states and lets you move through it: `set` records a new
 * entry, `undo`/`redo` step through history, and `goTo` jumps to any point.
 * `canUndo`/`canRedo` drive disabled states on toolbar buttons. Every control
 * keeps a stable identity across renders, so it's safe to depend on them in
 * effects (e.g. a `Ctrl/Cmd+Z` keyboard handler).
 *
 * Features:
 * - Undo / redo / `goTo` time travel over an immutable timeline
 * - `set` accepts a value or an updater function (like `useState`)
 * - `canUndo` / `canRedo` flags and the full `history` array + `currentIndex`
 * - Optional `limit` to bound memory (oldest entries drop off the front)
 * - `clear` (collapse to the present) and `reset` (back to the initial state)
 * - No-op skipping: setting the current value again records nothing
 * - Stable control identities — safe as effect dependencies
 * - Full TypeScript generics for the state type
 *
 * @template T - State type.
 * @param initialState - Initial state, or a factory returning it (evaluated once).
 * @param options - Optional configuration (`limit`).
 * @returns `{ state, set, undo, redo, goTo, canUndo, canRedo, clear, reset, history, currentIndex }`
 *
 * @example
 * ```tsx
 * function Editor() {
 *   const { state, set, undo, redo, canUndo, canRedo } = useHistoryState(
 *     initialCanvas,
 *     { limit: 50 }
 *   );
 *
 *   return (
 *     <div>
 *       <Canvas data={state} onChange={set} />
 *       <button onClick={undo} disabled={!canUndo}>⟲ Undo</button>
 *       <button onClick={redo} disabled={!canRedo}>⟳ Redo</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Functional updates + time travel
 * const { state, set, goTo, history, currentIndex } = useHistoryState({ count: 0 });
 * set((s) => ({ count: s.count + 1 })); // updater form
 * goTo(0);                               // jump back to the first entry
 * ```
 */
export function useHistoryState<T>(
  initialState: HistoryStateInitializer<T>,
  options: UseHistoryStateOptions = {}
): UseHistoryStateReturn<T> {
  // Resolve and remember the initial value exactly once (wrapped so any T —
  // including `null`/`undefined`/functions — is stored safely).
  const initialRef = useRef<{ value: T } | null>(null);
  if (initialRef.current === null) {
    initialRef.current = { value: resolveInitial(initialState) };
  }

  const [timeline, setTimeline] = useState<Timeline<T>>(() => ({
    history: [(initialRef.current as { value: T }).value],
    index: 0,
  }));

  // Mirror the latest cap so `set` stays a stable callback while honoring the
  // most recent `limit` option.
  const limitRef = useRef(resolveLimit(options.limit));
  limitRef.current = resolveLimit(options.limit);

  const set = useCallback((next: HistoryStateUpdater<T>) => {
    setTimeline((prev) => {
      const present = prev.history[prev.index];
      const value =
        typeof next === "function"
          ? (next as (p: T) => T)(present)
          : next;

      // Setting the same value again records nothing (and skips the re-render).
      if (Object.is(value, present)) {
        return prev;
      }

      // Drop any "future" (redoable) entries, then append the new state.
      let history = prev.history.slice(0, prev.index + 1);
      history.push(value);
      let index = history.length - 1;

      // Enforce the history cap by dropping the oldest entries.
      const cap = limitRef.current;
      if (history.length > cap) {
        const overflow = history.length - cap;
        history = history.slice(overflow);
        index -= overflow;
      }

      return { history, index };
    });
  }, []);

  const undo = useCallback(() => {
    setTimeline((prev) =>
      prev.index <= 0
        ? prev
        : { history: prev.history, index: prev.index - 1 }
    );
  }, []);

  const redo = useCallback(() => {
    setTimeline((prev) =>
      prev.index >= prev.history.length - 1
        ? prev
        : { history: prev.history, index: prev.index + 1 }
    );
  }, []);

  const goTo = useCallback((index: number) => {
    setTimeline((prev) => {
      const clamped = Math.max(0, Math.min(index, prev.history.length - 1));
      return clamped === prev.index
        ? prev
        : { history: prev.history, index: clamped };
    });
  }, []);

  const clear = useCallback(() => {
    setTimeline((prev) =>
      prev.history.length <= 1
        ? prev
        : { history: [prev.history[prev.index]], index: 0 }
    );
  }, []);

  const reset = useCallback(() => {
    setTimeline((prev) => {
      const initial = (initialRef.current as { value: T }).value;
      // Already at the pristine initial state — skip the re-render.
      return prev.history.length === 1 &&
        prev.index === 0 &&
        Object.is(prev.history[0], initial)
        ? prev
        : { history: [initial], index: 0 };
    });
  }, []);

  const { history, index } = timeline;

  return {
    state: history[index],
    set,
    undo,
    redo,
    goTo,
    canUndo: index > 0,
    canRedo: index < history.length - 1,
    clear,
    reset,
    history,
    currentIndex: index,
  };
}
