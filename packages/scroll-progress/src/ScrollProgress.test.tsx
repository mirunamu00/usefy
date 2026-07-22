import { StrictMode, createRef, type CSSProperties } from "react";
import { act, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_ARIA_LABEL,
  DEFAULT_BAR_COLOR,
  DEFAULT_BAR_HEIGHT,
  DEFAULT_Z_INDEX,
  ScrollProgress,
} from "./ScrollProgress";

// ---------------------------------------------------------------------------
// Scroll simulation helpers
// ---------------------------------------------------------------------------
// jsdom neither scrolls nor lays out, so the scroll metrics are stubbed the
// same way the @usefy/use-scroll-position tests do: define the offsets on the
// target, then dispatch a real "scroll" event so the hook's listener fires.

function defineValue(obj: object, key: string, value: number): void {
  Object.defineProperty(obj, key, { configurable: true, value });
}

/** Stub the window scroll offset and the document's scroll metrics. */
function setWindowMetrics(options: {
  scrollY?: number;
  scrollHeight?: number;
  clientHeight?: number;
}): void {
  const { scrollY = 0, scrollHeight = 0, clientHeight = 0 } = options;
  defineValue(window, "scrollX", 0);
  defineValue(window, "scrollY", scrollY);
  defineValue(document.documentElement, "scrollHeight", scrollHeight);
  defineValue(document.documentElement, "clientHeight", clientHeight);
}

/** Stub an element's scroll offset and scroll metrics. */
function setElementMetrics(
  el: HTMLElement,
  options: { scrollTop?: number; scrollHeight?: number; clientHeight?: number }
): void {
  const { scrollTop = 0, scrollHeight = 0, clientHeight = 0 } = options;
  defineValue(el, "scrollLeft", 0);
  defineValue(el, "scrollTop", scrollTop);
  defineValue(el, "scrollHeight", scrollHeight);
  defineValue(el, "clientHeight", clientHeight);
}

function fireScroll(target: Window | HTMLElement): void {
  act(() => {
    target.dispatchEvent(new Event("scroll"));
  });
}

function fireResize(innerHeight: number): void {
  act(() => {
    (window as { innerHeight: number }).innerHeight = innerHeight;
    window.dispatchEvent(new Event("resize"));
  });
}

function getBar(): HTMLElement {
  return screen.getByRole("progressbar");
}

beforeEach(() => {
  // A 1500px document in a 500px viewport: maxScroll = 1000, at the top.
  setWindowMetrics({ scrollY: 0, scrollHeight: 1500, clientHeight: 500 });
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

// ---------------------------------------------------------------------------
// Defaults & presentation
// ---------------------------------------------------------------------------

describe("defaults", () => {
  it("renders an accessible, non-interactive fixed bar pinned to the top", () => {
    render(<ScrollProgress />);
    const bar = getBar();

    expect(bar).toHaveAttribute("aria-label", DEFAULT_ARIA_LABEL);
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(bar).toHaveAttribute("aria-valuenow", "0");
    expect(bar).toHaveAttribute("data-position", "top");
    expect(bar).toHaveStyle({
      position: "fixed",
      top: "0px",
      left: "0px",
      right: "0px",
      height: `${DEFAULT_BAR_HEIGHT}px`,
      zIndex: DEFAULT_Z_INDEX,
      backgroundColor: DEFAULT_BAR_COLOR,
      pointerEvents: "none",
      transform: "scaleX(0)",
    });
  });

  it("measures the real scroll offset on mount (not 0) when pre-scrolled", () => {
    setWindowMetrics({ scrollY: 500, scrollHeight: 1500, clientHeight: 500 });
    render(<ScrollProgress />);

    expect(getBar()).toHaveAttribute("aria-valuenow", "50");
    expect(getBar()).toHaveStyle({ transform: "scaleX(0.5)" });
  });
});

// ---------------------------------------------------------------------------
// Window scrolling
// ---------------------------------------------------------------------------

describe("window scrolling", () => {
  it("fills the bar as the window scrolls", () => {
    render(<ScrollProgress />);
    expect(getBar()).toHaveAttribute("aria-valuenow", "0");

    setWindowMetrics({ scrollY: 250, scrollHeight: 1500, clientHeight: 500 });
    fireScroll(window);
    expect(getBar()).toHaveAttribute("aria-valuenow", "25");
    expect(getBar()).toHaveStyle({ transform: "scaleX(0.25)" });

    setWindowMetrics({ scrollY: 1000, scrollHeight: 1500, clientHeight: 500 });
    fireScroll(window);
    expect(getBar()).toHaveAttribute("aria-valuenow", "100");
    expect(getBar()).toHaveStyle({ transform: "scaleX(1)" });
  });

  it("clamps overscroll past the bottom to 1", () => {
    setWindowMetrics({ scrollY: 4000, scrollHeight: 1500, clientHeight: 500 });
    render(<ScrollProgress />);
    expect(getBar()).toHaveAttribute("aria-valuenow", "100");
    expect(getBar()).toHaveStyle({ transform: "scaleX(1)" });
  });

  it("clamps rubber-band overscroll above the top to 0", () => {
    setWindowMetrics({ scrollY: -80, scrollHeight: 1500, clientHeight: 500 });
    render(<ScrollProgress />);
    expect(getBar()).toHaveAttribute("aria-valuenow", "0");
  });

  it("reports 0 when the content is shorter than the viewport (nothing to scroll)", () => {
    setWindowMetrics({ scrollY: 0, scrollHeight: 400, clientHeight: 500 });
    render(<ScrollProgress />);

    // maxScroll <= 0 → progress 0, never NaN/Infinity.
    expect(getBar()).toHaveAttribute("aria-valuenow", "0");
    expect(getBar()).toHaveStyle({ transform: "scaleX(0)" });
  });

  it("reports 0 when the content exactly fits the viewport", () => {
    setWindowMetrics({ scrollY: 0, scrollHeight: 500, clientHeight: 500 });
    render(<ScrollProgress />);
    expect(getBar()).toHaveAttribute("aria-valuenow", "0");
  });

  it("recomputes when the viewport resizes without a scroll event", () => {
    setWindowMetrics({ scrollY: 500, scrollHeight: 1500, clientHeight: 500 });
    render(<ScrollProgress />);
    expect(getBar()).toHaveAttribute("aria-valuenow", "50");

    // The viewport grows: maxScroll shrinks to 500, so the same offset is now
    // the very bottom of the page.
    setWindowMetrics({ scrollY: 500, scrollHeight: 1500, clientHeight: 1000 });
    fireResize(1000);
    expect(getBar()).toHaveAttribute("aria-valuenow", "100");
  });
});

// ---------------------------------------------------------------------------
// Container target
// ---------------------------------------------------------------------------

describe("container target", () => {
  function makeContainer(): {
    el: HTMLDivElement;
    ref: React.RefObject<HTMLDivElement | null>;
  } {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const ref = createRef<HTMLDivElement>();
    (ref as { current: HTMLDivElement | null }).current = el;
    return { el, ref };
  }

  it("tracks a scrollable container instead of the window", () => {
    const { el, ref } = makeContainer();
    setElementMetrics(el, { scrollTop: 0, scrollHeight: 2000, clientHeight: 400 });

    render(<ScrollProgress target={ref} />);
    expect(getBar()).toHaveAttribute("aria-valuenow", "0");

    setElementMetrics(el, {
      scrollTop: 800,
      scrollHeight: 2000,
      clientHeight: 400,
    });
    fireScroll(el);
    expect(getBar()).toHaveAttribute("aria-valuenow", "50");
    expect(getBar()).toHaveStyle({ transform: "scaleX(0.5)" });
  });

  it("measures a pre-scrolled container on mount", () => {
    const { el, ref } = makeContainer();
    setElementMetrics(el, {
      scrollTop: 1600,
      scrollHeight: 2000,
      clientHeight: 400,
    });

    render(<ScrollProgress target={ref} />);
    expect(getBar()).toHaveAttribute("aria-valuenow", "100");
  });

  it("ignores window scroll while tracking a container", () => {
    const { el, ref } = makeContainer();
    setElementMetrics(el, { scrollTop: 0, scrollHeight: 2000, clientHeight: 400 });

    render(<ScrollProgress target={ref} />);

    setWindowMetrics({ scrollY: 999, scrollHeight: 1500, clientHeight: 500 });
    fireScroll(window);
    expect(getBar()).toHaveAttribute("aria-valuenow", "0");
  });

  it("reports 0 for a container with nothing to scroll", () => {
    const { el, ref } = makeContainer();
    setElementMetrics(el, { scrollTop: 0, scrollHeight: 300, clientHeight: 400 });

    render(<ScrollProgress target={ref} />);
    expect(getBar()).toHaveAttribute("aria-valuenow", "0");
  });

  it("reports 0 while the target ref is not attached", () => {
    const ref = createRef<HTMLDivElement>();
    render(<ScrollProgress target={ref} />);
    expect(getBar()).toHaveAttribute("aria-valuenow", "0");
  });

  it("tracks a container rendered AFTER the bar (ref attached by React, not pre-assigned)", () => {
    // Regression: this is the documented usage — the bar precedes the ref'd
    // container in the tree, so the ref is still null when the scroll hook's
    // layout effect first runs. The component must still end up subscribed.
    const ref = createRef<HTMLDivElement>();
    render(
      <>
        <ScrollProgress target={ref} />
        <div ref={ref} data-testid="late-container" />
      </>
    );

    const el = screen.getByTestId("late-container");
    setElementMetrics(el, {
      scrollTop: 500,
      scrollHeight: 2000,
      clientHeight: 1000,
    });
    fireScroll(el);
    expect(getBar()).toHaveAttribute("aria-valuenow", "50");

    setElementMetrics(el, {
      scrollTop: 1000,
      scrollHeight: 2000,
      clientHeight: 1000,
    });
    fireScroll(el);
    expect(getBar()).toHaveAttribute("aria-valuenow", "100");
  });

  it("re-subscribes when target swaps to a different container", () => {
    const a = makeContainer();
    setElementMetrics(a.el, { scrollTop: 0, scrollHeight: 2000, clientHeight: 400 });
    const b = makeContainer();
    setElementMetrics(b.el, {
      scrollTop: 1600,
      scrollHeight: 2000,
      clientHeight: 400,
    });

    const { rerender } = render(<ScrollProgress target={a.ref} />);
    expect(getBar()).toHaveAttribute("aria-valuenow", "0");

    // Swap: the bar immediately reflects B's pre-scrolled position.
    rerender(<ScrollProgress target={b.ref} />);
    expect(getBar()).toHaveAttribute("aria-valuenow", "100");

    // The old container's scroll no longer affects the bar…
    setElementMetrics(a.el, { scrollTop: 800, scrollHeight: 2000, clientHeight: 400 });
    fireScroll(a.el);
    expect(getBar()).toHaveAttribute("aria-valuenow", "100");

    // …and the new one's does.
    setElementMetrics(b.el, { scrollTop: 800, scrollHeight: 2000, clientHeight: 400 });
    fireScroll(b.el);
    expect(getBar()).toHaveAttribute("aria-valuenow", "50");
  });
});

// ---------------------------------------------------------------------------
// Throttling
// ---------------------------------------------------------------------------

describe("throttleMs", () => {
  it("throttles scroll updates but always settles on the trailing edge", () => {
    vi.useFakeTimers();
    render(<ScrollProgress throttleMs={200} />);

    // Leading edge: the first scroll commits immediately.
    setWindowMetrics({ scrollY: 100, scrollHeight: 1500, clientHeight: 500 });
    fireScroll(window);
    expect(getBar()).toHaveAttribute("aria-valuenow", "10");

    // Within the throttle window: not committed yet…
    setWindowMetrics({ scrollY: 500, scrollHeight: 1500, clientHeight: 500 });
    fireScroll(window);
    expect(getBar()).toHaveAttribute("aria-valuenow", "10");

    // …but the trailing edge always lands on the resting position.
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(getBar()).toHaveAttribute("aria-valuenow", "50");
  });
});

// ---------------------------------------------------------------------------
// Presentation props
// ---------------------------------------------------------------------------

describe("presentation", () => {
  it("pins to the bottom with position='bottom'", () => {
    render(<ScrollProgress position="bottom" />);
    const bar = getBar();

    expect(bar).toHaveAttribute("data-position", "bottom");
    expect(bar).toHaveStyle({ bottom: "0px" });
  });

  it("applies custom color, height, and zIndex", () => {
    render(<ScrollProgress color="#10b981" height={6} zIndex={50} />);
    expect(getBar()).toHaveStyle({
      backgroundColor: "#10b981",
      height: "6px",
      zIndex: 50,
    });
  });

  it("accepts a string height (any CSS length)", () => {
    render(<ScrollProgress height="0.5rem" />);
    expect(getBar()).toHaveStyle({ height: "0.5rem" });
  });

  it("overrides the accessible name via aria-label", () => {
    render(<ScrollProgress aria-label="Reading progress" />);
    expect(getBar()).toHaveAttribute("aria-label", "Reading progress");
  });

  it("passes through className and lets style overrides win", () => {
    const style: CSSProperties = {
      backgroundColor: "rgb(1, 2, 3)",
      borderRadius: 2,
    };
    render(<ScrollProgress className="my-bar" style={style} />);
    const bar = getBar();

    expect(bar).toHaveClass("my-bar");
    expect(bar).toHaveStyle({
      backgroundColor: "rgb(1, 2, 3)",
      borderRadius: "2px",
    });
  });
});

// ---------------------------------------------------------------------------
// render escape hatch
// ---------------------------------------------------------------------------

describe("render prop", () => {
  it("receives the progress and fully owns the UI", () => {
    setWindowMetrics({ scrollY: 250, scrollHeight: 1500, clientHeight: 500 });
    render(
      <ScrollProgress
        render={(progress) => (
          <span data-testid="custom">{Math.round(progress * 100)}%</span>
        )}
      />
    );

    // The default bar never renders alongside the render prop.
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getByTestId("custom")).toHaveTextContent("25%");

    setWindowMetrics({ scrollY: 1000, scrollHeight: 1500, clientHeight: 500 });
    fireScroll(window);
    expect(screen.getByTestId("custom")).toHaveTextContent("100%");
  });

  it("renders nothing when the render prop returns null", () => {
    const { container } = render(<ScrollProgress render={() => null} />);
    expect(container).toBeEmptyDOMElement();
  });
});

// ---------------------------------------------------------------------------
// StrictMode
// ---------------------------------------------------------------------------

describe("StrictMode", () => {
  it("mounts, tracks, and unmounts cleanly under StrictMode", () => {
    setWindowMetrics({ scrollY: 500, scrollHeight: 1500, clientHeight: 500 });
    const { unmount } = render(
      <StrictMode>
        <ScrollProgress />
      </StrictMode>
    );
    expect(getBar()).toHaveAttribute("aria-valuenow", "50");

    setWindowMetrics({ scrollY: 1000, scrollHeight: 1500, clientHeight: 500 });
    fireScroll(window);
    expect(getBar()).toHaveAttribute("aria-valuenow", "100");

    unmount();
    expect(() => fireScroll(window)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SSR
// ---------------------------------------------------------------------------

describe("SSR", () => {
  it("server-renders the bar at progress 0 without touching browser APIs", () => {
    const html = renderToStaticMarkup(<ScrollProgress />);

    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="0"');
    expect(html).toContain("scaleX(0)");
  });

  it("server-renders the render prop with progress 0", () => {
    const html = renderToStaticMarkup(
      <ScrollProgress render={(progress) => <span>{progress}</span>} />
    );
    expect(html).toBe("<span>0</span>");
  });
});

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

describe("cleanup", () => {
  it("removes the scroll listener on unmount (no setState after unmount)", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { unmount } = render(<ScrollProgress />);
    unmount();

    setWindowMetrics({ scrollY: 800, scrollHeight: 1500, clientHeight: 500 });
    expect(() => fireScroll(window)).not.toThrow();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("removes a container's scroll listener on unmount", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    setElementMetrics(el, { scrollTop: 0, scrollHeight: 2000, clientHeight: 400 });
    const ref = createRef<HTMLDivElement>();
    (ref as { current: HTMLDivElement | null }).current = el;

    const { unmount } = render(<ScrollProgress target={ref} />);
    unmount();

    setElementMetrics(el, {
      scrollTop: 500,
      scrollHeight: 2000,
      clientHeight: 400,
    });
    expect(() => fireScroll(el)).not.toThrow();
  });
});
