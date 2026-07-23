/**
 * `<SignaturePad />` — drop-in signature input: a container-filling
 * canvas wired to the headless ink engine, with an optional on-canvas
 * "sign here" guideline, an imperative controller, and edge-only change
 * callbacks.
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
import { useIsomorphicLayoutEffect } from "@usefy/use-isomorphic-layout-effect";
import { useLatest } from "@usefy/use-latest";
import { createSignatureEngine, type SignatureEngine } from "./engine/createEngine";
import { isSafeCssColor } from "./ink/svg";
import {
  toFinite,
  type PNGExportOptions,
  type SignatureData,
  type SignatureOptions,
  type SVGExportOptions,
} from "./types";
import { emptySignatureData, emptyToPNG, emptyToSVG } from "./reactFallbacks";

/**
 * Guideline configuration — a horizontal "sign here" baseline drawn
 * on-canvas BENEATH the ink and excluded from every export (PNG/SVG/
 * JSON) by construction.
 */
/**
 * @example
 * ```tsx
 * <SignaturePad guideline />                                  // defaults
 * <SignaturePad guideline={{ y: 140, inset: 32, color: "#cbd5e1" }} />
 * ```
 */
export interface SignatureGuideline {
  /** Baseline y in CSS px. @default 75% of the canvas height */
  y?: number;
  /** Horizontal inset from both edges, px. @default 24 */
  inset?: number;
  /** Line color (sanitized). @default "#94a3b8" */
  color?: string;
}

const DEFAULT_GUIDELINE_COLOR = "#94a3b8";

/**
 * Imperative handle exposed through {@link SignaturePadProps.controllerRef}.
 * The controller object is referentially stable for the component's
 * lifetime; calls made before the canvas has mounted (or after unmount)
 * are safe no-ops — reads return minimal empty artifacts.
 *
 * @example
 * ```tsx
 * const pad = useRef<SignaturePadController>(null);
 * <SignaturePad controllerRef={pad} />
 * <button onClick={() => pad.current?.clear()}>Clear</button>
 * ```
 */
export interface SignaturePadController {
  clear(): void;
  undo(): void;
  redo(): void;
  isEmpty(): boolean;
  toPNG(opts?: PNGExportOptions): Promise<{ dataURL: string; blob: Blob }>;
  toSVG(opts?: SVGExportOptions): string;
  toJSON(): SignatureData;
  fromJSON(data: SignatureData): void;
}

/**
 * Props for {@link SignaturePad}. Extends every ink option (SPEC §3.6).
 *
 * @example
 * ```tsx
 * <SignaturePad
 *   penColor="#0f172a"
 *   guideline
 *   onChange={({ isEmpty }) => setCanSubmit(!isEmpty)}
 * />
 * ```
 */
export interface SignaturePadProps extends SignatureOptions {
  /** Receives the imperative {@link SignaturePadController}. */
  controllerRef?: Ref<SignaturePadController>;
  /** Render a stored signature (applied once, on mount). */
  defaultValue?: SignatureData;
  /** Disable input; rendering/exports/restore keep working. @default false */
  readOnly?: boolean;
  /**
   * Baseline "sign here" guideline, drawn under the ink, never exported.
   * `true` for defaults or a {@link SignatureGuideline} object.
   * @default false
   */
  guideline?: boolean | SignatureGuideline;
  /** Fires when a stroke begins. */
  onBegin?: () => void;
  /** Fires when a stroke ends. */
  onEnd?: () => void;
  /**
   * Fires on state edges only (stroke end / undo / redo / clear /
   * fromJSON) — never per point.
   */
  onChange?: (state: { isEmpty: boolean; strokeCount: number }) => void;
  /** Extra class for the canvas element. */
  className?: string;
  /** Extra inline styles, merged over the built-in canvas styles. */
  style?: CSSProperties;
  /**
   * Accessible name base. The live state (", empty" / ", signed") is
   * appended and updated on change edges.
   * @default "Signature input area"
   */
  "aria-label"?: string;
}

/** Draw the guideline underlay (CSS-px coordinates). */
function drawGuideline(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: SignatureGuideline,
): void {
  const inset = Math.max(0, toFinite(config.inset, 24));
  const y = toFinite(config.y, Math.round(height * 0.75));
  const color =
    typeof config.color === "string" && isSafeCssColor(config.color)
      ? config.color
      : DEFAULT_GUIDELINE_COLOR;
  ctx.beginPath();
  ctx.moveTo(inset, y);
  ctx.lineTo(width - inset, y);
  ctx.lineWidth = 1;
  ctx.strokeStyle = color;
  ctx.stroke();
}

/**
 * Signature input component.
 *
 * - Renders a **container-filling canvas** in place (no portal) — SSR
 *   renders the inert canvas markup, hydration-safe; the engine only
 *   exists client-side.
 * - **Zero React renders while ink is flowing** — state updates only on
 *   engine edges (stroke end / undo / redo / clear / restore).
 * - **Ink survives option changes**: changing ink props (e.g.
 *   `penColor`) recreates the engine but carries the **committed**
 *   strokes over exactly (strokes are self-contained), so existing ink
 *   keeps its captured style and new strokes pick up the new options.
 *   Two costs, by design: history resets, and a stroke that is
 *   IN PROGRESS at the moment the props change is discarded (the new
 *   engine never saw its pointer-down).
 * - `guideline` draws beneath the ink via the engine's underlay seam and
 *   is excluded from PNG/SVG/JSON exports by construction.
 * - StrictMode-safe: the dev double-mount leaves exactly one engine and
 *   zero orphaned listeners/observers.
 * - A11y: `role="img"` with a state-reflecting `aria-label`
 *   ("…, empty" / "…, signed") updated on change edges (SPEC §8). For a
 *   keyboard-accessible alternative, pair with a typed-signature
 *   fallback (README recipe).
 *
 * @example
 * ```tsx
 * import { SignaturePad, type SignaturePadController } from "@usefy/signature-pad";
 * import { useRef, useState } from "react";
 *
 * function ConsentForm() {
 *   const pad = useRef<SignaturePadController>(null);
 *   const [signed, setSigned] = useState(false);
 *   return (
 *     <div style={{ height: 200 }}>
 *       <SignaturePad
 *         guideline
 *         controllerRef={pad}
 *         onChange={({ isEmpty }) => setSigned(!isEmpty)}
 *       />
 *       <button disabled={!signed} onClick={async () => {
 *         const { blob } = await pad.current!.toPNG({ background: "#fff" });
 *         await submit(blob);
 *       }}>
 *         Sign &amp; submit
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function SignaturePad(props: SignaturePadProps): ReactNode {
  const {
    controllerRef,
    defaultValue,
    readOnly = false,
    guideline = false,
    onBegin,
    onEnd,
    onChange,
    className,
    style,
    "aria-label": ariaLabel = "Signature input area",
    penColor,
    minWidth,
    maxWidth,
    velocityFilterWeight,
    minDistance,
    pressure,
    acceptPointerTypes,
    dpr,
    background,
  } = props;

  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<SignatureEngine | null>(null);
  const [padState, setPadState] = useState({ isEmpty: true, strokeCount: 0 });

  const onBeginRef = useLatest(onBegin);
  const onEndRef = useLatest(onEnd);
  const onChangeRef = useLatest(onChange);
  const guidelineRef = useLatest(guideline);
  const readOnlyRef = useLatest(readOnly);
  /** Applied once, on first engine creation (SPEC §3.5). */
  const defaultValueRef = useRef<SignatureData | undefined>(defaultValue);
  /** Ink carried across engine recreations (option changes, StrictMode). */
  const carryRef = useRef<SignatureData | null>(null);
  /**
   * True while an INTERNAL fromJSON runs (carry-over / defaultValue) —
   * suppresses the consumer `onChange` for restores that only re-apply
   * state the consumer already knows.
   */
  const internalRestoreRef = useRef(false);

  const options: SignatureOptions = {
    penColor,
    minWidth,
    maxWidth,
    velocityFilterWeight,
    minDistance,
    pressure,
    acceptPointerTypes,
    dpr,
    background,
  };
  const optionsRef = useLatest(options);
  // Value-identity key: recreate the engine only when an option VALUE
  // changes (an inline acceptPointerTypes array must not churn engines).
  const optionsKey = JSON.stringify(options, (_k, v: unknown) => (v === undefined ? null : v));

  // Engine lifecycle.
  useIsomorphicLayoutEffect(() => {
    const canvas = canvasElRef.current;
    if (!canvas) return;
    const engine = createSignatureEngine(canvas, {
      ...optionsRef.current,
      readOnly: readOnlyRef.current,
      renderUnderlay: (ctx, width, height) => {
        const config = guidelineRef.current;
        if (!config) return;
        drawGuideline(ctx, width, height, config === true ? {} : config);
      },
    });
    engineRef.current = engine;
    const offChange = engine.onChange((e) => {
      const next = { isEmpty: e.isEmpty, strokeCount: e.strokeCount };
      // Value-bail: no-op updates must not re-render (house rule).
      setPadState((prev) =>
        prev.isEmpty === next.isEmpty && prev.strokeCount === next.strokeCount ? prev : next,
      );
      if (!internalRestoreRef.current) onChangeRef.current?.(next);
    });
    const offBegin = engine.onBegin(() => onBeginRef.current?.());
    const offEnd = engine.onEnd(() => onEndRef.current?.());

    // Restore: carried ink from a previous engine (option change /
    // StrictMode remount) wins; otherwise the one-shot defaultValue.
    const restore = carryRef.current ?? defaultValueRef.current;
    carryRef.current = null;
    defaultValueRef.current = undefined;
    if (restore && restore.strokes.length > 0) {
      internalRestoreRef.current = true;
      try {
        engine.fromJSON(restore);
      } finally {
        internalRestoreRef.current = false;
      }
    }

    return () => {
      offChange();
      offBegin();
      offEnd();
      // Carry the ink into the next engine (self-contained strokes make
      // this lossless). On real unmount the ref is simply dropped.
      carryRef.current = engine.toJSON();
      engine.destroy();
      engineRef.current = null;
    };
  }, [optionsKey]);

  // readOnly is reactive (input attach/detach only — no engine churn).
  useEffect(() => {
    engineRef.current?.setReadOnly(readOnly);
  }, [readOnly]);

  // Guideline changes redraw in place (resize() forces a full replay).
  // (guideline is destructure-defaulted, so stringify always returns a
  // string.) First-mount guarded: the creation replay already drew it.
  const guidelineKey = JSON.stringify(guideline);
  const guidelineMountedRef = useRef(false);
  useEffect(() => {
    if (!guidelineMountedRef.current) {
      guidelineMountedRef.current = true;
      return;
    }
    engineRef.current?.resize();
  }, [guidelineKey]);

  // Stable imperative controller (safe no-ops before/after the engine).
  const controller = useMemo<SignaturePadController>(
    () => ({
      clear: () => {
        engineRef.current?.clear();
      },
      undo: () => {
        engineRef.current?.undo();
      },
      redo: () => {
        engineRef.current?.redo();
      },
      isEmpty: () => (engineRef.current ? engineRef.current.isEmpty : true),
      toPNG: (opts?: PNGExportOptions) =>
        engineRef.current ? engineRef.current.toPNG(opts) : emptyToPNG(opts),
      toSVG: (opts?: SVGExportOptions) =>
        engineRef.current ? engineRef.current.toSVG(opts) : emptyToSVG(opts),
      toJSON: () => (engineRef.current ? engineRef.current.toJSON() : emptySignatureData()),
      fromJSON: (data: SignatureData) => {
        engineRef.current?.fromJSON(data);
      },
    }),
    [],
  );
  useImperativeHandle(controllerRef, () => controller, [controller]);

  const canvasStyle: CSSProperties = {
    display: "block",
    width: "100%",
    height: "100%",
    // touch-action is enforced by the engine on mount; setting it in the
    // markup too keeps the SSR-rendered canvas scroll-safe pre-hydration.
    touchAction: "none",
    ...style,
  };

  return (
    <canvas
      ref={canvasElRef}
      role="img"
      aria-label={`${ariaLabel}${padState.isEmpty ? ", empty" : ", signed"}`}
      data-usefy-signature-pad=""
      className={className}
      style={canvasStyle}
    />
  );
}
