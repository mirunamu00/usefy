import { useEffect, useCallback, useRef } from "react";
import { isSSR } from "../utils/environment";

/**
 * Parse a keyboard shortcut string into its components
 *
 * @param shortcut - Shortcut string like "ctrl+shift+m"
 * @returns Object with modifier keys and the main key
 */
function parseShortcut(shortcut: string): {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  key: string;
} {
  const parts = shortcut.toLowerCase().split("+");
  const key = parts.pop() || "";
  const modifiers = new Set(parts);

  return {
    ctrl: modifiers.has("ctrl") || modifiers.has("control"),
    shift: modifiers.has("shift"),
    alt: modifiers.has("alt"),
    meta: modifiers.has("meta") || modifiers.has("cmd") || modifiers.has("command"),
    key,
  };
}

/**
 * Hook to handle keyboard shortcuts
 *
 * @param shortcut - Keyboard shortcut string (e.g., "ctrl+shift+m")
 * @param callback - Function to call when shortcut is pressed
 * @param enabled - Whether the shortcut is enabled
 *
 * @example
 * ```tsx
 * useKeyboardShortcut("ctrl+shift+m", () => {
 *   setOpen(prev => !prev);
 * });
 * ```
 */
export function useKeyboardShortcut(
  shortcut: string,
  callback: () => void,
  enabled = true
): void {
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const parsed = parseShortcut(shortcut);

      // Check if all modifiers match
      const ctrlMatch = parsed.ctrl === (event.ctrlKey || event.metaKey);
      const shiftMatch = parsed.shift === event.shiftKey;
      const altMatch = parsed.alt === event.altKey;
      const keyMatch = event.key.toLowerCase() === parsed.key;

      if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
        event.preventDefault();
        event.stopPropagation();
        callbackRef.current();
      }
    },
    [shortcut]
  );

  useEffect(() => {
    if (isSSR() || !enabled) {
      return;
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

/**
 * Hook to handle Escape key press
 *
 * @param callback - Function to call when Escape is pressed
 * @param enabled - Whether the handler is enabled
 */
export function useEscapeKey(callback: () => void, enabled = true): void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (isSSR() || !enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        callbackRef.current();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled]);
}
