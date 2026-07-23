import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  runPreset,
  celebration,
  fireworks,
  sideCannons,
  pride,
  stars,
  snow,
  rain,
  type Preset,
  type PresetTarget,
} from "./presets";
import { resolveFireOptions } from "./types";
import type { EmitHandle } from "./types";

function mockTarget() {
  const handles: Array<EmitHandle & { stop: ReturnType<typeof vi.fn> }> = [];
  const target: PresetTarget & {
    fire: ReturnType<typeof vi.fn>;
    emit: ReturnType<typeof vi.fn>;
    handles: typeof handles;
  } = {
    fire: vi.fn(() => Promise.resolve()),
    emit: vi.fn(() => {
      const handle = { stop: vi.fn(), active: true };
      handles.push(handle);
      return handle;
    }),
    handles,
  };
  return target;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("preset data — immutability", () => {
  it("presets are deep-frozen: mutation throws instead of corrupting shared state", () => {
    if (stars.type !== "burst") throw new Error("expected burst preset");
    const options = stars.bursts[0].options;
    expect(Object.isFrozen(stars)).toBe(true);
    expect(Object.isFrozen(stars.bursts)).toBe(true);
    expect(Object.isFrozen(options)).toBe(true);
    expect(Object.isFrozen(options.colors)).toBe(true);
    expect(() => {
      (options.colors as string[]).push("#bad");
    }).toThrow(TypeError);
    expect(() => {
      (options as { count?: number }).count = 9999;
    }).toThrow(TypeError);
    if (snow.type !== "emit") throw new Error("expected emit preset");
    expect(Object.isFrozen(snow.emitters[0].options.origin)).toBe(true);
  });

  it("resolveFireOptions works on frozen preset input (and still returns fresh copies)", () => {
    if (stars.type !== "burst") throw new Error("expected burst preset");
    const resolved = resolveFireOptions(stars.bursts[0].options);
    expect(resolved.shapes).toContain("star");
    expect(Object.isFrozen(resolved.colors)).toBe(false); // fresh, caller-owned
    expect(resolved.colors).not.toBe(stars.bursts[0].options.colors);
  });
});

describe("preset data", () => {
  it("every preset resolves cleanly through resolveFireOptions (valid FireOptions)", () => {
    const all: Preset[] = [celebration, fireworks, sideCannons, pride, stars, snow, rain];
    for (const preset of all) {
      if (preset.type === "burst") {
        expect(preset.bursts.length).toBeGreaterThan(0);
        for (const burst of preset.bursts) {
          expect(burst.delayMs).toBeGreaterThanOrEqual(0);
          expect(() => resolveFireOptions(burst.options)).not.toThrow();
          expect(resolveFireOptions(burst.options).count).toBeGreaterThan(0);
        }
      } else {
        expect(preset.emitters.length).toBeGreaterThan(0);
        for (const emitter of preset.emitters) {
          expect(() => resolveFireOptions(emitter.options)).not.toThrow();
          expect(emitter.options.particlesPerSecond).toBeGreaterThan(0);
        }
      }
    }
  });

  it("celebration is a double side burst (two immediate, two delayed)", () => {
    expect(celebration.type).toBe("burst");
    if (celebration.type !== "burst") return;
    const immediate = celebration.bursts.filter((b) => b.delayMs === 0);
    expect(immediate).toHaveLength(2);
    expect(immediate[0].options.origin!.x).toBeLessThan(0.5); // left…
    expect(immediate[1].options.origin!.x).toBeGreaterThan(0.5); // …and right
  });

  it("fireworks staggers three center bursts", () => {
    if (fireworks.type !== "burst") throw new Error("expected burst preset");
    expect(fireworks.bursts.map((b) => b.delayMs)).toEqual([0, 350, 700]);
    for (const burst of fireworks.bursts) {
      expect(burst.options.spread).toBe(360);
    }
  });

  it("stars is a gold star burst", () => {
    if (stars.type !== "burst") throw new Error("expected burst preset");
    expect(stars.bursts[0].options.shapes).toContain("star");
    expect(stars.bursts[0].options.colors![0]).toMatch(/^#f|#ff/i);
  });

  it("sideCannons and pride are time-limited 2-origin emitters", () => {
    for (const preset of [sideCannons, pride]) {
      if (preset.type !== "emit") throw new Error("expected emit preset");
      expect(preset.emitters).toHaveLength(2);
      for (const emitter of preset.emitters) {
        expect(emitter.durationMs).toBeGreaterThan(0);
      }
      const [left, right] = preset.emitters;
      expect(left.options.origin!.x).toBe(0);
      expect(right.options.origin!.x).toBe(1);
    }
  });

  it("snow and rain emit downward across the full canvas width (originJitter)", () => {
    for (const preset of [snow, rain]) {
      if (preset.type !== "emit") throw new Error("expected emit preset");
      const options = preset.emitters[0].options;
      expect(options.originJitter?.x).toBe(1); // full-width spawns, not a point source
      expect(options.origin!.y).toBeLessThan(0); // just above the canvas
      expect(options.angle).toBe(-90); // falling
      expect(preset.emitters[0].durationMs).toBeUndefined(); // indefinite
    }
  });
});

describe("runPreset — burst sequencing", () => {
  it("fires immediate bursts synchronously and delayed ones on schedule", async () => {
    const target = mockTarget();
    const run = runPreset(target, celebration);
    expect(target.fire).toHaveBeenCalledTimes(2); // the two delayMs: 0 bursts

    vi.advanceTimersByTime(249);
    expect(target.fire).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(1);
    expect(target.fire).toHaveBeenCalledTimes(4); // the two 250ms bursts

    await expect(run.done).resolves.toBeUndefined();
  });

  it("fireworks fire at 0 / 350 / 700 ms", () => {
    const target = mockTarget();
    runPreset(target, fireworks);
    expect(target.fire).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(350);
    expect(target.fire).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(350);
    expect(target.fire).toHaveBeenCalledTimes(3);
    // Fired with the preset's own options.
    if (fireworks.type === "burst") {
      expect(target.fire).toHaveBeenNthCalledWith(2, fireworks.bursts[1].options);
    }
  });

  it("cancel() skips not-yet-fired bursts and still resolves done", async () => {
    const target = mockTarget();
    const run = runPreset(target, fireworks);
    vi.advanceTimersByTime(400); // bursts 1 and 2 fired
    expect(target.fire).toHaveBeenCalledTimes(2);

    run.cancel();
    vi.advanceTimersByTime(10_000);
    expect(target.fire).toHaveBeenCalledTimes(2); // burst 3 never fires
    await expect(run.done).resolves.toBeUndefined();

    run.cancel(); // idempotent
  });

  it("done waits for the in-flight fire promises (cohort death), not just scheduling", async () => {
    const target = mockTarget();
    let resolveBurst!: () => void;
    target.fire.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveBurst = resolve;
      }),
    );
    const preset: Preset = {
      type: "burst",
      bursts: [{ delayMs: 0, options: { count: 5 } }],
    };
    const run = runPreset(target, preset);

    let settled = false;
    void run.done.then(() => (settled = true));
    await Promise.resolve();
    expect(settled).toBe(false); // burst still flying

    resolveBurst();
    await Promise.resolve();
    await Promise.resolve();
    expect(settled).toBe(true);
  });

  it("an empty burst preset resolves immediately", async () => {
    const run = runPreset(mockTarget(), { type: "burst", bursts: [] });
    await expect(run.done).resolves.toBeUndefined();
  });

  it("a rejecting fire() still settles done (errors don't wedge the run)", async () => {
    const target = mockTarget();
    target.fire.mockReturnValue(Promise.reject(new Error("boom")));
    const run = runPreset(target, {
      type: "burst",
      bursts: [{ delayMs: 0, options: {} }],
    });
    await expect(run.done).resolves.toBeUndefined();
  });

  it("a synchronously-throwing fire() still settles done — immediate and delayed bursts", async () => {
    const target = mockTarget();
    target.fire.mockImplementation(() => {
      throw new Error("sync boom");
    });
    const run = runPreset(target, {
      type: "burst",
      bursts: [
        { delayMs: 0, options: {} }, // throws synchronously in runPreset itself
        { delayMs: 100, options: {} }, // throws synchronously inside the timer
      ],
    });
    vi.advanceTimersByTime(100);
    expect(target.fire).toHaveBeenCalledTimes(2);
    await expect(run.done).resolves.toBeUndefined(); // never forever-pending
  });
});

describe("runPreset — emitter lifecycles", () => {
  it("starts all emitters at once and stops the timed ones on schedule", async () => {
    const target = mockTarget();
    const run = runPreset(target, sideCannons);
    expect(target.emit).toHaveBeenCalledTimes(2);
    expect(target.handles[0].stop).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2000);
    expect(target.handles[0].stop).toHaveBeenCalledTimes(1);
    expect(target.handles[1].stop).toHaveBeenCalledTimes(1);
    await expect(run.done).resolves.toBeUndefined();
  });

  it("indefinite emitters (snow): done resolves immediately, cancel() is the off-switch", async () => {
    const target = mockTarget();
    const run = runPreset(target, snow);
    expect(target.emit).toHaveBeenCalledTimes(1);
    await expect(run.done).resolves.toBeUndefined(); // nothing timed to wait for

    run.cancel();
    expect(target.handles[0].stop).toHaveBeenCalledTimes(1);
  });

  it("cancel() stops timed emitters early and settles done", async () => {
    const target = mockTarget();
    const run = runPreset(target, pride);
    vi.advanceTimersByTime(500); // mid-run
    run.cancel();
    expect(target.handles[0].stop).toHaveBeenCalledTimes(1);
    expect(target.handles[1].stop).toHaveBeenCalledTimes(1);
    await expect(run.done).resolves.toBeUndefined();

    vi.advanceTimersByTime(10_000); // the original 2500ms timers are dead
    expect(target.handles[0].stop).toHaveBeenCalledTimes(1); // no double-stop from stale timers
  });
});
