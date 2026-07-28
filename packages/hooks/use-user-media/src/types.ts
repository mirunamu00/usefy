/**
 * Where a stream request currently stands.
 *
 * `prompting` is its own state because it is the one the UI must *not* treat as
 * an error: the browser is showing its permission sheet and the user has not
 * answered yet. Collapsing it into "loading" is how scanners end up flashing a
 * "camera unavailable" message over the top of the permission dialog.
 */
export type UserMediaStatus =
  /** Nothing requested yet. */
  | "idle"
  /** Waiting for the user (or the OS) to answer. */
  | "prompting"
  /** A live stream is available. */
  | "granted"
  /** The user or a policy refused. */
  | "denied"
  /** `getUserMedia` does not exist here — an insecure origin, or no media stack. */
  | "unsupported"
  /** Something else went wrong; see `error`. */
  | "error";

/** Why a stream request failed, normalized across browsers. */
export type UserMediaErrorReason =
  | "denied"
  | "not-found"
  | "in-use"
  | "over-constrained"
  | "unsupported"
  | "unknown";

/**
 * A `getUserMedia` failure with a reason worth showing a user.
 *
 * Every browser words its `DOMException` differently, and "NotReadableError"
 * means nothing to anyone. The distinction that matters in a UI is between
 * "allow access" and "close the app already using your camera", and those are
 * two different `name`s that no message string reliably distinguishes.
 */
export class UserMediaError extends Error {
  readonly reason: UserMediaErrorReason;

  constructor(reason: UserMediaErrorReason, message: string, readonly cause?: unknown) {
    super(message);
    this.name = "UserMediaError";
    this.reason = reason;
  }
}

export interface UseUserMediaOptions {
  /**
   * What to request. Passing `false`/omitting video (or audio) leaves that
   * track out entirely.
   *
   * @default { video: true }
   */
  constraints?: MediaStreamConstraints;
  /**
   * Acquire as soon as the hook mounts.
   *
   * Off by default: `getUserMedia` shows a permission prompt, and a prompt the
   * user did not ask for is the fastest way to get denied permanently.
   *
   * @default false
   */
  autoStart?: boolean;
  /**
   * Preferred camera. Merged into the video constraints, and re-applied when
   * it changes — the usual way to offer a "flip camera" button.
   */
  facingMode?: "user" | "environment";
  /** Exact device to open, from {@link UseUserMediaReturn.devices}. */
  deviceId?: string;
  /** Called whenever a new stream becomes available. */
  onStream?: (stream: MediaStream) => void;
  /** Called when acquisition fails. */
  onError?: (error: UserMediaError) => void;
}

export interface UseUserMediaReturn {
  /** The live stream, or `null` when there is not one. */
  stream: MediaStream | null;
  status: UserMediaStatus;
  /** The last failure, cleared by a successful `start()`. */
  error: UserMediaError | null;
  /** Whether this environment can open a stream at all. */
  isSupported: boolean;

  /** Request (or re-request) a stream. Resolves once the attempt settles. */
  start: () => Promise<MediaStream | null>;
  /** Stop every track and drop the stream. Safe to call when already stopped. */
  stop: () => void;

  /**
   * Video input devices.
   *
   * Empty until permission has been granted once: browsers hide the list —
   * and, in Safari and Firefox, even the labels — from a page that has never
   * been allowed to see a camera.
   */
  devices: MediaDeviceInfo[];
  /** The device the current stream came from, if it reported one. */
  activeDeviceId: string | null;
  /** Open a specific device. */
  selectDevice: (deviceId: string) => Promise<MediaStream | null>;
  /** Cycle to the next video input, wrapping around. */
  switchDevice: () => Promise<MediaStream | null>;

  /** Whether the active camera reports torch support. */
  isTorchSupported: boolean;
  torch: boolean;
  /** Turn the torch on or off. Resolves `false` when the camera refused. */
  setTorch: (on: boolean) => Promise<boolean>;
}
