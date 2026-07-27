import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  resetWarnings,
  warnInvertedPolarity,
  warnLowContrast,
  warnModuleGap,
  warnQuietZone,
  warnScannability,
  warnUnsafeLogo,
} from "./warnings";
import { MAX_MODULE_GAP, MAX_SAFE_MODULE_GAP, MIN_SCANNABLE_CONTRAST } from "./style";
import { encodeQR } from "../encode/encodeQR";

const matrix = encodeQR("https://usefy.dev/packages/qr-code", { level: "L" });
const unsafeLogo = { logo: { src: "a", size: 0.35, padding: 0.05 } };

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  resetWarnings();
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("warnUnsafeLogo", () => {
  it("warns once per distinct problem, naming a remedy", () => {
    warnUnsafeLogo(matrix, unsafeLogo);
    warnUnsafeLogo(matrix, unsafeLogo);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toContain("@usefy/qr-code");
    expect(warn.mock.calls[0]![0]).toMatch(/level "[MQH]"|shrink the logo/);
  });

  it("says to shrink the logo when no level would rescue it", () => {
    warnUnsafeLogo(encodeQR("A", { version: 1, level: "L" }), {
      margin: 16,
      logo: { src: "a", size: 0.35, padding: 0.1 },
    });
    expect(warn.mock.calls[0]![0]).toContain("shrink the logo");
  });

  it("stays quiet for a safe logo, or no logo at all", () => {
    warnUnsafeLogo(encodeQR("USEFY", { level: "H" }), { logo: { src: "a", size: 0.1, padding: 0 } });
    warnUnsafeLogo(matrix, {});
    expect(warn).not.toHaveBeenCalled();
  });
});

describe("warnLowContrast", () => {
  it("warns when the foreground and background are too close together", () => {
    warnLowContrast({ fg: "#777777", bg: "#888888" });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toContain("contrast ratio");
    expect(warn.mock.calls[0]![0]).toContain(`${MIN_SCANNABLE_CONTRAST}:1`);
  });

  it("names the transparent background rather than printing null", () => {
    warnLowContrast({ fg: "#eeeeee", bg: null });
    expect(warn.mock.calls[0]![0]).toContain("transparent");
  });

  it("stays quiet for the defaults and any high-contrast pair", () => {
    warnLowContrast({});
    warnLowContrast({ fg: "#0f172a", bg: "#ffffff" });
    expect(warn).not.toHaveBeenCalled();
  });

  it("stays quiet rather than crying wolf about a colour it cannot parse", () => {
    warnLowContrast({ fg: "rebeccapurple", bg: "hsl(210 40% 8%)" });
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns once per distinct colour pair", () => {
    warnLowContrast({ fg: "#777777", bg: "#888888" });
    warnLowContrast({ fg: "#777777", bg: "#888888" });
    expect(warn).toHaveBeenCalledTimes(1);
    warnLowContrast({ fg: "#666666", bg: "#777777" });
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("catches a gradient that only goes pale at its far end", () => {
    // The first stop is pure black; judging by that alone would miss this.
    warnLowContrast({
      fg: {
        type: "linear",
        stops: [
          { offset: 0, color: "#000000" },
          { offset: 1, color: "#f5f5f5" },
        ],
      },
      bg: "#ffffff",
    });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toContain("#f5f5f5");
    expect(warn.mock.calls[0]![0]).toContain("gradient");
  });

  it("stays quiet for a gradient whose every stop is dark enough", () => {
    warnLowContrast({
      fg: {
        type: "linear",
        stops: [
          { offset: 0, color: "#7f1d1d" },
          { offset: 1, color: "#ea580c" },
        ],
      },
      bg: "#ffffff",
    });
    expect(warn).not.toHaveBeenCalled();
  });
});

describe("warnInvertedPolarity", () => {
  it("catches a light-on-dark code that the contrast check waves through", () => {
    // Contrast is symmetric: white-on-black scores a perfect 21:1 while being
    // exactly the polarity scanners are not specified for.
    warnLowContrast({ fg: "#ffffff", bg: "#000000" });
    expect(warn).not.toHaveBeenCalled();

    warnInvertedPolarity({ fg: "#ffffff", bg: "#000000" });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toContain("inverted");
  });

  it("stays quiet for the normal polarity and for unparseable colours", () => {
    warnInvertedPolarity({});
    warnInvertedPolarity({ fg: "#0f172a", bg: "#ffffff" });
    warnInvertedPolarity({ fg: "rebeccapurple", bg: "#000000" });
    expect(warn).not.toHaveBeenCalled();
  });

  it("catches a gradient that only turns pale at its far end", () => {
    // The first stop is nearly black; judging by that alone — the defect this
    // check shares with the contrast one — would miss the inverted majority.
    warnInvertedPolarity({
      fg: {
        type: "linear",
        stops: [
          { offset: 0, color: "#1e293b" },
          { offset: 1, color: "#ffffff" },
        ],
      },
      bg: "#000000",
    });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toContain("#ffffff");
    expect(warn.mock.calls[0]![0]).toContain("gradient");
  });

  it("stays quiet for a gradient that is dark all the way along", () => {
    warnInvertedPolarity({
      fg: {
        type: "linear",
        stops: [
          { offset: 0, color: "#1e293b" },
          { offset: 1, color: "#334155" },
        ],
      },
      bg: "#ffffff",
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it("cannot fire against a transparent background, which reads as white", () => {
    // Nothing is lighter than white, so this case is the contrast check's job:
    // white-on-transparent is invisible, not merely inverted.
    warnInvertedPolarity({ fg: "#ffffff", bg: null });
    expect(warn).not.toHaveBeenCalled();

    warnLowContrast({ fg: "#ffffff", bg: null });
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe("warnQuietZone", () => {
  it("warns below the four modules the specification requires", () => {
    warnQuietZone({ margin: 0 });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toContain("quiet zone");
  });

  it("stays quiet at the default and above", () => {
    warnQuietZone({});
    warnQuietZone({ margin: 4 });
    warnQuietZone({ margin: 8 });
    expect(warn).not.toHaveBeenCalled();
  });

  it("gets the singular right for a one-module zone", () => {
    warnQuietZone({ margin: 1 });
    expect(warn.mock.calls[0]![0]).toContain("1 module;");
  });
});

describe("warnModuleGap", () => {
  it("stays quiet within each shape's measured budget", () => {
    for (const [moduleShape, safe] of Object.entries(MAX_SAFE_MODULE_GAP)) {
      warnModuleGap({ moduleShape: moduleShape as never, moduleGap: safe });
    }
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns past it, naming the measured ceiling", () => {
    // Dots separate soonest — they disturb timing-pattern detection long
    // before inset squares do.
    warnModuleGap({ moduleShape: "dot", moduleGap: 0.2 });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toContain(`up to ${MAX_SAFE_MODULE_GAP.dot}`);
    expect(warn.mock.calls[0]![0]).toContain('"square"');
  });

  it("warns for square modules too, at the top of the clamped range", () => {
    // Square has the widest budget, but not an unlimited one — and if its
    // ceiling equalled the hard clamp the warning could never fire at all.
    expect(MAX_SAFE_MODULE_GAP.square).toBeLessThan(MAX_MODULE_GAP);
    warnModuleGap({ moduleShape: "square", moduleGap: MAX_MODULE_GAP });
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("warns separately per shape", () => {
    warnModuleGap({ moduleShape: "dot", moduleGap: 0.3 });
    warnModuleGap({ moduleShape: "rounded", moduleGap: 0.3 });
    expect(warn).toHaveBeenCalledTimes(2);
  });
});

describe("warnScannability", () => {
  it("runs every check", () => {
    warnScannability(matrix, {
      ...unsafeLogo,
      fg: "#777777",
      bg: "#888888",
      margin: 0,
      moduleShape: "dot",
      moduleGap: 0.3,
    });
    // logo + contrast + quiet zone + module gap (polarity does not apply here).
    expect(warn).toHaveBeenCalledTimes(4);
  });

  it("stays completely silent in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    warnScannability(matrix, { ...unsafeLogo, fg: "#777777", bg: "#888888" });
    expect(warn).not.toHaveBeenCalled();
  });

  it("does not crash where `process` is undefined", () => {
    vi.stubGlobal("process", undefined);
    expect(() => warnScannability(matrix, unsafeLogo)).not.toThrow();
    expect(warn).toHaveBeenCalled();
  });
});
