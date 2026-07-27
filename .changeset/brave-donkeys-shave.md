---
"@usefy/qr-code": minor
---

Add `@usefy/qr-code` — a QR code generator built on a hand-written ISO/IEC 18004 encoder.

The encoder is the package: optimal mixed-mode segmentation, versions 1–40 at every error-correction level, Reed–Solomon over GF(256), block interleaving, penalty-scored mask selection and BCH-protected format/version information. All 160 version × level combinations were verified module-for-module against an independent encoder, and generated codes are round-tripped through a real decoder in the test suite.

Everything above the matrix — SVG, canvas, PNG, module and finder-eye shapes, gradients, logo placement — is built on that one engine, so the four output surfaces cannot drift apart.

- **`<QRCode />`, `useQRCode()`, and a headless core.** `@usefy/qr-code/headless` ships no `"use client"` and no React, so a React Server Component can render a code with zero client JavaScript via `toSVGProps()`.
- **Styling without a second dependency** — `square`/`rounded`/`dot`/`classy` modules, `square`/`rounded`/`circle`/`leaf` finder eyes, per-eye colours, linear and radial gradients, quiet-zone control.
- **Logo embedding that validates itself** — `logoSafety()` measures occlusion against what the chosen level can actually recover; development builds warn with the level that would fix it, and never change your settings behind your back.
- **Scannability treated as correctness** — development warnings cover logo occlusion, foreground/background contrast (judged by a gradient's *worst* stop), inverted polarity, an undersized quiet zone, and per-shape `moduleGap` ceilings measured by decoding real rendered output.
- Encoding failures are reported through `onError` rather than thrown, so an over-long value never blanks the page.
- Zero runtime dependencies; `encodeQR` alone is 4.3 KB gzipped, `encodeQR` + `toSVGProps` 6.6 KB.
