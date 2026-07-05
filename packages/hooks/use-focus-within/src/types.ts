/**
 * Options for {@link useFocusWithin}.
 *
 * Both callbacks fire only on the **edge transitions** of the subtree's focus
 * state — never on every inner focus move. `onFocus` fires when focus enters a
 * previously-unfocused subtree; `onBlur` fires when focus leaves the subtree
 * entirely. Moving focus between two descendants fires neither.
 *
 * The callbacks are read through a latest-ref, so passing new inline functions
 * every render never re-subscribes the underlying listeners.
 */
export interface UseFocusWithinOptions {
  /**
   * Called when keyboard focus **enters** the subtree — i.e. the container or a
   * descendant becomes the active element while nothing inside was focused
   * before. Receives the triggering `focusin` event.
   *
   * Not called for focus moving from one descendant to another (the subtree was
   * already focused).
   */
  onFocus?: (event: FocusEvent) => void;

  /**
   * Called when keyboard focus **leaves** the subtree entirely — i.e. focus
   * moves to an element outside the container (or to nothing at all). Receives
   * the triggering `focusout` event.
   *
   * Not called for focus moving from one descendant to another.
   */
  onBlur?: (event: FocusEvent) => void;
}

/**
 * The callback ref returned as the first tuple element of {@link useFocusWithin}.
 * Attach it to the container element whose focus you want to track:
 * `<div ref={ref}>…</div>`.
 *
 * A **callback ref** (rather than a `RefObject` + effect) is used deliberately:
 * it attaches the `focusin`/`focusout` listeners the instant the element mounts
 * and detaches them the instant it unmounts or the ref moves to another element,
 * with no extra render cycle and no stale-node window.
 *
 * @typeParam T - The container element type.
 */
export type UseFocusWithinRef<T extends HTMLElement = HTMLElement> = (
  node: T | null
) => void;

/**
 * The tuple returned by {@link useFocusWithin}: a stable callback {@link
 * UseFocusWithinRef} to attach to the container, and a boolean that is `true`
 * whenever focus is on the container or any of its descendants.
 *
 * @typeParam T - The container element type.
 */
export type UseFocusWithinReturn<T extends HTMLElement = HTMLElement> = readonly [
  ref: UseFocusWithinRef<T>,
  focused: boolean,
];
