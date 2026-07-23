/**
 * The `fireConfetti()` one-liner — a module-level singleton that lazily
 * creates (and reuses) one full-viewport overlay canvas, and removes it
 * again once the engine has been idle for {@link SINGLETON_TEARDOWN_MS}.
 *
 * SSR-safe: on the server every call is a resolved no-op; nothing here
 * touches `window`/`document` at module scope.
 *
 * Page visibility is handled engine-side with a plain `visibilitychange`
 * listener (there is no React lifecycle to hook into here) — the loop
 * pauses while the tab is hidden and resumes on return, with the engine's
 * dt clamp preventing any catch-up burst.
 */
import { createConfettiEngine } from "./engine/createEngine";
import type { ConfettiEngine, FireOptions } from "./types";

/**
 * How long the singleton stays idle before its canvas is removed from the
 * DOM (a quick follow-up `fireConfetti()` reuses the warm canvas/engine).
 *
 * @example
 * ```ts
 * import { fireConfetti, SINGLETON_TEARDOWN_MS } from "@usefy/confetti";
 *
 * await fireConfetti();
 * // the overlay canvas disappears SINGLETON_TEARDOWN_MS after going idle
 * ```
 */
export const SINGLETON_TEARDOWN_MS = 3000;

interface SingletonState {
  canvas: HTMLCanvasElement;
  engine: ConfettiEngine;
  teardownTimer: ReturnType<typeof setTimeout> | null;
  unsubscribe: () => void;
  onVisibilityChange: () => void;
}

let singleton: SingletonState | null = null;

function cancelTeardown(state: SingletonState): void {
  if (state.teardownTimer !== null) {
    clearTimeout(state.teardownTimer);
    state.teardownTimer = null;
  }
}

function scheduleTeardown(state: SingletonState): void {
  cancelTeardown(state);
  state.teardownTimer = setTimeout(() => {
    resetConfetti();
  }, SINGLETON_TEARDOWN_MS);
}

function ensureSingleton(): SingletonState {
  if (singleton) return singleton;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.setAttribute("data-usefy-confetti", "singleton");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "1100";
  document.body.appendChild(canvas);

  const engine = createConfettiEngine(canvas);

  const state: SingletonState = {
    canvas,
    engine,
    teardownTimer: null,
    unsubscribe: () => {},
    onVisibilityChange: () => {
      if (document.visibilityState === "hidden") engine.pause();
      else engine.resume();
    },
  };

  state.unsubscribe = engine.onActiveChange((active) => {
    if (active) cancelTeardown(state);
    else scheduleTeardown(state);
  });
  document.addEventListener("visibilitychange", state.onVisibilityChange);

  // Armed from birth: if the first fire no-ops (reduced motion) the engine
  // never flips active, and this timer still reclaims the canvas.
  scheduleTeardown(state);

  singleton = state;
  return state;
}

/**
 * Fire a confetti burst on an auto-managed full-viewport canvas — the
 * 5-second quick start. The canvas is created lazily on first call, reused
 * across calls, and removed automatically after the confetti has settled
 * (see {@link SINGLETON_TEARDOWN_MS}).
 *
 * Resolves when the burst's particles have all died. On the server (SSR)
 * — or under `prefers-reduced-motion: reduce` — it resolves immediately as
 * a no-op.
 *
 * @example
 * ```tsx
 * import { fireConfetti } from "@usefy/confetti";
 *
 * <button onClick={() => fireConfetti({ origin: { y: 0.8 }, spread: 70 })}>
 *   🎉 Ship it
 * </button>
 * ```
 */
export function fireConfetti(opts?: FireOptions): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.resolve(); // SSR no-op
  }
  return ensureSingleton().engine.fire(opts);
}

/**
 * Tear the singleton down **now**: destroy the engine, remove the canvas
 * and all listeners. Safe to call any time (no-op when nothing exists).
 * The next {@link fireConfetti} starts fresh.
 *
 * @example
 * ```ts
 * import { resetConfetti } from "@usefy/confetti";
 *
 * // e.g. in a test's afterEach, or before an SPA full-page transition:
 * resetConfetti();
 * ```
 */
export function resetConfetti(): void {
  if (!singleton) return;
  const state = singleton;
  singleton = null; // re-entrancy guard first
  cancelTeardown(state);
  state.unsubscribe(); // before destroy — its idle edge must not re-arm
  document.removeEventListener("visibilitychange", state.onVisibilityChange);
  state.engine.destroy();
  state.canvas.parentNode?.removeChild(state.canvas);
}
