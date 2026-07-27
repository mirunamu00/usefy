import { describe, expect, it } from "vitest";
import {
  MAX_LOGO_SIZE,
  MAX_MODULE_GAP,
  lightestForeground,
  resolveStyle,
  styleContrast,
  worstContrast,
} from "./style";
import { DEFAULT_BG, DEFAULT_FG } from "./color";

describe("resolveStyle", () => {
  it("applies the documented defaults", () => {
    expect(resolveStyle()).toEqual({
      margin: 4,
      fg: DEFAULT_FG,
      fgGradient: null,
      bg: DEFAULT_BG,
      moduleShape: "square",
      eyeShape: "square",
      eyeOuter: null,
      eyeInner: null,
      moduleGap: 0,
      logo: null,
    });
  });

  it("neutralizes NaN, Infinity and non-numbers on every numeric option", () => {
    // Non-finite input is a caller bug, not an intent to max out the option —
    // so it falls back to the *default*, not to the clamp boundary.
    const style = resolveStyle({
      margin: NaN,
      moduleGap: Infinity,
      logo: { src: "x.png", size: NaN, padding: -Infinity },
    });
    expect(style.margin).toBe(4);
    expect(style.moduleGap).toBe(0);
    expect(style.logo).toMatchObject({ size: 0.2, padding: 0.02 });

    const nonNumbers = resolveStyle({ margin: "8" as never, moduleGap: null as never });
    expect(nonNumbers.margin).toBe(4);
    expect(nonNumbers.moduleGap).toBe(0);
  });

  it("clamps values to their documented ranges", () => {
    expect(resolveStyle({ margin: -5 }).margin).toBe(0);
    expect(resolveStyle({ margin: 1000 }).margin).toBe(64);
    expect(resolveStyle({ margin: 2.6 }).margin).toBe(3);
    expect(resolveStyle({ moduleGap: 5 }).moduleGap).toBe(MAX_MODULE_GAP);
    expect(resolveStyle({ moduleGap: -1 }).moduleGap).toBe(0);
    expect(resolveStyle({ logo: { src: "x", size: 0.9 } }).logo!.size).toBe(MAX_LOGO_SIZE);
  });

  it("falls back on unknown shape names instead of rendering nothing", () => {
    expect(resolveStyle({ moduleShape: "hexagon" as never }).moduleShape).toBe("square");
    expect(resolveStyle({ eyeShape: "star" as never }).eyeShape).toBe("square");
  });

  it("sanitizes colours once, so every renderer sees the same values", () => {
    const style = resolveStyle({
      fg: 'red"/><script>',
      bg: "url(#leak)",
      eyeColor: { outer: "#22c55e", inner: 'blue"/>' },
    });
    expect(style.fg).toBe(DEFAULT_FG);
    expect(style.bg).toBeNull();
    expect(style.eyeOuter).toBe("#22c55e");
    expect(style.eyeInner).toBeNull();
  });

  it("treats an explicit null background as transparent", () => {
    expect(resolveStyle({ bg: null }).bg).toBeNull();
  });

  describe("gradients", () => {
    it("keeps a valid gradient and clamps its stop offsets", () => {
      const style = resolveStyle({
        fg: {
          type: "linear",
          rotation: 45,
          stops: [
            { offset: -1, color: "#6366f1" },
            { offset: 9, color: "#ec4899" },
          ],
        },
      });
      expect(style.fgGradient).toEqual({
        type: "linear",
        rotation: 45,
        stops: [
          { offset: 0, color: "#6366f1" },
          { offset: 1, color: "#ec4899" },
        ],
      });
      // The first stop doubles as the solid fallback for contrast checks.
      expect(style.fg).toBe("#6366f1");
    });

    it("drops unsafe stops, and the whole gradient if fewer than two survive", () => {
      const style = resolveStyle({
        fg: {
          type: "linear",
          stops: [
            { offset: 0, color: "url(#x)" },
            { offset: 1, color: "#ec4899" },
          ],
        },
      });
      // One stop is not a gradient — fall back to a solid, visible colour.
      expect(style.fgGradient).toBeNull();
      expect(style.fg).toBe(DEFAULT_FG);
    });

    it("normalizes an unknown gradient type to linear", () => {
      const style = resolveStyle({
        fg: {
          type: "conic" as never,
          stops: [
            { offset: 0, color: "#000" },
            { offset: 1, color: "#fff" },
          ],
        },
      });
      expect(style.fgGradient!.type).toBe("linear");
    });
  });

  describe("logo", () => {
    it("defaults to a 20% excavated square with a small quiet ring", () => {
      expect(resolveStyle({ logo: { src: "logo.svg" } }).logo).toEqual({
        src: "logo.svg",
        size: 0.2,
        excavate: true,
        padding: 0.02,
        shape: "square",
      });
    });

    it("carries crossOrigin only when set", () => {
      expect(resolveStyle({ logo: { src: "a" } }).logo).not.toHaveProperty("crossOrigin");
      expect(resolveStyle({ logo: { src: "a", crossOrigin: "anonymous" } }).logo).toHaveProperty(
        "crossOrigin",
        "anonymous",
      );
    });

    it("ignores a logo with no usable source", () => {
      expect(resolveStyle({ logo: { src: "" } }).logo).toBeNull();
      expect(resolveStyle({ logo: { src: 42 as never } }).logo).toBeNull();
    });

    it("honours excavate: false", () => {
      expect(resolveStyle({ logo: { src: "a", excavate: false } }).logo!.excavate).toBe(false);
    });
  });
});

describe("styleContrast / worstContrast", () => {
  it("measures the resolved foreground against the resolved background", () => {
    expect(styleContrast(resolveStyle())).toBeCloseTo(21, 5);
    expect(styleContrast(resolveStyle({ fg: "#777777", bg: "#777777" }))).toBeCloseTo(1, 5);
  });

  it("treats a transparent background as white, the usual page colour", () => {
    expect(styleContrast(resolveStyle({ bg: null }))).toBeCloseTo(21, 5);
  });

  it("returns null when a colour cannot be parsed", () => {
    expect(styleContrast(resolveStyle({ fg: "rebeccapurple" }))).toBeNull();
  });

  it("judges a gradient by its worst stop, not its first", () => {
    // A gradient can start legible and end unreadable; scoring only the first
    // stop would wave through exactly the codes most likely to fail.
    const style = resolveStyle({
      fg: {
        type: "linear",
        stops: [
          { offset: 0, color: "#000000" },
          { offset: 1, color: "#f5f5f5" },
        ],
      },
      bg: "#ffffff",
    });
    const worst = worstContrast(style)!;
    expect(worst.color).toBe("#f5f5f5");
    expect(worst.ratio).toBeLessThan(2);
    // …while `fg` still reports the representative colour used as a fallback.
    expect(style.fg).toBe("#000000");
  });

  it("skips gradient stops it cannot parse rather than discarding the check", () => {
    const style = resolveStyle({
      fg: {
        type: "linear",
        stops: [
          { offset: 0, color: "rebeccapurple" },
          { offset: 1, color: "#f5f5f5" },
        ],
      },
      bg: "#ffffff",
    });
    expect(worstContrast(style)!.color).toBe("#f5f5f5");
  });

  it("returns null when no colour at all could be parsed", () => {
    const style = resolveStyle({
      fg: {
        type: "linear",
        stops: [
          { offset: 0, color: "rebeccapurple" },
          { offset: 1, color: "hsl(210 40% 8%)" },
        ],
      },
    });
    expect(worstContrast(style)).toBeNull();
    expect(styleContrast(style)).toBeNull();
  });
});

describe("lightestForeground", () => {
  it("reports the solid foreground when there is no gradient", () => {
    expect(lightestForeground(resolveStyle({ fg: "#0f172a" }))).toEqual({
      color: "#0f172a",
      luminance: expect.any(Number),
    });
  });

  it("reports a gradient's lightest stop, not its first", () => {
    // Polarity has the same trap as contrast: a gradient can start dark and
    // end pale, and it is the pale end a scanner loses on a light background.
    const style = resolveStyle({
      fg: {
        type: "linear",
        stops: [
          { offset: 0, color: "#1e293b" },
          { offset: 1, color: "#ffffff" },
        ],
      },
    });
    expect(lightestForeground(style)!.color).toBe("#ffffff");
    expect(style.fg).toBe("#1e293b");
  });

  it("skips stops it cannot parse, and returns null when none parse", () => {
    const partial = resolveStyle({
      fg: {
        type: "linear",
        stops: [
          { offset: 0, color: "rebeccapurple" },
          { offset: 1, color: "#ffffff" },
        ],
      },
    });
    expect(lightestForeground(partial)!.color).toBe("#ffffff");

    const none = resolveStyle({ fg: "rebeccapurple" });
    expect(lightestForeground(none)).toBeNull();
  });
});
