import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAdvanceGate, type UseAdvanceGateOptions } from "./useAdvanceGate";

function makeTarget(id?: string): HTMLElement {
  const el = document.createElement("button");
  if (id) el.id = id;
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = "";
});

const base = (
  overrides: Partial<UseAdvanceGateOptions>
): UseAdvanceGateOptions => ({
  advanceOn: undefined,
  element: null,
  enabled: true,
  stepKey: 0,
  onAdvance: () => {},
  ...overrides,
});

describe("useAdvanceGate", () => {
  it("is not gated without an advanceOn config", () => {
    const { result } = renderHook(() =>
      useAdvanceGate(base({ element: makeTarget() }))
    );
    expect(result.current).toBe(false);
  });

  it("is not gated while disabled (tour closed)", () => {
    const { result } = renderHook(() =>
      useAdvanceGate(
        base({
          advanceOn: { event: "click" },
          element: makeTarget(),
          enabled: false,
        })
      )
    );
    expect(result.current).toBe(false);
  });

  it("gates until the event fires on the resolved target, then advances once", () => {
    const target = makeTarget();
    const onAdvance = vi.fn();
    const { result } = renderHook(() =>
      useAdvanceGate(
        base({ advanceOn: { event: "click" }, element: target, onAdvance })
      )
    );
    expect(result.current).toBe(true);

    act(() => {
      target.dispatchEvent(new Event("click"));
    });
    expect(onAdvance).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(false);

    // satisfied → listener removed → further events don't re-advance
    act(() => {
      target.dispatchEvent(new Event("click"));
    });
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it("listens on advanceOn.selector (resolved against document) when given", () => {
    makeTarget("outside-btn");
    const onAdvance = vi.fn();
    const { result } = renderHook(() =>
      useAdvanceGate(
        base({
          advanceOn: { event: "click", selector: "#outside-btn" },
          element: null,
          onAdvance,
        })
      )
    );
    expect(result.current).toBe(true);
    act(() => {
      document.querySelector("#outside-btn")!.dispatchEvent(new Event("click"));
    });
    expect(onAdvance).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(false);
  });

  it("stays gated (no listener leak) when the target cannot be resolved", () => {
    const onAdvance = vi.fn();
    const { result } = renderHook(() =>
      useAdvanceGate(
        base({
          advanceOn: { event: "click", selector: "#does-not-exist" },
          onAdvance,
        })
      )
    );
    expect(result.current).toBe(true);
    expect(onAdvance).not.toHaveBeenCalled();
  });

  it("re-arms when the step key changes (revisiting a gated step)", () => {
    const target = makeTarget();
    const onAdvance = vi.fn();
    const { result, rerender } = renderHook(
      ({ stepKey }: { stepKey: number }) =>
        useAdvanceGate(
          base({ advanceOn: { event: "click" }, element: target, stepKey, onAdvance })
        ),
      { initialProps: { stepKey: 0 } }
    );
    act(() => {
      target.dispatchEvent(new Event("click"));
    });
    expect(result.current).toBe(false);

    rerender({ stepKey: 1 }); // moved on…
    rerender({ stepKey: 0 }); // …and came back
    expect(result.current).toBe(true);

    act(() => {
      target.dispatchEvent(new Event("click"));
    });
    expect(onAdvance).toHaveBeenCalledTimes(2);
  });

  it("hears the event in capture phase — a stopPropagation-ing child cannot starve the gate", () => {
    const target = makeTarget();
    const child = document.createElement("span");
    target.appendChild(child);
    // consumer code swallowing the event in the bubble phase
    child.addEventListener("click", (e) => e.stopPropagation());

    const onAdvance = vi.fn();
    const { result } = renderHook(() =>
      useAdvanceGate(
        base({ advanceOn: { event: "click" }, element: target, onAdvance })
      )
    );
    expect(result.current).toBe(true);
    act(() => {
      child.dispatchEvent(new Event("click", { bubbles: true }));
    });
    expect(onAdvance).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(false);
  });

  it("removes the listener on unmount", () => {
    const target = makeTarget();
    const onAdvance = vi.fn();
    const { unmount } = renderHook(() =>
      useAdvanceGate(
        base({ advanceOn: { event: "click" }, element: target, onAdvance })
      )
    );
    unmount();
    target.dispatchEvent(new Event("click"));
    expect(onAdvance).not.toHaveBeenCalled();
  });

  it("supports custom event names", () => {
    const target = makeTarget();
    const onAdvance = vi.fn();
    const { result } = renderHook(() =>
      useAdvanceGate(
        base({
          advanceOn: { event: "change" as "click" },
          element: target,
          onAdvance,
        })
      )
    );
    expect(result.current).toBe(true);
    act(() => {
      target.dispatchEvent(new Event("change"));
    });
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });
});
