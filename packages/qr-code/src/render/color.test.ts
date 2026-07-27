import { describe, expect, it } from "vitest";
import {
  DEFAULT_FG,
  contrastRatio,
  escapeXml,
  fmt,
  isSafeCssColor,
  relativeLuminance,
  sanitizeBackground,
  sanitizeColor,
} from "./color";

describe("isSafeCssColor", () => {
  it("accepts the colour notations a consumer actually writes", () => {
    for (const color of [
      "#000",
      "#0f172a",
      "#0f172aff",
      "rgb(15, 23, 42)",
      "rgba(15 23 42 / 80%)",
      "hsl(210 40% 8%)",
      "rebeccapurple",
      "currentColor",
    ]) {
      expect(isSafeCssColor(color)).toBe(true);
    }
  });

  it("rejects anything XML-active or non-string", () => {
    for (const color of ['red"/><script>alert(1)</script>', "red'", "<svg>", "a&b", 42, null, undefined, ""]) {
      expect(isSafeCssColor(color)).toBe(false);
    }
  });

  it("rejects paint-server references, which would leak on render", () => {
    expect(isSafeCssColor("url(#gradient)")).toBe(false);
    expect(isSafeCssColor("url(//evil.example/beacon.svg#g)")).toBe(false);
    expect(isSafeCssColor("URL ( #x )")).toBe(false);
  });
});

describe("sanitizeColor / sanitizeBackground", () => {
  it("replaces an unsafe foreground with a visible default", () => {
    expect(sanitizeColor("#123456")).toBe("#123456");
    expect(sanitizeColor("url(#x)")).toBe(DEFAULT_FG);
    expect(sanitizeColor(undefined, "#abcdef")).toBe("#abcdef");
  });

  it("omits an unsafe background rather than substituting one", () => {
    // Substituting could paint dark-on-dark; transparent always stays legible.
    expect(sanitizeBackground("#ffffff")).toBe("#ffffff");
    expect(sanitizeBackground("url(#x)")).toBeNull();
    expect(sanitizeBackground(null)).toBeNull();
    expect(sanitizeBackground(undefined)).toBeNull();
  });
});

describe("escapeXml", () => {
  it("escapes every XML-active character", () => {
    expect(escapeXml(`<a href="x" id='y'>&</a>`)).toBe(
      "&lt;a href=&quot;x&quot; id=&apos;y&apos;&gt;&amp;&lt;/a&gt;",
    );
  });
});

describe("fmt", () => {
  it("rounds to three decimals and normalizes negative zero", () => {
    expect(fmt(1)).toBe("1");
    expect(fmt(1.23456)).toBe("1.235");
    expect(fmt(-0)).toBe("0");
    expect(fmt(-0.0001)).toBe("0");
    expect(fmt(-1.5)).toBe("-1.5");
  });
});

describe("relativeLuminance / contrastRatio", () => {
  it("computes the endpoints of the luminance scale", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBe(1);
  });

  it("parses shorthand hex, 8-digit hex and rgb()", () => {
    expect(relativeLuminance("#fff")).toBe(1);
    expect(relativeLuminance("#ffff")).toBe(1);
    expect(relativeLuminance("#ffffffff")).toBe(1);
    expect(relativeLuminance("rgb(255, 255, 255)")).toBe(1);
    expect(relativeLuminance("rgba(255 255 255 / 50%)")).toBe(1);
    expect(relativeLuminance("rgb(100%, 100%, 100%)")).toBe(1);
  });

  it("returns null for formats it cannot parse, instead of guessing", () => {
    // A wrong guess would produce false "unscannable contrast" warnings.
    expect(relativeLuminance("rebeccapurple")).toBeNull();
    expect(relativeLuminance("hsl(210 40% 8%)")).toBeNull();
    expect(relativeLuminance("#12345")).toBeNull();
    expect(relativeLuminance("rgb(1, 2)")).toBeNull();
    expect(relativeLuminance("rgb(a, b, c)")).toBeNull();
  });

  it("reports the WCAG ratio, and null when either side is unparseable", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
    expect(contrastRatio("#777777", "#777777")).toBeCloseTo(1, 5);
    expect(contrastRatio("rebeccapurple", "#ffffff")).toBeNull();
  });
});
