# @usefy/qr-scanner

## 0.2.0

### Minor Changes

- 6374faf: Add `@usefy/qr-scanner` — QR scanning for React, camera and still image

  The decode half of the set `@usefy/qr-code` started. Where the browser ships a
  `BarcodeDetector` that understands QR it uses it; where it does not, it falls
  back to a hand-written ISO/IEC 18004 decoder that does the whole job —
  grayscale → local adaptive binarization → sub-pixel finder detection →
  four-point perspective correction → grid sampling → BCH format/version
  recovery → de-interleaving → **Reed–Solomon error correction** → segment
  parsing with ECI, Kanji, Structured Append and FNC1.

  - `<QRScanner />` — camera preview, viewfinder overlay, torch and camera-switch
    controls, and a file/drop/paste fallback so a desktop without a webcam is a
    first-class case rather than an error state
  - `useQRScanner()` — the camera and the decode loop with no UI attached
  - `decode` / `decodeFile` / `decodeFirst` / `decodeImageData` — still images,
    synchronously where you want it
  - `@usefy/qr-scanner/headless` — no React, no `"use client"`; importable from a
    server component or a worker
  - `@usefy/qr-scanner/worker` — a real module entry, no blob URLs, CSP-safe
  - `mapCorners()` — symbol corners mapped through `object-fit` and front-camera
    mirroring, so an overlay lands _on_ the code

  Shares `@usefy/qr-code`'s GF(256) arithmetic and ISO tables rather than
  restating them, so the generator and the scanner cannot disagree about the
  specification. Verified against symbols from an independent encoder
  (`node-qrcode`, every version group, level and mask) and against jsQR on a
  degraded corpus — rotation, perspective, blur, noise, shadow, inversion and
  mirroring — which it decodes a superset of.

  Zero runtime dependencies outside `@usefy/*`. React 18 & 19, SSR- and
  StrictMode-safe.

### Patch Changes

- Updated dependencies [a71ab92]
- Updated dependencies [fac6160]
  - @usefy/use-user-media@1.1.0
  - @usefy/qr-code@0.3.0
  - @usefy/use-controllable-state@1.1.0
  - @usefy/use-event-callback@1.1.0
  - @usefy/use-event-listener@1.1.0
  - @usefy/use-isomorphic-layout-effect@1.1.0
  - @usefy/use-page-visibility@1.1.0
  - @usefy/use-reduced-motion@1.1.0
