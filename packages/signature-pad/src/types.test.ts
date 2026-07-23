import { describe, expect, it } from "vitest";
import {
  DEFAULT_ACCEPT_POINTER_TYPES,
  DEFAULT_MAX_WIDTH,
  DEFAULT_MIN_DISTANCE,
  DEFAULT_MIN_WIDTH,
  DEFAULT_PEN_COLOR,
  DEFAULT_VELOCITY_FILTER_WEIGHT,
  resolveOptions,
  toFinite,
} from "./types";

describe("toFinite", () => {
  it("passes finite numbers through (including 0 and negatives)", () => {
    expect(toFinite(12, 80)).toBe(12);
    expect(toFinite(0, 80)).toBe(0);
    expect(toFinite(-3.5, 80)).toBe(-3.5);
  });

  it("falls back for NaN, ±Infinity, and undefined", () => {
    expect(toFinite(NaN, 80)).toBe(80);
    expect(toFinite(Infinity, 80)).toBe(80);
    expect(toFinite(-Infinity, 80)).toBe(80);
    expect(toFinite(undefined, 80)).toBe(80);
  });
});

describe("resolveOptions", () => {
  it("returns all documented defaults for an empty call", () => {
    const r = resolveOptions();
    expect(r).toEqual({
      penColor: DEFAULT_PEN_COLOR,
      minWidth: DEFAULT_MIN_WIDTH,
      maxWidth: DEFAULT_MAX_WIDTH,
      velocityFilterWeight: DEFAULT_VELOCITY_FILTER_WEIGHT,
      minDistance: DEFAULT_MIN_DISTANCE,
      pressure: "auto",
      acceptPointerTypes: ["pen", "touch", "mouse"],
      dpr: null,
      background: undefined,
    });
  });

  it("keeps valid explicit values", () => {
    const r = resolveOptions({
      penColor: "#000",
      minWidth: 1,
      maxWidth: 4,
      velocityFilterWeight: 0.5,
      minDistance: 3,
      pressure: "ignore",
      acceptPointerTypes: ["pen"],
      dpr: 1.5,
      background: "#fff",
    });
    expect(r).toEqual({
      penColor: "#000",
      minWidth: 1,
      maxWidth: 4,
      velocityFilterWeight: 0.5,
      minDistance: 3,
      pressure: "ignore",
      acceptPointerTypes: ["pen"],
      dpr: 1.5,
      background: "#fff",
    });
  });

  it("guards every numeric field against NaN/Infinity (SPEC decision #8)", () => {
    const r = resolveOptions({
      minWidth: NaN,
      maxWidth: Infinity,
      velocityFilterWeight: -Infinity,
      minDistance: NaN,
      dpr: NaN,
    });
    expect(r.minWidth).toBe(DEFAULT_MIN_WIDTH);
    expect(r.maxWidth).toBe(DEFAULT_MAX_WIDTH);
    expect(r.velocityFilterWeight).toBe(DEFAULT_VELOCITY_FILTER_WEIGHT);
    expect(r.minDistance).toBe(DEFAULT_MIN_DISTANCE);
    expect(r.dpr).toBeNull();
  });

  it("clamps minWidth to >= 0 and raises maxWidth to >= minWidth", () => {
    expect(resolveOptions({ minWidth: -2 }).minWidth).toBe(0);
    const r = resolveOptions({ minWidth: 5, maxWidth: 1 });
    expect(r.minWidth).toBe(5);
    expect(r.maxWidth).toBe(5);
  });

  it("clamps velocityFilterWeight to [0, 1] and minDistance to >= 0", () => {
    expect(resolveOptions({ velocityFilterWeight: 9 }).velocityFilterWeight).toBe(1);
    expect(resolveOptions({ velocityFilterWeight: -1 }).velocityFilterWeight).toBe(0);
    expect(resolveOptions({ minDistance: -4 }).minDistance).toBe(0);
  });

  it("falls back to 'auto' for unknown pressure modes", () => {
    expect(resolveOptions({ pressure: "weird" as never }).pressure).toBe("auto");
    expect(resolveOptions({ pressure: "auto" }).pressure).toBe("auto");
  });

  it("filters acceptPointerTypes to known values and honors an empty list", () => {
    expect(
      resolveOptions({ acceptPointerTypes: ["pen", "gamepad", "touch"] as never })
        .acceptPointerTypes,
    ).toEqual(["pen", "touch"]);
    expect(resolveOptions({ acceptPointerTypes: [] }).acceptPointerTypes).toEqual([]);
    expect(resolveOptions({ acceptPointerTypes: "pen" as never }).acceptPointerTypes).toEqual([
      "pen",
      "touch",
      "mouse",
    ]);
  });

  it("allocates fresh arrays — never a shared reference to input or defaults", () => {
    const input: ("pen" | "touch" | "mouse")[] = ["pen"];
    const r = resolveOptions({ acceptPointerTypes: input });
    expect(r.acceptPointerTypes).not.toBe(input);
    const d = resolveOptions();
    expect(d.acceptPointerTypes).not.toBe(DEFAULT_ACCEPT_POINTER_TYPES);
  });

  it("falls back for non-string penColor/background", () => {
    expect(resolveOptions({ penColor: 7 as never }).penColor).toBe(DEFAULT_PEN_COLOR);
    expect(resolveOptions({ background: 7 as never }).background).toBeUndefined();
  });
});
