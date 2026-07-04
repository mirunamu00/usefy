import type { UseMutationObserverOptions } from "./types";

/**
 * The inert, frozen empty record array used before any mutation fires and as the
 * SSR / server-render fallback. Frozen so it can be shared as a stable reference
 * without risk of accidental mutation.
 */
export const EMPTY_RECORDS: readonly MutationRecord[] = Object.freeze([]);

/**
 * Check whether the `MutationObserver` API is available in the current
 * environment. Returns `false` during SSR (no `window`) or in runtimes that
 * lack the API.
 */
export function isMutationObserverSupported(): boolean {
  return (
    typeof window !== "undefined" && typeof MutationObserver !== "undefined"
  );
}

/**
 * Resolve the user-facing options into a valid {@link MutationObserverInit}.
 *
 * Applies the browser's implicit rules so `observe()` never throws:
 * - `attributeFilter` or `attributeOldValue` implies `attributes: true`.
 * - `characterDataOldValue` implies `characterData: true`.
 * - If none of `childList` / `attributes` / `characterData` ends up enabled,
 *   defaults to `childList: true` (the DOM API requires at least one).
 *
 * Only the keys that are actually set are emitted, keeping the config minimal
 * and its {@link getMutationConfigKey} stable.
 */
export function resolveMutationConfig<T extends Element = Element>(
  options: UseMutationObserverOptions<T>
): MutationObserverInit {
  const {
    childList,
    attributes,
    attributeFilter,
    attributeOldValue,
    characterData,
    characterDataOldValue,
    subtree,
  } = options;

  // Attribute observation is implied by attributeFilter / attributeOldValue.
  const wantsAttributes =
    attributes === true ||
    (attributes !== false &&
      (attributeFilter !== undefined || attributeOldValue === true));

  // Character-data observation is implied by characterDataOldValue.
  const wantsCharacterData =
    characterData === true ||
    (characterData !== false && characterDataOldValue === true);

  const config: MutationObserverInit = {};

  if (childList === true) config.childList = true;

  if (wantsAttributes) {
    config.attributes = true;
    // Sub-options are only meaningful (and only valid) when attributes are on.
    if (attributeFilter !== undefined) config.attributeFilter = attributeFilter;
    if (attributeOldValue === true) config.attributeOldValue = true;
  }

  if (wantsCharacterData) {
    config.characterData = true;
    if (characterDataOldValue === true) config.characterDataOldValue = true;
  }

  if (subtree === true) config.subtree = true;

  // At least one of childList/attributes/characterData is required.
  if (!config.childList && !config.attributes && !config.characterData) {
    config.childList = true;
  }

  return config;
}

/**
 * Produce a stable, comparable string key for a resolved
 * {@link MutationObserverInit}. Used to detect whether the observation config
 * meaningfully changed between renders so the observer only re-registers when it
 * has to (rather than on every render).
 */
export function getMutationConfigKey(config: MutationObserverInit): string {
  return JSON.stringify({
    childList: config.childList ?? false,
    attributes: config.attributes ?? false,
    attributeFilter: config.attributeFilter
      ? [...config.attributeFilter].sort()
      : null,
    attributeOldValue: config.attributeOldValue ?? false,
    characterData: config.characterData ?? false,
    characterDataOldValue: config.characterDataOldValue ?? false,
    subtree: config.subtree ?? false,
  });
}

/**
 * Create a no-op ref callback for SSR / unsupported environments.
 */
export function createNoopRef<T extends Element>(): (
  element: T | null
) => void {
  return () => {
    // No-op on the server / when unsupported.
  };
}
