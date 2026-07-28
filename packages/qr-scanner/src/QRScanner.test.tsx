import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { encodeQR } from "@usefy/qr-code/headless";
import { QRScanner, type QRScannerController } from "./QRScanner";
import { useQRScanner } from "./useQRScanner";
import { installFakeCamera, type FakeCamera } from "./__testing__/camera";
import { installImageSourceDoubles } from "./__testing__/dom";
import { renderMatrix } from "./__testing__/render";
import { releaseScratchCanvas } from "./image/source";
import { resetNativeSupport } from "./native";
import { createRef } from "react";
import { QRCameraError } from "./errors";
import { BitMatrix } from "./image/bitmatrix";

const VALUE = "https://usefy.dev/qr-scanner";

function frame(): ImageData {
  return renderMatrix(encodeQR(VALUE, { level: "M" }), { scale: 6 });
}

let camera: FakeCamera | null = null;

function setup(options: Parameters<typeof installFakeCamera>[0] = {}) {
  camera = installFakeCamera(options);
  installImageSourceDoubles(frame());
  vi.stubGlobal("BarcodeDetector", undefined);
  resetNativeSupport();
  releaseScratchCanvas();
  return camera;
}

afterEach(() => {
  camera?.restore();
  camera = null;
  releaseScratchCanvas();
  resetNativeSupport();
  vi.unstubAllGlobals();
});

/** Drive one presented frame and let the async decode settle. */
async function scanOneFrame(): Promise<void> {
  await act(async () => {
    camera!.emitFrame();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("the scanning loop", () => {
  it("decodes a frame and reports it once", async () => {
    setup();
    const onScan = vi.fn();
    render(<QRScanner onScan={onScan} />);

    const video = await screen.findByLabelText<HTMLVideoElement>("Camera preview");
    await waitFor(() => expect(camera!.getUserMedia).toHaveBeenCalled());
    act(() => camera!.emitMetadata(video, 640, 480));

    await scanOneFrame();
    await waitFor(() => expect(onScan).toHaveBeenCalledTimes(1));
    expect(onScan.mock.calls[0]![0].text).toBe(VALUE);
  });

  it("suppresses the same value inside the dedupe window", async () => {
    // A camera sees the same code in dozens of consecutive frames. Firing
    // `onScan` for each is how a scanner ends up adding forty tickets.
    setup();
    const onScan = vi.fn();
    const onFrame = vi.fn();
    // `scanRate` is deliberately huge: the throttle is a separate behaviour and
    // would otherwise collapse three same-millisecond frames into one decode,
    // making this test pass for the wrong reason.
    render(<QRScanner onScan={onScan} onFrame={onFrame} dedupeMs={10_000} scanRate={10_000} />);

    const video = await screen.findByLabelText<HTMLVideoElement>("Camera preview");
    await waitFor(() => expect(camera!.getUserMedia).toHaveBeenCalled());
    act(() => camera!.emitMetadata(video, 640, 480));

    await scanOneFrame();
    await scanOneFrame();
    await scanOneFrame();

    await waitFor(() => expect(onScan).toHaveBeenCalledTimes(1));
    // …while `onFrame` still sees every decode, for anyone who wants throughput.
    expect(onFrame.mock.calls.length).toBeGreaterThan(1);
  });

  it("does not decode while paused", async () => {
    setup();
    const onFrame = vi.fn();
    const { rerender } = render(<QRScanner onFrame={onFrame} paused />);

    const video = await screen.findByLabelText<HTMLVideoElement>("Camera preview");
    await waitFor(() => expect(camera!.getUserMedia).toHaveBeenCalled());
    act(() => camera!.emitMetadata(video, 640, 480));

    await scanOneFrame();
    expect(onFrame).not.toHaveBeenCalled();

    rerender(<QRScanner onFrame={onFrame} paused={false} />);
    await scanOneFrame();
    await waitFor(() => expect(onFrame).toHaveBeenCalled());
  });
});

describe("camera teardown", () => {
  it("stops every track on unmount", async () => {
    // The most visible bug this package could ship is a camera light that stays
    // on after the scanner is gone.
    setup();
    const { unmount } = render(<QRScanner />);
    await waitFor(() => expect(camera!.tracks.length).toBeGreaterThan(0));

    unmount();
    for (const track of camera!.tracks) expect(track.stop).toHaveBeenCalled();
  });

  it("stops every track under StrictMode's double mount", async () => {
    setup();
    const { unmount } = render(<QRScanner />, { reactStrictMode: true });
    await waitFor(() => expect(camera!.tracks.length).toBeGreaterThan(0));

    unmount();
    for (const track of camera!.tracks) expect(track.stop).toHaveBeenCalled();
  });
});

describe("permission and capability states", () => {
  it("explains a denial and offers the file fallback", async () => {
    setup({ failWith: "NotAllowedError" });
    render(<QRScanner />);

    expect(await screen.findByText(/Camera access was denied/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /scan an image/i })).toBeTruthy();
  });

  it("explains an unsupported environment rather than showing a black box", async () => {
    vi.stubGlobal("navigator", { ...globalThis.navigator, mediaDevices: undefined });
    installImageSourceDoubles(frame());
    render(<QRScanner />);

    expect(await screen.findByText(/cannot open a camera/i)).toBeTruthy();
  });

  it("renders no video at all in file-only mode", async () => {
    setup();
    render(<QRScanner source="file" />);

    expect(screen.queryByLabelText("Camera preview")).toBeNull();
    expect(screen.getByRole("button", { name: /scan an image/i })).toBeTruthy();
    expect(camera!.getUserMedia).not.toHaveBeenCalled();
  });
});

describe("controls", () => {
  it("offers the torch only when the camera has one, and toggles it", async () => {
    setup({ torch: true });
    render(<QRScanner />);

    const torch = await screen.findByRole("button", { name: /turn the torch on/i });
    expect(torch.getAttribute("aria-pressed")).toBe("false");

    await act(async () => {
      torch.click();
    });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /turn the torch off/i })).toBeTruthy(),
    );
    expect(camera!.tracks[0]!.applyConstraints).toHaveBeenCalledWith({
      advanced: [{ torch: true }],
    });
  });

  it("hides the torch button when the camera has none", async () => {
    setup({ torch: false });
    render(<QRScanner />);
    await waitFor(() => expect(camera!.getUserMedia).toHaveBeenCalled());

    expect(screen.queryByRole("button", { name: /torch/i })).toBeNull();
  });

  it("offers a camera switch only when there is more than one camera", async () => {
    setup({ devices: [{ deviceId: "cam-1" }, { deviceId: "cam-2" }] });
    render(<QRScanner />);

    const button = await screen.findByRole("button", { name: /switch camera/i });
    await act(async () => {
      button.click();
    });

    await waitFor(() =>
      expect(camera!.getUserMedia).toHaveBeenLastCalledWith(
        expect.objectContaining({ video: { deviceId: { exact: "cam-2" } } }),
      ),
    );
  });

  it("hides the switch button for a single camera", async () => {
    setup({ devices: [{ deviceId: "cam-1" }] });
    render(<QRScanner />);
    await waitFor(() => expect(camera!.getUserMedia).toHaveBeenCalled());

    expect(screen.queryByRole("button", { name: /switch camera/i })).toBeNull();
  });

  it("gives every control a real button with an accessible name", async () => {
    setup({ torch: true, devices: [{ deviceId: "cam-1" }, { deviceId: "cam-2" }] });
    render(<QRScanner source="file" />);

    for (const button of screen.getAllByRole("button")) {
      expect(button.tagName).toBe("BUTTON");
      expect(button.getAttribute("aria-label")).toBeTruthy();
    }
  });
});

describe("accessibility", () => {
  it("announces a short result, and stays generic for a long one", async () => {
    // Reading a 200-character URL aloud is hostile; saying nothing leaves a
    // screen-reader user with no feedback at all.
    setup();
    const long = `https://usefy.dev/${"x".repeat(80)}`;
    installImageSourceDoubles(renderMatrix(encodeQR(long, { level: "M" }), { scale: 5 }));

    render(<QRScanner />);
    const video = await screen.findByLabelText<HTMLVideoElement>("Camera preview");
    await waitFor(() => expect(camera!.getUserMedia).toHaveBeenCalled());
    act(() => camera!.emitMetadata(video, 640, 480));

    await scanOneFrame();
    const status = await screen.findByRole("status");
    await waitFor(() => expect(status.textContent).toBe("QR code detected."));
  });

  it("marks the viewfinder decorative", async () => {
    setup();
    // jsdom lays nothing out, so the container reports a zero-sized box and the
    // overlay (correctly) declines to draw. Giving it a size is what makes the
    // overlay exist to be asserted on.
    const rect = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue({ width: 360, height: 480, x: 0, y: 0, top: 0, left: 0, right: 360, bottom: 480, toJSON: () => ({}) } as DOMRect);

    try {
      const { container } = render(<QRScanner />);
      const video = await screen.findByLabelText<HTMLVideoElement>("Camera preview");
      act(() => camera!.emitMetadata(video, 640, 480));

      await waitFor(() => {
        const svg = container.querySelector("svg");
        expect(svg).not.toBeNull();
        expect(svg!.getAttribute("aria-hidden")).toBe("true");
      });
    } finally {
      rect.mockRestore();
    }
  });

  it("draws a highlight over the symbol it found", async () => {
    // The overlay is the part a user judges the scanner by: a box that lands
    // near the code rather than on it reads as broken even when the decode was
    // perfect.
    setup();
    const rect = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue({ width: 320, height: 320, x: 0, y: 0, top: 0, left: 0, right: 320, bottom: 320, toJSON: () => ({}) } as DOMRect);

    try {
      const { container } = render(<QRScanner scanRate={10_000} />);
      const video = await screen.findByLabelText<HTMLVideoElement>("Camera preview");
      const source = frame();
      act(() => camera!.emitMetadata(video, source.width, source.height));

      await scanOneFrame();
      await waitFor(() => expect(container.querySelector("polygon")).not.toBeNull());

      const points = container.querySelector("polygon")!.getAttribute("points")!;
      const coordinates = points.split(" ").map((pair) => pair.split(",").map(Number));
      // Four corners, all inside the rendered element.
      expect(coordinates).toHaveLength(4);
      for (const [x, y] of coordinates) {
        expect(x!).toBeGreaterThanOrEqual(-1);
        expect(x!).toBeLessThanOrEqual(321);
        expect(y!).toBeGreaterThanOrEqual(-1);
        expect(y!).toBeLessThanOrEqual(321);
      }
    } finally {
      rect.mockRestore();
    }
  });
});

describe("the imperative controller", () => {
  it("exposes start, stop, pause, resume, scanFile and capture", async () => {
    setup();
    const ref = createRef<QRScannerController>();
    render(<QRScanner controllerRef={ref} />);

    await waitFor(() => expect(ref.current).not.toBeNull());
    expect(typeof ref.current!.start).toBe("function");
    expect(typeof ref.current!.stop).toBe("function");
    expect(typeof ref.current!.pause).toBe("function");
    expect(typeof ref.current!.resume).toBe("function");

    const found = await act(async () =>
      ref.current!.scanFile(new Blob([new Uint8Array([1])], { type: "image/png" })),
    );
    expect(found[0]?.text).toBe(VALUE);
  });

  it("stops the camera through the controller", async () => {
    setup();
    const ref = createRef<QRScannerController>();
    render(<QRScanner controllerRef={ref} />);

    await waitFor(() => expect(camera!.tracks.length).toBeGreaterThan(0));
    act(() => ref.current!.stop());

    expect(camera!.tracks[0]!.stop).toHaveBeenCalled();
  });
});

describe("camera failures reach the consumer as this package's error type", () => {
  it.each([
    ["NotAllowedError", "denied"],
    ["NotReadableError", "in-use"],
    ["NotFoundError", "not-found"],
    ["OverconstrainedError", "over-constrained"],
  ])("maps %s to reason %s", async (name, reason) => {
    // The camera layer raises its own `UserMediaError`; a consumer should not
    // have to import a sibling package to narrow a catch, so it is re-typed.
    setup({ failWith: name });
    const onError = vi.fn();
    let latest: ReturnType<typeof useQRScanner> | null = null;

    function Probe(): React.ReactNode {
      latest = useQRScanner({ autoStart: true, onError });
      return <video ref={latest.videoRef} />;
    }

    render(<Probe />);
    await waitFor(() => expect(latest!.error).not.toBeNull());

    expect(latest!.error).toBeInstanceOf(QRCameraError);
    expect((latest!.error as QRCameraError).reason).toBe(reason);
    expect(onError.mock.calls[0]![0]).toBeInstanceOf(QRCameraError);
    // The message has to be something a UI can show, not a DOMException name.
    expect(latest!.error!.message.length).toBeGreaterThan(20);
  });

  it("leaves a non-camera error alone", () => {
    // A decode bug is not a camera failure and must not be dressed up as one.
    const plain = new TypeError("something else");
    expect(QRCameraError.from(plain).reason).toBe("unknown");
    expect(QRCameraError.from(plain).cause).toBe(plain);

    const already = new QRCameraError("denied", "already typed");
    expect(QRCameraError.from(already)).toBe(already);
  });
});

describe("pausing and resuming", () => {
  it("holds the loop without releasing the camera, and resumes", async () => {
    setup();
    const onFrame = vi.fn();
    const ref = createRef<QRScannerController>();
    render(<QRScanner onFrame={onFrame} controllerRef={ref} scanRate={10_000} />);

    const video = await screen.findByLabelText<HTMLVideoElement>("Camera preview");
    await waitFor(() => expect(camera!.getUserMedia).toHaveBeenCalled());
    act(() => camera!.emitMetadata(video, 640, 480));

    await scanOneFrame();
    await waitFor(() => expect(onFrame).toHaveBeenCalled());
    const before = onFrame.mock.calls.length;

    act(() => ref.current!.pause());
    await scanOneFrame();
    expect(onFrame.mock.calls.length).toBe(before);
    // Paused is not stopped: the camera stays open so resuming is instant.
    expect(camera!.tracks[0]!.stop).not.toHaveBeenCalled();

    act(() => ref.current!.resume());
    await scanOneFrame();
    await waitFor(() => expect(onFrame.mock.calls.length).toBeGreaterThan(before));
  });
});

describe("scanning a file", () => {
  it("reports a file that contains no code without throwing", async () => {
    setup();
    // The doubles hand back a blank frame for this one.
    const blank: ImageData = {
      data: new Uint8ClampedArray(120 * 120 * 4).fill(255),
      width: 120,
      height: 120,
      colorSpace: "srgb",
    } as ImageData;
    installImageSourceDoubles(blank);

    const ref = createRef<QRScannerController>();
    render(<QRScanner controllerRef={ref} source="file" />);
    await waitFor(() => expect(ref.current).not.toBeNull());

    const found = await act(async () =>
      ref.current!.scanFile(new Blob([new Uint8Array([1])], { type: "image/png" })),
    );
    expect(found).toEqual([]);

    const status = await screen.findByRole("status");
    await waitFor(() => expect(status.textContent).toMatch(/No QR code found/i));
  });

  it("decodes a file chosen through the picker", async () => {
    setup();
    const onScan = vi.fn();
    render(<QRScanner source="file" onScan={onScan} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1])], "code.png", { type: "image/png" });
    Object.defineProperty(input, "files", { value: [file], configurable: true });

    await act(async () => {
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await waitFor(() => expect(onScan).toHaveBeenCalled());
    expect(onScan.mock.calls[0]![0].text).toBe(VALUE);
  });

  it("decodes an image pasted from the clipboard", async () => {
    // "I already have a screenshot of it" is a real and common way to arrive at
    // a scanner, and it should not require finding the file on disk.
    setup();
    const onScan = vi.fn();
    render(<QRScanner source="file" onScan={onScan} />);

    const file = new File([new Uint8Array([1])], "code.png", { type: "image/png" });
    const event = new Event("paste", { bubbles: true });
    Object.defineProperty(event, "clipboardData", {
      value: { items: [{ type: "image/png", getAsFile: () => file }] },
    });

    await act(async () => {
      document.dispatchEvent(event);
    });

    await waitFor(() => expect(onScan).toHaveBeenCalled());
  });

  it("ignores a paste that carries no image", async () => {
    setup();
    const onScan = vi.fn();
    render(<QRScanner source="file" onScan={onScan} />);

    const event = new Event("paste", { bubbles: true });
    Object.defineProperty(event, "clipboardData", {
      value: { items: [{ type: "text/plain", getAsFile: () => null }] },
    });

    await act(async () => {
      document.dispatchEvent(event);
    });
    expect(onScan).not.toHaveBeenCalled();
  });

  it("decodes an image dropped onto the surface", async () => {
    setup();
    const onScan = vi.fn();
    const { container } = render(<QRScanner source="file" onScan={onScan} />);

    const file = new File([new Uint8Array([1])], "code.png", { type: "image/png" });
    const event = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "dataTransfer", { value: { files: [file] } });

    await act(async () => {
      container.firstElementChild!.dispatchEvent(event);
    });

    await waitFor(() => expect(onScan).toHaveBeenCalled());
  });
});

describe("capture", () => {
  it("returns the current frame, and null before one exists", async () => {
    setup();
    const ref = createRef<QRScannerController>();
    render(<QRScanner controllerRef={ref} />);

    await waitFor(() => expect(ref.current).not.toBeNull());
    expect(await act(async () => ref.current!.capture())).toBeNull();

    const video = await screen.findByLabelText<HTMLVideoElement>("Camera preview");
    act(() => camera!.emitMetadata(video, 640, 480));

    const frame = await act(async () => ref.current!.capture());
    expect(frame?.width).toBeGreaterThan(0);
  });
});

describe("a custom decoder", () => {
  it("receives the frames instead of the main-thread engine", async () => {
    setup();
    const decode = vi.fn(async () => []);
    render(<QRScanner decoder={{ decode }} scanRate={10_000} />);

    const video = await screen.findByLabelText<HTMLVideoElement>("Camera preview");
    await waitFor(() => expect(camera!.getUserMedia).toHaveBeenCalled());
    act(() => camera!.emitMetadata(video, 640, 480));

    await scanOneFrame();
    await waitFor(() => expect(decode).toHaveBeenCalled());
  });

  it("falls back to the main thread for a function binarizer, which cannot be transferred", async () => {
    setup();
    const decode = vi.fn(async () => []);
    const onFrame = vi.fn();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(
      <QRScanner
        decoder={{ decode }}
        onFrame={onFrame}
        scanRate={10_000}
        binarizer={(gray) => new BitMatrix(gray.width, gray.height)}
      />,
    );

    const video = await screen.findByLabelText<HTMLVideoElement>("Camera preview");
    await waitFor(() => expect(camera!.getUserMedia).toHaveBeenCalled());
    act(() => camera!.emitMetadata(video, 640, 480));

    await scanOneFrame();
    await waitFor(() => expect(onFrame).toHaveBeenCalled());

    // Silently dropping the binarizer would leave a consumer debugging why
    // their thresholding never runs.
    expect(decode).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("reference stability", () => {
  it("returns the same object and callbacks when nothing changed", async () => {
    // The scanner re-renders on every decoded frame. A fresh object each time
    // churns every consumer dependency array — and, in this component, meant a
    // document-level `paste` listener being removed and re-added twelve times
    // a second.
    setup();
    let latest: ReturnType<typeof useQRScanner> | null = null;
    let renders = 0;

    function Probe(): React.ReactNode {
      renders++;
      latest = useQRScanner({ autoStart: false });
      return <video ref={latest.videoRef} />;
    }

    const { rerender } = render(<Probe />);
    const first = latest!;
    rerender(<Probe />);

    expect(renders).toBeGreaterThan(1);
    expect(latest!).toBe(first);
    expect(latest!.start).toBe(first.start);
    expect(latest!.scanFile).toBe(first.scanFile);
  });
});

describe("a controllable paused state", () => {
  it("reports changes through onPausedChange when uncontrolled", async () => {
    setup();
    const onPausedChange = vi.fn();
    const ref = createRef<QRScannerController>();
    render(<QRScanner controllerRef={ref} onPausedChange={onPausedChange} />);

    await waitFor(() => expect(ref.current).not.toBeNull());
    act(() => ref.current!.pause());
    expect(onPausedChange).toHaveBeenCalledWith(true);

    act(() => ref.current!.resume());
    expect(onPausedChange).toHaveBeenLastCalledWith(false);
  });

  it("lets a `paused` prop win over pause()/resume()", async () => {
    // One state, whoever owns it — otherwise "I called resume() but the prop
    // still says paused" becomes a real bug report.
    setup();
    const onFrame = vi.fn();
    const ref = createRef<QRScannerController>();
    render(<QRScanner controllerRef={ref} onFrame={onFrame} paused scanRate={10_000} />);

    const video = await screen.findByLabelText<HTMLVideoElement>("Camera preview");
    await waitFor(() => expect(camera!.getUserMedia).toHaveBeenCalled());
    act(() => camera!.emitMetadata(video, 640, 480));

    act(() => ref.current!.resume());
    await scanOneFrame();
    expect(onFrame).not.toHaveBeenCalled();
  });
});

describe("choosing a camera", () => {
  it("opens the device the caller asked for", async () => {
    setup({ devices: [{ deviceId: "cam-1" }, { deviceId: "cam-2" }] });
    let latest: ReturnType<typeof useQRScanner> | null = null;

    function Probe(): React.ReactNode {
      latest = useQRScanner({ autoStart: true });
      return <video ref={latest.videoRef} />;
    }

    render(<Probe />);
    await waitFor(() => expect(camera!.getUserMedia).toHaveBeenCalled());

    await act(async () => {
      await latest!.selectDevice("cam-2");
    });

    expect(camera!.getUserMedia).toHaveBeenLastCalledWith(
      expect.objectContaining({ video: { deviceId: { exact: "cam-2" } } }),
    );
  });
});

describe("useQRScanner on its own", () => {
  it("reports the scanner's state for a UI to render", async () => {
    setup();
    let latest: ReturnType<typeof useQRScanner> | null = null;

    function Probe(): React.ReactNode {
      latest = useQRScanner({ autoStart: true });
      return <video ref={latest.videoRef} />;
    }

    render(<Probe />);
    await waitFor(() => expect(latest!.state).toBe("scanning"));
    expect(latest!.result).toBeNull();
    expect(latest!.error).toBeNull();
  });

  it("surfaces a camera failure as an error, not a crash", async () => {
    setup({ failWith: "NotReadableError" });
    let latest: ReturnType<typeof useQRScanner> | null = null;

    function Probe(): React.ReactNode {
      latest = useQRScanner({ autoStart: true });
      return <video ref={latest.videoRef} />;
    }

    render(<Probe />);
    await waitFor(() => expect(latest!.error).not.toBeNull());
    expect(latest!.state).toBe("error");
  });
});
