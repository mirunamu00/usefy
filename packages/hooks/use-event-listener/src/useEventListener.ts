import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

// SSR-safe layout effect: sync the stored handler before paint on the client,
// fall back to useEffect on the server (mirrors the house useEventCallback).
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Options for useEventListener hook
 */
export interface UseEventListenerOptions {
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
   * Whether to use passive event listener for performance optimization
   * Useful for scroll/touch events
   * @default undefined (browser default)
   */
  passive?: boolean;

  /**
   * Whether the handler should be invoked only once and then removed
   * @default false
   */
  once?: boolean;
}

/**
 * Supported event target types
 */
export type EventTargetType<T extends HTMLElement = HTMLElement> =
  | Window
  | Document
  | HTMLElement
  | RefObject<T | null>
  | null
  | undefined;

/**
 * Check if target is a RefObject
 *
 * @internal Exported for unit testing only — not re-exported from the package
 * entry, so it stays out of the public API.
 */
export function isRefObject<T extends HTMLElement>(
  target: EventTargetType<T>
): target is RefObject<T | null> {
  return (
    target !== null &&
    target !== undefined &&
    typeof target === "object" &&
    "current" in target
  );
}

/**
 * Extract actual DOM element from target.
 *
 * Returns `null` when there is no element to attach to — an explicit `null`
 * target, a `RefObject` that hasn't populated yet, or a server environment with
 * no `window` (SSR).
 *
 * @internal Exported for unit testing only — not re-exported from the package
 * entry, so it stays out of the public API.
 */
export function getTargetElement<T extends HTMLElement>(
  target: EventTargetType<T>
): Window | Document | HTMLElement | null {
  // Default to window if target is undefined (not provided)
  if (target === undefined) {
    return typeof window !== "undefined" ? window : null;
  }

  // If null is passed, return null (no listener)
  if (target === null) {
    return null;
  }

  // Extract element from RefObject
  if (isRefObject(target)) {
    return target.current;
  }

  return target;
}

// Overload 1: Window events (default when element is omitted or Window)
/**
 * Adds an event listener to the window (default) or specified element.
 *
 * @param eventName - The event type to listen for
 * @param handler - The callback function called when the event fires
 * @param element - The target element (defaults to window)
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * // Window resize event
 * useEventListener("resize", (e) => {
 *   console.log("Window resized:", window.innerWidth);
 * });
 * ```
 */
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: Window | null,
  options?: UseEventListenerOptions
): void;

// Overload 2: Document events
/**
 * Adds an event listener to the document.
 *
 * @example
 * ```tsx
 * // Document keydown event
 * useEventListener("keydown", (e) => {
 *   console.log("Key pressed:", e.key);
 * }, document);
 * ```
 */
export function useEventListener<K extends keyof DocumentEventMap>(
  eventName: K,
  handler: (event: DocumentEventMap[K]) => void,
  element: Document,
  options?: UseEventListenerOptions
): void;

// Overload 3: HTMLElement events
/**
 * Adds an event listener to an HTMLElement.
 *
 * @example
 * ```tsx
 * // HTMLElement click event
 * const button = document.getElementById("myButton");
 * useEventListener("click", (e) => {
 *   console.log("Button clicked");
 * }, button);
 * ```
 */
export function useEventListener<K extends keyof HTMLElementEventMap>(
  eventName: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  element: HTMLElement | null,
  options?: UseEventListenerOptions
): void;

// Overload 4: RefObject<HTMLElement>
/**
 * Adds an event listener to an element referenced by a RefObject.
 *
 * @example
 * ```tsx
 * // RefObject event
 * const ref = useRef<HTMLDivElement>(null);
 * useEventListener("scroll", (e) => {
 *   console.log("Element scrolled");
 * }, ref);
 * ```
 */
export function useEventListener<
  K extends keyof HTMLElementEventMap,
  T extends HTMLElement
>(
  eventName: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  element: RefObject<T | null>,
  options?: UseEventListenerOptions
): void;

// Overload 5: Custom events (fallback for non-standard events)
/**
 * Adds an event listener for custom events.
 *
 * @example
 * ```tsx
 * // Custom event
 * useEventListener("myCustomEvent", (e) => {
 *   console.log("Custom event fired");
 * }, document);
 * ```
 */
export function useEventListener(
  eventName: string,
  handler: (event: Event) => void,
  element?: EventTargetType,
  options?: UseEventListenerOptions
): void;

/**
 * A React hook for adding event listeners to DOM elements with automatic cleanup.
 * Supports window, document, HTMLElement, and RefObject targets.
 *
 * Features:
 * - Type-safe event handling with TypeScript inference
 * - Automatic cleanup on unmount
 * - Handler stability (no re-registration on handler change)
 * - Late-mount aware: a `RefObject` target that populates after the initial
 *   render (conditional/late mount) or changes on a remount is subscribed as
 *   soon as its element appears
 * - SSR compatible
 *
 * @param eventName - The event type to listen for
 * @param handler - The callback function called when the event fires
 * @param element - The target element (defaults to window)
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * // Window resize event (default target)
 * useEventListener("resize", (e) => {
 *   console.log("Window resized:", window.innerWidth);
 * });
 *
 * // Document keydown event
 * useEventListener("keydown", (e) => {
 *   if (e.key === "Escape") closeModal();
 * }, document);
 *
 * // Element click event with ref
 * const buttonRef = useRef<HTMLButtonElement>(null);
 * useEventListener("click", handleClick, buttonRef);
 *
 * // With options
 * useEventListener("scroll", handleScroll, window, {
 *   passive: true,
 *   capture: false,
 * });
 *
 * // Conditional activation
 * useEventListener("mousemove", handleMouseMove, document, {
 *   enabled: isTracking,
 * });
 * ```
 */
export function useEventListener(
  eventName: string,
  handler: (event: Event) => void,
  element?: EventTargetType,
  options: UseEventListenerOptions = {}
): void {
  const { enabled = true, capture = false, passive, once = false } = options;

  // Store handler in ref to avoid re-registering event listeners
  const handlerRef = useRef(handler);

  // Sync the latest handler in a layout effect (not during render) so we never
  // mutate a ref while rendering — a render may be thrown away under concurrent
  // rendering / StrictMode. This mirrors the house useEventCallback pattern.
  useIsomorphicLayoutEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  // Resolve the target to a concrete element on every render and depend on the
  // *resolved element* below (not the raw `element` arg). A RefObject's identity
  // is stable, so depending on the ref itself would never re-run the effect when
  // `ref.current` populates after mount (late/conditional mount) or changes on a
  // remount — the listener would silently never attach. Depending on the
  // resolved element re-subscribes as soon as it flips null -> element.
  const targetElement = getTargetElement(element);

  useEffect(() => {
    // Don't add listener if disabled
    if (!enabled) {
      return;
    }

    // Don't add listener if there is no element (null target / unpopulated ref /
    // SSR). getTargetElement already collapses all of these to null.
    if (!targetElement) {
      return;
    }

    // Internal handler that calls the ref (always latest handler)
    const internalHandler = (event: Event) => {
      handlerRef.current(event);
    };

    // Build event listener options
    const eventOptions: AddEventListenerOptions = {
      capture,
      once,
    };

    // Only set passive if explicitly provided (respect browser defaults)
    if (passive !== undefined) {
      eventOptions.passive = passive;
    }

    // Add event listener
    targetElement.addEventListener(eventName, internalHandler, eventOptions);

    // Cleanup
    return () => {
      targetElement.removeEventListener(eventName, internalHandler, {
        capture,
      });
    };
  }, [eventName, targetElement, enabled, capture, passive, once]);
}
