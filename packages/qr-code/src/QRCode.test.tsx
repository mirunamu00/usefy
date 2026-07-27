import { StrictMode, createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { QRCode, type QRCodeController } from "./QRCode";
import { clearCache } from "./cache";
import { encodeQR } from "./encode/encodeQR";
import { matrixToPaths } from "./render/paths";
import { resolveStyle } from "./render/style";
import { toSVG } from "./render/svg";
import {
  type CanvasRecorder,
  installCanvasDouble,
  installImageDouble,
} from "./__testing__/canvas";

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

describe("<QRCode /> — SVG rendering", () => {
  it("renders the same geometry the standalone renderer produces", () => {
    const { container } = render(<QRCode value="https://usefy.dev" level="M" mask={2} />);
    const svg = container.querySelector("svg")!;
    const expected = matrixToPaths(
      encodeQR("https://usefy.dev", { level: "M", mask: 2 }),
      resolveStyle(),
    );
    const paths = Array.from(svg.querySelectorAll("path"));
    expect(paths.map((path) => path.getAttribute("d"))).toEqual(expected.paths.map((p) => p.d));
  });

  it("sizes the element while keeping the viewBox in module units", () => {
    const { container } = render(<QRCode value="USEFY" size={240} margin={2} />);
    const svg = container.querySelector("svg")!;
    const side = encodeQR("USEFY").size + 4;
    expect(svg.getAttribute("width")).toBe("240");
    expect(svg.getAttribute("viewBox")).toBe(`0 0 ${side} ${side}`);
  });

  it("draws the background rect, and omits it when transparent", () => {
    const { container: opaque } = render(<QRCode value="USEFY" />);
    expect(opaque.querySelector("rect")).not.toBeNull();
    cleanup();
    const { container: clear } = render(<QRCode value="USEFY" bg={null} />);
    expect(clear.querySelector("rect")).toBeNull();
  });

  it("renders gradient defs the paths actually reference", () => {
    const { container } = render(
      <QRCode
        value="USEFY"
        fg={{
          type: "linear",
          rotation: 45,
          stops: [
            { offset: 0, color: "#6366f1" },
            { offset: 1, color: "#ec4899" },
          ],
        }}
      />,
    );
    const gradient = container.querySelector("linearGradient")!;
    expect(container.querySelectorAll("stop")).toHaveLength(2);
    expect(container.querySelector("path")!.getAttribute("fill")).toBe(
      `url(#${gradient.getAttribute("id")})`,
    );
  });

  it("renders a radial gradient when asked", () => {
    const { container } = render(
      <QRCode
        value="USEFY"
        fg={{
          type: "radial",
          stops: [
            { offset: 0, color: "#22c55e" },
            { offset: 1, color: "#0ea5e9" },
          ],
        }}
      />,
    );
    expect(container.querySelector("radialGradient")).not.toBeNull();
  });

  it("renders a logo image, clipped when circular", () => {
    installImageDouble();
    const { container } = render(
      <QRCode value="USEFY" level="H" logo={{ src: "data:image/png;base64,AAA", shape: "circle" }} />,
    );
    const image = container.querySelector("image")!;
    expect(image.getAttribute("href")).toBe("data:image/png;base64,AAA");
    expect(container.querySelector("clipPath")).not.toBeNull();
    expect(image.getAttribute("clip-path")).toMatch(/^url\(#/);
  });
});

describe("<QRCode /> — accessibility", () => {
  it("names the code when given a title", () => {
    const { container } = render(<QRCode value="https://usefy.dev" title="Open usefy.dev" />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.getAttribute("aria-label")).toBe("Open usefy.dev");
    expect(svg.querySelector("title")!.textContent).toBe("Open usefy.dev");
  });

  it("hides an unnamed code from assistive tech rather than reading a URL aloud", () => {
    const { container } = render(<QRCode value="https://usefy.dev/a/very/long/path" />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("role")).toBeNull();
  });

  it("carries the same rules to canvas output", () => {
    const { container } = render(<QRCode value="USEFY" render="canvas" title="Scan me" />);
    const canvas = container.querySelector("canvas")!;
    expect(canvas.getAttribute("role")).toBe("img");
    expect(canvas.getAttribute("aria-label")).toBe("Scan me");
  });
});

describe("<QRCode /> — canvas rendering", () => {
  it("draws the styled paths onto the canvas", () => {
    render(<QRCode value="https://usefy.dev" render="canvas" size={128} moduleShape="dot" />);
    expect(canvasDouble.fills.length).toBeGreaterThan(0);
    expect(canvasDouble.fills.join("")).toContain("A"); // arcs — real dots
  });

  it("applies the CSS size while the backing store follows the DPR", () => {
    const { container } = render(<QRCode value="USEFY" render="canvas" size={100} dpr={2} />);
    const canvas = container.querySelector("canvas")!;
    expect(canvas.style.width).toBe("100px");
    expect(canvas.width).toBe(200);
  });

  it("redraws when the value changes, and not when an unrelated prop does", () => {
    const { rerender } = render(<QRCode value="one" render="canvas" size={100} />);
    const afterFirst = canvasDouble.fills.length;
    expect(afterFirst).toBeGreaterThan(0);

    rerender(<QRCode value="one" render="canvas" size={100} className="unrelated" />);
    expect(canvasDouble.fills.length).toBe(afterFirst);

    rerender(<QRCode value="two" render="canvas" size={100} />);
    expect(canvasDouble.fills.length).toBeGreaterThan(afterFirst);
  });

  it("does not redraw when a style prop is re-created with the same values", () => {
    // Inline object props are new on every render; depending on identity would
    // redraw the canvas for no reason.
    const stops = () => [
      { offset: 0, color: "#6366f1" },
      { offset: 1, color: "#ec4899" },
    ];
    const { rerender } = render(
      <QRCode value="USEFY" render="canvas" fg={{ type: "linear", stops: stops() }} />,
    );
    const afterFirst = canvasDouble.fills.length;
    rerender(<QRCode value="USEFY" render="canvas" fg={{ type: "linear", stops: stops() }} />);
    expect(canvasDouble.fills.length).toBe(afterFirst);
  });

  it("redraws once the logo image has loaded", async () => {
    installImageDouble();
    render(<QRCode value="USEFY" level="H" render="canvas" logo={{ src: "logo.png" }} />);
    await waitFor(() => expect(canvasDouble.fills).toContain("image"));
  });

  it("still renders the code when the logo fails to load", async () => {
    installImageDouble(true);
    const { container } = render(
      <QRCode value="USEFY" level="H" render="canvas" logo={{ src: "broken" }} />,
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(container.querySelector("canvas")).not.toBeNull();
    expect(canvasDouble.fills.some((fill) => fill !== "image")).toBe(true);
  });
});

describe("<QRCode /> — errors", () => {
  it("reports an over-long value instead of crashing the tree", () => {
    const onError = vi.fn();
    const { container } = render(
      <div>
        <QRCode value={"A".repeat(5000)} level="H" onError={onError} />
        <span>sibling still here</span>
      </div>,
    );
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]![0]).toBeInstanceOf(Error);
    expect(container.querySelector("svg")).toBeNull();
    expect(container.textContent).toContain("sibling still here");
  });

  it("throws for an error boundary when asked to", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      render(<QRCode value={"A".repeat(5000)} level="H" throwOnError />),
    ).toThrow(/does not fit/);
    spy.mockRestore();
  });

  it("recovers when the value comes back within capacity", () => {
    const onError = vi.fn();
    const { container, rerender } = render(
      <QRCode value={"A".repeat(5000)} level="H" onError={onError} />,
    );
    expect(container.querySelector("svg")).toBeNull();
    rerender(<QRCode value="short" level="H" onError={onError} />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(onError).toHaveBeenCalledTimes(1);
  });
});

describe("<QRCode /> — controller", () => {
  it("exposes the matrix and the exporters", async () => {
    const controllerRef = createRef<QRCodeController>();
    render(<QRCode value="https://usefy.dev" level="Q" controllerRef={controllerRef} />);

    const controller = controllerRef.current!;
    expect(controller.getMatrix()!.level).toBe("Q");
    expect(controller.toSVG()).toContain("<svg");
    expect(controller.toSVG({ margin: 0 })).toContain(`viewBox="0 0 ${controller.getMatrix()!.size}`);
  });

  it("downloads SVG through an object URL, released only after the download starts", async () => {
    vi.useFakeTimers();
    try {
      const createObjectURL = vi.fn(() => "blob:qr");
      const revokeObjectURL = vi.fn();
      vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
      const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

      const controllerRef = createRef<QRCodeController>();
      render(<QRCode value="USEFY" controllerRef={controllerRef} />);
      await act(async () => {
        await controllerRef.current!.download("svg", "ticket.svg");
      });

      expect(createObjectURL).toHaveBeenCalledOnce();
      expect(click).toHaveBeenCalledOnce();
      // Revoking in the same tick as the click aborts the download in Firefox.
      expect(revokeObjectURL).not.toHaveBeenCalled();
      await act(async () => {
        vi.runAllTimers();
      });
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:qr");
    } finally {
      vi.useRealTimers();
    }
  });

  it("stays attached across re-renders", () => {
    const controllerRef = createRef<QRCodeController>();
    const { rerender } = render(<QRCode value="one" controllerRef={controllerRef} />);
    expect(controllerRef.current!.getMatrix()).not.toBeNull();
    rerender(<QRCode value="two" controllerRef={controllerRef} />);
    expect(controllerRef.current!.getMatrix()).not.toBeNull();
  });
});

describe("<QRCode /> — server rendering and StrictMode", () => {
  it("renders complete SVG markup on the server, with no client work needed", () => {
    const markup = renderToStaticMarkup(
      <QRCode value="https://usefy.dev" level="M" mask={2} title="usefy" />,
    );
    expect(markup).toContain("<svg");
    expect(markup).toContain("<path");
    expect(markup).toContain("<title>usefy</title>");
    // The full symbol is present, not a placeholder.
    const expected = matrixToPaths(
      encodeQR("https://usefy.dev", { level: "M", mask: 2 }),
      resolveStyle(),
    );
    expect(markup).toContain(expected.paths[0]!.d);
  });

  it("produces identical markup on the server and the client", () => {
    const markup = renderToStaticMarkup(<QRCode value="hydration" level="Q" />);
    const { container } = render(<QRCode value="hydration" level="Q" />);
    // A mismatch here is a hydration warning in a real app.
    expect(container.querySelector("path")!.getAttribute("d")).toBe(
      /d="([^"]+)"/.exec(markup)![1],
    );
  });

  it("mounts once under StrictMode's double render", () => {
    const { container } = render(
      <StrictMode>
        <QRCode value="USEFY" render="canvas" size={100} />
      </StrictMode>,
    );
    expect(container.querySelectorAll("canvas")).toHaveLength(1);
    // The canvas is sized once per distinct configuration, not once per render.
    expect(new Set(canvasDouble.resizes).size).toBe(1);
  });

  it("reports an encoding failure exactly once under StrictMode", () => {
    // StrictMode remounts effects in development. A consumer's error toast or
    // logger firing twice for one failure is a bug in their app.
    const onError = vi.fn();
    render(
      <StrictMode>
        <QRCode value={"A".repeat(5000)} level="H" onError={onError} />
      </StrictMode>,
    );
    expect(onError).toHaveBeenCalledTimes(1);
  });
});

describe("<QRCode /> — DOM passthrough and isolation", () => {
  it("forwards ids, data attributes and handlers to the element", () => {
    const onClick = vi.fn();
    const { container } = render(
      <QRCode value="USEFY" id="ticket-qr" data-testid="qr" onClick={onClick} />,
    );
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("id")).toBe("ticket-qr");
    expect(svg.getAttribute("data-testid")).toBe("qr");
    svg.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("lets an explicit aria-label override the title-derived default", () => {
    const { container } = render(
      <QRCode value="USEFY" title="Derived" aria-label="Explicit" />,
    );
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-label")).toBe("Explicit");
    expect(svg.getAttribute("role")).toBe("img");
  });

  it("lets an explicit aria-hidden override an untitled code's default", () => {
    const { container } = render(<QRCode value="USEFY" aria-hidden={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-hidden")).toBe("false");
  });

  it("keeps the title-derived name when aria-label is passed as undefined", () => {
    // `aria-label={maybeUndefined}` is a caller saying nothing. Treating the
    // key as present would ship role="img" with no accessible name at all.
    const { container } = render(<QRCode value="USEFY" title="Ticket" aria-label={undefined} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-label")).toBe("Ticket");
    expect(svg.getAttribute("role")).toBe("img");
  });

  it("pairs role=img with a consumer-supplied name even without a title", () => {
    // A bare labelled <svg> is announced inconsistently across screen readers.
    const { container } = render(<QRCode value="USEFY" aria-label="Boarding pass" />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.getAttribute("aria-label")).toBe("Boarding pass");
    expect(svg.getAttribute("aria-hidden")).toBeNull();
  });

  it("accepts aria-labelledby as a name too", () => {
    const { container } = render(
      <>
        <span id="qr-caption">Scan for the menu</span>
        <QRCode value="USEFY" aria-labelledby="qr-caption" />
      </>,
    );
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.getAttribute("aria-hidden")).toBeNull();
  });

  it("gives two logos on one page independent clip paths", () => {
    // A shared id would make the browser clip both logos with whichever circle
    // it found first — the second logo all but disappears.
    const { container } = render(
      <>
        <QRCode value="USEFY" level="H" logo={{ src: "a.png", size: 0.1, shape: "circle" }} />
        <QRCode value="USEFY" level="H" logo={{ src: "a.png", size: 0.35, shape: "circle" }} />
      </>,
    );
    const ids = Array.from(container.querySelectorAll("clipPath"), (node) => node.id);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);

    // Each image references its own clip.
    const images = Array.from(container.querySelectorAll("image"));
    expect(images.map((image) => image.getAttribute("clip-path"))).toEqual(
      ids.map((id) => `url(#${id})`),
    );
    // …and the circles really do differ, which is what made a shared id wrong.
    const radii = Array.from(container.querySelectorAll("circle"), (node) => node.getAttribute("r"));
    expect(new Set(radii).size).toBe(2);
  });

  it("does not override a caller's canvas CSS size", () => {
    const { container } = render(
      <QRCode value="USEFY" render="canvas" size={100} style={{ width: "100%" }} />,
    );
    const canvas = container.querySelector("canvas")!;
    expect(canvas.style.width).toBe("100%");
    // The backing store is still ours.
    expect(canvas.width).toBeGreaterThan(0);
  });

  it("keeps the SVG rendering hint in step with the resolved style", () => {
    const hint = (props: Partial<React.ComponentProps<typeof QRCode>>): string | null => {
      cleanup();
      const { container } = render(<QRCode value="USEFY" {...props} />);
      return container.querySelector("svg")!.getAttribute("shape-rendering");
    };
    expect(hint({})).toBe("crispEdges");
    expect(hint({ moduleShape: "dot" })).toBe("geometricPrecision");
    // An inset square is no longer axis-aligned either — crisp edges would alias it.
    expect(hint({ moduleGap: 0.1 })).toBe("geometricPrecision");
    expect(hint({ eyeShape: "circle" })).toBe("geometricPrecision");
    // …and it matches what toSVG() writes for the same options — one resolved
    // style feeding both surfaces, rather than two independent guesses.
    for (const options of [{}, { moduleShape: "dot" as const }, { moduleGap: 0.1 }]) {
      const fromString = /shape-rendering="([^"]+)"/.exec(toSVG(encodeQR("USEFY"), options))![1];
      expect(hint(options)).toBe(fromString);
    }
  });
});
