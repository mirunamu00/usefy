import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StrictMode, createRef } from "react";
import { renderToString } from "react-dom/server";
import { act, render } from "@testing-library/react";
import { Confetti, type ConfettiController } from "./Confetti";
import type { FireOptions } from "./types";

/* ---------------- shared jsdom doubles ---------------- */

class RafHarness {
  now = 1000;
  private callbacks = new Map<number, FrameRequestCallback>();
  private nextId = 1;
  install(): void {
    window.requestAnimationFrame = (cb: FrameRequestCallback): number => {
      const id = this.nextId++;
      this.callbacks.set(id, cb);
      return id;
    };
    window.cancelAnimationFrame = (id: number): void => {
      this.callbacks.delete(id);
    };
  }
  get pending(): number {
    return this.callbacks.size;
  }
  frame(dt: number = 1000 / 60): void {
    this.now += dt;
    const due = [...this.callbacks.values()];
    this.callbacks.clear();
    for (const cb of due) cb(this.now);
  }
  advance(ms: number, step: number = 1000 / 60): void {
    for (let t = 0; t < ms; t += step) this.frame(step);
  }
}

class MockResizeObserver {
  static instances: MockResizeObserver[] = [];
  disconnected = false;
  constructor(_cb: ResizeObserverCallback) {
    MockResizeObserver.instances.push(this);
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {
    this.disconnected = true;
  }
}

function createMockCtx(): CanvasRenderingContext2D {
  return {
    globalAlpha: 1,
    fillStyle: "",
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    ellipse: vi.fn(),
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

function stubMatchMedia(reduce: boolean): void {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("prefers-reduced-motion") ? reduce : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

function setPageVisibility(state: "visible" | "hidden"): void {
  Object.defineProperty(document, "visibilityState", {
    value: state,
    configurable: true,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

function overlayCanvases(): HTMLCanvasElement[] {
  return Array.from(
    document.body.querySelectorAll<HTMLCanvasElement>("canvas[data-usefy-confetti]"),
  );
}

const BURST: FireOptions = {
  count: 1,
  shapes: ["circle"],
  lifetime: 100,
  flat: true,
};

let raf: RafHarness;

beforeEach(() => {
  raf = new RafHarness();
  raf.install();
  MockResizeObserver.instances = [];
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () => createMockCtx(),
  );
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  stubMatchMedia(false);
});

afterEach(() => {
  act(() => setPageVisibility("visible"));
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/* ---------------- tests ---------------- */

describe("Confetti — SSR", () => {
  it("renders empty markup on the server (overlay mounts after hydration)", () => {
    expect(renderToString(<Confetti />)).toBe("");
  });

  it("inline variant server-renders the (inert) canvas markup", () => {
    const html = renderToString(<Confetti variant="inline" />);
    expect(html).toContain("<canvas");
    expect(html).toContain("aria-hidden");
  });
});

describe("Confetti — overlay mounting", () => {
  it("portals exactly one decorative, non-blocking canvas into document.body", () => {
    render(<Confetti />);
    const canvases = overlayCanvases();
    expect(canvases).toHaveLength(1);
    const canvas = canvases[0];
    expect(canvas.parentElement).toBe(document.body);
    expect(canvas.getAttribute("aria-hidden")).toBe("true");
    expect(canvas.style.pointerEvents).toBe("none");
    expect(canvas.style.position).toBe("fixed");
    expect(canvas.style.zIndex).toBe("1100");
  });

  it("applies zIndex, className, and style overrides", () => {
    render(
      <Confetti zIndex={42} className="party" style={{ opacity: "0.5" }} />,
    );
    const canvas = overlayCanvases()[0];
    expect(canvas.style.zIndex).toBe("42");
    expect(canvas.className).toBe("party");
    expect(canvas.style.opacity).toBe("0.5");
    expect(canvas.style.pointerEvents).toBe("none"); // built-ins retained
  });

  it("unmounting removes the canvas and every engine resource", () => {
    const { unmount } = render(<Confetti />);
    expect(overlayCanvases()).toHaveLength(1);
    unmount();
    expect(overlayCanvases()).toHaveLength(0);
    expect(raf.pending).toBe(0);
    expect(
      MockResizeObserver.instances.filter((i) => !i.disconnected),
    ).toHaveLength(0);
  });

  it("StrictMode double-mount leaves exactly one canvas and one live engine", () => {
    const { unmount } = render(
      <StrictMode>
        <Confetti />
      </StrictMode>,
    );
    expect(overlayCanvases()).toHaveLength(1);
    expect(
      MockResizeObserver.instances.filter((i) => !i.disconnected),
    ).toHaveLength(1);

    unmount();
    expect(overlayCanvases()).toHaveLength(0);
    expect(raf.pending).toBe(0);
    expect(
      MockResizeObserver.instances.filter((i) => !i.disconnected),
    ).toHaveLength(0);
  });
});

describe("Confetti — inline variant", () => {
  it("creates the engine exactly once per mount (no destroy+recreate on the mount flip)", () => {
    render(<Confetti variant="inline" />);
    // One engine total — the mounted-state flip must not recreate it.
    expect(MockResizeObserver.instances).toHaveLength(1);
    expect(MockResizeObserver.instances[0].disconnected).toBe(false);
  });

  it("inline + fireOnMount fires exactly one burst", () => {
    const onComplete = vi.fn();
    render(
      <Confetti variant="inline" fireOnMount={BURST} onComplete={onComplete} />,
    );
    expect(MockResizeObserver.instances).toHaveLength(1); // single engine ⇒ single burst
    expect(raf.pending).toBe(1);
    act(() => raf.advance(250));
    expect(raf.pending).toBe(0);
    expect(onComplete).toHaveBeenCalledTimes(1); // one burst, one completion
  });

  it("renders the canvas in place (absolute, filling the parent)", () => {
    const { container } = render(
      <div style={{ position: "relative" }}>
        <Confetti variant="inline" />
      </div>,
    );
    const canvas = container.querySelector<HTMLCanvasElement>(
      "canvas[data-usefy-confetti='inline']",
    );
    expect(canvas).not.toBeNull();
    expect(canvas!.style.position).toBe("absolute");
    expect(canvas!.style.pointerEvents).toBe("none");
    expect(document.body.contains(canvas!)).toBe(true);
    expect(canvas!.parentElement?.tagName).toBe("DIV"); // not portaled to body
  });
});

describe("Confetti — controllerRef", () => {
  it("exposes a working, referentially stable controller", async () => {
    const controllerRef = createRef<ConfettiController>();
    const { rerender } = render(<Confetti controllerRef={controllerRef} />);
    expect(controllerRef.current).not.toBeNull();
    const first = controllerRef.current!;

    rerender(<Confetti controllerRef={controllerRef} zIndex={7} />);
    expect(controllerRef.current).toBe(first); // stable across re-renders

    let promise!: Promise<void>;
    act(() => {
      promise = first.fire(BURST);
    });
    expect(raf.pending).toBe(1); // engine animating
    act(() => raf.advance(250));
    await expect(promise).resolves.toBeUndefined();
    expect(raf.pending).toBe(0);

    // emit + stop + clear all reachable through the controller.
    act(() => {
      first.emit({ ...BURST, lifetime: 60_000, particlesPerSecond: 40 });
    });
    expect(raf.pending).toBe(1);
    act(() => {
      first.stop();
      first.clear();
    });
    act(() => raf.frame());
    expect(raf.pending).toBe(0);
  });
});

describe("Confetti — onComplete", () => {
  it("fires once per idle edge, and again after a new burst", () => {
    const onComplete = vi.fn();
    const controllerRef = createRef<ConfettiController>();
    render(<Confetti controllerRef={controllerRef} onComplete={onComplete} />);

    act(() => {
      void controllerRef.current!.fire(BURST);
    });
    expect(onComplete).not.toHaveBeenCalled();
    act(() => raf.advance(250));
    expect(onComplete).toHaveBeenCalledTimes(1);

    act(() => {
      void controllerRef.current!.fire(BURST);
    });
    act(() => raf.advance(250));
    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it("does NOT fire when unmounting mid-animation", () => {
    const onComplete = vi.fn();
    const controllerRef = createRef<ConfettiController>();
    const { unmount } = render(
      <Confetti controllerRef={controllerRef} onComplete={onComplete} />,
    );
    act(() => {
      void controllerRef.current!.fire({ ...BURST, lifetime: 60_000 });
    });
    unmount();
    expect(onComplete).not.toHaveBeenCalled();
    expect(raf.pending).toBe(0);
  });

  it("reads the latest onComplete callback without re-creating the engine", () => {
    const first = vi.fn();
    const second = vi.fn();
    const controllerRef = createRef<ConfettiController>();
    const { rerender } = render(
      <Confetti controllerRef={controllerRef} onComplete={first} />,
    );
    const observersBefore = MockResizeObserver.instances.length;

    rerender(<Confetti controllerRef={controllerRef} onComplete={second} />);
    expect(MockResizeObserver.instances.length).toBe(observersBefore); // engine untouched

    act(() => {
      void controllerRef.current!.fire(BURST);
    });
    act(() => raf.advance(250));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});

describe("Confetti — fireOnMount", () => {
  it("true → one burst right after mount", () => {
    render(<Confetti fireOnMount />);
    expect(raf.pending).toBe(1); // engine animating immediately
    act(() => raf.advance(3500)); // default 3000ms lifetime
    expect(raf.pending).toBe(0);
  });

  it("FireOptions form → burst with those options; onComplete follows", () => {
    const onComplete = vi.fn();
    render(<Confetti fireOnMount={BURST} onComplete={onComplete} />);
    expect(raf.pending).toBe(1);
    act(() => raf.advance(250)); // BURST lifetime is only 100ms
    expect(raf.pending).toBe(0);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("respects reduced motion: no burst, no activity, no onComplete", () => {
    stubMatchMedia(true);
    const onComplete = vi.fn();
    render(<Confetti fireOnMount onComplete={onComplete} />);
    expect(raf.pending).toBe(0);
    act(() => raf.advance(200));
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('fires anyway under reducedMotion="ignore"', () => {
    stubMatchMedia(true);
    render(<Confetti fireOnMount={BURST} reducedMotion="ignore" />);
    expect(raf.pending).toBe(1);
  });

  it("StrictMode overlay + fireOnMount leaves a single live burst and completes once", () => {
    const onComplete = vi.fn();
    render(
      <StrictMode>
        <Confetti fireOnMount={BURST} onComplete={onComplete} />
      </StrictMode>,
    );
    // Strict double-mount creates/destroys one throwaway engine; exactly
    // one live engine and one live burst remain.
    expect(
      MockResizeObserver.instances.filter((i) => !i.disconnected),
    ).toHaveLength(1);
    expect(raf.pending).toBe(1);

    act(() => raf.advance(250));
    expect(raf.pending).toBe(0);
    expect(onComplete).toHaveBeenCalledTimes(1); // the destroyed engine reported nothing
  });
});

describe("Confetti — page visibility", () => {
  it("pauses while hidden, resumes on return", () => {
    const controllerRef = createRef<ConfettiController>();
    render(<Confetti controllerRef={controllerRef} />);
    act(() => {
      void controllerRef.current!.fire({ ...BURST, lifetime: 60_000 });
    });
    expect(raf.pending).toBe(1);

    act(() => setPageVisibility("hidden"));
    expect(raf.pending).toBe(0);

    act(() => setPageVisibility("visible"));
    expect(raf.pending).toBe(1);
  });
});
