import { describe, expect, it } from "vitest";
import { matrixToPaths } from "./paths";
import { resolveStyle } from "./style";
import { buildModuleField } from "./geometry";
import { gradientId } from "./ids";
import { encodeQR } from "../encode/encodeQR";
import { bounds } from "../__testing__/path";

const matrix = encodeQR("https://usefy.dev/packages/qr-code", { level: "M" });

describe("matrixToPaths", () => {
  it("emits a single path when everything shares one fill", () => {
    const { paths, defs } = matrixToPaths(matrix, resolveStyle());
    expect(paths).toHaveLength(1);
    expect(paths[0]!.fill).toBe("#000000");
    expect(defs).toEqual([]);
  });

  it("splits into separate paths only where the fill differs", () => {
    const outerOnly = matrixToPaths(
      matrix,
      resolveStyle({ eyeColor: { outer: "#ef4444" } }),
    ).paths;
    // data | eye-ring | eye-centre → the last two differ, so three paths.
    expect(outerOnly.map((path) => path.fill)).toEqual(["#000000", "#ef4444", "#000000"]);

    const both = matrixToPaths(
      matrix,
      resolveStyle({ eyeColor: { outer: "#ef4444", inner: "#ef4444" } }),
    ).paths;
    // The ring and centre now share a fill and merge back together.
    expect(both.map((path) => path.fill)).toEqual(["#000000", "#ef4444"]);
  });

  it("merges runs for square modules and only for square modules", () => {
    const commands = (d: string): number => (d.match(/M/g) ?? []).length;
    const field = buildModuleField(matrix, resolveStyle());
    const painted = field.dark.reduce((sum, value) => sum + value, 0);

    const square = matrixToPaths(matrix, resolveStyle()).paths[0]!.d;
    // 3 eye rings (2 subpaths each) + 3 centres = 9 subpaths beyond the data.
    expect(commands(square) - 9).toBeLessThan(painted);

    // Shapes and gaps each give a module its own outline, so merging stops.
    for (const style of [
      resolveStyle({ moduleShape: "dot" }),
      resolveStyle({ moduleShape: "rounded" }),
      resolveStyle({ moduleShape: "classy" }),
      resolveStyle({ moduleGap: 0.1 }),
    ]) {
      expect(commands(matrixToPaths(matrix, style).paths[0]!.d) - 9).toBe(painted);
    }
  });

  it("paints the same modules regardless of shape", () => {
    // Style must change how the code looks, never what it encodes.
    const counts = (["square", "rounded", "dot", "classy"] as const).map((moduleShape) => {
      const field = buildModuleField(matrix, resolveStyle({ moduleShape }));
      return field.dark.reduce((sum, value) => sum + value, 0);
    });
    expect(new Set(counts).size).toBe(1);
  });

  it("keeps every module inside the quiet zone", () => {
    for (const margin of [0, 4, 10]) {
      const box = bounds(matrixToPaths(matrix, resolveStyle({ margin })).paths[0]!.d);
      expect(box.minX).toBe(margin);
      expect(box.minY).toBe(margin);
      expect(box.maxX).toBe(margin + matrix.size);
      expect(box.maxY).toBe(margin + matrix.size);
    }
  });

  it("references a gradient by a deterministic id and declares it once", () => {
    const gradient = {
      type: "linear" as const,
      rotation: 45,
      stops: [
        { offset: 0, color: "#6366f1" },
        { offset: 1, color: "#ec4899" },
      ],
    };
    const first = matrixToPaths(matrix, resolveStyle({ fg: gradient }));
    const second = matrixToPaths(encodeQR("something else"), resolveStyle({ fg: gradient }));

    const id = gradientId(gradient);
    expect(first.paths[0]!.fill).toBe(`url(#${id})`);
    expect(first.defs).toHaveLength(1);
    expect(first.defs[0]!.id).toBe(id);
    expect(first.defs[0]!.bounds).toEqual({
      x: 0,
      y: 0,
      width: matrix.size + 8,
      height: matrix.size + 8,
    });
    // The same gradient on a different code reuses the id — safe, since the
    // definition is identical.
    expect(second.paths[0]!.fill).toBe(first.paths[0]!.fill);
  });

  it("draws the finder patterns even when a logo covers the centre", () => {
    const withLogo = matrixToPaths(
      matrix,
      resolveStyle({ logo: { src: "a", size: 0.35, padding: 0.1 }, eyeColor: { outer: "#0ea5e9" } }),
    );
    const ring = withLogo.paths.find((path) => path.fill === "#0ea5e9")!;
    // Three rings, two subpaths each.
    expect(ring.d.match(/M/g)).toHaveLength(6);
  });

  it("shrinks the data path when a logo excavates the middle", () => {
    const plain = matrixToPaths(matrix, resolveStyle()).paths[0]!.d;
    const excavated = matrixToPaths(matrix, resolveStyle({ logo: { src: "a", size: 0.3 } })).paths[0]!.d;
    expect(excavated.length).toBeLessThan(plain.length);
  });
});
