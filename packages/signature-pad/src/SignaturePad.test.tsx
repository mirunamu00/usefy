import { createRef, Profiler, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SignaturePad, type SignaturePadController } from "./SignaturePad";
import type { SignatureData } from "./types";

// ── Canvas doubles (jsdom has no 2D context) ─────────────────────────

interface RecordedCall {
  method: string;
  args: unknown[];
}

type MockedCanvas = HTMLCanvasElement & { __calls?: RecordedCall[]; __ctx?: unknown };

const prototypeDescriptors: PropertyDescriptor[] = [];

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
        _fillStyle: "",
        _strokeStyle: "",
        lineWidth: 0,
      };
      Object.defineProperty(target, "fillStyle", {
        get() {
          return target._fillStyle;
        },
        set(value: string) {
          target._fillStyle = value;
          calls.push({ method: "fillStyle", args: [value] });
        },
      });
      Object.defineProperty(target, "strokeStyle", {
        get() {
          return target._strokeStyle;
        },
        set(value: string) {
          target._strokeStyle = value;
          calls.push({ method: "strokeStyle", args: [value] });
        },
      });
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
  // Give React-created canvases a real CSS size (jsdom reports 0).
  Object.defineProperty(HTMLCanvasElement.prototype, "clientWidth", {
    get: () => 300,
    configurable: true,
  });
  Object.defineProperty(HTMLCanvasElement.prototype, "clientHeight", {
    get: () => 150,
    configurable: true,
  });
  prototypeDescriptors.push({ configurable: true });
}

function uninstallSizeMock(): void {
  delete (HTMLCanvasElement.prototype as unknown as Record<string, unknown>).clientWidth;
  delete (HTMLCanvasElement.prototype as unknown as Record<string, unknown>).clientHeight;
  prototypeDescriptors.length = 0;
}

function callsOf(canvas: HTMLCanvasElement): RecordedCall[] {
  return (canvas as MockedCanvas).__calls ?? [];
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

function drawStroke(canvas: HTMLCanvasElement, offset = 0): void {
  act(() => {
    firePointer(canvas, "pointerdown", { clientX: offset, clientY: 10 });
    firePointer(canvas, "pointermove", { clientX: offset + 20, clientY: 12 });
    firePointer(canvas, "pointermove", { clientX: offset + 40, clientY: 8 });
    firePointer(canvas, "pointerup", { clientX: offset + 40, clientY: 8 });
  });
}

const DOT_DOC: SignatureData = {
  v: 1,
  width: 300,
  height: 150,
  strokes: [
    {
      points: [{ x: 40, y: 25, time: 0, pressure: 0 }],
      color: "#123456",
      minWidth: 1,
      maxWidth: 3,
      velocityFilterWeight: 0.7,
      pressure: "auto",
      pointerType: "pen",
    },
  ],
};

beforeEach(() => {
  installCanvasMock();
});

afterEach(() => {
  cleanup();
  uninstallSizeMock();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("<SignaturePad />", () => {
  it("renders a container-filling canvas with role=img and a state-reflecting label", () => {
    const { getByRole } = render(<SignaturePad className="pad" style={{ borderRadius: 8 }} />);
    const canvas = getByRole("img") as HTMLCanvasElement;
    expect(canvas.tagName).toBe("CANVAS");
    expect(canvas.getAttribute("aria-label")).toBe("Signature input area, empty");
    expect(canvas.className).toBe("pad");
    expect(canvas.style.width).toBe("100%");
    expect(canvas.style.height).toBe("100%");
    expect(canvas.style.display).toBe("block");
    expect(canvas.style.borderRadius).toBe("8px"); // style merge

    drawStroke(canvas);
    expect(canvas.getAttribute("aria-label")).toBe("Signature input area, signed");
  });

  it("supports a custom aria-label base", () => {
    const { getByRole } = render(<SignaturePad aria-label="Consent signature" />);
    expect((getByRole("img") as HTMLCanvasElement).getAttribute("aria-label")).toBe(
      "Consent signature, empty",
    );
  });

  it("SSR renders the inert canvas markup without touching the DOM", () => {
    const html = renderToString(<SignaturePad guideline defaultValue={DOT_DOC} />);
    expect(html).toContain("<canvas");
    expect(html).toContain('role="img"');
    expect(html).toContain("Signature input area, empty");
  });

  it("fires onChange on edges only, with {isEmpty, strokeCount}", () => {
    const onChange = vi.fn();
    const onBegin = vi.fn();
    const onEnd = vi.fn();
    const { getByRole } = render(
      <SignaturePad onChange={onChange} onBegin={onBegin} onEnd={onEnd} />,
    );
    const canvas = getByRole("img") as HTMLCanvasElement;
    act(() => {
      firePointer(canvas, "pointerdown", { clientX: 0 });
      for (let i = 1; i <= 6; i++) firePointer(canvas, "pointermove", { clientX: i * 10 });
    });
    expect(onBegin).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled(); // never per point
    act(() => {
      firePointer(canvas, "pointerup", { clientX: 60 });
    });
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ isEmpty: false, strokeCount: 1 });
  });

  it("renders a defaultValue once on mount (draw-call assertion)", () => {
    const controllerRef = createRef<SignaturePadController>();
    const { getByRole } = render(
      <SignaturePad defaultValue={DOT_DOC} controllerRef={controllerRef} />,
    );
    const canvas = getByRole("img") as HTMLCanvasElement;
    // dot at (40,25), radius (1+3)/2 = 2
    const arcs = callsOf(canvas).filter((c) => c.method === "arc");
    expect(arcs.length).toBeGreaterThan(0);
    expect((arcs[arcs.length - 1].args as number[]).slice(0, 3)).toEqual([40, 25, 2]);
    expect(controllerRef.current!.toJSON().strokes).toHaveLength(1);
  });

  it("survives StrictMode double-mount with the defaultValue intact and one engine", () => {
    const addSpy = vi.spyOn(HTMLCanvasElement.prototype, "addEventListener");
    const removeSpy = vi.spyOn(HTMLCanvasElement.prototype, "removeEventListener");
    const controllerRef = createRef<SignaturePadController>();
    const { getByRole, unmount } = render(
      <StrictMode>
        <SignaturePad defaultValue={DOT_DOC} controllerRef={controllerRef} />
      </StrictMode>,
    );
    const net = () =>
      addSpy.mock.calls.filter(([t]) => t === "pointerdown").length -
      removeSpy.mock.calls.filter(([t]) => t === "pointerdown").length;
    expect(net()).toBe(1); // exactly one live engine
    expect(controllerRef.current!.toJSON().strokes).toHaveLength(1); // ink survived
    const canvas = getByRole("img") as HTMLCanvasElement;
    drawStroke(canvas, 100);
    expect(controllerRef.current!.toJSON().strokes).toHaveLength(2);
    unmount();
    expect(net()).toBe(0); // zero orphans
  });

  it("exposes a stable controller with safe no-ops after unmount", async () => {
    const controllerRef = createRef<SignaturePadController>();
    const { rerender, unmount, getByRole } = render(
      <SignaturePad controllerRef={controllerRef} penColor="#111" />,
    );
    const controller = controllerRef.current!;
    rerender(<SignaturePad controllerRef={controllerRef} penColor="#111" aria-label="x" />);
    expect(controllerRef.current).toBe(controller); // stable identity

    drawStroke(getByRole("img") as HTMLCanvasElement);
    expect(controller.isEmpty()).toBe(false);
    act(() => controller.clear());
    expect(controller.isEmpty()).toBe(true);
    act(() => controller.undo());
    expect(controller.isEmpty()).toBe(false);
    act(() => controller.redo());
    expect(controller.isEmpty()).toBe(true);

    unmount();
    expect(() => {
      controller.clear();
      controller.fromJSON(DOT_DOC);
    }).not.toThrow();
    expect(controller.isEmpty()).toBe(true);
    expect(controller.toJSON()).toEqual({ v: 1, width: 0, height: 0, strokes: [] });
    expect(controller.toSVG()).toContain('viewBox="0 0 1 1"');
    await expect(controller.toPNG()).resolves.toBeTruthy();
  });

  it("readOnly is reactive — detaches and re-attaches input in place", () => {
    const controllerRef = createRef<SignaturePadController>();
    const { getByRole, rerender } = render(<SignaturePad controllerRef={controllerRef} />);
    const canvas = getByRole("img") as HTMLCanvasElement;
    drawStroke(canvas);
    expect(controllerRef.current!.toJSON().strokes).toHaveLength(1);

    rerender(<SignaturePad controllerRef={controllerRef} readOnly />);
    drawStroke(canvas, 50);
    expect(controllerRef.current!.toJSON().strokes).toHaveLength(1); // input off

    rerender(<SignaturePad controllerRef={controllerRef} />);
    drawStroke(canvas, 100);
    expect(controllerRef.current!.toJSON().strokes).toHaveLength(2); // input back
  });

  describe("guideline", () => {
    it("draws beneath the ink with configured geometry and sanitized color", () => {
      const { getByRole } = render(
        <SignaturePad
          guideline={{ y: 40, inset: 10, color: "#f00" }}
          defaultValue={DOT_DOC}
        />,
      );
      const calls = callsOf(getByRole("img") as HTMLCanvasElement);
      const moveIdx = calls.findIndex((c) => c.method === "moveTo" && c.args[0] === 10);
      expect(moveIdx).toBeGreaterThanOrEqual(0);
      expect(calls[moveIdx].args).toEqual([10, 40]);
      const lineTo = calls.find((c) => c.method === "lineTo");
      expect(lineTo?.args).toEqual([290, 40]); // 300 − inset
      expect(calls.find((c) => c.method === "strokeStyle")?.args).toEqual(["#f00"]);
      // Beneath the ink: the guideline stroke precedes the first ink arc.
      const strokeIdx = calls.findIndex((c) => c.method === "stroke");
      const arcIdx = calls.findIndex((c) => c.method === "arc");
      expect(strokeIdx).toBeGreaterThanOrEqual(0);
      expect(arcIdx).toBeGreaterThan(strokeIdx);
    });

    it("guideline=true uses defaults; hostile colors fall back", () => {
      const { getByRole } = render(
        <SignaturePad guideline={{ color: 'red"/><script>' }} />,
      );
      const calls = callsOf(getByRole("img") as HTMLCanvasElement);
      expect(calls.find((c) => c.method === "strokeStyle")?.args).toEqual(["#94a3b8"]);

      cleanup();
      const second = render(<SignaturePad guideline />);
      const calls2 = callsOf(second.getByRole("img") as HTMLCanvasElement);
      // defaults: inset 24, y = 75% of 150 = 112.5 → 113 (rounded)
      const move = calls2.find((c) => c.method === "moveTo" && c.args[0] === 24);
      expect(move?.args).toEqual([24, Math.round(150 * 0.75)]);
    });

    it("is excluded from PNG and SVG exports by construction", async () => {
      const controllerRef = createRef<SignaturePadController>();
      render(
        <SignaturePad guideline defaultValue={DOT_DOC} controllerRef={controllerRef} />,
      );
      const svg = controllerRef.current!.toSVG();
      expect(svg).not.toContain("<line");
      expect(svg).not.toContain("94a3b8");

      // Capture the offscreen canvas toPNG creates and inspect its calls.
      const created: HTMLCanvasElement[] = [];
      const original = document.createElement.bind(document);
      vi.spyOn(document, "createElement").mockImplementation(((tag: string) => {
        const el = original(tag);
        if (tag === "canvas") created.push(el as HTMLCanvasElement);
        return el;
      }) as never);
      await controllerRef.current!.toPNG();
      expect(created).toHaveLength(1);
      const offCalls = callsOf(created[0]);
      expect(offCalls.filter((c) => c.method === "arc").length).toBeGreaterThan(0); // ink
      expect(offCalls.filter((c) => c.method === "lineTo")).toHaveLength(0); // no guideline
      expect(offCalls.filter((c) => c.method === "stroke")).toHaveLength(0);
    });

    it("toggling the guideline redraws in place without losing ink", () => {
      const controllerRef = createRef<SignaturePadController>();
      const { getByRole, rerender } = render(
        <SignaturePad controllerRef={controllerRef} defaultValue={DOT_DOC} />,
      );
      const canvas = getByRole("img") as HTMLCanvasElement;
      const before = callsOf(canvas).filter((c) => c.method === "stroke").length;
      expect(before).toBe(0);
      rerender(<SignaturePad controllerRef={controllerRef} defaultValue={DOT_DOC} guideline />);
      expect(callsOf(canvas).filter((c) => c.method === "stroke").length).toBeGreaterThan(0);
      expect(controllerRef.current!.toJSON().strokes).toHaveLength(1); // ink intact
    });
  });

  it("changing ink options recreates the engine but carries the ink over", () => {
    const controllerRef = createRef<SignaturePadController>();
    const { getByRole, rerender } = render(
      <SignaturePad controllerRef={controllerRef} penColor="#111" />,
    );
    const canvas = getByRole("img") as HTMLCanvasElement;
    drawStroke(canvas);
    expect(controllerRef.current!.toJSON().strokes[0].color).toBe("#111");

    rerender(<SignaturePad controllerRef={controllerRef} penColor="#222" />);
    const data = controllerRef.current!.toJSON();
    expect(data.strokes).toHaveLength(1); // ink survived the option change
    expect(data.strokes[0].color).toBe("#111"); // captured style preserved

    drawStroke(canvas, 60);
    const after = controllerRef.current!.toJSON();
    expect(after.strokes).toHaveLength(2);
    expect(after.strokes[1].color).toBe("#222"); // new strokes use new options
  });

  it("a penColor change with existing ink causes zero consumer onChange and zero extra renders", () => {
    const onChange = vi.fn();
    const controllerRef = createRef<SignaturePadController>();
    let commits = 0;
    const ui = (color: string) => (
      <Profiler
        id="pad"
        onRender={() => {
          commits++;
        }}
      >
        <SignaturePad penColor={color} onChange={onChange} controllerRef={controllerRef} />
      </Profiler>
    );
    const { getByRole, rerender } = render(ui("#111"));
    drawStroke(getByRole("img") as HTMLCanvasElement);
    expect(onChange).toHaveBeenCalledTimes(1);

    const commitsBefore = commits;
    rerender(ui("#222"));
    // The carry-restore is internal: same values, no consumer notify...
    expect(onChange).toHaveBeenCalledTimes(1);
    // ...and the state setter bails, so only the prop-change commit lands.
    expect(commits).toBe(commitsBefore + 1);
    expect(controllerRef.current!.toJSON().strokes).toHaveLength(1);
  });

  it("does not recreate the engine for value-identical option objects", () => {
    const addSpy = vi.spyOn(HTMLCanvasElement.prototype, "addEventListener");
    const { rerender } = render(<SignaturePad acceptPointerTypes={["pen", "mouse"]} />);
    const attaches = () => addSpy.mock.calls.filter(([t]) => t === "pointerdown").length;
    const initial = attaches();
    // New array identity, same values — must NOT churn the engine.
    rerender(<SignaturePad acceptPointerTypes={["pen", "mouse"]} />);
    expect(attaches()).toBe(initial);
  });
});
