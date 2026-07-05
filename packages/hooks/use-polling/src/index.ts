export { usePolling } from "./usePolling";
export { computePollingDelay, DEFAULT_POLLING_INTERVAL } from "./utils";
export type {
  UsePollingOptions,
  UsePollingReturn,
  PollingBackoff,
  BackoffOptions,
  BackoffFn,
} from "./types";

// Re-export the shared async primitives so consumers importing from
// `@usefy/use-polling` get the full state surface used by the batch-6 family.
export type { AsyncStatus, AsyncFn, AsyncState } from "@usefy/use-async-fn";
export type { AsyncFnWithSignal } from "@usefy/use-async";
