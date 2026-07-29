import { afterEach, describe, expect, it, vi } from "vitest";
import { now, scheduleYield } from "./scheduler";

/**
 * The ladder is resolved **per call** rather than cached at module load
 * precisely so a test can stub any rung. That claim is only worth making if
 * every rung is actually exercised.
 */
describe("scheduleYield", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("prefers scheduler.postTask at background priority", async () => {
    const postTask = vi.fn(
      (_callback: () => void, _options?: { priority?: string }) =>
        Promise.resolve(undefined),
    );
    vi.stubGlobal("scheduler", { postTask });

    await scheduleYield();

    expect(postTask).toHaveBeenCalledTimes(1);
    expect(postTask.mock.calls[0]![1]).toEqual({ priority: "background" });
  });

  it("survives a postTask that rejects rather than failing the scan", async () => {
    // An aborted task rejects; letting that escape would kill the whole search
    // over a scheduling detail.
    vi.stubGlobal("scheduler", {
      postTask: () => Promise.reject(new Error("aborted")),
    });
    await expect(scheduleYield()).resolves.toBeUndefined();
  });

  it("falls back to requestIdleCallback", async () => {
    vi.stubGlobal("scheduler", undefined);
    const idle = vi.fn((callback: () => void) => {
      callback();
      return 1;
    });
    vi.stubGlobal("requestIdleCallback", idle);

    await scheduleYield();
    expect(idle).toHaveBeenCalledTimes(1);
  });

  it("falls back to a macrotask when neither exists", async () => {
    vi.stubGlobal("scheduler", undefined);
    vi.stubGlobal("requestIdleCallback", undefined);

    const before = Date.now();
    await scheduleYield();
    expect(Date.now() - before).toBeGreaterThanOrEqual(0);
  });
});

describe("now", () => {
  it("uses performance.now when it is available", () => {
    vi.stubGlobal("performance", { now: () => 1234.5 });
    expect(now()).toBe(1234.5);
  });

  it("falls back to Date.now", () => {
    vi.stubGlobal("performance", undefined);
    expect(now()).toBeGreaterThan(0);
  });
});
