/**
 * The loading status of an external script.
 *
 * - `idle` — nothing is being loaded. Returned when `src` is `null`/`undefined`
 *   (conditional loading), when `shouldPreventLoad` is set, and on the server.
 * - `loading` — the `<script>` tag has been injected and the resource is
 *   downloading/executing.
 * - `ready` — the script fired its `load` event (or an already-loaded tag was
 *   adopted); its globals are now available.
 * - `error` — the script fired its `error` event (network failure, blocked, …).
 */
export type ScriptStatus = "idle" | "loading" | "ready" | "error";

/**
 * The script source accepted by {@link useScript}. Passing `null`, `undefined`,
 * or an empty string keeps the hook `idle` and injects nothing — the idiomatic
 * way to load a script conditionally (e.g. only after the user opts in).
 *
 * @example
 * ```tsx
 * // Load only once `enabled` is true:
 * const status = useScript(enabled ? "https://cdn.example.com/sdk.js" : null);
 * ```
 */
export type UseScriptSource = string | null | undefined;

/**
 * Options for {@link useScript}.
 */
export interface UseScriptOptions {
  /**
   * When `true`, the injected `<script>` DOM node is removed on unmount — but
   * **only if no other mounted `useScript` for the same `src` remains** (the
   * shared registry ref-counts subscribers). Defaults to `false`, which keeps
   * the tag in the document (the common, safe behavior).
   *
   * Caveat: removing the `<script>` element does **not** un-run its side effects.
   * Any globals it defined, listeners it registered, or timers it started stay
   * alive. Treat this as a DOM-tidiness option, not a true "unload".
   *
   * @default false
   */
  removeOnUnmount?: boolean;

  /**
   * When `true`, the hook does not load anything and stays `idle`, regardless of
   * `src`. Useful for gating a load behind consent, feature flags, or SSR guards
   * without changing the `src` argument.
   *
   * @default false
   */
  shouldPreventLoad?: boolean;

  /**
   * Extra attributes to set on the created `<script>` element, e.g.
   * `{ id: "stripe-js", "data-token": "abc", crossorigin: "anonymous" }`. Applied
   * only when the tag is **created** by this hook — an adopted pre-existing tag is
   * left untouched. If `async`/`defer` is not provided here, the script defaults
   * to `async`.
   */
  attributes?: Record<string, string>;
}

/**
 * Return type of {@link useScript} — an alias of {@link ScriptStatus}, so the
 * roadmap's `const status = useScript(src)` reads true. Exported for callers that
 * want to annotate the value explicitly.
 */
export type UseScriptReturn = ScriptStatus;
