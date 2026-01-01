// Main hook
export { useTimer, ms } from "./useTimer";

// Types
export type {
  TimeFormat,
  TimeFormatter,
  TimerStatus,
  UseTimerOptions,
  UseTimerReturn,
} from "./types";

// Utilities (for advanced usage)
export { decompose, toMs, fromMs } from "./utils/timeUtils";
export type { DecomposedTime, TimeUnit } from "./utils/timeUtils";
export { formatTime } from "./utils/formatUtils";
