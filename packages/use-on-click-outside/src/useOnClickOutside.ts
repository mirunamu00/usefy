import { useEffect, useRef } from "react";

/**
 * Event types for click outside detection (mouse + touch)
 */
export type ClickOutsideEvent = MouseEvent | TouchEvent;

/**
 * Handler function type for click outside events
 */
export type OnClickOutsideHandler = (event: ClickOutsideEvent) => void;

/**
 * Mouse event type options
 */
export type MouseEventType =
  | "mousedown"
  | "mouseup"
  | "click"
  | "pointerdown"
  | "pointerup";

/**
 * Touch event type options
 */
export type TouchEventType = "touchstart" | "touchend";

/**
 * Ref target type - supports single ref or array of refs
 * Array accepts mixed element types (e.g., [buttonRef, divRef])
 */
export type RefTarget<T extends HTMLElement = HTMLElement> =
  | React.RefObject<T | null>
  | Array<React.RefObject<HTMLElement | null>>;

/**
 * Options for useOnClickOutside hook
 */
export interface UseOnClickOutsideOptions {
  /**
   * Whether the event listener is enabled
   * @default true
   */
  enabled?: boolean;

  /**
   * Whether to use event capture phase.
   * When true, the handler is called before the event reaches the target element,
   * making it immune to stopPropagation calls.
   * @default true
   */
  capture?: boolean;

  /**
   * Mouse event type to listen for
   * @default 'mousedown'
   */
  eventType?: MouseEventType;

  /**
   * Touch event type to listen for
   * @default 'touchstart'
   */
  touchEventType?: TouchEventType;

  /**
   * Whether to detect touch events (for mobile support)
   * @default true
   */
  detectTouch?: boolean;

  /**
   * Array of refs to exclude from outside click detection.
   * Clicks on these elements will not trigger the handler.
   */
  excludeRefs?: Array<React.RefObject<HTMLElement | null>>;

  /**
   * Custom function to determine if a target should be excluded.
   * Return true to ignore clicks on the target element.
   * @param target - The clicked element
   * @returns Whether to exclude this element from triggering the handler
   */
  shouldExclude?: (target: Node) => boolean;

  /**
   * The event target to attach listeners to
   * @default document
   */
  eventTarget?: Document | HTMLElement | Window | null;
}

/**
 * Normalizes ref input to always return an array of refs
 */
function normalizeRefs<T extends HTMLElement>(
  ref: RefTarget<T>
): Array<React.RefObject<HTMLElement | null>> {
  return Array.isArray(ref) ? ref : [ref];
}

/**
 * Checks if a click event occurred outside of all specified elements
 */
function isClickOutside(
  event: ClickOutsideEvent,
  refs: Array<React.RefObject<HTMLElement | null>>,
  excludeRefs: Array<React.RefObject<HTMLElement | null>>,
  shouldExclude?: (target: Node) => boolean
): boolean {
  const target = event.target as Node;

  // Check if target exists in DOM
  if (!target || !target.isConnected) {
    return false;
  }

  // Check custom exclude function
  if (shouldExclude?.(target)) {
    return false;
  }

  // Check exclude refs
  for (const excludeRef of excludeRefs) {
    if (excludeRef.current?.contains(target)) {
      return false;
    }
  }

  // Check target refs - if clicked inside any of them, it's not an outside click
  for (const ref of refs) {
    if (ref.current?.contains(target)) {
      return false;
    }
  }

  return true;
}

/**
 * Detects clicks outside of specified element(s) and calls the provided handler.
 * Useful for closing modals, dropdowns, popovers, and similar UI components.
 *
 * @param ref - Single ref or array of refs to detect outside clicks for
 * @param handler - Callback function called when a click outside is detected
 * @param options - Configuration options for the event listener
 *
 * @example
 * ```tsx
 * // Basic usage - close modal on outside click
 * function Modal({ isOpen, onClose }) {
 *   const modalRef = useRef<HTMLDivElement>(null);
 *
 *   useOnClickOutside(modalRef, () => onClose(), { enabled: isOpen });
 *
 *   if (!isOpen) return null;
 *
 *   return (
 *     <div className="overlay">
 *       <div ref={modalRef} className="modal">
 *         Modal content
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Multiple refs - button and dropdown menu
 * function Dropdown() {
 *   const [isOpen, setIsOpen] = useState(false);
 *   const buttonRef = useRef<HTMLButtonElement>(null);
 *   const menuRef = useRef<HTMLDivElement>(null);
 *
 *   useOnClickOutside(
 *     [buttonRef, menuRef],
 *     () => setIsOpen(false),
 *     { enabled: isOpen }
 *   );
 *
 *   return (
 *     <>
 *       <button ref={buttonRef} onClick={() => setIsOpen(!isOpen)}>
 *         Toggle
 *       </button>
 *       {isOpen && (
 *         <div ref={menuRef}>Dropdown content</div>
 *       )}
 *     </>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With exclude refs - ignore specific elements
 * function ModalWithPortal({ isOpen, onClose }) {
 *   const modalRef = useRef<HTMLDivElement>(null);
 *   const toastRef = useRef<HTMLDivElement>(null);
 *
 *   useOnClickOutside(modalRef, onClose, {
 *     enabled: isOpen,
 *     excludeRefs: [toastRef], // Clicks on toast won't close modal
 *   });
 *
 *   return (
 *     <>
 *       {isOpen && <div ref={modalRef}>Modal</div>}
 *       <div ref={toastRef}>Toast notification</div>
 *     </>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With custom exclude function
 * useOnClickOutside(ref, handleClose, {
 *   shouldExclude: (target) => {
 *     // Ignore clicks on elements with specific class
 *     return (target as Element).closest?.('.ignore-outside-click') !== null;
 *   },
 * });
 * ```
 */
export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefTarget<T>,
  handler: OnClickOutsideHandler,
  options: UseOnClickOutsideOptions = {}
): void {
  const {
    enabled = true,
    capture = true,
    eventType = "mousedown",
    touchEventType = "touchstart",
    detectTouch = true,
    excludeRefs = [],
    shouldExclude,
    eventTarget,
  } = options;

  // Store handler in ref to avoid re-registering event listeners
  const handlerRef = useRef<OnClickOutsideHandler>(handler);

  // Store shouldExclude in ref to avoid re-registering event listeners
  const shouldExcludeRef = useRef(shouldExclude);

  // Store excludeRefs in ref to avoid re-registering event listeners
  const excludeRefsRef = useRef(excludeRefs);

  // Store ref in a ref to avoid re-registering when array is passed inline
  const refRef = useRef(ref);

  // Update refs when values change
  handlerRef.current = handler;
  shouldExcludeRef.current = shouldExclude;
  excludeRefsRef.current = excludeRefs;
  refRef.current = ref;

  useEffect(() => {
    // SSR check
    if (typeof document === "undefined") {
      return;
    }

    // Don't add listener if disabled
    if (!enabled) {
      return;
    }

    // Normalize refs to array (use refRef.current to get latest value)
    const normalizedRefs = normalizeRefs(refRef.current);

    // Get the event target (default to document)
    const target = eventTarget ?? document;

    // Internal handler for mouse events
    const handleMouseEvent = (event: Event) => {
      if (
        isClickOutside(
          event as MouseEvent,
          normalizedRefs,
          excludeRefsRef.current,
          shouldExcludeRef.current
        )
      ) {
        handlerRef.current(event as MouseEvent);
      }
    };

    // Internal handler for touch events
    const handleTouchEvent = (event: Event) => {
      if (
        isClickOutside(
          event as TouchEvent,
          normalizedRefs,
          excludeRefsRef.current,
          shouldExcludeRef.current
        )
      ) {
        handlerRef.current(event as TouchEvent);
      }
    };

    // Add event listeners
    target.addEventListener(eventType, handleMouseEvent, { capture });

    if (detectTouch) {
      target.addEventListener(touchEventType, handleTouchEvent, { capture });
    }

    // Cleanup
    return () => {
      target.removeEventListener(eventType, handleMouseEvent, { capture });

      if (detectTouch) {
        target.removeEventListener(touchEventType, handleTouchEvent, {
          capture,
        });
      }
    };
  }, [enabled, capture, eventType, touchEventType, detectTouch, eventTarget]);
}
