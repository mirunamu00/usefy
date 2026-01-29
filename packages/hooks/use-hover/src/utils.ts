import type { HoverDelayConfig } from "./types";

/**
 * Check if hover detection is supported in the current environment.
 * Returns false in SSR environments where window/document are not available.
 *
 * @returns true if running in a browser environment with DOM support
 *
 * @example
 * ```tsx
 * if (isHoverSupported()) {
 *   // Safe to attach event listeners
 * }
 * ```
 */
export function isHoverSupported(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/**
 * Normalized delay values for enter and leave events.
 */
export interface NormalizedDelay {
  /**
   * Delay in milliseconds before hover state becomes true
   */
  enterDelay: number;
  /**
   * Delay in milliseconds before hover state becomes false
   */
  leaveDelay: number;
}

/**
 * Normalize delay configuration to separate enter/leave values.
 * Handles both number and object formats, ensuring non-negative values.
 *
 * @param delay - The delay configuration (number or object)
 * @returns Normalized delay object with enterDelay and leaveDelay
 *
 * @example
 * ```tsx
 * // Number input
 * normalizeDelay(200) // { enterDelay: 200, leaveDelay: 200 }
 *
 * // Object input
 * normalizeDelay({ enter: 100, leave: 500 }) // { enterDelay: 100, leaveDelay: 500 }
 *
 * // Partial object
 * normalizeDelay({ enter: 100 }) // { enterDelay: 100, leaveDelay: 0 }
 *
 * // Negative values become 0
 * normalizeDelay(-100) // { enterDelay: 0, leaveDelay: 0 }
 * ```
 */
export function normalizeDelay(delay: HoverDelayConfig = 0): NormalizedDelay {
  if (typeof delay === "number") {
    const normalizedValue = Math.max(0, delay);
    return {
      enterDelay: normalizedValue,
      leaveDelay: normalizedValue,
    };
  }

  return {
    enterDelay: Math.max(0, delay.enter ?? 0),
    leaveDelay: Math.max(0, delay.leave ?? 0),
  };
}

/**
 * Create a no-op ref callback for SSR environments or disabled state.
 *
 * @returns A function that does nothing when called
 *
 * @example
 * ```tsx
 * const ref = isSSR ? createNoopRef() : actualRef;
 * ```
 */
export function createNoopRef<T>(): (node: T | null) => void {
  return () => {};
}
