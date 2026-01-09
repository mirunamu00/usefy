/**
 * Supported time format types for display
 */
export type TimeFormat =
  | "HH:MM:SS"
  | "HH:MM:SS.SSS"
  | "MM:SS"
  | "mm:ss.SSS"
  | "SS";

/**
 * Custom time formatter function type
 */
export type TimeFormatter = (timeMs: number) => string;

/**
 * Timer status states
 */
export type TimerStatus = "idle" | "running" | "paused" | "finished";

/**
 * Options for useTimer hook
 */
export interface UseTimerOptions {
  /**
   * Update interval in milliseconds
   * @default 100
   */
  interval?: number;

  /**
   * Time format preset or custom formatter function
   * @default "MM:SS"
   */
  format?: TimeFormat | TimeFormatter;

  /**
   * Whether to start the timer automatically on mount
   * @default false
   */
  autoStart?: boolean;

  /**
   * Whether to loop the timer when it completes
   * @default false
   */
  loop?: boolean;

  /**
   * Whether to use requestAnimationFrame for smoother animations
   * When true, ignores interval option and syncs with display refresh rate
   * @default false
   */
  useRAF?: boolean;

  /**
   * Called when the timer completes (time reaches 0)
   */
  onComplete?: () => void;

  /**
   * Called on each tick with the remaining time in milliseconds
   */
  onTick?: (remainingMs: number) => void;

  /**
   * Called when the timer starts
   */
  onStart?: () => void;

  /**
   * Called when the timer pauses
   */
  onPause?: () => void;

  /**
   * Called when the timer resets
   */
  onReset?: () => void;

  /**
   * Called when the timer stops
   */
  onStop?: () => void;
}

/**
 * Return type for useTimer hook
 */
export interface UseTimerReturn {
  // ============ State ============
  /**
   * Formatted time string based on format option
   * @example "05:30", "01:30:00"
   */
  time: string;

  /**
   * Progress percentage (0-100)
   * 0 at start, 100 when complete
   */
  progress: number;

  /**
   * Current timer status
   */
  status: TimerStatus;

  // ============ Derived State ============
  /**
   * Whether the timer is currently running
   */
  isRunning: boolean;

  /**
   * Whether the timer is paused
   */
  isPaused: boolean;

  /**
   * Whether the timer has finished (time = 0)
   */
  isFinished: boolean;

  /**
   * Whether the timer is idle (never started or after reset)
   */
  isIdle: boolean;

  // ============ Controls ============
  /**
   * Start or resume the timer
   */
  start: () => void;

  /**
   * Pause the timer (preserves remaining time)
   */
  pause: () => void;

  /**
   * Stop the timer (preserves remaining time, resets status to idle)
   */
  stop: () => void;

  /**
   * Reset the timer to initial time
   */
  reset: () => void;

  /**
   * Reset and start immediately
   */
  restart: () => void;

  /**
   * Toggle between running and paused states
   */
  toggle: () => void;

  // ============ Time Manipulation ============
  /**
   * Add time in milliseconds
   */
  addTime: (ms: number) => void;

  /**
   * Subtract time in milliseconds (minimum 0)
   */
  subtractTime: (ms: number) => void;

  /**
   * Set time to a specific value in milliseconds
   */
  setTime: (ms: number) => void;
}
