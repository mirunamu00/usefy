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
  versionSize,
} from "./encode/capacity";
export { ALPHANUMERIC_CHARSET, segment, segmentsBitLength } from "./encode/segment";
export { maskAt, penaltyScore } from "./encode/mask";

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
