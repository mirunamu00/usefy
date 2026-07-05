import { describe, it, expect, afterEach } from "vitest";
import {
  chordMatches,
  eventToChord,
  isEditableTarget,
  isHotkeysSupported,
  isMacPlatform,
  normalizeKeyToken,
  parseCombo,
  parseHotkey,
} from "./utils";

describe("isHotkeysSupported", () => {
  it("returns true in a jsdom (browser-like) environment", () => {
    expect(isHotkeysSupported()).toBe(true);
  });
});

describe("isMacPlatform", () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "navigator"
  );

  afterEach(() => {
    if (originalDescriptor) {
      Object.defineProperty(globalThis, "navigator", originalDescriptor);
    }
  });

  function mockNavigator(value: unknown) {
    Object.defineProperty(globalThis, "navigator", {
      value,
      configurable: true,
      writable: true,
    });
  }

  it("detects macOS via userAgentData.platform", () => {
    mockNavigator({ userAgentData: { platform: "macOS" }, userAgent: "" });
    expect(isMacPlatform()).toBe(true);
  });

  it("detects iOS via navigator.platform", () => {
    mockNavigator({ platform: "iPhone", userAgent: "" });
    expect(isMacPlatform()).toBe(true);
  });

  it("detects Mac via the user-agent string when platform is absent", () => {
    mockNavigator({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X)" });
    expect(isMacPlatform()).toBe(true);
  });

  it("returns false on Windows/Linux", () => {
    mockNavigator({ platform: "Win32", userAgent: "Windows NT" });
    expect(isMacPlatform()).toBe(false);
  });

  it("returns false when navigator is undefined (SSR)", () => {
    mockNavigator(undefined);
    expect(isMacPlatform()).toBe(false);
  });
});

describe("normalizeKeyToken", () => {
  it("lower-cases plain keys", () => {
    expect(normalizeKeyToken("K")).toBe("k");
    expect(normalizeKeyToken("Escape")).toBe("escape");
  });

  it("resolves friendly aliases", () => {
    expect(normalizeKeyToken("esc")).toBe("escape");
    expect(normalizeKeyToken("space")).toBe(" ");
    expect(normalizeKeyToken("up")).toBe("arrowup");
    expect(normalizeKeyToken("down")).toBe("arrowdown");
    expect(normalizeKeyToken("return")).toBe("enter");
    expect(normalizeKeyToken("del")).toBe("delete");
    expect(normalizeKeyToken("plus")).toBe("+");
  });
});

describe("parseCombo", () => {
  it("parses a bare key", () => {
    expect(parseCombo("a", false)).toEqual({
      ctrl: false,
      shift: false,
      alt: false,
      meta: false,
      key: "a",
    });
  });

  it("parses modifier combinations, case-insensitively", () => {
    expect(parseCombo("Ctrl+Shift+P", false)).toEqual({
      ctrl: true,
      shift: true,
      alt: false,
      meta: false,
      key: "p",
    });
  });

  it("resolves mod to ctrl on non-Apple platforms", () => {
    expect(parseCombo("mod+k", false)).toMatchObject({
      ctrl: true,
      meta: false,
      key: "k",
    });
  });

  it("resolves mod to meta on Apple platforms", () => {
    expect(parseCombo("mod+k", true)).toMatchObject({
      ctrl: false,
      meta: true,
      key: "k",
    });
  });

  it("treats the last non-modifier token as the key", () => {
    expect(parseCombo("alt+option+j", false)).toMatchObject({
      alt: true,
      key: "j",
    });
  });

  it("handles the literal + key", () => {
    expect(parseCombo("ctrl++", false)).toMatchObject({ ctrl: true, key: "+" });
    expect(parseCombo("+", false)).toMatchObject({ key: "+" });
  });

  it("supports shift+? and other symbol keys", () => {
    expect(parseCombo("shift+?", false)).toMatchObject({
      shift: true,
      key: "?",
    });
  });

  it("maps cmd/command/win/super aliases to meta", () => {
    expect(parseCombo("cmd+k", false)).toMatchObject({ meta: true });
    expect(parseCombo("command+k", false)).toMatchObject({ meta: true });
    expect(parseCombo("win+k", false)).toMatchObject({ meta: true });
  });
});

describe("parseHotkey", () => {
  it("parses a single combo into a length-1 sequence", () => {
    const parsed = parseHotkey("mod+k", { mac: false });
    expect(parsed.raw).toBe("mod+k");
    expect(parsed.chords).toHaveLength(1);
    expect(parsed.chords[0]).toMatchObject({ ctrl: true, key: "k" });
  });

  it("parses a space-separated sequence into ordered combos", () => {
    const parsed = parseHotkey("g i", { mac: false });
    expect(parsed.chords).toHaveLength(2);
    expect(parsed.chords[0].key).toBe("g");
    expect(parsed.chords[1].key).toBe("i");
  });

  it("collapses extra whitespace between combos", () => {
    const parsed = parseHotkey("  g    g  ", { mac: false });
    expect(parsed.chords.map((c) => c.key)).toEqual(["g", "g"]);
  });

  it("falls back to platform detection when mac is omitted", () => {
    // navigator in jsdom is non-Apple by default, so mod -> ctrl.
    const parsed = parseHotkey("mod+k");
    expect(parsed.chords[0]).toMatchObject({ ctrl: true, meta: false });
  });
});

describe("chordMatches", () => {
  const ctrlK = parseCombo("ctrl+k", false);

  it("matches when modifiers and key are exactly equal", () => {
    expect(
      chordMatches(
        { ctrl: true, shift: false, alt: false, meta: false, key: "k" },
        ctrlK
      )
    ).toBe(true);
  });

  it("requires an exact modifier match (extra modifier fails)", () => {
    expect(
      chordMatches(
        { ctrl: true, shift: true, alt: false, meta: false, key: "k" },
        ctrlK
      )
    ).toBe(false);
  });

  it("fails when the key differs", () => {
    expect(
      chordMatches(
        { ctrl: true, shift: false, alt: false, meta: false, key: "j" },
        ctrlK
      )
    ).toBe(false);
  });

  it("never matches a modifier-only combo (empty key)", () => {
    const modifierOnly = parseCombo("ctrl", false);
    expect(
      chordMatches(
        { ctrl: true, shift: false, alt: false, meta: false, key: "" },
        modifierOnly
      )
    ).toBe(false);
  });
});

describe("eventToChord", () => {
  it("captures modifier state and lower-cased key", () => {
    const event = new KeyboardEvent("keydown", {
      key: "K",
      ctrlKey: true,
      shiftKey: true,
    });
    expect(eventToChord(event)).toEqual({
      ctrl: true,
      shift: true,
      alt: false,
      meta: false,
      key: "k",
    });
  });
});

describe("isEditableTarget", () => {
  it("returns true for input, textarea and select", () => {
    for (const tag of ["input", "textarea", "select"] as const) {
      expect(isEditableTarget(document.createElement(tag))).toBe(true);
    }
  });

  it("returns true for contenteditable elements", () => {
    const el = document.createElement("div");
    Object.defineProperty(el, "isContentEditable", {
      value: true,
      configurable: true,
    });
    expect(isEditableTarget(el)).toBe(true);
  });

  it("returns false for a plain div", () => {
    expect(isEditableTarget(document.createElement("div"))).toBe(false);
  });

  it("returns false for null and non-HTMLElement targets", () => {
    expect(isEditableTarget(null)).toBe(false);
    expect(isEditableTarget(document)).toBe(false);
  });
});
