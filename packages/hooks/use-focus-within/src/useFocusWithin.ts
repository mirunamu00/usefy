import { useCallback, useRef, useState } from "react";
import { useLatest } from "@usefy/use-latest";
import type {
  UseFocusWithinOptions,
  UseFocusWithinRef,
  UseFocusWithinReturn,
} from "./types";
import { isFocusInside } from "./utils";

/**
 * Track whether keyboard focus is currently anywhere within a subtree.
 *
 * Returns a tuple `[ref, focused]`: attach `ref` to a container element and
 * `focused` is `true` whenever the active element is that container or any of
 * its descendants — the reactive equivalent of the CSS `:focus-within`
 * pseudo-class, usable to drive React state (highlighting a form/card, showing
 * a toolbar, etc.).
 *
 * ### How it works
 * The hook listens for the **bubbling** `focusin` / `focusout` events on the
 * container (the non-bubbling `focus` / `blur` can't observe descendant focus).
 *
 * - **`focusin`** → focus entered the subtree, so `focused` becomes `true`.
 * - **`focusout`** → focus *may* be leaving. We decide whether it truly left:
 *   - If `event.relatedTarget` is a node **inside** the container, focus merely
 *     moved between two descendants — stay `true` (no flicker).
 *   - If `relatedTarget` is a node **outside** the container, focus left — go
 *     `false`.
 *   - If `relatedTarget` is `null` it is *unreliable* (some browsers report
 *     `null` even when focus stays inside; it's also `null` when focus goes to
 *     nothing or another window). Rather than trust it, we defer one microtask
 *     — by which point the browser has settled `document.activeElement` — and
 *     go `false` only if focus genuinely ended up outside the container.
 *
 * This deferred `activeElement` re-check (documented and tested) is what makes
 * the hook robust to the `null`-`relatedTarget` browser quirk while remaining
 * fully verifiable in jsdom.
 *
 * ### Guarantees
 * - **Callback ref** — listeners attach/detach exactly when the element
 *   mounts/unmounts or the ref moves to another element; no stale-node window,
 *   no extra render. Works on React 18 (call-with-`null` detach) and 19.
 * - **Edge callbacks** — `onFocus` / `onBlur` fire only on the subtree's
 *   `false ↔ true` transitions, never on inner focus moves. They're read
 *   through a latest-ref, so new inline handlers never re-subscribe listeners.
 * - **SSR-safe** — no `window`/`document` access on the server; initial
 *   `focused` is `false`.
 * - **StrictMode / concurrent-safe** — no duplicate listeners and no stuck
 *   `focused` state across React 18's double mount; callbacks are dispatched
 *   from the event handler, never from inside a `setState` updater.
 *
 * @typeParam T - The container element type (defaults to `HTMLElement`).
 * @param options - {@link UseFocusWithinOptions} — optional `onFocus` / `onBlur`
 *   edge callbacks.
 * @returns A `[ref, focused]` tuple — see {@link UseFocusWithinReturn}.
 *
 * @example
 * ```tsx
 * import { useFocusWithin } from "@usefy/use-focus-within";
 *
 * function ContactForm() {
 *   const [ref, focused] = useFocusWithin<HTMLFormElement>();
 *
 *   return (
 *     <form
 *       ref={ref}
 *       style={{ outline: focused ? "2px solid dodgerblue" : "none" }}
 *     >
 *       <input placeholder="Name" />
 *       <input placeholder="Email" />
 *       <button type="submit">Send</button>
 *     </form>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With edge callbacks — fire only when focus enters/leaves the subtree.
 * const [ref, focused] = useFocusWithin<HTMLDivElement>({
 *   onFocus: () => console.log("entered"),
 *   onBlur: () => console.log("left"),
 * });
 * ```
 */
export function useFocusWithin<T extends HTMLElement = HTMLElement>(
  options: UseFocusWithinOptions = {}
): UseFocusWithinReturn<T> {
  const [focused, setFocused] = useState(false);

  // Mirrors `focused` synchronously so the event handlers can read the current
  // value without stale closures and only act on true transitions.
  const focusedRef = useRef(false);
  // Latest callbacks without re-attaching listeners when only a handler changes.
  const optionsRef = useLatest(options);
  // Cleanup for the currently-attached node, run before re-attaching or on detach.
  const cleanupRef = useRef<(() => void) | null>(null);

  const enterFocus = useCallback(
    (event: FocusEvent) => {
      if (focusedRef.current) return;
      focusedRef.current = true;
      setFocused(true);
      optionsRef.current.onFocus?.(event);
    },
    [optionsRef]
  );

  const leaveFocus = useCallback(
    (event: FocusEvent) => {
      if (!focusedRef.current) return;
      focusedRef.current = false;
      setFocused(false);
      optionsRef.current.onBlur?.(event);
    },
    [optionsRef]
  );

  const ref = useCallback<UseFocusWithinRef<T>>(
    (node) => {
      // Detach from any previously-attached node first. Covers ref moving to a
      // new element, unmount, and React 18 StrictMode's mount→unmount→mount
      // (so listeners are never duplicated and `focused` never sticks).
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }

      if (!node) return;

      const onFocusIn = (event: FocusEvent) => {
        enterFocus(event);
      };

      const onFocusOut = (event: FocusEvent) => {
        if (!focusedRef.current) return;

        const related = event.relatedTarget;
        // Loose `!= null` on purpose: per spec `relatedTarget` is
        // `EventTarget | null`, but jsdom (and our DOM-coercion guideline) can
        // hand back `undefined`. Both `null` and `undefined` are unreliable and
        // must take the deferred `activeElement` re-check path below — a strict
        // `!== null` would wrongly treat `undefined` as a present target and
        // blur synchronously.
        if (related != null) {
          // Reliable relatedTarget: focus left iff it landed outside the subtree.
          if (!isFocusInside(node, related)) leaveFocus(event);
          return;
        }

        // relatedTarget is null/undefined — unreliable. Confirm against the
        // settled activeElement on the next microtask before flipping off.
        queueMicrotask(() => {
          if (!focusedRef.current) return;
          if (!isFocusInside(node, node.ownerDocument.activeElement)) {
            leaveFocus(event);
          }
        });
      };

      node.addEventListener("focusin", onFocusIn);
      node.addEventListener("focusout", onFocusOut);

      // Sync initial state: the element may mount already containing focus
      // (e.g. an autofocused input). No triggering event exists, so `onFocus`
      // is intentionally not fired here — only `focused` is set.
      if (
        !focusedRef.current &&
        isFocusInside(node, node.ownerDocument.activeElement)
      ) {
        focusedRef.current = true;
        setFocused(true);
      }

      cleanupRef.current = () => {
        node.removeEventListener("focusin", onFocusIn);
        node.removeEventListener("focusout", onFocusOut);
        // Reset so a remount/relocation starts from a clean `false`. This is a
        // silent reset (no `onBlur`) — the callbacks report focus transitions,
        // not teardown.
        if (focusedRef.current) {
          focusedRef.current = false;
          setFocused(false);
        }
      };
    },
    [enterFocus, leaveFocus]
  );

  return [ref, focused];
}
