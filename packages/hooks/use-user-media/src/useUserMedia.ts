import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

/**
 * `useLayoutEffect` where there is a DOM, `useEffect` where there is not.
 *
 * Written out rather than imported from `@usefy/use-isomorphic-layout-effect`
 * so this package keeps its zero-dependency promise — four lines is a smaller
 * cost than a dependency in every consumer's tree.
 */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
import {
  UserMediaError,
  type UseUserMediaOptions,
  type UseUserMediaReturn,
  type UserMediaStatus,
} from "./types";
import {
  activeDeviceIdOf,
  isEnumerationSupported,
  isUserMediaSupported,
  stopStream,
  supportsTorch,
  toUserMediaError,
  withVideoPreferences,
} from "./utils";

/**
 * Acquire and manage a camera or microphone stream.
 *
 * `getUserMedia` looks like a one-line API and is not: the stream has to be
 * released on unmount or the camera light stays on, permission has to be
 * granted before device labels are even visible, switching cameras means
 * tearing down and re-acquiring, and every browser words its failures
 * differently. This packages all of that, including the parts that are only
 * obvious after they have gone wrong in front of a user.
 *
 * @example
 * ```tsx
 * const camera = useUserMedia({ facingMode: "environment" });
 *
 * return camera.stream
 *   ? <video ref={(el) => el && (el.srcObject = camera.stream)} autoPlay playsInline muted />
 *   : <button onClick={camera.start}>Start camera</button>;
 * ```
 */
export function useUserMedia(options: UseUserMediaOptions = {}): UseUserMediaReturn {
  const {
    constraints = { video: true },
    autoStart = false,
    facingMode,
    deviceId,
    onStream,
    onError,
  } = options;

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<UserMediaStatus>(() =>
    isUserMediaSupported() ? "idle" : "unsupported",
  );
  const [error, setError] = useState<UserMediaError | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [torch, setTorchState] = useState(false);

  // Every mutable value the async acquisition path reads lives in a ref, so a
  // request in flight is never confused by a re-render — and so the effect that
  // owns teardown does not re-run when a callback identity changes.
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef(0);
  const mountedRef = useRef(true);
  const optionsRef = useRef({ constraints, facingMode, deviceId, onStream, onError });
  // Assigned in an effect, not during render: a render React discards must not
  // mutate a ref. A layout effect rather than a passive one, so the value is in
  // place before any other effect — including this hook's own acquisition — runs.
  useIsomorphicLayoutEffect(() => {
    optionsRef.current = { constraints, facingMode, deviceId, onStream, onError };
  });

  const isSupported = isUserMediaSupported();

  /** Enumerate video inputs. Labels only appear after a grant, so this re-runs. */
  const refreshDevices = useCallback(async () => {
    if (!isEnumerationSupported()) return;
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      if (!mountedRef.current) return;
      setDevices(all.filter((device) => device.kind === "videoinput"));
    } catch {
      // Enumeration is a convenience; a browser that refuses it should not
      // take the stream down with it.
    }
  }, []);

  const stop = useCallback(() => {
    // Bump the request id so any acquisition still in flight discards its
    // result instead of quietly re-opening the camera after `stop()`.
    requestRef.current++;
    stopStream(streamRef.current);
    streamRef.current = null;
    setStream(null);
    setTorchState(false);
    setStatus((previous) => (previous === "unsupported" ? previous : "idle"));
  }, []);

  const acquire = useCallback(
    async (overrides: { deviceId?: string; facingMode?: "user" | "environment" } = {}) => {
      if (!isUserMediaSupported()) {
        const unsupported = new UserMediaError(
          "unsupported",
          "Media capture is unavailable here. It needs a secure context (HTTPS or " +
            "localhost) and a browser with mediaDevices.",
        );
        if (mountedRef.current) {
          setStatus("unsupported");
          setError(unsupported);
        }
        optionsRef.current.onError?.(unsupported);
        return null;
      }

      const request = ++requestRef.current;
      setStatus("prompting");
      setError(null);

      const current = optionsRef.current;
      const requested = withVideoPreferences(current.constraints, {
        deviceId: overrides.deviceId ?? current.deviceId,
        facingMode: overrides.facingMode ?? current.facingMode,
      });

      try {
        const next = await navigator.mediaDevices.getUserMedia(requested);

        // A newer request (or a `stop()`) superseded this one while the
        // permission sheet was open. Releasing immediately is the whole point:
        // this is the stream nobody is going to render, and leaving it running
        // is a camera light with no UI attached to it.
        if (request !== requestRef.current || !mountedRef.current) {
          stopStream(next);
          return null;
        }

        stopStream(streamRef.current);
        streamRef.current = next;
        setStream(next);
        setStatus("granted");
        setTorchState(false);
        current.onStream?.(next);
        void refreshDevices();
        return next;
      } catch (caught) {
        const failure = toUserMediaError(caught);
        if (request === requestRef.current && mountedRef.current) {
          setStatus(failure.reason === "denied" ? "denied" : "error");
          setError(failure);
        }
        current.onError?.(failure);
        return null;
      }
    },
    [refreshDevices],
  );

  const start = useCallback(() => acquire(), [acquire]);

  const selectDevice = useCallback(
    (nextDeviceId: string) => acquire({ deviceId: nextDeviceId }),
    [acquire],
  );

  const switchDevice = useCallback(async () => {
    const list = devices.length > 0 ? devices : [];
    if (list.length < 2) {
      // Nothing to switch to. Re-acquiring anyway would flash the preview for
      // no reason, so this is a no-op that keeps the current stream.
      return streamRef.current;
    }
    const active = activeDeviceIdOf(streamRef.current);
    const index = list.findIndex((device) => device.deviceId === active);
    const next = list[(index + 1) % list.length]!;
    return acquire({ deviceId: next.deviceId });
  }, [acquire, devices]);

  const setTorch = useCallback(async (on: boolean) => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || !supportsTorch(streamRef.current)) return false;

    try {
      // `torch` is not in the standard `MediaTrackConstraintSet` — it comes from
      // the Image Capture draft — so TypeScript's DOM types do not know it,
      // even though every browser that implements the LED accepts it exactly
      // here. The double cast is the honest way to say "the platform's types
      // are behind the platform".
      await track.applyConstraints({
        advanced: [{ torch: on }],
      } as unknown as MediaTrackConstraints);
      if (mountedRef.current) setTorchState(on);
      return true;
    } catch {
      // Some devices advertise torch support and then refuse — often because
      // the camera is in a mode that cannot drive the LED.
      return false;
    }
  }, []);

  // Device list changes (a webcam plugged in, a phone rotated into a dock).
  useEffect(() => {
    if (!isEnumerationSupported()) return;
    const target = navigator.mediaDevices;
    const handler = (): void => void refreshDevices();
    target.addEventListener?.("devicechange", handler);
    return () => target.removeEventListener?.("devicechange", handler);
  }, [refreshDevices]);

  // Re-acquire when the caller changes which camera it wants.
  //
  // The first run is tracked with its own flag rather than by comparing against
  // an empty string: `""` is a perfectly legitimate value (no `deviceId`, no
  // `facingMode`), and using it as the sentinel meant a consumer who mounted
  // with neither and then set one got no re-acquisition at all — a flip-camera
  // button that silently did nothing on its first press.
  const firstWantRef = useRef(true);
  const wantedRef = useRef<string>("");
  const wanted = `${deviceId ?? ""}|${facingMode ?? ""}`;
  useEffect(() => {
    const previous = wantedRef.current;
    wantedRef.current = wanted;
    if (firstWantRef.current) {
      firstWantRef.current = false;
      return;
    }
    if (previous !== wanted && streamRef.current) void acquire();
  }, [wanted, acquire]);

  useEffect(() => {
    mountedRef.current = true;
    if (autoStart) void acquire();

    return () => {
      mountedRef.current = false;
      // The one guarantee that matters most: no track survives this component.
      // StrictMode mounts twice, so this runs twice — `stopStream` is
      // deliberately safe to call on an already-stopped stream.
      requestRef.current++;
      stopStream(streamRef.current);
      streamRef.current = null;
    };
    // `acquire` is stable and `autoStart` is read once, on purpose: a change to
    // either must not tear down a live camera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Memoized so the object's identity only changes when something in it does.
  // Without this, every consumer's `useCallback([camera])` and `useEffect`
  // churns on every render of the component holding the hook — which, for a
  // scanner re-rendering on each decoded frame, means listeners being torn down
  // and re-added twelve times a second.
  return useMemo(
    () => ({
      stream,
      status,
      error,
      isSupported,
      start,
      stop,
      devices,
      activeDeviceId: activeDeviceIdOf(stream),
      selectDevice,
      switchDevice,
      isTorchSupported: supportsTorch(stream),
      torch,
      setTorch,
    }),
    [stream, status, error, isSupported, start, stop, devices, selectDevice, switchDevice, torch, setTorch],
  );
}
