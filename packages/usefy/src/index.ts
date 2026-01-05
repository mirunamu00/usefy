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
