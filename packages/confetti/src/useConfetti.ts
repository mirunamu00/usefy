/**
 * `useConfetti` — component-scoped confetti on a consumer-owned canvas.
 */
import { useCallback, useRef, useState, type RefCallback } from "react";
import { useLatest } from "@usefy/use-latest";
import { usePageVisibility } from "@usefy/use-page-visibility";
import { createConfettiEngine } from "./engine/createEngine";
import type {
  ConfettiEngine,
  ConfettiEngineOptions,
  EmitHandle,
  EmitOptions,
  FireOptions,
} from "./types";

/** Handle returned when no engine exists (canvas not attached yet). */
const NOOP_EMIT_HANDLE: EmitHandle = {
  stop() {
    /* no-op */
  },
  get active() {
    return false;
  },
};

/**
 * Value returned by {@link useConfetti}.
 *
 * All functions are referentially stable for the component's lifetime.
 * `isActive` re-renders the component **only** on idle↔active edges of the
 * engine — never per frame.
 *
 * @example
 * ```tsx
 * const { canvasRef, fire, isActive } = useConfetti();
 * return (
 *   <div style={{ position: "relative" }}>
 *     <canvas ref={canvasRef} style={{ position: "absolute", inset: 0 }} />
 *     <button onClick={() => fire()} disabled={isActive}>Celebrate</button>
 *   </div>
 * );
 * ```
 */
export interface UseConfettiReturn {
  /**
   * Attach this to the `<canvas>` you own. The engine is created lazily on
   * first attach and destroyed on detach/unmount.
   */
  canvasRef: RefCallback<HTMLCanvasElement>;
  /**
   * Fire one burst. Resolves when that burst's particles have all died.
   * Resolves immediately when no canvas is attached yet.
   */
  fire(opts?: FireOptions): Promise<void>;
  /**
   * Start a continuous emitter. Returns an inert handle when no canvas is
   * attached yet.
   */
  emit(opts?: EmitOptions): EmitHandle;
  /** Stop all emitters (live particles finish naturally). */
  stop(): void;
  /** Kill everything and wipe the canvas now. */
  clear(): void;
  /** `true` while particles are alive or an emitter is active. */
  isActive: boolean;
}

/**
 * React hook for confetti on a canvas **you** render. The engine is created
 * lazily when the canvas attaches, destroyed when it detaches or the
 * component unmounts, paused automatically while the page is hidden, and
 * respects `prefers-reduced-motion` by default (see
 * {@link ConfettiEngineOptions.reducedMotion}).
 *
 * `options` are read once, at engine creation (first canvas attach) — pass
 * a new canvas (or remount) to apply different options.
 *
 * StrictMode-safe: the dev double-invocation attaches → detaches → attaches,
 * leaving exactly one live engine and zero orphaned rAF/observers.
 *
 * @example
 * ```tsx
 * import { useConfetti } from "@usefy/confetti";
 *
 * function Celebration() {
 *   const { canvasRef, fire, isActive } = useConfetti();
 *   return (
 *     <div style={{ position: "relative", height: 240 }}>
 *       <canvas
 *         ref={canvasRef}
 *         style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
 *       />
 *       <button onClick={() => fire({ origin: { y: 0.9 } })} disabled={isActive}>
 *         🎉 Celebrate
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useConfetti(
  options: ConfettiEngineOptions = {},
): UseConfettiReturn {
  const engineRef = useRef<ConfettiEngine | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const optionsRef = useLatest(options);
  const [isActive, setIsActive] = useState(false);

  const canvasRef = useCallback<RefCallback<HTMLCanvasElement>>(
    (canvas) => {
      // Detach: tear the previous engine down completely.
      if (engineRef.current) {
        unsubscribeRef.current?.();
        unsubscribeRef.current = null;
        engineRef.current.destroy();
        engineRef.current = null;
        setIsActive(false);
      }
      if (canvas) {
        const engine = createConfettiEngine(canvas, optionsRef.current);
        engineRef.current = engine;
        // Edge-only subscription — this is the ONLY re-render source.
        unsubscribeRef.current = engine.onActiveChange(setIsActive);
      }
    },
    [optionsRef],
  );

  const fire = useCallback(
    (opts?: FireOptions): Promise<void> =>
      engineRef.current ? engineRef.current.fire(opts) : Promise.resolve(),
    [],
  );
  const emit = useCallback(
    (opts?: EmitOptions): EmitHandle =>
      engineRef.current ? engineRef.current.emit(opts) : NOOP_EMIT_HANDLE,
    [],
  );
  const stop = useCallback((): void => {
    engineRef.current?.stop();
  }, []);
  const clear = useCallback((): void => {
    engineRef.current?.clear();
  }, []);

  // Pause while the tab is hidden — no burst "wall" on return (SPEC §2.1).
  usePageVisibility((visible) => {
    const engine = engineRef.current;
    if (!engine) return;
    if (visible) engine.resume();
    else engine.pause();
  });

  return { canvasRef, fire, emit, stop, clear, isActive };
}
