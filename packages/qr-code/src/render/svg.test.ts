import { describe, expect, it } from "vitest";
import { toSVG, toSVGProps } from "./svg";
import { matrixToPaths } from "./paths";
import { resolveStyle } from "./style";
import { encodeQR } from "../encode/encodeQR";

const matrix = encodeQR("https://usefy.dev", { level: "M", mask: 2 });

function parse(svg: string): Document {
  const document = new DOMParser().parseFromString(svg, "image/svg+xml");
  expect(document.querySelector("parsererror")).toBeNull();
  return document;
}

describe("toSVGProps", () => {
  it("describes the padded coordinate space", () => {
    const props = toSVGProps(matrix, { margin: 4 });
    const side = matrix.size + 8;
    expect(props.side).toBe(side);
    expect(props.viewBox).toBe(`0 0 ${side} ${side}`);
    expect(props.background).toBe("#ffffff");
    expect(props.image).toBeNull();
  });

  it("returns exactly the paths and defs the path builder produced", () => {
    const props = toSVGProps(matrix, { fg: "#0f172a" });
    const built = matrixToPaths(matrix, resolveStyle({ fg: "#0f172a" }));
    expect(props.paths).toEqual(built.paths);
    expect(props.defs).toEqual(built.defs);
  });

  it("reports a transparent background as null so a caller can skip the rect", () => {
    expect(toSVGProps(matrix, { bg: null }).background).toBeNull();
  });

  it("describes the logo placement, including a circular clip", () => {
    const props = toSVGProps(matrix, {
      logo: { src: "data:image/png;base64,AAA", size: 0.2, shape: "circle", crossOrigin: "anonymous" },
    });
    expect(props.image).toMatchObject({
      href: "data:image/png;base64,AAA",
      clipCircle: true,
      crossOrigin: "anonymous",
    });
    expect(props.image!.width).toBeCloseTo(props.side * 0.2, 10);
    expect(props.image!.x + props.image!.width / 2).toBeCloseTo(props.side / 2, 10);
  });
});

describe("toSVG", () => {
  it("produces well-formed, self-describing SVG", () => {
    const document = parse(toSVG(matrix));
    const svg = document.documentElement;
    expect(svg.tagName).toBe("svg");
    expect(svg.getAttribute("xmlns")).toBe("http://www.w3.org/2000/svg");
    expect(svg.getAttribute("viewBox")).toBe(`0 0 ${matrix.size + 8} ${matrix.size + 8}`);
    expect(document.querySelectorAll("path")).toHaveLength(1);
    expect(document.querySelector("rect")!.getAttribute("fill")).toBe("#ffffff");
  });

  it("is deterministic — the same input yields byte-identical markup", () => {
    expect(toSVG(matrix, { fg: "#0f172a" })).toBe(toSVG(matrix, { fg: "#0f172a" }));
  });

  it("stays byte-identical to a golden string", () => {
    // A tiny symbol with a forced mask, so any drift in placement, quiet zone
    // or run-merging shows up as a diff rather than a vague visual change.
    const tiny = encodeQR("QR", { version: 1, level: "L", mask: 0 });
    const svg = toSVG(tiny, { margin: 1, bg: null });
    expect(svg).toMatchInlineSnapshot(`"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23" width="23" height="23" shape-rendering="crispEdges" aria-hidden="true"><path d="M11 1H12V2H11ZM13 1H14V2H13ZM13 2H14V3H13ZM9 3H10V4H9ZM11 3H12V4H11ZM13 4H14V5H13ZM10 5H11V6H10ZM12 5H14V6H12ZM10 6H13V7H10ZM9 7H10V8H9ZM11 7H12V8H11ZM13 7H14V8H13ZM9 8H10V9H9ZM11 8H12V9H11ZM1 9H4V10H1ZM5 9H10V10H5ZM11 9H12V10H11ZM13 9H16V10H13ZM19 9H20V10H19ZM2 10H4V11H2ZM6 10H7V11H6ZM9 10H11V11H9ZM12 10H13V11H12ZM14 10H15V11H14ZM16 10H17V11H16ZM18 10H19V11H18ZM1 11H3V12H1ZM4 11H5V12H4ZM7 11H9V12H7ZM12 11H13V12H12ZM14 11H17V12H14ZM19 11H21V12H19ZM1 12H3V13H1ZM8 12H9V13H8ZM10 12H11V13H10ZM12 12H15V13H12ZM16 12H19V13H16ZM20 12H22V13H20ZM3 13H4V14H3ZM5 13H8V14H5ZM9 13H10V14H9ZM12 13H13V14H12ZM14 13H17V14H14ZM19 13H20V14H19ZM9 14H12V15H9ZM15 14H16V15H15ZM19 14H21V15H19ZM9 15H10V16H9ZM11 15H12V16H11ZM13 15H14V16H13ZM17 15H18V16H17ZM20 15H22V16H20ZM9 16H10V17H9ZM11 16H12V17H11ZM15 16H16V17H15ZM19 16H20V17H19ZM9 17H12V18H9ZM13 17H14V18H13ZM15 17H16V18H15ZM17 17H18V18H17ZM19 17H20V18H19ZM21 17H22V18H21ZM10 18H11V19H10ZM12 18H13V19H12ZM14 18H15V19H14ZM16 18H17V19H16ZM18 18H19V19H18ZM20 18H21V19H20ZM9 19H11V20H9ZM12 19H13V20H12ZM14 19H17V20H14ZM18 19H20V20H18ZM21 19H22V20H21ZM9 20H15V21H9ZM16 20H19V21H16ZM20 20H22V21H20ZM9 21H10V22H9ZM11 21H13V22H11ZM14 21H17V22H14ZM18 21H20V22H18ZM21 21H22V22H21ZM1 1H8V8H1ZM2 2V7H7V2ZM15 1H22V8H15ZM16 2V7H21V2ZM1 15H8V22H1ZM2 16V21H7V16ZM3 3H6V6H3ZM17 3H20V6H17ZM3 17H6V20H3Z" fill="#000000"/></svg>"`);
  });

  it("declares gradients and references them from the path fill", () => {
    const svg = toSVG(matrix, {
      fg: {
        type: "linear",
        rotation: 90,
        stops: [
          { offset: 0, color: "#6366f1" },
          { offset: 1, color: "#ec4899" },
        ],
      },
    });
    const document = parse(svg);
    const gradient = document.querySelector("linearGradient")!;
    expect(gradient.getAttribute("gradientUnits")).toBe("userSpaceOnUse");
    expect(document.querySelectorAll("stop")).toHaveLength(2);
    expect(document.querySelector("path")!.getAttribute("fill")).toBe(
      `url(#${gradient.getAttribute("id")})`,
    );
    // 90° runs top to bottom across the full box.
    expect(Number(gradient.getAttribute("x1"))).toBeCloseTo(Number(gradient.getAttribute("x2")), 6);
    expect(Number(gradient.getAttribute("y1"))).toBeCloseTo(0, 6);
  });

  it("emits a radial gradient with a centre and radius", () => {
    const document = parse(
      toSVG(matrix, {
        fg: {
          type: "radial",
          stops: [
            { offset: 0, color: "#22c55e" },
            { offset: 1, color: "#0ea5e9" },
          ],
        },
      }),
    );
    const gradient = document.querySelector("radialGradient")!;
    const side = matrix.size + 8;
    expect(Number(gradient.getAttribute("cx"))).toBeCloseTo(side / 2, 6);
    expect(Number(gradient.getAttribute("r"))).toBeCloseTo(side / 2, 6);
  });

  it("labels the code when given a title, and hides it otherwise", () => {
    const titled = parse(toSVG(matrix, { title: "Scan to open usefy.dev" }));
    expect(titled.documentElement.getAttribute("role")).toBe("img");
    expect(titled.querySelector("title")!.textContent).toBe("Scan to open usefy.dev");

    const untitled = parse(toSVG(matrix));
    expect(untitled.documentElement.getAttribute("aria-hidden")).toBe("true");
    expect(untitled.querySelector("title")).toBeNull();
  });

  it("escapes hostile strings instead of letting them close a tag", () => {
    const svg = toSVG(matrix, { title: `</title><script>alert(1)</script>` });
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;/title&gt;");
    parse(svg); // still well-formed
  });

  it("cannot be given an unsafe colour, because resolution already dropped it", () => {
    const svg = toSVG(matrix, { fg: 'red"/><script>x</script>', bg: "url(//evil/beacon.svg)" });
    expect(svg).not.toContain("<script");
    expect(svg).not.toContain("url(");
    expect(svg).toContain('fill="#000000"');
    parse(svg);
  });

  it("embeds a logo, with a clip path when the shape is a circle", () => {
    const square = parse(toSVG(matrix, { logo: { src: "data:image/png;base64,AAA" } }));
    const image = square.querySelector("image")!;
    expect(image.getAttribute("href")).toBe("data:image/png;base64,AAA");
    expect(image.getAttribute("clip-path")).toBeNull();

    const circle = parse(
      toSVG(matrix, { logo: { src: "data:image/png;base64,AAA", shape: "circle" } }),
    );
    const clip = circle.querySelector("clipPath")!;
    expect(clip.getAttribute("id")).toMatch(/^usefy-qr-c-/);
    expect(circle.querySelector("image")!.getAttribute("clip-path")).toBe(
      `url(#${clip.getAttribute("id")})`,
    );
  });

  it("gives two logos of different sizes different clip ids", () => {
    // Same version and margin, so a viewBox-derived id would collide — and the
    // second code's logo would be clipped by the first code's circle.
    const idOf = (size: number): string => {
      const svg = toSVG(matrix, { logo: { src: "logo.png", size, shape: "circle" } });
      return /<clipPath id="([^"]+)"/.exec(svg)![1]!;
    };
    expect(idOf(0.1)).not.toBe(idOf(0.35));
  });

  it("switches rendering hints when modules stop being axis-aligned", () => {
    expect(toSVG(matrix)).toContain('shape-rendering="crispEdges"');
    expect(toSVG(matrix, { moduleShape: "dot" })).toContain('shape-rendering="geometricPrecision"');
  });

  it("omits the background rect when transparent", () => {
    expect(parse(toSVG(matrix, { bg: null })).querySelector("rect")).toBeNull();
  });
});
