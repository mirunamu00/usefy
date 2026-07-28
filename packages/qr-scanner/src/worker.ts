import { QRDecodeError } from "./errors";
import { decodeImageData } from "./decodeImage";
import type { WorkerDecodeRequest, WorkerResponse } from "./worker-protocol";

/**
 * `@usefy/qr-scanner/worker` — the decoder, off the main thread.
 *
 * Construct it the bundler-native way, so the URL is resolved at build time and
 * no blob URL is involved (a blob worker is blocked by any strict
 * `script-src` policy, and inlines the whole decoder into the main bundle):
 *
 * ```ts
 * const worker = new Worker(new URL("@usefy/qr-scanner/worker", import.meta.url), {
 *   type: "module",
 * });
 * const decoder = createWorkerDecoder(worker);
 * ```
 *
 * This entry pulls in nothing but the pure decode path — no React, no DOM
 * beyond the typed arrays a frame is made of — which the build asserts.
 *
 * ── Why `package.json` does not say `sideEffects: false` ──
 * This whole file *is* a side effect: it registers a message listener and
 * exports nothing. A blanket `sideEffects: false` gives every bundler
 * permission to delete it, and the symptom is a worker that loads, reports no
 * error, and silently never answers. The manifest therefore lists this entry
 * explicitly, and `measure-size.mjs` would show it collapsing to ~0 KB if that
 * ever regressed — which is exactly how it was caught.
 */

/** The bit of `DedicatedWorkerGlobalScope` this file needs, typed locally. */
interface WorkerScope {
  addEventListener(
    type: "message",
    listener: (event: { data: unknown }) => void,
  ): void;
  postMessage(message: WorkerResponse, transfer?: Transferable[]): void;
}

function isDecodeRequest(value: unknown): value is WorkerDecodeRequest {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: unknown }).type === "decode" &&
    typeof (value as { id?: unknown }).id === "number"
  );
}

const scope = globalThis as unknown as WorkerScope;

scope.addEventListener("message", (event) => {
  const request = event.data;
  if (!isDecodeRequest(request)) return;

  const { id, data, width, height, options, timestamp } = request;

  try {
    const results = decodeImageData({ data, width, height } as ImageData, {
      ...options,
      timestamp,
    });
    // The buffer is transferred *back* so it does not die in the worker: a
    // transferred `ArrayBuffer` is detached on the sending side, so keeping it
    // here would leak one frame's worth of memory per decode until GC caught
    // up. The client does not currently recycle it into the next request —
    // `worker-client.ts` copies the caller's pixels each time so a caller's own
    // `ImageData` is never detached under them — so this is about not stranding
    // memory, not about a zero-allocation round trip.
    scope.postMessage({ type: "result", id, results, data }, [data.buffer]);
  } catch (error) {
    scope.postMessage(
      {
        type: "error",
        id,
        name: error instanceof Error ? error.name : "Error",
        message: error instanceof Error ? error.message : String(error),
        stage: error instanceof QRDecodeError ? error.stage : undefined,
        data,
      },
      [data.buffer],
    );
  }
});
