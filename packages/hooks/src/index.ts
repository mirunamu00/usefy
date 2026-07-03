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
