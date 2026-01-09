import { useEffect, useRef } from "react";

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
   * Whether to use passive event listener
   * @default true
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
  const { enabled = true, capture = false, passive = true } = options;

  // Store handler in ref to avoid re-registering event listener
  const handlerRef = useRef<ClickAnyWhereHandler>(handler);

  // Update ref when handler changes
  handlerRef.current = handler;

  useEffect(() => {
    // SSR check
    if (typeof document === "undefined") {
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

    // Add event listener
    document.addEventListener("click", internalHandler, { capture, passive });

    // Cleanup
    return () => {
      document.removeEventListener("click", internalHandler, { capture });
    };
  }, [enabled, capture, passive]);
}
