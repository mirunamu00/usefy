import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { UseDisclosureOptions, UseDisclosureReturn } from "./types";
import { useCallbackRef } from "./utils";

/**
 * Manage a boolean "open" state with `open` / `close` / `toggle` handlers — the
 * ergonomic primitive for modals, drawers, popovers, dropdowns, and accordions.
 *
 * Returns a `[opened, handlers]` tuple (the Mantine shape). The handlers have
 * **stable identities**, so passing them to memoized children or listing them in
 * effect dependencies never causes extra work. Optional `onOpen` / `onClose`
 * callbacks fire only on a *real* transition (not when already in that state).
 *
 * @param initialState - Whether it starts open. Defaults to `false`.
 * @param options - Optional `{ onOpen, onClose }` transition callbacks.
 * @returns `[opened, { open, close, toggle }]`.
 *
 * @example
 * ```tsx
 * function Example() {
 *   const [opened, { open, close, toggle }] = useDisclosure(false);
 *
 *   return (
 *     <>
 *       <button onClick={open}>Open</button>
 *       <button onClick={toggle}>Toggle</button>
 *       {opened && (
 *         <div role="dialog">
 *           Modal content
 *           <button onClick={close}>Close</button>
 *         </div>
 *       )}
 *     </>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // React to transitions (analytics, focus management, …).
 * const [opened, handlers] = useDisclosure(false, {
 *   onOpen: () => trackEvent("drawer_opened"),
 *   onClose: () => trackEvent("drawer_closed"),
 * });
 * ```
 *
 * @remarks
 * `onOpen` / `onClose` are dispatched from the event handler after the state
 * change is requested — never from inside a `setState` updater — so they are
 * safe under React StrictMode / concurrent rendering and never double-fire.
 */
export function useDisclosure(
  initialState = false,
  options: UseDisclosureOptions = {}
): UseDisclosureReturn {
  const { onOpen, onClose } = options;

  const [opened, setOpened] = useState(initialState);

  // Mirror the committed state so the handlers can read the latest value
  // synchronously (and decide whether a transition actually happens) without
  // running side effects inside a setState updater.
  const openedRef = useRef(opened);
  useEffect(() => {
    openedRef.current = opened;
  }, [opened]);

  const handleOpen = useCallbackRef(onOpen);
  const handleClose = useCallbackRef(onClose);

  const open = useCallback(() => {
    if (!openedRef.current) {
      openedRef.current = true;
      setOpened(true);
      handleOpen();
    }
  }, [handleOpen]);

  const close = useCallback(() => {
    if (openedRef.current) {
      openedRef.current = false;
      setOpened(false);
      handleClose();
    }
  }, [handleClose]);

  const toggle = useCallback(() => {
    if (openedRef.current) {
      close();
    } else {
      open();
    }
  }, [open, close]);

  const handlers = useMemo(
    () => ({ open, close, toggle }),
    [open, close, toggle]
  );

  return [opened, handlers] as const;
}
