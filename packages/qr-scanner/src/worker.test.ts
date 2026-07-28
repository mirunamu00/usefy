import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { encodeQR } from "@usefy/qr-code/headless";
import { QRDecodeError } from "./errors";
import { createWorkerDecoder } from "./worker-client";
import { renderMatrix } from "./__testing__/render";
import type { WorkerResponse } from "./worker-protocol";

const VALUE = "https://usefy.dev/qr-scanner";

/**
 * An in-process stand-in for a real `Worker` that runs the package's own
 * `./worker` entry.
 *
 * The worker module registers a `message` listener on `globalThis`, so
 * importing it here with the listener captured lets the *real* worker code
 * handle the *real* protocol — a stub that just called `decodeImageData`
 * would test nothing about the message contract, the transfer list, or the
 * error mapping, which is where the bugs in a worker actually live.
 */
class LoopbackWorker {
  private readonly listeners = new Map<string, Array<(event: { data: unknown }) => void>>();
  private handler: ((event: { data: unknown }) => void) | null = null;
  /** Everything that crossed the boundary, for asserting on transfers. */
  readonly transfers: Transferable[][] = [];

  connect(handler: (event: { data: unknown }) => void): void {
    this.handler = handler;
  }

  postMessage(message: unknown, transfer?: Transferable[]): void {
    this.transfers.push(transfer ?? []);
    // Deliver asynchronously, as a real worker does.
    queueMicrotask(() => this.handler?.({ data: message }));
  }

  /** The worker side answering. */
  reply(response: WorkerResponse, transfer?: Transferable[]): void {
    this.transfers.push(transfer ?? []);
    queueMicrotask(() => {
      for (const listener of this.listeners.get("message") ?? []) listener({ data: response });
    });
  }

  addEventListener(type: string, listener: (event: { data: unknown }) => void): void {
    const existing = this.listeners.get(type) ?? [];
    existing.push(listener);
    this.listeners.set(type, existing);
  }

  removeEventListener(type: string, listener: (event: never) => void): void {
    const existing = this.listeners.get(type) ?? [];
    this.listeners.set(
      type,
      existing.filter((entry) => entry !== (listener as unknown as typeof entry)),
    );
  }

  emitError(): void {
    for (const listener of this.listeners.get("error") ?? []) listener({ data: undefined });
  }
}

function image(): ImageData {
  return renderMatrix(encodeQR(VALUE, { level: "M" }), { scale: 6 });
}

describe("the worker protocol, end to end", () => {
  let worker: LoopbackWorker;

  beforeEach(async () => {
    worker = new LoopbackWorker();

    // Capture the listener the worker entry registers on its global scope, then
    // wire it to the loopback so page → worker → page is the real code both ways.
    const registered: Array<(event: { data: unknown }) => void> = [];
    vi.stubGlobal("addEventListener", (type: string, listener: (event: { data: unknown }) => void) => {
      if (type === "message") registered.push(listener);
    });
    vi.stubGlobal("postMessage", (message: WorkerResponse, transfer?: Transferable[]) => {
      worker.reply(message, transfer);
    });

    vi.resetModules();
    await import("./worker");
    worker.connect(registered[0]!);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("decodes a frame and hands the payload back", async () => {
    const decoder = createWorkerDecoder(worker);
    const [result] = await decoder.decode(image());

    expect(result!.text).toBe(VALUE);
    expect(result!.engine).toBe("internal");
    expect(result!.symbol?.version).toBeGreaterThan(0);
  });

  it("transfers the pixel buffer in both directions rather than copying it", async () => {
    const decoder = createWorkerDecoder(worker);
    await decoder.decode(image());

    // One transfer list on the way in, one on the way back, each carrying the
    // frame's ArrayBuffer.
    expect(worker.transfers.length).toBe(2);
    for (const transfer of worker.transfers) {
      expect(transfer).toHaveLength(1);
      expect(transfer[0]).toBeInstanceOf(ArrayBuffer);
    }
  });

  it("does not detach the caller's own ImageData", async () => {
    // The frame is transferred, so it is copied first — otherwise a caller
    // reusing their buffer for the next frame would find it empty.
    const frame = image();
    const decoder = createWorkerDecoder(worker);
    await decoder.decode(frame);

    expect(frame.data.length).toBeGreaterThan(0);
    expect(frame.data.byteLength).toBeGreaterThan(0);
  });

  it("keeps concurrent decodes apart", async () => {
    const decoder = createWorkerDecoder(worker);
    const other = renderMatrix(encodeQR("SECOND", { level: "M" }), { scale: 6 });

    const [first, second] = await Promise.all([decoder.decode(image()), decoder.decode(other)]);
    expect(first[0]!.text).toBe(VALUE);
    expect(second[0]!.text).toBe("SECOND");
  });

  it("returns an empty array for a frame with no symbol, rather than erroring", async () => {
    const blank: ImageData = {
      data: new Uint8ClampedArray(120 * 120 * 4).fill(255),
      width: 120,
      height: 120,
      colorSpace: "srgb",
    } as ImageData;

    expect(await createWorkerDecoder(worker).decode(blank)).toEqual([]);
  });

  it("answers an empty frame with an empty result and stays alive", async () => {
    const decoder = createWorkerDecoder(worker);
    const empty: ImageData = {
      data: new Uint8ClampedArray(0),
      width: 0,
      height: 0,
      colorSpace: "srgb",
    } as ImageData;

    expect(await decoder.decode(empty)).toEqual([]);

    const [result] = await decoder.decode(image());
    expect(result!.text).toBe(VALUE);
  });

  it("ignores messages that are not decode requests", async () => {
    // A page may share one worker with other traffic; unrelated messages must
    // not be answered or crash the handler.
    worker.postMessage({ type: "something-else" });
    await new Promise((resolve) => setTimeout(resolve, 0));

    const [result] = await createWorkerDecoder(worker).decode(image());
    expect(result!.text).toBe(VALUE);
  });
});

describe("worker client failure handling", () => {
  it("rejects with a typed decode error when the worker reports one", async () => {
    const worker = new LoopbackWorker();
    worker.connect(({ data }) => {
      const request = data as { id: number; data: Uint8ClampedArray };
      worker.reply({
        type: "error",
        id: request.id,
        name: "QRDecodeError",
        message: "too damaged",
        stage: "ec",
        data: request.data,
      });
    });

    const decoder = createWorkerDecoder(worker);
    await expect(decoder.decode(image())).rejects.toMatchObject({
      name: "QRDecodeError",
      stage: "ec",
    });
    await expect(decoder.decode(image())).rejects.toBeInstanceOf(QRDecodeError);
  });

  it("rejects with a plain error when the worker reports a non-decode failure", async () => {
    const worker = new LoopbackWorker();
    worker.connect(({ data }) => {
      const request = data as { id: number; data: Uint8ClampedArray };
      worker.reply({
        type: "error",
        id: request.id,
        name: "TypeError",
        message: "something else went wrong",
        data: request.data,
      });
    });

    await expect(createWorkerDecoder(worker).decode(image())).rejects.toMatchObject({
      name: "TypeError",
    });
  });

  it("releases everything waiting when the worker fails to load", async () => {
    // A worker that never starts would otherwise leave every decode pending
    // forever, which in a scanner shows up as a UI frozen on "scanning…".
    const worker = new LoopbackWorker();
    worker.connect(() => {
      /* never answers */
    });

    const decoder = createWorkerDecoder(worker);
    const pending = decoder.decode(image());
    await new Promise((resolve) => setTimeout(resolve, 0));
    worker.emitError();

    await expect(pending).rejects.toThrow(/worker failed/i);
  });

  it("keeps failing fast after the worker died, instead of hanging", async () => {
    // The failure is sticky on purpose: a dead worker answers nothing, so a
    // later decode that "waits and sees" waits forever. This also covers the
    // race where the worker dies during the await that reads pixels.
    const worker = new LoopbackWorker();
    worker.connect(() => {
      /* never answers */
    });

    const decoder = createWorkerDecoder(worker);
    const during = decoder.decode(image());
    worker.emitError();

    await expect(during).rejects.toThrow(/worker failed/i);
    await expect(decoder.decode(image())).rejects.toThrow(/worker failed/i);
  });

  it("rejects outstanding work on dispose and refuses new work", async () => {
    const worker = new LoopbackWorker();
    worker.connect(() => {
      /* never answers */
    });

    const decoder = createWorkerDecoder(worker);
    const pending = decoder.decode(image());
    // Let the decode reach the worker before disposing.
    await new Promise((resolve) => setTimeout(resolve, 0));
    decoder.dispose();

    await expect(pending).rejects.toThrow(/disposed/);
    await expect(decoder.decode(image())).rejects.toThrow(/disposed/);
  });

  it("ignores replies for requests it no longer knows about", async () => {
    const worker = new LoopbackWorker();
    worker.connect(() => {
      /* nothing */
    });
    const decoder = createWorkerDecoder(worker);

    // A stale reply — from before a dispose, say — must be dropped silently
    // rather than throwing inside the message handler.
    worker.reply({ type: "result", id: 999, results: [], data: new Uint8ClampedArray(0) });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(decoder).toBeDefined();
  });
});
