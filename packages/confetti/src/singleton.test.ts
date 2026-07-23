import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fireConfetti,
  resetConfetti,
  SINGLETON_TEARDOWN_MS,
} from "./singleton";
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

function singletonCanvases(): HTMLCanvasElement[] {
  return Array.from(
    document.body.querySelectorAll<HTMLCanvasElement>(
      "canvas[data-usefy-confetti='singleton']",
    ),
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
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
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
  resetConfetti(); // module-level state must never leak between tests
  setPageVisibility("visible");
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/* ---------------- tests ---------------- */

describe("fireConfetti — singleton canvas management", () => {
  it("lazily creates one full-viewport, non-blocking canvas and animates", () => {
    expect(singletonCanvases()).toHaveLength(0);
    void fireConfetti(BURST);
    const canvases = singletonCanvases();
    expect(canvases).toHaveLength(1);
    const canvas = canvases[0];
    expect(canvas.getAttribute("aria-hidden")).toBe("true");
    expect(canvas.style.position).toBe("fixed");
    expect(canvas.style.pointerEvents).toBe("none");
    expect(canvas.style.zIndex).toBe("1100");
    expect(raf.pending).toBe(1);
  });

  it("reuses the same canvas and engine across calls", () => {
    void fireConfetti(BURST);
    const first = singletonCanvases()[0];
    void fireConfetti(BURST);
    void fireConfetti(BURST);
    expect(singletonCanvases()).toHaveLength(1);
    expect(singletonCanvases()[0]).toBe(first);
    expect(MockResizeObserver.instances).toHaveLength(1); // one engine total
  });

  it("resolves when the burst has died and the loop idles", async () => {
    const promise = fireConfetti(BURST);
    raf.advance(250);
    await expect(promise).resolves.toBeUndefined();
    expect(raf.pending).toBe(0);
  });
});

describe("fireConfetti — idle teardown", () => {
  it("removes the canvas SINGLETON_TEARDOWN_MS after going idle", () => {
    void fireConfetti(BURST);
    raf.advance(250); // burst dies → idle edge arms the teardown timer
    expect(singletonCanvases()).toHaveLength(1);

    vi.advanceTimersByTime(SINGLETON_TEARDOWN_MS - 1);
    expect(singletonCanvases()).toHaveLength(1); // not yet

    vi.advanceTimersByTime(1);
    expect(singletonCanvases()).toHaveLength(0); // gone
    expect(
      MockResizeObserver.instances.filter((i) => !i.disconnected),
    ).toHaveLength(0); // engine destroyed too
  });

  it("a follow-up fire before the deadline cancels the teardown (warm reuse)", () => {
    void fireConfetti(BURST);
    raf.advance(250); // idle → timer armed
    vi.advanceTimersByTime(SINGLETON_TEARDOWN_MS - 1);

    void fireConfetti(BURST); // active edge cancels the pending teardown
    vi.advanceTimersByTime(SINGLETON_TEARDOWN_MS);
    expect(singletonCanvases()).toHaveLength(1); // still here, still animating

    raf.advance(250); // idle again → re-armed
    vi.advanceTimersByTime(SINGLETON_TEARDOWN_MS);
    expect(singletonCanvases()).toHaveLength(0);
  });

  it("a fresh canvas is created after teardown", () => {
    void fireConfetti(BURST);
    const first = singletonCanvases()[0];
    raf.advance(250);
    vi.advanceTimersByTime(SINGLETON_TEARDOWN_MS);
    expect(singletonCanvases()).toHaveLength(0);

    void fireConfetti(BURST);
    expect(singletonCanvases()).toHaveLength(1);
    expect(singletonCanvases()[0]).not.toBe(first);
  });
});

describe("resetConfetti", () => {
  it("destroys the singleton immediately and is safe to call repeatedly", () => {
    void fireConfetti({ ...BURST, lifetime: 60_000 });
    expect(singletonCanvases()).toHaveLength(1);
    expect(raf.pending).toBe(1);

    resetConfetti();
    expect(singletonCanvases()).toHaveLength(0);
    expect(raf.pending).toBe(0);
    expect(
      MockResizeObserver.instances.filter((i) => !i.disconnected),
    ).toHaveLength(0);

    resetConfetti(); // idempotent no-op
    expect(singletonCanvases()).toHaveLength(0);
  });

  it("settles the in-flight fire promise", async () => {
    const promise = fireConfetti({ ...BURST, lifetime: 60_000 });
    resetConfetti();
    await expect(promise).resolves.toBeUndefined();
  });
});

describe("fireConfetti — SSR & reduced motion", () => {
  it("is a resolved no-op without a document (SSR)", async () => {
    vi.stubGlobal("document", undefined);
    const promise = fireConfetti();
    vi.unstubAllGlobals();
    await expect(promise).resolves.toBeUndefined();
    expect(singletonCanvases()).toHaveLength(0); // nothing was created
  });

  it("reduced motion: resolves immediately, canvas reclaimed by the birth timer", async () => {
    stubMatchMedia(true);
    await expect(fireConfetti({ count: 100 })).resolves.toBeUndefined();
    expect(raf.pending).toBe(0); // no animation ran
    expect(singletonCanvases()).toHaveLength(1); // canvas exists but idle…

    vi.advanceTimersByTime(SINGLETON_TEARDOWN_MS);
    expect(singletonCanvases()).toHaveLength(0); // …and is reclaimed on time
  });
});

describe("fireConfetti — page visibility (engine-side listener)", () => {
  it("pauses while the tab is hidden and resumes on return", () => {
    void fireConfetti({ ...BURST, lifetime: 60_000 });
    expect(raf.pending).toBe(1);

    setPageVisibility("hidden");
    expect(raf.pending).toBe(0);

    setPageVisibility("visible");
    expect(raf.pending).toBe(1);
  });

  it("removes its visibilitychange listener on teardown", () => {
    void fireConfetti(BURST);
    raf.advance(250);
    vi.advanceTimersByTime(SINGLETON_TEARDOWN_MS);
    expect(singletonCanvases()).toHaveLength(0);
    // A visibility flip after teardown must not throw or resurrect anything.
    setPageVisibility("hidden");
    setPageVisibility("visible");
    expect(raf.pending).toBe(0);
    expect(singletonCanvases()).toHaveLength(0);
  });
});
