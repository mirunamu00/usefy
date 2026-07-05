import type { RefObject } from "react";

/**
 * A way to point at a specific element for {@link UseFocusTrapOptions.initialFocus}
 * or {@link UseFocusTrapOptions.returnFocus}. Accepts:
 *
 * - a raw `HTMLElement`,
 * - a React `RefObject` (its `.current` is read at the moment focus moves),
 * - a getter `() => HTMLElement | null` (evaluated at the moment focus moves —
 *   the most flexible option for elements that mount/unmount).
 */
export type FocusTarget =
  | HTMLElement
  | RefObject<HTMLElement | null>
  | (() => HTMLElement | null);

/**
 * Options for {@link useFocusTrap}.
 */
export interface UseFocusTrapOptions {
  /**
   * Where focus should land when the trap activates.
   *
   * - **default** (omitted) — the first focusable descendant, or the container
   *   itself when there are none.
   * - a {@link FocusTarget} — focus that specific element.
   * - `false` — do not move focus automatically (you place it yourself).
   *
   * @default first focusable element (or the container)
   */
  initialFocus?: FocusTarget | false;

  /**
   * Where focus should return when the trap deactivates or the component
   * unmounts.
   *
   * - `true` (default) — restore focus to whatever was focused at the moment the
   *   trap activated (e.g. the button that opened the dialog).
   * - a {@link FocusTarget} — focus that specific element instead.
   * - `false` — do not restore focus.
   *
   * @default true
   */
  returnFocus?: boolean | FocusTarget;

  /**
   * Called when the user presses <kbd>Escape</kbd> while the trap is active.
   *
   * The hook never manages open/close state itself — this simply surfaces the
   * event so you can close the dialog (and let the trap deactivate) from your
   * own state.
   */
  onEscape?: (event: KeyboardEvent) => void;
}

/**
 * The callback ref returned by {@link useFocusTrap}. Attach it to the element
 * that should contain (trap) focus: `<div ref={ref}>…</div>`.
 *
 * @typeParam T - The container element type.
 */
export type UseFocusTrapRef<T extends HTMLElement = HTMLElement> = (
  node: T | null
) => void;
