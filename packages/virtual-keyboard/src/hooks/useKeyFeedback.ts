import { useCallback, useEffect, useRef } from "react";

/** Duration (s) of the synthesized key-click envelope. */
const CLICK_DURATION_S = 0.02;
/** Peak gain of the click (kept low so rapid presses aren't harsh). */
const CLICK_GAIN = 0.06;
/** Oscillator frequency (Hz) of the click. */
const CLICK_FREQUENCY = 600;
/** Vibration pulse length (ms) for haptic feedback. */
const HAPTIC_MS = 10;

type AudioContextCtor = typeof AudioContext;

/** Resolve the (possibly prefixed) AudioContext constructor, or `null`. */
function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

export interface UseKeyFeedbackOptions {
  /** Play a synthesized click on each press. */
  sound?: boolean;
  /** Vibrate briefly on each press (where supported). */
  haptics?: boolean;
}

/**
 * Opt-in press feedback: a synthesized Web Audio "click" and/or a short haptic
 * vibration. Returns a **stable** `playFeedback()` to call once per committed
 * press.
 *
 * Design constraints honored here so it is enterprise-safe:
 * - **No asset, CSP-friendly** — the click is synthesized with a brief
 *   oscillator/gain envelope, not a bundled/`data:` audio file.
 * - **SSR-safe** — nothing touches `window` / `AudioContext` / `navigator` at
 *   import or mount; the `AudioContext` is created **lazily on the first press**
 *   (browsers block audio before a user gesture).
 * - **Capability-guarded** — unsupported Web Audio or `navigator.vibrate`
 *   silently no-ops.
 * - **Leak-free** — a single `AudioContext` is reused across presses (resumed if
 *   suspended) and closed on unmount.
 *
 * @param options - `{ sound, haptics }` (both default off, independent).
 * @returns A stable `playFeedback()` — a no-op when both are off/unsupported.
 *
 * @example
 * ```tsx
 * const playFeedback = useKeyFeedback({ sound: true, haptics: true });
 * // In the press handler (a real user gesture):
 * playFeedback();
 * ```
 */
export function useKeyFeedback(
  options: UseKeyFeedbackOptions = {}
): () => void {
  const { sound = false, haptics = false } = options;

  const soundRef = useRef(sound);
  soundRef.current = sound;
  const hapticsRef = useRef(haptics);
  hapticsRef.current = haptics;

  const ctxRef = useRef<AudioContext | null>(null);

  const getContext = useCallback((): AudioContext | null => {
    if (ctxRef.current) return ctxRef.current;
    const Ctor = getAudioContextCtor();
    if (!Ctor) return null;
    try {
      ctxRef.current = new Ctor();
    } catch {
      return null;
    }
    return ctxRef.current;
  }, []);

  const playFeedback = useCallback(() => {
    if (soundRef.current) {
      const ctx = getContext();
      if (ctx) {
        try {
          // resume() returns a promise — swallow rejection so it can never
          // surface as an unhandled rejection.
          if (ctx.state === "suspended") ctx.resume()?.catch?.(() => {});
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "square";
          osc.frequency.value = CLICK_FREQUENCY;
          const now = ctx.currentTime;
          gain.gain.setValueAtTime(CLICK_GAIN, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + CLICK_DURATION_S);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + CLICK_DURATION_S);
        } catch {
          // Ignore audio failures — feedback is best-effort.
        }
      }
    }

    if (
      hapticsRef.current &&
      typeof navigator !== "undefined" &&
      typeof navigator.vibrate === "function"
    ) {
      try {
        navigator.vibrate(HAPTIC_MS);
      } catch {
        // Ignore — some browsers throw outside a user gesture.
      }
    }
  }, [getContext]);

  // Release the AudioContext on unmount (leak-free / StrictMode-safe).
  useEffect(() => {
    return () => {
      const ctx = ctxRef.current;
      ctxRef.current = null;
      if (ctx) {
        try {
          // close() returns a promise — swallow rejection (already-closed etc.).
          ctx.close()?.catch?.(() => {});
        } catch {
          // Already closed / not closeable.
        }
      }
    };
  }, []);

  return playFeedback;
}
