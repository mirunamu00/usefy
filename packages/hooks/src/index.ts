// Re-export all hooks from individual packages

// useClickAnyWhere
export {
  useClickAnyWhere,
  type UseClickAnyWhereOptions,
  type ClickAnyWhereHandler,
} from "@usefy/use-click-any-where";

// useCopyToClipboard
export {
  useCopyToClipboard,
  type UseCopyToClipboardOptions,
  type UseCopyToClipboardReturn,
  type CopyFn,
} from "@usefy/use-copy-to-clipboard";

// useCounter
export { useCounter } from "@usefy/use-counter";

// useSignal
export {
  useSignal,
  type UseSignalReturn,
  type SignalOptions,
  type SignalInfo,
} from "@usefy/use-signal";

// useToggle
export { useToggle, type UseToggleReturn } from "@usefy/use-toggle";

// useDebounce
export { useDebounce, type UseDebounceOptions } from "@usefy/use-debounce";

// useDebounceCallback
export {
  useDebounceCallback,
  type UseDebounceCallbackOptions,
  type DebouncedFunction,
} from "@usefy/use-debounce-callback";

// useThrottle
export { useThrottle, type UseThrottleOptions } from "@usefy/use-throttle";

// useThrottleCallback
export {
  useThrottleCallback,
  type UseThrottleCallbackOptions,
  type ThrottledFunction,
} from "@usefy/use-throttle-callback";

// useLocalStorage
export {
  useLocalStorage,
  type UseLocalStorageOptions,
  type UseLocalStorageReturn,
  type InitialValue,
} from "@usefy/use-local-storage";

// useSessionStorage
export {
  useSessionStorage,
  type UseSessionStorageOptions,
  type UseSessionStorageReturn,
  type InitialValue as SessionStorageInitialValue,
} from "@usefy/use-session-storage";

// useOnClickOutside
export {
  useOnClickOutside,
  type UseOnClickOutsideOptions,
  type OnClickOutsideHandler,
  type ClickOutsideEvent,
  type RefTarget,
  type MouseEventType,
  type TouchEventType,
} from "@usefy/use-on-click-outside";

// useEventListener
export {
  useEventListener,
  type UseEventListenerOptions,
  type EventTargetType,
} from "@usefy/use-event-listener";

// useTimer
export {
  useTimer,
  type TimeUnit,
  type TimeFormat,
  type UseTimerOptions,
  type UseTimerReturn,
} from "@usefy/use-timer";

// useUnmount
export { useUnmount, type UseUnmountOptions } from "@usefy/use-unmount";

// useInit
export {
  useInit,
  type UseInitOptions,
  type UseInitResult,
} from "@usefy/use-init";

// useGeolocation
export {
  useGeolocation,
  haversineDistance,
  calculateBearing,
  type GeoCoordinates,
  type GeoPosition,
  type GeolocationError,
  type GeolocationErrorCode,
  type PermissionState,
  type UseGeolocationOptions,
  type UseGeolocationReturn,
} from "@usefy/use-geolocation";

// useIntersectionObserver
export {
  useIntersectionObserver,
  isIntersectionObserverSupported,
  toIntersectionEntry,
  createInitialEntry,
  type UseIntersectionObserverOptions,
  type UseIntersectionObserverReturn,
  type IntersectionEntry,
  type OnChangeCallback,
} from "@usefy/use-intersection-observer";

// useMemoryMonitor
export {
  useMemoryMonitor,
  formatBytes,
  detectSupport,
  CircularBuffer,
  linearRegression,
  calculateTrend,
  analyzeLeakProbability,
  type UseMemoryMonitorOptions,
  type UseMemoryMonitorReturn,
  type MemoryInfo,
  type MemorySnapshot,
  type SnapshotDiff,
  type LeakAnalysis,
  type UnsupportedInfo,
  type SupportLevel,
  type AvailableMetric,
  type Severity,
  type Trend,
  type FallbackStrategy,
  type LeakSensitivity,
  type FormattedMemory,
  type BrowserSupport,
} from "@usefy/use-memory-monitor";

// useTimeout
export {
  useTimeout,
  type TimeoutDelay,
  type UseTimeoutCallback,
  type UseTimeoutReturn,
} from "@usefy/use-timeout";

// useHover
export {
  useHover,
  isHoverSupported,
  normalizeDelay,
  type UseHoverOptions,
  type UseHoverReturn,
  type HoverDelayConfig,
  type OnHoverChangeCallback,
} from "@usefy/use-hover";

// useKeyPress
export {
  useKeyPress,
  parseShortcut,
  isKeyPressSupported,
  isApplePlatform,
  type KeyPressTarget,
  type KeyPressPredicate,
  type KeyPressEventTarget,
  type KeyPressEventType,
  type KeyPressMatchBy,
  type UseKeyPressOptions,
  type ParsedShortcut,
} from "@usefy/use-key-press";

// useMap
export {
  useMap,
  type MapInitializer,
  type UseMapActions,
  type UseMapReturn,
} from "@usefy/use-map";

// useSet
export {
  useSet,
  type SetInitializer,
  type UseSetActions,
  type UseSetReturn,
} from "@usefy/use-set";

// useList
export {
  useList,
  type ListInitializer,
  type UseListActions,
  type UseListReturn,
} from "@usefy/use-list";

// useQueue
export {
  useQueue,
  type QueueInitializer,
  type UseQueueActions,
  type UseQueueReturn,
} from "@usefy/use-queue";

// useHistoryState
export {
  useHistoryState,
  type HistoryStateInitializer,
  type HistoryStateUpdater,
  type UseHistoryStateOptions,
  type UseHistoryStateReturn,
} from "@usefy/use-history-state";

// useStep
export {
  useStep,
  type StepUpdater,
  type UseStepControls,
  type UseStepReturn,
} from "@usefy/use-step";

// useWindowSize
export {
  useWindowSize,
  isWindowAvailable,
  getWindowSize,
  areSizesEqual,
  type WindowSize,
  type OnWindowSizeChange,
  type UseWindowSizeOptions,
  type UseWindowSizeReturn,
} from "@usefy/use-window-size";

// useIsClient
export { useIsClient } from "@usefy/use-is-client";

// useIsomorphicLayoutEffect
export { useIsomorphicLayoutEffect } from "@usefy/use-isomorphic-layout-effect";

// usePrevious
export {
  usePrevious,
  type UsePreviousComparator,
} from "@usefy/use-previous";

// useLatest
export { useLatest } from "@usefy/use-latest";

// useEventCallback
export { useEventCallback } from "@usefy/use-event-callback";

// useUpdateEffect
export { useUpdateEffect } from "@usefy/use-update-effect";

// useMount
export { useMount } from "@usefy/use-mount";

// useIsFirstRender
export { useIsFirstRender } from "@usefy/use-is-first-render";

// useMediaQuery
export {
  useMediaQuery,
  isMatchMediaSupported,
  getMatches,
  type UseMediaQueryOptions,
} from "@usefy/use-media-query";

// usePreferredColorScheme
export {
  usePreferredColorScheme,
  type ColorScheme,
  type UsePreferredColorSchemeOptions,
} from "@usefy/use-preferred-color-scheme";

// useReducedMotion
export {
  useReducedMotion,
  type UseReducedMotionOptions,
} from "@usefy/use-reduced-motion";

// useDarkMode
export {
  useDarkMode,
  isBrowser,
  prefersDark,
  resolveIsDark,
  readStoredMode,
  writeStoredMode,
  applyTheme,
  type DarkModeMode,
  type UseDarkModeOptions,
  type UseDarkModeReturn,
} from "@usefy/use-dark-mode";

// useDocumentTitle
export {
  useDocumentTitle,
  type UseDocumentTitleOptions,
} from "@usefy/use-document-title";

// useControllableState
export {
  useControllableState,
  type UseControllableStateOptions,
  type UseControllableStateReturn,
} from "@usefy/use-controllable-state";

// useMergedRefs
export {
  useMergedRefs,
  mergeRefs,
  type PossibleRef,
  type RefCleanup,
} from "@usefy/use-merged-refs";

// useDisclosure
export {
  useDisclosure,
  type UseDisclosureOptions,
  type UseDisclosureHandlers,
  type UseDisclosureReturn,
} from "@usefy/use-disclosure";

// useMeasure
export {
  useMeasure,
  EMPTY_BOUNDS,
  type Bounds,
  type UseMeasureRef,
  type UseMeasureReturn,
} from "@usefy/use-measure";

// useMutationObserver
export {
  useMutationObserver,
  isMutationObserverSupported,
  resolveMutationConfig,
  EMPTY_RECORDS,
  type UseMutationObserverOptions,
  type UseMutationObserverReturn,
  type OnMutationCallback,
} from "@usefy/use-mutation-observer";

// useScrollPosition
export {
  useScrollPosition,
  ZERO_SCROLL_POSITION,
  type ScrollPosition,
  type ScrollPositionTarget,
  type UseScrollPositionOptions,
  type UseScrollPositionReturn,
} from "@usefy/use-scroll-position";

// useScrollLock
export {
  useScrollLock,
  isIOS,
  getScrollbarWidth,
  type UseScrollLockOptions,
  type UseScrollLockReturn,
} from "@usefy/use-scroll-lock";

// useHotkeys
export {
  useHotkeys,
  parseHotkey,
  isMacPlatform,
  isHotkeysSupported,
  type Hotkey,
  type HotkeyTarget,
  type HotkeyHandler,
  type HotkeyMatch,
  type ParsedChord,
  type ParsedHotkey,
  type UseHotkeysOptions,
} from "@usefy/use-hotkeys";

// useFocusTrap
export {
  useFocusTrap,
  getFocusableElements,
  type UseFocusTrapOptions,
  type UseFocusTrapRef,
  type FocusTarget,
} from "@usefy/use-focus-trap";

// useFocusWithin
export {
  useFocusWithin,
  isFocusInside,
  type UseFocusWithinOptions,
  type UseFocusWithinRef,
  type UseFocusWithinReturn,
} from "@usefy/use-focus-within";

// useLongPress
export {
  useLongPress,
  type LongPressEvent,
  type LongPressCallback,
  type LongPressCancelReason,
  type LongPressCancelMeta,
  type UseLongPressOptions,
  type UseLongPressHandlers,
  type UseLongPressReturn,
} from "@usefy/use-long-press";

// useAsyncFn
export {
  useAsyncFn,
  type AsyncStatus,
  type AsyncFn,
  type AsyncState,
  type AsyncRunFn,
  type UseAsyncFnOptions,
  type UseAsyncFnReturn,
} from "@usefy/use-async-fn";

// useAsync — object-style, abortable sibling of useAsyncFn.
// Shared types (AsyncStatus/AsyncFn/AsyncState) are already exported above via
// the useAsyncFn block, so only useAsync's own new names are re-exported here.
export {
  useAsync,
  type AsyncFnWithSignal,
  type AsyncExecuteFn,
  type UseAsyncOptions,
  type UseAsyncReturn,
} from "@usefy/use-async";

// usePolling — poll an async function on an interval with pause/resume,
// an enabled gate, and exponential backoff. Shared async types
// (AsyncStatus/AsyncFn/AsyncState/AsyncFnWithSignal) are already exported above
// via the useAsyncFn/useAsync blocks, so only usePolling's own new names are
// re-exported here.
export {
  usePolling,
  computePollingDelay,
  DEFAULT_POLLING_INTERVAL,
  type UsePollingOptions,
  type UsePollingReturn,
  type PollingBackoff,
  type BackoffOptions,
  type BackoffFn,
} from "@usefy/use-polling";

// useRafState — a useState replacement that batches updates to
// requestAnimationFrame, coalescing rapid updates to one commit per frame.
export {
  useRafState,
  type UseRafStateReturn,
} from "@usefy/use-raf-state";

// useObjectState — object state with immutable partial updates (patch/merge)
// and reset. `[state, patch, reset]`: `patch` shallow-merges a Partial (or a
// functional updater) immutably, `reset()` restores the captured initial (or
// `reset(next)` a provided object).
export {
  useObjectState,
  type ObjectStateInitializer,
  type ObjectStatePatch,
  type ObjectStateReset,
  type UseObjectStateReturn,
} from "@usefy/use-object-state";

// useStack — the LIFO sibling of useQueue: `[stack, actions]` where the top is
// the last element. `push`/`pop` operate on the top (the array's end); `pop`
// returns the popped item, `peek` reads the top without mutating. Immutable,
// no-op skipping, stable actions, lazy init.
export {
  useStack,
  type StackInitializer,
  type UseStackActions,
  type UseStackReturn,
} from "@usefy/use-stack";

// useSelection — multi/single selection state for lists and tables, backed by a
// Set of keys. `{ selected, isSelected, toggle, select, deselect, selectAll,
// clear, isAllSelected, isPartiallySelected, isNoneSelected, selectedKeys }`.
// Stores keys (via `getKey`, default identity), so selection survives new item
// identities; item-facing values are derived from the current `items`.
export {
  useSelection,
  type SelectionKey,
  type UseSelectionOptions,
  type UseSelectionReturn,
} from "@usefy/use-selection";

// useCookie — read/write a browser cookie as React state, SSR-aware. The cookie
// sibling of useLocalStorage/useSessionStorage: `[value, setValue, remove]` with
// JSON-or-raw (de)serialization, cookie write attributes (expires/maxAge/path/
// domain/secure/sameSite), and same-document sync. (Cross-tab writes are not
// observable without polling — see the package README.) `InitialValue` is
// already exported above via use-local-storage, so it is aliased here.
export {
  useCookie,
  type UseCookieOptions,
  type UseCookieReturn,
  type CookieAttributes,
  type SameSite,
  type InitialValue as CookieInitialValue,
} from "@usefy/use-cookie";
