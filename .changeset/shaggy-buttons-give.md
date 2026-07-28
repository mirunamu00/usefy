---
"@usefy/qr-code": minor
---

Publish the ISO/IEC 18004 primitives a decoder needs from `@usefy/qr-code/headless`

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
