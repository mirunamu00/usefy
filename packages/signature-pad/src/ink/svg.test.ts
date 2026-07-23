import { describe, expect, it } from "vitest";
import type { SignaturePoint, SignatureStroke, SignatureData } from "../types";
import { inkBounds } from "./bounds";
import { strokeGeometry } from "./strokeWalker";
import { sanitizeColor, strokesToSVG } from "./svg";

const P = (x: number, y: number, time = 0, pressure = 0): SignaturePoint => ({
  x,
  y,
  time,
  pressure,
});

const stroke = (
  points: SignaturePoint[],
  overrides: Partial<SignatureStroke> = {},
): SignatureStroke => ({
  points,
  color: "#000",
  minWidth: 1,
  maxWidth: 3,
  velocityFilterWeight: 0.7,
  pressure: "auto",
  pointerType: "mouse",
  ...overrides,
});

const doc = (strokes: SignatureStroke[], width = 300, height = 150): SignatureData => ({
  v: 1,
  width,
  height,
  strokes,
});

/** Parse and assert XML validity; returns the parsed document. */
function parseSVG(svg: string): Document {
  const parsed = new DOMParser().parseFromString(svg, "application/xml");
  expect(parsed.getElementsByTagName("parsererror")).toHaveLength(0);
  return parsed;
}

describe("sanitizeColor", () => {
  it("passes plausible CSS colors through", () => {
    expect(sanitizeColor("#1e293b")).toBe("#1e293b");
    expect(sanitizeColor("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
    expect(sanitizeColor("hsl(200 50% 40% / 0.5)")).toBe("hsl(200 50% 40% / 0.5)");
    expect(sanitizeColor("rebeccapurple")).toBe("rebeccapurple");
  });

  it("falls back for XML-active or empty values (no markup injection)", () => {
    expect(sanitizeColor('red"/><script>alert(1)</script>')).toBe("#1e293b");
    expect(sanitizeColor("<foo>")).toBe("#1e293b");
    expect(sanitizeColor("")).toBe("#1e293b");
    expect(sanitizeColor("a&b", "#fff")).toBe("#fff");
    expect(sanitizeColor(7 as never)).toBe("#1e293b"); // non-string from hostile JSON
  });

  it("blocks url(...) paint-server references (tracking beacons, SPEC §9)", () => {
    // Charset-legal but a paint-server reference, not a color — an
    // external URL in an exported SVG becomes a network fetch.
    expect(sanitizeColor("url(//evil.example/leak.svg#g)")).toBe("#1e293b");
    expect(sanitizeColor("url(evil.svg#grad)")).toBe("#1e293b");
    expect(sanitizeColor("url(#localid)")).toBe("#1e293b");
    expect(sanitizeColor("URL ( #localid )")).toBe("#1e293b"); // case/space variants
  });
});

describe("strokesToSVG", () => {
  it("golden: a single dot stroke", () => {
    // dot radius (1+3)/2 = 2 at (10,20) → bounds {8,18,4,4} + padding 8
    // → viewBox "0 10 20 20".
    const svg = strokesToSVG(doc([stroke([P(10, 20)])]));
    expect(svg).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 10 20 20">' +
        '<circle cx="10" cy="20" r="2" fill="#000"/>' +
        "</svg>",
    );
  });

  it("produces parseable XML for a multi-stroke document", () => {
    const svg = strokesToSVG(
      doc([
        stroke([P(0, 0, 0), P(10, 2, 12), P(18, 9, 25), P(30, 9, 40)]),
        stroke([P(50, 50)]),
      ]),
    );
    const parsed = parseSVG(svg);
    expect(parsed.getElementsByTagName("path").length).toBeGreaterThan(0);
    expect(parsed.getElementsByTagName("circle")).toHaveLength(1);
  });

  it("emits one round-capped path per segment from the SAME geometry pipeline", () => {
    const s = stroke([P(0, 0, 0), P(10, 2, 12), P(18, 9, 25), P(30, 9, 40)]);
    const { segments } = strokeGeometry(s);
    const svg = strokesToSVG(doc([s]));
    const parsed = parseSVG(svg);
    const paths = Array.from(parsed.getElementsByTagName("path"));
    expect(paths).toHaveLength(segments.length); // structural parity

    // Numeric spot-check: first path mirrors the first segment exactly
    // (3-decimal formatting).
    const f = (n: number) => String(Math.round(n * 1000) / 1000);
    const b = segments[0].bezier;
    expect(paths[0].getAttribute("d")).toBe(
      `M ${f(b.start.x)} ${f(b.start.y)} C ${f(b.c1.x)} ${f(b.c1.y)}, ${f(b.c2.x)} ${f(
        b.c2.y,
      )}, ${f(b.end.x)} ${f(b.end.y)}`,
    );
    expect(paths[0].getAttribute("stroke-width")).toBe(
      f(segments[0].startWidth + segments[0].endWidth),
    );
    const g = paths[0].parentElement!;
    expect(g.getAttribute("stroke")).toBe("#000");
    expect(g.getAttribute("stroke-linecap")).toBe("round");
    expect(g.getAttribute("fill")).toBe("none");
  });

  it("viewBox equals inkBounds inflated by padding when trimming", () => {
    const strokes = [stroke([P(0, 0, 0), P(40, 10, 30), P(80, -5, 60)])];
    const b = inkBounds(strokes)!;
    const svg = strokesToSVG(doc(strokes), { padding: 5 });
    const viewBox = parseSVG(svg).documentElement.getAttribute("viewBox")!.split(" ").map(Number);
    expect(viewBox[0]).toBeCloseTo(b.x - 5, 3);
    expect(viewBox[1]).toBeCloseTo(b.y - 5, 3);
    expect(viewBox[2]).toBeCloseTo(b.width + 10, 3);
    expect(viewBox[3]).toBeCloseTo(b.height + 10, 3);
  });

  it("trim: false uses the document's full capture-time canvas", () => {
    const svg = strokesToSVG(doc([stroke([P(10, 20)])], 300, 150), { trim: false });
    expect(parseSVG(svg).documentElement.getAttribute("viewBox")).toBe("0 0 300 150");
  });

  it("an empty document yields a minimal valid 1×1 artifact — never throws", () => {
    const svg = strokesToSVG(doc([]));
    expect(parseSVG(svg).documentElement.getAttribute("viewBox")).toBe("0 0 1 1");
    // strokes with no points are skipped too
    expect(() => strokesToSVG(doc([stroke([])]))).not.toThrow();
  });

  it("paints an optional background rect beneath the ink", () => {
    const svg = strokesToSVG(doc([stroke([P(10, 20)])]), { background: "#fff" });
    const rect = parseSVG(svg).getElementsByTagName("rect")[0];
    expect(rect.getAttribute("fill")).toBe("#fff");
    // rect covers the whole viewBox
    expect(rect.getAttribute("width")).toBe("20");
    // and appears before the ink
    expect(svg.indexOf("<rect")).toBeLessThan(svg.indexOf("<circle"));
  });

  it("sanitizes hostile colors from stroke data and background (SPEC §9)", () => {
    const hostile = stroke([P(10, 20)], { color: '"/><script>alert(1)</script>' });
    const svg = strokesToSVG(doc([hostile]), { background: "<evil>" });
    expect(svg).not.toContain("script");
    expect(svg).not.toContain("evil");
    parseSVG(svg); // still valid XML
    expect(svg).toContain('fill="#1e293b"'); // ink falls back to a visible pen color
    // ...but an unsafe BACKGROUND is omitted entirely (transparent) —
    // never substituted with a near-black color under near-black ink.
    expect(svg).not.toContain("<rect");
  });

  it("omits a url(...) background instead of substituting a color", () => {
    const svg = strokesToSVG(doc([stroke([P(10, 20)])]), {
      background: "url(//evil.example/leak.svg#g)",
    });
    expect(svg).not.toContain("<rect");
    expect(svg).not.toContain("url(");
  });

  it("keeps round caps inside the viewBox even at padding: 0", () => {
    // Wide width range → big cap slack: (8 − 0.5) / 2 = 3.75.
    const wide = stroke([P(0, 0, 0), P(40, 10, 400), P(80, 0, 800)], {
      minWidth: 0.5,
      maxWidth: 8,
    });
    const svg = strokesToSVG(doc([wide]), { padding: 0 });
    const vb = parseSVG(svg).documentElement.getAttribute("viewBox")!.split(" ").map(Number);
    const [bx, by, bw, bh] = vb;
    // Every segment endpoint's round cap (radius = mean width) must be
    // fully inside the box.
    const { segments } = strokeGeometry(wide);
    for (const s of segments) {
      const cap = (s.startWidth + s.endWidth) / 2;
      for (const p of [s.bezier.start, s.bezier.end]) {
        expect(p.x - cap).toBeGreaterThanOrEqual(bx - 1e-3);
        expect(p.y - cap).toBeGreaterThanOrEqual(by - 1e-3);
        expect(p.x + cap).toBeLessThanOrEqual(bx + bw + 1e-3);
        expect(p.y + cap).toBeLessThanOrEqual(by + bh + 1e-3);
      }
    }
  });

  it("normalizes -0 in the number formatting (deterministic output)", () => {
    // cy = -0.0001 rounds to -0 at 3 decimals → must serialize as "0".
    const svg = strokesToSVG(doc([stroke([P(10, -0.0001)])]));
    expect(svg).toContain('cy="0"');
    expect(svg).not.toContain("-0");
  });

  it("guards degenerate numeric fields in trim: false dimensions", () => {
    const svg = strokesToSVG(doc([], NaN, Infinity), { trim: false });
    expect(parseSVG(svg).documentElement.getAttribute("viewBox")).toBe("0 0 1 1");
  });

  it("throws a TypeError on malformed input", () => {
    expect(() => strokesToSVG(null as never)).toThrow(TypeError);
    expect(() => strokesToSVG({ v: 1 } as never)).toThrow(TypeError);
  });

  it("is deterministic — identical input twice gives the identical string", () => {
    const d = doc([stroke([P(0, 0, 0), P(10, 2, 12), P(18, 9, 25)])]);
    expect(strokesToSVG(d)).toBe(strokesToSVG(d));
  });
});
