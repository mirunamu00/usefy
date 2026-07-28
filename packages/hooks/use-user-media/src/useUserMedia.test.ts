import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useUserMedia } from "./useUserMedia";
import { UserMediaError } from "./types";

/* ────────────────────────── media stack doubles ───────────────────────── */

interface FakeTrack {
  kind: string;
  stop: ReturnType<typeof vi.fn>;
  getSettings: () => MediaTrackSettings;
  getCapabilities: () => MediaTrackCapabilities & { torch?: boolean };
  applyConstraints: ReturnType<typeof vi.fn>;
  readyState: string;
}

function fakeTrack(deviceId = "cam-1", torch = false): FakeTrack {
  return {
    kind: "video",
    stop: vi.fn(function (this: FakeTrack) {
      this.readyState = "ended";
    }),
    getSettings: () => ({ deviceId }) as MediaTrackSettings,
    getCapabilities: () => (torch ? { torch: true } : {}) as MediaTrackCapabilities,
    applyConstraints: vi.fn(async () => {}),
    readyState: "live",
  };
}

function fakeStream(track: FakeTrack): MediaStream {
  return {
    getTracks: () => [track],
    getVideoTracks: () => [track],
  } as unknown as MediaStream;
}

interface MediaHarness {
  getUserMedia: ReturnType<typeof vi.fn>;
  enumerateDevices: ReturnType<typeof vi.fn>;
  listeners: Map<string, Array<() => void>>;
  emitDeviceChange(): void;
}

function installMediaDevices(options: {
  getUserMedia?: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
  devices?: MediaDeviceInfo[];
} = {}): MediaHarness {
  const listeners = new Map<string, Array<() => void>>();

  const getUserMedia = vi.fn(
    options.getUserMedia ?? (async () => fakeStream(fakeTrack())),
  );
  const enumerateDevices = vi.fn(async () => options.devices ?? []);

  vi.stubGlobal("navigator", {
    ...globalThis.navigator,
    mediaDevices: {
      getUserMedia,
      enumerateDevices,
      addEventListener: (type: string, listener: () => void) => {
        listeners.set(type, [...(listeners.get(type) ?? []), listener]);
      },
      removeEventListener: (type: string, listener: () => void) => {
        listeners.set(type, (listeners.get(type) ?? []).filter((entry) => entry !== listener));
      },
    },
  });

  return {
    getUserMedia,
    enumerateDevices,
    listeners,
    emitDeviceChange: () => {
      for (const listener of listeners.get("devicechange") ?? []) listener();
    },
  };
}

function videoDevice(deviceId: string, label = ""): MediaDeviceInfo {
  return { deviceId, kind: "videoinput", label, groupId: "g" } as MediaDeviceInfo;
}

function rejectWith(name: string): () => Promise<never> {
  return async () => {
    const error = new Error(name);
    error.name = name;
    throw error;
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

/* ─────────────────────────────── tests ────────────────────────────────── */

describe("support detection", () => {
  it("reports unsupported where mediaDevices is absent", async () => {
    vi.stubGlobal("navigator", { ...globalThis.navigator, mediaDevices: undefined });
    const { result } = renderHook(() => useUserMedia());

    expect(result.current.isSupported).toBe(false);
    expect(result.current.status).toBe("unsupported");

    await act(async () => {
      await result.current.start();
    });
    expect(result.current.error).toBeInstanceOf(UserMediaError);
    expect(result.current.error?.reason).toBe("unsupported");
  });
});

describe("acquiring a stream", () => {
  it("does not request the camera until asked", async () => {
    // A permission prompt the user did not ask for is the fastest way to be
    // denied permanently, so `autoStart` is off by default.
    const harness = installMediaDevices();
    renderHook(() => useUserMedia());

    await waitFor(() => expect(harness.getUserMedia).not.toHaveBeenCalled());
  });

  it("acquires on mount when autoStart is set", async () => {
    const harness = installMediaDevices();
    const { result } = renderHook(() => useUserMedia({ autoStart: true }));

    await waitFor(() => expect(result.current.status).toBe("granted"));
    expect(harness.getUserMedia).toHaveBeenCalledTimes(1);
    expect(result.current.stream).not.toBeNull();
  });

  it("passes facingMode as a preference, not an exact constraint", async () => {
    // `exact` would make a laptop with only a front camera fail outright, when
    // what the caller meant was "prefer the back one".
    const harness = installMediaDevices();
    const { result } = renderHook(() => useUserMedia({ facingMode: "environment" }));

    await act(async () => {
      await result.current.start();
    });

    expect(harness.getUserMedia).toHaveBeenCalledWith({
      video: { facingMode: "environment" },
    });
  });

  it("passes an explicit deviceId as exact, and drops facingMode", async () => {
    // A device the user picked is not a suggestion; opening a different camera
    // silently would be worse than failing.
    const harness = installMediaDevices();
    const { result } = renderHook(() =>
      useUserMedia({ facingMode: "user", deviceId: "cam-2" }),
    );

    await act(async () => {
      await result.current.start();
    });

    expect(harness.getUserMedia).toHaveBeenCalledWith({
      video: { deviceId: { exact: "cam-2" } },
    });
  });

  it("reports the stream through onStream", async () => {
    installMediaDevices();
    const onStream = vi.fn();
    const { result } = renderHook(() => useUserMedia({ onStream }));

    await act(async () => {
      await result.current.start();
    });
    expect(onStream).toHaveBeenCalledTimes(1);
  });
});

describe("failures", () => {
  it.each([
    ["NotAllowedError", "denied", "denied"],
    ["NotFoundError", "not-found", "error"],
    ["NotReadableError", "in-use", "error"],
    ["OverconstrainedError", "over-constrained", "error"],
    ["SomethingElseError", "unknown", "error"],
  ])("maps %s to reason %s", async (name, reason, status) => {
    installMediaDevices({ getUserMedia: rejectWith(name) });
    const onError = vi.fn();
    const { result } = renderHook(() => useUserMedia({ onError }));

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.error?.reason).toBe(reason);
    expect(result.current.status).toBe(status);
    expect(onError).toHaveBeenCalledTimes(1);
    // The message has to be something a user can act on, not a DOMException name.
    expect(result.current.error?.message.length).toBeGreaterThan(20);
  });

  it("clears a previous error on a successful retry", async () => {
    let fail = true;
    installMediaDevices({
      getUserMedia: async () => {
        if (fail) {
          const error = new Error("denied");
          error.name = "NotAllowedError";
          throw error;
        }
        return fakeStream(fakeTrack());
      },
    });

    const { result } = renderHook(() => useUserMedia());
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.error).not.toBeNull();

    fail = false;
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.error).toBeNull();
    expect(result.current.status).toBe("granted");
  });
});

describe("teardown — the guarantee that matters", () => {
  it("stops every track on unmount", async () => {
    // A leaked track keeps the camera light on, and users read that as spyware
    // rather than as a bug.
    const track = fakeTrack();
    installMediaDevices({ getUserMedia: async () => fakeStream(track) });

    const { result, unmount } = renderHook(() => useUserMedia({ autoStart: true }));
    await waitFor(() => expect(result.current.status).toBe("granted"));

    unmount();
    expect(track.stop).toHaveBeenCalled();
  });

  it("stops the track on stop(), and can be called again safely", async () => {
    const track = fakeTrack();
    installMediaDevices({ getUserMedia: async () => fakeStream(track) });

    const { result } = renderHook(() => useUserMedia());
    await act(async () => {
      await result.current.start();
    });

    act(() => result.current.stop());
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(result.current.stream).toBeNull();
    expect(result.current.status).toBe("idle");

    act(() => result.current.stop());
    expect(result.current.stream).toBeNull();
  });

  it("stops the previous stream when a new one is acquired", async () => {
    const first = fakeTrack("cam-1");
    const second = fakeTrack("cam-2");
    let call = 0;
    installMediaDevices({
      getUserMedia: async () => fakeStream(call++ === 0 ? first : second),
    });

    const { result } = renderHook(() => useUserMedia());
    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      await result.current.start();
    });

    expect(first.stop).toHaveBeenCalled();
    expect(second.stop).not.toHaveBeenCalled();
  });

  it("releases a stream that arrives after the component unmounted", async () => {
    // The permission sheet can stay open for a long time. If the user answers
    // after the component is gone, the stream must still be released — nobody
    // is going to render it.
    let resolveStream: ((stream: MediaStream) => void) | null = null;
    const track = fakeTrack();
    installMediaDevices({
      getUserMedia: () =>
        new Promise<MediaStream>((resolve) => {
          resolveStream = resolve;
        }),
    });

    const { result, unmount } = renderHook(() => useUserMedia());
    let pending: Promise<MediaStream | null> = Promise.resolve(null);
    act(() => {
      pending = result.current.start();
    });

    unmount();
    await act(async () => {
      resolveStream!(fakeStream(track));
      await pending;
    });

    expect(track.stop).toHaveBeenCalled();
  });

  it("releases a stream superseded by a newer request", async () => {
    const slow = fakeTrack("slow");
    const fast = fakeTrack("fast");
    let call = 0;
    const resolvers: Array<(stream: MediaStream) => void> = [];

    installMediaDevices({
      getUserMedia: () => {
        const which = call++;
        return new Promise<MediaStream>((resolve) => {
          resolvers[which] = resolve;
        });
      },
    });

    const { result } = renderHook(() => useUserMedia());
    let first: Promise<MediaStream | null> = Promise.resolve(null);
    let second: Promise<MediaStream | null> = Promise.resolve(null);

    act(() => {
      first = result.current.start();
      second = result.current.start();
    });

    await act(async () => {
      // The first request answers last — the classic out-of-order case.
      resolvers[1]!(fakeStream(fast));
      resolvers[0]!(fakeStream(slow));
      await Promise.all([first, second]);
    });

    expect(slow.stop).toHaveBeenCalled();
    expect(result.current.stream).not.toBeNull();
  });

  it("survives StrictMode's double mount without leaking or double-acquiring", async () => {
    const tracks: FakeTrack[] = [];
    installMediaDevices({
      getUserMedia: async () => {
        const track = fakeTrack(`cam-${tracks.length}`);
        tracks.push(track);
        return fakeStream(track);
      },
    });

    const { result, unmount } = renderHook(() => useUserMedia({ autoStart: true }), {
      reactStrictMode: true,
    });
    await waitFor(() => expect(result.current.status).toBe("granted"));

    unmount();
    // However many streams the double mount produced, none may survive.
    expect(tracks.length).toBeGreaterThan(0);
    for (const track of tracks) expect(track.stop).toHaveBeenCalled();
  });
});

describe("reference stability", () => {
  it("returns the same object when nothing changed", async () => {
    // A consumer re-rendering on every camera frame would otherwise churn every
    // `useEffect([camera])` and `useCallback([camera])` twelve times a second.
    installMediaDevices();
    const { result, rerender } = renderHook(() => useUserMedia());

    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
    expect(result.current.start).toBe(first.start);
    expect(result.current.stop).toBe(first.stop);
  });
});

describe("devices", () => {
  it("lists video inputs after a grant", async () => {
    // Before permission, browsers hide the list (and the labels) — which is why
    // enumeration runs after acquisition rather than on mount.
    installMediaDevices({
      devices: [
        videoDevice("cam-1", "Front"),
        videoDevice("cam-2", "Back"),
        { deviceId: "mic", kind: "audioinput", label: "Mic", groupId: "g" } as MediaDeviceInfo,
      ],
    });

    const { result } = renderHook(() => useUserMedia());
    await act(async () => {
      await result.current.start();
    });

    await waitFor(() => expect(result.current.devices).toHaveLength(2));
    expect(result.current.devices.map((device) => device.deviceId)).toEqual(["cam-1", "cam-2"]);
  });

  it("refreshes when a device is plugged in or removed", async () => {
    const harness = installMediaDevices({ devices: [videoDevice("cam-1")] });
    const { result } = renderHook(() => useUserMedia());

    await act(async () => {
      await result.current.start();
    });
    const before = harness.enumerateDevices.mock.calls.length;

    await act(async () => {
      harness.emitDeviceChange();
    });
    await waitFor(() =>
      expect(harness.enumerateDevices.mock.calls.length).toBeGreaterThan(before),
    );
  });

  it("cycles through cameras with switchDevice", async () => {
    const harness = installMediaDevices({
      devices: [videoDevice("cam-1"), videoDevice("cam-2")],
    });
    const { result } = renderHook(() => useUserMedia());

    await act(async () => {
      await result.current.start();
    });
    await waitFor(() => expect(result.current.devices).toHaveLength(2));

    await act(async () => {
      await result.current.switchDevice();
    });

    expect(harness.getUserMedia).toHaveBeenLastCalledWith({
      video: { deviceId: { exact: "cam-2" } },
    });
  });

  it("does not disturb the preview when there is nothing to switch to", async () => {
    const harness = installMediaDevices({ devices: [videoDevice("cam-1")] });
    const { result } = renderHook(() => useUserMedia());

    await act(async () => {
      await result.current.start();
    });
    const before = harness.getUserMedia.mock.calls.length;

    await act(async () => {
      await result.current.switchDevice();
    });
    expect(harness.getUserMedia.mock.calls.length).toBe(before);
    expect(result.current.stream).not.toBeNull();
  });

  it("opens an explicit device with selectDevice", async () => {
    const harness = installMediaDevices();
    const { result } = renderHook(() => useUserMedia());

    await act(async () => {
      await result.current.selectDevice("cam-9");
    });
    expect(harness.getUserMedia).toHaveBeenCalledWith({
      video: { deviceId: { exact: "cam-9" } },
    });
  });

  it("re-acquires the first time a camera is chosen, not just the second", async () => {
    // The guard used `""` as its first-run sentinel — and `""` is also what a
    // consumer who passes neither `deviceId` nor `facingMode` produces, so
    // their flip-camera button silently did nothing on its first press.
    const harness = installMediaDevices();
    const { result, rerender } = renderHook(
      ({ deviceId }: { deviceId?: string }) => useUserMedia({ deviceId }),
      { initialProps: {} as { deviceId?: string } },
    );

    await act(async () => {
      await result.current.start();
    });
    expect(harness.getUserMedia).toHaveBeenCalledTimes(1);

    await act(async () => {
      rerender({ deviceId: "cam-9" });
    });

    await waitFor(() => expect(harness.getUserMedia).toHaveBeenCalledTimes(2));
    expect(harness.getUserMedia).toHaveBeenLastCalledWith({
      video: { deviceId: { exact: "cam-9" } },
    });
  });

  it("re-acquires when the requested camera changes", async () => {
    const harness = installMediaDevices();
    const { result, rerender } = renderHook(
      ({ facingMode }: { facingMode: "user" | "environment" }) => useUserMedia({ facingMode }),
      { initialProps: { facingMode: "environment" as "user" | "environment" } },
    );

    await act(async () => {
      await result.current.start();
    });
    expect(harness.getUserMedia).toHaveBeenCalledTimes(1);

    await act(async () => {
      rerender({ facingMode: "user" });
    });

    await waitFor(() => expect(harness.getUserMedia).toHaveBeenCalledTimes(2));
    expect(harness.getUserMedia).toHaveBeenLastCalledWith({ video: { facingMode: "user" } });
  });
});

describe("torch", () => {
  it("reports support from the active track", async () => {
    installMediaDevices({ getUserMedia: async () => fakeStream(fakeTrack("cam-1", true)) });
    const { result } = renderHook(() => useUserMedia());

    expect(result.current.isTorchSupported).toBe(false);
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.isTorchSupported).toBe(true);
  });

  it("turns the torch on and off", async () => {
    const track = fakeTrack("cam-1", true);
    installMediaDevices({ getUserMedia: async () => fakeStream(track) });
    const { result } = renderHook(() => useUserMedia());

    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      expect(await result.current.setTorch(true)).toBe(true);
    });

    expect(track.applyConstraints).toHaveBeenCalledWith({ advanced: [{ torch: true }] });
    expect(result.current.torch).toBe(true);

    await act(async () => {
      await result.current.setTorch(false);
    });
    expect(result.current.torch).toBe(false);
  });

  it("reports failure when the camera refuses, rather than lying", async () => {
    // Devices do advertise torch support and then refuse — usually because the
    // camera is in a mode that cannot drive the LED. A UI that showed the torch
    // as on would be worse than one that showed the attempt failing.
    const track = fakeTrack("cam-1", true);
    track.applyConstraints = vi.fn(async () => {
      throw new Error("nope");
    });
    installMediaDevices({ getUserMedia: async () => fakeStream(track) });

    const { result } = renderHook(() => useUserMedia());
    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      expect(await result.current.setTorch(true)).toBe(false);
    });
    expect(result.current.torch).toBe(false);
  });

  it("does nothing when the camera has no torch", async () => {
    installMediaDevices();
    const { result } = renderHook(() => useUserMedia());

    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      expect(await result.current.setTorch(true)).toBe(false);
    });
  });

  it("is switched off before the track stops", async () => {
    // On several Android devices the LED survives a bare `track.stop()`,
    // leaving a torch burning with no app on screen to turn it off.
    const track = fakeTrack("cam-1", true);
    installMediaDevices({ getUserMedia: async () => fakeStream(track) });

    const { result } = renderHook(() => useUserMedia());
    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      await result.current.setTorch(true);
    });

    track.applyConstraints.mockClear();
    act(() => result.current.stop());

    expect(track.applyConstraints).toHaveBeenCalledWith({ advanced: [{ torch: false }] });
    expect(track.stop).toHaveBeenCalled();
  });

  it("resets when a new stream is acquired", async () => {
    const track = fakeTrack("cam-1", true);
    installMediaDevices({ getUserMedia: async () => fakeStream(track) });
    const { result } = renderHook(() => useUserMedia());

    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      await result.current.setTorch(true);
    });
    expect(result.current.torch).toBe(true);

    await act(async () => {
      await result.current.start();
    });
    // A fresh stream starts with the LED off, whatever the previous one did.
    expect(result.current.torch).toBe(false);
  });
});
