import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  renderHook,
  act,
  cleanup,
} from "@testing-library/react";
import { useLongPress } from "./useLongPress";
import type { UseLongPressOptions } from "./types";
import {
  getPositionFromEvent,
  getDistance,
  isTouchEvent,
  now,
  DEFAULT_THRESHOLD,
  DEFAULT_MOVE_THRESHOLD,
} from "./utils";

// A tiny harness that spreads the bind object onto a real button so we can
// dispatch DOM events at it and let React route them to the handlers.
function Harness({
  callback,
  options,
}: {
  callback: (event: unknown) => void;
  options?: UseLongPressOptions<HTMLButtonElement>;
}) {
  const bind = useLongPress<HTMLButtonElement>(callback, options);
  return (
    <button data-testid="target" type="button" {...bind}>
      Press and hold
    </button>
  );
}

function getTarget() {
  return screen.getByTestId("target");
}

// Touch event init helpers — jsdom/RTL fill `touches`/`changedTouches` from init.
function touchAt(x: number, y: number) {
  return { touches: [{ clientX: x, clientY: y }], changedTouches: [{ clientX: x, clientY: y }] };
}

describe("useLongPress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    cleanup();
  });

  // ---------------------------------------------------------------- threshold

  it("fires the callback after the threshold with the mouse", () => {
    const cb = vi.fn();
    render(<Harness callback={cb} options={{ threshold: 400 }} />);
    const el = getTarget();

    fireEvent.mouseDown(el, { clientX: 0, clientY: 0 });
    expect(cb).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(399));
    expect(cb).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("fires the callback after the threshold with touch", () => {
    const cb = vi.fn();
    render(<Harness callback={cb} options={{ threshold: 500 }} />);
    const el = getTarget();

    fireEvent.touchStart(el, touchAt(0, 0));
    act(() => vi.advanceTimersByTime(500));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("uses the default threshold when none is given", () => {
    const cb = vi.fn();
    render(<Harness callback={cb} />);
    const el = getTarget();

    fireEvent.mouseDown(el, { clientX: 0, clientY: 0 });
    act(() => vi.advanceTimersByTime(DEFAULT_THRESHOLD - 1));
    expect(cb).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("does NOT fire when released before the threshold (mouse)", () => {
    const cb = vi.fn();
    render(<Harness callback={cb} options={{ threshold: 400 }} />);
    const el = getTarget();

    fireEvent.mouseDown(el, { clientX: 0, clientY: 0 });
    act(() => vi.advanceTimersByTime(200));
    fireEvent.mouseUp(el, { clientX: 0, clientY: 0 });
    act(() => vi.advanceTimersByTime(400));
    expect(cb).not.toHaveBeenCalled();
  });

  it("does NOT fire when the touch ends before the threshold", () => {
    const cb = vi.fn();
    render(<Harness callback={cb} options={{ threshold: 400 }} />);
    const el = getTarget();

    fireEvent.touchStart(el, touchAt(0, 0));
    act(() => vi.advanceTimersByTime(200));
    fireEvent.touchEnd(el, touchAt(0, 0));
    act(() => vi.advanceTimersByTime(400));
    expect(cb).not.toHaveBeenCalled();
  });

  it("cancels when the pointer leaves the element before the threshold", () => {
    const cb = vi.fn();
    const onCancel = vi.fn();
    render(<Harness callback={cb} options={{ threshold: 400, onCancel }} />);
    const el = getTarget();

    fireEvent.mouseDown(el, { clientX: 0, clientY: 0 });
    fireEvent.mouseLeave(el, { clientX: 0, clientY: 0 });
    act(() => vi.advanceTimersByTime(400));
    expect(cb).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledWith(expect.anything(), { reason: "released" });
  });

  // ------------------------------------------------------- movement handling

  it("cancels when the pointer moves beyond moveThreshold (mouse)", () => {
    const cb = vi.fn();
    const onCancel = vi.fn();
    render(
      <Harness callback={cb} options={{ threshold: 400, moveThreshold: 10, onCancel }} />
    );
    const el = getTarget();

    fireEvent.mouseDown(el, { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(el, { clientX: 100, clientY: 0 });
    act(() => vi.advanceTimersByTime(400));
    expect(cb).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledWith(expect.anything(), { reason: "moved" });
  });

  it("cancels when the touch moves beyond moveThreshold", () => {
    const cb = vi.fn();
    const onCancel = vi.fn();
    render(
      <Harness callback={cb} options={{ threshold: 400, moveThreshold: 10, onCancel }} />
    );
    const el = getTarget();

    fireEvent.touchStart(el, touchAt(0, 0));
    fireEvent.touchMove(el, touchAt(0, 50));
    act(() => vi.advanceTimersByTime(400));
    expect(cb).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledWith(expect.anything(), { reason: "moved" });
  });

  it("does NOT cancel when movement stays within moveThreshold", () => {
    const cb = vi.fn();
    render(<Harness callback={cb} options={{ threshold: 400, moveThreshold: 10 }} />);
    const el = getTarget();

    fireEvent.mouseDown(el, { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(el, { clientX: 5, clientY: 0 });
    act(() => vi.advanceTimersByTime(400));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("ignores movement once moveThreshold is false", () => {
    const cb = vi.fn();
    render(<Harness callback={cb} options={{ threshold: 400, moveThreshold: false }} />);
    const el = getTarget();

    fireEvent.mouseDown(el, { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(el, { clientX: 999, clientY: 999 });
    act(() => vi.advanceTimersByTime(400));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("ignores a move event that carries no position", () => {
    const cb = vi.fn();
    render(<Harness callback={cb} options={{ threshold: 400, moveThreshold: 10 }} />);
    const el = getTarget();

    fireEvent.touchStart(el, touchAt(0, 0));
    // A touchmove with empty touches lists → no derivable position → no cancel.
    fireEvent.touchMove(el, { touches: [], changedTouches: [] });
    act(() => vi.advanceTimersByTime(400));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("does not re-evaluate movement after the threshold has fired", () => {
    const cb = vi.fn();
    const onCancel = vi.fn();
    render(
      <Harness callback={cb} options={{ threshold: 400, moveThreshold: 10, onCancel }} />
    );
    const el = getTarget();

    fireEvent.mouseDown(el, { clientX: 0, clientY: 0 });
    act(() => vi.advanceTimersByTime(400));
    expect(cb).toHaveBeenCalledTimes(1);

    // Moving far after the long press has already fired must not cancel it.
    fireEvent.mouseMove(el, { clientX: 999, clientY: 999 });
    expect(onCancel).not.toHaveBeenCalled();
  });

  // ------------------------------------------------------ lifecycle callbacks

  it("fires onStart at press-down and onFinish only after a completed press is released", () => {
    const onStart = vi.fn();
    const onFinish = vi.fn();
    const onCancel = vi.fn();
    render(
      <Harness
        callback={vi.fn()}
        options={{ threshold: 400, onStart, onFinish, onCancel }}
      />
    );
    const el = getTarget();

    fireEvent.mouseDown(el, { clientX: 0, clientY: 0 });
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onFinish).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(400));
    // Callback fired, but not finished until release.
    expect(onFinish).not.toHaveBeenCalled();

    fireEvent.mouseUp(el, { clientX: 0, clientY: 0 });
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("fires onCancel with reason 'released' when released early", () => {
    const onCancel = vi.fn();
    const onFinish = vi.fn();
    render(
      <Harness callback={vi.fn()} options={{ threshold: 400, onCancel, onFinish }} />
    );
    const el = getTarget();

    fireEvent.mouseDown(el, { clientX: 0, clientY: 0 });
    act(() => vi.advanceTimersByTime(100));
    fireEvent.mouseUp(el, { clientX: 0, clientY: 0 });

    expect(onCancel).toHaveBeenCalledWith(expect.anything(), { reason: "released" });
    expect(onFinish).not.toHaveBeenCalled();
  });

  // --------------------------------------------- touch / synthetic-mouse dedupe

  it("does not double-fire when synthetic mouse events follow a touch long press", () => {
    const cb = vi.fn();
    const onStart = vi.fn();
    render(<Harness callback={cb} options={{ threshold: 400, onStart }} />);
    const el = getTarget();

    // Full touch long press.
    fireEvent.touchStart(el, touchAt(0, 0));
    act(() => vi.advanceTimersByTime(400));
    expect(cb).toHaveBeenCalledTimes(1);
    fireEvent.touchEnd(el, touchAt(0, 0));

    // Browser now emits synthetic mouse events — they must be ignored.
    fireEvent.mouseDown(el, { clientX: 0, clientY: 0 });
    act(() => vi.advanceTimersByTime(400));
    expect(cb).toHaveBeenCalledTimes(1);
    // onStart fired once (touch) — the synthetic mousedown did not start again.
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("still handles a genuine mouse press once the touch guard window has elapsed", () => {
    const cb = vi.fn();
    render(<Harness callback={cb} options={{ threshold: 400 }} />);
    const el = getTarget();

    fireEvent.touchStart(el, touchAt(0, 0));
    fireEvent.touchEnd(el, touchAt(0, 0));

    // Wait past the synthetic-mouse guard window, then a real mouse press works.
    act(() => vi.advanceTimersByTime(600));
    fireEvent.mouseDown(el, { clientX: 0, clientY: 0 });
    act(() => vi.advanceTimersByTime(400));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  // ------------------------------------------------------------- disabled

  it("does nothing while disabled", () => {
    const cb = vi.fn();
    const onStart = vi.fn();
    render(<Harness callback={cb} options={{ threshold: 400, disabled: true, onStart }} />);
    const el = getTarget();

    fireEvent.mouseDown(el, { clientX: 0, clientY: 0 });
    act(() => vi.advanceTimersByTime(400));
    expect(cb).not.toHaveBeenCalled();
    expect(onStart).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------- guards / no-ops

  it("ignores a duplicate mousedown while a press is already in progress", () => {
    const cb = vi.fn();
    const onStart = vi.fn();
    render(<Harness callback={cb} options={{ threshold: 400, onStart }} />);
    const el = getTarget();

    fireEvent.mouseDown(el, { clientX: 0, clientY: 0 });
    fireEvent.mouseDown(el, { clientX: 0, clientY: 0 });
    expect(onStart).toHaveBeenCalledTimes(1);

    act(() => vi.advanceTimersByTime(400));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("treats mouseup with no active press as a no-op", () => {
    const onCancel = vi.fn();
    const onFinish = vi.fn();
    render(<Harness callback={vi.fn()} options={{ onCancel, onFinish }} />);
    const el = getTarget();

    fireEvent.mouseUp(el, { clientX: 0, clientY: 0 });
    expect(onCancel).not.toHaveBeenCalled();
    expect(onFinish).not.toHaveBeenCalled();
  });

  // ----------------------------------------------------------- cleanup

  it("clears the pending timer on unmount (no fire after unmount)", () => {
    const cb = vi.fn();
    const { unmount } = render(<Harness callback={cb} options={{ threshold: 400 }} />);
    const el = getTarget();

    fireEvent.mouseDown(el, { clientX: 0, clientY: 0 });
    unmount();
    act(() => vi.advanceTimersByTime(400));
    expect(cb).not.toHaveBeenCalled();
  });

  // ----------------------------------------------- referential stability

  it("returns a stable bind object and stable handlers across renders", () => {
    const { result, rerender } = renderHook(
      ({ cb }) => useLongPress(cb),
      { initialProps: { cb: vi.fn() } }
    );

    const first = result.current;
    rerender({ cb: vi.fn() }); // new callback identity every render
    const second = result.current;

    expect(second).toBe(first);
    expect(second.onMouseDown).toBe(first.onMouseDown);
    expect(second.onTouchStart).toBe(first.onTouchStart);
    expect(second.onMouseMove).toBe(first.onMouseMove);
    expect(second.onTouchEnd).toBe(first.onTouchEnd);
  });

  it("uses the latest callback without re-creating the handlers", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(
      ({ cb }) => useLongPress(cb, { threshold: 400 }),
      { initialProps: { cb: first } }
    );

    const handler = result.current.onMouseDown;
    rerender({ cb: second });
    expect(result.current.onMouseDown).toBe(handler);
  });
});

describe("useLongPress utils", () => {
  it("getPositionFromEvent reads mouse coordinates", () => {
    expect(
      getPositionFromEvent({ clientX: 3, clientY: 4 } as never)
    ).toEqual({ x: 3, y: 4 });
  });

  it("getPositionFromEvent prefers touches, falls back to changedTouches", () => {
    expect(
      getPositionFromEvent({
        touches: [{ clientX: 1, clientY: 2 }],
        changedTouches: [{ clientX: 9, clientY: 9 }],
      } as never)
    ).toEqual({ x: 1, y: 2 });

    expect(
      getPositionFromEvent({
        touches: [],
        changedTouches: [{ clientX: 7, clientY: 8 }],
      } as never)
    ).toEqual({ x: 7, y: 8 });
  });

  it("getPositionFromEvent returns null when a touch event has no touches", () => {
    expect(
      getPositionFromEvent({ touches: [], changedTouches: [] } as never)
    ).toBeNull();
  });

  it("isTouchEvent distinguishes touch from mouse events", () => {
    expect(isTouchEvent({ touches: [] } as never)).toBe(true);
    expect(isTouchEvent({ clientX: 0, clientY: 0 } as never)).toBe(false);
  });

  it("getDistance computes Euclidean distance", () => {
    expect(getDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(getDistance({ x: 2, y: 2 }, { x: 2, y: 2 })).toBe(0);
  });

  it("now returns a millisecond timestamp", () => {
    expect(typeof now()).toBe("number");
  });

  it("exposes sensible default constants", () => {
    expect(DEFAULT_THRESHOLD).toBe(400);
    expect(DEFAULT_MOVE_THRESHOLD).toBe(10);
  });
});
