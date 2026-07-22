import { describe, it, expect } from "vitest";
import { getSpotlightRect } from "./getSpotlightRect";

describe("getSpotlightRect", () => {
  it("expands the target rect by padding on all sides", () => {
    expect(
      getSpotlightRect({ x: 100, y: 50, width: 200, height: 40 }, 8)
    ).toEqual({ x: 92, y: 42, width: 216, height: 56 });
  });

  it("returns the target rect unchanged with zero padding", () => {
    const target = { x: 10, y: 20, width: 30, height: 40 };
    expect(getSpotlightRect(target, 0)).toEqual(target);
  });

  it("does not mutate the input rect", () => {
    const target = { x: 10, y: 20, width: 30, height: 40 };
    getSpotlightRect(target, 12);
    expect(target).toEqual({ x: 10, y: 20, width: 30, height: 40 });
  });

  it("handles a zero-size (degenerate) target rect", () => {
    expect(getSpotlightRect({ x: 50, y: 60, width: 0, height: 0 }, 8)).toEqual({
      x: 42,
      y: 52,
      width: 16,
      height: 16,
    });
  });

  it("can produce negative origins for targets at the viewport edge", () => {
    expect(getSpotlightRect({ x: 0, y: 0, width: 100, height: 100 }, 10)).toEqual(
      { x: -10, y: -10, width: 120, height: 120 }
    );
  });
});
