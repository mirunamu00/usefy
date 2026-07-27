import { afterEach, describe, expect, it, vi } from "vitest";
import { loadImage, logoSafety } from "./logo";
import { QRExportError } from "../errors";
import { encodeQR } from "../encode/encodeQR";
import { EC_RECOVERY_RATIO } from "../encode/capacity";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("logoSafety", () => {
  const matrix = encodeQR("https://usefy.dev/packages/qr-code", { level: "H" });

  it("reports nothing occluded when there is no logo", () => {
    expect(logoSafety(matrix)).toEqual({
      occludedModules: 0,
      occludedRatio: 0,
      ecBudget: EC_RECOVERY_RATIO.H,
      safe: true,
      recommendedLevel: "H",
    });
  });

  it("scales occlusion with the logo's size", () => {
    const small = logoSafety(matrix, { logo: { src: "a", size: 0.1, padding: 0 } });
    const large = logoSafety(matrix, { logo: { src: "a", size: 0.3, padding: 0 } });
    expect(large.occludedModules).toBeGreaterThan(small.occludedModules);
    expect(large.occludedRatio).toBeGreaterThan(small.occludedRatio);
  });

  it("counts occlusion even when the logo does not excavate", () => {
    // Painting over a module hides it just as thoroughly as clearing it.
    const excavated = logoSafety(matrix, { logo: { src: "a", size: 0.2, excavate: true } });
    const painted = logoSafety(matrix, { logo: { src: "a", size: 0.2, excavate: false } });
    expect(painted.occludedModules).toBe(excavated.occludedModules);
    expect(painted.occludedModules).toBeGreaterThan(0);
  });

  it("counts the padding ring as occluded", () => {
    const bare = logoSafety(matrix, { logo: { src: "a", size: 0.2, padding: 0 } });
    const padded = logoSafety(matrix, { logo: { src: "a", size: 0.2, padding: 0.05 } });
    expect(padded.occludedModules).toBeGreaterThan(bare.occludedModules);
  });

  it("occludes less with a circular logo than a square one", () => {
    const square = logoSafety(matrix, { logo: { src: "a", size: 0.3, shape: "square" } });
    const circle = logoSafety(matrix, { logo: { src: "a", size: 0.3, shape: "circle" } });
    expect(circle.occludedModules).toBeLessThan(square.occludedModules);
  });

  it("compares against the level's recovery budget", () => {
    const value = "https://usefy.dev/packages/qr-code";
    const low = logoSafety(encodeQR(value, { level: "L" }), { logo: { src: "a", size: 0.3 } });
    const high = logoSafety(encodeQR(value, { level: "H" }), { logo: { src: "a", size: 0.1, padding: 0 } });

    expect(low.ecBudget).toBe(EC_RECOVERY_RATIO.L);
    expect(low.safe).toBe(false);
    expect(high.ecBudget).toBe(EC_RECOVERY_RATIO.H);
    expect(high.safe).toBe(true);
  });

  it("recommends the lowest level that would absorb the occlusion", () => {
    const value = "https://usefy.dev/packages/qr-code";
    // A logo too big for L, but within Q's budget.
    const safety = logoSafety(encodeQR(value, { level: "L" }), {
      logo: { src: "a", size: 0.4, padding: 0 },
    });
    expect(safety.safe).toBe(false);
    expect(safety.recommendedLevel).not.toBeNull();
    expect(EC_RECOVERY_RATIO[safety.recommendedLevel!]).toBeGreaterThanOrEqual(
      safety.occludedRatio,
    );
  });

  it("recommends nothing when no level could absorb the logo", () => {
    // `logo.size` is a fraction of the *padded* side, so a generous quiet zone
    // makes the same fraction swallow a small symbol whole.
    const tiny = encodeQR("A", { version: 1, level: "L" });
    const safety = logoSafety(tiny, { margin: 16, logo: { src: "a", size: 0.35, padding: 0.1 } });
    expect(safety.occludedRatio).toBeGreaterThan(EC_RECOVERY_RATIO.H);
    expect(safety.recommendedLevel).toBeNull();
    expect(safety.safe).toBe(false);
  });
});

describe("loadImage", () => {
  class FakeImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    crossOrigin: string | null = null;
    #src = "";
    set src(value: string) {
      this.#src = value;
      queueMicrotask(() => (value === "broken" ? this.onerror?.() : this.onload?.()));
    }
    get src(): string {
      return this.#src;
    }
  }

  it("resolves with the loaded image and forwards crossOrigin", async () => {
    vi.stubGlobal("Image", FakeImage);
    const image = (await loadImage("logo.png", "anonymous")) as unknown as FakeImage;
    expect(image.src).toBe("logo.png");
    expect(image.crossOrigin).toBe("anonymous");
  });

  it("rejects with an actionable error when the image fails", async () => {
    vi.stubGlobal("Image", FakeImage);
    await expect(loadImage("broken")).rejects.toBeInstanceOf(QRExportError);
    await expect(loadImage("broken")).rejects.toThrow(/Could not load the logo image/);
  });

  it("rejects outside a browser instead of hanging forever", async () => {
    vi.stubGlobal("Image", undefined);
    await expect(loadImage("logo.png")).rejects.toThrow(/browser environment/);
  });
});
