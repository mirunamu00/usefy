import { afterEach, describe, expect, it, vi } from "vitest";
import { getScrollbarWidth, isBrowser, isIOS } from "./utils";

/** Define a configurable numeric property on an object (e.g. innerWidth). */
function defineNumber(obj: object, key: string, value: number): void {
  Object.defineProperty(obj, key, { value, configurable: true });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isBrowser", () => {
  it("returns true in a jsdom (browser-like) environment", () => {
    expect(isBrowser()).toBe(true);
  });

  it("returns false when window is undefined (SSR)", () => {
    vi.stubGlobal("window", undefined);
    expect(isBrowser()).toBe(false);
  });
});

describe("isIOS", () => {
  it("returns false for a non-iOS user agent (default jsdom)", () => {
    expect(isIOS()).toBe(false);
  });

  it("returns true for an iPhone user agent", () => {
    vi.stubGlobal("navigator", {
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
      platform: "iPhone",
      maxTouchPoints: 5,
    });
    expect(isIOS()).toBe(true);
  });

  it("returns true for an iPad / iPod user agent", () => {
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)",
      platform: "iPad",
      maxTouchPoints: 5,
    });
    expect(isIOS()).toBe(true);
  });

  it("returns true for iPadOS 13+ masquerading as MacIntel with touch points", () => {
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      platform: "MacIntel",
      maxTouchPoints: 5,
    });
    expect(isIOS()).toBe(true);
  });

  it("returns false for a real desktop Mac (MacIntel without touch)", () => {
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      platform: "MacIntel",
      maxTouchPoints: 0,
    });
    expect(isIOS()).toBe(false);
  });

  it("tolerates a missing userAgent / maxTouchPoints", () => {
    vi.stubGlobal("navigator", { platform: "MacIntel" });
    expect(isIOS()).toBe(false);
  });

  it("returns false when navigator is absent", () => {
    vi.stubGlobal("navigator", undefined);
    expect(isIOS()).toBe(false);
  });

  it("returns false on the server (no window)", () => {
    vi.stubGlobal("window", undefined);
    expect(isIOS()).toBe(false);
  });
});

describe("getScrollbarWidth", () => {
  it("returns innerWidth minus documentElement.clientWidth", () => {
    defineNumber(window, "innerWidth", 1024);
    defineNumber(document.documentElement, "clientWidth", 1009);
    expect(getScrollbarWidth()).toBe(15);
  });

  it("returns 0 when there is no scrollbar", () => {
    defineNumber(window, "innerWidth", 1024);
    defineNumber(document.documentElement, "clientWidth", 1024);
    expect(getScrollbarWidth()).toBe(0);
  });

  it("returns 0 on the server (no window)", () => {
    vi.stubGlobal("window", undefined);
    expect(getScrollbarWidth()).toBe(0);
  });
});
