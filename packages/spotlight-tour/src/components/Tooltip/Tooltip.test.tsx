import { describe, it, expect, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { Tooltip, type TooltipProps } from "./Tooltip";
import type { SpotlightGeometry, TourController } from "../../types";

// ---------------------------------------------------------------------------
// The Tooltip's glide-vs-snap decision is a pure function of its incoming
// props (position + step index + centered), so it's tested here in isolation
// with an explicit, controlled prop sequence — one commit per change. That
// sidesteps the multi-commit geometry-settling cascade (and act()'s eager
// passive-effect flushing) of a full <SpotlightTour> step change, which makes
// the transition class non-deterministic to observe end-to-end.
//
// Contract:
//   • step-to-step move (target → target) → glide (transition ENABLED)
//   • live tracking (same step, new coords) → snap (transition DISABLED)
//   • first paint & centered↔targeted → snap
//   • a step change never blanks/hides the box (position retained across the
//     re-measure window)
// ---------------------------------------------------------------------------

type Pos = NonNullable<SpotlightGeometry["tooltip"]>;

const pos = (x: number, y: number): Pos => ({
  x,
  y,
  placement: "right",
  arrow: { x: 0, y: 0 },
});

const controller: TourController = {
  start: vi.fn(),
  next: vi.fn(),
  prev: vi.fn(),
  goTo: vi.fn(),
  skip: vi.fn(),
  finish: vi.fn(),
};

function props(overrides: Partial<TooltipProps>): TooltipProps {
  return {
    step: { content: "hello" },
    index: 0,
    count: 3,
    position: pos(100, 100),
    transitionDuration: 300,
    centered: false,
    gated: false,
    isFirst: true,
    isLast: false,
    labels: {
      back: "Back",
      next: "Next",
      skip: "Skip",
      finish: "Done",
      close: "Close",
      gatedHint: "hint",
    },
    showProgress: true,
    showCounter: true,
    showSkip: true,
    showClose: true,
    controller,
    tooltipProps: { ref: () => {}, role: "dialog" },
    ...overrides,
  };
}

const tip = () => document.querySelector("[data-tour-tooltip]") as HTMLElement;
/** Scoped CSS-module classes are `_name_hash`; match the token. */
const isSnapped = () => /noTransition/.test(tip().className);
const isHidden = () => /measuring/.test(tip().className);

describe("Tooltip motion", () => {
  it("snaps on the first positioned paint (no from-state)", () => {
    render(<Tooltip {...props({ index: 0, position: pos(100, 100) })} />);
    expect(tip().style.left).toBe("100px");
    expect(isSnapped()).toBe(true);
    expect(isHidden()).toBe(false);
  });

  it("hides (measuring) before the first measurement, then reveals", () => {
    const { rerender } = render(
      <Tooltip {...props({ index: 0, position: null })} />
    );
    // Not centered and never positioned → hidden, no stale coords.
    expect(isHidden()).toBe(true);
    expect(tip().style.left).toBe("");

    rerender(<Tooltip {...props({ index: 0, position: pos(40, 60) })} />);
    expect(isHidden()).toBe(false);
    expect(tip().style.left).toBe("40px");
    expect(isSnapped()).toBe(true); // first paint still snaps
  });

  it("glides on a target→target step move", () => {
    const { rerender } = render(
      <Tooltip {...props({ index: 0, position: pos(100, 100) })} />
    );
    expect(isSnapped()).toBe(true);

    // New step, new position, in one commit (the net result of the cascade).
    rerender(
      <Tooltip {...props({ index: 1, isFirst: false, position: pos(500, 300) })} />
    );
    expect(tip().style.left).toBe("500px");
    expect(isSnapped()).toBe(false); // transition ENABLED → glide
  });

  it("snaps for live tracking (same step, new coords)", () => {
    const { rerender } = render(
      <Tooltip {...props({ index: 1, isFirst: false, position: pos(500, 300) })} />
    );
    // A tracking frame: same index, position nudged.
    rerender(
      <Tooltip {...props({ index: 1, isFirst: false, position: pos(505, 305) })} />
    );
    expect(tip().style.left).toBe("505px");
    expect(isSnapped()).toBe(true); // transition DISABLED → zero-lag stick
  });

  it("retains the previous position across the re-measure window (no flash)", () => {
    const { rerender } = render(
      <Tooltip {...props({ index: 0, position: pos(100, 100) })} />
    );
    // Step changed but the new content isn't measured yet (position null):
    // the box must hold the last coordinates, not blank or hide.
    rerender(
      <Tooltip {...props({ index: 1, isFirst: false, position: null })} />
    );
    expect(tip().style.left).toBe("100px"); // retained, never cleared
    expect(isHidden()).toBe(false); // never flashes hidden
  });

  it("snaps when leaving a centered step for a target step", () => {
    const { rerender } = render(
      <Tooltip {...props({ index: 0, centered: true, position: null })} />
    );
    // Centered → targeted: no positioned from-state, so it must snap (the
    // transform drop would otherwise read as a jump-then-slide).
    rerender(
      <Tooltip {...props({ index: 1, isFirst: false, position: pos(500, 300) })} />
    );
    expect(tip().style.left).toBe("500px");
    expect(isSnapped()).toBe(true);
  });

  it("returns to snap mode after the glide's duration (then tracking snaps)", () => {
    vi.useFakeTimers();
    try {
      const { rerender } = render(
        <Tooltip {...props({ index: 0, position: pos(100, 100), transitionDuration: 300 })} />
      );
      // Step move → armed → glide.
      rerender(
        <Tooltip
          {...props({ index: 1, isFirst: false, position: pos(500, 300), transitionDuration: 300 })}
        />
      );
      expect(isSnapped()).toBe(false);

      // After the glide's duration (+buffer) the disarm timer fires and the
      // tooltip returns to snap mode, so subsequent tracking sticks 1:1.
      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(isSnapped()).toBe(true);

      // A tracking nudge on the same step now snaps.
      rerender(
        <Tooltip
          {...props({ index: 1, isFirst: false, position: pos(506, 302), transitionDuration: 300 })}
        />
      );
      expect(tip().style.left).toBe("506px");
      expect(isSnapped()).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("reschedules the disarm on back-to-back step moves (second glide runs full length)", () => {
    vi.useFakeTimers();
    try {
      const { rerender } = render(
        <Tooltip {...props({ index: 0, position: pos(100, 100), transitionDuration: 300 })} />
      );
      // First step move at t=0 → armed; its disarm would fire at t=350.
      rerender(
        <Tooltip
          {...props({ index: 1, isFirst: false, position: pos(300, 200), transitionDuration: 300 })}
        />
      );
      expect(isSnapped()).toBe(false);

      // A second step move arrives at t=100, while still armed.
      act(() => {
        vi.advanceTimersByTime(100);
      });
      rerender(
        <Tooltip
          {...props({ index: 2, isFirst: false, position: pos(600, 400), transitionDuration: 300 })}
        />
      );
      expect(isSnapped()).toBe(false);

      // t=400: past the FIRST move's original deadline (350) but inside the
      // second glide — the disarm must have been rescheduled, still gliding.
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(isSnapped()).toBe(false);

      // t=500: past the SECOND move's deadline (100 + 350) → back to snap.
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(isSnapped()).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("uses centered mode (no positioned coords) for a target→centered move", () => {
    const { rerender } = render(
      <Tooltip {...props({ index: 0, position: pos(100, 100) })} />
    );
    rerender(
      <Tooltip {...props({ index: 1, isFirst: false, centered: true, position: null })} />
    );
    // Centered wrapper: CSS-centered, no inline left, its own transition:none.
    expect(tip().style.left).toBe("");
    expect(/centered/.test(tip().className)).toBe(true);
  });
});
