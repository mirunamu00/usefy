import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useTimer, ms } from "./useTimer";

describe("useTimer", () => {
  beforeEach(() => {
    // Use fake timers including performance.now()
    vi.useFakeTimers({
      toFake: [
        "setInterval",
        "clearInterval",
        "setTimeout",
        "clearTimeout",
        "performance",
      ],
    });

    // Mock requestAnimationFrame for testing
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      return setTimeout(() => {
        cb(performance.now());
      }, 16) as unknown as number;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
      clearTimeout(id);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // ============ ms Helper ============
  describe("ms helper", () => {
    it("should convert seconds to milliseconds", () => {
      expect(ms.seconds(1)).toBe(1000);
      expect(ms.seconds(60)).toBe(60000);
    });

    it("should convert minutes to milliseconds", () => {
      expect(ms.minutes(1)).toBe(60000);
      expect(ms.minutes(5)).toBe(300000);
    });

    it("should convert hours to milliseconds", () => {
      expect(ms.hours(1)).toBe(3600000);
      expect(ms.hours(2)).toBe(7200000);
    });

    it("should allow combining time units", () => {
      expect(ms.hours(1) + ms.minutes(30) + ms.seconds(45)).toBe(5445000);
    });
  });

  // ============ Initialization ============
  describe("initialization", () => {
    it("should initialize with default options", () => {
      const { result } = renderHook(() => useTimer(60000));

      expect(result.current.time).toBe(60000);
      expect(result.current.initialTime).toBe(60000);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isFinished).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.isIdle).toBe(true);
      expect(result.current.status).toBe("idle");
      expect(result.current.progress).toBe(0);
    });

    it("should initialize with correct formatted time (MM:SS default)", () => {
      const { result } = renderHook(() => useTimer(90000)); // 90 seconds

      expect(result.current.formattedTime).toBe("01:30");
    });

    it("should not start automatically by default", () => {
      const { result } = renderHook(() => useTimer(60000));

      expect(result.current.isRunning).toBe(false);
      expect(result.current.status).toBe("idle");
    });

    it("should start automatically when autoStart is true", async () => {
      const { result } = renderHook(() => useTimer(60000, { autoStart: true }));

      // autoStart runs in useEffect, flush effects
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(result.current.isRunning).toBe(true);
      expect(result.current.status).toBe("running");
    });

    it("should handle zero initial time", () => {
      const { result } = renderHook(() => useTimer(0));

      expect(result.current.time).toBe(0);
      expect(result.current.isFinished).toBe(true);
      expect(result.current.status).toBe("finished");
      expect(result.current.progress).toBe(100);
    });

    it("should handle negative initial time by treating as zero", () => {
      const { result } = renderHook(() => useTimer(-1000));

      expect(result.current.time).toBe(0);
      expect(result.current.isFinished).toBe(true);
    });

    it("should decompose time correctly", () => {
      // 1 hour, 30 minutes, 45 seconds = 5445000ms
      const { result } = renderHook(() => useTimer(5445000));

      expect(result.current.hours).toBe(1);
      expect(result.current.minutes).toBe(30);
      expect(result.current.seconds).toBe(45);
    });
  });

  // ============ Timer Controls ============
  describe("timer controls", () => {
    describe("start", () => {
      it("should start the timer", () => {
        const { result } = renderHook(() => useTimer(60000));

        act(() => {
          result.current.start();
        });

        expect(result.current.isRunning).toBe(true);
        expect(result.current.status).toBe("running");
      });

      it("should call onStart callback", () => {
        const onStart = vi.fn();
        const { result } = renderHook(() => useTimer(60000, { onStart }));

        act(() => {
          result.current.start();
        });

        expect(onStart).toHaveBeenCalledTimes(1);
      });

      it("should not restart if already running", () => {
        const onStart = vi.fn();
        const { result } = renderHook(() => useTimer(60000, { onStart }));

        act(() => {
          result.current.start();
        });

        act(() => {
          result.current.start();
        });

        expect(onStart).toHaveBeenCalledTimes(1);
      });

      it("should not start if timer is finished", () => {
        const { result } = renderHook(() => useTimer(0));

        expect(result.current.isFinished).toBe(true);

        act(() => {
          result.current.start();
        });

        expect(result.current.isRunning).toBe(false);
        expect(result.current.isFinished).toBe(true);
      });
    });

    describe("pause", () => {
      it("should pause the timer", () => {
        const { result } = renderHook(() => useTimer(60000));

        act(() => {
          result.current.start();
        });

        expect(result.current.isRunning).toBe(true);

        act(() => {
          result.current.pause();
        });

        expect(result.current.isRunning).toBe(false);
        expect(result.current.isPaused).toBe(true);
        expect(result.current.status).toBe("paused");
      });

      it("should call onPause callback", () => {
        const onPause = vi.fn();
        const { result } = renderHook(() => useTimer(60000, { onPause }));

        act(() => {
          result.current.start();
        });

        act(() => {
          result.current.pause();
        });

        expect(onPause).toHaveBeenCalledTimes(1);
      });

      it("should do nothing if not running", () => {
        const onPause = vi.fn();
        const { result } = renderHook(() => useTimer(60000, { onPause }));

        act(() => {
          result.current.pause();
        });

        expect(onPause).not.toHaveBeenCalled();
      });

      it("should preserve remaining time when paused", () => {
        const { result } = renderHook(() => useTimer(60000, { interval: 100 }));

        act(() => {
          result.current.start();
        });

        // Advance time and trigger interval
        act(() => {
          vi.advanceTimersByTime(1000);
        });

        const timeBeforePause = result.current.time;
        expect(timeBeforePause).toBeLessThan(60000);

        act(() => {
          result.current.pause();
        });

        // Time should be preserved
        expect(result.current.time).toBe(timeBeforePause);

        // Advance more time - paused, so time shouldn't change
        act(() => {
          vi.advanceTimersByTime(5000);
        });

        expect(result.current.time).toBe(timeBeforePause);
      });
    });

    describe("stop", () => {
      it("should stop the timer and set status to idle", () => {
        const { result } = renderHook(() => useTimer(60000, { interval: 100 }));

        act(() => {
          result.current.start();
        });

        act(() => {
          vi.advanceTimersByTime(1000);
        });

        // Store time before stop (should have decreased)
        const timeBeforeStop = result.current.time;
        expect(timeBeforeStop).toBeLessThan(60000);

        act(() => {
          result.current.stop();
        });

        expect(result.current.isRunning).toBe(false);
        expect(result.current.isIdle).toBe(true);
        expect(result.current.status).toBe("idle");
        // Time should be preserved at whatever it was when stopped
        expect(result.current.time).toBe(timeBeforeStop);
      });

      it("should call onStop callback", () => {
        const onStop = vi.fn();
        const { result } = renderHook(() => useTimer(60000, { onStop }));

        act(() => {
          result.current.start();
        });

        act(() => {
          result.current.stop();
        });

        expect(onStop).toHaveBeenCalledTimes(1);
      });
    });

    describe("reset", () => {
      it("should reset to initial time", () => {
        const { result } = renderHook(() => useTimer(60000, { interval: 100 }));

        act(() => {
          result.current.start();
        });

        act(() => {
          vi.advanceTimersByTime(5000);
        });

        expect(result.current.time).toBeLessThan(60000);

        act(() => {
          result.current.reset();
        });

        expect(result.current.time).toBe(60000);
        expect(result.current.isRunning).toBe(false);
        expect(result.current.isIdle).toBe(true);
      });

      it("should call onReset callback", () => {
        const onReset = vi.fn();
        const { result } = renderHook(() => useTimer(60000, { onReset }));

        act(() => {
          result.current.reset();
        });

        expect(onReset).toHaveBeenCalledTimes(1);
      });

      it("should clear finished state", () => {
        const { result } = renderHook(() => useTimer(1000, { interval: 100 }));

        // Start and complete the timer
        act(() => {
          result.current.start();
        });

        act(() => {
          vi.advanceTimersByTime(1500);
        });

        expect(result.current.isFinished).toBe(true);
        expect(result.current.time).toBe(0);

        act(() => {
          result.current.reset();
        });

        expect(result.current.isFinished).toBe(false);
        expect(result.current.time).toBe(1000);
        expect(result.current.isIdle).toBe(true);
      });
    });

    describe("restart", () => {
      it("should reset and start immediately", () => {
        const { result } = renderHook(() => useTimer(60000, { interval: 100 }));

        act(() => {
          result.current.start();
        });

        act(() => {
          vi.advanceTimersByTime(5000);
        });

        expect(result.current.time).toBeLessThan(60000);

        act(() => {
          result.current.restart();
        });

        expect(result.current.time).toBe(60000);
        expect(result.current.isRunning).toBe(true);
      });

      it("should call onReset and onStart callbacks", () => {
        const onReset = vi.fn();
        const onStart = vi.fn();
        const { result } = renderHook(() =>
          useTimer(60000, { onReset, onStart })
        );

        act(() => {
          result.current.restart();
        });

        expect(onReset).toHaveBeenCalledTimes(1);
        expect(onStart).toHaveBeenCalledTimes(1);
      });
    });

    describe("toggle", () => {
      it("should start when idle", () => {
        const { result } = renderHook(() => useTimer(60000));

        expect(result.current.isIdle).toBe(true);

        act(() => {
          result.current.toggle();
        });

        expect(result.current.isRunning).toBe(true);
      });

      it("should pause when running", () => {
        const { result } = renderHook(() => useTimer(60000));

        act(() => {
          result.current.start();
        });

        expect(result.current.isRunning).toBe(true);

        act(() => {
          result.current.toggle();
        });

        expect(result.current.isPaused).toBe(true);
      });

      it("should resume when paused", () => {
        const { result } = renderHook(() => useTimer(60000));

        act(() => {
          result.current.start();
        });

        act(() => {
          result.current.pause();
        });

        expect(result.current.isPaused).toBe(true);

        act(() => {
          result.current.toggle();
        });

        expect(result.current.isRunning).toBe(true);
      });

      it("should do nothing when finished", () => {
        const { result } = renderHook(() => useTimer(0));

        expect(result.current.isFinished).toBe(true);

        act(() => {
          result.current.toggle();
        });

        expect(result.current.isFinished).toBe(true);
        expect(result.current.isRunning).toBe(false);
      });
    });
  });

  // ============ Time Manipulation ============
  describe("time manipulation", () => {
    describe("addTime", () => {
      it("should add time in milliseconds", () => {
        const { result } = renderHook(() => useTimer(60000));

        act(() => {
          result.current.addTime(10000);
        });

        expect(result.current.time).toBe(70000);
      });

      it("should clear isFinished when adding time to completed timer", () => {
        const { result } = renderHook(() => useTimer(1000, { interval: 100 }));

        // Complete the timer first
        act(() => {
          result.current.start();
        });

        act(() => {
          vi.advanceTimersByTime(1500);
        });

        expect(result.current.isFinished).toBe(true);
        expect(result.current.time).toBe(0);

        act(() => {
          result.current.addTime(5000);
        });

        expect(result.current.time).toBe(5000);
        expect(result.current.isFinished).toBe(false);
        expect(result.current.isIdle).toBe(true);
      });
    });

    describe("subtractTime", () => {
      it("should subtract time correctly", () => {
        const { result } = renderHook(() => useTimer(60000));

        act(() => {
          result.current.subtractTime(10000);
        });

        expect(result.current.time).toBe(50000);
      });

      it("should not go below zero", () => {
        const { result } = renderHook(() => useTimer(10000));

        act(() => {
          result.current.subtractTime(20000);
        });

        expect(result.current.time).toBe(0);
      });
    });

    describe("setTime", () => {
      it("should set time to specific value", () => {
        const { result } = renderHook(() => useTimer(60000));

        act(() => {
          result.current.setTime(30000);
        });

        expect(result.current.time).toBe(30000);
      });

      it("should clear isFinished when setting positive value", () => {
        const { result } = renderHook(() => useTimer(1000, { interval: 100 }));

        // Complete the timer first
        act(() => {
          result.current.start();
        });

        act(() => {
          vi.advanceTimersByTime(1500);
        });

        expect(result.current.isFinished).toBe(true);

        act(() => {
          result.current.setTime(30000);
        });

        expect(result.current.isFinished).toBe(false);
        expect(result.current.time).toBe(30000);
      });

      it("should not allow negative values", () => {
        const { result } = renderHook(() => useTimer(60000));

        act(() => {
          result.current.setTime(-5000);
        });

        expect(result.current.time).toBe(0);
      });
    });
  });

  // ============ Timer Countdown ============
  describe("timer countdown", () => {
    it("should count down over time", () => {
      const { result } = renderHook(() => useTimer(10000, { interval: 100 }));

      act(() => {
        result.current.start();
      });

      expect(result.current.time).toBe(10000);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.time).toBeLessThan(10000);
    });

    it("should call onTick on each interval", () => {
      const onTick = vi.fn();
      const { result } = renderHook(() =>
        useTimer(10000, { interval: 100, onTick })
      );

      act(() => {
        result.current.start();
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(onTick).toHaveBeenCalled();
    });

    it("should call onComplete when timer finishes", () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useTimer(1000, { interval: 100, onComplete })
      );

      act(() => {
        result.current.start();
      });

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("should set status to finished when complete", () => {
      const { result } = renderHook(() => useTimer(1000, { interval: 100 }));

      act(() => {
        result.current.start();
      });

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(result.current.isFinished).toBe(true);
      expect(result.current.status).toBe("finished");
      expect(result.current.time).toBe(0);
    });
  });

  // ============ Formatting ============
  describe("formatting", () => {
    it("should format HH:MM:SS correctly", () => {
      const { result } = renderHook(
        () => useTimer(3661000, { format: "HH:MM:SS" }) // 1h 1m 1s
      );

      expect(result.current.formattedTime).toBe("01:01:01");
    });

    it("should format MM:SS correctly (default)", () => {
      const { result } = renderHook(() => useTimer(125000)); // 2m 5s

      expect(result.current.formattedTime).toBe("02:05");
    });

    it("should format SS correctly", () => {
      const { result } = renderHook(
        () => useTimer(45000, { format: "SS" }) // 45 seconds
      );

      expect(result.current.formattedTime).toBe("45");
    });

    it("should format mm:ss.SSS correctly", () => {
      const { result } = renderHook(
        () => useTimer(125500, { format: "mm:ss.SSS" }) // 2m 5.5s
      );

      // 125500ms = 125s + 500ms = 2m 5s + 500ms
      expect(result.current.formattedTime).toBe("02:05.500");
    });

    it("should support custom formatter function", () => {
      const customFormatter = (timeMs: number) =>
        `${Math.floor(timeMs / 1000)} seconds remaining`;

      const { result } = renderHook(() =>
        useTimer(45000, { format: customFormatter })
      );

      expect(result.current.formattedTime).toBe("45 seconds remaining");
    });
  });

  // ============ Progress ============
  describe("progress", () => {
    it("should be 0 at start", () => {
      const { result } = renderHook(() => useTimer(60000));

      expect(result.current.progress).toBe(0);
    });

    it("should be 100 at completion", () => {
      const { result } = renderHook(() => useTimer(1000, { interval: 100 }));

      act(() => {
        result.current.start();
      });

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(result.current.progress).toBe(100);
    });

    it("should calculate intermediate progress correctly", () => {
      const { result } = renderHook(() => useTimer(10000));

      // Manually set time to test progress calculation
      act(() => {
        result.current.setTime(5000); // Half the time
      });

      expect(result.current.progress).toBe(50);
    });

    it("should handle zero initial time", () => {
      const { result } = renderHook(() => useTimer(0));

      expect(result.current.progress).toBe(100);
    });
  });

  // ============ Loop Option ============
  describe("loop option", () => {
    it("should restart timer when completed with loop option", () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useTimer(1000, {
          interval: 100,
          loop: true,
          onComplete,
        })
      );

      act(() => {
        result.current.start();
      });

      // Complete the timer
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(result.current.time).toBe(1000); // Reset to initial
      expect(result.current.isRunning).toBe(true); // Still running
    });
  });

  // ============ Function Reference Stability ============
  describe("function reference stability", () => {
    it("should maintain stable start reference", () => {
      const { result, rerender } = renderHook(() => useTimer(60000));

      const initialStart = result.current.start;
      rerender();

      expect(result.current.start).toBe(initialStart);
    });

    it("should maintain stable pause reference", () => {
      const { result, rerender } = renderHook(() => useTimer(60000));

      const initialPause = result.current.pause;
      rerender();

      expect(result.current.pause).toBe(initialPause);
    });

    it("should maintain stable reset reference", () => {
      const { result, rerender } = renderHook(() => useTimer(60000));

      const initialReset = result.current.reset;
      rerender();

      expect(result.current.reset).toBe(initialReset);
    });

    it("should maintain stable toggle reference", () => {
      const { result, rerender } = renderHook(() => useTimer(60000));

      const initialToggle = result.current.toggle;
      rerender();

      expect(result.current.toggle).toBe(initialToggle);
    });

    it("should maintain stable addTime reference", () => {
      const { result, rerender } = renderHook(() => useTimer(60000));

      const initialAddTime = result.current.addTime;
      rerender();

      expect(result.current.addTime).toBe(initialAddTime);
    });

    it("should maintain stable subtractTime reference", () => {
      const { result, rerender } = renderHook(() => useTimer(60000));

      const initialSubtractTime = result.current.subtractTime;
      rerender();

      expect(result.current.subtractTime).toBe(initialSubtractTime);
    });

    it("should maintain stable setTime reference", () => {
      const { result, rerender } = renderHook(() => useTimer(60000));

      const initialSetTime = result.current.setTime;
      rerender();

      expect(result.current.setTime).toBe(initialSetTime);
    });
  });

  // ============ Cleanup ============
  describe("cleanup", () => {
    it("should clean up timer on unmount", () => {
      const clearIntervalSpy = vi.spyOn(window, "clearInterval");
      const { result, unmount } = renderHook(() => useTimer(60000));

      act(() => {
        result.current.start();
      });

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it("should clean up RAF on unmount when using useRAF", () => {
      const cancelAnimationFrameSpy = vi.spyOn(window, "cancelAnimationFrame");
      const { result, unmount } = renderHook(() =>
        useTimer(60000, { useRAF: true })
      );

      act(() => {
        result.current.start();
      });

      unmount();

      expect(cancelAnimationFrameSpy).toHaveBeenCalled();
    });
  });

  // ============ InitialTime Changes ============
  describe("initialTime changes", () => {
    it("should update time when initialTime changes (not running)", () => {
      const { result, rerender } = renderHook(
        ({ initialTime }) => useTimer(initialTime),
        { initialProps: { initialTime: 60000 } }
      );

      expect(result.current.time).toBe(60000);

      rerender({ initialTime: 120000 });

      expect(result.current.time).toBe(120000);
    });

    it("should not update time when running", () => {
      const { result, rerender } = renderHook(
        ({ initialTime }) => useTimer(initialTime),
        { initialProps: { initialTime: 60000 } }
      );

      act(() => {
        result.current.start();
      });

      rerender({ initialTime: 120000 });

      // Should still be around 60000, not 120000
      expect(result.current.time).toBeLessThanOrEqual(60000);
    });
  });

  // ============ Resume from Pause ============
  describe("resume from pause", () => {
    it("should resume from paused state correctly", () => {
      const { result } = renderHook(() => useTimer(10000, { interval: 100 }));

      act(() => {
        result.current.start();
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      act(() => {
        result.current.pause();
      });

      const pausedTime = result.current.time;
      expect(result.current.isPaused).toBe(true);
      expect(pausedTime).toBeLessThan(10000);

      // Wait some time while paused
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Time should not have changed while paused
      expect(result.current.time).toBe(pausedTime);

      // Resume
      act(() => {
        result.current.start();
      });

      expect(result.current.isRunning).toBe(true);

      // Now advance time - should continue counting down
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.time).toBeLessThan(pausedTime);
    });
  });

  // ============ Edge Cases ============
  describe("edge cases", () => {
    it("should handle very large initial time", () => {
      const { result } = renderHook(() => useTimer(86400000)); // 24 hours

      expect(result.current.time).toBe(86400000);
      expect(result.current.hours).toBe(24);
    });

    it("should handle rapid start/pause cycles", () => {
      const { result } = renderHook(() => useTimer(60000));

      for (let i = 0; i < 10; i++) {
        act(() => {
          result.current.start();
        });
        act(() => {
          result.current.pause();
        });
      }

      expect(result.current.isPaused).toBe(true);
      expect(result.current.time).toBeLessThanOrEqual(60000);
    });

    it("should handle multiple resets", () => {
      const { result } = renderHook(() => useTimer(60000));

      act(() => {
        result.current.start();
      });

      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.reset();
        });
      }

      expect(result.current.time).toBe(60000);
      expect(result.current.isIdle).toBe(true);
    });
  });

  // ============ Multiple Instances ============
  describe("multiple instances", () => {
    it("should maintain isolated state between instances", () => {
      const { result: timer1 } = renderHook(() => useTimer(60000));
      const { result: timer2 } = renderHook(() => useTimer(30000));

      expect(timer1.current.time).toBe(60000);
      expect(timer2.current.time).toBe(30000);

      act(() => {
        timer1.current.start();
      });

      expect(timer1.current.isRunning).toBe(true);
      expect(timer2.current.isRunning).toBe(false);

      act(() => {
        timer2.current.addTime(5000);
      });

      expect(timer1.current.time).toBe(60000);
      expect(timer2.current.time).toBe(35000);
    });
  });
});
