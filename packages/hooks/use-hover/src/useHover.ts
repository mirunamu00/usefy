import { useCallback, useEffect, useRef, useState } from "react";
import type {
  UseHoverOptions,
  UseHoverReturn,
  OnHoverChangeCallback,
} from "./types";
import { isHoverSupported, normalizeDelay, createNoopRef } from "./utils";

/**
 * A React hook for detecting hover state on elements.
 *
 * Features:
 * - Efficient mouseenter/mouseleave detection
 * - Configurable enter/leave delays (useful for tooltips and dropdowns)
 * - Dynamic enable/disable support
 * - SSR compatible with graceful degradation
 * - TypeScript support with full type inference
 * - Optional touch event support for hybrid devices
 * - Both object and tuple destructuring support
 *
 * @template T - The type of HTML element the ref will be attached to
 * @param options - Configuration options for the hook
 * @returns Object containing ref callback and isHovered boolean (also iterable as tuple)
 *
 * @example
 * ```tsx
 * // Basic usage
 * function Component() {
 *   const { ref, isHovered } = useHover<HTMLDivElement>();
 *   return (
 *     <div ref={ref} style={{ background: isHovered ? 'lightblue' : 'white' }}>
 *       {isHovered ? 'Hovering!' : 'Hover me'}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Tuple destructuring (alternative API)
 * function Component() {
 *   const [ref, isHovered] = useHover<HTMLDivElement>();
 *   return <div ref={ref}>{isHovered ? 'Hovering!' : 'Hover me'}</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With delay - useful for tooltips
 * function Tooltip() {
 *   const { ref, isHovered } = useHover<HTMLButtonElement>({
 *     delay: { enter: 500, leave: 100 }
 *   });
 *   return (
 *     <button ref={ref}>
 *       Hover me
 *       {isHovered && <span className="tooltip">Tooltip content</span>}
 *     </button>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With onChange callback
 * function TrackedElement() {
 *   const { ref, isHovered } = useHover<HTMLDivElement>({
 *     onChange: (hovered, event) => {
 *       console.log('Hover state:', hovered);
 *       if (event) {
 *         console.log('Event position:', event.clientX, event.clientY);
 *       }
 *     }
 *   });
 *   return <div ref={ref}>Tracked element</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Conditional enabling
 * function ConditionalHover({ isActive }: { isActive: boolean }) {
 *   const { ref, isHovered } = useHover<HTMLDivElement>({
 *     enabled: isActive
 *   });
 *   return <div ref={ref}>{isHovered ? 'Active & Hovered' : 'Hover me'}</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With touch support for mobile devices
 * function MobileTooltip() {
 *   const { ref, isHovered } = useHover<HTMLButtonElement>({
 *     detectTouch: true,
 *     delay: { enter: 0, leave: 1500 }
 *   });
 *   return (
 *     <button ref={ref}>
 *       {isHovered ? 'Tapped/Hovered!' : 'Tap or hover'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useHover<T extends Element = HTMLElement>(
  options: UseHoverOptions = {}
): UseHoverReturn<T> {
  const {
    enabled = true,
    delay = 0,
    onChange,
    initialHovered = false,
    detectTouch = false,
  } = options;

  // ============ SSR Check ============
  const isSupported = isHoverSupported();

  // ============ Refs for internal state (no re-renders) ============
  const targetRef = useRef<T | null>(null);
  const enterDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Store callbacks in refs to avoid effect dependencies
  const onChangeRef = useRef<OnHoverChangeCallback | undefined>(onChange);
  onChangeRef.current = onChange;

  // Force re-render trigger for ref changes
  const [, forceUpdate] = useState({});

  // ============ State ============
  const [isHovered, setIsHovered] = useState<boolean>(initialHovered);

  // ============ Normalize delay values ============
  const { enterDelay, leaveDelay } = normalizeDelay(delay);

  // ============ Clear timeouts helper ============
  const clearTimeouts = useCallback(() => {
    if (enterDelayRef.current !== null) {
      clearTimeout(enterDelayRef.current);
      enterDelayRef.current = null;
    }
    if (leaveDelayRef.current !== null) {
      clearTimeout(leaveDelayRef.current);
      leaveDelayRef.current = null;
    }
  }, []);

  // ============ Event Handlers ============
  const handleMouseEnter = useCallback(
    (event: MouseEvent | TouchEvent) => {
      clearTimeouts();

      if (enterDelay > 0) {
        enterDelayRef.current = setTimeout(() => {
          setIsHovered(true);
          onChangeRef.current?.(true, event);
          enterDelayRef.current = null;
        }, enterDelay);
      } else {
        setIsHovered(true);
        onChangeRef.current?.(true, event);
      }
    },
    [enterDelay, clearTimeouts]
  );

  const handleMouseLeave = useCallback(
    (event: MouseEvent | TouchEvent) => {
      clearTimeouts();

      if (leaveDelay > 0) {
        leaveDelayRef.current = setTimeout(() => {
          setIsHovered(false);
          onChangeRef.current?.(false, event);
          leaveDelayRef.current = null;
        }, leaveDelay);
      } else {
        setIsHovered(false);
        onChangeRef.current?.(false, event);
      }
    },
    [leaveDelay, clearTimeouts]
  );

  // ============ Ref Callback ============
  const setRef = useCallback((node: T | null) => {
    const prevTarget = targetRef.current;
    targetRef.current = node;

    if (prevTarget !== node) {
      forceUpdate({});
    }
  }, []);

  // ============ Effect: Manage Event Listeners ============
  useEffect(() => {
    // SSR guard
    if (!isSupported) {
      return;
    }

    // Don't attach if disabled
    if (!enabled) {
      // Reset hover state when disabled
      setIsHovered(false);
      clearTimeouts();
      return;
    }

    // Don't attach if no target
    const target = targetRef.current;
    if (!target) {
      return;
    }

    // Add event listeners
    target.addEventListener("mouseenter", handleMouseEnter as EventListener);
    target.addEventListener("mouseleave", handleMouseLeave as EventListener);

    // Optional touch events for hybrid devices
    if (detectTouch) {
      target.addEventListener(
        "touchstart",
        handleMouseEnter as EventListener,
        { passive: true }
      );
      target.addEventListener("touchend", handleMouseLeave as EventListener, {
        passive: true,
      });
    }

    // Cleanup
    return () => {
      clearTimeouts();
      target.removeEventListener(
        "mouseenter",
        handleMouseEnter as EventListener
      );
      target.removeEventListener(
        "mouseleave",
        handleMouseLeave as EventListener
      );

      if (detectTouch) {
        target.removeEventListener(
          "touchstart",
          handleMouseEnter as EventListener
        );
        target.removeEventListener(
          "touchend",
          handleMouseLeave as EventListener
        );
      }
    };
  }, [
    enabled,
    isSupported,
    handleMouseEnter,
    handleMouseLeave,
    detectTouch,
    clearTimeouts,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    targetRef.current,
  ]);

  // ============ Cleanup on unmount ============
  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  // ============ SSR Return ============
  if (!isSupported) {
    const ssrResult: UseHoverReturn<T> = {
      ref: createNoopRef<T>(),
      isHovered: initialHovered,
      [Symbol.iterator]: function* () {
        yield this.ref;
        yield this.isHovered;
      },
    };
    return ssrResult;
  }

  // ============ Return with iterator support ============
  const result: UseHoverReturn<T> = {
    ref: setRef,
    isHovered,
    [Symbol.iterator]: function* () {
      yield this.ref;
      yield this.isHovered;
    },
  };

  return result;
}
