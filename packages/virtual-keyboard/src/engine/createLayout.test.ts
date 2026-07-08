import { describe, it, expect } from "vitest";
import { createLayout } from "./createLayout";
import { identityComposer } from "../composer/identity";

describe("createLayout", () => {
  it("expands bare-string keys into char definitions", () => {
    const layout = createLayout({
      name: "digits",
      rows: [["1", "2", "3"]],
    });
    expect(layout.rows[0]).toEqual([
      { key: "1", type: "char" },
      { key: "2", type: "char" },
      { key: "3", type: "char" },
    ]);
  });

  it("passes full key definitions through unchanged", () => {
    const back = { key: "Backspace", action: "backspace" as const };
    const layout = createLayout({ name: "x", rows: [[back, "0"]] });
    expect(layout.rows[0][0]).toBe(back);
  });

  it("defaults direction to ltr and carries name/label/composer", () => {
    const layout = createLayout({
      name: "x",
      label: "X",
      composer: identityComposer,
      rows: [["a"]],
    });
    expect(layout.direction).toBe("ltr");
    expect(layout.name).toBe("x");
    expect(layout.label).toBe("X");
    expect(layout.composer).toBe(identityComposer);
  });

  it("honors an explicit direction", () => {
    const layout = createLayout({
      name: "rtl",
      direction: "rtl",
      rows: [["a"]],
    });
    expect(layout.direction).toBe("rtl");
  });
});
