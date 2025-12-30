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
