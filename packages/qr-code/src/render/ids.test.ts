import { describe, expect, it } from "vitest";
import { gradientId, logoClipId } from "./ids";
import type { QRGradient } from "../types";

const gradient: QRGradient = {
  type: "linear",
  rotation: 0,
  stops: [
    { offset: 0, color: "#6366f1" },
    { offset: 1, color: "#ec4899" },
  ],
};

describe("logoClipId", () => {
  const identity = { href: "logo.png", x: 4, y: 4, width: 6, height: 6, clipCircle: true };

  it("is a valid, stable DOM id", () => {
    expect(logoClipId(identity)).toMatch(/^usefy-qr-c-[a-z0-9]+$/);
    expect(logoClipId({ ...identity })).toBe(logoClipId(identity));
  });

  it("changes with every geometric input", () => {
    // SVG ids are document-global: two codes with different clip geometry that
    // share an id would clip each other's logo. Deriving the id from the
    // viewBox alone was exactly that bug.
    const ids = new Set([
      logoClipId(identity),
      logoClipId({ ...identity, href: "other.png" }),
      logoClipId({ ...identity, x: 5 }),
      logoClipId({ ...identity, y: 5 }),
      logoClipId({ ...identity, width: 7 }),
      logoClipId({ ...identity, height: 7 }),
      logoClipId({ ...identity, clipCircle: false }),
    ]);
    expect(ids.size).toBe(7);
  });

  it("does not collide across values that a naive sanitizer would flatten", () => {
    // Stripping non-word characters made 11.6 and 116 the same id.
    expect(logoClipId({ ...identity, x: 11.6 })).not.toBe(logoClipId({ ...identity, x: 116 }));
  });

  it("never collides with a gradient id", () => {
    expect(logoClipId(identity)).not.toBe(gradientId(gradient));
  });
});

describe("gradientId", () => {
  it("is a valid, stable DOM id", () => {
    const id = gradientId(gradient);
    expect(id).toMatch(/^usefy-qr-g-[a-z0-9]+$/);
    expect(gradientId(gradient)).toBe(id);
    // Identical definitions share an id, which makes reuse safe.
    expect(gradientId({ ...gradient, stops: [...gradient.stops] })).toBe(id);
  });

  it("changes when anything about the gradient changes", () => {
    const ids = new Set([
      gradientId(gradient),
      gradientId({ ...gradient, type: "radial" }),
      gradientId({ ...gradient, rotation: 45 }),
      gradientId({ ...gradient, stops: [gradient.stops[0]!, { offset: 1, color: "#f59e0b" }] }),
      gradientId({ ...gradient, stops: [gradient.stops[0]!, { offset: 0.5, color: "#ec4899" }] }),
    ]);
    expect(ids.size).toBe(5);
  });

  it("treats a missing rotation as zero", () => {
    const { rotation: _rotation, ...withoutRotation } = gradient;
    expect(gradientId(withoutRotation as QRGradient)).toBe(
      gradientId({ ...gradient, rotation: 0 }),
    );
  });
});
