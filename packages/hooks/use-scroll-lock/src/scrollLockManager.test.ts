import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the pure platform helpers so the manager tests can drive the iOS branch
// and a deterministic scrollbar width. `isBrowser` stays real.
vi.mock("./utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./utils")>();
  return {
    ...actual,
    isIOS: vi.fn(() => false),
    getScrollbarWidth: vi.fn(() => 15),
  };
});

import * as utils from "./utils";
import {
  getScrollLockCount,
  lockBodyScroll,
  resetScrollLockState,
  unlockBodyScroll,
} from "./scrollLockManager";

const isIOS = vi.mocked(utils.isIOS);
const getScrollbarWidth = vi.mocked(utils.getScrollbarWidth);

/** Define a configurable numeric property on an object. */
function defineNumber(obj: object, key: string, value: number): void {
  Object.defineProperty(obj, key, { value, configurable: true });
}

beforeEach(() => {
  resetScrollLockState();
  document.body.style.cssText = "";
  isIOS.mockReturnValue(false);
  getScrollbarWidth.mockReturnValue(15);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("scrollLockManager — non-iOS", () => {
  it("starts with a zero lock count", () => {
    expect(getScrollLockCount()).toBe(0);
  });

  it("applies overflow:hidden and scrollbar-width padding on the first lock", () => {
    lockBodyScroll();

    expect(getScrollLockCount()).toBe(1);
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.body.style.paddingRight).toBe("15px");
  });

  it("does not add padding when there is no scrollbar", () => {
    getScrollbarWidth.mockReturnValue(0);
    lockBodyScroll();

    expect(document.body.style.overflow).toBe("hidden");
    expect(document.body.style.paddingRight).toBe("");
  });

  it("restores the body only when the last lock is released", () => {
    lockBodyScroll();
    lockBodyScroll();
    expect(getScrollLockCount()).toBe(2);
    expect(document.body.style.overflow).toBe("hidden");

    unlockBodyScroll();
    expect(getScrollLockCount()).toBe(1);
    // Still locked — another holder remains.
    expect(document.body.style.overflow).toBe("hidden");

    unlockBodyScroll();
    expect(getScrollLockCount()).toBe(0);
    expect(document.body.style.overflow).toBe("");
    expect(document.body.style.paddingRight).toBe("");
  });

  it("preserves pre-existing inline body styles across a lock/unlock cycle", () => {
    document.body.style.overflow = "scroll";
    document.body.style.paddingRight = "8px";

    lockBodyScroll();
    expect(document.body.style.overflow).toBe("hidden");

    unlockBodyScroll();
    expect(document.body.style.overflow).toBe("scroll");
    expect(document.body.style.paddingRight).toBe("8px");
  });

  it("only applies the body styles once for nested locks", () => {
    getScrollbarWidth.mockClear();
    lockBodyScroll();
    lockBodyScroll();
    lockBodyScroll();
    // applyBodyLock (which reads the scrollbar width) ran exactly once — on
    // 0 -> 1 — not once per lock.
    expect(getScrollbarWidth).toHaveBeenCalledTimes(1);
  });

  it("ignores an unlock when nothing is locked (never goes negative)", () => {
    unlockBodyScroll();
    expect(getScrollLockCount()).toBe(0);
    expect(document.body.style.overflow).toBe("");
  });

  it("does not restore scroll position on non-iOS unlock", () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);
    lockBodyScroll();
    unlockBodyScroll();
    expect(scrollTo).not.toHaveBeenCalled();
  });
});

describe("scrollLockManager — iOS", () => {
  beforeEach(() => {
    isIOS.mockReturnValue(true);
    defineNumber(window, "scrollX", 40);
    defineNumber(window, "scrollY", 240);
  });

  it("pins the body with position:fixed offset by the current scroll", () => {
    lockBodyScroll();

    expect(document.body.style.position).toBe("fixed");
    expect(document.body.style.top).toBe("-240px");
    expect(document.body.style.left).toBe("-40px");
    expect(document.body.style.width).toBe("100%");
    expect(document.body.style.overflow).toBe("hidden");
    // iOS uses position:fixed, not scrollbar padding.
    expect(document.body.style.paddingRight).toBe("");
  });

  it("restores the scroll position with scrollTo on unlock", () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);

    lockBodyScroll();
    unlockBodyScroll();

    expect(scrollTo).toHaveBeenCalledWith(40, 240);
    expect(document.body.style.position).toBe("");
    expect(document.body.style.top).toBe("");
    expect(document.body.style.width).toBe("");
  });
});

describe("scrollLockManager — SSR", () => {
  it("does not touch the DOM or throw when window is undefined", () => {
    vi.stubGlobal("window", undefined);
    expect(() => {
      lockBodyScroll();
      unlockBodyScroll();
    }).not.toThrow();
  });
});
