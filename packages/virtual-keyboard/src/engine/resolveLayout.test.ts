import { describe, it, expect } from "vitest";
import { resolveKey, resolveLayout, buildKeyEvent } from "./resolveLayout";
import { createLayout } from "./createLayout";
import type { KeyboardModifiers } from "../types";

const NONE: KeyboardModifiers = { shift: false, capsLock: false, layer: false };

describe("resolveLayout", () => {
  const layout = createLayout({
    name: "test",
    rows: [
      [{ key: "a", layerKey: "@" }, { key: "1", shiftKey: "!" }],
      [{ key: "Shift", action: "shift" }, { key: ",", type: "char" }],
    ],
  });

  it("uppercases char keys under capsLock", () => {
    const resolved = resolveLayout(layout, { ...NONE, capsLock: true });
    expect(resolved.rows[0][0].effectiveValue).toBe("A");
    expect(resolved.rows[0][0].displayLabel).toBe("A");
    // Caps Lock does not affect non-letters.
    expect(resolved.rows[0][1].effectiveValue).toBe("1");
  });

  it("emits shiftKey when shift is active", () => {
    const resolved = resolveLayout(layout, { ...NONE, shift: true });
    // Letters uppercase via shift.
    expect(resolved.rows[0][0].effectiveValue).toBe("A");
    // Explicit shiftKey wins for symbols.
    expect(resolved.rows[0][1].effectiveValue).toBe("!");
    // The Shift key itself is marked active.
    expect(resolved.rows[1][0].active).toBe(true);
  });

  it("swaps to the symbol layer and back", () => {
    const layered = resolveLayout(layout, { ...NONE, layer: true });
    expect(layered.rows[0][0].effectiveValue).toBe("@");
    // A key without a layerKey falls back to its base value.
    expect(layered.rows[1][1].effectiveValue).toBe(",");

    // Toggling the layer off restores the base values.
    const base = resolveLayout(layout, NONE);
    expect(base.rows[0][0].effectiveValue).toBe("a");
  });

  it("gives layer precedence over shift", () => {
    const resolved = resolveLayout(layout, {
      ...NONE,
      shift: true,
      layer: true,
    });
    expect(resolved.rows[0][0].effectiveValue).toBe("@");
  });

  it("preserves an explicit label and infers direction", () => {
    const withLabel = createLayout({
      name: "labeled",
      direction: "rtl",
      rows: [[{ key: "Enter", label: "↵", action: "enter" }]],
    });
    const resolved = resolveLayout(withLabel, NONE);
    expect(resolved.direction).toBe("rtl");
    expect(resolved.rows[0][0].displayLabel).toBe("↵");
    expect(resolved.rows[0][0].type).toBe("action");
  });
});

describe("resolveKey", () => {
  it("infers modifier type for modifier actions", () => {
    expect(resolveKey({ key: "Shift", action: "shift" }, NONE).type).toBe(
      "modifier"
    );
    expect(resolveKey({ key: "Space", action: "space" }, NONE).type).toBe(
      "action"
    );
    expect(resolveKey({ key: "x" }, NONE).type).toBe("char");
  });
});

describe("buildKeyEvent", () => {
  it("captures the emitted value, code and modifier flags", () => {
    const resolved = resolveKey({ key: "a", code: "KeyA" }, {
      ...NONE,
      shift: true,
    });
    const event = buildKeyEvent(resolved, { ...NONE, shift: true, layer: true });
    expect(event).toEqual({
      key: "A",
      code: "KeyA",
      shiftKey: true,
      layer: true,
    });
  });
});
