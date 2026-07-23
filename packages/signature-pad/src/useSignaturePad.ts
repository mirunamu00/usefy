/**
 * `useSignaturePad` — the signature engine on a canvas **you** render
 * (confetti `useConfetti` pattern).
 */
import { useCallback, useRef, useState, type RefCallback } from "react";
import { useLatest } from "@usefy/use-latest";
import {
  createSignatureEngine,
  type SignatureEngine,
  type SignatureEngineOptions,
} from "./engine/createEngine";
import type { PNGExportOptions, SignatureData, SVGExportOptions } from "./types";
import { emptySignatureData, emptyToPNG, emptyToSVG } from "./reactFallbacks";

/**
 * Options for {@link useSignaturePad}.
 *
 * @example
 * ```tsx
 * const pad = useSignaturePad({
 *   penColor: "#0f172a",
 *   minDistance: 3,
 *   onEnd: () => console.log("stroke committed"),
 * });
 * ```
 */
export interface UseSignaturePadOptions extends SignatureEngineOptions {
  /** Fires when a stroke begins (latest callback always used). */
  onBegin?: () => void;
  /** Fires when a stroke ends (before the state edge). */
  onEnd?: () => void;
}

/** Reactive pad state — updated only on engine edges, never per point. */
interface PadState {
  isEmpty: boolean;
  strokeCount: number;
  canUndo: boolean;
  canRedo: boolean;
}

const DETACHED_STATE: PadState = {
  isEmpty: true,
  strokeCount: 0,
  canUndo: false,
  canRedo: false,
};

/**
 * Value returned by {@link useSignaturePad}.
 *
 * All functions are referentially stable for the component's lifetime
 * (they act on whichever engine is attached when called — no stale
 * closures). Before a canvas attaches, they are safe no-ops: reads
 * return minimal empty artifacts, mutations do nothing.
 *
 * @example
 * ```tsx
 * const pad = useSignaturePad();
 * return (
 *   <>
 *     <canvas ref={pad.canvasRef} style={{ width: "100%", height: 200 }} />
 *     <button onClick={pad.undo} disabled={!pad.canUndo}>Undo</button>
 *     <button onClick={pad.clear} disabled={pad.isEmpty}>Clear</button>
 *   </>
 * );
 * ```
 */
export interface UseSignaturePadReturn {
  /**
   * Attach this to the `<canvas>` you own. The engine is created lazily
   * on first attach and destroyed on detach/unmount; attaching a
   * different canvas destroys the old engine and creates a fresh one.
   */
  canvasRef: RefCallback<HTMLCanvasElement>;
  /** `true` while no committed strokes exist. Edge-updated. */
  isEmpty: boolean;
  /** Number of committed strokes. Edge-updated. */
  strokeCount: number;
  /** Whether {@link undo} would do anything. Edge-updated. */
  canUndo: boolean;
  /** Whether {@link redo} would do anything. Edge-updated. */
  canRedo: boolean;
  /** Wipe all ink (single undoable action). */
  clear: () => void;
  /** Undo the last stroke or clear. */
  undo: () => void;
  /** Redo the last undone action. */
  redo: () => void;
  /** Export the committed strokes as PNG (`{ dataURL, blob }`). */
  toPNG: (opts?: PNGExportOptions) => Promise<{ dataURL: string; blob: Blob }>;
  /** Export the committed strokes as a standalone SVG string. */
  toSVG: (opts?: SVGExportOptions) => string;
  /** Snapshot the committed strokes as a versioned document. */
  toJSON: () => SignatureData;
  /** Replace the signature with a stored document. */
  fromJSON: (data: SignatureData) => void;
}

/**
 * React hook for a signature pad on a canvas **you** render. The engine
 * is created lazily when the canvas attaches and destroyed when it
 * detaches or the component unmounts. State (`isEmpty`/`strokeCount`/
 * `canUndo`/`canRedo`) is driven solely by the engine's edge-only
 * `onChange` subscription — **zero React renders while a stroke is being
 * drawn**.
 *
 * `options` are read once, at engine creation (first canvas attach) —
 * attach a new canvas (or remount) to apply different options (confetti
 * precedent). `onBegin`/`onEnd` are exempt: the latest callbacks are
 * always used.
 *
 * StrictMode-safe: the dev double-invocation attaches → detaches →
 * attaches, leaving exactly one live engine and zero orphaned
 * listeners/observers.
 *
 * @example
 * ```tsx
 * import { useSignaturePad } from "@usefy/signature-pad";
 *
 * function SignatureField() {
 *   const pad = useSignaturePad({ penColor: "#0f172a" });
 *   const save = async () => {
 *     const { blob } = await pad.toPNG({ background: "#fff" });
 *     await upload(blob);
 *   };
 *   return (
 *     <div>
 *       <canvas ref={pad.canvasRef} style={{ width: "100%", height: 200 }} />
 *       <button onClick={pad.clear} disabled={pad.isEmpty}>Clear</button>
 *       <button onClick={save} disabled={pad.isEmpty}>Save</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSignaturePad(options: UseSignaturePadOptions = {}): UseSignaturePadReturn {
  const engineRef = useRef<SignatureEngine | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const optionsRef = useLatest(options);
  const [state, setState] = useState<PadState>(DETACHED_STATE);

  const canvasRef = useCallback<RefCallback<HTMLCanvasElement>>(
    (canvas) => {
      // Detach: tear the previous engine down completely.
      if (engineRef.current) {
        cleanupRef.current?.();
        cleanupRef.current = null;
        engineRef.current.destroy();
        engineRef.current = null;
        setState(DETACHED_STATE);
      }
      if (canvas) {
        const { onBegin, onEnd, ...engineOptions } = optionsRef.current;
        void onBegin;
        void onEnd;
        const engine = createSignatureEngine(canvas, engineOptions);
        engineRef.current = engine;
        // Edge-only subscription — this is the ONLY re-render source.
        // Value-bail: no-op updates must not re-render (house rule).
        const offChange = engine.onChange((e) =>
          setState((prev) =>
            prev.isEmpty === e.isEmpty &&
            prev.strokeCount === e.strokeCount &&
            prev.canUndo === e.canUndo &&
            prev.canRedo === e.canRedo
              ? prev
              : {
                  isEmpty: e.isEmpty,
                  strokeCount: e.strokeCount,
                  canUndo: e.canUndo,
                  canRedo: e.canRedo,
                },
          ),
        );
        const offBegin = engine.onBegin(() => optionsRef.current.onBegin?.());
        const offEnd = engine.onEnd(() => optionsRef.current.onEnd?.());
        cleanupRef.current = () => {
          offChange();
          offBegin();
          offEnd();
        };
      }
    },
    [optionsRef],
  );

  const clear = useCallback((): void => {
    engineRef.current?.clear();
  }, []);
  const undo = useCallback((): void => {
    engineRef.current?.undo();
  }, []);
  const redo = useCallback((): void => {
    engineRef.current?.redo();
  }, []);
  const toPNG = useCallback(
    (opts?: PNGExportOptions): Promise<{ dataURL: string; blob: Blob }> =>
      engineRef.current ? engineRef.current.toPNG(opts) : emptyToPNG(opts),
    [],
  );
  const toSVG = useCallback(
    (opts?: SVGExportOptions): string =>
      engineRef.current ? engineRef.current.toSVG(opts) : emptyToSVG(opts),
    [],
  );
  const toJSON = useCallback(
    (): SignatureData => (engineRef.current ? engineRef.current.toJSON() : emptySignatureData()),
    [],
  );
  const fromJSON = useCallback((data: SignatureData): void => {
    engineRef.current?.fromJSON(data);
  }, []);

  return {
    canvasRef,
    isEmpty: state.isEmpty,
    strokeCount: state.strokeCount,
    canUndo: state.canUndo,
    canRedo: state.canRedo,
    clear,
    undo,
    redo,
    toPNG,
    toSVG,
    toJSON,
    fromJSON,
  };
}
