import { describe, it, expect, vi, afterEach } from "vitest";
import {
  isTourDone,
  readTourState,
  writeTourState,
  TOUR_STORAGE_PREFIX,
} from "./persistence";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("persistence", () => {
  it("round-trips a versioned state through write/read", () => {
    writeTourState("demo", "finished");
    const state = readTourState("demo");
    expect(state).not.toBeNull();
    expect(state!.v).toBe(1);
    expect(state!.status).toBe("finished");
    expect(() => new Date(state!.at).toISOString()).not.toThrow();
    expect(new Date(state!.at).toISOString()).toBe(state!.at); // real ISO

    writeTourState("demo", "skipped");
    expect(readTourState("demo")!.status).toBe("skipped");
  });

  it("uses the usefy-tour: key format shared with resetTour", () => {
    writeTourState("abc", "finished");
    expect(window.localStorage.getItem(`${TOUR_STORAGE_PREFIX}abc`)).not.toBeNull();
  });

  it("isTourDone is presence-based: corrupt and legacy values still count as done", () => {
    expect(isTourDone("nope")).toBe(false);
    window.localStorage.setItem(`${TOUR_STORAGE_PREFIX}corrupt`, "{{{not json");
    window.localStorage.setItem(`${TOUR_STORAGE_PREFIX}legacy`, '"done"');
    expect(isTourDone("corrupt")).toBe(true);
    expect(isTourDone("legacy")).toBe(true);
  });

  it("readTourState returns null for absent, corrupt, and unknown-format values", () => {
    expect(readTourState("absent")).toBeNull();
    window.localStorage.setItem(`${TOUR_STORAGE_PREFIX}corrupt`, "{{{not json");
    expect(readTourState("corrupt")).toBeNull();
    window.localStorage.setItem(
      `${TOUR_STORAGE_PREFIX}future`,
      JSON.stringify({ v: 99, status: "finished" })
    );
    expect(readTourState("future")).toBeNull();
    window.localStorage.setItem(`${TOUR_STORAGE_PREFIX}legacy`, '"done"');
    expect(readTourState("legacy")).toBeNull();
  });

  it("silently no-ops when storage throws (privacy mode)", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(() => writeTourState("x", "finished")).not.toThrow();
    expect(isTourDone("x")).toBe(false);
    expect(readTourState("x")).toBeNull();
  });
});
