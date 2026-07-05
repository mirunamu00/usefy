import React, { StrictMode } from "react";
import { describe, it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  renderHook,
  act,
} from "@testing-library/react";
import { useFocusWithin } from "./useFocusWithin";
import type { UseFocusWithinOptions } from "./types";
import { isFocusInside } from "./utils";

// ---------------------------------------------------------------------------
// Helpers & fixtures
// ---------------------------------------------------------------------------

const byId = (id: string) => screen.getByTestId(id);

/**
 * The `null`-`relatedTarget` path defers to a microtask before deciding focus
 * left. Flush the microtask queue (wrapped in `act`) before asserting.
 */
const flush = () => act(async () => { await Promise.resolve(); });

function Fixture({ options }: { options?: UseFocusWithinOptions }) {
  const [ref, focused] = useFocusWithin<HTMLDivElement>(options);
  return (
    <>
      <button data-testid="outside">outside</button>
      <div ref={ref} data-testid="container">
        <input data-testid="child1" />
        <input data-testid="child2" />
      </div>
      <span data-testid="state">{focused ? "focused" : "blurred"}</span>
    </>
  );
}

const expectState = (value: "focused" | "blurred") =>
  expect(byId("state").textContent).toBe(value);

// ---------------------------------------------------------------------------
// utils
// ---------------------------------------------------------------------------

describe("isFocusInside", () => {
  it("returns false for a null container or null target", () => {
    const el = document.createElement("div");
    expect(isFocusInside(null, el)).toBe(false);
    expect(isFocusInside(el, null)).toBe(false);
    expect(isFocusInside(null, null)).toBe(false);
  });

  it("is reflexive — the container itself counts as inside", () => {
    const el = document.createElement("div");
    expect(isFocusInside(el, el)).toBe(true);
  });

  it("returns true for a descendant and false for an outside node", () => {
    const container = document.createElement("div");
    const child = document.createElement("input");
    container.appendChild(child);
    const outside = document.createElement("button");
    expect(isFocusInside(container, child)).toBe(true);
    expect(isFocusInside(container, outside)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// basic focus tracking
// ---------------------------------------------------------------------------

describe("useFocusWithin — focus tracking", () => {
  it("starts blurred", () => {
    render(<Fixture />);
    expectState("blurred");
  });

  it("becomes focused when a descendant gains focus", () => {
    render(<Fixture />);
    act(() => byId("child1").focus());
    expectState("focused");
  });

  it("becomes focused when the container itself gains focus", () => {
    function ContainerFocusable() {
      const [ref, focused] = useFocusWithin<HTMLDivElement>();
      return (
        <div ref={ref} data-testid="container" tabIndex={-1}>
          <span data-testid="state">{focused ? "focused" : "blurred"}</span>
        </div>
      );
    }
    render(<ContainerFocusable />);
    act(() => byId("container").focus());
    expectState("focused");
  });

  it("stays focused when focus moves between two descendants (no flicker)", async () => {
    const onBlur = vi.fn();
    render(<Fixture options={{ onBlur }} />);
    act(() => byId("child1").focus());
    expectState("focused");
    act(() => byId("child2").focus());
    await flush();
    expectState("focused");
    // Never dropped to blurred in between → onBlur must not have fired.
    expect(onBlur).not.toHaveBeenCalled();
  });

  it("becomes blurred when focus leaves to an outside element", async () => {
    render(<Fixture />);
    act(() => byId("child1").focus());
    expectState("focused");
    act(() => byId("outside").focus());
    await flush();
    expectState("blurred");
  });

  it("becomes blurred when focus is lost entirely (blur to nothing)", async () => {
    render(<Fixture />);
    act(() => byId("child1").focus());
    expectState("focused");
    act(() => byId("child1").blur());
    await flush();
    expectState("blurred");
  });
});

// ---------------------------------------------------------------------------
// relatedTarget branches (deterministic, via fireEvent)
// ---------------------------------------------------------------------------

describe("useFocusWithin — focusout relatedTarget handling", () => {
  it("stays focused when relatedTarget is a descendant (synchronous branch)", () => {
    render(<Fixture />);
    fireEvent.focusIn(byId("child1"));
    expectState("focused");
    fireEvent.focusOut(byId("child1"), { relatedTarget: byId("child2") });
    expectState("focused");
  });

  it("becomes blurred when relatedTarget is outside the subtree", () => {
    render(<Fixture />);
    fireEvent.focusIn(byId("child1"));
    expectState("focused");
    fireEvent.focusOut(byId("child1"), { relatedTarget: byId("outside") });
    expectState("blurred");
  });

  it("keeps focus when relatedTarget is null but focus actually stayed inside (browser quirk)", async () => {
    render(<Fixture />);
    // Real focus so document.activeElement is genuinely a descendant.
    act(() => byId("child1").focus());
    expectState("focused");
    // A browser that wrongly reports null relatedTarget while focus stayed put.
    fireEvent.focusOut(byId("child1"), { relatedTarget: null });
    await flush();
    // The deferred activeElement re-check keeps us focused.
    expectState("focused");
  });

  it("treats an undefined relatedTarget as unreliable — stays focused when activeElement is still inside", async () => {
    render(<Fixture />);
    // Real focus so document.activeElement is genuinely a descendant.
    act(() => byId("child1").focus());
    expectState("focused");

    // jsdom (and our DOM-coercion guideline) can report `undefined` — not the
    // spec's `null` — for relatedTarget. Build a focusout whose relatedTarget
    // is explicitly `undefined`. A strict `!== null` guard would treat this as
    // a present target and blur synchronously; the loose `!= null` guard must
    // instead defer to the settled activeElement.
    const evt = new FocusEvent("focusout", { bubbles: true });
    Object.defineProperty(evt, "relatedTarget", { value: undefined });
    act(() => byId("child1").dispatchEvent(evt));
    // Deferred path: NOT synchronously blurred.
    expectState("focused");
    await flush();
    // activeElement is still child1 → the re-check keeps us focused.
    expectState("focused");
  });

  it("treats an undefined relatedTarget as unreliable — blurs after the microtask when activeElement ends up outside", async () => {
    const onBlur = vi.fn();
    render(<Fixture options={{ onBlur }} />);
    // focusin marks the subtree focused without moving document.activeElement,
    // which therefore stays on <body> (outside the container).
    fireEvent.focusIn(byId("child1"));
    expectState("focused");

    const evt = new FocusEvent("focusout", { bubbles: true });
    Object.defineProperty(evt, "relatedTarget", { value: undefined });
    act(() => byId("child1").dispatchEvent(evt));
    // Deferred, so not blurred synchronously.
    expectState("focused");
    await flush();
    // Settled activeElement (<body>) is outside the subtree → focus left.
    expectState("blurred");
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it("ignores a focusout that arrives while not focused", () => {
    const onBlur = vi.fn();
    render(<Fixture options={{ onBlur }} />);
    fireEvent.focusOut(byId("child1"), { relatedTarget: byId("outside") });
    expectState("blurred");
    expect(onBlur).not.toHaveBeenCalled();
  });

  it("does not double-fire onBlur when a deferred null check races a real leave", async () => {
    const onBlur = vi.fn();
    render(<Fixture options={{ onBlur }} />);
    act(() => byId("child1").focus());
    // Schedule the deferred (null) check…
    fireEvent.focusOut(byId("child1"), { relatedTarget: null });
    // …then leave synchronously via a reliable relatedTarget before it runs.
    fireEvent.focusOut(byId("child1"), { relatedTarget: byId("outside") });
    expectState("blurred");
    await flush();
    // The queued microtask sees focusedRef already false and bails out.
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// onFocus / onBlur edge callbacks
// ---------------------------------------------------------------------------

describe("useFocusWithin — edge callbacks", () => {
  it("fires onFocus only when the subtree gains focus, not on inner moves", async () => {
    const onFocus = vi.fn();
    render(<Fixture options={{ onFocus }} />);
    act(() => byId("child1").focus());
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onFocus.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
    // Inner move — must not fire again.
    act(() => byId("child2").focus());
    await flush();
    expect(onFocus).toHaveBeenCalledTimes(1);
  });

  it("fires onBlur only when the subtree loses focus entirely", async () => {
    const onBlur = vi.fn();
    render(<Fixture options={{ onBlur }} />);
    act(() => byId("child1").focus());
    act(() => byId("child2").focus());
    await flush();
    expect(onBlur).not.toHaveBeenCalled();
    act(() => byId("outside").focus());
    await flush();
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(onBlur.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
  });

  it("uses the latest callbacks without re-subscribing listeners", () => {
    const onFocusA = vi.fn();
    const onFocusB = vi.fn();
    const { rerender } = render(<Fixture options={{ onFocus: onFocusA }} />);
    rerender(<Fixture options={{ onFocus: onFocusB }} />);
    act(() => byId("child1").focus());
    expect(onFocusA).not.toHaveBeenCalled();
    expect(onFocusB).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// callback ref: attach / detach / initial sync
// ---------------------------------------------------------------------------

describe("useFocusWithin — callback ref lifecycle", () => {
  it("attaches focusin/focusout listeners on the node and removes them on detach", () => {
    const { result } = renderHook(() => useFocusWithin());
    const [ref] = result.current;
    const node = document.createElement("div");
    const addSpy = vi.spyOn(node, "addEventListener");
    const removeSpy = vi.spyOn(node, "removeEventListener");

    act(() => ref(node));
    expect(addSpy).toHaveBeenCalledWith("focusin", expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith("focusout", expect.any(Function));

    act(() => ref(null));
    expect(removeSpy).toHaveBeenCalledWith("focusin", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("focusout", expect.any(Function));
  });

  it("syncs to focused=true when the element mounts already containing focus (no onFocus)", () => {
    const onFocus = vi.fn();
    const { result } = renderHook(() => useFocusWithin({ onFocus }));
    const container = document.createElement("div");
    const input = document.createElement("input");
    container.appendChild(input);
    document.body.appendChild(container);
    input.focus(); // activeElement is now inside the container

    act(() => result.current[0](container));
    expect(result.current[1]).toBe(true);
    // Initial sync has no triggering event, so onFocus is intentionally silent.
    expect(onFocus).not.toHaveBeenCalled();

    document.body.removeChild(container);
  });

  it("resets focused to false when the ref detaches while focused", () => {
    const { result } = renderHook(() => useFocusWithin());
    const container = document.createElement("div");
    const input = document.createElement("input");
    container.appendChild(input);
    document.body.appendChild(container);
    input.focus();

    act(() => result.current[0](container));
    expect(result.current[1]).toBe(true);

    act(() => result.current[0](null));
    expect(result.current[1]).toBe(false);

    document.body.removeChild(container);
  });

  it("cleans up when the container unmounts (no error, no leak)", () => {
    function Wrapper({ show }: { show: boolean }) {
      return show ? <Fixture /> : <div data-testid="empty" />;
    }
    const { rerender } = render(<Wrapper show />);
    act(() => byId("child1").focus());
    expectState("focused");
    expect(() => rerender(<Wrapper show={false} />)).not.toThrow();
    expect(screen.queryByTestId("empty")).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// stability, SSR & StrictMode safety
// ---------------------------------------------------------------------------

describe("useFocusWithin — stability & safety", () => {
  it("returns a stable ref identity across rerenders", () => {
    const { result, rerender } = renderHook(
      ({ opts }) => useFocusWithin(opts),
      { initialProps: { opts: {} as UseFocusWithinOptions } }
    );
    const first = result.current[0];
    rerender({ opts: { onFocus: () => {} } });
    rerender({ opts: {} });
    expect(result.current[0]).toBe(first);
  });

  it("is inert until the ref is attached — no window/document access on render (SSR-safe)", () => {
    // On the server, callback refs are never invoked, so the hook touches no
    // DOM APIs at render time; it simply returns a function and `false`.
    const { result } = renderHook(() => useFocusWithin());
    expect(typeof result.current[0]).toBe("function");
    expect(result.current[1]).toBe(false);
  });

  it("tracks focus correctly under StrictMode with no duplicate onFocus", async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(
      <StrictMode>
        <Fixture options={{ onFocus, onBlur }} />
      </StrictMode>
    );
    expectState("blurred");
    act(() => byId("child1").focus());
    expectState("focused");
    // No duplicate listeners → exactly one onFocus.
    expect(onFocus).toHaveBeenCalledTimes(1);
    act(() => byId("outside").focus());
    await flush();
    expectState("blurred");
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});
