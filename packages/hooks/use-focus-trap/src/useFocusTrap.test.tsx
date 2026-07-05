import React, { StrictMode, useRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, renderHook, act } from "@testing-library/react";
import { useFocusTrap } from "./useFocusTrap";
import type { UseFocusTrapOptions } from "./types";
import {
  getFocusableElements,
  isFocusable,
  isHidden,
  resolveFocusTarget,
} from "./utils";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

interface FixtureProps {
  active: boolean;
  options?: UseFocusTrapOptions;
  /** Render a trailing *disabled* button to prove it's excluded from the cycle. */
  withDisabledTail?: boolean;
  /** Render zero focusable children. */
  empty?: boolean;
}

function Fixture({
  active,
  options,
  withDisabledTail,
  empty,
}: FixtureProps) {
  const ref = useFocusTrap<HTMLDivElement>(active, options);
  return (
    <>
      <button data-testid="trigger">trigger</button>
      <div ref={ref} data-testid="trap">
        {!empty && (
          <>
            <button data-testid="first">first</button>
            <input data-testid="middle" />
            <button data-testid="last">last</button>
            {withDisabledTail && (
              <button data-testid="disabled-tail" disabled>
                disabled
              </button>
            )}
          </>
        )}
        {empty && <p>No focusable content here.</p>}
      </div>
    </>
  );
}

const byId = (id: string) => screen.getByTestId(id);

/**
 * Focus restoration on deactivation is deferred to a microtask (so it wins
 * against React's post-commit focus-restoration pass). Flush the microtask
 * queue — wrapped in `act` — before asserting the restored focus.
 */
const flushRestore = () => act(async () => { await Promise.resolve(); });

// ---------------------------------------------------------------------------
// utils
// ---------------------------------------------------------------------------

describe("getFocusableElements", () => {
  function build(html: string): HTMLElement {
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    return container;
  }

  it("returns focusable descendants in DOM order", () => {
    const c = build(`
      <a href="#one">a</a>
      <button>b</button>
      <input />
      <select></select>
      <textarea></textarea>
      <div tabindex="0">t</div>
      <div contenteditable="true">ce</div>
    `);
    const found = getFocusableElements(c);
    expect(found.map((el) => el.tagName.toLowerCase())).toEqual([
      "a",
      "button",
      "input",
      "select",
      "textarea",
      "div",
      "div",
    ]);
  });

  it("excludes disabled form controls", () => {
    const c = build(`<button>ok</button><button disabled>no</button>`);
    expect(getFocusableElements(c)).toHaveLength(1);
  });

  it('excludes tabindex="-1"', () => {
    const c = build(`<button>ok</button><button tabindex="-1">no</button>`);
    const found = getFocusableElements(c);
    expect(found).toHaveLength(1);
    expect(found[0].textContent).toBe("ok");
  });

  it("excludes hidden (attribute), display:none, visibility:hidden, and inert", () => {
    const c = build(`
      <button>ok</button>
      <button hidden>h1</button>
      <button style="display:none">h2</button>
      <button style="visibility:hidden">h3</button>
      <div inert><button>h4</button></div>
    `);
    const found = getFocusableElements(c);
    expect(found).toHaveLength(1);
    expect(found[0].textContent).toBe("ok");
  });

  it("excludes anchors without href but includes those with href", () => {
    const c = build(`<a>no</a><a href="#x">yes</a>`);
    const found = getFocusableElements(c);
    expect(found).toHaveLength(1);
    expect(found[0].getAttribute("href")).toBe("#x");
  });

  it("excludes controls inside a disabled <fieldset> (inherited :disabled)", () => {
    // A control inside <fieldset disabled> reports `.disabled === false` (the IDL
    // reflects only its own attribute), yet is genuinely non-interactive — it
    // must be excluded via the inherited `:disabled` match.
    const c = build(`
      <button data-testid="ok">ok</button>
      <fieldset disabled>
        <button data-testid="fs-btn">no</button>
        <input data-testid="fs-input" />
      </fieldset>
    `);
    const fsButton = c.querySelector<HTMLButtonElement>(
      '[data-testid="fs-btn"]'
    )!;
    // Sanity-check the premise: the IDL property does NOT report the inherited
    // disabled state, but the pseudo-class does.
    expect(fsButton.disabled).toBe(false);
    expect(fsButton.matches(":disabled")).toBe(true);

    const found = getFocusableElements(c);
    expect(found).toHaveLength(1);
    expect(found[0].textContent).toBe("ok");
    expect(found).not.toContain(fsButton);
  });
});

describe("isFocusable / isHidden", () => {
  it("isHidden is true for the hidden attribute", () => {
    const el = document.createElement("button");
    el.hidden = true;
    document.body.appendChild(el);
    expect(isHidden(el)).toBe(true);
    expect(isFocusable(el)).toBe(false);
  });

  it("isHidden handles a document with no defaultView (inert vs. visible)", () => {
    const detached = document.implementation.createHTMLDocument("");
    const inertEl = detached.createElement("div");
    inertEl.setAttribute("inert", "");
    expect(isHidden(inertEl)).toBe(true);

    const plainEl = detached.createElement("div");
    expect(isHidden(plainEl)).toBe(false);
  });

  it("isFocusable returns false for a disabled element", () => {
    const el = document.createElement("button");
    el.disabled = true;
    document.body.appendChild(el);
    expect(isFocusable(el)).toBe(false);
  });
});

describe("resolveFocusTarget", () => {
  it("resolves a raw element, a ref, and a getter", () => {
    const el = document.createElement("div");
    expect(resolveFocusTarget(el)).toBe(el);
    expect(resolveFocusTarget({ current: el })).toBe(el);
    expect(resolveFocusTarget(() => el)).toBe(el);
    expect(resolveFocusTarget({ current: null })).toBeNull();
    expect(resolveFocusTarget(() => null)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// initial focus
// ---------------------------------------------------------------------------

describe("useFocusTrap — initial focus", () => {
  it("moves focus to the first focusable element by default on activation", () => {
    render(<Fixture active />);
    expect(document.activeElement).toBe(byId("first"));
  });

  it("does not move focus when inactive", () => {
    byId; // noop
    render(<Fixture active={false} />);
    expect(document.activeElement).toBe(document.body);
  });

  it("respects a custom initialFocus element", () => {
    function Custom() {
      const target = useRef<HTMLInputElement>(null);
      const ref = useFocusTrap<HTMLDivElement>(true, {
        initialFocus: () => target.current,
      });
      return (
        <div ref={ref}>
          <button>first</button>
          <input ref={target} data-testid="target" />
        </div>
      );
    }
    render(<Custom />);
    expect(document.activeElement).toBe(byId("target"));
  });

  it("respects a RefObject initialFocus", () => {
    function Custom() {
      const target = useRef<HTMLButtonElement>(null);
      const ref = useFocusTrap<HTMLDivElement>(true, { initialFocus: target });
      return (
        <div ref={ref}>
          <input />
          <button ref={target} data-testid="target">
            go
          </button>
        </div>
      );
    }
    render(<Custom />);
    expect(document.activeElement).toBe(byId("target"));
  });

  it("respects a raw HTMLElement initialFocus", () => {
    function Custom() {
      const [el, setEl] = React.useState<HTMLButtonElement | null>(null);
      const ref = useFocusTrap<HTMLDivElement>(!!el, el ? { initialFocus: el } : undefined);
      return (
        <div ref={ref}>
          <input />
          <button ref={setEl} data-testid="target">
            go
          </button>
        </div>
      );
    }
    render(<Custom />);
    expect(document.activeElement).toBe(byId("target"));
  });

  it("does not move focus when initialFocus is false", () => {
    render(<Fixture active options={{ initialFocus: false }} />);
    expect(document.activeElement).toBe(document.body);
  });

  it("focuses the container itself when there are no focusable children", () => {
    render(<Fixture active empty />);
    expect(document.activeElement).toBe(byId("trap"));
    // The hook added a temporary tabindex so the container is focusable.
    expect(byId("trap").getAttribute("tabindex")).toBe("-1");
  });
});

// ---------------------------------------------------------------------------
// tab cycling
// ---------------------------------------------------------------------------

describe("useFocusTrap — Tab cycling", () => {
  it("wraps to the first element when Tab is pressed on the last", () => {
    render(<Fixture active />);
    byId("last").focus();
    fireEvent.keyDown(byId("last"), { key: "Tab" });
    expect(document.activeElement).toBe(byId("first"));
  });

  it("wraps to the last element when Shift+Tab is pressed on the first", () => {
    render(<Fixture active />);
    byId("first").focus();
    fireEvent.keyDown(byId("first"), { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(byId("last"));
  });

  it("does not interfere with Tab in the middle of the cycle", () => {
    render(<Fixture active />);
    byId("middle").focus();
    fireEvent.keyDown(byId("middle"), { key: "Tab" });
    // Handler leaves it to the browser — focus is unchanged in jsdom.
    expect(document.activeElement).toBe(byId("middle"));
  });

  it("ignores disabled elements when computing the last focusable", () => {
    render(<Fixture active withDisabledTail />);
    byId("last").focus();
    fireEvent.keyDown(byId("last"), { key: "Tab" });
    expect(document.activeElement).toBe(byId("first"));
  });

  it("excludes fieldset-disabled controls from the tab cycle", () => {
    function FieldsetFixture() {
      const ref = useFocusTrap<HTMLDivElement>(true);
      return (
        <div ref={ref}>
          <button data-testid="first">first</button>
          <fieldset disabled>
            <button data-testid="fs-btn">nope</button>
          </fieldset>
          <button data-testid="last">last</button>
        </div>
      );
    }
    render(<FieldsetFixture />);
    // The fieldset-disabled button is not the "last" focusable — Tab from `last`
    // wraps to `first`, skipping it entirely.
    byId("last").focus();
    fireEvent.keyDown(byId("last"), { key: "Tab" });
    expect(document.activeElement).toBe(byId("first"));
    // And Shift+Tab from `first` wraps to `last`, not the disabled control.
    fireEvent.keyDown(byId("first"), { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(byId("last"));
  });

  it("keeps focus on the container and blocks Tab when there are no focusable children", () => {
    render(<Fixture active empty />);
    const trap = byId("trap");
    expect(document.activeElement).toBe(trap);
    const event = fireEvent.keyDown(trap, { key: "Tab" });
    // Default prevented → the browser can't move focus out of the trap.
    expect(event).toBe(false);
    expect(document.activeElement).toBe(trap);
  });

  it("pulls focus back inside when Tab arrives from outside the trap", () => {
    render(<Fixture active />);
    byId("trigger").focus(); // move focus outside the trap
    // The document-level listener sees the Tab even though it fires outside.
    fireEvent.keyDown(byId("trigger"), { key: "Tab" });
    expect(document.activeElement).toBe(byId("first"));
  });

  it("pulls focus to the last element on Shift+Tab arriving from outside", () => {
    render(<Fixture active />);
    byId("trigger").focus();
    fireEvent.keyDown(byId("trigger"), { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(byId("last"));
  });

  it("does nothing for non-Tab, non-Escape keys", () => {
    render(<Fixture active />);
    byId("last").focus();
    fireEvent.keyDown(byId("last"), { key: "a" });
    expect(document.activeElement).toBe(byId("last"));
  });
});

// ---------------------------------------------------------------------------
// escape
// ---------------------------------------------------------------------------

describe("useFocusTrap — Escape", () => {
  it("calls onEscape with the event and does not treat it as a Tab", () => {
    const onEscape = vi.fn();
    render(<Fixture active options={{ onEscape }} />);
    byId("middle").focus();
    fireEvent.keyDown(byId("middle"), { key: "Escape" });
    expect(onEscape).toHaveBeenCalledTimes(1);
    expect(onEscape.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
    // Focus is untouched.
    expect(document.activeElement).toBe(byId("middle"));
  });

  it("does not throw when Escape is pressed without an onEscape handler", () => {
    render(<Fixture active />);
    expect(() =>
      fireEvent.keyDown(byId("first"), { key: "Escape" })
    ).not.toThrow();
  });

  it("does not fire onEscape when focus is outside the trap", () => {
    const onEscape = vi.fn();
    render(<Fixture active options={{ onEscape }} />);
    byId("trigger").focus(); // outside the trap
    fireEvent.keyDown(byId("trigger"), { key: "Escape" });
    expect(onEscape).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// nested / simultaneous traps (topmost-wins activation stack)
// ---------------------------------------------------------------------------

describe("useFocusTrap — nested / simultaneous traps", () => {
  interface NestedProps {
    outerActive?: boolean;
    innerActive?: boolean;
    onOuterEscape?: (e: KeyboardEvent) => void;
    onInnerEscape?: (e: KeyboardEvent) => void;
  }

  // Two sibling traps in one component. React runs a component's layout effects
  // in declaration order, so the outer trap pushes onto the activation stack
  // first and the inner trap second — making the inner trap topmost while both
  // are active. `initialFocus`/`returnFocus` are disabled so focus only moves
  // when we drive it, isolating the stack behaviour under test.
  function NestedFixture({
    outerActive = true,
    innerActive = true,
    onOuterEscape,
    onInnerEscape,
  }: NestedProps) {
    const outerRef = useFocusTrap<HTMLDivElement>(outerActive, {
      onEscape: onOuterEscape,
      initialFocus: false,
      returnFocus: false,
    });
    const innerRef = useFocusTrap<HTMLDivElement>(innerActive, {
      onEscape: onInnerEscape,
      initialFocus: false,
      returnFocus: false,
    });
    return (
      <>
        <div ref={outerRef} data-testid="outer">
          <button data-testid="outer-first">outer-first</button>
          <button data-testid="outer-last">outer-last</button>
        </div>
        <div ref={innerRef} data-testid="inner">
          <button data-testid="inner-first">inner-first</button>
          <button data-testid="inner-last">inner-last</button>
        </div>
      </>
    );
  }

  it("fires Escape on the topmost trap only", () => {
    const onOuterEscape = vi.fn();
    const onInnerEscape = vi.fn();
    render(
      <NestedFixture
        onOuterEscape={onOuterEscape}
        onInnerEscape={onInnerEscape}
      />
    );
    byId("inner-first").focus();
    fireEvent.keyDown(byId("inner-first"), { key: "Escape" });
    // Only the topmost (inner) trap handles it — the outer stays silent even
    // though its document-level listener also heard the keydown.
    expect(onInnerEscape).toHaveBeenCalledTimes(1);
    expect(onOuterEscape).not.toHaveBeenCalled();
  });

  it("applies Tab wrapping/recapture on the topmost trap only", () => {
    render(<NestedFixture />);
    // Inner (topmost) wraps within itself.
    byId("inner-last").focus();
    fireEvent.keyDown(byId("inner-last"), { key: "Tab" });
    expect(document.activeElement).toBe(byId("inner-first"));

    // Tab from inside the *outer* trap: the outer trap does NOT wrap (it's not
    // topmost); the inner trap recaptures focus into itself instead.
    byId("outer-last").focus();
    fireEvent.keyDown(byId("outer-last"), { key: "Tab" });
    expect(document.activeElement).toBe(byId("inner-first"));
    expect(document.activeElement).not.toBe(byId("outer-first"));
  });

  it("makes the next trap live again when the topmost deactivates", () => {
    const onOuterEscape = vi.fn();
    const onInnerEscape = vi.fn();
    const { rerender } = render(
      <NestedFixture
        onOuterEscape={onOuterEscape}
        onInnerEscape={onInnerEscape}
      />
    );

    // Deactivate the inner (topmost) trap — the outer becomes topmost.
    rerender(
      <NestedFixture
        innerActive={false}
        onOuterEscape={onOuterEscape}
        onInnerEscape={onInnerEscape}
      />
    );

    // Now the outer trap wraps its own Tab...
    byId("outer-last").focus();
    fireEvent.keyDown(byId("outer-last"), { key: "Tab" });
    expect(document.activeElement).toBe(byId("outer-first"));

    // ...and its Escape fires (the inner's must not, it's inactive).
    fireEvent.keyDown(byId("outer-first"), { key: "Escape" });
    expect(onOuterEscape).toHaveBeenCalledTimes(1);
    expect(onInnerEscape).not.toHaveBeenCalled();
  });

  it("keeps the inner trap topmost when the outer deactivates first", () => {
    // Out-of-order deactivation: the outer trap (underneath) turns off while the
    // inner stays active. splice-by-token must remove only the outer's entry and
    // leave the inner as topmost — a naive stack pop would corrupt the order.
    const onOuterEscape = vi.fn();
    const onInnerEscape = vi.fn();
    const { rerender } = render(
      <NestedFixture
        onOuterEscape={onOuterEscape}
        onInnerEscape={onInnerEscape}
      />
    );

    rerender(
      <NestedFixture
        outerActive={false}
        onOuterEscape={onOuterEscape}
        onInnerEscape={onInnerEscape}
      />
    );

    // The inner trap is still the (only) topmost: its Tab wraps and its Escape
    // fires; the deactivated outer stays silent.
    byId("inner-last").focus();
    fireEvent.keyDown(byId("inner-last"), { key: "Tab" });
    expect(document.activeElement).toBe(byId("inner-first"));

    fireEvent.keyDown(byId("inner-first"), { key: "Escape" });
    expect(onInnerEscape).toHaveBeenCalledTimes(1);
    expect(onOuterEscape).not.toHaveBeenCalled();
  });

  it("leaks no stack entry across unmount (a later single trap still traps)", () => {
    // Mount then unmount a nested pair, then mount a fresh standalone trap: if
    // the pair had leaked a token, the standalone trap would not be topmost.
    const { unmount } = render(<NestedFixture />);
    unmount();

    render(<Fixture active />);
    byId("last").focus();
    fireEvent.keyDown(byId("last"), { key: "Tab" });
    expect(document.activeElement).toBe(byId("first"));
  });
});

// ---------------------------------------------------------------------------
// return focus
// ---------------------------------------------------------------------------

describe("useFocusTrap — return focus", () => {
  it("restores focus to the previously focused element on deactivation", async () => {
    const { rerender } = render(<Fixture active={false} />);
    byId("trigger").focus();
    expect(document.activeElement).toBe(byId("trigger"));

    rerender(<Fixture active />);
    expect(document.activeElement).toBe(byId("first"));

    rerender(<Fixture active={false} />);
    await flushRestore();
    expect(document.activeElement).toBe(byId("trigger"));
  });

  it("restores focus on unmount", async () => {
    function Wrapper({ open }: { open: boolean }) {
      return (
        <>
          <button data-testid="trigger">trigger</button>
          {open && (
            <div>
              <TrapOnly />
            </div>
          )}
        </>
      );
    }
    function TrapOnly() {
      const ref = useFocusTrap<HTMLDivElement>(true);
      return (
        <div ref={ref}>
          <button data-testid="first">first</button>
        </div>
      );
    }

    const { rerender } = render(<Wrapper open={false} />);
    byId("trigger").focus();
    rerender(<Wrapper open />);
    expect(document.activeElement).toBe(byId("first"));
    rerender(<Wrapper open={false} />);
    await flushRestore();
    expect(document.activeElement).toBe(byId("trigger"));
  });

  it("does not throw or mis-restore when nothing was focused at activation", async () => {
    // Nothing is focused before activation → previouslyFocused is <body>.
    // Restoring focus to <body> is a harmless no-op (the body isn't focusable),
    // so focus simply stays put — the important part is it doesn't throw.
    const { rerender } = render(<Fixture active={false} />);
    expect(document.activeElement).toBe(document.body);

    rerender(<Fixture active />);
    expect(document.activeElement).toBe(byId("first"));

    expect(() => rerender(<Fixture active={false} />)).not.toThrow();
    await flushRestore();
    expect(document.activeElement).toBe(byId("first"));
  });

  it("does not steal focus to a return target that was removed from the DOM", async () => {
    function Wrapper({
      active,
      showTrigger,
    }: {
      active: boolean;
      showTrigger: boolean;
    }) {
      const ref = useFocusTrap<HTMLDivElement>(active);
      return (
        <>
          {showTrigger && <button data-testid="trigger">trigger</button>}
          <div ref={ref}>
            <button data-testid="first">first</button>
          </div>
        </>
      );
    }

    const { rerender } = render(<Wrapper active={false} showTrigger />);
    byId("trigger").focus();
    rerender(<Wrapper active showTrigger />);
    expect(document.activeElement).toBe(byId("first"));

    // Deactivate AND remove the trigger in the same commit — the restore target
    // is now detached, so the hook must not try to focus it.
    rerender(<Wrapper active={false} showTrigger={false} />);
    await flushRestore();
    expect(document.activeElement).toBe(byId("first"));
  });

  it("does not restore focus when returnFocus is false", async () => {
    const { rerender } = render(
      <Fixture active={false} options={{ returnFocus: false }} />
    );
    byId("trigger").focus();
    rerender(<Fixture active options={{ returnFocus: false }} />);
    // moved into the trap
    expect(document.activeElement).toBe(byId("first"));
    rerender(<Fixture active={false} options={{ returnFocus: false }} />);
    await flushRestore();
    // focus is NOT restored to the trigger; stays where it was (first) — jsdom
    // doesn't blur it, so it's simply not moved back.
    expect(document.activeElement).not.toBe(byId("trigger"));
    expect(document.activeElement).toBe(byId("first"));
  });

  it("cancels the pending restore when the trap re-activates before the microtask runs", async () => {
    // Deactivating schedules a deferred (microtask) focus restore to the trigger.
    // If the trap re-activates synchronously — before that microtask fires — the
    // restore must be cancelled so it doesn't yank focus away from the freshly
    // re-activated trap. Exercises the `if (activeRef.current) return;` guard.
    const { rerender } = render(<Fixture active={false} />);
    byId("trigger").focus();

    rerender(<Fixture active />);
    expect(document.activeElement).toBe(byId("first"));
    byId("last").focus();

    // Deactivate (queues a restore to the trigger) then immediately re-activate,
    // both synchronously — the queued microtask has not run yet.
    rerender(<Fixture active={false} />);
    rerender(<Fixture active />);
    // Re-activation moved focus back to the first element.
    expect(document.activeElement).toBe(byId("first"));

    // Flush the still-pending restore: the guard sees the trap is active again
    // and bails, so focus is NOT stolen back to the trigger.
    await flushRestore();
    expect(document.activeElement).toBe(byId("first"));
    expect(document.activeElement).not.toBe(byId("trigger"));
  });

  it("restores focus to a custom returnFocus target", async () => {
    function Wrapper({ active }: { active: boolean }) {
      const target = useRef<HTMLButtonElement>(null);
      const ref = useFocusTrap<HTMLDivElement>(active, {
        returnFocus: () => target.current,
      });
      return (
        <>
          <button data-testid="trigger">trigger</button>
          <button ref={target} data-testid="custom-return">
            return here
          </button>
          <div ref={ref}>
            <button data-testid="first">first</button>
          </div>
        </>
      );
    }
    const { rerender } = render(<Wrapper active={false} />);
    byId("trigger").focus();
    rerender(<Wrapper active />);
    expect(document.activeElement).toBe(byId("first"));
    rerender(<Wrapper active={false} />);
    await flushRestore();
    expect(document.activeElement).toBe(byId("custom-return"));
  });
});

// ---------------------------------------------------------------------------
// stability, SSR & StrictMode safety
// ---------------------------------------------------------------------------

describe("useFocusTrap — stability & safety", () => {
  it("returns a stable ref identity across rerenders", () => {
    const { result, rerender } = renderHook(
      ({ active }) => useFocusTrap(active),
      { initialProps: { active: true } }
    );
    const first = result.current;
    rerender({ active: false });
    rerender({ active: true });
    expect(result.current).toBe(first);
  });

  it("is a no-op when the ref is never attached (container stays null)", () => {
    function NoAttach() {
      useFocusTrap(true);
      return <div>nothing attached</div>;
    }
    expect(() => render(<NoAttach />)).not.toThrow();
    expect(document.activeElement).toBe(document.body);
  });

  it("does not re-subscribe or move focus again when only options change", () => {
    const onEscape1 = vi.fn();
    const onEscape2 = vi.fn();
    const { rerender } = render(
      <Fixture active options={{ onEscape: onEscape1 }} />
    );
    expect(document.activeElement).toBe(byId("first"));
    // Move focus, then swap the handler — the effect must NOT re-run and yank
    // focus back to `first`.
    byId("last").focus();
    rerender(<Fixture active options={{ onEscape: onEscape2 }} />);
    expect(document.activeElement).toBe(byId("last"));
    // The latest handler is used.
    fireEvent.keyDown(byId("last"), { key: "Escape" });
    expect(onEscape1).not.toHaveBeenCalled();
    expect(onEscape2).toHaveBeenCalledTimes(1);
  });

  it("traps and restores focus correctly under StrictMode", async () => {
    const { rerender } = render(
      <StrictMode>
        <Fixture active={false} />
      </StrictMode>
    );
    byId("trigger").focus();
    rerender(
      <StrictMode>
        <Fixture active />
      </StrictMode>
    );
    expect(document.activeElement).toBe(byId("first"));

    rerender(
      <StrictMode>
        <Fixture active={false} />
      </StrictMode>
    );
    await flushRestore();
    expect(document.activeElement).toBe(byId("trigger"));
  });
});
