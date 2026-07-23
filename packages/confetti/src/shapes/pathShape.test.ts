import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { pathShape } from "./pathShape";
import { DEFAULT_PATH_SHAPE_SIZE } from "../engine/draw";

/** jsdom has no Path2D — provide a minimal stand-in. */
class MockPath2D {
  moveTo(): void {}
  lineTo(): void {}
  closePath(): void {}
}

beforeEach(() => {
  vi.stubGlobal("Path2D", MockPath2D);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("pathShape", () => {
  it("runs the factory lazily, once, and memoizes the Path2D", () => {
    const factory = vi.fn(() => new MockPath2D() as unknown as Path2D);
    const shape = pathShape(factory);
    expect(factory).not.toHaveBeenCalled(); // lazy

    const first = shape.path();
    const second = shape.path();
    expect(first).toBeInstanceOf(MockPath2D);
    expect(second).toBe(first); // same object every frame/particle
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("defaults size to DEFAULT_PATH_SHAPE_SIZE and accepts overrides", () => {
    expect(pathShape(() => new MockPath2D() as unknown as Path2D).size).toBe(
      DEFAULT_PATH_SHAPE_SIZE,
    );
    expect(
      pathShape(() => new MockPath2D() as unknown as Path2D, { size: 14 }).size,
    ).toBe(14);
    // Degenerate sizes clamp instead of vanishing.
    expect(
      pathShape(() => new MockPath2D() as unknown as Path2D, { size: NaN }).size,
    ).toBe(DEFAULT_PATH_SHAPE_SIZE);
    expect(
      pathShape(() => new MockPath2D() as unknown as Path2D, { size: -5 }).size,
    ).toBe(0.1);
  });

  it("auto-generates unique keys; an explicit key wins", () => {
    const a = pathShape(() => new MockPath2D() as unknown as Path2D);
    const b = pathShape(() => new MockPath2D() as unknown as Path2D);
    expect(a.key).not.toBe(b.key);
    expect(
      pathShape(() => new MockPath2D() as unknown as Path2D, { key: "heart@1" })
        .key,
    ).toBe("heart@1");
  });

  it("returns null (particle skipped) when Path2D is unavailable, without calling the factory", () => {
    vi.stubGlobal("Path2D", undefined);
    const factory = vi.fn(() => new MockPath2D() as unknown as Path2D);
    const shape = pathShape(factory);
    expect(shape.path()).toBeNull();
    expect(factory).not.toHaveBeenCalled();

    // Environment gains Path2D (e.g. after hydration) → recovers.
    vi.stubGlobal("Path2D", MockPath2D);
    expect(shape.path()).toBeInstanceOf(MockPath2D);
    expect(factory).toHaveBeenCalledTimes(1);
  });
});
