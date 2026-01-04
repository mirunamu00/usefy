import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Options for useInit hook
 */
export interface UseInitOptions {
  /**
   * Only run initialization when this condition is true
   * @default true
   */
  when?: boolean;
  /**
   * Number of retry attempts on failure
   * @default 0
   */
  retry?: number;
  /**
   * Delay between retry attempts in milliseconds
   * @default 1000
   */
  retryDelay?: number;
  /**
   * Timeout for initialization in milliseconds
   * @default undefined (no timeout)
   */
  timeout?: number;
}

/**
 * Result object returned by useInit hook
 */
export interface UseInitResult {
  /**
   * Whether initialization has completed successfully
   */
  isInitialized: boolean;
  /**
   * Whether initialization is currently in progress
   */
  isInitializing: boolean;
  /**
   * Error that occurred during initialization, if any
   */
  error: Error | null;
  /**
   * Manually trigger re-initialization (respects `when` condition)
   */
  reinitialize: () => void;
}

/**
 * Type for cleanup function returned by init callback
 */
type CleanupFn = () => void;

/**
 * Type for init callback function
 */
type InitCallback = () => void | CleanupFn | Promise<void | CleanupFn>;

/**
 * Custom error for timeout
 */
class InitTimeoutError extends Error {
  constructor(timeout: number) {
    super(`Initialization timed out after ${timeout}ms`);
    this.name = "InitTimeoutError";
  }
}

/**
 * A React hook for one-time initialization with async support, retry, timeout, and conditional execution.
 *
 * @param callback - The initialization function to run. Can be sync or async.
 *                   Can optionally return a cleanup function.
 * @param options - Configuration options for initialization
 * @returns Object containing initialization state and control functions
 *
 * @example
 * // Basic synchronous initialization
 * useInit(() => {
 *   console.log('Component initialized');
 * });
 *
 * @example
 * // With cleanup function
 * useInit(() => {
 *   const subscription = eventBus.subscribe();
 *   return () => subscription.unsubscribe();
 * });
 *
 * @example
 * // Async initialization with status tracking
 * const { isInitialized, isInitializing, error } = useInit(async () => {
 *   await loadConfiguration();
 * });
 *
 * @example
 * // Conditional initialization
 * useInit(() => {
 *   initializeAnalytics();
 * }, { when: isProduction });
 *
 * @example
 * // With retry and timeout
 * const { error, reinitialize } = useInit(async () => {
 *   await connectToServer();
 * }, {
 *   retry: 3,
 *   retryDelay: 1000,
 *   timeout: 5000
 * });
 */
export function useInit(
  callback: InitCallback,
  options: UseInitOptions = {}
): UseInitResult {
  const { when = true, retry = 0, retryDelay = 1000, timeout } = options;

  const [state, setState] = useState<{
    isInitialized: boolean;
    isInitializing: boolean;
    error: Error | null;
  }>({
    isInitialized: false,
    isInitializing: false,
    error: null,
  });

  const callbackRef = useRef<InitCallback>(callback);
  const cleanupRef = useRef<CleanupFn | null>(null);
  const hasInitializedRef = useRef(false);
  const mountedRef = useRef(true);
  const initializingRef = useRef(false);

  // Always update callback ref to latest version
  callbackRef.current = callback;

  const runInit = useCallback(async () => {
    // Prevent concurrent initializations
    if (initializingRef.current) {
      return;
    }

    initializingRef.current = true;

    // Clean up previous initialization if any
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    setState({
      isInitialized: false,
      isInitializing: true,
      error: null,
    });

    let lastError: Error | null = null;
    const maxAttempts = retry + 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (!mountedRef.current) {
        initializingRef.current = false;
        return;
      }

      try {
        let result: void | CleanupFn;

        if (timeout !== undefined) {
          // Race between callback and timeout
          let timeoutId: ReturnType<typeof setTimeout> | undefined;
          const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
              reject(new InitTimeoutError(timeout));
            }, timeout);
          });

          const callbackResult = callbackRef.current();

          if (callbackResult instanceof Promise) {
            try {
              result = await Promise.race([callbackResult, timeoutPromise]);
            } finally {
              if (timeoutId !== undefined) {
                clearTimeout(timeoutId);
              }
            }
          } else {
            if (timeoutId !== undefined) {
              clearTimeout(timeoutId);
            }
            result = callbackResult;
          }
        } else {
          const callbackResult = callbackRef.current();
          if (callbackResult instanceof Promise) {
            result = await callbackResult;
          } else {
            result = callbackResult;
          }
        }

        // Store cleanup function if returned
        if (typeof result === "function") {
          cleanupRef.current = result;
        }

        if (mountedRef.current) {
          hasInitializedRef.current = true;
          setState({
            isInitialized: true,
            isInitializing: false,
            error: null,
          });
        }

        initializingRef.current = false;
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        // If not the last attempt and still mounted, wait before retrying
        if (attempt < maxAttempts - 1 && mountedRef.current) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }

    // All attempts failed
    if (mountedRef.current) {
      setState({
        isInitialized: false,
        isInitializing: false,
        error: lastError,
      });
    }

    initializingRef.current = false;
  }, [retry, retryDelay, timeout]);

  const reinitialize = useCallback(() => {
    if (!when) {
      return;
    }
    runInit();
  }, [when, runInit]);

  // Track when condition changes from false to true
  const prevWhenRef = useRef(when);
  const hasRunOnceRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    // Run initialization if:
    // 1. `when` is true AND
    // 2. Never successfully initialized AND
    // 3. Either first run OR `when` just changed from false to true
    const whenJustBecameTrue = !prevWhenRef.current && when;
    const shouldInit =
      when &&
      !hasInitializedRef.current &&
      (!hasRunOnceRef.current || whenJustBecameTrue);

    prevWhenRef.current = when;

    if (shouldInit) {
      hasRunOnceRef.current = true;
      runInit();
    }

    return () => {
      mountedRef.current = false;
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [when, runInit]);

  return {
    isInitialized: state.isInitialized,
    isInitializing: state.isInitializing,
    error: state.error,
    reinitialize,
  };
}
