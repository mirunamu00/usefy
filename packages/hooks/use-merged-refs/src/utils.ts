import type { PossibleRef, RefCleanup } from "./types";

/**
 * Assign `value` to a single ref, whatever its form.
 *
 * - **Callback ref** — invoked with `value`. Its return value is passed through:
 *   React 19 callback refs may return a cleanup function.
 * - **Ref object** — its `.current` is set to `value`.
 * - **`null` / `undefined`** — ignored.
 *
 * @returns The callback ref's cleanup function if it returned one, otherwise
 * `void`.
 */
export function setRef<T>(
  ref: PossibleRef<T>,
  value: T
): RefCleanup | void {
  if (typeof ref === "function") {
    return ref(value) as RefCleanup | void;
  }
  if (ref !== null && ref !== undefined) {
    (ref as { current: T }).current = value;
  }
}

/**
 * Merge several refs into a single callback ref that forwards the node to all of
 * them. The returned callback is safe for both React 18 and 19:
 *
 * - It applies the node to every ref (callback or object), collecting any React
 *   19 cleanup functions.
 * - If **any** ref returned a cleanup, the merged callback returns a cleanup that
 *   runs each ref's cleanup (or resets object/callback refs to `null` for refs
 *   that did not return one). If none did, it returns `void`, so React 18 —
 *   which warns when a callback ref returns a value — stays happy.
 *
 * This is the non-hook core of {@link useMergedRefs}; use it when you need to
 * compose refs outside of render (e.g. in a class or a one-off).
 *
 * @param refs - The refs to merge. `null` / `undefined` entries are skipped.
 * @returns A callback ref that fans out to every provided ref.
 */
export function mergeRefs<T>(
  ...refs: PossibleRef<T>[]
): (node: T | null) => RefCleanup | void {
  return (node) => {
    let hasCleanup = false;
    const cleanups = refs.map((ref) => {
      const cleanup = setRef(ref, node as T);
      if (!hasCleanup && typeof cleanup === "function") {
        hasCleanup = true;
      }
      return cleanup;
    });

    if (hasCleanup) {
      return () => {
        for (let i = 0; i < cleanups.length; i++) {
          const cleanup = cleanups[i];
          if (typeof cleanup === "function") {
            cleanup();
          } else {
            setRef(refs[i], null as T);
          }
        }
      };
    }
  };
}
