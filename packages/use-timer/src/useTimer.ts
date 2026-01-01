import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  TimeFormat,
  TimeFormatter,
  TimerStatus,
  UseTimerOptions,
  UseTimerReturn,
} from "./types";
import { decompose } from "./utils/timeUtils";
import { formatTime } from "./utils/formatUtils";

/**
 * Helper object to create milliseconds from various time units
 *
 * @example
 * ```tsx
 * import { useTimer, ms } from "@usefy/use-timer";
 *
 * // 5 minute timer
 * const timer = useTimer(ms.minutes(5));
 *
 * // 1 hour 30 minutes timer
 * const timer = useTimer(ms.hours(1) + ms.minutes(30));
 * ```
 */
export const ms = {
  /** Convert seconds to milliseconds */
  seconds: (n: number): number => n * 1000,
  /** Convert minutes to milliseconds */
  minutes: (n: number): number => n * 60 * 1000,
  /** Convert hours to milliseconds */
  hours: (n: number): number => n * 60 * 60 * 1000,
} as const;

/**
 * A powerful countdown timer hook with comprehensive controls and features.
 *
 * @param initialTimeMs - Initial time in milliseconds
 * @param options - Timer configuration options
 * @returns Timer state and control functions
 *
 * @example
 * ```tsx
 * // Basic usage
 * function Timer() {
 *   const timer = useTimer(60000); // 60 seconds
 *
 *   return (
 *     <div>
 *       <p>{timer.formattedTime}</p>
 *       <button onClick={timer.toggle}>
 *         {timer.isRunning ? "Pause" : "Start"}
 *       </button>
 *       <button onClick={timer.reset}>Reset</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With callbacks and auto-start
 * const timer = useTimer(30000, {
 *   autoStart: true,
 *   onComplete: () => alert("Time's up!"),
 *   onTick: (remaining) => console.log(`${remaining}ms left`),
 * });
 * ```
 *
 * @example
 * ```tsx
 * // With time helpers
 * import { useTimer, ms } from "@usefy/use-timer";
 *
 * const timer = useTimer(ms.minutes(5), {
 *   format: "MM:SS",
 *   loop: true,
 * });
 * ```
 */
export function useTimer(
  initialTimeMs: number,
  options: UseTimerOptions = {}
): UseTimerReturn {
  // ============ Parse Options ============
  const {
    interval = 1,
    format = "MM:SS",
    autoStart = false,
    loop = false,
    useRAF = false,
    onComplete,
    onTick,
    onStart,
    onPause,
    onReset,
    onStop,
  } = options;

  // Ensure initialTime is non-negative
  const safeInitialTime = Math.max(0, initialTimeMs);

  // ============ Helper to compute formatted time ============
  const computeFormattedTime = useCallback(
    (timeMs: number): string => {
      if (typeof format === "function") {
        return format(timeMs);
      }
      return formatTime(timeMs, format as TimeFormat);
    },
    [format]
  );

  // ============ State ============
  // Only formattedTime triggers re-renders (optimization)
  const [formattedTime, setFormattedTime] = useState(() =>
    computeFormattedTime(safeInitialTime)
  );
  const [status, setStatus] = useState<TimerStatus>(() =>
    safeInitialTime === 0 ? "finished" : "idle"
  );

  // ============ Refs ============
  // Time is stored in ref for performance - only formattedTime changes trigger re-renders
  const timeRef = useRef(safeInitialTime);
  const prevFormattedTimeRef = useRef<string>(
    computeFormattedTime(safeInitialTime)
  );

  // Timer ID for cleanup
  const timerIdRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // For accurate time tracking
  const lastTickTimeRef = useRef<number>(0);
  const remainingTimeRef = useRef(safeInitialTime);

  // Track initial time for reset
  const initialTimeRef = useRef(safeInitialTime);

  // Store if autoStart has been triggered
  const autoStartTriggeredRef = useRef(false);

  // Track previous initialTimeMs to detect actual prop changes
  const prevInitialTimeMsRef = useRef(safeInitialTime);

  // Callback refs for latest values without causing re-renders
  const onCompleteRef = useRef(onComplete);
  const onTickRef = useRef(onTick);
  const onStartRef = useRef(onStart);
  const onPauseRef = useRef(onPause);
  const onResetRef = useRef(onReset);
  const onStopRef = useRef(onStop);

  // Options refs
  const loopRef = useRef(loop);
  const intervalRef = useRef(interval);
  const useRAFRef = useRef(useRAF);
  const formatRef = useRef(format);

  // ============ Update Refs ============
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onTickRef.current = onTick;
    onStartRef.current = onStart;
    onPauseRef.current = onPause;
    onResetRef.current = onReset;
    onStopRef.current = onStop;
    loopRef.current = loop;
    intervalRef.current = interval;
    useRAFRef.current = useRAF;
    formatRef.current = format;
  });

  // Re-compute formattedTime when format option changes
  useEffect(() => {
    const newFormatted = computeFormattedTime(timeRef.current);
    if (newFormatted !== prevFormattedTimeRef.current) {
      prevFormattedTimeRef.current = newFormatted;
      setFormattedTime(newFormatted);
    }
  }, [format, computeFormattedTime]);

  // ============ Helper to update time (only re-renders if formatted value changes) ============
  const updateTime = useCallback(
    (newTimeMs: number) => {
      timeRef.current = newTimeMs;
      const newFormatted = computeFormattedTime(newTimeMs);
      if (newFormatted !== prevFormattedTimeRef.current) {
        prevFormattedTimeRef.current = newFormatted;
        setFormattedTime(newFormatted);
      }
    },
    [computeFormattedTime]
  );

  // ============ Derived State ============
  const isRunning = status === "running";
  const isPaused = status === "paused";
  const isFinished = status === "finished";
  const isIdle = status === "idle";

  // Current time value (read from ref)
  const time = timeRef.current;

  // Progress: 0 at start, 100 at completion
  const progress = useMemo(() => {
    if (initialTimeRef.current === 0) return 100;
    return Math.min(
      100,
      Math.max(
        0,
        ((initialTimeRef.current - time) / initialTimeRef.current) * 100
      )
    );
    // formattedTime is the trigger for re-render, time is derived from ref
  }, [formattedTime]);

  // Decomposed time (recalculated on re-render)
  const decomposedTime = useMemo(() => decompose(time), [formattedTime]);
  const { hours, minutes, seconds, milliseconds } = decomposedTime;

  // ============ Clear Timer ============
  const clearTimer = useCallback(() => {
    if (timerIdRef.current !== null) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  // ============ Handle Complete ============
  const handleComplete = useCallback(() => {
    clearTimer();
    remainingTimeRef.current = 0;
    updateTime(0);

    if (loopRef.current) {
      // Loop: reset and restart
      remainingTimeRef.current = initialTimeRef.current;
      updateTime(initialTimeRef.current);
      onCompleteRef.current?.();
      // Status stays running, will schedule next tick in effect
    } else {
      setStatus("finished");
      onCompleteRef.current?.();
    }
  }, [clearTimer, updateTime]);

  // ============ Tick Function ============
  const tick = useCallback(() => {
    const now = performance.now();
    const elapsed = now - lastTickTimeRef.current;
    const newRemaining = Math.max(0, remainingTimeRef.current - elapsed);

    lastTickTimeRef.current = now;
    remainingTimeRef.current = newRemaining;
    updateTime(newRemaining);
    onTickRef.current?.(newRemaining);

    if (newRemaining <= 0) {
      handleComplete();
    }
  }, [handleComplete, updateTime]);

  // ============ RAF Tick ============
  const rafTick = useCallback(
    (timestamp: number) => {
      if (lastTickTimeRef.current === 0) {
        lastTickTimeRef.current = timestamp;
      }

      const elapsed = timestamp - lastTickTimeRef.current;
      const newRemaining = Math.max(0, remainingTimeRef.current - elapsed);

      lastTickTimeRef.current = timestamp;
      remainingTimeRef.current = newRemaining;
      updateTime(newRemaining);
      onTickRef.current?.(newRemaining);

      if (newRemaining <= 0) {
        handleComplete();
      } else {
        rafIdRef.current = requestAnimationFrame(rafTick);
      }
    },
    [handleComplete, updateTime]
  );

  // ============ Start Timer Loop ============
  const startTimerLoop = useCallback(() => {
    clearTimer();
    lastTickTimeRef.current = performance.now();

    if (useRAFRef.current) {
      rafIdRef.current = requestAnimationFrame(rafTick);
    } else {
      timerIdRef.current = window.setInterval(tick, intervalRef.current);
    }
  }, [clearTimer, tick, rafTick]);

  // ============ Control Functions ============
  const start = useCallback(() => {
    // Don't start if already running or finished
    if (status === "running" || status === "finished") {
      return;
    }

    setStatus("running");
    onStartRef.current?.();
    startTimerLoop();
  }, [status, startTimerLoop]);

  const pause = useCallback(() => {
    // Only pause if running
    if (status !== "running") {
      return;
    }

    clearTimer();
    setStatus("paused");
    onPauseRef.current?.();
  }, [status, clearTimer]);

  const stop = useCallback(() => {
    clearTimer();
    setStatus("idle");
    onStopRef.current?.();
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    remainingTimeRef.current = initialTimeRef.current;
    updateTime(initialTimeRef.current);
    setStatus(initialTimeRef.current === 0 ? "finished" : "idle");
    onResetRef.current?.();
  }, [clearTimer, updateTime]);

  const restart = useCallback(() => {
    clearTimer();
    remainingTimeRef.current = initialTimeRef.current;
    updateTime(initialTimeRef.current);

    if (initialTimeRef.current === 0) {
      setStatus("finished");
      return;
    }

    setStatus("running");
    onResetRef.current?.();
    onStartRef.current?.();
    startTimerLoop();
  }, [clearTimer, updateTime, startTimerLoop]);

  const toggle = useCallback(() => {
    if (isRunning) {
      pause();
    } else if (isPaused || isIdle) {
      start();
    }
  }, [isRunning, isPaused, isIdle, start, pause]);

  // ============ Time Manipulation ============
  const addTime = useCallback(
    (addMs: number) => {
      const newTimeMs = Math.max(0, remainingTimeRef.current + addMs);
      remainingTimeRef.current = newTimeMs;
      updateTime(newTimeMs);

      // If timer was finished and we add time, it's no longer finished
      if (status === "finished" && newTimeMs > 0) {
        setStatus("idle");
      }
    },
    [status, updateTime]
  );

  const subtractTime = useCallback(
    (subtractMs: number) => {
      const newTimeMs = Math.max(0, remainingTimeRef.current - subtractMs);
      remainingTimeRef.current = newTimeMs;
      updateTime(newTimeMs);

      // If time reaches 0, mark as finished
      if (newTimeMs <= 0 && status === "running") {
        handleComplete();
      }
    },
    [status, handleComplete, updateTime]
  );

  const setTimeValue = useCallback(
    (newTimeMs: number) => {
      const safeTime = Math.max(0, newTimeMs);
      remainingTimeRef.current = safeTime;
      updateTime(safeTime);

      // Update finished state based on new time
      if (safeTime === 0 && status === "running") {
        handleComplete();
      } else if (safeTime > 0 && status === "finished") {
        setStatus("idle");
      }
    },
    [status, handleComplete, updateTime]
  );

  // ============ Effects ============
  // Handle autoStart
  useEffect(() => {
    if (autoStart && !autoStartTriggeredRef.current && safeInitialTime > 0) {
      autoStartTriggeredRef.current = true;
      setStatus("running");
      onStartRef.current?.();
      startTimerLoop();
    }
  }, [autoStart, safeInitialTime, startTimerLoop]);

  // Handle initialTimeMs changes when not running
  // Only react to actual prop changes, not status changes
  useEffect(() => {
    const newSafeTime = Math.max(0, initialTimeMs);

    // Only update if initialTimeMs actually changed
    if (prevInitialTimeMsRef.current !== newSafeTime) {
      prevInitialTimeMsRef.current = newSafeTime;

      // Only sync time when not running or paused
      if (status !== "running" && status !== "paused") {
        initialTimeRef.current = newSafeTime;
        remainingTimeRef.current = newSafeTime;
        updateTime(newSafeTime);
        setStatus(newSafeTime === 0 ? "finished" : "idle");
      }
    }
  }, [initialTimeMs, status, updateTime]);

  // Handle loop restart when running
  useEffect(() => {
    if (
      status === "running" &&
      loop &&
      timerIdRef.current === null &&
      rafIdRef.current === null
    ) {
      // Timer was cleared for loop completion, restart it
      startTimerLoop();
    }
  }, [status, loop, time, startTimerLoop]);

  // Visibility API: compensate for time drift when tab is inactive
  useEffect(() => {
    let hiddenTime = 0;

    const handleVisibilityChange = () => {
      if (status !== "running") return;

      if (document.hidden) {
        // Tab became hidden, record the time
        hiddenTime = performance.now();
      } else if (hiddenTime > 0) {
        // Tab became visible, calculate elapsed time
        const elapsed = performance.now() - hiddenTime;
        const newRemaining = Math.max(0, remainingTimeRef.current - elapsed);
        remainingTimeRef.current = newRemaining;
        lastTickTimeRef.current = performance.now();

        // Force update formatted time
        const newFormatted = formatRef.current
          ? typeof formatRef.current === "function"
            ? formatRef.current(newRemaining)
            : formatTime(newRemaining, formatRef.current as TimeFormat)
          : formatTime(newRemaining, "MM:SS");
        if (newFormatted !== prevFormattedTimeRef.current) {
          prevFormattedTimeRef.current = newFormatted;
          setFormattedTime(newFormatted);
        }

        if (newRemaining <= 0) {
          handleComplete();
        }
        hiddenTime = 0;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [status, handleComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  // ============ Return ============
  return {
    // State
    time,
    initialTime: initialTimeRef.current,
    formattedTime,
    progress,
    status,

    // Derived state
    isRunning,
    isPaused,
    isFinished,
    isIdle,

    // Decomposed time
    hours,
    minutes,
    seconds,
    milliseconds,

    // Controls
    start,
    pause,
    stop,
    reset,
    restart,
    toggle,

    // Time manipulation
    addTime,
    subtractTime,
    setTime: setTimeValue,
  };
}
