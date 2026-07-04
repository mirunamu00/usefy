export { useMutationObserver } from "./useMutationObserver";
export type {
  UseMutationObserverOptions,
  UseMutationObserverReturn,
  OnMutationCallback,
} from "./types";
// Public helpers: environment check + the config resolver (useful for callers
// pre-validating options). `getMutationConfigKey` and `createNoopRef` stay
// internal — generic names that shouldn't leak into the @usefy/hooks umbrella.
export {
  isMutationObserverSupported,
  resolveMutationConfig,
  EMPTY_RECORDS,
} from "./utils";
