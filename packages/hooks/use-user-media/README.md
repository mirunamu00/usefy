<p align="center">
  <img src="https://raw.githubusercontent.com/mirunamu00/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-user-media</h1>

<p align="center">
  <strong>Camera and microphone streams — getUserMedia lifecycle, device switching, torch, and a teardown you can rely on.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-user-media"><img src="https://img.shields.io/npm/v/@usefy/use-user-media.svg?style=flat-square&color=007acc" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@usefy/use-user-media"><img src="https://img.shields.io/npm/dm/@usefy/use-user-media.svg?style=flat-square&color=007acc" alt="npm downloads" /></a>
  <a href="https://bundlephobia.com/package/@usefy/use-user-media"><img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-user-media?style=flat-square&color=007acc" alt="bundle size" /></a>
  <a href="https://github.com/mirunamu00/usefy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@usefy/use-user-media.svg?style=flat-square&color=007acc" alt="license" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://mirunamu00.github.io/usefy/?path=/docs/hooks-useusermedia--docs" target="_blank" rel="noopener noreferrer">
    <strong>📚 View Storybook Demo</strong>
  </a>
</p>

---

## Overview

`useUserMedia` is part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem — a collection of production-ready, TypeScript-first, SSR-safe React hooks.

`getUserMedia` looks like a one-line API and is not. The stream has to be released on unmount or the camera light stays on. Device labels are invisible until permission has been granted once. Switching cameras means tearing down and re-acquiring. Every browser words its failures differently, and "NotReadableError" means nothing to a user. This hook packages all of that — including the parts that only become obvious after they have gone wrong in front of someone.

## Features

- **Teardown you can rely on** — every track is stopped on unmount, on `stop()`, and when a stream is replaced. A stream that arrives *after* the component unmounted (the user answered the permission sheet late) is released too, because nobody is going to render it.
- **Race-safe acquisition** — a superseded request discards its result instead of quietly re-opening the camera; out-of-order resolutions cannot leave the wrong stream live.
- **Honest states** — `idle · prompting · granted · denied · unsupported · error`. `prompting` is its own state because a UI must not show "camera unavailable" over the top of the permission dialog.
- **Actionable errors** — every `DOMException` is normalized to a reason (`denied`, `not-found`, `in-use`, `over-constrained`, `unsupported`) with a message a user can act on.
- **Devices and switching** — enumerate video inputs, cycle through them, or open one by id (as an `exact` constraint, because a device the user picked is not a suggestion).
- **Torch** — capability-probed, and reports failure rather than lying when a device advertises support and then refuses.
- **Opt-in by default** — a permission prompt nobody asked for is the fastest way to be denied permanently, so nothing opens until you call `start()`.
- **SSR-safe & StrictMode-safe** — reports `unsupported` on the server; the double mount leaks nothing.

## Installation

```bash
npm install @usefy/use-user-media
# or
pnpm add @usefy/use-user-media
# or
yarn add @usefy/use-user-media
```

## Quick Start

```tsx
import { useUserMedia } from "@usefy/use-user-media";

function CameraPreview() {
  const camera = useUserMedia({ facingMode: "environment" });

  if (camera.status === "unsupported") return <p>No camera here.</p>;
  if (camera.status === "denied") return <p>{camera.error?.message}</p>;

  return camera.stream ? (
    <video
      ref={(element) => {
        if (element) element.srcObject = camera.stream;
      }}
      autoPlay
      playsInline
      muted
    />
  ) : (
    <button onClick={camera.start}>Start camera</button>
  );
}
```

### Switching cameras and using the torch

```tsx
const camera = useUserMedia({ facingMode: "environment" });

<>
  {camera.devices.length > 1 && (
    <button onClick={() => camera.switchDevice()}>Flip camera</button>
  )}
  {camera.isTorchSupported && (
    <button onClick={() => camera.setTorch(!camera.torch)}>
      {camera.torch ? "Torch off" : "Torch on"}
    </button>
  )}
</>;
```

## API

### `useUserMedia(options?)`

#### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `constraints` | `MediaStreamConstraints` | `{ video: true }` | What to request |
| `autoStart` | `boolean` | `false` | Acquire on mount |
| `facingMode` | `"user" \| "environment"` | — | Preferred camera; merged as a *preference*, not `exact` |
| `deviceId` | `string` | — | Open one specific device (as `exact`) |
| `onStream` | `(stream) => void` | — | Called whenever a new stream becomes available |
| `onError` | `(error: UserMediaError) => void` | — | Called when acquisition fails |

Changing `facingMode` or `deviceId` while a stream is live re-acquires automatically — the usual way to build a "flip camera" button.

#### Returns

| Field | Type | Description |
|---|---|---|
| `stream` | `MediaStream \| null` | The live stream |
| `status` | `UserMediaStatus` | `idle · prompting · granted · denied · unsupported · error` |
| `error` | `UserMediaError \| null` | Cleared by a successful `start()` |
| `isSupported` | `boolean` | Whether this environment can open a stream at all |
| `start()` | `() => Promise<MediaStream \| null>` | Request (or re-request) a stream |
| `stop()` | `() => void` | Stop every track. Safe to call repeatedly |
| `devices` | `MediaDeviceInfo[]` | Video inputs — empty until permission is granted once |
| `activeDeviceId` | `string \| null` | The device the current stream came from |
| `selectDevice(id)` | `(id) => Promise<MediaStream \| null>` | Open a specific device |
| `switchDevice()` | `() => Promise<MediaStream \| null>` | Cycle to the next camera |
| `isTorchSupported` | `boolean` | Whether the active camera reports a torch |
| `torch` | `boolean` | Current torch state |
| `setTorch(on)` | `(on) => Promise<boolean>` | Resolves `false` if the camera refused |

### `UserMediaError`

`{ name: "UserMediaError", reason, message, cause }` where `reason` is one of `denied · not-found · in-use · over-constrained · unsupported · unknown`.

### Helpers

`isUserMediaSupported()`, `isEnumerationSupported()`, `stopStream()`, `supportsTorch()`, `activeDeviceIdOf()`, `withVideoPreferences()`, `toUserMediaError()`.

## Notes

- **Secure context required.** `getUserMedia` needs HTTPS or `localhost`; elsewhere the hook reports `unsupported` rather than failing mysteriously.
- **Device labels need permission.** Browsers hide them (and often the devices themselves) from a page that has never been allowed to see a camera, which is why enumeration runs after the first grant.
- **`torch` is not standardised.** It comes from the Image Capture draft; the hook probes for it and degrades quietly where it is absent. It is switched **off** before a track stops, because on several Android devices the LED survives a bare `track.stop()`.

## Testing

jsdom has no media stack, so tests stub `navigator.mediaDevices` and assert on the tracks that were handed out:

```tsx
import { renderHook, act } from "@testing-library/react";
import { useUserMedia } from "@usefy/use-user-media";

const track = { kind: "video", stop: vi.fn(), getSettings: () => ({ deviceId: "cam-1" }), getCapabilities: () => ({}) };
const stream = { getTracks: () => [track], getVideoTracks: () => [track] };

vi.stubGlobal("navigator", {
  ...navigator,
  mediaDevices: {
    getUserMedia: vi.fn(async () => stream),
    enumerateDevices: vi.fn(async () => []),
    addEventListener: () => {},
    removeEventListener: () => {},
  },
});

const { result, unmount } = renderHook(() => useUserMedia());
await act(async () => { await result.current.start(); });

unmount();
expect(track.stop).toHaveBeenCalled(); // the assertion that matters most
```

The suite that ships with the hook covers the cases that are hard to get right: a stream arriving **after** unmount, two overlapping requests resolving out of order, StrictMode's double mount, and every `DOMException` → reason mapping.

## License

MIT © [usefy](https://github.com/mirunamu00/usefy)
