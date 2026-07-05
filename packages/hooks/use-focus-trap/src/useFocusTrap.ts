import { useCallback, useRef, useState } from "react";
import { useIsomorphicLayoutEffect } from "@usefy/use-isomorphic-layout-effect";
import { useLatest } from "@usefy/use-latest";
import type { UseFocusTrapOptions, UseFocusTrapRef } from "./types";
import { getFocusableElements, resolveFocusTarget } from "./utils";

/**
 * Module-level stack of currently-active traps, ordered oldest → newest. Because
 * the keydown listener lives on `document`, *every* active trap would otherwise
 * see *every* keydown — so two simultaneously-active traps (a dialog opened over
 * another dialog) would double-fire `onEscape` and race to move focus on Tab.
 *
 * Only the trap on **top** of this stack (the most-recently activated) reacts;
 * the ones underneath stay silent until they become topmost again. Each
 * activation pushes a fresh token and its cleanup pops exactly that token, so
 * React 18's StrictMode double-mount never leaks a stale entry.
 */
const activeTraps: object[] = [];

/**
 * Trap keyboard focus inside a subtree — the accessibility primitive behind
 * modals, dialogs, drawers, and popovers. While `active` is `true`, <kbd>Tab</kbd>
 * and <kbd>Shift</kbd>+<kbd>Tab</kbd> cycle only through the focusable elements
 * inside the container, focus is moved into the trap on activation, and focus is
 * restored to wherever it was when the trap deactivates or unmounts.
 *
 * It does **one** thing — trapping focus. It does not lock body scroll (see
 * `@usefy/use-scroll-lock`) and renders nothing; attach the returned ref to your
 * own container.
 *
 * This is a modal-grade **"hard" trap**: while `active` (which defaults to
 * `true`), a <kbd>Tab</kbd> pressed anywhere on the page — even from outside the
 * container — pulls focus back into the trap. When two traps are active at once
 * (a dialog opened over another dialog), only the most-recently activated
 * ("topmost") one reacts; the ones beneath stay dormant until it deactivates.
 *
 * Behaviour:
 * - **Live focusable set** — the focusable elements are recomputed on every
 *   <kbd>Tab</kbd> (never cached), so content that appears/disappears while the
 *   dialog is open is always handled correctly. The robust selector excludes
 *   `disabled`, `hidden`, `inert`, `tabindex="-1"`, and invisible elements.
 * - **Wrap-around** — <kbd>Tab</kbd> on the last element wraps to the first;
 *   <kbd>Shift</kbd>+<kbd>Tab</kbd> on the first wraps to the last. A document-level
 *   listener means focus that escaped the trap (a click elsewhere, a
 *   programmatic focus) is pulled back in on the next <kbd>Tab</kbd>.
 * - **Zero focusable elements** — focus is kept on the container (which is given
 *   a temporary `tabindex="-1"`) and <kbd>Tab</kbd> is prevented from escaping.
 * - **Initial focus** — configurable via `initialFocus` (defaults to the first
 *   focusable element, or the container). Pass `false` to place focus yourself.
 * - **Return focus** — configurable via `returnFocus` (defaults to restoring the
 *   element focused at activation time). Pass `false` to skip.
 * - **Escape** — `onEscape` is surfaced so you can close the dialog; the hook
 *   never manages open/close state itself.
 * - **SSR-safe** — no `document` access on the server; the ref is inert until it
 *   attaches to a real node on the client.
 * - **StrictMode / concurrent-safe** — activation captures the return target
 *   fresh each run and cleanup always removes the listener and restores focus, so
 *   React 18's double mount never leaks a listener or mis-restores focus.
 *
 * @typeParam T - The container element type (defaults to `HTMLElement`).
 * @param active - Whether the trap is active. Defaults to `true` so a
 *   conditionally-rendered dialog can simply attach the ref.
 * @param options - {@link UseFocusTrapOptions} — `initialFocus`, `returnFocus`,
 *   and `onEscape`.
 * @returns A stable callback ref to attach to the container element.
 *
 * @example
 * ```tsx
 * import { useState } from "react";
 * import { useFocusTrap } from "@usefy/use-focus-trap";
 *
 * function Dialog() {
 *   const [open, setOpen] = useState(false);
 *   // Focus is trapped while `open`, and restored to the trigger on close.
 *   const ref = useFocusTrap<HTMLDivElement>(open, {
 *     onEscape: () => setOpen(false),
 *   });
 *
 *   return (
 *     <>
 *       <button onClick={() => setOpen(true)}>Open dialog</button>
 *       {open && (
 *         <div ref={ref} role="dialog" aria-modal="true">
 *           <input placeholder="Name" />
 *           <button onClick={() => setOpen(false)}>Close</button>
 *         </div>
 *       )}
 *     </>
 *   );
 * }
 * ```
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  active: boolean = true,
  options: UseFocusTrapOptions = {}
): UseFocusTrapRef<T> {
  const [container, setContainer] = useState<T | null>(null);
  // Latest options without re-subscribing the effect when only a handler changes.
  const optionsRef = useLatest(options);
  // Whether the trap is currently active — read by the deferred focus-restore to
  // cancel itself when the trap re-activates before the microtask runs.
  const activeRef = useRef(false);

  // Stable callback ref: store the node in state so the trap effect re-runs when
  // the container mounts/unmounts. `useCallback([])` keeps its identity stable,
  // so React doesn't detach/reattach it on every render.
  const setRef = useCallback<UseFocusTrapRef<T>>((node) => {
    setContainer(node);
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (!active || !container) return;

    const doc = container.ownerDocument;

    // Marks this trap as live. The deferred focus-restore below reads it to
    // cancel itself if the trap gets re-activated before the microtask runs
    // (rapid toggle, or React 18 StrictMode's mount → unmount → mount).
    activeRef.current = true;

    // A fresh token per activation identifies this trap on the activation stack
    // so the cleanup can pop exactly this entry (StrictMode remount never leaks).
    // The token is pushed later — immediately before the listener is attached —
    // so a throw in the initial-focus block below can't leave a token stranded
    // on the stack (which would silently wedge every other live trap).
    const trapToken = {};

    // Remember what was focused so we can restore it on deactivation. Captured
    // fresh on every activation (including each StrictMode remount).
    const previouslyFocused = doc.activeElement as HTMLElement | null;

    // Ensure the container itself is focusable (needed for the "no focusable
    // children" fallback and as an initial-focus target). Only add the attribute
    // if the caller didn't set one, and remove exactly what we added.
    const addedTabIndex = !container.hasAttribute("tabindex");
    if (addedTabIndex) container.setAttribute("tabindex", "-1");

    // --- Initial focus ---------------------------------------------------
    const { initialFocus } = optionsRef.current;
    if (initialFocus !== false) {
      let target: HTMLElement | null;
      if (initialFocus === undefined) {
        target = getFocusableElements(container)[0] ?? container;
      } else {
        target = resolveFocusTarget(initialFocus) ?? container;
      }
      target?.focus();
    }

    // --- Tab / Shift+Tab trapping + Escape -------------------------------
    // The listener is on the *document*, not the container: a container-scoped
    // listener can't see a Tab that originates outside the trap, so focus that
    // escaped (a click on the overlay, a programmatic focus) could never be
    // recaptured. Listening at the document level makes this a real ("hard")
    // trap — every Tab is evaluated relative to the container.
    const onKeyDown = (event: KeyboardEvent) => {
      // Only the topmost (most-recently activated) trap acts. Nested/simultaneous
      // traps all hear this document-level keydown; the ones underneath bail so
      // Escape fires once and only one Tab handler moves focus.
      if (activeTraps[activeTraps.length - 1] !== trapToken) return;

      if (event.key === "Escape") {
        // Only surface Escape when focus is inside the trap — a global listener
        // must not hijack Escape for unrelated parts of the page.
        if (container.contains(doc.activeElement)) {
          optionsRef.current.onEscape?.(event);
        }
        return;
      }
      if (event.key !== "Tab") return;

      // Recompute live — the dialog's contents may have changed.
      const focusable = getFocusableElements(container);

      if (focusable.length === 0) {
        // Nothing to cycle to: keep focus pinned on the container.
        event.preventDefault();
        container.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeEl = doc.activeElement;
      const insideTrap = container.contains(activeEl);

      if (event.shiftKey) {
        // Wrap to the last element when leaving the first (or from outside).
        if (activeEl === first || !insideTrap) {
          event.preventDefault();
          last.focus();
        }
      } else {
        // Wrap to the first element when leaving the last (or from outside).
        if (activeEl === last || !insideTrap) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    // Push onto the activation stack only now that all throw-prone activation
    // work is done: this trap is the topmost, and the cleanup below is
    // guaranteed to be registered to pop it.
    activeTraps.push(trapToken);
    doc.addEventListener("keydown", onKeyDown);

    return () => {
      activeRef.current = false;
      // Remove exactly this trap's token — restoring the trap beneath it (if any)
      // to topmost. `indexOf` + `splice` handles out-of-order pops safely.
      const idx = activeTraps.indexOf(trapToken);
      if (idx !== -1) activeTraps.splice(idx, 1);
      doc.removeEventListener("keydown", onKeyDown);
      if (addedTabIndex) container.removeAttribute("tabindex");

      // --- Return focus --------------------------------------------------
      const { returnFocus = true } = optionsRef.current;
      if (returnFocus === false) return;

      const target =
        returnFocus === true
          ? previouslyFocused
          : resolveFocusTarget(returnFocus);

      // Guard: the element may have been removed from the DOM while the trap
      // was open — never steal focus to a detached node. (`doc.contains(body)`
      // is `true`, so the "nothing was focused" case — `previouslyFocused` is
      // `<body>` — still passes; focusing the body is simply a harmless no-op.)
      if (!target || !doc.contains(target)) return;

      // Defer the restore to a microtask. React re-applies the pre-commit
      // active element during its commit's focus-restoration pass, which would
      // otherwise clobber a synchronous restore done here in the cleanup. Running
      // after the commit lets our restore win. If the trap re-activates before
      // the microtask fires, `activeRef` is `true` again and we skip.
      queueMicrotask(() => {
        if (activeRef.current) return;
        target.focus();
      });
    };
  }, [active, container, optionsRef]);

  return setRef;
}
