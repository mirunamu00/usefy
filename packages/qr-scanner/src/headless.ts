/**
 * `@usefy/qr-scanner/headless` — the framework-free surface.
 *
 * Zero React in this graph and, deliberately, **no `"use client"` banner**
 * (SPEC decision #1): a server component, a Web Worker, or a plain script can
 * import from here and decode a QR code with no client framework at all.
 * `src/headless.test.ts` asserts the built bundle keeps that promise.
 */

/* ── Decoding ── */
export { decode, decodeFile, decodeFirst, type DecodeOptions } from "./engine";
export { decodeImageData, type DecodeImageDataOptions } from "./decodeImage";
export { decodeMatrix, type DecodeMatrixOptions } from "./decode/decodeMatrix";

/* ── The pure stages, for anyone building something else on them ── */
export { BitMatrix } from "./image/bitmatrix";
export { toGray, toSourcePoint, type GrayOptions } from "./image/luminance";
export { binarize, globalBinarize, hybridBinarize, otsuThreshold } from "./image/binarize";
export { releaseScratchCanvas, toImageData } from "./image/source";
export {
  detectSymbols,
  type DetectOptions,
  type DetectedSymbol,
  type SampleAttempt,
} from "./detect/detect";
export { distance, findFinderPatterns, type FinderCandidate } from "./detect/finder";
export {
  dimensionCandidates,
  estimateDimension,
  groupFinders,
  type FinderTriple,
} from "./detect/group";
export { moduleSizeBetween } from "./detect/moduleSize";
export { findAlignmentPattern, predictAlignment } from "./detect/alignment";
export { PerspectiveTransform, type Quad4 } from "./detect/perspective";
export { sampleGrid } from "./detect/sample";
export {
  BitReader,
  decodeFormatBits,
  decodeSegmentText,
  decodeVersionBits,
  deinterleave,
  eciLabel,
  isValidUtf8,
  parseSegments,
  readCodewords,
  readFormatInfo,
  readRawCodewords,
  readVersion,
  rsDecode,
  syndromes,
  type CodewordBlock,
  type DecodedCodewords,
  type FormatInfo,
  type ParsedBitStream,
  type RSDecodeResult,
} from "./decode";

/* ── Engines ── */
export { decodeWithNative, isNativeSupported, resetNativeSupport } from "./native";
export { createWorkerDecoder, type WorkerDecoder } from "./worker-client";
export type {
  WorkerDecodeRequest,
  WorkerDecodeFailure,
  WorkerDecodeSuccess,
  WorkerResponse,
  WorkerScanOptions,
} from "./worker-protocol";

/* ── Helpers ── */
export {
  cornersToPolygon,
  joinStructuredAppend,
  mapCorners,
  mapPointToElement,
  type ElementGeometry,
  type JoinedSequence,
} from "./utils";

/* ── Errors ── */
export {
  QRCameraError,
  QRDecodeError,
  QRUnsupportedError,
  type QRCameraErrorReason,
  type QRDecodeStage,
} from "./errors";

/* ── Types ── */
export type {
  Binarizer,
  BinarizerMode,
  EnginePreference,
  ErrorCorrectionLevel,
  GrayImage,
  ImageSource,
  InvertMode,
  ModuleGrid,
  Point,
  Quad,
  QRScanEngine,
  QRScanOptions,
  QRScanResult,
  QRScanSegment,
  QRSegmentMode,
  QRSymbolInfo,
  Rect,
  SamplingMode,
  StructuredAppendInfo,
} from "./types";
