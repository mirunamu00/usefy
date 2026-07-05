import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useUnmount } from "@usefy/use-unmount";

/**
 * The return tuple of {@link useRafState} — mirrors `useState`'s
 * `[state, setState]` shape exactly.
 *
 * @typeParam T - The state value type.
 */
export type UseRafStateReturn<T> = [T, Dispatch<SetStateAction<T>>];

/**
 * `true` when `requestAnimationFrame`/`cancelAnimationFrame` are usable in the
 * current environment. Read live (not cached at module load) so the value is
 * correct under SSR, jsdom, and tests that stub the globals. Using `typeof` on
 * the bare identifier is safe even when the global is undeclared (it never
 * throws), so this is import-safe on the server.
 */
function isRafSupported(): boolean {
  return (
    typeof requestAnimationFrame === "function" &&
    typeof cancelAnimationFrame === "function"
  );
}

/**
 * A drop-in replacement for `useState` that **batches** every update to
 * `requestAnimationFrame`, so a burst of rapid `setState` calls (scroll,
 * resize, pointer move, animation loops) coalesces to **at most one commit per
 * frame** — smoother UI and far fewer wasted re-renders.
 *
 * The public API matches `useState` exactly:
 * - Accepts a direct initial value **or** a lazy initializer `() => T` (the
 *   initializer is forwarded to the underlying `useState`, so it runs once).
 * - The returned setter accepts a next value **or** a functional updater
 *   `(prev) => next` — the `SetStateAction<T>` is forwarded to the real setter,
 *   so updater semantics are preserved.
 *
 * ## Coalescing semantics — **last-write-wins**
 * When you call the setter, a frame is scheduled. If you call it **again**
 * before that frame fires, the previously scheduled frame is **cancelled** and
 * a new one is scheduled, so **only the latest call in a frame commits**. This
 * is the correct, expected behaviour for the absolute-value use case this hook
 * targets (each scroll/resize/pointer event sets the current value):
 *
 * ```ts
 * setState(10);
 * setState(20);
 * setState(30); // → the frame commits 30 only; one re-render, not three
 * ```
 *
 * **Functional updaters interact with coalescing the same way** — only the
 * *last* action survives, and it runs against the currently-committed state:
 *
 * ```ts
 * // committed state is 0
 * setState((n) => n + 1);
 * setState((n) => n + 1);
 * setState((n) => n + 1); // → commits 1 (not 3): only the last updater runs
 * ```
 *
 * If you need increments to **accumulate** within a single frame, don't rely on
 * per-call updaters — compute the absolute next value yourself and set that
 * (e.g. `setState(base + delta)`), which is the natural pattern for the
 * scroll/resize/pointer scenarios this hook is built for.
 *
 * ## Safety
 * - **Stable setter** — the returned setter is wrapped in `useCallback([])`, so
 *   its identity never changes. Safe to pass to children or list as an effect
 *   dependency without causing churn.
 * - **Cancel on unmount** — any pending frame is cancelled when the component
 *   unmounts, so no state update (and no dev warning) fires after unmount.
 * - **SSR-safe** — never touches `requestAnimationFrame` at module top level.
 *   If rAF is unavailable at call time (server, or an exotic environment), the
 *   update is applied **synchronously** as a graceful fallback rather than lost.
 * - **StrictMode / concurrent-safe** — updates are only ever scheduled from
 *   events/effects, never during render, and the pending-frame handle lives in
 *   a ref, so double-invoked renders/effects never leak or double-apply a frame.
 * - Supports React 18 and 19.
 *
 * @typeParam T - The state value type.
 * @param initialState - The initial value, or a lazy initializer `() => T`.
 * @returns A `[state, setState]` tuple, identical in shape to `useState`.
 *
 * @example
 * ```tsx
 * // Smoothly track the pointer without re-rendering more than once per frame.
 * import { useRafState } from "@usefy/use-raf-state";
 * import { useEffect } from "react";
 *
 * function MouseFollower() {
 *   const [pos, setPos] = useRafState({ x: 0, y: 0 });
 *
 *   useEffect(() => {
 *     const onMove = (e: PointerEvent) => setPos({ x: e.clientX, y: e.clientY });
 *     window.addEventListener("pointermove", onMove);
 *     return () => window.removeEventListener("pointermove", onMove);
 *   }, [setPos]);
 *
 *   return (
 *     <div
 *       style={{
 *         transform: `translate(${pos.x}px, ${pos.y}px)`,
 *       }}
 *     >
 *       following you
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Lazy initializer — computed once, exactly like useState.
 * const [size, setSize] = useRafState(() => ({
 *   w: window.innerWidth,
 *   h: window.innerHeight,
 * }));
 * ```
 */
export function useRafState<T>(
  initialState: T | (() => T)
): UseRafStateReturn<T>;
export function useRafState<T = undefined>(): UseRafStateReturn<T | undefined>;
export function useRafState<T>(
  initialState?: T | (() => T)
): UseRafStateReturn<T | undefined> {
  // The real state. The initializer (value or lazy fn) is forwarded straight
  // to useState, so lazy init runs exactly once and updater semantics are
  // preserved by the underlying setter.
  const [state, setState] = useState<T | undefined>(initialState);

  // Handle of the pending frame (null when nothing is scheduled). Kept in a ref
  // so it survives re-renders and StrictMode remounts without churning the
  // stable setter below.
  const frame = useRef<number | null>(null);

  const setRafState = useCallback<Dispatch<SetStateAction<T | undefined>>>(
    (value) => {
      // Coalesce: drop any frame already queued for this burst so only the
      // latest call in a frame commits (last-write-wins).
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current);
        frame.current = null;
      }

      // SSR / unsupported-environment fallback: apply synchronously so the
      // update is never silently dropped. (In practice the setter isn't called
      // during SSR render — this guards exotic/non-browser runtimes.)
      if (!isRafSupported()) {
        setState(value);
        return;
      }

      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        setState(value);
      });
    },
    []
  );

  // Cancel any pending frame on unmount so no setState fires after unmount.
  useUnmount(() => {
    if (frame.current !== null && isRafSupported()) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
  });

  return [state, setRafState];
}
