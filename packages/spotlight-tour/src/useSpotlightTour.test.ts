import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEffect } from "react";
import {
  useSpotlightTour,
  resetTour,
  MUTATION_RERESOLVE_THROTTLE_MS,
} from "./useSpotlightTour";
import { SCROLL_SETTLE_QUIET_MS } from "./hooks/useAutoScroll";
import { readTourState, writeTourState } from "./persistence";
import type { TourStep } from "./types";

/** Append a target element with a mocked viewport rect. */
function addTarget(
  id: string,
  rect: { x?: number; y?: number; width?: number; height?: number } = {}
): HTMLElement {
  const el = document.createElement("div");
  el.id = id;
  const r = { x: 100, y: 100, width: 200, height: 50, ...rect };
  el.getBoundingClientRect = () =>
    ({
      ...r,
      top: r.y,
      left: r.x,
      right: r.x + r.width,
      bottom: r.y + r.height,
      toJSON: () => r,
    }) as DOMRect;
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("useSpotlightTour", () => {
  describe("initial state", () => {
    it("is closed by default with a null step", () => {
      addTarget("t0");
      const { result } = renderHook(() =>
        useSpotlightTour({ steps: [{ target: "#t0", content: "a" }] })
      );
      expect(result.current.open).toBe(false);
      expect(result.current.step).toBeNull();
      expect(result.current.stepIndex).toBe(0);
      expect(result.current.stepCount).toBe(1);
      expect(result.current.pending).toBe(false);
      expect(result.current.gated).toBe(false);
      expect(result.current.geometry).toEqual({ spotlight: null, tooltip: null });
    });

    it("respects defaultOpen and defaultStep", () => {
      addTarget("t0");
      addTarget("t1");
      const steps: TourStep[] = [
        { target: "#t0", content: "a" },
        { target: "#t1", content: "b" },
      ];
      const { result } = renderHook(() =>
        useSpotlightTour({ steps, defaultOpen: true, defaultStep: 1 })
      );
      expect(result.current.open).toBe(true);
      expect(result.current.stepIndex).toBe(1);
      expect(result.current.step).toBe(steps[1]);
      expect(result.current.isFirst).toBe(false);
      expect(result.current.isLast).toBe(true);
    });
  });

  describe("step machine bounds", () => {
    const setup = (extra: Partial<Parameters<typeof useSpotlightTour>[0]> = {}) => {
      addTarget("t0");
      addTarget("t1");
      addTarget("t2");
      const steps: TourStep[] = [
        { target: "#t0", content: "a" },
        { target: "#t1", content: "b" },
        { target: "#t2", content: "c" },
      ];
      return renderHook(() =>
        useSpotlightTour({ steps, defaultOpen: true, ...extra })
      );
    };

    it("next advances one step", () => {
      const { result } = setup();
      act(() => result.current.next());
      expect(result.current.stepIndex).toBe(1);
      expect(result.current.isFirst).toBe(false);
      expect(result.current.isLast).toBe(false);
    });

    it("next on the last step finishes the tour", () => {
      const onFinish = vi.fn();
      const { result } = setup({ defaultStep: 2, onFinish });
      act(() => result.current.next());
      expect(result.current.open).toBe(false);
      expect(onFinish).toHaveBeenCalledTimes(1);
      expect(result.current.stepIndex).toBe(2); // index untouched
    });

    it("prev on the first step is a no-op", () => {
      const { result } = setup();
      act(() => result.current.prev());
      expect(result.current.stepIndex).toBe(0);
      expect(result.current.open).toBe(true);
    });

    it("prev goes back one step", () => {
      const { result } = setup({ defaultStep: 2 });
      act(() => result.current.prev());
      expect(result.current.stepIndex).toBe(1);
    });

    it("goTo clamps below to 0 and above to the last index", () => {
      const { result } = setup();
      act(() => result.current.goTo(99));
      expect(result.current.stepIndex).toBe(2);
      act(() => result.current.goTo(-5));
      expect(result.current.stepIndex).toBe(0);
    });

    it("next/prev/skip/finish are no-ops while closed", () => {
      const onFinish = vi.fn();
      const onSkip = vi.fn();
      const { result } = setup({ defaultOpen: false, onFinish, onSkip });
      act(() => {
        result.current.next();
        result.current.prev();
        result.current.skip();
        result.current.finish();
      });
      expect(result.current.stepIndex).toBe(0);
      expect(result.current.open).toBe(false);
      expect(onFinish).not.toHaveBeenCalled();
      expect(onSkip).not.toHaveBeenCalled();
    });

    it("start opens the tour keeping the current index", () => {
      const { result } = setup({ defaultOpen: false, defaultStep: 1 });
      act(() => result.current.start());
      expect(result.current.open).toBe(true);
      expect(result.current.stepIndex).toBe(1);
    });

    it("start(at) jumps to a clamped step index", () => {
      const { result } = setup({ defaultOpen: false });
      act(() => result.current.start(99));
      expect(result.current.open).toBe(true);
      expect(result.current.stepIndex).toBe(2);
    });

    it("skip closes and reports the step it was on", () => {
      const onSkip = vi.fn();
      const { result } = setup({ defaultStep: 1, onSkip });
      act(() => result.current.skip());
      expect(result.current.open).toBe(false);
      expect(onSkip).toHaveBeenCalledTimes(1);
      expect(onSkip).toHaveBeenCalledWith(1);
    });

    it("finish closes and fires onFinish", () => {
      const onFinish = vi.fn();
      const { result } = setup({ onFinish });
      act(() => result.current.finish());
      expect(result.current.open).toBe(false);
      expect(onFinish).toHaveBeenCalledTimes(1);
    });

    it("next with zero steps finishes immediately", () => {
      const onFinish = vi.fn();
      const { result } = renderHook(() =>
        useSpotlightTour({ steps: [], defaultOpen: true, onFinish })
      );
      act(() => result.current.next());
      expect(result.current.open).toBe(false);
      expect(onFinish).toHaveBeenCalledTimes(1);
    });
  });

  describe("controlled / uncontrolled parity", () => {
    it("uncontrolled open fires onOpenChange when toggled", () => {
      addTarget("t0");
      const onOpenChange = vi.fn();
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [{ target: "#t0", content: "a" }],
          onOpenChange,
        })
      );
      act(() => result.current.start());
      expect(result.current.open).toBe(true);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      act(() => result.current.finish());
      expect(result.current.open).toBe(false);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("controlled open: state follows the prop, not the internal setter", () => {
      addTarget("t0");
      const onOpenChange = vi.fn();
      const { result, rerender } = renderHook(
        ({ open }: { open: boolean }) =>
          useSpotlightTour({
            steps: [{ target: "#t0", content: "a" }],
            open,
            onOpenChange,
          }),
        { initialProps: { open: false } }
      );
      act(() => result.current.start());
      // parent hasn't updated the prop yet
      expect(result.current.open).toBe(false);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      rerender({ open: true });
      expect(result.current.open).toBe(true);
    });

    it("uncontrolled step fires onStepChange on navigation", () => {
      addTarget("t0");
      addTarget("t1");
      const onStepChange = vi.fn();
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [
            { target: "#t0", content: "a" },
            { target: "#t1", content: "b" },
          ],
          defaultOpen: true,
          onStepChange,
        })
      );
      act(() => result.current.next());
      expect(result.current.stepIndex).toBe(1);
      expect(onStepChange).toHaveBeenCalledWith(1);
    });

    it("controlled step: state follows the prop, onStepChange still fires", () => {
      addTarget("t0");
      addTarget("t1");
      const onStepChange = vi.fn();
      const { result, rerender } = renderHook(
        ({ step }: { step: number }) =>
          useSpotlightTour({
            steps: [
              { target: "#t0", content: "a" },
              { target: "#t1", content: "b" },
            ],
            defaultOpen: true,
            step,
            onStepChange,
          }),
        { initialProps: { step: 0 } }
      );
      act(() => result.current.next());
      expect(result.current.stepIndex).toBe(0); // parent owns the state
      expect(onStepChange).toHaveBeenCalledWith(1);
      rerender({ step: 1 });
      expect(result.current.stepIndex).toBe(1);
      expect(result.current.isLast).toBe(true);
    });
  });

  describe("close double-fire guard", () => {
    it("finish() twice in one tick fires onFinish once", () => {
      addTarget("t0");
      const onFinish = vi.fn();
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [{ target: "#t0", content: "a" }],
          defaultOpen: true,
          onFinish,
        })
      );
      act(() => {
        result.current.finish();
        result.current.finish();
      });
      expect(onFinish).toHaveBeenCalledTimes(1);
    });

    it("skip() then finish() in one tick fires only onSkip", () => {
      addTarget("t0");
      const onFinish = vi.fn();
      const onSkip = vi.fn();
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [{ target: "#t0", content: "a" }],
          defaultOpen: true,
          onFinish,
          onSkip,
        })
      );
      act(() => {
        result.current.skip();
        result.current.finish();
      });
      expect(onSkip).toHaveBeenCalledTimes(1);
      expect(onFinish).not.toHaveBeenCalled();
    });

    it("the guard resets when the tour reopens", () => {
      addTarget("t0");
      const onFinish = vi.fn();
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [{ target: "#t0", content: "a" }],
          defaultOpen: true,
          onFinish,
        })
      );
      act(() => result.current.finish());
      act(() => result.current.start());
      act(() => result.current.finish());
      expect(onFinish).toHaveBeenCalledTimes(2);
    });
  });

  describe("step lifecycle callbacks", () => {
    it("fires onEnter/onLeave as the tour moves and closes", () => {
      addTarget("t0");
      addTarget("t1");
      const calls: string[] = [];
      const steps: TourStep[] = [
        {
          target: "#t0",
          content: "a",
          onEnter: () => calls.push("enter-0"),
          onLeave: () => calls.push("leave-0"),
        },
        {
          target: "#t1",
          content: "b",
          onEnter: () => calls.push("enter-1"),
          onLeave: () => calls.push("leave-1"),
        },
      ];
      const { result } = renderHook(() =>
        useSpotlightTour({ steps, defaultOpen: true })
      );
      expect(calls).toEqual(["enter-0"]);
      act(() => result.current.next());
      expect(calls).toEqual(["enter-0", "leave-0", "enter-1"]);
      act(() => result.current.finish());
      expect(calls).toEqual(["enter-0", "leave-0", "enter-1", "leave-1"]);
    });

    it("fires no onEnter/onLeave for a chain of skip-policy steps", () => {
      addTarget("t0");
      addTarget("t3");
      const skippedEnter = vi.fn();
      const skippedLeave = vi.fn();
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [
            { target: "#t0", content: "a" },
            {
              target: "#missing-1",
              content: "b",
              onEnter: skippedEnter,
              onLeave: skippedLeave,
            },
            {
              target: "#missing-2",
              content: "c",
              onEnter: skippedEnter,
              onLeave: skippedLeave,
            },
            { target: "#t3", content: "d" },
          ],
          defaultOpen: true,
        })
      );
      act(() => result.current.next());
      expect(result.current.stepIndex).toBe(3);
      expect(skippedEnter).not.toHaveBeenCalled();
      expect(skippedLeave).not.toHaveBeenCalled();
    });

    it("navigating away from a wait-pending step fires no phantom lifecycle for skipped steps", () => {
      vi.useFakeTimers();
      try {
        addTarget("t2");
        const calls: string[] = [];
        const { result } = renderHook(() =>
          useSpotlightTour({
            steps: [
              {
                target: "#never",
                content: "a",
                missingTarget: "wait",
                waitTimeout: 5000,
                onEnter: () => calls.push("enter-0"),
                onLeave: () => calls.push("leave-0"),
              },
              {
                target: "#missing",
                content: "b", // default skip policy — must fire neither
                onEnter: () => calls.push("enter-1"),
                onLeave: () => calls.push("leave-1"),
              },
              {
                target: "#t2",
                content: "c",
                onEnter: () => calls.push("enter-2"),
                onLeave: () => calls.push("leave-2"),
              },
            ],
            defaultOpen: true,
          })
        );
        expect(result.current.pending).toBe(true);
        expect(calls).toEqual(["enter-0"]);

        // next() mid-hold: the old step's pending state must not leak into
        // the new index — step 1 is skipped over with zero enter/leave, and
        // step 2's onEnter fires at settle.
        act(() => result.current.next());
        expect(result.current.stepIndex).toBe(2);
        expect(calls).toEqual(["enter-0", "leave-0", "enter-2"]);
      } finally {
        vi.useRealTimers();
      }
    });

    it("wait-then-skip counts as entered: exactly one onEnter/onLeave pair", () => {
      vi.useFakeTimers();
      try {
        addTarget("t1");
        const onEnter = vi.fn();
        const onLeave = vi.fn();
        const { result } = renderHook(() =>
          useSpotlightTour({
            steps: [
              {
                target: "#late",
                content: "a",
                missingTarget: "wait",
                waitTimeout: 500,
                onEnter,
                onLeave,
              },
              { target: "#t1", content: "b" },
            ],
            defaultOpen: true,
          })
        );
        // visibly pending on screen → entered
        expect(result.current.pending).toBe(true);
        expect(onEnter).toHaveBeenCalledTimes(1);
        expect(onLeave).not.toHaveBeenCalled();
        act(() => {
          vi.advanceTimersByTime(500);
        });
        // timed out and skipped → the matching onLeave fired
        expect(result.current.stepIndex).toBe(1);
        expect(onEnter).toHaveBeenCalledTimes(1);
        expect(onLeave).toHaveBeenCalledTimes(1);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("missing-target policies", () => {
    it("skip policy advances forward past an unresolvable step", () => {
      addTarget("t0");
      addTarget("t2");
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [
            { target: "#t0", content: "a" },
            { target: "#missing", content: "b" },
            { target: "#t2", content: "c" },
          ],
          defaultOpen: true,
        })
      );
      act(() => result.current.next());
      expect(result.current.stepIndex).toBe(2);
      expect(result.current.open).toBe(true);
    });

    it("skip policy advances backward when the user was navigating back", () => {
      addTarget("t0");
      addTarget("t2");
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [
            { target: "#t0", content: "a" },
            { target: "#missing", content: "b" },
            { target: "#t2", content: "c" },
          ],
          defaultOpen: true,
          defaultStep: 2,
        })
      );
      act(() => result.current.prev());
      expect(result.current.stepIndex).toBe(0);
    });

    it("flips forward when skipping backward runs past the first step", () => {
      addTarget("t1");
      addTarget("t2");
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [
            { target: "#missing", content: "a" },
            { target: "#t1", content: "b" },
            { target: "#t2", content: "c" },
          ],
          defaultOpen: true,
          defaultStep: 2,
        })
      );
      // navigating back lands on step 1 (resolvable)
      act(() => result.current.prev());
      expect(result.current.stepIndex).toBe(1);
      // back again: step 0 is missing and there is nothing before it,
      // so the skip flips forward and settles back on step 1
      act(() => result.current.prev());
      expect(result.current.stepIndex).toBe(1);
      expect(result.current.open).toBe(true);
    });

    it("skipping forward past the last step finishes the tour", () => {
      addTarget("t0");
      const onFinish = vi.fn();
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [
            { target: "#t0", content: "a" },
            { target: "#missing", content: "b" },
          ],
          defaultOpen: true,
          onFinish,
        })
      );
      act(() => result.current.next());
      expect(result.current.open).toBe(false);
      expect(onFinish).toHaveBeenCalledTimes(1);
    });

    it("finishes when every target is unresolvable", () => {
      const onFinish = vi.fn();
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [
            { target: "#missing-a", content: "a" },
            { target: "#missing-b", content: "b" },
          ],
          defaultOpen: true,
          onFinish,
        })
      );
      expect(result.current.open).toBe(false);
      expect(onFinish).toHaveBeenCalledTimes(1);
    });

    it("center policy keeps the step with a null spotlight", () => {
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [
            { target: "#missing", content: "a", missingTarget: "center" },
          ],
          defaultOpen: true,
        })
      );
      expect(result.current.open).toBe(true);
      expect(result.current.stepIndex).toBe(0);
      expect(result.current.pending).toBe(false);
      expect(result.current.geometry.spotlight).toBeNull();
    });

    it("a step without a target is centered (null spotlight, not pending)", () => {
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [{ content: "welcome" }],
          defaultOpen: true,
        })
      );
      expect(result.current.open).toBe(true);
      expect(result.current.pending).toBe(false);
      expect(result.current.geometry.spotlight).toBeNull();
      expect(result.current.step).not.toBeNull();
    });

    describe("wait policy (fake timers)", () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });
      afterEach(() => {
        vi.useRealTimers();
      });

      it("holds pending, then skips after the custom waitTimeout", () => {
        addTarget("t1");
        const { result } = renderHook(() =>
          useSpotlightTour({
            steps: [
              {
                target: "#late",
                content: "a",
                missingTarget: "wait",
                waitTimeout: 1000,
              },
              { target: "#t1", content: "b" },
            ],
            defaultOpen: true,
          })
        );
        expect(result.current.pending).toBe(true);
        act(() => {
          vi.advanceTimersByTime(999);
        });
        expect(result.current.pending).toBe(true);
        expect(result.current.stepIndex).toBe(0);
        act(() => {
          vi.advanceTimersByTime(1);
        });
        expect(result.current.pending).toBe(false);
        expect(result.current.stepIndex).toBe(1);
      });

      it("defaults waitTimeout to 3000ms", () => {
        addTarget("t1");
        const { result } = renderHook(() =>
          useSpotlightTour({
            steps: [
              { target: "#late", content: "a", missingTarget: "wait" },
              { target: "#t1", content: "b" },
            ],
            defaultOpen: true,
          })
        );
        act(() => {
          vi.advanceTimersByTime(2999);
        });
        expect(result.current.pending).toBe(true);
        act(() => {
          vi.advanceTimersByTime(1);
        });
        expect(result.current.stepIndex).toBe(1);
      });

      it("resolves the target if it appears by the timeout retry", () => {
        const { result } = renderHook(() =>
          useSpotlightTour({
            steps: [
              {
                target: "#late",
                content: "a",
                missingTarget: "wait",
                waitTimeout: 500,
              },
            ],
            defaultOpen: true,
          })
        );
        expect(result.current.pending).toBe(true);
        addTarget("late", { x: 10, y: 20, width: 30, height: 40 });
        act(() => {
          vi.advanceTimersByTime(500);
        });
        expect(result.current.pending).toBe(false);
        expect(result.current.open).toBe(true);
        expect(result.current.stepIndex).toBe(0);
        expect(result.current.geometry.spotlight).toEqual({
          x: 2,
          y: 12,
          width: 46,
          height: 56,
          radius: 8,
        });
      });

      it("cancels the wait timer when the tour closes early", () => {
        addTarget("t1");
        const { result } = renderHook(() =>
          useSpotlightTour({
            steps: [
              {
                target: "#late",
                content: "a",
                missingTarget: "wait",
                waitTimeout: 1000,
              },
              { target: "#t1", content: "b" },
            ],
            defaultOpen: true,
          })
        );
        act(() => result.current.skip());
        expect(result.current.pending).toBe(false);
        act(() => {
          vi.advanceTimersByTime(2000);
        });
        // timer was cleaned up — no skip-advance happened after close
        expect(result.current.stepIndex).toBe(0);
        expect(result.current.open).toBe(false);
      });
    });
  });

  describe("geometry", () => {
    it("pads the target rect with the default padding and radius", () => {
      addTarget("t0", { x: 100, y: 50, width: 200, height: 40 });
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [{ target: "#t0", content: "a" }],
          defaultOpen: true,
        })
      );
      expect(result.current.geometry.spotlight).toEqual({
        x: 92,
        y: 42,
        width: 216,
        height: 56,
        radius: 8,
      });
      expect(result.current.geometry.tooltip).toBeNull();
    });

    it("honors per-step spotlightPadding and spotlightRadius", () => {
      addTarget("t0", { x: 100, y: 50, width: 200, height: 40 });
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [
            {
              target: "#t0",
              content: "a",
              spotlightPadding: 10,
              spotlightRadius: 12,
            },
          ],
          defaultOpen: true,
        })
      );
      expect(result.current.geometry.spotlight).toEqual({
        x: 90,
        y: 40,
        width: 220,
        height: 60,
        radius: 12,
      });
    });

    it("resolves geometry.tooltip once a tooltip element is attached and measured", () => {
      addTarget("t0", { x: 362, y: 100, width: 300, height: 50 });
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [{ target: "#t0", content: "a", placement: "bottom" }],
          defaultOpen: true,
        })
      );
      // no tooltip element attached yet → position unresolved
      expect(result.current.geometry.tooltip).toBeNull();

      const tooltipEl = document.createElement("div");
      tooltipEl.getBoundingClientRect = () =>
        ({
          x: 0,
          y: 0,
          width: 300,
          height: 120,
          top: 0,
          left: 0,
          right: 300,
          bottom: 120,
          toJSON: () => ({}),
        }) as DOMRect;
      act(() => {
        (result.current.getTooltipProps().ref as (n: HTMLElement | null) => void)(
          tooltipEl
        );
      });

      // spotlight = target + default 8px padding → { x:354, y:92, w:316, h:66 }
      // bottom placement: y = 92+66+12 = 170, x centers on 512 → 362
      const tooltip = result.current.geometry.tooltip;
      expect(tooltip).toEqual({
        x: 362,
        y: 170,
        placement: "bottom",
        arrow: { x: 150, y: 0 },
      });
    });

    it("clears geometry.tooltip when the tooltip element detaches", () => {
      addTarget("t0", { x: 362, y: 100, width: 300, height: 50 });
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [{ target: "#t0", content: "a" }],
          defaultOpen: true,
        })
      );
      const tooltipEl = document.createElement("div");
      tooltipEl.getBoundingClientRect = () =>
        ({
          x: 0,
          y: 0,
          width: 300,
          height: 120,
          top: 0,
          left: 0,
          right: 300,
          bottom: 120,
          toJSON: () => ({}),
        }) as DOMRect;
      const setRef = result.current.getTooltipProps().ref as (
        n: HTMLElement | null
      ) => void;
      act(() => setRef(tooltipEl));
      expect(result.current.geometry.tooltip).not.toBeNull();
      act(() => setRef(null));
      expect(result.current.geometry.tooltip).toBeNull();
    });

    it("never positions a new step's tooltip with the previous step's measured size", () => {
      addTarget("t0", { x: 362, y: 100, width: 300, height: 50 });
      addTarget("t1", { x: 362, y: 300, width: 300, height: 50 });
      let tooltipSize = { width: 300, height: 120 };
      // Record per COMMIT (effect) — render-phase resets re-invoke the render
      // pass, and abandoned passes never reach the DOM.
      const committed: Array<{ x: number; y: number } | null> = [];
      const { result } = renderHook(() => {
        const r = useSpotlightTour({
          steps: [
            { target: "#t0", content: "a", placement: "bottom" },
            { target: "#t1", content: "bb", placement: "bottom" },
          ],
          defaultOpen: true,
        });
        useEffect(() => {
          committed.push(r.geometry.tooltip);
        });
        return r;
      });
      const tooltipEl = document.createElement("div");
      tooltipEl.getBoundingClientRect = () =>
        ({
          x: 0,
          y: 0,
          ...tooltipSize,
          top: 0,
          left: 0,
          right: tooltipSize.width,
          bottom: tooltipSize.height,
          toJSON: () => ({}),
        }) as DOMRect;
      act(() => {
        (result.current.getTooltipProps().ref as (n: HTMLElement | null) => void)(
          tooltipEl
        );
      });
      // step 0, 300x120 box → x centers to 362
      expect(result.current.geometry.tooltip).toMatchObject({ x: 362, y: 170 });

      // the next step's content will measure differently
      tooltipSize = { width: 200, height: 80 };
      committed.length = 0;
      act(() => result.current.goTo(1));

      // spotlight t1 {354,292,316,66} + fresh 200x80 box → {x:412, y:370}
      expect(result.current.geometry.tooltip).toEqual({
        x: 412,
        y: 370,
        placement: "bottom",
        arrow: { x: 100, y: 0 },
      });
      // the first committed state after the step change is null (measuring —
      // tooltip hidden)…
      expect(committed[0]).toBeNull();
      // …and no committed state ever centered with the old 300px width (which
      // would put x at 362): every resolved position used the fresh box
      expect(committed.some((g) => g !== null && g.x === 362)).toBe(false);
    });

    it("clears step and geometry when steps shrink below the active index", () => {
      addTarget("t0", { x: 0, y: 0, width: 50, height: 50 });
      addTarget("t1", { x: 100, y: 100, width: 50, height: 50 });
      const twoSteps: TourStep[] = [
        { target: "#t0", content: "a" },
        { target: "#t1", content: "b" },
      ];
      const { result, rerender } = renderHook(
        ({ steps }: { steps: TourStep[] }) =>
          useSpotlightTour({ steps, defaultOpen: true }),
        { initialProps: { steps: twoSteps } }
      );
      act(() => result.current.goTo(1));
      expect(result.current.geometry.spotlight).not.toBeNull();

      rerender({ steps: [twoSteps[0]!] }); // active index 1 is now out of range
      expect(result.current.open).toBe(true);
      expect(result.current.stepIndex).toBe(1);
      expect(result.current.step).toBeNull();
      expect(result.current.pending).toBe(false);
      expect(result.current.geometry.spotlight).toBeNull();
    });

    it("clears the spotlight when the tour closes", () => {
      addTarget("t0");
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [{ target: "#t0", content: "a" }],
          defaultOpen: true,
        })
      );
      expect(result.current.geometry.spotlight).not.toBeNull();
      act(() => result.current.finish());
      expect(result.current.geometry.spotlight).toBeNull();
    });
  });

  describe("reference stability", () => {
    it("keeps all controls and prop getters stable across rerenders", () => {
      addTarget("t0");
      const { result, rerender } = renderHook(() =>
        useSpotlightTour({
          steps: [{ target: "#t0", content: "a" }],
          defaultOpen: true,
        })
      );
      const first = result.current;
      rerender();
      expect(result.current.start).toBe(first.start);
      expect(result.current.next).toBe(first.next);
      expect(result.current.prev).toBe(first.prev);
      expect(result.current.goTo).toBe(first.goTo);
      expect(result.current.skip).toBe(first.skip);
      expect(result.current.finish).toBe(first.finish);
      expect(result.current.getTooltipProps).toBe(first.getTooltipProps);
      expect(result.current.getOverlayProps).toBe(first.getOverlayProps);
    });

    it("keeps controls stable across state transitions", () => {
      addTarget("t0");
      addTarget("t1");
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [
            { target: "#t0", content: "a" },
            { target: "#t1", content: "b" },
          ],
          defaultOpen: true,
        })
      );
      const first = result.current;
      act(() => result.current.next());
      expect(result.current.next).toBe(first.next);
      expect(result.current.prev).toBe(first.prev);
    });
  });

  describe("prop getters", () => {
    it("getTooltipProps returns a dialog role and a stable ref", () => {
      addTarget("t0");
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [{ target: "#t0", content: "a" }],
          defaultOpen: true,
        })
      );
      const props = result.current.getTooltipProps();
      expect(props.role).toBe("dialog");
      expect(typeof props.ref).toBe("function");
      expect(result.current.getTooltipProps().ref).toBe(props.ref);
      // attaching and detaching a node through the ref callback is safe
      const node = document.createElement("div");
      expect(() => {
        act(() => {
          (props.ref as (n: HTMLElement | null) => void)(node);
          (props.ref as (n: HTMLElement | null) => void)(null);
        });
      }).not.toThrow();
    });

    it("getOverlayProps hides the overlay from assistive tech", () => {
      addTarget("t0");
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [{ target: "#t0", content: "a" }],
          defaultOpen: true,
        })
      );
      expect(result.current.getOverlayProps()["aria-hidden"]).toBe(true);
    });

    it("getTooltipProps carries modal dialog semantics labelled by the title id", () => {
      addTarget("t0");
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [{ target: "#t0", title: "Hello", content: "a" }],
          defaultOpen: true,
        })
      );
      const props = result.current.getTooltipProps();
      expect(props["aria-modal"]).toBe(true);
      expect(props["aria-labelledby"]).toMatch(/^usefy-tour-title-/);
      expect(props["aria-describedby"]).toMatch(/^usefy-tour-content-/);
      expect(props["aria-label"]).toBeUndefined();
    });

    it("getTooltipProps falls back to a positional aria-label without a title", () => {
      addTarget("t0");
      addTarget("t1");
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [
            { target: "#t0", content: "a" },
            { target: "#t1", content: "b" },
          ],
          defaultOpen: true,
          defaultStep: 1,
        })
      );
      const props = result.current.getTooltipProps();
      expect(props["aria-labelledby"]).toBeUndefined();
      expect(props["aria-label"]).toBe("Step 2 of 2");
    });
  });

  describe("settled", () => {
    it("is false while closed and true once the target resolves", () => {
      addTarget("t0");
      const { result } = renderHook(() =>
        useSpotlightTour({ steps: [{ target: "#t0", content: "a" }] })
      );
      expect(result.current.settled).toBe(false);
      act(() => result.current.start());
      expect(result.current.settled).toBe(true);
      act(() => result.current.skip());
      expect(result.current.settled).toBe(false);
    });

    it("is true for centered steps", () => {
      const { result } = renderHook(() =>
        useSpotlightTour({ steps: [{ content: "modal" }], defaultOpen: true })
      );
      expect(result.current.settled).toBe(true);
    });

    it("stays false while a wait-policy target is pending, true after the retry resolves", () => {
      vi.useFakeTimers();
      try {
        const { result } = renderHook(() =>
          useSpotlightTour({
            steps: [
              {
                target: "#late",
                content: "a",
                missingTarget: "wait",
                waitTimeout: 500,
              },
            ],
            defaultOpen: true,
          })
        );
        expect(result.current.pending).toBe(true);
        expect(result.current.settled).toBe(false);

        addTarget("late"); // appears before the timeout retry
        act(() => void vi.advanceTimersByTime(500));
        expect(result.current.pending).toBe(false);
        expect(result.current.settled).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("auto-scroll integration", () => {
    it("reports pending during the scroll and sequences the scroll lock after settle", () => {
      vi.useFakeTimers();
      try {
        const el = addTarget("t0", { y: 2000 }); // off-viewport
        el.scrollIntoView = vi.fn();
        const { result } = renderHook(() =>
          useSpotlightTour({
            steps: [{ target: "#t0", content: "a" }],
            defaultOpen: true,
          })
        );
        // in flight: pending, and the body lock is held off so the page can move
        expect(result.current.pending).toBe(true);
        expect(document.body.style.overflow).not.toBe("hidden");

        act(() => void vi.advanceTimersByTime(0)); // deferred start
        expect(el.scrollIntoView).toHaveBeenCalledWith(
          expect.objectContaining({ block: "center" })
        );

        act(() => void vi.advanceTimersByTime(SCROLL_SETTLE_QUIET_MS));
        expect(result.current.pending).toBe(false);
        expect(document.body.style.overflow).toBe("hidden"); // lock engaged
      } finally {
        vi.useRealTimers();
      }
    });

    it("respects a per-step scrollIntoView: false opt-out", () => {
      const el = addTarget("t0", { y: 2000 });
      el.scrollIntoView = vi.fn();
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [{ target: "#t0", content: "a", scrollIntoView: false }],
          defaultOpen: true,
        })
      );
      expect(result.current.pending).toBe(false);
      expect(el.scrollIntoView).not.toHaveBeenCalled();
    });

    it("does not scroll for an in-viewport target", () => {
      const el = addTarget("t0", { y: 100 });
      el.scrollIntoView = vi.fn();
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [{ target: "#t0", content: "a" }],
          defaultOpen: true,
        })
      );
      expect(result.current.pending).toBe(false);
      expect(el.scrollIntoView).not.toHaveBeenCalled();
    });
  });

  describe("tourId persistence", () => {
    afterEach(() => {
      window.localStorage.clear();
    });

    it("writes a versioned 'finished' flag on finish and 'skipped' on skip", () => {
      addTarget("t0");
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [{ target: "#t0", content: "a" }],
          defaultOpen: true,
          tourId: "onboarding",
        })
      );
      act(() => result.current.finish());
      expect(readTourState("onboarding")).toMatchObject({
        v: 1,
        status: "finished",
      });

      window.localStorage.clear();
      const second = renderHook(() =>
        useSpotlightTour({
          steps: [{ target: "#t0", content: "a" }],
          defaultOpen: true,
          tourId: "onboarding",
        })
      );
      act(() => second.result.current.skip());
      expect(readTourState("onboarding")).toMatchObject({
        v: 1,
        status: "skipped",
      });
    });

    it("suppresses the automatic defaultOpen when a flag is stored", () => {
      addTarget("t0");
      writeTourState("onboarding", "finished");
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [{ target: "#t0", content: "a" }],
          defaultOpen: true,
          tourId: "onboarding",
        })
      );
      expect(result.current.open).toBe(false);
    });

    it("an explicit start() overrides the stored flag", () => {
      addTarget("t0");
      writeTourState("onboarding", "skipped");
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [{ target: "#t0", content: "a" }],
          defaultOpen: true,
          tourId: "onboarding",
        })
      );
      expect(result.current.open).toBe(false);
      act(() => result.current.start());
      expect(result.current.open).toBe(true);
    });

    it("resetTour revives the automatic open on the next mount", () => {
      addTarget("t0");
      writeTourState("onboarding", "finished");
      resetTour("onboarding");
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [{ target: "#t0", content: "a" }],
          defaultOpen: true,
          tourId: "onboarding",
        })
      );
      expect(result.current.open).toBe(true);
    });

    it("a corrupt stored value still suppresses (presence-based) without crashing", () => {
      addTarget("t0");
      window.localStorage.setItem("usefy-tour:onboarding", "{{{corrupt");
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [{ target: "#t0", content: "a" }],
          defaultOpen: true,
          tourId: "onboarding",
        })
      );
      expect(result.current.open).toBe(false);
    });

    it("without a tourId nothing is read or written", () => {
      addTarget("t0");
      const { result } = renderHook(() =>
        useSpotlightTour({
          steps: [{ target: "#t0", content: "a" }],
          defaultOpen: true,
        })
      );
      act(() => result.current.finish());
      expect(window.localStorage.length).toBe(0);
    });
  });

  describe("DOM mutation re-resolution", () => {
    it("a late-mounting target un-wedges a wait step before its timeout", async () => {
      vi.useFakeTimers();
      try {
        const { result } = renderHook(() =>
          useSpotlightTour({
            steps: [
              {
                target: "#late",
                content: "a",
                missingTarget: "wait",
                waitTimeout: 3000,
              },
            ],
            defaultOpen: true,
          })
        );
        expect(result.current.pending).toBe(true);

        // target mounts → MutationObserver microtask → throttled re-resolve
        await act(async () => {
          addTarget("late");
        });
        act(() => void vi.advanceTimersByTime(MUTATION_RERESOLVE_THROTTLE_MS));

        expect(result.current.pending).toBe(false);
        expect(result.current.settled).toBe(true);
        expect(result.current.geometry.spotlight).not.toBeNull();
      } finally {
        vi.useRealTimers();
      }
    });

    it("unrelated mutations do not restart a wait step's countdown", async () => {
      vi.useFakeTimers();
      try {
        addTarget("t1");
        const { result } = renderHook(() =>
          useSpotlightTour({
            steps: [
              {
                target: "#never",
                content: "a",
                missingTarget: "wait",
                waitTimeout: 500,
              },
              { target: "#t1", content: "b" },
            ],
            defaultOpen: true,
          })
        );
        expect(result.current.pending).toBe(true);

        // unrelated churn at t=200 re-runs resolution (target still missing)
        act(() => void vi.advanceTimersByTime(200));
        await act(async () => {
          document.body.appendChild(document.createElement("aside"));
        });
        act(() => void vi.advanceTimersByTime(MUTATION_RERESOLVE_THROTTLE_MS));
        expect(result.current.pending).toBe(true);

        // the deadline still measures from step entry: 500ms total, not 800
        act(() => void vi.advanceTimersByTime(200));
        expect(result.current.stepIndex).toBe(1); // timed out → skipped
        expect(result.current.pending).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });

    it("a target unmounting mid-step re-applies the 'skip' policy", async () => {
      vi.useFakeTimers();
      try {
        const el = addTarget("t0");
        addTarget("t1", { x: 400, y: 300 });
        const { result } = renderHook(() =>
          useSpotlightTour({
            steps: [
              { target: "#t0", content: "a" }, // default policy: skip
              { target: "#t1", content: "b" },
            ],
            defaultOpen: true,
          })
        );
        expect(result.current.stepIndex).toBe(0);
        expect(result.current.geometry.spotlight).not.toBeNull();

        await act(async () => {
          el.remove();
        });
        act(() => void vi.advanceTimersByTime(MUTATION_RERESOLVE_THROTTLE_MS));

        expect(result.current.stepIndex).toBe(1);
        expect(result.current.step?.content).toBe("b");
      } finally {
        vi.useRealTimers();
      }
    });

    it("a target unmounting mid-step with 'center' policy clears the spotlight and stays", async () => {
      vi.useFakeTimers();
      try {
        const el = addTarget("t0");
        const { result } = renderHook(() =>
          useSpotlightTour({
            steps: [
              { target: "#t0", content: "a", missingTarget: "center" },
            ],
            defaultOpen: true,
          })
        );
        expect(result.current.geometry.spotlight).not.toBeNull();

        await act(async () => {
          el.remove();
        });
        act(() => void vi.advanceTimersByTime(MUTATION_RERESOLVE_THROTTLE_MS));

        expect(result.current.stepIndex).toBe(0); // stayed
        expect(result.current.geometry.spotlight).toBeNull(); // centered now
        expect(result.current.settled).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });

    it("does not re-fire onEnter/onLeave on mutation-driven re-resolution", async () => {
      vi.useFakeTimers();
      try {
        addTarget("t0");
        const onEnter = vi.fn();
        const onLeave = vi.fn();
        const { result } = renderHook(() =>
          useSpotlightTour({
            steps: [{ target: "#t0", content: "a", onEnter, onLeave }],
            defaultOpen: true,
          })
        );
        expect(onEnter).toHaveBeenCalledTimes(1);

        // Unrelated mutation while the step is settled → no epoch churn, and
        // even a re-resolution would not re-fire the lifecycle.
        await act(async () => {
          document.body.appendChild(document.createElement("aside"));
        });
        act(() => void vi.advanceTimersByTime(MUTATION_RERESOLVE_THROTTLE_MS));
        expect(onEnter).toHaveBeenCalledTimes(1);
        expect(onLeave).not.toHaveBeenCalled();

        act(() => result.current.finish());
        expect(onLeave).toHaveBeenCalledTimes(1);
      } finally {
        vi.useRealTimers();
      }
    });

    it("a late-mounting advanceOn.selector target arms the gate", async () => {
      vi.useFakeTimers();
      try {
        addTarget("t0");
        addTarget("t1", { x: 400, y: 300 });
        const { result } = renderHook(() =>
          useSpotlightTour({
            steps: [
              {
                target: "#t0",
                content: "a",
                advanceOn: { event: "click", selector: "#late-gate" },
              },
              { target: "#t1", content: "b" },
            ],
            defaultOpen: true,
          })
        );
        expect(result.current.gated).toBe(true);

        // clicking nothing (target absent) cannot advance; now mount it
        let gateBtn: HTMLElement;
        await act(async () => {
          gateBtn = document.createElement("button");
          gateBtn.id = "late-gate";
          document.body.appendChild(gateBtn);
        });
        act(() => void vi.advanceTimersByTime(MUTATION_RERESOLVE_THROTTLE_MS));

        act(() => {
          gateBtn!.dispatchEvent(new Event("click"));
        });
        expect(result.current.stepIndex).toBe(1);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});

describe("resetTour", () => {
  it("removes the persisted usefy-tour:<tourId> key", () => {
    window.localStorage.setItem("usefy-tour:my-tour", "finished");
    resetTour("my-tour");
    expect(window.localStorage.getItem("usefy-tour:my-tour")).toBeNull();
  });

  it("is a no-op for a tour that was never persisted", () => {
    expect(() => resetTour("never-persisted")).not.toThrow();
  });

  it("swallows storage errors (privacy mode / disabled storage)", () => {
    const spy = vi
      .spyOn(Storage.prototype, "removeItem")
      .mockImplementation(() => {
        throw new Error("denied");
      });
    expect(() => resetTour("blocked")).not.toThrow();
    spy.mockRestore();
  });
});
