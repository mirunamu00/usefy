/**
 * `<Confetti />` — drop-in confetti canvas: a portal full-viewport overlay
 * by default, or an inline canvas filling its parent.
 */
import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import { useIsomorphicLayoutEffect } from "@usefy/use-isomorphic-layout-effect";
import { useLatest } from "@usefy/use-latest";
import { usePageVisibility } from "@usefy/use-page-visibility";
import { useReducedMotion } from "@usefy/use-reduced-motion";
import { createConfettiEngine } from "./engine/createEngine";
import type {
  ConfettiEngine,
  EmitHandle,
  EmitOptions,
  FireOptions,
} from "./types";

const NOOP_EMIT_HANDLE: EmitHandle = {
  stop() {
    /* no-op */
  },
  get active() {
    return false;
  },
};

/**
 * Imperative handle exposed through {@link ConfettiProps.controllerRef} —
 * mirrors the spotlight-tour `TourController` ergonomics. The controller
 * object is referentially stable for the component's lifetime; calls made
 * before the canvas has mounted are safe no-ops (`fire` resolves
 * immediately, `emit` returns an inert handle).
 *
 * @example
 * ```tsx
 * const controller = useRef<ConfettiController>(null);
 * <Confetti controllerRef={controller} />
 * <button onClick={() => controller.current?.fire()}>Party</button>
 * ```
 */
export interface ConfettiController {
  /** Fire one burst; resolves when that burst's particles have all died. */
  fire(opts?: FireOptions): Promise<void>;
  /** Start a continuous emitter (snow, rain, cannons…). */
  emit(opts?: EmitOptions): EmitHandle;
  /** Stop all emitters; live particles finish naturally. */
  stop(): void;
  /** Kill everything and wipe the canvas now. */
  clear(): void;
}

/**
 * Props for {@link Confetti}.
 *
 * @example
 * ```tsx
 * <Confetti
 *   controllerRef={controller}
 *   zIndex={1200}
 *   onComplete={() => console.log("settled")}
 * />
 * ```
 */
export interface ConfettiProps {
  /**
   * `"overlay"` (default): a portal fixed full-viewport canvas appended to
   * `document.body` after hydration. `"inline"`: the canvas renders in
   * place and fills its parent (give the parent `position: relative`).
   */
  variant?: "overlay" | "inline";
  /** Stacking order of the overlay canvas. Default `1100`. */
  zIndex?: number;
  /** Receives the imperative {@link ConfettiController}. */
  controllerRef?: Ref<ConfettiController>;
  /**
   * Called each time the engine goes idle (all particles dead, no emitter).
   * Not called when the component unmounts mid-animation.
   */
  onComplete?: () => void;
  /**
   * Fire one burst right after mount — `true` for defaults, or a
   * {@link FireOptions} object. Respects reduced motion (no burst when the
   * user prefers reduced motion and `reducedMotion` is `"respect"`).
   */
  fireOnMount?: boolean | FireOptions;
  /**
   * `"respect"` (default): `prefers-reduced-motion: reduce` turns every
   * fire/emit into a resolved no-op. `"ignore"`: animate anyway.
   */
  reducedMotion?: "respect" | "ignore";
  /** Extra class for the canvas element. */
  className?: string;
  /** Extra inline styles, merged over the built-in canvas styles. */
  style?: CSSProperties;
}

/**
 * Confetti canvas component.
 *
 * - **SSR-safe**: the overlay renders nothing until after hydration; the
 *   engine only exists client-side.
 * - **Never blocks the UI**: the canvas is `aria-hidden` with
 *   `pointer-events: none`.
 * - **Zero React renders during animation**: all motion happens inside the
 *   imperative engine; React is only involved on mount/unmount.
 * - Pauses automatically while the page is hidden.
 * - StrictMode-safe: the dev double-mount leaves exactly one canvas and no
 *   orphaned rAF/observers.
 *
 * @example
 * ```tsx
 * import { Confetti, type ConfettiController } from "@usefy/confetti";
 * import { useRef } from "react";
 *
 * function CheckoutSuccess() {
 *   const confetti = useRef<ConfettiController>(null);
 *   return (
 *     <>
 *       <Confetti controllerRef={confetti} />
 *       <button onClick={() => confetti.current?.fire({ origin: { y: 0.7 } })}>
 *         Complete purchase
 *       </button>
 *     </>
 *   );
 * }
 * ```
 */
export function Confetti(props: ConfettiProps): ReactNode {
  const {
    variant = "overlay",
    zIndex = 1100,
    controllerRef,
    onComplete,
    fireOnMount = false,
    reducedMotion = "respect",
    className,
    style,
  } = props;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<ConfettiEngine | null>(null);
  const onCompleteRef = useLatest(onComplete);
  const fireOnMountRef = useLatest(fireOnMount);
  const prefersReduced = useReducedMotion();
  const skipMotionRef = useLatest(reducedMotion === "respect" && prefersReduced);

  // When can the canvas actually exist? Inline renders it from the very
  // first render; overlay only after the mount gate opens the portal.
  // Depending on this (rather than `mounted` directly) keeps the inline
  // variant from destroying+recreating a perfectly good engine when the
  // mount flag flips — which would also double-fire `fireOnMount`.
  const canvasReady = variant === "inline" || mounted;

  // Engine lifecycle — (re)created whenever the canvas element can change
  // (readiness gate, variant switch) or the engine option changes.
  useIsomorphicLayoutEffect(() => {
    const canvas = canvasElRef.current;
    if (!canvas) return;
    const engine = createConfettiEngine(canvas, { reducedMotion });
    engineRef.current = engine;
    // Idle-edge subscription (never per-frame). Unsubscribed BEFORE destroy
    // in cleanup so unmounting mid-animation does not report completion.
    const unsubscribe = engine.onActiveChange((active) => {
      if (!active) onCompleteRef.current?.();
    });
    const fom = fireOnMountRef.current;
    if (fom && !skipMotionRef.current) {
      void engine.fire(typeof fom === "object" ? fom : undefined);
    }
    return () => {
      unsubscribe();
      engine.destroy();
      engineRef.current = null;
    };
  }, [canvasReady, variant, reducedMotion]);

  // Stable imperative controller (safe no-ops before the engine exists).
  const controller = useMemo<ConfettiController>(
    () => ({
      fire: (opts?: FireOptions) =>
        engineRef.current ? engineRef.current.fire(opts) : Promise.resolve(),
      emit: (opts?: EmitOptions) =>
        engineRef.current ? engineRef.current.emit(opts) : NOOP_EMIT_HANDLE,
      stop: () => {
        engineRef.current?.stop();
      },
      clear: () => {
        engineRef.current?.clear();
      },
    }),
    [],
  );
  useImperativeHandle(controllerRef, () => controller, [controller]);

  // Pause while the tab is hidden — no burst "wall" on return (SPEC §2.1).
  usePageVisibility((visible) => {
    const engine = engineRef.current;
    if (!engine) return;
    if (visible) engine.resume();
    else engine.pause();
  });

  const canvasStyle: CSSProperties = {
    position: variant === "overlay" ? "fixed" : "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex,
    ...style,
  };

  const canvas = (
    <canvas
      ref={canvasElRef}
      aria-hidden="true"
      data-usefy-confetti={variant}
      className={className}
      style={canvasStyle}
    />
  );

  if (variant === "inline") return canvas;
  if (!mounted) return null; // SSR / first client render: nothing yet
  return createPortal(canvas, document.body);
}
