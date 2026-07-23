import { describe, expect, it } from "vitest";
import * as headless from "./headless";
import * as root from "./index";

/**
 * Pins the public `./headless` surface (SPEC §4.5) — an accidental
 * removal or rename is an API break and must fail here first.
 * Also proves both entries are SSR-safe to import: this file evaluates
 * the modules at import time, before any DOM is touched.
 */
describe("public surface", () => {
  const expectedFunctions = [
    // engine
    "createSignatureEngine",
    // pure ink pipeline
    "filterPoints",
    "passesMinDistance",
    "pointDistance",
    "bezierFor",
    "flattenSegment",
    "widthForSegment",
    "startWidthFor",
    "createStrokeWalker",
    "flattenStrokeSegment",
    "strokeGeometry",
    "strokeSteps",
    "inkBounds",
    "strokesToSVG",
    // option resolution
    "resolveOptions",
  ] as const;

  it("exports every documented function from ./headless", () => {
    for (const name of expectedFunctions) {
      expect(typeof headless[name], name).toBe("function");
    }
  });

  it("exports the documented constants", () => {
    expect(headless.MAX_DPR).toBe(2);
    expect(headless.DEFAULT_PEN_COLOR).toBe("#1e293b");
    expect(headless.DEFAULT_MIN_WIDTH).toBe(0.5);
    expect(headless.DEFAULT_MAX_WIDTH).toBe(2.5);
    expect(headless.DEFAULT_VELOCITY_FILTER_WEIGHT).toBe(0.7);
    expect(headless.DEFAULT_MIN_DISTANCE).toBe(2);
    expect(headless.DEFAULT_ACCEPT_POINTER_TYPES).toEqual(["pen", "touch", "mouse"]);
    expect(headless.DEFAULT_EXPORT_PADDING).toBe(8);
  });

  it("does not leak internal utilities (toFinite stays private)", () => {
    expect("toFinite" in headless).toBe(false);
  });

  it("the root entry re-exports the full headless surface", () => {
    for (const name of Object.keys(headless)) {
      expect(name in root, name).toBe(true);
    }
  });
});
