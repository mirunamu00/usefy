import type { TourTarget } from "../types";

/**
 * Resolve a {@link TourTarget} (CSS selector / React ref / function) to a DOM
 * `Element`, or `null` when it can't be found.
 *
 * - Selector strings use `document.querySelector`; an invalid selector (or a
 *   non-DOM environment) resolves to `null` instead of throwing.
 * - Refs resolve to `ref.current`.
 * - Functions are invoked and their return value is used.
 * - An element that is no longer connected to the document resolves to `null`
 *   (a detached node can't be spotlighted) — this is what lets a mid-step
 *   target unmount re-apply the step's `missingTarget` policy.
 *
 * @param target - The target in any supported form; `undefined` (a centered
 * step) resolves to `null`.
 * @returns The resolved element, or `null`.
 *
 * @example
 * ```ts
 * import { resolveTarget } from "@usefy/spotlight-tour/headless";
 *
 * resolveTarget("#search-bar");                          // Element | null
 * resolveTarget(myRef);                                  // myRef.current
 * resolveTarget(() => document.querySelector(".card"));  // Element | null
 * resolveTarget(undefined);                              // null (centered step)
 * ```
 */
export function resolveTarget(target: TourTarget | undefined): Element | null {
  if (target == null) return null;

  let resolved: Element | null;
  if (typeof target === "string") {
    if (typeof document === "undefined") return null;
    try {
      resolved = document.querySelector(target);
    } catch {
      // Invalid selector — treat as unresolvable rather than throwing.
      resolved = null;
    }
  } else if (typeof target === "function") {
    resolved = target() ?? null;
  } else {
    resolved = target.current ?? null;
  }

  // Ref/function targets can hand back a node that already left the DOM.
  return resolved !== null && resolved.isConnected ? resolved : null;
}
