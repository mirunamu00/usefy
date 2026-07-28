import { QRDecodeError } from "./errors";
import { toImageData } from "./image/source";
import type { ImageSource, QRScanResult } from "./types";
import type { WorkerDecodeRequest, WorkerResponse, WorkerScanOptions } from "./worker-protocol";

/**
 * The page-side half of the worker decoder.
 *
 * Worker use is **opt-in**: the main-thread path has to be good enough on its
 * own, and most consumers never need this. It earns its place on a dense
 * symbol at 720p on a mid-range phone, where a 30 ms decode in the middle of a
 * frame is a visible hitch in the camera preview.
 */

export interface WorkerDecoder {
  /** Decode one image. Same contract as the main-thread `decode`. */
  decode(source: ImageSource, options?: WorkerScanOptions & { timestamp?: number }): Promise<QRScanResult[]>;
  /**
   * Stop accepting work and reject anything outstanding. Does **not** terminate
   * the worker — whoever constructed it owns its lifetime.
   */
  dispose(): void;
}

interface Pending {
  resolve(results: QRScanResult[]): void;
  reject(error: Error): void;
}

/** The minimum of `Worker` this module uses, so no DOM lib is required. */
interface WorkerLike {
  postMessage(message: unknown, transfer?: Transferable[]): void;
  addEventListener(type: "message", listener: (event: { data: unknown }) => void): void;
  addEventListener(type: "error", listener: (event: unknown) => void): void;
  removeEventListener(type: string, listener: (event: never) => void): void;
}

/**
 * Wrap a `Worker` running the package's `./worker` entry.
 *
 * @param worker - A worker the caller constructed and owns.
 *
 * @example
 * ```ts
 * const worker = new Worker(new URL("@usefy/qr-scanner/worker", import.meta.url), {
 *   type: "module",
 * });
 * const decoder = createWorkerDecoder(worker);
 * const [result] = await decoder.decode(videoElement);
 * ```
 */
export function createWorkerDecoder(worker: WorkerLike): WorkerDecoder {
  const pending = new Map<number, Pending>();
  let nextId = 1;
  let disposed = false;
  let failure: Error | null = null;

  const onMessage = (event: { data: unknown }): void => {
    const response = event.data as WorkerResponse;
    if (!response || typeof response !== "object" || typeof response.id !== "number") return;

    const entry = pending.get(response.id);
    if (!entry) return;
    pending.delete(response.id);

    if (response.type === "result") {
      entry.resolve(response.results);
    } else {
      const error =
        response.stage !== undefined
          ? new QRDecodeError(response.stage as QRDecodeError["stage"], response.message)
          : Object.assign(new Error(response.message), { name: response.name });
      entry.reject(error);
    }
  };

  const onError = (): void => {
    // A worker that failed to load, or threw at its top level, will never
    // answer anything — not the requests already in flight, and not the ones
    // that arrive a tick later while the caller was still reading pixels.
    //
    // So the failure is *sticky*: everything waiting is released, and every
    // later call rejects immediately with the same explanation. The alternative
    // — hoping the next message gets through — shows up in a UI as a scanner
    // frozen on "scanning…", which is the worst possible way to report a
    // mistyped worker URL. A consumer whose worker failed transiently can build
    // a new decoder around a new worker.
    failure = new Error(
      "The QR scanner worker failed. Check that the worker URL resolves and that " +
        "your bundler emitted the ./worker entry.",
    );
    for (const entry of pending.values()) entry.reject(failure);
    pending.clear();
  };

  worker.addEventListener("message", onMessage);
  worker.addEventListener("error", onError);

  return {
    async decode(source, options = {}) {
      if (disposed) throw new Error("This worker decoder has been disposed.");
      if (failure) throw failure;

      const image = await toImageData(source);
      // Re-checked after the await: the worker can die while pixels are being
      // read, and a request posted to a dead worker never returns.
      if (disposed) throw new Error("This worker decoder has been disposed.");
      if (failure) throw failure;

      const id = nextId++;
      const { timestamp, ...scanOptions } = options;

      // The buffer is transferred, so the caller's copy is detached. Sending a
      // copy keeps `decode(imageData)` from quietly emptying the array the
      // caller still holds — a debugging nightmare well worth one memcpy.
      const data = new Uint8ClampedArray(image.data);

      const request: WorkerDecodeRequest = {
        type: "decode",
        id,
        width: image.width,
        height: image.height,
        data,
        options: scanOptions,
        timestamp,
      };

      return new Promise<QRScanResult[]>((resolve, reject) => {
        pending.set(id, { resolve, reject });
        try {
          worker.postMessage(request, [data.buffer]);
        } catch (error) {
          pending.delete(id);
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      });
    },

    dispose() {
      disposed = true;
      worker.removeEventListener("message", onMessage as (event: never) => void);
      worker.removeEventListener("error", onError as (event: never) => void);
      const failure = new Error("The QR scanner worker decoder was disposed.");
      for (const entry of pending.values()) entry.reject(failure);
      pending.clear();
    },
  };
}
