/**
 * Pre-engine fallbacks shared by `useSignaturePad` and `<SignaturePad />`
 * — what the stable API surface does when no canvas is attached yet (or
 * anymore). Everything here is a SAFE no-op: reads return the minimal
 * empty artifact of the right shape, never throw for emptiness.
 *
 * Internal module — not exported from the package.
 */
import type { PNGExportOptions, SignatureData, SVGExportOptions } from "./types";
import { strokesToSVG } from "./ink/svg";
import { exportPNG } from "./engine/png";

/** The document an unattached pad reports. */
export function emptySignatureData(): SignatureData {
  return { v: 1, width: 0, height: 0, strokes: [] };
}

/** Minimal valid SVG artifact for an unattached pad. */
export function emptyToSVG(opts?: SVGExportOptions): string {
  return strokesToSVG(emptySignatureData(), opts);
}

/**
 * Minimal 1×1 PNG artifact for an unattached pad — same "never throw
 * for emptiness" contract as `engine.toPNG()`. Rejects only in a
 * DOM-less environment (exports are inherently client-side).
 */
export function emptyToPNG(opts?: PNGExportOptions): Promise<{ dataURL: string; blob: Blob }> {
  if (typeof document === "undefined") {
    return Promise.reject(
      new Error("@usefy/signature-pad: toPNG needs a DOM (no canvas attached, no document)"),
    );
  }
  return exportPNG(
    {
      ownerDocument: document,
      strokes: [],
      viewWidth: 0,
      viewHeight: 0,
      defaultBackground: undefined,
      defaultScale: 1,
    },
    opts,
  );
}
