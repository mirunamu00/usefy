/**
 * `@usefy/qr-code/headless` — the framework-free surface.
 *
 * Zero React in this graph and, deliberately, **no `"use client"` banner**
 * (SPEC decision #2): a React Server Component can import from here and render
 * a QR code with no client JavaScript at all. `src/headless.test.ts` asserts
 * the built bundle keeps that promise.
 */

export { encodeQR } from "./encode/encodeQR";
export {
  EC_LEVELS,
  EC_RECOVERY_RATIO,
  MAX_VERSION,
  MIN_VERSION,
  alignmentPatternPositions,
  charCountBits,
  dataCapacityBits,
  dataCodewords,
  ecCodewordsPerBlock,
  numEcBlocks,
  totalCodewords,
  versionSize,
} from "./encode/capacity";
export { ALPHANUMERIC_CHARSET, segment, segmentsBitLength } from "./encode/segment";
export { maskAt, penaltyScore } from "./encode/mask";
export { codewordModuleOrder, functionPatternMap } from "./encode/matrix";
export { formatInfoBits, versionInfoBits } from "./encode/info";

/**
 * GF(256) arithmetic and Reed–Solomon encoding.
 *
 * Published because the field, the tables and the traversal above are the
 * halves a **decoder** needs too — `@usefy/qr-scanner` composes them rather
 * than restating ISO/IEC 18004 a second time, which is what keeps the
 * generator and the scanner from ever disagreeing about the specification.
 * They are load-bearing public API, not incidental exports: treat a change
 * here as a breaking change.
 *
 * Deliberately *not* published: `gfLog`, `polyMul`, `PRIMITIVE`,
 * `generatorPoly` and `EC_FORMAT_BITS`. The first draft of this surface
 * exported them too, on the theory that "a decoder needs the primitives" — but
 * nothing in the scanner references them, and an export carrying an explicit
 * breaking-change contract that no one imports is a permanent cost for no
 * benefit. `MODE_INDICATOR` is likewise absent: it covers only the three modes
 * this package *writes*, so a scanner (which must also read Kanji, ECI,
 * Structured Append and FNC1) cannot use it as its table anyway.
 */
export { gfDiv, gfExp, gfMul } from "./encode/galois";
/** Used by the scanner's tests to build error-correction fixtures. */
export { rsEncode } from "./encode/reedSolomon";

export {
  MAX_LOGO_SIZE,
  MAX_MODULE_GAP,
  MAX_SAFE_MODULE_GAP,
  MIN_QUIET_ZONE,
  MIN_SCANNABLE_CONTRAST,
  contrastRatio,
  drawToCanvas,
  eyeOrigins,
  gradientId,
  isEyeModule,
  isSafeCssColor,
  logoClipId,
  logoSafety,
  matrixToPaths,
  relativeLuminance,
  resolveStyle,
  styleContrast,
  toPNG,
  toSVG,
  toSVGProps,
  warnInvertedPolarity,
  warnLowContrast,
  warnModuleGap,
  warnQuietZone,
  warnScannability,
  warnUnsafeLogo,
  worstContrast,
} from "./render";
export type {
  CanvasRenderOptions,
  LogoClipIdentity,
  PNGExport,
  PNGExportOptions,
  RenderOptions,
  RenderedPaths,
  ResolvedStyle,
} from "./render";

export { QRCapacityError, QRExportError } from "./errors";

export type {
  EncodeOptions,
  ErrorCorrectionLevel,
  LogoSafety,
  QRGradient,
  QRGradientDef,
  QRGradientStop,
  QREyeShape,
  QRLogoOptions,
  QRMatrix,
  QRModuleShape,
  QROptions,
  QRPath,
  QRSVGProps,
  QRSegment,
  QRSegmentMode,
  QRStyleOptions,
} from "./types";
