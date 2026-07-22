import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { createRef, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { SpotlightTour } from "./SpotlightTour";
import { SCROLL_SETTLE_QUIET_MS } from "./hooks/useAutoScroll";
import type { TourController } from "./types";

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

const q = (selector: string) => document.querySelector(selector);

afterEach(() => {
  // Unmount React trees BEFORE wiping the body — the portal lives in
  // document.body, and clearing it first would break React's own removal.
  cleanup();
  document.body.innerHTML = "";
});

const twoSteps = () => {
  addTarget("t0", { x: 100, y: 50, width: 200, height: 40 });
  addTarget("t1", { x: 400, y: 300, width: 100, height: 30 });
  return [
    { target: "#t0", title: "First", content: "step one" },
    { target: "#t1", content: "step two" },
  ];
};

describe("SpotlightTour", () => {
  it("renders nothing while closed", () => {
    render(<SpotlightTour steps={twoSteps()} />);
    expect(q("[data-tour-root]")).toBeNull();
  });

  it("portals an overlay whose mask hole matches the spotlight geometry", () => {
    render(<SpotlightTour steps={twoSteps()} defaultOpen />);
    const hole = q("[data-tour-spotlight]")!;
    // target {100,50,200,40} + default 8px padding
    expect(hole.getAttribute("x")).toBe("92");
    expect(hole.getAttribute("y")).toBe("42");
    expect(hole.getAttribute("width")).toBe("216");
    expect(hole.getAttribute("height")).toBe("56");
    expect(hole.getAttribute("rx")).toBe("8");
    // dim layer uses the default mask color and references the mask
    const dim = q("[data-tour-dim]")!;
    expect(dim.getAttribute("fill")).toBe("rgba(0 0 0 / 0.55)");
    expect(dim.getAttribute("mask")).toMatch(/^url\(#usefy-tour-mask-/);
    // the overlay is hidden from assistive tech
    expect(q("[data-tour-overlay]")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("honors maskColor, zIndex, and per-step spotlight padding/radius", () => {
    addTarget("t0", { x: 100, y: 50, width: 200, height: 40 });
    render(
      <SpotlightTour
        steps={[
          {
            target: "#t0",
            content: "a",
            spotlightPadding: 10,
            spotlightRadius: 12,
          },
        ]}
        defaultOpen
        maskColor="rgba(10 20 30 / 0.8)"
        zIndex={5000}
      />
    );
    expect(q("[data-tour-dim]")!.getAttribute("fill")).toBe(
      "rgba(10 20 30 / 0.8)"
    );
    const hole = q("[data-tour-spotlight]")!;
    expect(hole.getAttribute("x")).toBe("90");
    expect(hole.getAttribute("rx")).toBe("12");
    expect((q("[data-tour-root]") as HTMLElement).style.zIndex).toBe("5000");
  });

  it("renders a centered step with no hole and a full-screen click catcher", () => {
    render(
      <SpotlightTour steps={[{ content: "welcome aboard" }]} defaultOpen />
    );
    expect(q("[data-tour-spotlight]")).toBeNull();
    expect(q('[data-tour-hit="full"]')).not.toBeNull();
    expect(screen.getByText("welcome aboard")).toBeInTheDocument();
  });

  describe("default UI drives the machine", () => {
    it("next/back navigate and the last step shows Done which finishes", () => {
      const onFinish = vi.fn();
      render(
        <SpotlightTour steps={twoSteps()} defaultOpen onFinish={onFinish} />
      );
      expect(screen.getByText("step one")).toBeInTheDocument();
      // Back is hidden on the first step
      expect(q("[data-tour-back]")).toBeNull();
      expect(q("[data-tour-next]")!.textContent).toBe("Next");

      fireEvent.click(q("[data-tour-next]")!);
      expect(screen.getByText("step two")).toBeInTheDocument();
      expect(q("[data-tour-next]")!.textContent).toBe("Done");

      fireEvent.click(q("[data-tour-back]")!);
      expect(screen.getByText("step one")).toBeInTheDocument();

      fireEvent.click(q("[data-tour-next]")!);
      fireEvent.click(q("[data-tour-next]")!);
      expect(onFinish).toHaveBeenCalledTimes(1);
      expect(q("[data-tour-root]")).toBeNull();
    });

    it("Skip closes and reports the current step", () => {
      const onSkip = vi.fn();
      render(<SpotlightTour steps={twoSteps()} defaultOpen onSkip={onSkip} />);
      fireEvent.click(q("[data-tour-skip]")!);
      expect(onSkip).toHaveBeenCalledWith(0);
      expect(q("[data-tour-root]")).toBeNull();
    });

    it("the close (×) button skips", () => {
      const onSkip = vi.fn();
      render(<SpotlightTour steps={twoSteps()} defaultOpen onSkip={onSkip} />);
      fireEvent.click(screen.getByLabelText("Close"));
      expect(onSkip).toHaveBeenCalledTimes(1);
      expect(q("[data-tour-root]")).toBeNull();
    });

    it("shows the counter and progress dots", () => {
      render(<SpotlightTour steps={twoSteps()} defaultOpen />);
      expect(q("[data-tour-counter]")!.textContent).toBe("1 / 2");
      const dots = document.querySelectorAll("[data-tour-dot]");
      expect(dots.length).toBe(2);
      expect(document.querySelectorAll('[data-tour-dot="active"]').length).toBe(
        1
      );
    });

    it("hides counter/dots/skip/close via the show* flags", () => {
      render(
        <SpotlightTour
          steps={twoSteps()}
          defaultOpen
          showCounter={false}
          showProgress={false}
          showSkip={false}
          showClose={false}
        />
      );
      expect(q("[data-tour-counter]")).toBeNull();
      expect(q("[data-tour-dots]")).toBeNull();
      expect(q("[data-tour-skip]")).toBeNull();
      expect(q("[data-tour-close]")).toBeNull();
    });

    it("applies label overrides", () => {
      render(
        <SpotlightTour
          steps={twoSteps()}
          defaultOpen
          defaultStep={1}
          labels={{ back: "이전", finish: "완료", skip: "건너뛰기", close: "닫기" }}
        />
      );
      expect(q("[data-tour-back]")!.textContent).toBe("이전");
      expect(q("[data-tour-next]")!.textContent).toBe("완료");
      expect(q("[data-tour-skip]")!.textContent).toBe("건너뛰기");
      expect(screen.getByLabelText("닫기")).toBeInTheDocument();
    });

    it("positions the tooltip from the engine and renders the arrow", () => {
      render(<SpotlightTour steps={twoSteps()} defaultOpen />);
      const tooltip = q("[data-tour-tooltip]") as HTMLElement;
      // jsdom measures the tooltip as 0x0, so every side fits and 'auto'
      // resolves the roomiest: right (716px) beats bottom (670px) here.
      expect(tooltip.getAttribute("data-placement")).toBe("right");
      expect(tooltip.style.left).not.toBe("");
      expect(q("[data-tour-arrow]")).not.toBeNull();
      expect(q("[data-tour-arrow]")!.getAttribute("data-placement")).toBe(
        "right"
      );
      // dialog semantics from the hook's prop getter
      expect(tooltip.getAttribute("role")).toBe("dialog");
    });
  });

  describe("classNames and renderStep", () => {
    it("applies the classNames slots", () => {
      render(
        <SpotlightTour
          steps={twoSteps()}
          defaultOpen
          className="my-root"
          classNames={{
            overlay: "my-overlay",
            spotlight: "my-spotlight",
            tooltip: "my-tooltip",
            arrow: "my-arrow",
            header: "my-header",
            content: "my-content",
            footer: "my-footer",
            dots: "my-dots",
            counter: "my-counter",
          }}
        />
      );
      expect(q(".my-root")).toBe(q("[data-tour-root]"));
      expect(q(".my-overlay")).toBe(q("[data-tour-overlay]"));
      expect(q(".my-spotlight")).toBe(q("[data-tour-spotlight]"));
      expect(q(".my-tooltip")).toBe(q("[data-tour-tooltip]"));
      expect(q(".my-arrow")).toBe(q("[data-tour-arrow]"));
      expect(q(".my-header")).toBe(q("[data-tour-header]"));
      expect(q(".my-content")).toBe(q("[data-tour-content]"));
      expect(q(".my-footer")).toBe(q("[data-tour-footer]"));
      expect(q(".my-dots")).toBe(q("[data-tour-dots]"));
      expect(q(".my-counter")).toBe(q("[data-tour-counter]"));
    });

    it("renderStep replaces the default UI and its controller works", () => {
      render(
        <SpotlightTour
          steps={twoSteps()}
          defaultOpen
          renderStep={({ step, index, count, controller, tooltipProps }) => (
            <section {...tooltipProps} data-custom-step="">
              <p>
                custom {index + 1} of {count}: {step.content}
              </p>
              <button onClick={controller.next}>advance</button>
            </section>
          )}
        />
      );
      expect(q("[data-custom-step]")).not.toBeNull();
      expect(screen.getByText(/custom 1 of 2/)).toBeInTheDocument();
      // no default footer/buttons
      expect(q("[data-tour-footer]")).toBeNull();
      expect(q("[data-tour-next]")).toBeNull();
      // dialog role travels via ctx.tooltipProps
      expect(q("[data-custom-step]")!.getAttribute("role")).toBe("dialog");

      fireEvent.click(screen.getByText("advance"));
      expect(screen.getByText(/custom 2 of 2/)).toBeInTheDocument();
    });
  });

  describe("hit-strip tiling", () => {
    const strip = (side: string) =>
      q(`[data-tour-hit="${side}"]`) as HTMLElement;

    it("tiles viewport-minus-hole exactly for a fully visible spotlight", () => {
      render(<SpotlightTour steps={twoSteps()} defaultOpen />);
      // spotlight = {92, 42, 216, 56}
      expect(strip("top").style.top).toBe("0px");
      expect(strip("top").style.height).toBe("42px");
      expect(strip("left").style.left).toBe("0px");
      expect(strip("left").style.top).toBe("42px");
      expect(strip("left").style.width).toBe("92px");
      expect(strip("left").style.height).toBe("56px");
      expect(strip("right").style.left).toBe("308px");
      expect(strip("right").style.top).toBe("42px");
      expect(strip("right").style.height).toBe("56px");
      expect(strip("bottom").style.top).toBe("98px");
    });

    it("re-clamps the strip box when the spotlight extends past the left edge", () => {
      addTarget("neg", { x: -30, y: 100, width: 50, height: 40 });
      render(
        <SpotlightTour
          steps={[{ target: "#neg", content: "a", spotlightClicks: false }]}
          defaultOpen
        />
      );
      // spotlight {-38, 92, 66, 56} → visible hole = {0, 92, 28, 56}
      expect(strip("top").style.height).toBe("92px");
      expect(strip("left").style.width).toBe("0px");
      expect(strip("left").style.height).toBe("56px");
      // the right strip must start at the visible hole's right edge (28),
      // not at the unclamped x+width shifted by the left clamp (66)
      expect(strip("right").style.left).toBe("28px");
      expect(strip("right").style.top).toBe("92px");
      expect(strip("right").style.height).toBe("56px");
      expect(strip("bottom").style.top).toBe("148px");
      // the blocker covers exactly the visible hole
      const blocker = q("[data-tour-blocker]") as HTMLElement;
      expect(blocker.style.left).toBe("0px");
      expect(blocker.style.top).toBe("92px");
      expect(blocker.style.width).toBe("28px");
      expect(blocker.style.height).toBe("56px");
    });

    it("re-clamps the strip box when the spotlight extends past the top edge", () => {
      addTarget("neg", { x: 100, y: -25, width: 200, height: 40 });
      render(
        <SpotlightTour steps={[{ target: "#neg", content: "a" }]} defaultOpen />
      );
      // spotlight {92, -33, 216, 56} → visible hole = {92, 0, 216, 23}
      expect(strip("top").style.height).toBe("0px");
      expect(strip("left").style.top).toBe("0px");
      expect(strip("left").style.height).toBe("23px");
      expect(strip("left").style.width).toBe("92px");
      expect(strip("right").style.left).toBe("308px");
      expect(strip("right").style.height).toBe("23px");
      expect(strip("bottom").style.top).toBe("23px");
    });
  });

  describe("overlay click behavior", () => {
    it("ignores overlay clicks by default", () => {
      const onSkip = vi.fn();
      render(<SpotlightTour steps={twoSteps()} defaultOpen onSkip={onSkip} />);
      fireEvent.click(q('[data-tour-hit="top"]')!);
      expect(onSkip).not.toHaveBeenCalled();
      expect(q("[data-tour-root]")).not.toBeNull();
    });

    it("overlayClick='close' dismisses like Skip", () => {
      const onSkip = vi.fn();
      render(
        <SpotlightTour
          steps={twoSteps()}
          defaultOpen
          overlayClick="close"
          onSkip={onSkip}
        />
      );
      fireEvent.click(q('[data-tour-hit="bottom"]')!);
      expect(onSkip).toHaveBeenCalledWith(0);
      expect(q("[data-tour-root]")).toBeNull();
    });

    it("overlayClick='next' advances a step", () => {
      render(
        <SpotlightTour steps={twoSteps()} defaultOpen overlayClick="next" />
      );
      fireEvent.click(q('[data-tour-hit="left"]')!);
      expect(screen.getByText("step two")).toBeInTheDocument();
    });

    it("spotlightClicks=false renders a blocker over the hole", () => {
      addTarget("t0");
      render(
        <SpotlightTour
          steps={[{ target: "#t0", content: "a", spotlightClicks: false }]}
          defaultOpen
        />
      );
      expect(q("[data-tour-blocker]")).not.toBeNull();
    });

    it("spotlightClicks default leaves the hole open (no blocker)", () => {
      render(<SpotlightTour steps={twoSteps()} defaultOpen />);
      expect(q("[data-tour-blocker]")).toBeNull();
    });
  });

  describe("transitions and reduced motion", () => {
    it("exposes the default 300ms transition duration to the mask", () => {
      render(<SpotlightTour steps={twoSteps()} defaultOpen />);
      const overlay = q("[data-tour-overlay]") as HTMLElement;
      expect(
        overlay.style.getPropertyValue("--usefy-tour-transition-duration")
      ).toBe("300ms");
    });

    it("honors a custom transitionDuration", () => {
      render(
        <SpotlightTour steps={twoSteps()} defaultOpen transitionDuration={0} />
      );
      const overlay = q("[data-tour-overlay]") as HTMLElement;
      expect(
        overlay.style.getPropertyValue("--usefy-tour-transition-duration")
      ).toBe("0ms");
    });

    it("forces the duration to 0 under prefers-reduced-motion", () => {
      const original = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      try {
        render(
          <SpotlightTour
            steps={twoSteps()}
            defaultOpen
            transitionDuration={300}
          />
        );
        const overlay = q("[data-tour-overlay]") as HTMLElement;
        expect(
          overlay.style.getPropertyValue("--usefy-tour-transition-duration")
        ).toBe("0ms");
      } finally {
        window.matchMedia = original;
      }
    });
  });

  describe("theming", () => {
    it("applies the dark class for theme='dark'", () => {
      render(<SpotlightTour steps={twoSteps()} defaultOpen theme="dark" />);
      const root = q("[data-tour-root]") as HTMLElement;
      expect(root.className).toMatch(/dark/);
    });

    it("stays light for theme='light'", () => {
      render(<SpotlightTour steps={twoSteps()} defaultOpen theme="light" />);
      const root = q("[data-tour-root]") as HTMLElement;
      expect(root.className).not.toMatch(/dark/);
    });

    it("explicit theme='light' beats a [data-theme='dark'] host", () => {
      document.documentElement.setAttribute("data-theme", "dark");
      try {
        render(<SpotlightTour steps={twoSteps()} defaultOpen theme="light" />);
        const root = q("[data-tour-root]") as HTMLElement;
        // the scoped .light compound out-specifies the host attribute rule
        expect(root.className).toMatch(/light/);
        expect(root.className).not.toMatch(/dark/);
      } finally {
        document.documentElement.removeAttribute("data-theme");
      }
    });

    it("system-resolved theme does not apply the explicit light override", () => {
      render(<SpotlightTour steps={twoSteps()} defaultOpen theme="system" />);
      const root = q("[data-tour-root]") as HTMLElement;
      expect(root.className).not.toMatch(/light/);
    });
  });

  describe("controllerRef", () => {
    it("exposes working imperative controls", () => {
      const ref = createRef<TourController>();
      render(<SpotlightTour steps={twoSteps()} controllerRef={ref} />);
      expect(ref.current).not.toBeNull();
      expect(q("[data-tour-root]")).toBeNull();

      act(() => ref.current!.start());
      expect(q("[data-tour-root]")).not.toBeNull();
      expect(screen.getByText("step one")).toBeInTheDocument();

      act(() => ref.current!.goTo(1));
      expect(screen.getByText("step two")).toBeInTheDocument();

      act(() => ref.current!.finish());
      expect(q("[data-tour-root]")).toBeNull();
    });
  });

  describe("dialog semantics", () => {
    it("marks the tooltip as a modal dialog labelled by its rendered title", () => {
      render(<SpotlightTour steps={twoSteps()} defaultOpen />);
      const tooltip = q("[data-tour-tooltip]")!;
      expect(tooltip.getAttribute("role")).toBe("dialog");
      expect(tooltip.getAttribute("aria-modal")).toBe("true");
      const labelledby = tooltip.getAttribute("aria-labelledby")!;
      expect(document.getElementById(labelledby)!.textContent).toBe("First");
      const describedby = tooltip.getAttribute("aria-describedby")!;
      expect(document.getElementById(describedby)!.textContent).toBe(
        "step one"
      );
    });

    it("falls back to a positional aria-label when the step has no title", () => {
      render(<SpotlightTour steps={twoSteps()} defaultOpen defaultStep={1} />);
      const tooltip = q("[data-tour-tooltip]")!;
      expect(tooltip.getAttribute("aria-labelledby")).toBeNull();
      expect(tooltip.getAttribute("aria-label")).toBe("Step 2 of 2");
    });
  });

  describe("focus management", () => {
    it("moves initial focus to the primary action (Next)", () => {
      render(<SpotlightTour steps={twoSteps()} defaultOpen />);
      expect(document.activeElement).toBe(q("[data-tour-next]"));
    });

    it("falls back to the close button when Next is gate-disabled", () => {
      addTarget("g0");
      render(
        <SpotlightTour
          steps={[
            { target: "#g0", content: "gated", advanceOn: { event: "click" } },
          ]}
          defaultOpen
        />
      );
      expect((q("[data-tour-next]") as HTMLButtonElement).disabled).toBe(true);
      expect(document.activeElement).toBe(q("[data-tour-close]"));
    });

    it("keeps Tab cycling inside the tooltip", () => {
      render(<SpotlightTour steps={twoSteps()} defaultOpen />);
      // Focusable order in the tooltip: close (header), skip, next (footer).
      const next = q("[data-tour-next]") as HTMLElement;
      const close = q("[data-tour-close]") as HTMLElement;
      expect(document.activeElement).toBe(next); // initial focus, last in order
      fireEvent.keyDown(document, { key: "Tab" });
      expect(document.activeElement).toBe(close); // wrapped to first
      fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
      expect(document.activeElement).toBe(next); // wrapped back to last
    });

    it("restores focus to the pre-tour element on close", async () => {
      const trigger = document.createElement("button");
      document.body.appendChild(trigger);
      trigger.focus();
      render(<SpotlightTour steps={twoSteps()} defaultOpen />);
      expect(document.activeElement).not.toBe(trigger);
      fireEvent.click(q("[data-tour-skip]")!);
      await act(async () => {}); // flush the deferred restore microtask
      expect(document.activeElement).toBe(trigger);
    });

    it("skips the restore silently when the pre-tour element left the DOM", async () => {
      const trigger = document.createElement("button");
      document.body.appendChild(trigger);
      trigger.focus();
      render(<SpotlightTour steps={twoSteps()} defaultOpen />);
      trigger.remove();
      fireEvent.click(q("[data-tour-skip]")!);
      await act(async () => {});
      expect(document.activeElement).toBe(document.body); // no throw, no steal
    });

    it("does not bounce focus to the trigger during a pending (auto-scroll) transition", async () => {
      vi.useFakeTimers();
      try {
        const trigger = document.createElement("button");
        document.body.appendChild(trigger);
        trigger.focus();

        addTarget("p0", { x: 100, y: 50 });
        const far = addTarget("p1", { x: 400, y: 3000 }); // off-viewport
        far.scrollIntoView = vi.fn();
        render(
          <SpotlightTour
            steps={[
              { target: "#p0", content: "one" },
              { target: "#p1", content: "two" },
            ]}
            defaultOpen
          />
        );
        fireEvent.click(q("[data-tour-next]")!);
        // pending: tooltip unmounted, trap deactivated — flush the trap's
        // deferred restore microtask; focus must NOT jump to the trigger
        await act(async () => {});
        expect(document.activeElement).not.toBe(trigger);

        // scroll settles → tooltip returns, focus lands on Next again
        act(() => void vi.advanceTimersByTime(0));
        act(() => void vi.advanceTimersByTime(SCROLL_SETTLE_QUIET_MS));
        expect(screen.getByText("two")).toBeInTheDocument();
        expect(document.activeElement).toBe(q("[data-tour-next]"));

        // …and the final close still restores to the pre-tour trigger
        fireEvent.click(q("[data-tour-skip]")!);
        await act(async () => {});
        expect(document.activeElement).toBe(trigger);
      } finally {
        vi.useRealTimers();
      }
    });

    it("traps focus on the positioned wrapper for renderStep custom UIs", () => {
      render(
        <SpotlightTour
          steps={twoSteps()}
          defaultOpen
          renderStep={({ step }) => <p>{step.content}</p>}
        />
      );
      // no [data-tour-next]/[data-tour-close] → the wrapper itself is focused
      expect(document.activeElement).toBe(q("[data-tour-tooltip]"));
    });
  });

  describe("keyboard navigation", () => {
    it("ArrowRight advances and ArrowLeft goes back", () => {
      render(<SpotlightTour steps={twoSteps()} defaultOpen />);
      fireEvent.keyDown(document, { key: "ArrowRight" });
      expect(screen.getByText("step two")).toBeInTheDocument();
      fireEvent.keyDown(document, { key: "ArrowLeft" });
      expect(screen.getByText("step one")).toBeInTheDocument();
    });

    it("Escape skips the tour", () => {
      const onSkip = vi.fn();
      render(<SpotlightTour steps={twoSteps()} defaultOpen onSkip={onSkip} />);
      fireEvent.keyDown(document, { key: "Escape" });
      expect(onSkip).toHaveBeenCalledWith(0);
      expect(q("[data-tour-root]")).toBeNull();
    });

    it("Enter advances when focus is not on a button", () => {
      render(<SpotlightTour steps={twoSteps()} defaultOpen />);
      (document.activeElement as HTMLElement).blur();
      fireEvent.keyDown(document.body, { key: "Enter" });
      expect(screen.getByText("step two")).toBeInTheDocument();
    });

    it("Enter on a focused button does not hijack its activation", () => {
      render(<SpotlightTour steps={twoSteps()} defaultOpen />);
      const skipBtn = q("[data-tour-skip]") as HTMLElement;
      skipBtn.focus();
      fireEvent.keyDown(skipBtn, { key: "Enter" });
      // the hotkey ignored it — still on step one, tour still open
      expect(screen.getByText("step one")).toBeInTheDocument();
    });

    it("keyboard={false} disables all hotkeys (trap stays)", () => {
      const onSkip = vi.fn();
      render(
        <SpotlightTour
          steps={twoSteps()}
          defaultOpen
          keyboard={false}
          onSkip={onSkip}
        />
      );
      fireEvent.keyDown(document, { key: "ArrowRight" });
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.getByText("step one")).toBeInTheDocument();
      expect(onSkip).not.toHaveBeenCalled();
      // the focus trap is independent of the keyboard opt-out
      expect(document.activeElement).toBe(q("[data-tour-next]"));
    });

    it("Escape works from a form field (renderStep form), arrows stay guarded", () => {
      const onSkip = vi.fn();
      const onStepChange = vi.fn();
      render(
        <SpotlightTour
          steps={twoSteps()}
          defaultOpen
          onSkip={onSkip}
          onStepChange={onStepChange}
          renderStep={({ tooltipProps }) => (
            <form {...tooltipProps}>
              <input placeholder="type here" />
            </form>
          )}
        />
      );
      const input = screen.getByPlaceholderText("type here");
      input.focus();
      // arrows/Enter never fire from an editable target…
      fireEvent.keyDown(input, { key: "ArrowRight" });
      expect(onStepChange).not.toHaveBeenCalled();
      expect(q("[data-tour-root]")).not.toBeNull();
      // …but Escape still dismisses the tour
      fireEvent.keyDown(input, { key: "Escape" });
      expect(onSkip).toHaveBeenCalledWith(0);
      expect(q("[data-tour-root]")).toBeNull();
    });

    it("ArrowRight/Enter do not advance past an unmet gate", () => {
      addTarget("g0");
      addTarget("g1", { x: 400, y: 300 });
      render(
        <SpotlightTour
          steps={[
            { target: "#g0", content: "gate me", advanceOn: { event: "click" } },
            { target: "#g1", content: "after" },
          ]}
          defaultOpen
        />
      );
      fireEvent.keyDown(document, { key: "ArrowRight" });
      (document.activeElement as HTMLElement | null)?.blur?.();
      fireEvent.keyDown(document.body, { key: "Enter" });
      expect(screen.getByText("gate me")).toBeInTheDocument();
    });
  });

  describe("advanceOn gates", () => {
    const gatedSteps = () => {
      addTarget("g0");
      addTarget("g1", { x: 400, y: 300 });
      return [
        { target: "#g0", content: "gate me", advanceOn: { event: "click" as const } },
        { target: "#g1", content: "after" },
      ];
    };

    it("renders Next disabled with the gate hint, then advances automatically on the target click", () => {
      render(<SpotlightTour steps={gatedSteps()} defaultOpen />);
      const next = q("[data-tour-next]") as HTMLButtonElement;
      expect(next.disabled).toBe(true);
      expect(next.getAttribute("aria-disabled")).toBe("true");
      expect(q("[data-tour-gated-hint]")!.textContent).toBe(
        "Complete the highlighted action to continue"
      );

      fireEvent.click(document.querySelector("#g0")!);
      expect(screen.getByText("after")).toBeInTheDocument();
      // the landed step is ungated: Next enabled, hint gone
      expect((q("[data-tour-next]") as HTMLButtonElement).disabled).toBe(false);
      expect(q("[data-tour-gated-hint]")).toBeNull();
    });

    it("clicking the disabled Next does nothing", () => {
      render(<SpotlightTour steps={gatedSteps()} defaultOpen />);
      fireEvent.click(q("[data-tour-next]")!);
      expect(screen.getByText("gate me")).toBeInTheDocument();
    });

    it("the gate hint label is overridable", () => {
      render(
        <SpotlightTour
          steps={gatedSteps()}
          defaultOpen
          labels={{ gatedHint: "먼저 강조된 버튼을 눌러주세요" }}
        />
      );
      expect(q("[data-tour-gated-hint]")!.textContent).toBe(
        "먼저 강조된 버튼을 눌러주세요"
      );
    });

    it("announces the gate hint with the settled step", () => {
      render(<SpotlightTour steps={gatedSteps()} defaultOpen />);
      expect(document.querySelector('[role="status"]')!.textContent).toBe(
        "Step 1 of 2. Complete the highlighted action to continue"
      );
    });

    it("re-arms the gate when the step is revisited", () => {
      render(<SpotlightTour steps={gatedSteps()} defaultOpen />);
      fireEvent.click(document.querySelector("#g0")!);
      expect(screen.getByText("after")).toBeInTheDocument();
      fireEvent.click(q("[data-tour-back]")!);
      expect(screen.getByText("gate me")).toBeInTheDocument();
      expect((q("[data-tour-next]") as HTMLButtonElement).disabled).toBe(true);
      expect(q("[data-tour-gated-hint]")).not.toBeNull();
    });
  });

  describe("scroll lock", () => {
    it("locks body scroll while open and restores it on close", () => {
      render(<SpotlightTour steps={twoSteps()} defaultOpen />);
      expect(document.body.style.overflow).toBe("hidden");
      fireEvent.click(q("[data-tour-skip]")!);
      expect(document.body.style.overflow).not.toBe("hidden");
    });

    it("scrollLock={false} opts out", () => {
      render(
        <SpotlightTour steps={twoSteps()} defaultOpen scrollLock={false} />
      );
      expect(document.body.style.overflow).not.toBe("hidden");
    });
  });

  describe("step announcements", () => {
    const region = () => document.querySelector('[role="status"]');

    it("announces each settled step politely, with the title when it is a string", () => {
      render(<SpotlightTour steps={twoSteps()} defaultOpen />);
      expect(region()!.getAttribute("aria-live")).toBe("polite");
      expect(region()!.textContent).toBe("Step 1 of 2: First");
      fireEvent.click(q("[data-tour-next]")!);
      expect(region()!.textContent).toBe("Step 2 of 2"); // step two has no title
    });

    it("announces only the landed step when the skip policy jumps a missing target", () => {
      addTarget("real", { x: 100, y: 50 });
      render(
        <SpotlightTour
          steps={[
            { target: "#missing", content: "ghost" },
            { target: "#real", content: "landed", title: "Real" },
          ]}
          defaultOpen
        />
      );
      expect(region()!.textContent).toBe("Step 2 of 2: Real");
    });

    it("stays silent while a wait-policy target is pending", () => {
      vi.useFakeTimers();
      try {
        addTarget("other", { x: 100, y: 50 });
        render(
          <SpotlightTour
            steps={[
              {
                target: "#late",
                content: "waiting",
                title: "Late",
                missingTarget: "wait",
                waitTimeout: 500,
              },
              { target: "#other", content: "next one" },
            ]}
            defaultOpen
          />
        );
        expect(region()!.textContent).toBe("");
        addTarget("late", { x: 200, y: 200 });
        act(() => void vi.advanceTimersByTime(500));
        expect(region()!.textContent).toBe("Step 1 of 2: Late");
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("disableOverlayClose", () => {
    it("downgrades overlayClick to ignore for the flagged step only", () => {
      const onSkip = vi.fn();
      addTarget("d0");
      addTarget("d1", { x: 400, y: 300 });
      render(
        <SpotlightTour
          steps={[
            { target: "#d0", content: "protected", disableOverlayClose: true },
            { target: "#d1", content: "normal" },
          ]}
          defaultOpen
          overlayClick="close"
          onSkip={onSkip}
        />
      );
      fireEvent.click(q('[data-tour-hit="top"]')!);
      expect(onSkip).not.toHaveBeenCalled();
      expect(screen.getByText("protected")).toBeInTheDocument();

      fireEvent.click(q("[data-tour-next]")!);
      fireEvent.click(q('[data-tour-hit="top"]')!);
      expect(onSkip).toHaveBeenCalledWith(1);
    });
  });

  describe("hardening", () => {
    it("keeps the focus trap alive on a hidden holder during pending windows", () => {
      vi.useFakeTimers();
      try {
        render(
          <SpotlightTour
            steps={[
              {
                target: "#never",
                content: "waiting",
                missingTarget: "wait",
                waitTimeout: 5000,
              },
            ]}
            defaultOpen
          />
        );
        const holder = q("[data-tour-focus-holder]") as HTMLElement;
        expect(holder).not.toBeNull();
        // the trap pinned focus to the holder (nothing focusable inside it)
        expect(document.activeElement).toBe(holder);
        // Tab cannot reach the dimmed page underneath
        fireEvent.keyDown(document, { key: "Tab" });
        expect(document.activeElement).toBe(holder);
      } finally {
        vi.useRealTimers();
      }
    });

    it("renders a sane spotlight for a zero-size target", () => {
      addTarget("zero", { x: 300, y: 200, width: 0, height: 0 });
      render(
        <SpotlightTour steps={[{ target: "#zero", content: "tiny" }]} defaultOpen />
      );
      const hole = q("[data-tour-spotlight]")!;
      // default 8px padding around a 0x0 point → a 16x16 hole
      expect(hole.getAttribute("x")).toBe("292");
      expect(hole.getAttribute("y")).toBe("192");
      expect(hole.getAttribute("width")).toBe("16");
      expect(hole.getAttribute("height")).toBe("16");
      expect(screen.getByText("tiny")).toBeInTheDocument();
    });

    it("survives a window resize mid-tour and keeps the tooltip positioned", () => {
      render(<SpotlightTour steps={twoSteps()} defaultOpen />);
      fireEvent.click(q("[data-tour-next]")!);
      const originalW = window.innerWidth;
      const originalH = window.innerHeight;
      try {
        act(() => {
          Object.defineProperty(window, "innerWidth", {
            value: 640,
            configurable: true,
            writable: true,
          });
          Object.defineProperty(window, "innerHeight", {
            value: 480,
            configurable: true,
            writable: true,
          });
          window.dispatchEvent(new Event("resize"));
        });
        const tooltip = q("[data-tour-tooltip]") as HTMLElement;
        expect(tooltip).not.toBeNull();
        expect(tooltip.style.left).not.toBe("");
        expect(screen.getByText("step two")).toBeInTheDocument();
      } finally {
        Object.defineProperty(window, "innerWidth", {
          value: originalW,
          configurable: true,
          writable: true,
        });
        Object.defineProperty(window, "innerHeight", {
          value: originalH,
          configurable: true,
          writable: true,
        });
      }
    });

    describe("StrictMode", () => {
      it("persists exactly one write on finish", () => {
        const setItem = vi.spyOn(Storage.prototype, "setItem");
        try {
          addTarget("s0");
          render(
            <StrictMode>
              <SpotlightTour
                steps={[{ target: "#s0", content: "only" }]}
                defaultOpen
                tourId="strict-demo"
              />
            </StrictMode>
          );
          fireEvent.click(q("[data-tour-next]")!); // Done → finish
          expect(setItem).toHaveBeenCalledTimes(1);
          expect(
            window.localStorage.getItem("usefy-tour:strict-demo")
          ).toContain('"finished"');
        } finally {
          setItem.mockRestore();
          window.localStorage.clear();
        }
      });

      it("a gate advances exactly one step per event (single listener)", () => {
        const onFinish = vi.fn();
        addTarget("s0");
        addTarget("s1", { x: 400, y: 300 });
        render(
          <StrictMode>
            <SpotlightTour
              steps={[
                {
                  target: "#s0",
                  content: "gate me",
                  advanceOn: { event: "click" },
                },
                { target: "#s1", content: "after" },
              ]}
              defaultOpen
              onFinish={onFinish}
            />
          </StrictMode>
        );
        fireEvent.click(document.querySelector("#s0")!);
        // exactly one advance: on step 2, tour still open (a double-advance
        // would have finished the two-step tour)
        expect(screen.getByText("after")).toBeInTheDocument();
        expect(onFinish).not.toHaveBeenCalled();
      });

      it("unmounts cleanly: scroll lock released, no stray listeners", () => {
        const { unmount } = render(
          <StrictMode>
            <SpotlightTour steps={twoSteps()} defaultOpen />
          </StrictMode>
        );
        expect(document.body.style.overflow).toBe("hidden");
        unmount();
        expect(document.body.style.overflow).not.toBe("hidden");
        expect(() => {
          fireEvent.keyDown(document, { key: "ArrowRight" });
          document.body.appendChild(document.createElement("aside"));
        }).not.toThrow();
      });
    });
  });

  describe("SSR", () => {
    it("renders to an empty string on the server (portal only after mount)", () => {
      const html = renderToString(
        <SpotlightTour
          steps={[{ target: "#t0", content: "a" }]}
          defaultOpen
        />
      );
      expect(html).toBe("");
    });
  });
});
