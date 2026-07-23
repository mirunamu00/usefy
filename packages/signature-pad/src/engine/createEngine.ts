/**
 * The headless signature engine — pointer pipeline, canvas management
 * (DPR backing store, ResizeObserver, `touch-action`), stroke building,
 * incremental rendering, stroke-level history, and edge-only change
 * notification. Framework-free and SSR-safe: nothing in this module
 * touches `window`/`document`/canvas at import time; all environment
 * access happens inside {@link createSignatureEngine} or later.
 */
import {
  resolveOptions,
  toFinite,
  DEFAULT_PEN_COLOR,
  type PNGExportOptions,
  type SignatureData,
  type SignatureOptions,
  type SignaturePoint,
  type SignaturePointerType,
  type SignatureStroke,
  type SVGExportOptions,
} from "../types";
import { passesMinDistance } from "../ink/filterPoints";
import {
  createStrokeWalker,
  type StrokeWalker,
  type StrokeWalkerParams,
} from "../ink/strokeWalker";
import type { FlatStep } from "../ink/bezier";
import { isSafeCssColor, strokesToSVG } from "../ink/svg";
import { clearAndFill, drawSteps, replayStrokes } from "./render";
import { exportPNG } from "./png";

/** Maximum device-pixel-ratio used for backing-store sizing (SPEC §3.4). */
export const MAX_DPR = 2;

/** Options accepted by {@link createSignatureEngine}. */
export interface SignatureEngineOptions extends SignatureOptions {
  /**
   * Start with input detached (read-only display). Rendering, history,
   * and restore (`fromJSON`) still work; pointer events and `ingest`
   * are ignored.
   * @default false
   */
  readOnly?: boolean;
  /**
   * On-canvas underlay hook — invoked on every FULL redraw
   * (construction, resize, undo/redo/clear/fromJSON replays) after the
   * background fill and BEFORE the strokes, in CSS-px coordinates. This
   * is the seam the React layer uses to draw the "sign here" guideline
   * beneath the ink. **Excluded from PNG/SVG exports by construction** —
   * the exporters replay strokes only, never this hook. The context is
   * save/restore-wrapped and a throwing hook is isolated (logged).
   */
  renderUnderlay?: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

/**
 * One synthetic input sample for {@link SignatureEngine.ingest} — the
 * jsdom-testable and replayable twin of a real pointer event. Real
 * pointer events are normalized to exactly this shape and flow through
 * the same internal path.
 */
export interface IngestSample {
  type: "down" | "move" | "up" | "cancel";
  /** CSS-pixel coords relative to the canvas box. */
  x: number;
  y: number;
  /** ms timestamp (`performance.now()` domain). */
  time: number;
  /** Normalized pressure 0–1. @default 0 */
  pressure?: number;
  /** `"pen" | "touch" | "mouse"`; unknown values are treated as `"mouse"`. @default "mouse" */
  pointerType?: string;
}

/**
 * The headless signature engine (SPEC §4.3). Created by
 * {@link createSignatureEngine}; owns all canvas plumbing.
 */
export interface SignatureEngine {
  /** `true` while no committed strokes exist. Edge-notified via {@link onChange}. */
  readonly isEmpty: boolean;
  /** Number of committed strokes. */
  readonly strokeCount: number;
  /** Whether {@link undo} would do anything. */
  readonly canUndo: boolean;
  /** Whether {@link redo} would do anything. */
  readonly canRedo: boolean;

  /**
   * Wipe all ink as a **single undoable action** — one {@link undo}
   * restores every cleared stroke (SPEC §3.2). No-op on an empty pad.
   */
  clear(): void;
  /** Undo the last action (stroke add or clear). No-op when nothing to undo. */
  undo(): void;
  /** Redo the last undone action. Invalidated by any new stroke or clear. */
  redo(): void;

  /**
   * Snapshot the signature as a versioned, replayable document (deep
   * copy). **Committed strokes only** — an in-progress stroke is
   * excluded until it commits (same semantics as {@link toPNG}/
   * {@link toSVG}). Strokes are self-contained — each carries the width
   * parameters captured at its start, so the document replays
   * identically on any engine.
   */
  toJSON(): SignatureData;
  /**
   * Replace the signature with `data`: drops any in-progress stroke,
   * resets history, replays, and notifies. Tolerant of unknown extra
   * fields and silently drops non-finite points; throws on a missing
   * stroke array or an unsupported major version.
   *
   * `data.width`/`data.height` are **informational** (the capture-time
   * canvas size): points replay at their stored CSS-px coordinates,
   * anchored top-left, never scaled (SPEC resolved decision #5) —
   * restoring into a smaller canvas clips the ink.
   */
  fromJSON(data: SignatureData): void;

  /**
   * Export the **committed** strokes as a PNG `{ dataURL, blob }` —
   * offscreen replay of the exact same geometry pipeline the canvas
   * renders (an in-progress stroke is excluded: exporting mid-stroke is
   * a race by definition). `trim` (default true) crops to the ink bbox
   * + `padding` (default 8); `scale` defaults to the engine's
   * devicePixelRatio; `background` defaults to the engine's option
   * (transparent when unset). An empty pad resolves to a minimal 1×1
   * transparent artifact — never rejects for emptiness.
   */
  toPNG(opts?: PNGExportOptions): Promise<{ dataURL: string; blob: Blob }>;
  /**
   * Export the **committed** strokes as a standalone SVG string built
   * from the same segment geometry as the canvas (see `strokesToSVG`).
   * Same `trim`/`padding`/`background` semantics as {@link toPNG}.
   */
  toSVG(opts?: SVGExportOptions): string;

  /**
   * Manually re-sync the backing store to the canvas's CSS size and
   * redraw (the engine's own ResizeObserver covers the normal path).
   * Strokes are preserved as-is: CSS-px coordinates, anchored top-left,
   * never scaled (SPEC resolved decision #5).
   */
  resize(): void;
  /**
   * Attach/detach the input pipeline. Detaching mid-stroke commits the
   * in-progress stroke gracefully (like `pointercancel`). Everything
   * except input keeps working while read-only.
   */
  setReadOnly(readOnly: boolean): void;
  /**
   * Remove all listeners/observers and release subscriptions.
   * Idempotent; every further *mutating* call is a no-op (pure reads —
   * the live flags, `toJSON`, `toSVG`, `toPNG` — keep working on the
   * frozen state). The last-rendered pixels are left on the canvas
   * (visible ink must not blink out during teardown).
   */
  destroy(): void;

  /**
   * Edge-only change subscription — fires once per committed state
   * change (stroke end / undo / redo / clear / fromJSON), never per
   * point. Returns an unsubscribe function.
   */
  onChange(listener: (engine: SignatureEngine) => void): () => void;
  /** Fires when a stroke begins (pointer down accepted). */
  onBegin(listener: () => void): () => void;
  /** Fires when a stroke ends (before the corresponding onChange). */
  onEnd(listener: () => void): () => void;

  /**
   * Synthetic-input seam — testing & deterministic replay. Samples flow
   * through the exact same pipeline as real pointer events (filtering,
   * smoothing, width, incremental render, history, notifications).
   * Ignored while read-only or destroyed.
   */
  ingest(sample: IngestSample): void;
}

/** In-progress stroke state. */
interface ActiveStroke {
  walker: StrokeWalker;
  color: string;
  /** Width-determining parameters captured at stroke start. */
  params: StrokeWalkerParams;
  /** Steps drawn so far — replayed on resize so live ink survives it. */
  steps: FlatStep[];
}

type UndoEntry = { type: "add" } | { type: "clear"; strokes: SignatureStroke[] };
type RedoEntry = { type: "add"; stroke: SignatureStroke } | { type: "clear" };

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function normalizePointerType(raw: string | undefined): SignaturePointerType {
  return raw === "pen" || raw === "touch" || raw === "mouse" ? raw : "mouse";
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function copyStroke(stroke: SignatureStroke): SignatureStroke {
  return {
    points: stroke.points.map((p) => ({ ...p })),
    color: stroke.color,
    minWidth: stroke.minWidth,
    maxWidth: stroke.maxWidth,
    velocityFilterWeight: stroke.velocityFilterWeight,
    pressure: stroke.pressure,
    pointerType: stroke.pointerType,
  };
}

/**
 * Create a {@link SignatureEngine} bound to `canvas`.
 *
 * The engine owns everything about its canvas (confetti precedent, SPEC
 * resolved decision #4): DPR-aware backing-store sizing (capped at ×2,
 * `dpr` override), its own `ResizeObserver` (resize preserves strokes —
 * redrawn at their CSS-px coordinates, anchored top-left, never scaled),
 * `touch-action: none` (drawing must not scroll the page), and its own
 * pointer listeners with `setPointerCapture` and a single-active-pointer
 * policy (basic palm rejection).
 *
 * Must be called in a browser-like environment (needs a canvas with a 2D
 * context); importing the module itself is SSR-safe.
 *
 * @throws If `canvas.getContext("2d")` returns `null`.
 *
 * @example
 * ```ts
 * import { createSignatureEngine } from "@usefy/signature-pad/headless";
 *
 * const engine = createSignatureEngine(canvas, { penColor: "#0f172a" });
 * const off = engine.onChange((e) => console.log("empty?", e.isEmpty));
 * // ...user signs...
 * engine.undo();
 * const draft = engine.toJSON();
 * off();
 * engine.destroy();
 * ```
 */
export function createSignatureEngine(
  canvas: HTMLCanvasElement,
  options: SignatureEngineOptions = {},
): SignatureEngine {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("@usefy/signature-pad: canvas.getContext('2d') returned null");
  }

  const opts = resolveOptions(options);
  // Sanitized ONCE here and used for the live canvas AND as the export
  // default — an unsafe background means "transparent" everywhere, so the
  // screen and the exports can never disagree. (On canvas, an invalid
  // fillStyle assignment is silently ignored and fillRect would paint
  // with the previous — near-black — fill: an invisible signature.)
  const background =
    opts.background !== undefined && isSafeCssColor(opts.background)
      ? opts.background
      : undefined;

  // toFinite: a NaN devicePixelRatio must never produce a 0×0 or NaN-sized
  // backing store (SPEC resolved decision #8).
  const envDpr = typeof window !== "undefined" ? toFinite(window.devicePixelRatio, 1) : 1;
  const baseDpr = Math.min(Math.max(envDpr > 0 ? envDpr : 1, 0.1), MAX_DPR);
  const dpr = opts.dpr !== null ? Math.min(Math.max(opts.dpr, 0.1), MAX_DPR) : baseDpr;

  /** Canvas CSS-pixel viewport. */
  let viewWidth = 0;
  let viewHeight = 0;

  const strokes: SignatureStroke[] = [];
  const undoStack: UndoEntry[] = [];
  const redoStack: RedoEntry[] = [];

  let active: ActiveStroke | null = null;
  let activePointerId: number | null = null;
  let readOnly = false;
  let destroyed = false;

  const changeListeners = new Set<(engine: SignatureEngine) => void>();
  const beginListeners = new Set<() => void>();
  const endListeners = new Set<() => void>();

  /**
   * Dispatch to a listener set: copied before iteration (listeners may
   * (un)subscribe re-entrantly) and per-listener try/catch — a throwing
   * consumer must never break the stroke pipeline or its co-listeners
   * (confetti onActiveChange semantics).
   */
  function dispatch(listeners: Set<() => void>): void {
    for (const listener of [...listeners]) {
      try {
        listener();
      } catch (error) {
        if (typeof console !== "undefined") {
          console.error("@usefy/signature-pad: listener threw", error);
        }
      }
    }
  }

  function notifyChange(): void {
    for (const listener of [...changeListeners]) {
      try {
        listener(engine);
      } catch (error) {
        if (typeof console !== "undefined") {
          console.error("@usefy/signature-pad: onChange listener threw", error);
        }
      }
    }
  }

  const renderUnderlay =
    typeof options.renderUnderlay === "function" ? options.renderUnderlay : null;

  /**
   * Full deterministic replay: background, underlay (guideline layer —
   * never part of exports), committed strokes, live stroke.
   */
  function replayAll(): void {
    clearAndFill(ctx!, viewWidth, viewHeight, background);
    if (renderUnderlay) {
      ctx!.save();
      try {
        renderUnderlay(ctx!, viewWidth, viewHeight);
      } catch (error) {
        if (typeof console !== "undefined") {
          console.error("@usefy/signature-pad: renderUnderlay threw", error);
        }
      } finally {
        ctx!.restore();
      }
    }
    replayStrokes(ctx!, strokes);
    if (active) drawSteps(ctx!, active.color, active.steps);
  }

  function resizeAndRedraw(): void {
    viewWidth = canvas.clientWidth;
    viewHeight = canvas.clientHeight;
    canvas.width = Math.max(0, Math.round(viewWidth * dpr));
    canvas.height = Math.max(0, Math.round(viewHeight * dpr));
    // Setting width/height resets the context state — re-apply the DPR
    // transform so all drawing happens in CSS pixels.
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    replayAll();
  }

  /** Sanitize an ingest sample into a point, or null when unusable. */
  function sanePoint(sample: IngestSample): SignaturePoint | null {
    if (
      !Number.isFinite(sample.x) ||
      !Number.isFinite(sample.y) ||
      !Number.isFinite(sample.time)
    ) {
      return null;
    }
    return {
      x: sample.x,
      y: sample.y,
      time: sample.time,
      pressure: clamp01(toFinite(sample.pressure, 0)),
    };
  }

  function commitActive(): void {
    if (!active) return;
    const tail = active.walker.finish();
    drawSteps(ctx!, active.color, tail);
    active.steps.push(...tail);
    strokes.push({
      points: [...active.walker.points],
      color: active.color,
      minWidth: active.params.minWidth,
      maxWidth: active.params.maxWidth,
      velocityFilterWeight: active.params.velocityFilterWeight,
      pressure: active.params.pressure,
      pointerType: active.params.pointerType,
    });
    active = null;
    undoStack.push({ type: "add" });
    redoStack.length = 0;
    dispatch(endListeners);
    notifyChange();
  }

  /**
   * The single input path — real pointer events are normalized into
   * {@link IngestSample}s and funneled through here, identically to
   * public `ingest()` calls. Returns `true` when a `down` began a stroke.
   */
  function ingestCore(sample: IngestSample): boolean {
    if (destroyed || readOnly) return false;
    switch (sample.type) {
      case "down": {
        if (active) return false; // single-active-pointer policy
        const pointerType = normalizePointerType(sample.pointerType);
        if (!opts.acceptPointerTypes.includes(pointerType)) return false;
        const point = sanePoint(sample);
        if (!point) return false;
        const params: StrokeWalkerParams = {
          minWidth: opts.minWidth,
          maxWidth: opts.maxWidth,
          velocityFilterWeight: opts.velocityFilterWeight,
          pressure: opts.pressure,
          pointerType,
        };
        active = {
          walker: createStrokeWalker(params),
          color: opts.penColor,
          params,
          steps: [],
        };
        active.walker.add(point);
        dispatch(beginListeners);
        return true;
      }
      case "move": {
        if (!active) return false;
        const point = sanePoint(sample);
        if (!point) return false;
        const points = active.walker.points;
        // Same predicate as the batch filterPoints — live and replayed
        // geometry must agree.
        if (!passesMinDistance(points[points.length - 1], point, opts.minDistance)) {
          return false;
        }
        const steps = active.walker.add(point);
        drawSteps(ctx!, active.color, steps);
        active.steps.push(...steps);
        return false;
      }
      case "up": {
        if (!active) return false;
        const point = sanePoint(sample);
        if (point) {
          const points = active.walker.points;
          if (passesMinDistance(points[points.length - 1], point, opts.minDistance)) {
            const steps = active.walker.add(point);
            drawSteps(ctx!, active.color, steps);
            active.steps.push(...steps);
          }
        }
        commitActive();
        return false;
      }
      case "cancel": {
        // Graceful end: the stroke is KEPT (SPEC §3.1) — the cancel
        // event's coordinates are untrusted and never added.
        if (!active) return false;
        commitActive();
        return false;
      }
    }
    return false;
  }

  // ── Real pointer pipeline ──────────────────────────────────────────
  function toSample(e: PointerEvent, type: IngestSample["type"]): IngestSample {
    const rect = canvas.getBoundingClientRect();
    return {
      type,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      // The EVENT's timestamp (performance.now() domain in modern
      // browsers), not handler-run time: when the main thread janks and a
      // burst of queued pointermoves dispatches in one tick, handler-time
      // deltas collapse to ~0 → velocity 0 → the ink would snap toward
      // maxWidth exactly while moving fastest. toFinite guards exotic
      // environments with degenerate timeStamps.
      time: toFinite(e.timeStamp, now()),
      pressure: e.pressure,
      pointerType: e.pointerType,
    };
  }

  function releaseCapture(pointerId: number): void {
    if (typeof canvas.releasePointerCapture === "function") {
      try {
        canvas.releasePointerCapture(pointerId);
      } catch {
        /* capture may already be gone */
      }
    }
  }

  function handlePointerDown(e: PointerEvent): void {
    // Single active pointer: while one real pointer draws, all other
    // pointers (e.g. a resting palm) are ignored entirely.
    if (activePointerId !== null) return;
    // Mouse strokes require the primary button — a right/middle click
    // must neither ink a dot nor swallow the context menu. Pen/touch
    // contact always reports button 0, so they are unaffected. The
    // `ingest` seam stays button-less by design.
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (!ingestCore(toSample(e, "down"))) return;
    activePointerId = e.pointerId;
    if (typeof canvas.setPointerCapture === "function") {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* jsdom / detached canvas — capture is best-effort */
      }
    }
    if (typeof e.preventDefault === "function") e.preventDefault();
  }

  function handlePointerMove(e: PointerEvent): void {
    if (activePointerId === null || e.pointerId !== activePointerId) return;
    ingestCore(toSample(e, "move"));
  }

  function handlePointerUp(e: PointerEvent): void {
    if (activePointerId === null || e.pointerId !== activePointerId) return;
    activePointerId = null;
    releaseCapture(e.pointerId);
    ingestCore(toSample(e, "up"));
  }

  function handlePointerCancel(e: PointerEvent): void {
    if (activePointerId === null || e.pointerId !== activePointerId) return;
    activePointerId = null;
    releaseCapture(e.pointerId);
    ingestCore(toSample(e, "cancel"));
  }

  let inputAttached = false;
  function attachInput(): void {
    if (inputAttached) return;
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerCancel);
    inputAttached = true;
  }

  function detachInput(): void {
    if (!inputAttached) return;
    canvas.removeEventListener("pointerdown", handlePointerDown);
    canvas.removeEventListener("pointermove", handlePointerMove);
    canvas.removeEventListener("pointerup", handlePointerUp);
    canvas.removeEventListener("pointercancel", handlePointerCancel);
    inputAttached = false;
    // Release the physical pointer too: a mid-stroke setReadOnly/destroy/
    // fromJSON must not leave the canvas holding pointer capture.
    if (activePointerId !== null) {
      releaseCapture(activePointerId);
      activePointerId = null;
    }
  }

  // ── Construction ───────────────────────────────────────────────────
  // `|| ""` — jsdom may report an unset touch-action as undefined; the
  // restore in destroy() must write a string either way.
  const prevTouchAction = canvas.style.touchAction || "";
  canvas.style.touchAction = "none";

  resizeAndRedraw();

  let resizeObserver: ResizeObserver | null = null;
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => {
      if (!destroyed) resizeAndRedraw();
    });
    resizeObserver.observe(canvas);
  }

  readOnly = options.readOnly === true;
  if (!readOnly) attachInput();

  const engine: SignatureEngine = {
    get isEmpty(): boolean {
      return strokes.length === 0;
    },
    get strokeCount(): number {
      return strokes.length;
    },
    get canUndo(): boolean {
      return undoStack.length > 0;
    },
    get canRedo(): boolean {
      return redoStack.length > 0;
    },

    clear(): void {
      if (destroyed || strokes.length === 0) return;
      // A single undoable action — undo restores every stroke (SPEC §3.2).
      undoStack.push({ type: "clear", strokes: strokes.slice() });
      strokes.length = 0;
      redoStack.length = 0;
      replayAll();
      notifyChange();
    },

    undo(): void {
      if (destroyed) return;
      const entry = undoStack.pop();
      if (!entry) return;
      if (entry.type === "add") {
        const stroke = strokes.pop()!;
        redoStack.push({ type: "add", stroke });
      } else {
        // Undoing a clear: all post-clear adds are necessarily already
        // undone (stack order), so the pad is exactly as the clear left
        // it — restore the removed strokes wholesale.
        strokes.push(...entry.strokes);
        redoStack.push({ type: "clear" });
      }
      replayAll();
      notifyChange();
    },

    redo(): void {
      if (destroyed) return;
      const entry = redoStack.pop();
      if (!entry) return;
      if (entry.type === "add") {
        strokes.push(entry.stroke);
        undoStack.push({ type: "add" });
      } else {
        undoStack.push({ type: "clear", strokes: strokes.slice() });
        strokes.length = 0;
      }
      replayAll();
      notifyChange();
    },

    toJSON(): SignatureData {
      return {
        v: 1,
        width: viewWidth,
        height: viewHeight,
        strokes: strokes.map(copyStroke),
      };
    },

    fromJSON(data: SignatureData): void {
      if (destroyed) return;
      if (typeof data !== "object" || data === null || !Array.isArray(data.strokes)) {
        throw new TypeError("@usefy/signature-pad: fromJSON: invalid SignatureData");
      }
      if (data.v !== 1) {
        throw new Error(
          `@usefy/signature-pad: fromJSON: unsupported version ${String((data as { v: unknown }).v)}`,
        );
      }
      // Replaces the document wholesale: any in-progress stroke is
      // dropped and history is reset (fromJSON itself is not undoable).
      active = null;
      if (activePointerId !== null) {
        releaseCapture(activePointerId);
        activePointerId = null;
      }
      strokes.length = 0;
      for (const raw of data.strokes) {
        if (typeof raw !== "object" || raw === null || !Array.isArray(raw.points)) continue;
        const points: SignaturePoint[] = [];
        for (const p of raw.points) {
          if (
            typeof p === "object" &&
            p !== null &&
            Number.isFinite(p.x) &&
            Number.isFinite(p.y) &&
            Number.isFinite(p.time)
          ) {
            points.push({
              x: p.x,
              y: p.y,
              time: p.time,
              pressure: clamp01(toFinite(p.pressure, 0)),
            });
          }
        }
        if (points.length === 0) continue;
        const minWidth = Math.max(0, toFinite(raw.minWidth, opts.minWidth));
        strokes.push({
          points,
          color: typeof raw.color === "string" ? raw.color : DEFAULT_PEN_COLOR,
          minWidth,
          maxWidth: Math.max(minWidth, toFinite(raw.maxWidth, opts.maxWidth)),
          // Self-contained stroke params (SPEC §4.1): stored values drive
          // replay; the engine's own options are only the fallback for
          // documents missing/corrupting them.
          velocityFilterWeight: clamp01(
            toFinite(raw.velocityFilterWeight, opts.velocityFilterWeight),
          ),
          pressure:
            raw.pressure === "auto" || raw.pressure === "ignore" ? raw.pressure : opts.pressure,
          pointerType: normalizePointerType(raw.pointerType),
        });
      }
      undoStack.length = 0;
      redoStack.length = 0;
      replayAll();
      notifyChange();
    },

    toPNG(exportOpts: PNGExportOptions = {}): Promise<{ dataURL: string; blob: Blob }> {
      return exportPNG(
        {
          ownerDocument: canvas.ownerDocument,
          strokes,
          viewWidth,
          viewHeight,
          defaultBackground: background,
          defaultScale: dpr,
        },
        exportOpts,
      );
    },

    toSVG(exportOpts: SVGExportOptions = {}): string {
      return strokesToSVG(
        { v: 1, width: viewWidth, height: viewHeight, strokes },
        {
          ...exportOpts,
          background:
            exportOpts.background !== undefined ? exportOpts.background : background,
        },
      );
    },

    resize(): void {
      if (destroyed) return;
      resizeAndRedraw();
    },

    setReadOnly(next: boolean): void {
      if (destroyed || next === readOnly) return;
      if (next) {
        // Commit any in-progress stroke gracefully (like pointercancel)
        // BEFORE flipping the flag — commit notifications still fire.
        commitActive();
        readOnly = true;
        detachInput();
      } else {
        readOnly = false;
        attachInput();
      }
    },

    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      // The in-progress stroke (if any) is dropped without notifications —
      // nothing may fire after destroy. Last-rendered pixels stay visible.
      active = null;
      detachInput();
      resizeObserver?.disconnect();
      resizeObserver = null;
      changeListeners.clear();
      beginListeners.clear();
      endListeners.clear();
      canvas.style.touchAction = prevTouchAction;
    },

    onChange(listener: (engine: SignatureEngine) => void): () => void {
      changeListeners.add(listener);
      return () => {
        changeListeners.delete(listener);
      };
    },

    onBegin(listener: () => void): () => void {
      beginListeners.add(listener);
      return () => {
        beginListeners.delete(listener);
      };
    },

    onEnd(listener: () => void): () => void {
      endListeners.add(listener);
      return () => {
        endListeners.delete(listener);
      };
    },

    ingest(sample: IngestSample): void {
      ingestCore(sample);
    },
  };

  return engine;
}
