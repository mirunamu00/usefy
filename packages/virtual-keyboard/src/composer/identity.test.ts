import { describe, it, expect } from "vitest";
import { identityComposer } from "./identity";

describe("identityComposer", () => {
  it("commits each key immediately with nothing composing", () => {
    const state = identityComposer.reset();
    const result = identityComposer.input(state, "a");
    expect(result.committed).toBe("a");
    expect(result.composing).toBe("");
    expect(result.next).toBe(state);
  });

  it("flush leaves nothing to commit", () => {
    const state = identityComposer.reset();
    const result = identityComposer.flush(state);
    expect(result.committed).toBe("");
    expect(result.composing).toBe("");
  });

  it("reset produces an empty buffer", () => {
    expect(identityComposer.reset()).toEqual({ buffer: "" });
  });
});
