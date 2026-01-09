import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Options for useCopyToClipboard hook
 */
export interface UseCopyToClipboardOptions {
  /**
   * Time in milliseconds before the copied state resets to null.
   * Set to 0 to disable auto-reset.
   * @default 2000
   */
  timeout?: number;
  /**
   * Callback function called when copy succeeds
   * @param text - The text that was copied
   */
  onSuccess?: (text: string) => void;
  /**
   * Callback function called when copy fails
   * @param error - The error that occurred
   */
  onError?: (error: Error) => void;
}

/**
 * Type for the copy function
 */
export type CopyFn = (text: string) => Promise<boolean>;

/**
 * Return type for useCopyToClipboard hook
 * Tuple format: [copiedText, copy]
 */
export type UseCopyToClipboardReturn = [
  copiedText: string | null,
  copy: CopyFn
];

/**
 * Fallback copy function for browsers that don't support the Clipboard API
 * @param text - Text to copy to clipboard
 * @returns Whether the copy was successful
 */
function fallbackCopyToClipboard(text: string): boolean {
  // Check if we're in a browser environment
  if (typeof document === "undefined") {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;

  // Make the textarea invisible but still functional
  textarea.style.cssText =
    "position:fixed;left:-9999px;top:-9999px;opacity:0;pointer-events:none";
  textarea.setAttribute("readonly", "");
  textarea.setAttribute("aria-hidden", "true");

  document.body.appendChild(textarea);

  // Select the text
  textarea.focus();
  textarea.select();

  // For mobile devices
  textarea.setSelectionRange(0, text.length);

  let success = false;
  try {
    success = document.execCommand("copy");
  } catch {
    success = false;
  }

  document.body.removeChild(textarea);
  return success;
}

/**
 * Copies text to clipboard using the Clipboard API with fallback support.
 * Returns the copied text (or null if not copied) and a copy function.
 *
 * @param options - Configuration options for the hook
 * @returns Tuple of [copiedText, copy]
 *
 * @example
 * ```tsx
 * function CopyButton() {
 *   const [copiedText, copy] = useCopyToClipboard();
 *
 *   return (
 *     <button onClick={() => copy("Hello World")}>
 *       {copiedText ? "Copied!" : "Copy"}
 *     </button>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With custom timeout
 * const [copiedText, copy] = useCopyToClipboard({ timeout: 3000 });
 * ```
 *
 * @example
 * ```tsx
 * // With callbacks
 * const [copiedText, copy] = useCopyToClipboard({
 *   onSuccess: (text) => console.log(`Copied: ${text}`),
 *   onError: (error) => console.error(`Failed to copy: ${error.message}`),
 * });
 * ```
 *
 * @example
 * ```tsx
 * // Disable auto-reset
 * const [copiedText, copy] = useCopyToClipboard({ timeout: 0 });
 * ```
 */
export function useCopyToClipboard(
  options: UseCopyToClipboardOptions = {}
): UseCopyToClipboardReturn {
  const { timeout = 2000, onSuccess, onError } = options;

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  // Store callbacks in refs to avoid dependency issues
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const timeoutValueRef = useRef(timeout);

  // Update refs when options change
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;
  timeoutValueRef.current = timeout;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copy: CopyFn = useCallback(async (text: string): Promise<boolean> => {
    // Clear any existing timeout
    if (timeoutRef.current !== undefined) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }

    // Check for SSR
    if (typeof window === "undefined") {
      const error = new Error("Clipboard is not available in this environment");
      onErrorRef.current?.(error);
      return false;
    }

    try {
      // Try the modern Clipboard API first
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(text);
      } else {
        // Fall back to execCommand
        const success = fallbackCopyToClipboard(text);
        if (!success) {
          throw new Error("Failed to copy text using fallback method");
        }
      }

      // Success
      setCopiedText(text);
      onSuccessRef.current?.(text);

      // Set timeout for auto-reset if enabled
      if (timeoutValueRef.current > 0) {
        timeoutRef.current = setTimeout(() => {
          setCopiedText(null);
          timeoutRef.current = undefined;
        }, timeoutValueRef.current);
      }

      return true;
    } catch (err) {
      // Try fallback if Clipboard API failed
      try {
        const success = fallbackCopyToClipboard(text);
        if (success) {
          setCopiedText(text);
          onSuccessRef.current?.(text);

          if (timeoutValueRef.current > 0) {
            timeoutRef.current = setTimeout(() => {
              setCopiedText(null);
              timeoutRef.current = undefined;
            }, timeoutValueRef.current);
          }

          return true;
        }
      } catch {
        // Fallback also failed
      }

      // Both methods failed
      const error =
        err instanceof Error ? err : new Error("Failed to copy text to clipboard");
      setCopiedText(null);
      onErrorRef.current?.(error);
      return false;
    }
  }, []);

  return [copiedText, copy];
}
