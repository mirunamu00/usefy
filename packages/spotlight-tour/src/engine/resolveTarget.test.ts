import { describe, it, expect, afterEach, vi } from "vitest";
import { resolveTarget } from "./resolveTarget";

describe("resolveTarget", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("resolves a CSS selector to the matching element", () => {
    const el = document.createElement("div");
    el.id = "tour-target";
    document.body.appendChild(el);
    expect(resolveTarget("#tour-target")).toBe(el);
  });

  it("returns null when the selector matches nothing", () => {
    expect(resolveTarget("#does-not-exist")).toBeNull();
  });

  it("returns null for an invalid selector instead of throwing", () => {
    expect(resolveTarget("::not-a(valid selector")).toBeNull();
  });

  it("returns null for selectors when document is unavailable (SSR)", () => {
    vi.stubGlobal("document", undefined);
    expect(resolveTarget("#tour-target")).toBeNull();
  });

  it("resolves a ref to its current element", () => {
    const el = document.createElement("button");
    document.body.appendChild(el);
    expect(resolveTarget({ current: el })).toBe(el);
  });

  it("returns null for a ref with a null current", () => {
    expect(resolveTarget({ current: null })).toBeNull();
  });

  it("resolves a function to its returned element", () => {
    const el = document.createElement("span");
    document.body.appendChild(el);
    expect(resolveTarget(() => el)).toBe(el);
  });

  it("returns null for a disconnected element (unmounted mid-step)", () => {
    const el = document.createElement("div");
    expect(resolveTarget({ current: el })).toBeNull(); // never attached
    document.body.appendChild(el);
    expect(resolveTarget(() => el)).toBe(el);
    el.remove();
    expect(resolveTarget(() => el)).toBeNull(); // detached again
  });

  it("returns null when the function returns null", () => {
    expect(resolveTarget(() => null)).toBeNull();
  });

  it("returns null for an undefined target (centered step)", () => {
    expect(resolveTarget(undefined)).toBeNull();
  });
});
