import { StrictMode } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSignaturePad, type UseSignaturePadOptions, type UseSignaturePadReturn } from "./useSignaturePad";

// ── Canvas doubles (jsdom has no 2D context) ─────────────────────────

interface RecordedCall {
  method: string;
  args: unknown[];
}

type MockedCanvas = HTMLCanvasElement & { __calls?: RecordedCall[]; __ctx?: unknown };

function installCanvasMock(): void {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (
    this: MockedCanvas,
  ) {
    if (!this.__ctx) {
      const calls: RecordedCall[] = [];
      const record =
        (method: string) =>
        (...args: unknown[]) =>
          calls.push({ method, args });
      const target = {
        beginPath: record("beginPath"),
        moveTo: record("moveTo"),
        lineTo: record("lineTo"),
        arc: record("arc"),
        fill: record("fill"),
        stroke: record("stroke"),
        clearRect: record("clearRect"),
        fillRect: record("fillRect"),
        setTransform: record("setTransform"),
        save: record("save"),
        restore: record("restore"),
        fillStyle: "",
        strokeStyle: "",
        lineWidth: 0,
      };
      this.__ctx = target;
      this.__calls = calls;
    }
    return this.__ctx;
  } as never);
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
    "data:image/png;base64,QUJD",
  );
  // jsdom's toBlob never invokes its callback — force the dataURL
  // fallback path so toPNG resolves.
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (cb) {
    cb(null);
  });
}

function firePointer(
  target: EventTarget,
  type: string,
  init: { pointerId?: number; clientX?: number; clientY?: number } = {},
): void {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: init.clientX ?? 0,
    clientY: init.clientY ?? 0,
    button: 0,
  });
  Object.defineProperties(event, {
    pointerId: { value: init.pointerId ?? 1 },
    pointerType: { value: "mouse" },
    pressure: { value: 0 },
  });
  target.dispatchEvent(event);
}

/** Draw a simple committed stroke with real pointer events. */
function drawStroke(canvas: HTMLCanvasElement, offset = 0): void {
  act(() => {
    firePointer(canvas, "pointerdown", { clientX: offset, clientY: 10 });
    firePointer(canvas, "pointermove", { clientX: offset + 20, clientY: 12 });
    firePointer(canvas, "pointermove", { clientX: offset + 40, clientY: 8 });
    firePointer(canvas, "pointerup", { clientX: offset + 40, clientY: 8 });
  });
}

beforeEach(() => {
  installCanvasMock();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ── Probe harness ────────────────────────────────────────────────────

let latest: UseSignaturePadReturn;
let renderCount = 0;

function Probe({
  options,
  attach = true,
}: {
  options?: UseSignaturePadOptions;
  attach?: boolean;
}) {
  renderCount++;
  latest = useSignaturePad(options);
  return attach ? <canvas data-testid="pad" ref={latest.canvasRef} /> : null;
}

describe("useSignaturePad", () => {
  it("creates the engine lazily on attach and tracks edge state", () => {
    const { getByTestId } = render(<Probe />);
    const canvas = getByTestId("pad") as HTMLCanvasElement;
    expect(latest.isEmpty).toBe(true);
    drawStroke(canvas);
    expect(latest.isEmpty).toBe(false);
    expect(latest.strokeCount).toBe(1);
    expect(latest.canUndo).toBe(true);
    act(() => latest.undo());
    expect(latest.strokeCount).toBe(0);
    expect(latest.canRedo).toBe(true);
  });

  it("re-renders ONLY on edges — zero renders while a stroke is drawn", () => {
    renderCount = 0;
    const { getByTestId } = render(<Probe />);
    const canvas = getByTestId("pad") as HTMLCanvasElement;
    const afterMount = renderCount;
    act(() => {
      firePointer(canvas, "pointerdown", { clientX: 0 });
      for (let i = 1; i <= 10; i++) firePointer(canvas, "pointermove", { clientX: i * 10 });
    });
    expect(renderCount).toBe(afterMount); // ink flowing, zero renders
    act(() => {
      firePointer(canvas, "pointerup", { clientX: 100 });
    });
    expect(renderCount).toBe(afterMount + 1); // exactly one edge render
  });

  it("returns referentially stable functions across re-renders", () => {
    const { rerender } = render(<Probe options={{ penColor: "#111" }} />);
    const first = { ...latest };
    rerender(<Probe options={{ penColor: "#222" }} />); // new options object
    expect(latest.canvasRef).toBe(first.canvasRef);
    expect(latest.clear).toBe(first.clear);
    expect(latest.undo).toBe(first.undo);
    expect(latest.redo).toBe(first.redo);
    expect(latest.toPNG).toBe(first.toPNG);
    expect(latest.toSVG).toBe(first.toSVG);
    expect(latest.toJSON).toBe(first.toJSON);
    expect(latest.fromJSON).toBe(first.fromJSON);
  });

  it("is a safe no-op surface before a canvas attaches", async () => {
    render(<Probe attach={false} />);
    expect(() => {
      latest.clear();
      latest.undo();
      latest.redo();
      latest.fromJSON({ v: 1, width: 0, height: 0, strokes: [] });
    }).not.toThrow();
    expect(latest.toJSON()).toEqual({ v: 1, width: 0, height: 0, strokes: [] });
    expect(latest.toSVG()).toContain('viewBox="0 0 1 1"');
    const { dataURL, blob } = await latest.toPNG();
    expect(dataURL).toMatch(/^data:image\/png/);
    expect(blob.type).toBe("image/png");
  });

  it("routes exports/serialization through the attached engine", async () => {
    const { getByTestId } = render(<Probe />);
    const canvas = getByTestId("pad") as HTMLCanvasElement;
    drawStroke(canvas);

    const data = latest.toJSON();
    expect(data.strokes).toHaveLength(1);
    expect(latest.toSVG()).toContain("<path");
    const { dataURL, blob } = await latest.toPNG();
    expect(dataURL).toMatch(/^data:image\/png/);
    expect(blob.type).toBe("image/png");

    act(() => latest.fromJSON({ v: 1, width: 0, height: 0, strokes: [] }));
    expect(latest.isEmpty).toBe(true);
    act(() => latest.fromJSON(data));
    expect(latest.strokeCount).toBe(1);
    act(() => latest.clear());
    expect(latest.isEmpty).toBe(true);
    act(() => latest.redo());
    expect(latest.isEmpty).toBe(true); // nothing to redo — safe
  });

  it("emptyToPNG rejects cleanly in a DOM-less environment", async () => {
    const { emptyToPNG } = await import("./reactFallbacks");
    vi.stubGlobal("document", undefined);
    await expect(emptyToPNG()).rejects.toThrow(/needs a DOM/);
    vi.unstubAllGlobals();
  });

  it("uses the LATEST onBegin/onEnd callbacks (no stale closures)", () => {
    const beginA = vi.fn();
    const endA = vi.fn();
    const beginB = vi.fn();
    const endB = vi.fn();
    const { getByTestId, rerender } = render(
      <Probe options={{ onBegin: beginA, onEnd: endA }} />,
    );
    rerender(<Probe options={{ onBegin: beginB, onEnd: endB }} />);
    drawStroke(getByTestId("pad") as HTMLCanvasElement);
    expect(beginA).not.toHaveBeenCalled();
    expect(endA).not.toHaveBeenCalled();
    expect(beginB).toHaveBeenCalledTimes(1);
    expect(endB).toHaveBeenCalledTimes(1);
  });

  it("StrictMode double-mount leaves exactly one engine; unmount leaves zero", () => {
    const addSpy = vi.spyOn(HTMLCanvasElement.prototype, "addEventListener");
    const removeSpy = vi.spyOn(HTMLCanvasElement.prototype, "removeEventListener");
    const netPointerdown = () =>
      addSpy.mock.calls.filter(([t]) => t === "pointerdown").length -
      removeSpy.mock.calls.filter(([t]) => t === "pointerdown").length;

    const { getByTestId, unmount } = render(
      <StrictMode>
        <Probe />
      </StrictMode>,
    );
    expect(netPointerdown()).toBe(1); // exactly one live engine
    const canvas = getByTestId("pad") as HTMLCanvasElement;
    drawStroke(canvas);
    expect(latest.strokeCount).toBe(1); // the surviving engine works

    unmount();
    expect(netPointerdown()).toBe(0); // zero orphaned listeners
    expect(canvas.style.touchAction).toBe(""); // engine teardown restored it
  });

  it("attaching a different canvas destroys the old engine and starts fresh", () => {
    function Host({ which }: { which: "a" | "b" }) {
      latest = useSignaturePad();
      return which === "a" ? (
        <canvas key="a" data-testid="a" ref={latest.canvasRef} />
      ) : (
        <canvas key="b" data-testid="b" ref={latest.canvasRef} />
      );
    }
    const { getByTestId, rerender } = render(<Host which="a" />);
    const canvasA = getByTestId("a") as HTMLCanvasElement;
    drawStroke(canvasA);
    expect(latest.strokeCount).toBe(1);

    rerender(<Host which="b" />);
    const canvasB = getByTestId("b") as HTMLCanvasElement;
    expect(latest.isEmpty).toBe(true); // fresh engine, state reset
    drawStroke(canvasA); // the old canvas is inert (engine destroyed)
    expect(latest.strokeCount).toBe(0);
    drawStroke(canvasB, 50); // the new canvas draws
    expect(latest.strokeCount).toBe(1);
    expect(canvasA.style.touchAction).toBe(""); // old engine cleaned up

    // Fire-through proof: the stable clear() acts on engine B.
    act(() => latest.clear());
    expect(latest.isEmpty).toBe(true);
    expect(latest.canUndo).toBe(true);
  });

  it("bails on value-identical edges (no wasted renders)", () => {
    renderCount = 0;
    const { getByTestId } = render(<Probe />);
    const canvas = getByTestId("pad") as HTMLCanvasElement;
    drawStroke(canvas);
    const data = latest.toJSON();
    act(() => latest.fromJSON(data)); // resets history → canUndo flips → renders
    const before = renderCount;
    // Fully identical state → the setter returns `prev`. React may
    // execute ONE probe render before bailing (documented useState
    // behavior); the bail guarantees it stabilizes — repeated identical
    // edges must not keep rendering.
    act(() => latest.fromJSON(data));
    act(() => latest.fromJSON(data));
    act(() => latest.fromJSON(data));
    expect(renderCount).toBeLessThanOrEqual(before + 1);
  });
});
