import { afterEach, describe, expect, it, vi } from "vitest";

import type { WorkerResponse } from "./worker-protocol";

/**
 * The worker's failure path.
 *
 * A worker that throws out of its message handler never answers, and the page
 * waits forever. So every failure has to come back as a message — which means
 * the catch block is load-bearing and deserves its own test rather than being
 * assumed.
 */
vi.mock("./decodeImage", async () => {
  // Imported from inside the factory so the error class comes from the same
  // module registry the worker entry will use — `vi.resetModules()` below
  // rebuilds that registry, and a class from the outer one would fail the
  // worker's `instanceof` check for reasons that have nothing to do with the
  // code under test.
  const { QRDecodeError: Fresh } = await import("./errors");
  return {
    decodeImageData: () => {
      throw new Fresh("ec", "beyond repair");
    },
  };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("worker error replies", () => {
  it("answers with the decode stage rather than throwing", async () => {
    const responses: WorkerResponse[] = [];
    const transfers: Transferable[][] = [];
    let handler: ((event: { data: unknown }) => void) | null = null;

    vi.stubGlobal("addEventListener", (type: string, listener: (event: { data: unknown }) => void) => {
      if (type === "message") handler = listener;
    });
    vi.stubGlobal("postMessage", (message: WorkerResponse, transfer?: Transferable[]) => {
      responses.push(message);
      transfers.push(transfer ?? []);
    });

    vi.resetModules();
    await import("./worker");
    expect(handler).not.toBeNull();

    const data = new Uint8ClampedArray(16);
    handler!({
      data: { type: "decode", id: 7, width: 2, height: 2, data, options: {} },
    });

    expect(responses).toHaveLength(1);
    const response = responses[0]!;
    expect(response.type).toBe("error");
    expect(response.id).toBe(7);
    if (response.type === "error") {
      expect(response.name).toBe("QRDecodeError");
      expect(response.stage).toBe("ec");
      expect(response.message).toBe("beyond repair");
    }
    // The buffer goes back even on failure, so a caller reusing it is not
    // silently left with a detached array.
    expect(transfers[0]).toHaveLength(1);
  });
});
