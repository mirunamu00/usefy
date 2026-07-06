import { useCallback, useRef, useSyncExternalStore } from "react";
import type { ScriptStatus, UseScriptOptions, UseScriptSource } from "./types";
import { getScriptStatus, subscribeToScript } from "./cache";

const SERVER_STATUS: ScriptStatus = "idle";

/**
 * Load an external script and track its lifecycle status, deduplicating the
 * `<script>` tag across every component that requests the same `src`.
 *
 * ```tsx
 * const status = useScript(src); // 'idle' | 'loading' | 'ready' | 'error'
 * ```
 *
 * **Dedup (the core feature).** All state lives in a module-level registry keyed
 * by `src`. The first `useScript(src)` to mount creates one `<script>` (or adopts
 * a matching tag already in the DOM) and sets `data-status`; every later
 * `useScript(src)` shares that single tag and its status. When the script fires
 * `load`/`error`, the registry flips the shared status and notifies **all**
 * subscribers, so every component re-renders together.
 *
 * **Cleanup & ref-count.** On unmount a hook removes only its own subscriber. The
 * actual `<script>` node is removed only when `removeOnUnmount` is `true` **and**
 * it was the last subscriber for that `src`. (Removing a script does not un-run
 * its side effects — see {@link UseScriptOptions.removeOnUnmount}.)
 *
 * **Conditional loading.** Pass `null`/`undefined` as `src`, or
 * `shouldPreventLoad: true`, to stay `idle` and inject nothing.
 *
 * **SSR & StrictMode safe.** Built on `useSyncExternalStore`: returns `idle`
 * deterministically on the server (never touches `document`), and a StrictMode
 * double-mount converges to a single tag with no leaked listeners.
 *
 * @param src - The script URL, or `null`/`undefined` to stay `idle`.
 * @param options - See {@link UseScriptOptions}.
 * @returns The current {@link ScriptStatus}.
 *
 * @example
 * ```tsx
 * function StripeCheckout() {
 *   const status = useScript("https://js.stripe.com/v3", {
 *     attributes: { id: "stripe-js" },
 *   });
 *
 *   if (status === "loading") return <span>Loading payment form…</span>;
 *   if (status === "error") return <span>Failed to load Stripe.</span>;
 *   if (status !== "ready") return null;
 *
 *   return <PaymentForm stripe={window.Stripe(PUBLISHABLE_KEY)} />;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Two components, one <script> tag — both observe the same status.
 * function Widget() {
 *   const status = useScript("https://cdn.example.com/widget.js");
 *   return <div data-ready={status === "ready"} />;
 * }
 * ```
 */
export function useScript(
  src: UseScriptSource,
  options: UseScriptOptions = {}
): ScriptStatus {
  const { removeOnUnmount = false, shouldPreventLoad = false, attributes } =
    options;

  // Mirror the latest options in a ref so `subscribe` can stay keyed on `src`
  // alone: changing the `attributes` object (a fresh literal each render) or
  // `removeOnUnmount` must never re-inject or re-subscribe the script.
  const optionsRef = useRef({ attributes, removeOnUnmount });
  optionsRef.current = { attributes, removeOnUnmount };

  // The one source of truth for "should we load?". `null` means "stay idle".
  const key = src && !shouldPreventLoad ? src : null;

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (key === null) return () => {};
      // Read attributes at subscribe time (creation-only), but `removeOnUnmount`
      // lazily at cleanup time — so changing either never re-injects the tag.
      return subscribeToScript(
        key,
        optionsRef.current.attributes,
        () => optionsRef.current.removeOnUnmount,
        onStoreChange
      );
    },
    [key]
  );

  const getSnapshot = useCallback(
    (): ScriptStatus => (key === null ? "idle" : getScriptStatus(key)),
    [key]
  );

  const getServerSnapshot = useCallback((): ScriptStatus => SERVER_STATUS, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
