import { describe, it, expect, vi } from "vitest";
import {
  EMPTY_RECORDS,
  createNoopRef,
  getMutationConfigKey,
  isMutationObserverSupported,
  resolveMutationConfig,
} from "./utils";

describe("utils", () => {
  describe("EMPTY_RECORDS", () => {
    it("is an empty, frozen array", () => {
      expect(EMPTY_RECORDS).toEqual([]);
      expect(Object.isFrozen(EMPTY_RECORDS)).toBe(true);
    });
  });

  describe("isMutationObserverSupported", () => {
    it("returns true when MutationObserver is available", () => {
      vi.stubGlobal("MutationObserver", class {});
      expect(isMutationObserverSupported()).toBe(true);
      vi.unstubAllGlobals();
    });

    it("returns false when MutationObserver is undefined", () => {
      vi.stubGlobal("MutationObserver", undefined);
      expect(isMutationObserverSupported()).toBe(false);
      vi.unstubAllGlobals();
    });
  });

  describe("resolveMutationConfig", () => {
    it("defaults to childList: true when nothing is specified", () => {
      expect(resolveMutationConfig({})).toEqual({ childList: true });
    });

    it("keeps an explicit childList: true", () => {
      expect(resolveMutationConfig({ childList: true })).toEqual({
        childList: true,
      });
    });

    it("enables attributes when requested", () => {
      expect(resolveMutationConfig({ attributes: true })).toEqual({
        attributes: true,
      });
    });

    it("implies attributes: true from attributeFilter", () => {
      expect(
        resolveMutationConfig({ attributeFilter: ["class", "style"] })
      ).toEqual({ attributes: true, attributeFilter: ["class", "style"] });
    });

    it("implies attributes: true from attributeOldValue", () => {
      expect(resolveMutationConfig({ attributeOldValue: true })).toEqual({
        attributes: true,
        attributeOldValue: true,
      });
    });

    it("implies characterData: true from characterDataOldValue", () => {
      expect(resolveMutationConfig({ characterDataOldValue: true })).toEqual({
        characterData: true,
        characterDataOldValue: true,
      });
    });

    it("drops attribute sub-options when attributes is explicitly false", () => {
      expect(
        resolveMutationConfig({
          attributes: false,
          attributeFilter: ["class"],
          childList: true,
        })
      ).toEqual({ childList: true });
    });

    it("passes subtree through", () => {
      expect(
        resolveMutationConfig({ childList: true, subtree: true })
      ).toEqual({ childList: true, subtree: true });
    });

    it("still falls back to childList when only subtree is set", () => {
      expect(resolveMutationConfig({ subtree: true })).toEqual({
        childList: true,
        subtree: true,
      });
    });

    it("combines multiple knobs", () => {
      expect(
        resolveMutationConfig({
          childList: true,
          attributes: true,
          attributeOldValue: true,
          characterData: true,
          subtree: true,
        })
      ).toEqual({
        childList: true,
        attributes: true,
        attributeOldValue: true,
        characterData: true,
        subtree: true,
      });
    });
  });

  describe("getMutationConfigKey", () => {
    it("produces equal keys for equivalent configs", () => {
      const a = getMutationConfigKey({ childList: true, subtree: true });
      const b = getMutationConfigKey({ subtree: true, childList: true });
      expect(a).toBe(b);
    });

    it("produces different keys for different configs", () => {
      const a = getMutationConfigKey({ childList: true });
      const b = getMutationConfigKey({ attributes: true });
      expect(a).not.toBe(b);
    });

    it("is order-insensitive for attributeFilter", () => {
      const a = getMutationConfigKey({
        attributes: true,
        attributeFilter: ["a", "b"],
      });
      const b = getMutationConfigKey({
        attributes: true,
        attributeFilter: ["b", "a"],
      });
      expect(a).toBe(b);
    });

    it("distinguishes present vs absent attributeFilter", () => {
      const a = getMutationConfigKey({ attributes: true });
      const b = getMutationConfigKey({
        attributes: true,
        attributeFilter: ["class"],
      });
      expect(a).not.toBe(b);
    });
  });

  describe("createNoopRef", () => {
    it("returns a callable that does nothing and does not throw", () => {
      const ref = createNoopRef<HTMLDivElement>();
      expect(typeof ref).toBe("function");
      expect(() => ref(document.createElement("div"))).not.toThrow();
      expect(() => ref(null)).not.toThrow();
    });
  });
});
