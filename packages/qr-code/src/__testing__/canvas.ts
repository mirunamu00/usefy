import { vi } from "vitest";

/**
 * jsdom ships no canvas implementation, so `getContext("2d")` returns null and
 * every drawing path silently no-ops. These doubles give the React tests a
 * context that records what was asked of it, which is what makes assertions
 * like "drawn exactly once per change" possible at all.
 */

export class RecordingPath2D {
  constructor(readonly d: string) {}
}

export interface CanvasRecorder {
  /** The `d` string of every path filled, in order. */
  fills: string[];
  /** Every `canvas.width` assignment — each one clears the backing store. */
  resizes: number[];
  /** Undo the doubles. */
  restore(): void;
}

/**
 * Install a fake 2D context on `HTMLCanvasElement` plus a recording `Path2D`.
 * Returns the recorder; call `restore()` to undo.
 */
export function installCanvasDouble(): CanvasRecorder {
  const recorder = { fills: [] as string[], resizes: [] as number[] };

  const contexts = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>();
  const getContext = vi
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockImplementation(function (this: HTMLCanvasElement, kind: string) {
      if (kind !== "2d") return null;
      const existing = contexts.get(this);
      if (existing) return existing;
      const context = {
        canvas: this,
        fillStyle: "",
        setTransform: () => {},
        clearRect: () => {},
        fillRect: () => {},
        fill: (path: RecordingPath2D) => {
          recorder.fills.push(path.d);
        },
        save: () => {},
        restore: () => {},
        beginPath: () => {},
        arc: () => {},
        clip: () => {},
        drawImage: () => {
          recorder.fills.push("image");
        },
        createLinearGradient: () => ({ addColorStop: () => {} }),
        createRadialGradient: () => ({ addColorStop: () => {} }),
      } as unknown as CanvasRenderingContext2D;
      contexts.set(this, context);
      return context;
    } as never);

  // jsdom implements width/height as reflected attributes; wrapping them lets
  // the tests see the resize that would wipe a real canvas.
  const descriptor = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, "width")!;
  Object.defineProperty(HTMLCanvasElement.prototype, "width", {
    configurable: true,
    get(this: HTMLCanvasElement) {
      return descriptor.get!.call(this);
    },
    set(this: HTMLCanvasElement, value: number) {
      recorder.resizes.push(value);
      descriptor.set!.call(this, value);
    },
  });

  vi.stubGlobal("Path2D", RecordingPath2D);

  return {
    fills: recorder.fills,
    resizes: recorder.resizes,
    restore() {
      getContext.mockRestore();
      Object.defineProperty(HTMLCanvasElement.prototype, "width", descriptor);
      vi.unstubAllGlobals();
    },
  };
}

/** An `Image` double that resolves (or fails) on the next microtask. */
export function installImageDouble(shouldFail = false): void {
  class FakeImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    crossOrigin: string | null = null;
    #src = "";
    set src(value: string) {
      this.#src = value;
      queueMicrotask(() => (shouldFail ? this.onerror?.() : this.onload?.()));
    }
    get src(): string {
      return this.#src;
    }
  }
  vi.stubGlobal("Image", FakeImage);
}
