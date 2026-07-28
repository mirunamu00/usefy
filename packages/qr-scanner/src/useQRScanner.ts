"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useControllableState } from "@usefy/use-controllable-state";
import { useEventCallback } from "@usefy/use-event-callback";
import { useIsomorphicLayoutEffect } from "@usefy/use-isomorphic-layout-effect";
import { usePageVisibility } from "@usefy/use-page-visibility";
import { useUserMedia, type UserMediaStatus } from "@usefy/use-user-media";
import { QRCameraError, QRDecodeError } from "./errors";
import { decode, decodeFile, type DecodeOptions } from "./engine";
import { toImageData } from "./image/source";
import type { ImageSource, QRScanOptions, QRScanResult } from "./types";
import type { WorkerScanOptions } from "./worker-protocol";

/**
 * The scanning loop: a camera, a frame pump, and a decoder.
 *
 * Everything here is about *pacing*. Decoding is not free, a camera delivers
 * frames faster than any decoder needs them, and the one thing a user notices
 * immediately is a preview that stutters. So the loop skips frames while a
 * decode is in flight, throttles to a rate rather than chasing the camera, and
 * stops entirely when the tab is hidden.
 */

/** How the scanner is currently behaving — what a UI needs to say out loud. */
export type QRScannerState =
  /** No camera requested yet. */
  | "idle"
  /** The browser is asking the user for permission. */
  | "prompting"
  /** Running: frames are being decoded. */
  | "scanning"
  /** Started, but paused (by `paused`, or by a hidden tab). */
  | "paused"
  /** Permission was refused. */
  | "denied"
  /** No camera, or no way to use one here. */
  | "unsupported"
  /** Something failed; see `error`. */
  | "error";

/**
 * Something that can decode an image — a worker, or anything else.
 *
 * The options are the *transferable* subset: a custom decoder may well live
 * behind `postMessage`, where a function `binarizer` cannot follow. Typing the
 * boundary narrowly is what makes that a compile error rather than a silently
 * ignored option.
 */
export interface Decoder {
  decode(
    source: ImageSource,
    options?: WorkerScanOptions & { timestamp?: number },
  ): Promise<QRScanResult[]>;
}

export interface UseQRScannerOptions extends QRScanOptions {
  /** Called once per distinct value, subject to `dedupeMs`. */
  onScan?: (result: QRScanResult, all: readonly QRScanResult[]) => void;
  /** Called for **every** decode, including repeats — for throughput readouts. */
  onFrame?: (results: readonly QRScanResult[]) => void;
  onError?: (error: Error) => void;
  /** Open the camera as soon as the hook mounts. @default true */
  autoStart?: boolean;
  /**
   * Hold the loop without releasing the camera.
   *
   * Controllable: pass `paused` to drive it yourself, `defaultPaused` to let
   * the component own it while still hearing about changes through
   * `onPausedChange`, or neither and use `pause()` / `resume()`.
   */
  paused?: boolean;
  /** Initial paused state when `paused` is not supplied. @default false */
  defaultPaused?: boolean;
  /** Fired whenever the paused state changes, from either side. */
  onPausedChange?: (paused: boolean) => void;
  facingMode?: "user" | "environment";
  deviceId?: string;
  constraints?: MediaTrackConstraints;
  /**
   * Maximum decodes per second.
   * @default 12
   */
  scanRate?: number;
  /**
   * How long the same value is suppressed after a hit, in milliseconds. `0`
   * reports every frame.
   * @default 1500
   */
  dedupeMs?: number;
  /** Release the camera while the tab is hidden, not just pause. @default false */
  stopOnHide?: boolean;
  /** Decode off the main thread (see {@link createWorkerDecoder}). */
  decoder?: Decoder;
}

export interface UseQRScannerReturn {
  /** Attach to a `<video>`; the hook wires up `srcObject` and playback. */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  state: QRScannerState;
  /** The most recent decode. */
  result: QRScanResult | null;
  /** Every symbol found in the most recent frame. */
  results: readonly QRScanResult[];
  error: Error | null;

  start: () => Promise<void>;
  stop: () => void;
  /** Hold the loop; the camera stays open so resuming is instant. */
  pause: () => void;
  resume: () => void;

  devices: MediaDeviceInfo[];
  activeDeviceId: string | null;
  selectDevice: (deviceId: string) => Promise<void>;
  switchCamera: () => Promise<void>;

  isTorchSupported: boolean;
  torch: boolean;
  setTorch: (on: boolean) => Promise<boolean>;

  /** Decode a file the user picked, dropped or pasted. */
  scanFile: (file: Blob) => Promise<QRScanResult[]>;
  /** The current frame's pixels — for a "scan the still image" fallback. */
  capture: () => Promise<ImageData | null>;
}

/** How many camera frames pass between attempts at an inverted (dark-mode) read. */
const INVERT_EVERY = 4;

/**
 * Consecutive empty frames after which the session stops asking the platform
 * detector and uses the internal engine for good.
 *
 * At the default twelve frames a second this is a second of pointing at
 * nothing — long enough that a user simply looking for a code never triggers
 * it, short enough that a detector which advertises QR and then never answers
 * costs at most one second before the working engine takes over.
 */
const NATIVE_MISS_STREAK = 12;

/**
 * Declared locally rather than pulled in from `@types/node` (qr-code's
 * `render/warnings.ts` precedent): this package has no Node dependency, and the
 * literal `process.env.NODE_ENV` text is what bundlers look for when stripping
 * development-only code.
 */
declare const process: { env?: { NODE_ENV?: string } } | undefined;

let warnedAboutBinarizer = false;

function warnBinarizerNotTransferable(): void {
  const isProduction = typeof process !== "undefined" && process.env?.NODE_ENV === "production";
  if (warnedAboutBinarizer || isProduction) return;
  warnedAboutBinarizer = true;
  console.warn(
    "[@usefy/qr-scanner] A function `binarizer` cannot be sent to a worker, so " +
      "frames are being decoded on the main thread instead. Use `binarizer: " +
      '"hybrid" | "otsu"` to keep the worker in play.',
  );
}

/** Whether an error came from the camera layer (a `UserMediaError`). */
function isCameraFailure(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "reason" in error &&
    (error as { name?: unknown }).name === "UserMediaError"
  );
}

function toScannerState(
  media: UserMediaStatus,
  paused: boolean,
  hasStream: boolean,
): QRScannerState {
  switch (media) {
    case "idle":
      return "idle";
    case "prompting":
      return "prompting";
    case "denied":
      return "denied";
    case "unsupported":
      return "unsupported";
    case "error":
      return "error";
    case "granted":
      return paused || !hasStream ? "paused" : "scanning";
  }
}

/**
 * Drive a camera and decode QR codes from its frames.
 *
 * @example
 * ```tsx
 * const scanner = useQRScanner({ onScan: (result) => setValue(result.text) });
 * return <video ref={scanner.videoRef} playsInline muted />;
 * ```
 */
export function useQRScanner(options: UseQRScannerOptions = {}): UseQRScannerReturn {
  const {
    onScan,
    onFrame,
    onError,
    autoStart = true,
    paused,
    defaultPaused = false,
    onPausedChange,
    facingMode = "environment",
    deviceId,
    constraints,
    scanRate = 12,
    dedupeMs = 1500,
    stopOnHide = false,
    decoder,
    ...scanOptions
  } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [results, setResults] = useState<readonly QRScanResult[]>([]);
  const [result, setResult] = useState<QRScanResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // One paused state, whoever owns it: a `paused` prop, a `defaultPaused` plus
  // `onPausedChange`, or `pause()`/`resume()`. Two separate flags — a prop and
  // an internal one — would let them disagree, and "I called resume() but the
  // prop still says paused" is a bug report nobody enjoys.
  const [effectivelyPaused, setPaused] = useControllableState<boolean>({
    value: paused,
    defaultValue: defaultPaused,
    onChange: onPausedChange,
  });

  const isVisible = usePageVisibility();

  const handleError = useEventCallback((caught: unknown) => {
    // Camera failures arrive as the hook's `UserMediaError`; they are re-typed
    // as this package's `QRCameraError` so a consumer narrows on one error type
    // from one package rather than importing a sibling's to write a `catch`.
    const normalized =
      isCameraFailure(caught) || caught instanceof QRCameraError
        ? QRCameraError.from(caught)
        : caught instanceof Error
          ? caught
          : new Error(String(caught));

    setError(normalized);
    onError?.(normalized);
  });

  const mediaConstraints = useMemo<MediaStreamConstraints>(
    () => ({ video: constraints ?? true, audio: false }),
    [constraints],
  );

  const camera = useUserMedia({
    constraints: mediaConstraints,
    autoStart,
    facingMode,
    deviceId,
    onError: handleError,
  });

  /* ───────────────────────── the frame pump ───────────────────────── */

  // Written in a layout effect rather than during render: a render React throws
  // away must not mutate a ref, and the house `useEventCallback` uses the same
  // pattern for exactly this reason.
  const decodeOptionsRef = useRef(scanOptions);
  useIsomorphicLayoutEffect(() => {
    decodeOptionsRef.current = scanOptions;
  });

  const emitScan = useEventCallback((frame: readonly QRScanResult[]) => {
    onFrame?.(frame);
    if (frame.length === 0) return;

    setResults(frame);
    const now = frame[0]!.timestamp;

    for (const candidate of frame) {
      const previous = seenRef.current.get(candidate.text);
      if (previous !== undefined && dedupeMs > 0 && now - previous < dedupeMs) continue;
      seenRef.current.set(candidate.text, now);
      setResult(candidate);
      onScan?.(candidate, frame);
    }

    // The dedupe map is per-session, and a long shift at a checkout desk would
    // otherwise grow it without bound.
    if (seenRef.current.size > 256) {
      for (const [value, at] of seenRef.current) {
        if (now - at > dedupeMs) seenRef.current.delete(value);
      }
    }
  });

  const seenRef = useRef(new Map<string, number>());
  const runningRef = useRef(false);
  const inFlightRef = useRef(false);
  const frameCountRef = useRef(0);
  const lastDecodeRef = useRef(0);
  const mountedRef = useRef(true);
  const bufferRef = useRef<Uint8ClampedArray | undefined>(undefined);
  /** Consecutive frames the native detector found nothing in. */
  const nativeMissesRef = useRef(0);
  /** Once the native path has proven unhelpful, the session stays internal. */
  const nativeGaveUpRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const decodeFrame = useEventCallback(async (video: HTMLVideoElement) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      const frameIndex = frameCountRef.current++;
      // The inverted (light-on-dark) pass doubles the cost of a frame that
      // found nothing, so the live loop pays for it once every few frames
      // rather than on every one. A still image gets it every time — that is
      // `decodeFile`'s call, not this one's.
      const invert = frameIndex % INVERT_EVERY === 0 ? "auto" : "never";

      // The luminance plane is the biggest per-frame allocation, and at twelve
      // frames a second a fresh one is megabytes of garbage a minute. One
      // buffer sized for the full frame serves every working resolution,
      // because `toGray` takes a subarray of whatever it is handed.
      const pixels = video.videoWidth * video.videoHeight;
      if (pixels > 0 && (!bufferRef.current || bufferRef.current.length < pixels)) {
        bufferRef.current = new Uint8ClampedArray(pixels);
      }

      const request: DecodeOptions = {
        ...decodeOptionsRef.current,
        invert: decodeOptionsRef.current.invert ?? invert,
        buffer: bufferRef.current,
        timestamp: performance.now(),
        // On a live camera the native detector gets the frame to itself: running
        // the internal engine too, on every frame that found nothing, doubles
        // the cost of the most common frame there is. A still image is the
        // opposite trade and keeps the fallback (`engine.ts`).
        fallbackToInternal: false,
        forceInternal: nativeGaveUpRef.current || undefined,
      };

      // A custom binarizer is a function, and functions do not survive
      // `postMessage`. Rather than dropping it silently — which would leave a
      // consumer debugging why their thresholding never runs — the frame goes
      // to the main thread, honouring the explicit choice over the implicit
      // performance preference, and dev mode says so once.
      const workerCanRun = typeof request.binarizer !== "function";
      if (decoder && !workerCanRun) warnBinarizerNotTransferable();

      const frame =
        decoder && workerCanRun
          ? await decoder.decode(video, request as WorkerScanOptions & { timestamp?: number })
          : await decode(video, request);

      // Decoding is async; the component can be gone by the time it answers,
      // and delivering a scan to a component that no longer exists is a bug in
      // the consumer's app that they did not write.
      if (!mountedRef.current) return;

      // ── The native miss-streak switch ──
      // `BarcodeDetector` is faster when it works, but some builds advertise QR
      // and then quietly find nothing (a symbology they only partly implement,
      // a frame format they dislike). Rather than scanning forever with a
      // detector that never answers, the session gives up on it after a run of
      // empty frames and stays internal.
      if (!nativeGaveUpRef.current && !decoder) {
        if (frame.length > 0) {
          nativeMissesRef.current = 0;
        } else if (++nativeMissesRef.current >= NATIVE_MISS_STREAK) {
          nativeGaveUpRef.current = true;
        }
      }

      emitScan(frame);
    } catch (caught) {
      // A frame that cannot be decoded is the normal case, not an error — only
      // a camera or environment failure is worth surfacing.
      if (mountedRef.current && !(caught instanceof QRDecodeError)) handleError(caught);
    } finally {
      inFlightRef.current = false;
    }
  });

  useEffect(() => {
    const video = videoRef.current;
    const stream = camera.stream;
    if (!video || !stream) return;

    video.srcObject = stream;
    // Two guards in one line. `play()` rejects if the element is removed
    // mid-call, which is routine during navigation and not worth reporting —
    // and it returns `undefined` rather than a promise in older engines, where
    // an unguarded `.catch` is a TypeError that takes the scanner down.
    void video.play()?.catch(() => {});

    return () => {
      video.srcObject = null;
    };
  }, [camera.stream]);

  // A hidden tab stops the loop whether or not the camera is released: decoding
  // frames nobody can see is pure battery.
  const active = !effectivelyPaused && isVisible && camera.status === "granted";

  useEffect(() => {
    if (!active) return;
    const video = videoRef.current;
    if (!video) return;

    runningRef.current = true;
    const interval = 1000 / Math.max(1, scanRate);
    let handle = 0;
    let frameHandle = 0;

    const tick = (): void => {
      if (!runningRef.current) return;

      const now = performance.now();
      if (now - lastDecodeRef.current >= interval && video.readyState >= 2) {
        lastDecodeRef.current = now;
        void decodeFrame(video);
      }
      schedule();
    };

    const schedule = (): void => {
      if (!runningRef.current) return;
      // `requestVideoFrameCallback` fires once per *presented* frame, so the
      // loop never decodes the same picture twice and never spins between
      // frames. rAF is the fallback where it does not exist (Firefox).
      if (typeof video.requestVideoFrameCallback === "function") {
        frameHandle = video.requestVideoFrameCallback(() => tick());
      } else {
        handle = requestAnimationFrame(() => tick());
      }
    };

    schedule();

    return () => {
      runningRef.current = false;
      if (handle) cancelAnimationFrame(handle);
      if (frameHandle && typeof video.cancelVideoFrameCallback === "function") {
        video.cancelVideoFrameCallback(frameHandle);
      }
    };
  }, [active, scanRate, decodeFrame]);

  // Releasing the camera while hidden is opt-in: it frees the LED and the
  // sensor, but re-acquiring costs a permission-free round trip and a visible
  // black frame, which is the wrong trade for a scanner the user is switching
  // back to in a second.
  const hiddenReleaseRef = useRef(false);
  useEffect(() => {
    if (!stopOnHide) return;

    if (!isVisible) {
      hiddenReleaseRef.current = true;
      camera.stop();
      return;
    }

    // Only re-acquire what *this* effect released. On mount the tab is visible
    // and `useUserMedia` has already acquired (or deliberately not, if
    // `autoStart` is false); starting again here would mean two `getUserMedia`
    // calls, a superseded stream, and a visible blink of the camera LED.
    if (hiddenReleaseRef.current) {
      hiddenReleaseRef.current = false;
      if (autoStart) void camera.start();
    }
  }, [isVisible, stopOnHide, autoStart, camera]);

  /* ───────────────────────── imperative API ───────────────────────── */

  // Each of these depends on one *stable* function from the camera hook rather
  // than on the whole object. Depending on `camera` would make every action's
  // identity change on every render — and a consumer's `useEffect([scanner])`
  // would then re-run on every decoded frame.
  const cameraStart = camera.start;
  const cameraStop = camera.stop;
  const cameraSelect = camera.selectDevice;
  const cameraSwitch = camera.switchDevice;

  const start = useCallback(async () => {
    setError(null);
    await cameraStart();
  }, [cameraStart]);

  const stop = useCallback(() => {
    runningRef.current = false;
    cameraStop();
  }, [cameraStop]);

  const pause = useCallback(() => setPaused(true), [setPaused]);
  const resume = useCallback(() => setPaused(false), [setPaused]);

  const selectDevice = useCallback(
    async (id: string) => {
      await cameraSelect(id);
    },
    [cameraSelect],
  );

  const switchCamera = useCallback(async () => {
    await cameraSwitch();
  }, [cameraSwitch]);

  const scanFile = useCallback(
    async (file: Blob) => {
      setError(null);
      try {
        const found = await decodeFile(file, decodeOptionsRef.current);
        emitScan(found);
        return found;
      } catch (caught) {
        handleError(caught);
        return [];
      }
    },
    [emitScan, handleError],
  );

  const capture = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;
    try {
      return await toImageData(video);
    } catch {
      return null;
    }
  }, []);

  const state = toScannerState(camera.status, effectivelyPaused || !isVisible, camera.stream !== null);

  // Memoized for the same reason the camera hook's return is: a scanner
  // re-renders on every decoded frame, and a fresh object each time would churn
  // every consumer's dependency array twelve times a second.
  return useMemo(
    () => ({
      videoRef,
      state,
      result,
      results,
      // `camera.error` is only reached if the hook set one without calling
      // `onError` — it is re-typed here for the same reason as above, so `error`
      // is always this package's own type whatever route it took.
      error: error ?? (camera.error ? QRCameraError.from(camera.error) : null),
      start,
      stop,
      pause,
      resume,
      devices: camera.devices,
      activeDeviceId: camera.activeDeviceId,
      selectDevice,
      switchCamera,
      isTorchSupported: camera.isTorchSupported,
      torch: camera.torch,
      setTorch: camera.setTorch,
      scanFile,
      capture,
    }),
    [
      state,
      result,
      results,
      error,
      camera.error,
      camera.devices,
      camera.activeDeviceId,
      camera.isTorchSupported,
      camera.torch,
      camera.setTorch,
      start,
      stop,
      pause,
      resume,
      selectDevice,
      switchCamera,
      scanFile,
      capture,
    ],
  );
}

/** Re-exported so a consumer can narrow on the camera's own failure type. */
export { QRCameraError };
