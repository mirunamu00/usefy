"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIsomorphicLayoutEffect } from "@usefy/use-isomorphic-layout-effect";
import { useLatest } from "@usefy/use-latest";
import type { EncodeOptions, QRMatrix, QROptions, QRSVGProps } from "./types";
import { encodeCached } from "./cache";
import { drawToCanvas } from "./render/canvas";
import { loadImage } from "./render/logo";
import { warnScannability } from "./render/warnings";
import { type PNGExport, type PNGExportOptions, toPNG } from "./render/png";
import { type RenderOptions, toSVG, toSVGProps } from "./render/svg";

/** Options for {@link useQRCode}. */
export interface UseQRCodeOptions extends QROptions {
  /** The data to encode. */
  value: string | Uint8Array;
  /** Rendered CSS size in px, used for canvas output and PNG downloads. @default 160 */
  size?: number;
  /** Accessible name, carried into `toSVG()` output. */
  title?: string;
  /** Called when encoding fails. */
  onError?: (error: Error) => void;
  /** Backing-store scale for canvas rendering. */
  dpr?: number;
}

/** Everything {@link useQRCode} hands back. */
export interface UseQRCodeReturn {
  /** The encoded symbol, or `null` when encoding failed. */
  matrix: QRMatrix | null;
  /** The encoding failure, if any. Never thrown from the hook. */
  error: Error | null;
  /** Structured SVG output for rendering as JSX. `null` when encoding failed. */
  svgProps: QRSVGProps | null;
  /**
   * Attach to a `<canvas>` to have it drawn and kept in sync. The backing
   * store is always managed here; the CSS size is filled in only if you left
   * it unset, so your own sizing wins.
   */
  canvasRef: (element: HTMLCanvasElement | null) => void;
  /** Serialize as a standalone SVG document. Returns `""` when encoding failed. */
  toSVG: (options?: RenderOptions) => string;
  /** Rasterize to a PNG. Rejects when encoding failed. */
  toPNG: (options?: PNGExportOptions) => Promise<PNGExport>;
  /** Trigger a browser download of the code. */
  download: (format?: "png" | "svg", filename?: string) => Promise<void>;
}

const ENCODE_KEYS = ["level", "version", "minVersion", "mask", "eci"] as const;

function pickEncodeOptions(options: UseQRCodeOptions): EncodeOptions {
  const encode: EncodeOptions = {};
  for (const key of ENCODE_KEYS) {
    if (options[key] !== undefined) (encode as Record<string, unknown>)[key] = options[key];
  }
  return encode;
}

/**
 * A stable signature for the style options.
 *
 * Callers write `<QRCode fg={{ type: "linear", stops: [...] }} />`, creating a
 * fresh object on every render. Depending on object identity would redraw the
 * canvas on every parent render; serializing the values means the work only
 * repeats when the *appearance* actually changed.
 */
function styleSignature(options: UseQRCodeOptions): string {
  return JSON.stringify([
    options.margin,
    options.fg,
    options.bg,
    options.moduleShape,
    options.eyeShape,
    options.eyeColor,
    options.moduleGap,
    options.logo,
    options.title,
  ]);
}

function triggerDownload(href: string, filename: string): void {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/**
 * Encode a QR code and keep a canvas (or your own markup) in sync with it.
 *
 * Encoding failures — an over-long value, an impossible version — are
 * **reported, not thrown**: a value that momentarily exceeds capacity must not
 * blank the page around it. Check `error`, or pass `onError`.
 *
 * @example
 * ```tsx
 * function Ticket({ url }: { url: string }) {
 *   const { svgProps, download } = useQRCode({ value: url, level: "Q" });
 *   if (!svgProps) return null;
 *   return (
 *     <>
 *       <svg viewBox={svgProps.viewBox} width={180}>
 *         {svgProps.paths.map((p, i) => <path key={i} d={p.d} fill={p.fill} />)}
 *       </svg>
 *       <button onClick={() => download("png")}>Download</button>
 *     </>
 *   );
 * }
 * ```
 */
export function useQRCode(options: UseQRCodeOptions): UseQRCodeReturn {
  const { value, size = 160, dpr } = options;

  const encodeKey = JSON.stringify(pickEncodeOptions(options));
  const valueKey = typeof value === "string" ? `s${value}` : `b${Array.from(value).join(",")}`;
  const styleKey = styleSignature(options);

  const optionsRef = useLatest(options);
  const onErrorRef = useLatest(options.onError);

  const { matrix, error } = useMemo(() => {
    try {
      return { matrix: encodeCached(value, pickEncodeOptions(optionsRef.current)), error: null };
    } catch (cause) {
      return { matrix: null, error: cause as Error };
    }
    // `optionsRef` is a stable ref; the string keys are the real dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueKey, encodeKey, optionsRef]);

  // Report each distinct failure exactly once. StrictMode remounts effects in
  // development, and a consumer's error toast or logger firing twice for one
  // failure is a real bug in their app, not a harmless dev artefact.
  const reported = useRef<Error | null>(null);
  useEffect(() => {
    if (!error || reported.current === error) return;
    reported.current = error;
    onErrorRef.current?.(error);
  }, [error, onErrorRef]);

  useEffect(() => {
    if (matrix) warnScannability(matrix, optionsRef.current);
  }, [matrix, styleKey, optionsRef]);

  const svgProps = useMemo(
    () => (matrix ? toSVGProps(matrix, optionsRef.current) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [matrix, styleKey, optionsRef],
  );

  // The element lives in state, not a ref, so attaching it schedules the draw.
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const canvasRef = useCallback((element: HTMLCanvasElement | null) => setCanvas(element), []);

  const logoSrc = options.logo?.src;
  const logoCrossOrigin = options.logo?.crossOrigin;
  const [logoImage, setLogoImage] = useState<CanvasImageSource | null>(null);

  useEffect(() => {
    if (!logoSrc) {
      setLogoImage(null);
      return;
    }
    let cancelled = false;
    loadImage(logoSrc, logoCrossOrigin).then(
      (image) => {
        if (!cancelled) setLogoImage(image);
      },
      () => {
        // A missing logo must not take the code down with it — the QR still
        // renders and still scans; only the decoration is absent.
        if (!cancelled) setLogoImage(null);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [logoSrc, logoCrossOrigin]);

  useIsomorphicLayoutEffect(() => {
    if (!canvas || !matrix) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    // The backing store is always ours. The CSS size is only filled in when
    // the author left it unset — otherwise a `style={{ width: "100%" }}` would
    // be silently reverted to pixels on every redraw. `<QRCode />` sets it
    // inline, so this branch is for consumers rendering their own canvas.
    if (!canvas.style.width) canvas.style.width = `${size}px`;
    if (!canvas.style.height) canvas.style.height = `${size}px`;
    drawToCanvas(context, matrix, { ...optionsRef.current, size, dpr, logoImage });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, matrix, styleKey, size, dpr, logoImage, optionsRef]);

  const serialize = useCallback(
    (overrides?: RenderOptions) =>
      matrix ? toSVG(matrix, { ...optionsRef.current, ...overrides }) : "",
    [matrix, optionsRef],
  );

  const rasterize = useCallback(
    (overrides?: PNGExportOptions) => {
      if (!matrix) {
        return Promise.reject(error ?? new Error("There is no QR code to export"));
      }
      return toPNG(matrix, {
        pixelSize: size * 2,
        ...optionsRef.current,
        ...overrides,
        logoImage: overrides?.logoImage ?? logoImage,
      });
    },
    [matrix, error, size, logoImage, optionsRef],
  );

  const download = useCallback(
    async (format: "png" | "svg" = "png", filename?: string) => {
      const name = filename ?? `qr-code.${format}`;
      if (format === "svg") {
        const blob = new Blob([serialize()], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        triggerDownload(url, name);
        // Revoked on a later task, not immediately: Firefox aborts a download
        // whose object URL is revoked in the same tick as the click.
        setTimeout(() => URL.revokeObjectURL(url), 30_000);
        return;
      }
      const { dataURL } = await rasterize();
      triggerDownload(dataURL, name);
    },
    [serialize, rasterize],
  );

  return { matrix, error, svgProps, canvasRef, toSVG: serialize, toPNG: rasterize, download };
}
