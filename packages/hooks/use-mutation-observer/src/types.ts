/**
 * Callback invoked when the observed element (and, if `subtree` is enabled, its
 * descendants) mutate. Receives the batch of {@link MutationRecord}s the browser
 * queued and the underlying {@link MutationObserver} instance (handy for calling
 * `takeRecords()` or `disconnect()`).
 */
export type OnMutationCallback = (
  mutations: MutationRecord[],
  observer: MutationObserver
) => void;

/**
 * Options for {@link useMutationObserver}.
 *
 * Extends the standard {@link MutationObserverInit} knobs with `onMutation`,
 * `enabled`, and `updateState` for the React-friendly ergonomics.
 *
 * At least one of `childList`, `attributes`, or `characterData` must be watched.
 * If you specify none of them, the hook defaults to `childList: true` so
 * `observe()` never throws (the DOM API requires at least one to be set).
 * Passing `attributeFilter`/`attributeOldValue` implies `attributes: true`, and
 * `characterDataOldValue` implies `characterData: true` — matching the browser's
 * own validation rules.
 *
 * @example
 * ```tsx
 * const { ref } = useMutationObserver<HTMLDivElement>({
 *   attributes: true,
 *   attributeFilter: ["class", "style"],
 *   subtree: true,
 *   onMutation: (records) => console.log(records),
 * });
 * ```
 */
export interface UseMutationObserverOptions<T extends Element = Element> {
  /**
   * Observe additions/removals of the target's child nodes.
   * @default true (when none of `childList`/`attributes`/`characterData` is set)
   */
  childList?: boolean;

  /**
   * Observe changes to the target's attributes.
   * @default false (implied `true` when `attributeFilter`/`attributeOldValue` is set)
   */
  attributes?: boolean;

  /**
   * Only observe the named attributes. Implies `attributes: true`.
   */
  attributeFilter?: string[];

  /**
   * Record the previous attribute value in `MutationRecord.oldValue`.
   * Implies `attributes: true`.
   * @default false
   */
  attributeOldValue?: boolean;

  /**
   * Observe changes to the character data of the target (or its descendants
   * when `subtree` is enabled).
   * @default false
   */
  characterData?: boolean;

  /**
   * Record the previous character data in `MutationRecord.oldValue`.
   * Implies `characterData: true`.
   * @default false
   */
  characterDataOldValue?: boolean;

  /**
   * Extend observation to the entire subtree rooted at the target, not just its
   * direct children.
   * @default false
   */
  subtree?: boolean;

  /**
   * Callback fired with each batch of mutation records the browser reports.
   * Stored in a ref internally, so changing its identity between renders does
   * **not** tear down and re-create the observer.
   */
  onMutation?: OnMutationCallback;

  /**
   * Whether observation is enabled. When `false`, the observer disconnects and
   * stops reporting mutations; flipping it back to `true` re-observes.
   * @default true
   */
  enabled?: boolean;

  /**
   * Whether to mirror the latest batch of records into React state (exposed as
   * `records`). Set to `false` for callback-only mode when you only care about
   * `onMutation` and want zero re-renders.
   * @default true
   */
  updateState?: boolean;
}

/**
 * Return type for {@link useMutationObserver}.
 *
 * @example
 * ```tsx
 * const { ref, records, isSupported, isObserving } = useMutationObserver();
 * ```
 */
export interface UseMutationObserverReturn<T extends Element = Element> {
  /**
   * Callback ref to attach to the element you want to observe. Attaching a node
   * observes it; passing `null` (on unmount) disconnects.
   *
   * @example
   * ```tsx
   * <div ref={ref}>Content</div>
   * ```
   */
  ref: (element: T | null) => void;

  /**
   * The most recent batch of {@link MutationRecord}s. Empty until the first
   * mutation fires, and always empty when `updateState` is `false`. Typed
   * read-only so the returned batch isn't mutated in place.
   */
  records: readonly MutationRecord[];

  /**
   * Whether the MutationObserver API is available in the current environment.
   */
  isSupported: boolean;

  /**
   * Whether the hook is currently observing an element.
   */
  isObserving: boolean;

  /**
   * Manually start observing an element (escape hatch alongside the `ref`).
   * Uses the same resolved config as the ref, disconnects any prior target
   * first, and honors `enabled` (records the target but waits to observe while
   * disabled).
   */
  observe: (element: T) => void;

  /**
   * Disconnect the observer, stopping all observation. MutationObserver has no
   * per-target `unobserve`; disconnecting is the only way to stop.
   *
   * This is terminal: after `disconnect()`, re-attaching the same `ref` will
   * **not** restart observation (the ref only re-observes on element change, and
   * the internal observer has been torn down). To resume, call
   * `observe(element)` again, or remount the component.
   */
  disconnect: () => void;

  /**
   * Flush and return any pending {@link MutationRecord}s the observer has queued
   * but not yet delivered to the callback. Returns an empty array when
   * unsupported or not observing.
   */
  takeRecords: () => MutationRecord[];
}
