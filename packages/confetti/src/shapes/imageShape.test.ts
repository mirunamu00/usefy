import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { imageShape, DEFAULT_IMAGE_HEIGHT } from "./imageShape";

/** Controllable stand-in for the global Image constructor. */
class MockImage {
  static instances: MockImage[] = [];
  complete = false;
  naturalWidth = 0;
  naturalHeight = 0;
  decoding = "";
  src = "";
  private listeners: Record<string, Array<() => void>> = {};
  constructor() {
    MockImage.instances.push(this);
  }
  addEventListener(type: string, cb: () => void): void {
    (this.listeners[type] ??= []).push(cb);
  }
  load(width: number, height: number): void {
    this.complete = true;
    this.naturalWidth = width;
    this.naturalHeight = height;
  }
  fail(): void {
    for (const cb of this.listeners["error"] ?? []) cb();
  }
}

beforeEach(() => {
  MockImage.instances = [];
  vi.stubGlobal("Image", MockImage);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("imageShape — URL source", () => {
  it("starts loading lazily on first rasterize and returns null until decoded", () => {
    const shape = imageShape("/logo.png");
    expect(MockImage.instances).toHaveLength(0); // nothing loads at factory time

    expect(shape.rasterize(1)).toBeNull(); // now loading
    expect(MockImage.instances).toHaveLength(1);
    expect(MockImage.instances[0].src).toBe("/logo.png");
    expect(MockImage.instances[0].decoding).toBe("async");

    expect(shape.rasterize(1)).toBeNull(); // still not ready — no second Image
    expect(MockImage.instances).toHaveLength(1);
  });

  it("returns the sized entry once loaded (default height, aspect preserved) and memoizes", () => {
    const shape = imageShape("/logo.png");
    shape.rasterize(1);
    MockImage.instances[0].load(100, 50); // 2:1 aspect

    const entry = shape.rasterize(1)!;
    expect(entry.source).toBe(MockImage.instances[0]);
    expect(entry.height).toBe(DEFAULT_IMAGE_HEIGHT); // 12
    expect(entry.width).toBe(DEFAULT_IMAGE_HEIGHT * 2); // aspect preserved
    expect(shape.rasterize(1)).toBe(entry); // memoized
  });

  it("derives the missing dimension from the explicit one", () => {
    const byWidth = imageShape("/a.png", { width: 30 });
    byWidth.rasterize(1);
    MockImage.instances[0].load(100, 50);
    expect(byWidth.rasterize(1)).toEqual(
      expect.objectContaining({ width: 30, height: 15 }),
    );

    const byBoth = imageShape("/b.png", { width: 20, height: 20 });
    byBoth.rasterize(1);
    MockImage.instances[1].load(100, 50);
    expect(byBoth.rasterize(1)).toEqual(
      expect.objectContaining({ width: 20, height: 20 }),
    );
  });

  it("a load error becomes a permanent, silent skip (never throws)", () => {
    const shape = imageShape("/broken.png");
    expect(shape.rasterize(1)).toBeNull();
    MockImage.instances[0].fail();
    expect(shape.rasterize(1)).toBeNull();
    // Even if the browser would later mark it complete, failed stays failed.
    MockImage.instances[0].load(10, 10);
    expect(shape.rasterize(1)).toBeNull();
    expect(MockImage.instances).toHaveLength(1); // no reload attempts
  });

  it("returns null without an Image constructor (SSR) and recovers client-side", () => {
    const shape = imageShape("/logo.png");
    vi.stubGlobal("Image", undefined);
    expect(shape.rasterize(1)).toBeNull();
    vi.stubGlobal("Image", MockImage);
    expect(shape.rasterize(1)).toBeNull(); // now loading for real
    expect(MockImage.instances).toHaveLength(1);
  });

  it("keys distinguish source and sizing", () => {
    expect(imageShape("/a.png").key).toBe(imageShape("/a.png").key);
    expect(imageShape("/a.png").key).not.toBe(imageShape("/b.png").key);
    expect(imageShape("/a.png", { width: 10 }).key).not.toBe(
      imageShape("/a.png").key,
    );
  });
});

describe("imageShape — HTMLImageElement source", () => {
  it("uses the element directly and waits for its decode", () => {
    const img = document.createElement("img");
    Object.defineProperty(img, "naturalWidth", { value: 0, configurable: true, writable: true });
    Object.defineProperty(img, "complete", { value: false, configurable: true, writable: true });
    const shape = imageShape(img);

    expect(shape.rasterize(1)).toBeNull(); // not decoded yet
    Object.defineProperty(img, "complete", { value: true, configurable: true });
    Object.defineProperty(img, "naturalWidth", { value: 60, configurable: true });
    Object.defineProperty(img, "naturalHeight", { value: 60, configurable: true });

    const entry = shape.rasterize(1)!;
    expect(entry.source).toBe(img);
    expect(entry.width).toBe(DEFAULT_IMAGE_HEIGHT);
    expect(entry.height).toBe(DEFAULT_IMAGE_HEIGHT);
    expect(MockImage.instances).toHaveLength(0); // no new Image created
  });

  it("two src-less elements get distinct keys", () => {
    const a = imageShape(document.createElement("img"));
    const b = imageShape(document.createElement("img"));
    expect(a.key).not.toBe(b.key);
  });
});
