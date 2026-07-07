import { useEffect, useRef } from "react";
import { isDocumentAvailable } from "./utils";

/**
 * Options for useClickAnyWhere hook
 */
export interface UseClickAnyWhereOptions {
  /**
   * Whether the event listener is enabled
   * @default true
   */
  enabled?: boolean;
  /**
   * Whether to use event capture phase
   * @default false
   */
  capture?: boolean;
  /**
   * Whether to use a passive event listener.
   *
   * A passive listener cannot call `event.preventDefault()`. This offers no
   * performance benefit for `click` events, so it is left unset by default and
   * the browser default (non-passive) applies. Only pass this if you
   * specifically need passive semantics.
   *
   * @default undefined (browser default — non-passive)
   */
  passive?: boolean;
}

/**
 * Handler type for click events
 */
export type ClickAnyWhereHandler = (event: MouseEvent) => void;

/**
 * Detects document-wide click events and calls the provided handler.
 * Useful for closing dropdowns, modals, or any component when clicking outside.
 *
 * @param handler - Callback function called when a click is detected anywhere on the document
 * @param options - Configuration options for the event listener
 *
 * @example
 * ```tsx
 * function ClickTracker() {
 *   const [lastClick, setLastClick] = useState({ x: 0, y: 0 });
 *
 *   useClickAnyWhere((event) => {
 *     setLastClick({ x: event.clientX, y: event.clientY });
 *   });
 *
 *   return (
 *     <div>
 *       Last click: ({lastClick.x}, {lastClick.y})
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Conditional activation
 * function Dropdown({ isOpen, onClose }) {
 *   useClickAnyWhere(
 *     () => onClose(),
 *     { enabled: isOpen }
 *   );
 *
 *   return isOpen ? <div>Dropdown content</div> : null;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With capture phase
 * useClickAnyWhere(handleClick, { capture: true });
 * ```
 */
export function useClickAnyWhere(
  handler: ClickAnyWhereHandler,
  options: UseClickAnyWhereOptions = {}
): void {
  const { enabled = true, capture = false, passive } = options;

  // Store handler in ref to avoid re-registering event listener
  const handlerRef = useRef<ClickAnyWhereHandler>(handler);

  // Update ref when handler changes
  handlerRef.current = handler;

  useEffect(() => {
    // SSR check — skip attaching listeners when there is no document
    if (!isDocumentAvailable()) {
      return;
    }

    // Don't add listener if disabled
    if (!enabled) {
      return;
    }

    // Internal handler that calls the latest handler ref
    const internalHandler = (event: MouseEvent) => {
      handlerRef.current(event);
    };

    // Build event listener options. Only set `passive` when explicitly
    // provided so the browser default (non-passive) applies otherwise —
    // forcing passive would silently break event.preventDefault().
    const eventOptions: AddEventListenerOptions = { capture };
    if (passive !== undefined) {
      eventOptions.passive = passive;
    }

    // Add event listener
    document.addEventListener("click", internalHandler, eventOptions);

    // Cleanup
    return () => {
      document.removeEventListener("click", internalHandler, { capture });
    };
  }, [enabled, capture, passive]);
}
