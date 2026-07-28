# @usefy/qr-code

## 0.3.0

### Minor Changes

- fac6160: Publish the ISO/IEC 18004 primitives a decoder needs from `@usefy/qr-code/headless`

  The encoder already contained a complete, tested description of the format —
  GF(256) arithmetic, the capacity and block tables, the BCH format/version words,
  and the zig-zag module traversal. All of it stays internal to encoding today,
  but a scanner needs the identical description to read a symbol back, and a
  second copy of it would be a divergence bug waiting to happen.

  Newly exported from `./headless` (additive — no behaviour changes):

  - **GF(256) & Reed–Solomon:** `gfExp`, `gfMul`, `gfDiv`, `rsEncode`
  - **Tables:** `ecCodewordsPerBlock`, `numEcBlocks`, `totalCodewords`
  - **BCH words:** `formatInfoBits`, `versionInfoBits`
  - **Geometry:** `functionPatternMap(version)` (the reserved-module map) and
    `codewordModuleOrder(version)` (the module indices in codeword-bit order)

  Every one of these has a consumer; the list is deliberately not larger, because
  an export carries a breaking-change contract forever and un-exporting is a major
  bump. A test asserts that the unused candidates (`gfLog`, `polyMul`,
  `PRIMITIVE`, `generatorPoly`, `MODE_INDICATOR`, `EC_FORMAT_BITS`) stay private.

  `drawCodewords` now routes through the same traversal it publishes, so there is
  exactly one description of the zig-zag walk in the package, and a new test reads
  finished symbols back through the published order across versions 1–40. That
  traversal is memoized per version, so encoding a second symbol of the same
  version allocates nothing for it — previously `drawCodewords` walked the grid
  itself, and a scanner would rebuild the order several times per camera frame.

### Patch Changes

- @usefy/use-isomorphic-layout-effect@1.1.0
- @usefy/use-latest@1.1.0

## 0.2.0

### Minor Changes

- 3e5d0cc: Add `@usefy/qr-code` — a QR code generator built on a hand-written ISO/IEC 18004 encoder.

  The encoder is the package: optimal mixed-mode segmentation, versions 1–40 at every error-correction level, Reed–Solomon over GF(256), block interleaving, penalty-scored mask selection and BCH-protected format/version information. All 160 version × level combinations were verified module-for-module against an independent encoder, and generated codes are round-tripped through a real decoder in the test suite.

  Everything above the matrix — SVG, canvas, PNG, module and finder-eye shapes, gradients, logo placement — is built on that one engine, so the four output surfaces cannot drift apart.

  - **`<QRCode />`, `useQRCode()`, and a headless core.** `@usefy/qr-code/headless` ships no `"use client"` and no React, so a React Server Component can render a code with zero client JavaScript via `toSVGProps()`.
  - **Styling without a second dependency** — `square`/`rounded`/`dot`/`classy` modules, `square`/`rounded`/`circle`/`leaf` finder eyes, per-eye colours, linear and radial gradients, quiet-zone control.
  - **Logo embedding that validates itself** — `logoSafety()` measures occlusion against what the chosen level can actually recover; development builds warn with the level that would fix it, and never change your settings behind your back.
  - **Scannability treated as correctness** — development warnings cover logo occlusion, foreground/background contrast (judged by a gradient's _worst_ stop), inverted polarity, an undersized quiet zone, and per-shape `moduleGap` ceilings measured by decoding real rendered output.
  - Encoding failures are reported through `onError` rather than thrown, so an over-long value never blanks the page.
  - Zero runtime dependencies; `encodeQR` alone is 4.3 KB gzipped, `encodeQR` + `toSVGProps` 6.6 KB.
