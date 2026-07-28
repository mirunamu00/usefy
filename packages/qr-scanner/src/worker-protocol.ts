import type { QRScanOptions, QRScanResult } from "./types";

/**
 * The message contract between a page and `@usefy/qr-scanner/worker`.
 *
 * Deliberately plain data: pixel buffers, numbers and strings. No functions
 * cross the boundary, so a custom `binarizer` cannot be sent to a worker — that
 * is a real limitation and it is documented rather than worked around with
 * `eval`, which would make the worker unusable under a strict CSP.
 */

/** Options that survive `postMessage`. */
export type WorkerScanOptions = Omit<QRScanOptions, "binarizer"> & {
  binarizer?: "hybrid" | "otsu";
};

export interface WorkerDecodeRequest {
  readonly type: "decode";
  readonly id: number;
  /** The frame, as transferable parts rather than an `ImageData` instance. */
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
  readonly options: WorkerScanOptions;
  readonly timestamp?: number;
}

export interface WorkerDecodeSuccess {
  readonly type: "result";
  readonly id: number;
  readonly results: QRScanResult[];
  /** The pixel buffer, handed back so the caller can reuse it. */
  readonly data: Uint8ClampedArray;
}

export interface WorkerDecodeFailure {
  readonly type: "error";
  readonly id: number;
  readonly name: string;
  readonly message: string;
  readonly stage?: string;
  readonly data: Uint8ClampedArray;
}

export type WorkerResponse = WorkerDecodeSuccess | WorkerDecodeFailure;
