import { QRUnsupportedError } from "./errors";
import type { ImageSource, Point, QRScanResult, Quad } from "./types";

/**
 * The platform's own `BarcodeDetector`, where it exists.
 *
 * Chrome and Edge on Android and ChromeOS implement it against the OS barcode
 * service, which is hardware-accelerated and runs off the main thread. On those
 * devices it is simply better than anything shipped in JavaScript can be, and
 * the `barcode-detector` polyfill's download numbers say the ecosystem agrees.
 *
 * What it will not tell you is everything else: version, error-correction
 * level, mask, corrected-error count, raw bytes, or whether the symbol was
 * mirrored. So a native result carries `engine: "native"` and simply omits
 * `symbol` — the honest representation of "this decoded, and that is all the
 * platform said" (SPEC §3.4). Anything needing that detail forces the internal
 * engine rather than receiving invented values.
 */

/** The slice of the Barcode Detection API this package uses. TS ships no types. */
interface BarcodeDetectorLike {
  detect(source: ImageBitmapSource): Promise<DetectedBarcodeLike[]>;
}

interface DetectedBarcodeLike {
  readonly rawValue: string;
  readonly format: string;
  readonly boundingBox?: { x: number; y: number; width: number; height: number };
  readonly cornerPoints?: ReadonlyArray<{ x: number; y: number }>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
  getSupportedFormats?(): Promise<string[]>;
}

function constructorFor(): BarcodeDetectorConstructor | undefined {
  const global = globalThis as { BarcodeDetector?: BarcodeDetectorConstructor };
  return typeof global.BarcodeDetector === "function" ? global.BarcodeDetector : undefined;
}

/**
 * Support is probed once and cached.
 *
 * `getSupportedFormats()` is a real round trip to the platform, and a scanner
 * that asked per frame would spend more time asking than decoding. The cached
 * promise also means concurrent first calls share one probe.
 */
let supportProbe: Promise<boolean> | null = null;

/** Forget the cached probe — for tests, and for a page that swapped in a polyfill. */
export function resetNativeSupport(): void {
  supportProbe = null;
  detector = null;
}

/**
 * Whether this environment can decode QR codes natively.
 *
 * Presence of the constructor is not enough: some builds expose
 * `BarcodeDetector` while supporting only 1D formats, and asking it for
 * `qr_code` then throws on the first detect rather than at construction.
 */
export function isNativeSupported(): Promise<boolean> {
  if (supportProbe) return supportProbe;

  const Detector = constructorFor();
  if (!Detector) {
    supportProbe = Promise.resolve(false);
    return supportProbe;
  }

  supportProbe = (async () => {
    try {
      const formats = await Detector.getSupportedFormats?.();
      // A build with no `getSupportedFormats` predates the format list; assume
      // QR (the format the API was introduced for) and let `detect` decide.
      return formats ? formats.includes("qr_code") : true;
    } catch {
      return false;
    }
  })();

  return supportProbe;
}

let detector: BarcodeDetectorLike | null = null;

function detectorInstance(): BarcodeDetectorLike {
  if (detector) return detector;
  const Detector = constructorFor();
  if (!Detector) {
    throw new QRUnsupportedError(
      "This browser has no BarcodeDetector. Use the default `engine: \"auto\"` to " +
        "fall back to the built-in decoder.",
    );
  }
  detector = new Detector({ formats: ["qr_code"] });
  return detector;
}

/** Corner points from the native API, normalized to this package's quad order. */
function cornersFrom(barcode: DetectedBarcodeLike): Quad {
  const points = barcode.cornerPoints;
  if (points && points.length === 4) {
    return [
      { x: points[0]!.x, y: points[0]!.y },
      { x: points[1]!.x, y: points[1]!.y },
      { x: points[2]!.x, y: points[2]!.y },
      { x: points[3]!.x, y: points[3]!.y },
    ];
  }

  // Older implementations report only a bounding box. An axis-aligned rectangle
  // is a worse overlay than the true quad, but far better than nothing — and
  // pretending we know the rotation would be a lie.
  const box = barcode.boundingBox ?? { x: 0, y: 0, width: 0, height: 0 };
  return [
    { x: box.x, y: box.y },
    { x: box.x + box.width, y: box.y },
    { x: box.x + box.width, y: box.y + box.height },
    { x: box.x, y: box.y + box.height },
  ];
}

function centreOf(corners: Quad): Point {
  let x = 0;
  let y = 0;
  for (const point of corners) {
    x += point.x;
    y += point.y;
  }
  return { x: x / 4, y: y / 4 };
}

export interface NativeDecodeOptions {
  maxSymbols?: number;
  timestamp?: number;
}

/**
 * Decode with the platform detector.
 *
 * @throws {QRUnsupportedError} when there is no native detector at all. A
 *   detector that simply finds nothing returns an empty array, which is a
 *   normal outcome and not an error.
 */
export async function decodeWithNative(
  source: ImageSource,
  options: NativeDecodeOptions = {},
): Promise<QRScanResult[]> {
  const barcodes = await detectorInstance().detect(source as ImageBitmapSource);
  const timestamp = options.timestamp ?? (typeof performance !== "undefined" ? performance.now() : Date.now());
  const limit = Math.max(1, options.maxSymbols ?? 1);

  return barcodes
    .filter((barcode) => barcode.format === "qr_code" || barcode.format === undefined)
    .slice(0, limit)
    .map((barcode) => {
      const corners = cornersFrom(barcode);
      return {
        text: barcode.rawValue,
        // The API hands back a string, so the bytes are that string's UTF-8 —
        // a re-encoding, not the symbol's original payload. For a symbol that
        // carried non-UTF-8 bytes these differ, which is exactly why `binary`
        // forces the internal engine.
        bytes: new TextEncoder().encode(barcode.rawValue),
        segments: [
          {
            mode: "byte" as const,
            text: barcode.rawValue,
            bytes: new TextEncoder().encode(barcode.rawValue),
          },
        ],
        corners,
        center: centreOf(corners),
        engine: "native" as const,
        timestamp,
      };
    });
}
