import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { useQRCode } from "./useQRCode";
import { clearCache } from "./cache";
import { QRCapacityError } from "./errors";
import { type CanvasRecorder, installCanvasDouble, installImageDouble } from "./__testing__/canvas";

let canvasDouble: CanvasRecorder;

beforeEach(() => {
  clearCache();
  canvasDouble = installCanvasDouble();
});

afterEach(() => {
  cleanup();
  canvasDouble.restore();
  vi.restoreAllMocks();
});

describe("useQRCode", () => {
  it("encodes the value and exposes structured SVG output", () => {
    const { result } = renderHook(() => useQRCode({ value: "https://usefy.dev", level: "Q" }));
    expect(result.current.error).toBeNull();
    expect(result.current.matrix!.level).toBe("Q");
    expect(result.current.svgProps!.paths.length).toBeGreaterThan(0);
    expect(result.current.svgProps!.viewBox).toBe(
      `0 0 ${result.current.matrix!.size + 8} ${result.current.matrix!.size + 8}`,
    );
  });

  it("reuses the matrix across re-renders with unchanged inputs", () => {
    const { result, rerender } = renderHook((props: { value: string }) => useQRCode(props), {
      initialProps: { value: "https://usefy.dev" },
    });
    const first = result.current.matrix;
    rerender({ value: "https://usefy.dev" });
    expect(result.current.matrix).toBe(first);
    rerender({ value: "https://usefy.dev/other" });
    expect(result.current.matrix).not.toBe(first);
  });

  it("re-encodes when an encoding option changes but not when a style option does", () => {
    const { result, rerender } = renderHook(
      (props: Parameters<typeof useQRCode>[0]) => useQRCode(props),
      { initialProps: { value: "USEFY", level: "M", fg: "#000000" } as Parameters<typeof useQRCode>[0] },
    );
    const base = result.current.matrix;

    rerender({ value: "USEFY", level: "M", fg: "#0f172a" });
    expect(result.current.matrix).toBe(base);

    rerender({ value: "USEFY", level: "H", fg: "#0f172a" });
    expect(result.current.matrix).not.toBe(base);
  });

  it("reports encoding failures instead of throwing", () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useQRCode({ value: "A".repeat(5000), level: "H", onError }),
    );
    expect(result.current.matrix).toBeNull();
    expect(result.current.svgProps).toBeNull();
    expect(result.current.error).toBeInstanceOf(QRCapacityError);
    expect(onError).toHaveBeenCalledWith(result.current.error);
  });

  it("returns an empty string from toSVG and rejects toPNG while failed", async () => {
    const { result } = renderHook(() => useQRCode({ value: "A".repeat(5000), level: "H" }));
    expect(result.current.toSVG()).toBe("");
    await expect(result.current.toPNG()).rejects.toBeInstanceOf(QRCapacityError);
  });

  it("serializes SVG with the hook's own options, and honours overrides", () => {
    const { result } = renderHook(() =>
      useQRCode({ value: "USEFY", margin: 2, fg: "#0f172a", title: "usefy" }),
    );
    const svg = result.current.toSVG();
    expect(svg).toContain('fill="#0f172a"');
    expect(svg).toContain("<title>usefy</title>");
    expect(result.current.toSVG({ fg: "#ff0000" })).toContain('fill="#ff0000"');
  });

  it("keeps its returned functions stable while inputs are unchanged", () => {
    const { result, rerender } = renderHook((props: { value: string }) => useQRCode(props), {
      initialProps: { value: "USEFY" },
    });
    const first = {
      toSVG: result.current.toSVG,
      toPNG: result.current.toPNG,
      download: result.current.download,
      canvasRef: result.current.canvasRef,
    };
    rerender({ value: "USEFY" });
    expect(result.current.toSVG).toBe(first.toSVG);
    expect(result.current.toPNG).toBe(first.toPNG);
    expect(result.current.download).toBe(first.download);
    expect(result.current.canvasRef).toBe(first.canvasRef);
  });

  it("keeps the canvas ref callback stable even when the value changes", () => {
    // An unstable ref callback detaches and re-attaches the canvas on every
    // render, which would clear it.
    const { result, rerender } = renderHook((props: { value: string }) => useQRCode(props), {
      initialProps: { value: "one" },
    });
    const ref = result.current.canvasRef;
    rerender({ value: "two" });
    expect(result.current.canvasRef).toBe(ref);
  });

  it("draws into a canvas once it is attached", () => {
    const canvas = document.createElement("canvas");
    const { result } = renderHook(() => useQRCode({ value: "USEFY", size: 120 }));
    expect(canvasDouble.fills).toHaveLength(0);
    act(() => result.current.canvasRef(canvas));
    expect(canvasDouble.fills.length).toBeGreaterThan(0);
    expect(canvas.style.width).toBe("120px");
  });

  it("survives a canvas with no 2D context", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const canvas = document.createElement("canvas");
    const { result } = renderHook(() => useQRCode({ value: "USEFY" }));
    expect(() => act(() => result.current.canvasRef(canvas))).not.toThrow();
  });

  it("warns once when a logo would make the code unscannable", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    installImageDouble();
    renderHook(() =>
      useQRCode({ value: "https://usefy.dev/packages/qr-code", level: "L", logo: { src: "a", size: 0.35 } }),
    );
    await waitFor(() => expect(warn).toHaveBeenCalled());
    expect(warn.mock.calls[0]![0]).toContain("@usefy/qr-code");
  });

  it("passes the loaded logo image on to PNG export", async () => {
    installImageDouble();
    const { result } = renderHook(() =>
      useQRCode({ value: "USEFY", level: "H", logo: { src: "logo.png" } }),
    );
    const canvas = document.createElement("canvas");
    act(() => result.current.canvasRef(canvas));
    await waitFor(() => expect(canvasDouble.fills).toContain("image"));
  });
});
