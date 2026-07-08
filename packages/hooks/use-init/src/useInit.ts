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
 * A function returned by an init callback that releases whatever the
 * initialization set up. Invoked on unmount and before re-initialization.
 */
export type CleanupFn = () => void;

/**
 * The initialization callback passed to {@link useInit}. It may be synchronous
 * or asynchronous and may optionally return a {@link CleanupFn}.
 */
export type InitCallback = () => void | CleanupFn | Promise<void | CleanupFn>;

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
    // Seed as pending when initialization is going to run, so the first commit
    // does not flash "not started" before the effect flips it to initializing.
    // `when` is a deterministic prop, so this stays SSR-safe.
    isInitializing: when,
    error: null,
  });

  const callbackRef = useRef<InitCallback>(callback);
  const cleanupRef = useRef<CleanupFn | null>(null);
  const hasInitializedRef = useRef(false);
  const mountedRef = useRef(true);
  const initializingRef = useRef(false);

  // Latest-value refs so `runInit` / `reinitialize` can stay identity-stable
  // (empty dependency arrays) while still reading the current props.
  const whenRef = useRef(when);
  const retryRef = useRef(retry);
  const retryDelayRef = useRef(retryDelay);
  const timeoutRef = useRef(timeout);

  // Concurrent-safe latest-ref pattern: mutate refs in an effect, never during
  // render. Runs on every commit so the values are always current.
  useEffect(() => {
    callbackRef.current = callback;
    whenRef.current = when;
    retryRef.current = retry;
    retryDelayRef.current = retryDelay;
    timeoutRef.current = timeout;
  });

  // Invoke the stored cleanup exactly once, swallowing any error so a throwing
  // cleanup can never wedge the hook or crash an unmount.
  const runCleanup = useCallback(() => {
    const cleanup = cleanupRef.current;
    cleanupRef.current = null;
    if (cleanup) {
      try {
        cleanup();
      } catch {
        // Intentionally swallow: a failed cleanup must not brick the hook.
      }
    }
  }, []);

  const runInit = useCallback(async () => {
    // Prevent concurrent initializations
    if (initializingRef.current) {
      return;
    }

    initializingRef.current = true;

    try {
      // Clean up previous initialization if any
      runCleanup();

      setState({
        isInitialized: false,
        isInitializing: true,
        error: null,
      });

      const retryCount = retryRef.current;
      const delay = retryDelayRef.current;
      const timeoutMs = timeoutRef.current;

      let lastError: Error | null = null;
      const maxAttempts = retryCount + 1;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (!mountedRef.current) {
          return;
        }

        try {
          let result: void | CleanupFn;

          if (timeoutMs !== undefined) {
            // Race between callback and timeout
            let timeoutId: ReturnType<typeof setTimeout> | undefined;
            const timeoutPromise = new Promise<never>((_, reject) => {
              timeoutId = setTimeout(() => {
                reject(new InitTimeoutError(timeoutMs));
              }, timeoutMs);
            });

            const callbackResult = callbackRef.current();

            if (callbackResult instanceof Promise) {
              // If the callback loses the race but later resolves with a
              // cleanup function, that resource would otherwise be orphaned.
              // Release it as soon as it arrives.
              let abandoned = false;
              callbackResult
                .then((late) => {
                  if (abandoned && typeof late === "function") {
                    try {
                      (late as CleanupFn)();
                    } catch {
                      // Swallow: best-effort release of an orphaned resource.
                    }
                  }
                })
                .catch(() => {
                  // Swallow: the abandoned callback's own rejection is moot.
                });

              try {
                result = await Promise.race([callbackResult, timeoutPromise]);
              } catch (raceErr) {
                abandoned = true;
                throw raceErr;
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
            if (mountedRef.current) {
              cleanupRef.current = result as CleanupFn;
            } else {
              // Unmounted before completion: release immediately so the
              // resource is not leaked (the unmount cleanup already ran).
              try {
                (result as CleanupFn)();
              } catch {
                // Swallow: best-effort release.
              }
            }
          }

          if (mountedRef.current) {
            hasInitializedRef.current = true;
            setState({
              isInitialized: true,
              isInitializing: false,
              error: null,
            });
          }

          return;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));

          // If not the last attempt and still mounted, wait before retrying
          if (attempt < maxAttempts - 1 && mountedRef.current) {
            await new Promise((resolve) => setTimeout(resolve, delay));
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
    } finally {
      // Always release the concurrency latch, even if a cleanup or callback
      // threw synchronously, so the hook can never get permanently wedged.
      initializingRef.current = false;
    }
  }, [runCleanup]);

  const reinitialize = useCallback(() => {
    if (!whenRef.current) {
      return;
    }
    runInit();
  }, [runInit]);

  // `when` at the previous effect setup. Used to tell a genuine `when`
  // transition apart from a StrictMode-style teardown/re-setup with the same
  // `when` value.
  const prevWhenRef = useRef(when);

  useEffect(() => {
    mountedRef.current = true;

    // Run initialization if `when` is true AND either:
    // 1. We have never successfully initialized (first run / `when` first
    //    becomes true), OR
    // 2. This is a teardown/re-setup at the same `when` value (StrictMode's
    //    double-invoke, or any remount of this effect) — the previous cleanup
    //    tore the initialization down, so we must re-establish it. Because the
    //    effect only re-runs on a `when` change (runInit is identity-stable), an
    //    unchanged `when` at setup means the resource was just cleaned up and
    //    needs to be re-created, not a true→false→true intent change.
    const shouldInit =
      when && (!hasInitializedRef.current || prevWhenRef.current === when);

    prevWhenRef.current = when;

    if (shouldInit) {
      runInit();
    }

    return () => {
      mountedRef.current = false;
      runCleanup();
    };
  }, [when, runInit, runCleanup]);

  return {
    isInitialized: state.isInitialized,
    isInitializing: state.isInitializing,
    error: state.error,
    reinitialize,
  };
}
