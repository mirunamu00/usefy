import { UserMediaError, type UserMediaErrorReason } from "./types";

/** Whether this environment can open a media stream at all. */
export function isUserMediaSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices !== "undefined" &&
    typeof navigator.mediaDevices.getUserMedia === "function"
  );
}

/** Whether device enumeration is available (it can be missing where capture is not). */
export function isEnumerationSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices !== "undefined" &&
    typeof navigator.mediaDevices.enumerateDevices === "function"
  );
}

const REASONS: Readonly<Record<string, UserMediaErrorReason>> = {
  NotAllowedError: "denied",
  PermissionDeniedError: "denied",
  SecurityError: "denied",
  NotFoundError: "not-found",
  DevicesNotFoundError: "not-found",
  NotReadableError: "in-use",
  TrackStartError: "in-use",
  OverconstrainedError: "over-constrained",
  ConstraintNotSatisfiedError: "over-constrained",
};

const MESSAGES: Readonly<Record<UserMediaErrorReason, string>> = {
  denied: "Access was denied. Allow camera and microphone permission for this site and try again.",
  "not-found": "No matching camera or microphone was found on this device.",
  "in-use": "The device is already in use by another application.",
  "over-constrained": "No device matches the requested constraints.",
  unsupported:
    "Media capture is unavailable here. It needs a secure context (HTTPS or localhost) and a browser with mediaDevices.",
  unknown: "The media stream could not be started.",
};

/** Turn a `getUserMedia` rejection into a typed error with an actionable message. */
export function toUserMediaError(error: unknown): UserMediaError {
  if (error instanceof UserMediaError) return error;

  const name =
    typeof error === "object" && error !== null && "name" in error
      ? String((error as { name: unknown }).name)
      : "";
  const reason = REASONS[name] ?? "unknown";
  const detail =
    reason === "unknown" && error instanceof Error && error.message
      ? `${MESSAGES.unknown} ${error.message}`
      : MESSAGES[reason];

  return new UserMediaError(reason, detail, error);
}

/**
 * Stop every track on a stream, turning the torch off first.
 *
 * Called from more places than seems necessary — unmount, `stop()`, replacing
 * a stream, a failed device switch — because a track left running keeps the
 * camera light on, and users read that as spyware, not as a bug.
 *
 * The torch needs its own instruction: on several Android devices the LED
 * survives a bare `track.stop()`, leaving a torch burning with no app on screen
 * to turn it off. `applyConstraints` is asynchronous and this function is not —
 * deliberately, because `stop()` must be safe to call from a cleanup function.
 * The request is fired and the track is stopped immediately after; the LED goes
 * out either way, and waiting would risk the stop never happening at all.
 */
export function stopStream(stream: MediaStream | null): void {
  if (!stream) return;

  for (const track of stream.getTracks()) {
    try {
      if (track.kind === "video" && supportsTorch(stream)) {
        void (track as MediaStreamTrack)
          .applyConstraints({ advanced: [{ torch: false }] } as unknown as MediaTrackConstraints)
          .catch(() => {
            // A camera that refuses is no worse off than one that was never asked.
          });
      }
      track.stop();
    } catch {
      // A track already ended by the OS throws on some browsers; that is the
      // outcome we wanted anyway.
    }
  }
}

/** Merge `facingMode`/`deviceId` into a constraints object without mutating it. */
export function withVideoPreferences(
  constraints: MediaStreamConstraints,
  preferences: { facingMode?: "user" | "environment"; deviceId?: string },
): MediaStreamConstraints {
  if (constraints.video === false || constraints.video === undefined) return constraints;
  if (preferences.deviceId === undefined && preferences.facingMode === undefined) return constraints;

  const base: MediaTrackConstraints = constraints.video === true ? {} : { ...constraints.video };

  if (preferences.deviceId !== undefined) {
    // `exact` on purpose: a device the user explicitly picked is not a
    // suggestion, and silently opening a different camera is worse than failing.
    base.deviceId = { exact: preferences.deviceId };
    // A specific device and a facing mode can contradict each other, and the
    // explicit choice wins.
    delete base.facingMode;
  } else if (preferences.facingMode !== undefined) {
    // Not `exact`: a laptop with only a front camera should still open it
    // rather than refuse, and "prefer the back one" is what callers mean.
    base.facingMode = preferences.facingMode;
  }

  return { ...constraints, video: base };
}

/** The `deviceId` a stream's video track came from, when it reports one. */
export function activeDeviceIdOf(stream: MediaStream | null): string | null {
  const track = stream?.getVideoTracks()[0];
  if (!track) return null;
  const settings = typeof track.getSettings === "function" ? track.getSettings() : undefined;
  return settings?.deviceId ?? null;
}

/** Whether a stream's video track advertises torch support. */
export function supportsTorch(stream: MediaStream | null): boolean {
  const track = stream?.getVideoTracks()[0];
  if (!track || typeof track.getCapabilities !== "function") return false;
  const capabilities = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
  return capabilities.torch === true;
}
