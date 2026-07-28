import { describe, expect, it, vi } from "vitest";
import { encodeQR } from "@usefy/qr-code/headless";
import { renderMatrix } from "./__testing__/render";

/**
 * A decode failure is expected and swallowed; a *programmer* error is not.
 *
 * `decodeImageData` catches `QRDecodeError` per symbol so one unreadable code
 * cannot hide the readable one beside it. Anything else — a bug in this
 * package, a broken custom binarizer — must travel to the caller instead of
 * being reported as "no code found", which would make the bug invisible.
 */
vi.mock("./decode/decodeMatrix", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./decode/decodeMatrix")>();
  return {
    ...actual,
    decodeMatrix: () => {
      throw new TypeError("a bug, not a damaged symbol");
    },
  };
});

describe("non-decode errors", () => {
  it("are not swallowed as 'no code found'", async () => {
    const { decodeImageData } = await import("./decodeImage");
    const image = renderMatrix(encodeQR("propagate", { level: "M" }), { scale: 6 });

    expect(() => decodeImageData(image)).toThrow(TypeError);
    expect(() => decodeImageData(image)).toThrow(/a bug, not a damaged symbol/);
  });
});
