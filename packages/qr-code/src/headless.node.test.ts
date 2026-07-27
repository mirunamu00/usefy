// @vitest-environment node

import { describe, expect, it } from "vitest";
import { encodeQR, logoSafety, matrixToPaths, resolveStyle, toSVG, toSVGProps } from "./headless";
import { QRExportError } from "./errors";
import { toPNG } from "./render/png";

/**
 * The server path, exercised with **no DOM at all**.
 *
 * Every other test in this package runs under jsdom, where `document` and
 * `window` exist — so a stray DOM access on the headless path would go
 * unnoticed until someone imported it from a React Server Component. This file
 * is the only place that actually proves the RSC claim at runtime.
 */
describe("the headless surface in a DOM-free environment", () => {
  it("has no DOM to fall back on", () => {
    expect(typeof document).toBe("undefined");
    expect(typeof window).toBe("undefined");
  });

  it("encodes and renders SVG without touching the DOM", () => {
    const matrix = encodeQR("https://usefy.dev", { level: "Q" });
    expect(matrix.version).toBeGreaterThan(0);

    const svg = toSVG(matrix, { margin: 2, moduleShape: "rounded" });
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("<path");

    const props = toSVGProps(matrix, { margin: 2 });
    expect(props.paths.length).toBeGreaterThan(0);
    expect(props.shapeRendering).toBe("crispEdges");
  });

  it("runs the geometry and analysis helpers server-side", () => {
    const matrix = encodeQR("https://usefy.dev", { level: "H" });
    expect(matrixToPaths(matrix, resolveStyle({ moduleShape: "dot" })).paths.length).toBeGreaterThan(0);
    expect(logoSafety(matrix, { logo: { src: "a", size: 0.2 } }).safe).toBe(true);
  });

  it("produces a UTF-8 code server-side, via TextEncoder rather than the DOM", () => {
    expect(toSVG(encodeQR("안녕하세요"))).toContain("<path");
  });

  it("directs a server caller away from raster export instead of crashing obscurely", async () => {
    await expect(toPNG(encodeQR("USEFY"))).rejects.toBeInstanceOf(QRExportError);
    await expect(toPNG(encodeQR("USEFY"))).rejects.toThrow(/toSVG\(\) on the server/);
  });
});
