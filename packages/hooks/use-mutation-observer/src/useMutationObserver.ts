import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  OnMutationCallback,
  UseMutationObserverOptions,
  UseMutationObserverReturn,
} from "./types";
import {
  EMPTY_RECORDS,
  createNoopRef,
  getMutationConfigKey,
  isMutationObserverSupported,
  resolveMutationConfig,
} from "./utils";

/**
 * React hook that wraps the DOM `MutationObserver` API to watch an element for
 * DOM mutations — child additions/removals, attribute changes, and character
 * data changes.
 *
 * `useMutationObserver` is the low-level observer primitive, a sibling to
 * {@link useResizeObserver} and `useIntersectionObserver`. Attach the returned
 * `ref` to the element you want to watch; the hook (dis)connects a
 * `MutationObserver` for you. You can react to mutations either via the
 * `onMutation` callback, or via the reactive `records` state (the latest batch
 * of `MutationRecord`s), or both.
 *
 * Behaviour notes:
 * - **SSR-safe**: no `MutationObserver`/DOM access on the server. `isSupported`
 *   is `false` and the returned `ref`/methods are inert no-ops.
 * - **StrictMode / concurrent-safe**: mount/unmount cleanly connect/disconnect
 *   with no leaked observers. The user callback is never fired from inside a
 *   `setState` updater.
 * - **Stable callback**: `onMutation` is stored in a ref, so changing its
 *   identity every render does **not** tear down and re-create the observer.
 *   The observer is only re-registered when the observation config (`childList`,
 *   `attributes`, `subtree`, …) or `enabled` actually changes.
 * - At least one of `childList`/`attributes`/`characterData` must be watched.
 *   When you specify none, the hook defaults to `childList: true` so `observe()`
 *   never throws.
 *
 * @typeParam T - The element type being observed (defaults to `Element`).
 * @param options - Configuration: the standard `MutationObserverInit` knobs plus
 *   `onMutation`, `enabled`, and `updateState`.
 * @returns An object with the callback `ref`, the latest `records`, support and
 *   observing flags, and manual `observe`/`disconnect`/`takeRecords` controls.
 *
 * @example
 * ```tsx
 * // Watch child list + attributes and log every mutation.
 * import { useMutationObserver } from "@usefy/use-mutation-observer";
 *
 * function Watched() {
 *   const { ref, records } = useMutationObserver<HTMLDivElement>({
 *     childList: true,
 *     attributes: true,
 *     subtree: true,
 *     onMutation: (mutations) => {
 *       for (const m of mutations) console.log(m.type, m.target);
 *     },
 *   });
 *
 *   return <div ref={ref}>{records.length} recent mutations</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Callback-only mode (zero re-renders) — watch a single attribute.
 * function ClassWatcher() {
 *   const { ref } = useMutationObserver({
 *     attributeFilter: ["class"],
 *     updateState: false,
 *     onMutation: (mutations) => {
 *       const el = mutations[0]?.target as HTMLElement;
 *       el?.dataset && console.log("class is now", el.className);
 *     },
 *   });
 *   return <div ref={ref} className="box" />;
 * }
 * ```
 */
export function useMutationObserver<T extends Element = Element>(
  options: UseMutationObserverOptions<T> = {}
): UseMutationObserverReturn<T> {
  const { onMutation, enabled = true, updateState = true } = options;

  // ============ SSR Check ============
  const isSupported = isMutationObserverSupported();

  // ============ Resolved config ============
  // Recomputed each render, but the effect only re-registers when `configKey`
  // (a stable string of the config values) actually changes.
  const resolvedConfig = resolveMutationConfig(options);
  const configKey = getMutationConfigKey(resolvedConfig);

  // ============ Refs ============
  const observerRef = useRef<MutationObserver | null>(null);
  const targetRef = useRef<T | null>(null);
  const onMutationRef = useRef<OnMutationCallback | undefined>(onMutation);
  const configRef = useRef<MutationObserverInit>(resolvedConfig);
  const enabledRef = useRef<boolean>(enabled);
  const updateStateRef = useRef<boolean>(updateState);
  const isObservingRef = useRef<boolean>(false);

  // Keep refs current so stable callbacks always read the latest values.
  onMutationRef.current = onMutation;
  configRef.current = resolvedConfig;
  enabledRef.current = enabled;
  updateStateRef.current = updateState;

  // ============ State ============
  const [records, setRecords] = useState<readonly MutationRecord[]>(
    () => EMPTY_RECORDS
  );
  const [isObserving, setIsObserving] = useState<boolean>(false);

  // ============ Observer Callback (stable via ref indirection) ============
  const observerCallbackRef = useRef<MutationCallback>(() => {});
  observerCallbackRef.current = (mutations, observer) => {
    // Fire the user callback from the event handler, never inside a setState
    // updater (StrictMode / concurrent safety).
    if (onMutationRef.current) {
      onMutationRef.current(mutations, observer);
    }
    if (updateStateRef.current && mutations.length > 0) {
      setRecords(mutations);
    }
  };

  // ============ Ref Callback ============
  const setRef = useCallback((node: T | null) => {
    const prevTarget = targetRef.current;

    // Skip redundant work when the same node is attached again.
    if (node === prevTarget) return;

    // MutationObserver has no per-target unobserve — disconnect drops all
    // observation, then we re-observe the new node below.
    if (observerRef.current) {
      observerRef.current.disconnect();
      isObservingRef.current = false;
    }

    targetRef.current = node;

    if (node && observerRef.current && enabledRef.current) {
      observerRef.current.observe(node, configRef.current);
      isObservingRef.current = true;
      setIsObserving(true);
    } else {
      setIsObserving(false);
    }
  }, []);

  // ============ Manual Control Methods ============
  const observe = useCallback(
    (element: T) => {
      if (!isSupported) return;
      if (!observerRef.current) {
        observerRef.current = new MutationObserver((mutations, observer) => {
          observerCallbackRef.current(mutations, observer);
        });
      }
      // Mirror the ref path: drop any prior observation first (MutationObserver
      // has no per-target unobserve, so a single observer would otherwise watch
      // both the old and new element), record the target so the reconcile effect
      // manages it, and honor `enabled` — record but don't observe while disabled.
      observerRef.current.disconnect();
      isObservingRef.current = false;
      targetRef.current = element;
      if (enabledRef.current) {
        observerRef.current.observe(element, configRef.current);
        isObservingRef.current = true;
        setIsObserving(true);
      } else {
        setIsObserving(false);
      }
    },
    [isSupported]
  );

  const disconnect = useCallback(() => {
    if (!observerRef.current) return;
    observerRef.current.disconnect();
    observerRef.current = null;
    isObservingRef.current = false;
    setIsObserving(false);
  }, []);

  const takeRecords = useCallback((): MutationRecord[] => {
    return observerRef.current?.takeRecords() ?? [];
  }, []);

  // ============ Effect: Create Observer on Mount ============
  useEffect(() => {
    if (!isSupported) return;

    const observer = new MutationObserver((mutations, obs) => {
      observerCallbackRef.current(mutations, obs);
    });
    observerRef.current = observer;

    // Observe the already-attached target (ref callbacks run before effects).
    if (targetRef.current && enabledRef.current) {
      observer.observe(targetRef.current, configRef.current);
      isObservingRef.current = true;
      setIsObserving(true);
    }

    return () => {
      // Disconnect the *live* observer (the ref may have been swapped by a
      // manual disconnect()+observe() cycle), not just the one created here.
      observerRef.current?.disconnect();
      observer.disconnect();
      observerRef.current = null;
      isObservingRef.current = false;
    };
    // Only depend on isSupported so the observer is created once. `enabled` and
    // config changes are reconciled in the separate effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported]);

  // ============ Effect: Reconcile enabled / config changes ============
  useEffect(() => {
    const observer = observerRef.current;
    if (!isSupported || !observer || !targetRef.current) return;

    if (enabled) {
      // Re-observe with the latest config (disconnect first so a changed config
      // fully replaces the old one).
      observer.disconnect();
      observer.observe(targetRef.current, resolvedConfig);
      isObservingRef.current = true;
      setIsObserving(true);
    } else if (isObservingRef.current) {
      observer.disconnect();
      isObservingRef.current = false;
      setIsObserving(false);
    }
    // resolvedConfig is captured via configKey (its stable string identity).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isSupported, configKey]);

  // ============ SSR / Unsupported Return ============
  const inertReturn = useMemo<UseMutationObserverReturn<T>>(
    () => ({
      ref: createNoopRef<T>(),
      records: EMPTY_RECORDS,
      isSupported: false,
      isObserving: false,
      observe: () => {},
      disconnect: () => {},
      takeRecords: () => [],
    }),
    []
  );

  if (!isSupported) {
    return inertReturn;
  }

  // ============ Client Return ============
  return {
    ref: setRef,
    records,
    isSupported,
    isObserving,
    observe,
    disconnect,
    takeRecords,
  };
}
