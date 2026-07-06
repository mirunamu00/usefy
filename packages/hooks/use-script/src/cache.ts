import type { ScriptStatus } from "./types";

/**
 * A tracked script in the shared registry. One entry exists per unique `src`,
 * shared by every mounted `useScript` for that source.
 */
interface ScriptEntry {
  /** Current shared status for this `src`. */
  status: ScriptStatus;
  /**
   * `useSyncExternalStore` change callbacks — one per mounted subscriber. The
   * set's `size` doubles as the ref-count that gates DOM removal on unmount.
   */
  subscribers: Set<() => void>;
  /** The `<script>` node this entry owns (created or adopted). */
  element: HTMLScriptElement | null;
  /** `load` listener attached to `element`, if any (so cleanup can detach it). */
  onLoad: (() => void) | null;
  /** `error` listener attached to `element`, if any. */
  onError: (() => void) | null;
}

/**
 * Module-level cache keyed by `src`. Because it lives at module scope, every
 * `useScript(sameSrc)` across the whole app shares one entry — and therefore one
 * `<script>` tag and one status — no matter how many components mount.
 */
const registry = new Map<string, ScriptEntry>();

/** SSR guard — the registry only ever touches the DOM in a browser. */
function isBrowser(): boolean {
  return typeof document !== "undefined";
}

/** Escape a `src` for safe interpolation into an attribute selector. */
function escapeSelector(src: string): string {
  return typeof CSS !== "undefined" && typeof CSS.escape === "function"
    ? CSS.escape(src)
    : src.replace(/["\\]/g, "\\$&");
}

/** Coerce an arbitrary `data-status` attribute to a known {@link ScriptStatus}. */
function normalizeStatus(raw: string | null): ScriptStatus {
  return raw === "idle" || raw === "loading" || raw === "error"
    ? raw
    : // `"ready"` and anything unrecognized (missing, empty, garbage) → ready:
      // a tag already in the DOM is assumed to have executed.
      "ready";
}

/**
 * Read the current shared status for `src` without subscribing. Returns `idle`
 * when nothing has been loaded for that source yet.
 *
 * Useful for reading a script's status imperatively (outside React) once some
 * component has begun loading it.
 *
 * @example
 * ```ts
 * if (getScriptStatus("https://cdn.example.com/sdk.js") === "ready") {
 *   window.SDK.init();
 * }
 * ```
 */
export function getScriptStatus(src: string): ScriptStatus {
  return registry.get(src)?.status ?? "idle";
}

/**
 * Update an entry's status, mirror it to the DOM node's `data-status` attribute,
 * and notify every subscriber so all mounted hooks re-render together.
 */
function setStatus(src: string, status: ScriptStatus): void {
  const entry = registry.get(src);
  if (!entry) return;
  entry.status = status;
  entry.element?.setAttribute("data-status", status);
  // Copy before iterating so a subscriber can't mutate the set mid-notify.
  for (const notify of Array.from(entry.subscribers)) notify();
}

/**
 * Ensure a script entry exists for `src`, creating (or adopting) the DOM node the
 * first time. Idempotent: repeated calls for the same `src` reuse the one entry,
 * which is what makes multiple components share a single `<script>` tag.
 */
function ensureEntry(
  src: string,
  attributes: Record<string, string> | undefined
): ScriptEntry {
  const existing = registry.get(src);
  if (existing) return existing;

  // Look for a tag another `useScript`, SSR, or a third-party lib already added.
  let element = document.querySelector<HTMLScriptElement>(
    `script[src="${escapeSelector(src)}"]`
  );

  let status: ScriptStatus;
  let createdHere = false;

  if (element) {
    // Adopt a pre-existing tag. If it carries a valid `data-status` we trust it;
    // otherwise we cannot know whether it already fired `load` (attaching a
    // listener now would never fire for an already-executed script), so we treat
    // an untracked tag as `ready`. Documented behavior, matching usehooks-ts.
    status = normalizeStatus(element.getAttribute("data-status"));
  } else {
    element = document.createElement("script");
    element.src = src;
    element.setAttribute("data-status", "loading");
    // Default to async unless the caller manages loading explicitly.
    if (!attributes || (!("async" in attributes) && !("defer" in attributes))) {
      element.async = true;
    }
    if (attributes) {
      for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, value);
      }
    }
    document.head.appendChild(element);
    status = "loading";
    createdHere = true;
  }

  const entry: ScriptEntry = {
    status,
    subscribers: new Set(),
    element,
    onLoad: null,
    onError: null,
  };
  registry.set(src, entry);

  // Only attach listeners when the resource may still resolve — i.e. a tag we
  // just created, or a pre-existing tag explicitly marked `loading`. An adopted
  // `ready`/`error` (or listener-less) tag gets none, since its event has passed.
  if (createdHere || status === "loading") {
    const onLoad = () => setStatus(src, "ready");
    const onError = () => setStatus(src, "error");
    element.addEventListener("load", onLoad);
    element.addEventListener("error", onError);
    entry.onLoad = onLoad;
    entry.onError = onError;
  }

  return entry;
}

/** Detach listeners, remove the DOM node, and drop the entry from the registry. */
function removeEntry(src: string): void {
  const entry = registry.get(src);
  if (!entry) return;
  if (entry.element) {
    if (entry.onLoad) entry.element.removeEventListener("load", entry.onLoad);
    if (entry.onError) entry.element.removeEventListener("error", entry.onError);
    entry.element.remove();
  }
  registry.delete(src);
}

/**
 * Subscribe a hook instance to `src`. Creates/adopts the shared `<script>` on the
 * first subscriber, registers `onStoreChange`, and returns an unsubscribe that
 * ref-count-aware-removes the tag when the last subscriber leaves (and only if
 * `removeOnUnmount` was requested).
 *
 * Designed to be the `subscribe` fn of `useSyncExternalStore`: SSR-safe (no-ops
 * without a DOM) and StrictMode-safe (double subscribe/unsubscribe converges to a
 * single tag with no leaked listeners).
 */
export function subscribeToScript(
  src: string,
  attributes: Record<string, string> | undefined,
  getRemoveOnUnmount: () => boolean,
  onStoreChange: () => void
): () => void {
  if (!isBrowser()) return () => {};

  const entry = ensureEntry(src, attributes);
  entry.subscribers.add(onStoreChange);

  return () => {
    entry.subscribers.delete(onStoreChange);
    // Read `removeOnUnmount` at cleanup time (not subscribe time) so toggling it
    // mid-mount takes effect without forcing a re-subscribe / re-injection.
    if (entry.subscribers.size === 0 && getRemoveOnUnmount()) {
      removeEntry(src);
    }
  };
}

/**
 * Test-only: clear the shared registry (does not remove DOM nodes). Package-internal
 * — intentionally not re-exported from `index.ts`, so it never reaches the public
 * or umbrella surface.
 */
export function __clearScriptRegistryForTests(): void {
  registry.clear();
}
