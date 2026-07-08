import { describe, it, expect } from "vitest";
import {
  isModifierAction,
  isTextAction,
  keyAccessibleName,
  DEFAULT_ARIA_LABEL,
} from "./constants";

describe("constants helpers", () => {
  it("classifies modifier actions", () => {
    expect(isModifierAction("shift")).toBe(true);
    expect(isModifierAction("capslock")).toBe(true);
    expect(isModifierAction("layer")).toBe(true);
    expect(isModifierAction("backspace")).toBe(false);
    expect(isModifierAction(undefined)).toBe(false);
  });

  it("classifies text actions", () => {
    expect(isTextAction("backspace")).toBe(true);
    expect(isTextAction("enter")).toBe(true);
    expect(isTextAction("space")).toBe(true);
    expect(isTextAction("clear")).toBe(true);
    expect(isTextAction("shift")).toBe(false);
    expect(isTextAction(undefined)).toBe(false);
  });

  it("derives accessible names", () => {
    expect(keyAccessibleName({ key: "a" })).toBe("a");
    expect(keyAccessibleName({ key: " " })).toBe("Space");
    expect(keyAccessibleName({ key: "Backspace", action: "backspace" })).toBe(
      "Backspace"
    );
    expect(keyAccessibleName({ key: "x", ariaLabel: "Custom" })).toBe("Custom");
    // Uses the resolved effective value when provided.
    expect(keyAccessibleName({ key: "a" }, "A")).toBe("A");
  });

  it("exposes the default aria label", () => {
    expect(DEFAULT_ARIA_LABEL).toBe("On-screen keyboard");
  });
});
