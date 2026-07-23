/**
 * Ready-made confetti effects.
 *
 * ## Call shape (the documented preset contract)
 *
 * A preset is **pure data** — a list of timed bursts (`type: "burst"`) or
 * timed continuous emitters (`type: "emit"`) — executed by
 * {@link runPreset} against any {@link PresetTarget}. Everything with
 * `fire` + `emit` qualifies: a headless `ConfettiEngine`, a `<Confetti />`
 * `ConfettiController`, or the object returned by `useConfetti()` — so one
 * preset composes with every consumption layer:
 *
 * ```ts
 * runPreset(engine, celebration);              // headless
 * runPreset(controllerRef.current!, fireworks); // <Confetti />
 * runPreset(confetti, snow);                    // useConfetti()
 * ```
 *
 * (The `fireConfetti()` one-liner exposes `fire` only; single-burst preset
 * data can still be reused there: `fireConfetti(stars.bursts[0].options)`.)
 *
 * All presets are tree-shakeable named exports of plain data — importing
 * `snow` pulls in nothing else.
 */
import type { EmitHandle, EmitOptions, FireOptions } from "./types";

/** One timed burst inside a `type: "burst"` preset. */
export interface PresetBurst {
  /** Delay from `runPreset` start, ms (`0` = immediately). */
  readonly delayMs: number;
  /** The burst's `FireOptions` (frozen — copy before customizing). */
  readonly options: Readonly<FireOptions>;
}

/** One (optionally time-limited) emitter inside a `type: "emit"` preset. */
export interface PresetEmitter {
  /** The emitter's `EmitOptions` (frozen — copy before customizing). */
  readonly options: Readonly<EmitOptions>;
  /**
   * Auto-stop after this many ms. Omit for an indefinite emitter that runs
   * until the {@link PresetRun.cancel} of its run.
   */
  readonly durationMs?: number;
}

/**
 * A confetti preset: pure data executed by {@link runPreset}.
 *
 * @example
 * ```ts
 * import { runPreset, celebration } from "@usefy/confetti/headless";
 *
 * const run = runPreset(engine, celebration);
 * await run.done;
 * ```
 */
export type Preset =
  | { readonly type: "burst"; readonly bursts: readonly PresetBurst[] }
  | { readonly type: "emit"; readonly emitters: readonly PresetEmitter[] };

/**
 * Anything a preset can run against — the common `fire`/`emit` surface of
 * `ConfettiEngine`, `ConfettiController`, and `UseConfettiReturn`.
 *
 * @example
 * ```ts
 * const target: PresetTarget = createConfettiEngine(canvas);
 * ```
 */
export interface PresetTarget {
  fire(opts?: FireOptions): Promise<void>;
  emit(opts?: EmitOptions): EmitHandle;
}

/**
 * Handle for one preset execution.
 *
 * `done` resolves when every scheduled burst's particles have died (burst
 * presets) or every time-limited emitter has stopped (emit presets); for a
 * preset containing **only** indefinite emitters it resolves immediately —
 * `cancel()` is that preset's lifecycle. `cancel()` skips not-yet-fired
 * bursts and stops all emitters; particles already flying finish naturally
 * (use the target's `clear()` to wipe them instantly).
 *
 * @example
 * ```ts
 * const run = runPreset(engine, fireworks);
 * cancelButton.onclick = () => run.cancel();
 * await run.done;
 * ```
 */
export interface PresetRun {
  /** Resolves when the preset has fully played out (or been cancelled). */
  done: Promise<void>;
  /** Skip pending bursts and stop all emitters. Idempotent. */
  cancel(): void;
}

/**
 * Execute a {@link Preset} against a {@link PresetTarget}. Burst delays and
 * emitter durations use `setTimeout`, so the sequencing is cancelable and
 * fake-timer-friendly.
 *
 * @example
 * ```ts
 * import { createConfettiEngine, runPreset, sideCannons } from "@usefy/confetti/headless";
 *
 * const engine = createConfettiEngine(canvas);
 * await runPreset(engine, sideCannons).done;
 * ```
 */
export function runPreset(target: PresetTarget, preset: Preset): PresetRun {
  let resolveDone!: () => void;
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });
  let cancelled = false;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const handles: EmitHandle[] = [];
  let outstanding = 0;
  const settleOne = (): void => {
    if (--outstanding <= 0) resolveDone();
  };

  /**
   * Fire one burst, settling `done` bookkeeping however the target
   * misbehaves — a synchronously-throwing `fire` (in a timer callback,
   * where nothing would catch it) must never leave `done` forever-pending.
   */
  const fireSettling = (options: Readonly<FireOptions>): void => {
    try {
      target.fire(options).then(settleOne, settleOne);
    } catch {
      settleOne();
    }
  };

  if (preset.type === "burst") {
    outstanding = preset.bursts.length;
    if (outstanding === 0) resolveDone();
    for (const burst of preset.bursts) {
      if (burst.delayMs <= 0) {
        fireSettling(burst.options);
      } else {
        const timer = setTimeout(() => {
          timers.delete(timer);
          fireSettling(burst.options);
        }, burst.delayMs);
        timers.add(timer);
      }
    }
  } else {
    outstanding = preset.emitters.filter(
      (e) => e.durationMs != null && e.durationMs > 0,
    ).length;
    for (const emitter of preset.emitters) {
      const handle = target.emit(emitter.options);
      handles.push(handle);
      if (emitter.durationMs != null && emitter.durationMs > 0) {
        const timer = setTimeout(() => {
          timers.delete(timer);
          handle.stop();
          settleOne();
        }, emitter.durationMs);
        timers.add(timer);
      }
    }
    if (outstanding === 0) resolveDone(); // indefinite-only: cancel() is the lifecycle
  }

  return {
    done,
    cancel(): void {
      if (cancelled) return;
      cancelled = true;
      for (const timer of timers) {
        clearTimeout(timer);
        settleOne(); // each cleared timer was one outstanding unit of work
      }
      timers.clear();
      for (const handle of handles) handle.stop();
    },
  };
}

/* ------------------------------------------------------------------ */
/* Preset data                                                         */
/*                                                                     */
/* Every preset is deep-frozen module state: consumers can read (and   */
/* reuse, e.g. `fireConfetti(stars.bursts[0].options)`) but mutating   */
/* one would silently corrupt the effect for the whole app session —   */
/* so it throws instead. Copy (`{ ...options }`) to customize.         */
/*                                                                     */
/* Reduced-motion asymmetry worth knowing: under                       */
/* `prefers-reduced-motion` (with the default "respect"), every        */
/* fire/emit is an inert no-op, so a *burst* preset's `done` resolves  */
/* near-instantly — but a *timed emit* preset (sideCannons, pride)     */
/* still waits its full `durationMs` before `done`, since the timers   */
/* run regardless of whether particles ever spawned.                   */
/* ------------------------------------------------------------------ */

/** Recursively freeze a preset object graph (arrays included). */
function deepFreeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object") {
    for (const key of Object.keys(value)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
    Object.freeze(value);
  }
  return value;
}

const GOLD_COLORS = ["#ffd700", "#ffec8b", "#fff4c1", "#f5b942"];
const PRIDE_COLORS = ["#e40303", "#ff8c00", "#ffed00", "#008026", "#24408e", "#732982"];
const SNOW_COLORS = ["#ffffff", "#e6f2ff", "#d6eaff"];
const RAIN_COLORS = ["#9ecbff", "#6fa8dc", "#bdd7ff"];

/**
 * The all-purpose success moment: two angled side bursts toward the
 * center, followed by a lighter second volley.
 *
 * @example
 * ```ts
 * runPreset(engine, celebration);
 * ```
 */
export const celebration: Preset = /* @__PURE__ */ deepFreeze<Preset>({
  type: "burst",
  bursts: [
    { delayMs: 0, options: { count: 60, origin: { x: 0.1, y: 0.7 }, angle: 60, spread: 55 } },
    { delayMs: 0, options: { count: 60, origin: { x: 0.9, y: 0.7 }, angle: 120, spread: 55 } },
    { delayMs: 250, options: { count: 40, origin: { x: 0.1, y: 0.7 }, angle: 60, spread: 70, startVelocity: 35 } },
    { delayMs: 250, options: { count: 40, origin: { x: 0.9, y: 0.7 }, angle: 120, spread: 70, startVelocity: 35 } },
  ],
});

/**
 * Staggered 360° shell bursts high on the canvas, like a small fireworks
 * finale.
 *
 * @example
 * ```ts
 * const run = runPreset(engine, fireworks);
 * skipButton.onclick = () => run.cancel();
 * ```
 */
export const fireworks: Preset = /* @__PURE__ */ deepFreeze<Preset>({
  type: "burst",
  bursts: [
    { delayMs: 0, options: { count: 90, origin: { x: 0.5, y: 0.35 }, spread: 360, startVelocity: 30, gravity: 0.6, shapes: ["circle", "star", "square"] } },
    { delayMs: 350, options: { count: 90, origin: { x: 0.3, y: 0.3 }, spread: 360, startVelocity: 28, gravity: 0.6, shapes: ["circle", "star", "square"] } },
    { delayMs: 700, options: { count: 90, origin: { x: 0.7, y: 0.25 }, spread: 360, startVelocity: 32, gravity: 0.6, shapes: ["circle", "star", "square"] } },
  ],
});

/**
 * Two continuous cannons in the lower corners firing toward the center for
 * two seconds.
 *
 * @example
 * ```ts
 * await runPreset(engine, sideCannons).done;
 * ```
 */
export const sideCannons: Preset = /* @__PURE__ */ deepFreeze<Preset>({
  type: "emit",
  emitters: [
    { durationMs: 2000, options: { particlesPerSecond: 25, origin: { x: 0, y: 0.65 }, angle: 60, spread: 50, startVelocity: 55, shapes: ["strip", "square"] } },
    { durationMs: 2000, options: { particlesPerSecond: 25, origin: { x: 1, y: 0.65 }, angle: 120, spread: 50, startVelocity: 55, shapes: ["strip", "square"] } },
  ],
});

/**
 * {@link sideCannons} in rainbow-flag colors, running a little longer.
 *
 * @example
 * ```ts
 * runPreset(engine, pride);
 * ```
 */
export const pride: Preset = /* @__PURE__ */ deepFreeze<Preset>({
  type: "emit",
  emitters: [
    { durationMs: 2500, options: { particlesPerSecond: 30, origin: { x: 0, y: 0.65 }, angle: 60, spread: 50, startVelocity: 55, shapes: ["strip", "square"], colors: PRIDE_COLORS } },
    { durationMs: 2500, options: { particlesPerSecond: 30, origin: { x: 1, y: 0.65 }, angle: 120, spread: 50, startVelocity: 55, shapes: ["strip", "square"], colors: PRIDE_COLORS } },
  ],
});

/**
 * A double golden star burst from the center — achievements, ratings,
 * five-star moments.
 *
 * @example
 * ```ts
 * runPreset(engine, stars);
 * // or, via the one-liner (single-burst reuse):
 * fireConfetti(stars.bursts[0].options);
 * ```
 */
export const stars: Preset = /* @__PURE__ */ deepFreeze<Preset>({
  type: "burst",
  bursts: [
    { delayMs: 0, options: { count: 50, spread: 360, startVelocity: 25, gravity: 0.4, lifetime: 2500, shapes: ["star"], colors: GOLD_COLORS } },
    { delayMs: 120, options: { count: 30, spread: 360, startVelocity: 18, gravity: 0.4, lifetime: 2200, scalar: 0.8, shapes: ["star", "circle"], colors: GOLD_COLORS } },
  ],
});

/**
 * Gentle continuous snowfall across the full width of the canvas
 * (indefinite — stop it with the run's `cancel()`).
 *
 * @example
 * ```ts
 * const run = runPreset(engine, snow);
 * // winter is over:
 * run.cancel();
 * ```
 */
export const snow: Preset = /* @__PURE__ */ deepFreeze<Preset>({
  type: "emit",
  emitters: [
    {
      options: {
        // Tuned by eye in browser QA: slow initial fall + gentle gravity so
        // flakes take ~6s to cross a viewport, at a density that reads as
        // steady snowfall (not stray dots).
        particlesPerSecond: 18,
        origin: { x: 0.5, y: -0.03 },
        originJitter: { x: 1 },
        angle: -90,
        spread: 25,
        startVelocity: 0.8,
        gravity: 0.06,
        drift: 0.4,
        decay: 1,
        lifetime: 12_000,
        scalar: 0.7,
        flat: true,
        shapes: ["circle"],
        colors: SNOW_COLORS,
      },
    },
  ],
});

/**
 * Fast straight rain across the full width of the canvas (indefinite —
 * stop it with the run's `cancel()`).
 *
 * @example
 * ```ts
 * const run = runPreset(engine, rain);
 * run.cancel();
 * ```
 */
export const rain: Preset = /* @__PURE__ */ deepFreeze<Preset>({
  type: "emit",
  emitters: [
    {
      options: {
        particlesPerSecond: 40,
        origin: { x: 0.5, y: -0.03 },
        originJitter: { x: 1 },
        angle: -90,
        spread: 4,
        startVelocity: 18,
        gravity: 1.4,
        decay: 1,
        lifetime: 3000,
        scalar: 0.5,
        flat: true,
        shapes: ["strip"],
        colors: RAIN_COLORS,
      },
    },
  ],
});
