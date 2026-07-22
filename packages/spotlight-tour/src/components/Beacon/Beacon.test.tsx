import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { SpotlightBeacon } from "./Beacon";
import { MUTATION_RERESOLVE_THROTTLE_MS } from "../../useSpotlightTour";

function addTarget(
  id: string,
  rect: { x?: number; y?: number; width?: number; height?: number } = {}
): HTMLElement {
  const el = document.createElement("div");
  el.id = id;
  const r = { x: 100, y: 50, width: 200, height: 40, ...rect };
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

const beacon = () => document.querySelector("[data-tour-beacon]");

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

describe("SpotlightBeacon", () => {
  it("renders a labelled button pinned to the target's top-right corner", () => {
    addTarget("b0", { x: 100, y: 50, width: 200, height: 40 });
    render(<SpotlightBeacon target="#b0" onActivate={() => {}} />);
    const btn = beacon() as HTMLButtonElement;
    expect(btn).not.toBeNull();
    expect(btn.tagName).toBe("BUTTON");
    expect(btn.getAttribute("aria-label")).toBe("Start tour");
    expect(btn.style.left).toBe("300px"); // x + width
    expect(btn.style.top).toBe("50px");
  });

  it("supports a custom aria-label and className", () => {
    addTarget("b0");
    render(
      <SpotlightBeacon
        target="#b0"
        onActivate={() => {}}
        aria-label="투어 시작"
        className="my-beacon"
      />
    );
    expect(screen.getByLabelText("투어 시작")).toBeInTheDocument();
    expect(document.querySelector(".my-beacon")).toBe(beacon());
  });

  it("fires onActivate on click", () => {
    addTarget("b0");
    const onActivate = vi.fn();
    render(<SpotlightBeacon target="#b0" onActivate={onActivate} />);
    fireEvent.click(beacon()!);
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it("renders nothing while the target is unresolved", () => {
    render(<SpotlightBeacon target="#missing" onActivate={() => {}} />);
    expect(beacon()).toBeNull();
  });

  it("appears when the target mounts later, and disappears when it unmounts", async () => {
    vi.useFakeTimers();
    try {
      render(<SpotlightBeacon target="#late" onActivate={() => {}} />);
      expect(beacon()).toBeNull();

      let el: HTMLElement;
      await act(async () => {
        el = addTarget("late");
      });
      act(() => void vi.advanceTimersByTime(MUTATION_RERESOLVE_THROTTLE_MS));
      expect(beacon()).not.toBeNull();

      await act(async () => {
        el!.remove();
      });
      act(() => void vi.advanceTimersByTime(MUTATION_RERESOLVE_THROTTLE_MS));
      expect(beacon()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders nothing for a target with an all-zero rect (display:none)", () => {
    // no mocked getBoundingClientRect — jsdom reports all zeros, the same
    // shape a display:none target produces in a real browser
    const el = document.createElement("div");
    el.id = "hidden-target";
    document.body.appendChild(el);
    render(<SpotlightBeacon target="#hidden-target" onActivate={() => {}} />);
    expect(beacon()).toBeNull();
  });

  it("applies the static class under prefers-reduced-motion", () => {
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
      addTarget("b0");
      render(<SpotlightBeacon target="#b0" onActivate={() => {}} />);
      expect((beacon() as HTMLElement).className).toMatch(/static/);
    } finally {
      window.matchMedia = original;
    }
  });

  it("renders to an empty string on the server", () => {
    const html = renderToString(
      <SpotlightBeacon target="#b0" onActivate={() => {}} />
    );
    expect(html).toBe("");
  });
});
