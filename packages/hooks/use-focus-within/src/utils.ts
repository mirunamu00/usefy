/**
 * Whether `target` is the `container` itself or one of its descendants.
 *
 * A tiny, SSR-agnostic wrapper around `Node.contains` that also folds in the
 * two "no focus" cases: a `null`/absent `container` and a `null` `target`
 * (e.g. a `focusout` whose `relatedTarget` is `null`, or `document.activeElement`
 * being `null`) both mean "focus is not inside", so this returns `false`.
 *
 * `Node.contains(node)` is reflexive — `container.contains(container)` is
 * `true` — so focus resting on the container element itself counts as inside.
 *
 * @param container - The subtree root, or `null` when nothing is attached.
 * @param target - The element to test (an `EventTarget`, `Node`, or `null`).
 * @returns `true` when `target` is `container` or a descendant of it.
 */
export function isFocusInside(
  container: Node | null,
  target: EventTarget | Node | null
): boolean {
  if (!container || !target) return false;
  return container.contains(target as Node);
}
