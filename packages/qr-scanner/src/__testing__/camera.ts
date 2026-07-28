import { vi } from "vitest";

/**
 * A fake camera stack for the React-layer tests.
 *
 * jsdom has no `getUserMedia`, no `<video>` playback and no frame callbacks, so
 * the scanner's loop would never run at all. These doubles supply exactly the
 * pieces the loop touches — and, importantly, let a test *drive* frames rather
 * than wait for them, so nothing here depends on timing.
 */

export interface FakeCamera {
  /** Every track handed out, so a test can assert none survived. */
  readonly tracks: FakeTrack[];
  getUserMedia: ReturnType<typeof vi.fn>;
  enumerateDevices: ReturnType<typeof vi.fn>;
  /** Advance the video element by one presented frame. */
  emitFrame(): void;
  /** Fire `loadedmetadata`, as a stream announcing its dimensions does. */
  emitMetadata(video: HTMLVideoElement, width: number, height: number): void;
  restore(): void;
}

export interface FakeTrack {
  kind: string;
  readyState: string;
  stop: ReturnType<typeof vi.fn>;
  getSettings: () => MediaTrackSettings;
  getCapabilities: () => MediaTrackCapabilities;
  applyConstraints: ReturnType<typeof vi.fn>;
}

export interface FakeCameraOptions {
  devices?: Array<{ deviceId: string; label?: string }>;
  torch?: boolean;
  /** Reject with this `DOMException` name instead of granting. */
  failWith?: string;
}

export function installFakeCamera(options: FakeCameraOptions = {}): FakeCamera {
  const tracks: FakeTrack[] = [];
  const frameCallbacks: Array<() => void> = [];

  const makeTrack = (deviceId: string): FakeTrack => {
    const track: FakeTrack = {
      kind: "video",
      readyState: "live",
      stop: vi.fn(() => {
        track.readyState = "ended";
      }),
      getSettings: () => ({ deviceId }) as MediaTrackSettings,
      getCapabilities: () =>
        (options.torch ? { torch: true } : {}) as MediaTrackCapabilities,
      applyConstraints: vi.fn(async () => {}),
    };
    tracks.push(track);
    return track;
  };

  const getUserMedia = vi.fn(async (constraints: MediaStreamConstraints) => {
    if (options.failWith) {
      const error = new Error(options.failWith);
      error.name = options.failWith;
      throw error;
    }
    const video = constraints.video;
    const requested =
      typeof video === "object" && video && "deviceId" in video
        ? ((video.deviceId as { exact?: string })?.exact ?? "cam-1")
        : (options.devices?.[0]?.deviceId ?? "cam-1");

    const track = makeTrack(requested);
    return {
      getTracks: () => [track],
      getVideoTracks: () => [track],
    } as unknown as MediaStream;
  });

  const enumerateDevices = vi.fn(async () =>
    (options.devices ?? [{ deviceId: "cam-1" }]).map(
      (device) =>
        ({
          deviceId: device.deviceId,
          label: device.label ?? "",
          kind: "videoinput",
          groupId: "g",
        }) as MediaDeviceInfo,
    ),
  );

  vi.stubGlobal("navigator", {
    ...globalThis.navigator,
    mediaDevices: {
      getUserMedia,
      enumerateDevices,
      addEventListener: () => {},
      removeEventListener: () => {},
    },
  });

  // `<video>` in jsdom never plays and never reports a size.
  const videoProto = globalThis.HTMLVideoElement.prototype;
  const originalPlay = videoProto.play;
  videoProto.play = vi.fn(async () => {}) as typeof videoProto.play;

  Object.defineProperty(videoProto, "readyState", {
    configurable: true,
    get(this: HTMLVideoElement & { _readyState?: number }) {
      return this._readyState ?? 0;
    },
  });

  // The scanner prefers `requestVideoFrameCallback`; wiring it to a queue the
  // test drains is what makes these tests deterministic instead of timed.
  (videoProto as unknown as { requestVideoFrameCallback: unknown }).requestVideoFrameCallback = vi.fn(
    (callback: () => void) => {
      frameCallbacks.push(callback);
      return frameCallbacks.length;
    },
  );
  (videoProto as unknown as { cancelVideoFrameCallback: unknown }).cancelVideoFrameCallback = vi.fn();

  return {
    tracks,
    getUserMedia,
    enumerateDevices,
    emitFrame() {
      const pending = frameCallbacks.splice(0, frameCallbacks.length);
      for (const callback of pending) callback();
    },
    emitMetadata(video, width, height) {
      Object.defineProperty(video, "videoWidth", { configurable: true, value: width });
      Object.defineProperty(video, "videoHeight", { configurable: true, value: height });
      (video as HTMLVideoElement & { _readyState?: number })._readyState = 4;
      video.dispatchEvent(new Event("loadedmetadata"));
    },
    restore() {
      videoProto.play = originalPlay;
      vi.unstubAllGlobals();
    },
  };
}
