/**
 * The point in the pipeline a decode gave up at (SPEC §3.3). Reported so a
 * caller — or a dev-mode overlay — can tell "no code in this frame" apart from
 * "a code was found but is too damaged to read", which are completely
 * different problems for the person holding the camera.
 */
export type QRDecodeStage =
  /** No symbol was located in the image at all. */
  | "detect"
  /** A symbol was located but its format or version word is unreadable. */
  | "format"
  /** The codewords carry more errors than the error-correction level can absorb. */
  | "ec"
  /** The corrected data is not a valid QR bit stream. */
  | "parse";

/**
 * Thrown when an image cannot be decoded into a QR payload.
 *
 * A failed decode is a normal, expected outcome for any given camera frame, so
 * the scanning loop treats this as "try the next frame" rather than an error
 * condition. It becomes visible to a consumer through `decodeImage`/`scanFile`,
 * where the caller asked about one specific image.
 *
 * @example
 * ```ts
 * try {
 *   await decodeFile(file);
 * } catch (error) {
 *   if (error instanceof QRDecodeError && error.stage === "ec") {
 *     toast("Found a code, but it is too damaged to read — try a sharper photo.");
 *   }
 * }
 * ```
 */
export class QRDecodeError extends Error {
  readonly stage: QRDecodeStage;

  constructor(stage: QRDecodeStage, message: string, readonly cause?: unknown) {
    super(message);
    this.name = "QRDecodeError";
    this.stage = stage;
  }
}

/** Why a camera could not be opened, mapped from the underlying `DOMException`. */
export type QRCameraErrorReason =
  /** The user denied permission, or a policy blocks camera access. */
  | "denied"
  /** No camera matches the requested constraints. */
  | "not-found"
  /** A camera exists but the OS or another application is holding it. */
  | "in-use"
  /** The constraints cannot be satisfied by any available camera. */
  | "over-constrained"
  /** `getUserMedia` is unavailable — an insecure origin, or no media devices. */
  | "unsupported"
  /** Anything the platform reported that does not map to the above. */
  | "unknown";

/**
 * Thrown when the camera cannot be started. The reason is normalized because
 * every browser words its `DOMException` differently, and a UI needs to say
 * "allow camera access" versus "close the app that is using your camera" —
 * which are not the same message.
 */
export class QRCameraError extends Error {
  readonly reason: QRCameraErrorReason;

  constructor(reason: QRCameraErrorReason, message: string, readonly cause?: unknown) {
    super(message);
    this.name = "QRCameraError";
    this.reason = reason;
  }

  /**
   * Adopt a camera failure raised elsewhere.
   *
   * `@usefy/use-user-media` does the `DOMException` normalization — it owns the
   * camera, and duplicating that mapping here would give two sources of truth
   * for what "NotReadableError" means. What this package owes its consumers is
   * *its own* error type: nobody should have to import a sibling package to
   * narrow a `catch`. So the reason and message are carried across verbatim and
   * the original is kept as `cause`.
   */
  static from(error: unknown): QRCameraError {
    if (error instanceof QRCameraError) return error;

    const reason = readReason(error);
    const message =
      error instanceof Error && error.message ? error.message : "The camera could not be started.";
    return new QRCameraError(reason, message, error);
  }
}

const REASONS: ReadonlySet<string> = new Set<QRCameraErrorReason>([
  "denied",
  "not-found",
  "in-use",
  "over-constrained",
  "unsupported",
  "unknown",
]);

/** A `UserMediaError`'s `reason`, when the error carries one this package knows. */
function readReason(error: unknown): QRCameraErrorReason {
  if (typeof error !== "object" || error === null || !("reason" in error)) return "unknown";
  const reason = String((error as { reason: unknown }).reason);
  return REASONS.has(reason) ? (reason as QRCameraErrorReason) : "unknown";
}

/**
 * Thrown when a capability the caller explicitly asked for does not exist in
 * this environment — `engine: "native"` without `BarcodeDetector`, or a decode
 * attempted on the server.
 *
 * Only ever thrown for an *explicit* request: `engine: "auto"` silently uses
 * whatever is available, which is the whole point of the default.
 */
export class QRUnsupportedError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "QRUnsupportedError";
  }
}
