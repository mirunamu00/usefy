import { QRUnsupportedError } from "./errors";
import { decodeImageData, type DecodeImageDataOptions } from "./decodeImage";
import { toImageData } from "./image/source";
import { decodeWithNative, isNativeSupported } from "./native";
import type { ImageSource, QRScanOptions, QRScanResult } from "./types";

/**
 * Choosing between the platform's decoder and the one in this package.
 *
 * The rule is "use the platform where it exists, and be complete everywhere
 * else" — but the details are what make it work in practice rather than in a
 * README, so they are all here in one place.
 */

/**
 * Options that force the internal engine regardless of preference, because the
 * native API structurally cannot answer them.
 */
function requiresInternal(options: QRScanOptions): boolean {
  return (
    options.binary === true ||
    options.invert === "always" ||
    typeof options.binarizer === "function" ||
    options.sampling === "majority5" ||
    // `region` and `maxDimension` describe *how* to look at the image, and the
    // native detector takes no such instruction — it scans the whole frame at
    // full resolution and reports coordinates accordingly. Honouring them on
    // one engine and ignoring them on the other would make an option's meaning
    // depend on the browser, which is precisely the trap this package refuses
    // to ship (SPEC §2.2). So asking for either picks the engine that can obey.
    options.region !== undefined ||
    (options.maxDimension !== undefined && options.maxDimension !== 0)
  );
}

export interface DecodeOptions extends DecodeImageDataOptions {
  /** Skip the native path even in `auto`, for this call only. */
  forceInternal?: boolean;
  /**
   * In `auto`, whether a native pass that found nothing should be followed by
   * the internal engine on the *same* image.
   *
   * `true` (the default) is right for a still image: the caller asked about one
   * picture and recall matters more than a few milliseconds. The live scanner
   * passes `false` — running both engines on every empty frame doubles the cost
   * of the most common frame there is, at twelve frames a second.
   *
   * @default true
   */
  fallbackToInternal?: boolean;
}

/**
 * Decode one image, choosing an engine.
 *
 * Order of business for `engine: "auto"`:
 *
 * 1. If any option needs detail the native API cannot supply, go internal.
 * 2. Otherwise try native. If it returns results, done.
 * 3. If native returned nothing, run the internal engine anyway. A still image
 *    is a question the caller asked once, and recall matters more there than a
 *    few milliseconds — the live scanner suppresses this second pass itself
 *    when it is deciding frame by frame.
 */
export async function decode(
  source: ImageSource,
  options: DecodeOptions = {},
): Promise<QRScanResult[]> {
  const preference = options.engine ?? "auto";

  if (preference === "internal" || options.forceInternal || requiresInternal(options)) {
    return decodeImageData(await toImageData(source), options);
  }

  const native = await isNativeSupported();

  if (preference === "native") {
    if (!native) {
      throw new QRUnsupportedError(
        'engine: "native" was requested but this browser has no BarcodeDetector ' +
          'for QR codes. Use engine: "auto" to fall back to the built-in decoder.',
      );
    }
    return decodeWithNative(source, options);
  }

  if (native) {
    // A native detector that throws (a format it advertised but cannot really
    // do, a source it dislikes) must not take the whole decode down: the
    // internal engine is right there, and a throw is a *failure* rather than a
    // miss, so it falls through even when `fallbackToInternal` is off.
    try {
      const results = await decodeWithNative(source, options);
      if (results.length > 0) return results;
      if (options.fallbackToInternal === false) return [];
    } catch {
      // fall through to the internal engine
    }
  }

  return decodeImageData(await toImageData(source), options);
}

/**
 * Decode a file, blob, or anything else a drop/paste/`<input>` hands over.
 *
 * A thin alias for {@link decode} that exists because "scan this file" reads
 * better at a call site than "decode this ImageSource", and because it is the
 * name a consumer looks for.
 */
export async function decodeFile(
  file: Blob,
  options: DecodeOptions = {},
): Promise<QRScanResult[]> {
  return decode(file, options);
}

/**
 * Decode and return the first result, or `null`.
 *
 * The common shape at a call site: most callers want one code, and `[0] ?? null`
 * at every one of them is noise.
 */
export async function decodeFirst(
  source: ImageSource,
  options: DecodeOptions = {},
): Promise<QRScanResult | null> {
  const results = await decode(source, options);
  return results[0] ?? null;
}
