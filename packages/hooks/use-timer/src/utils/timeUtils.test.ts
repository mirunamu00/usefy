import { describe, it, expect } from "vitest";
import { toMs, fromMs, decompose } from "./timeUtils";

describe("timeUtils", () => {
  describe("toMs", () => {
    describe("milliseconds unit", () => {
      it("returns same value for ms unit", () => {
        expect(toMs(1000, "ms")).toBe(1000);
      });

      it("floors decimal values", () => {
        expect(toMs(1500.7, "ms")).toBe(1500);
      });
    });

    describe("seconds unit", () => {
      it("converts seconds to milliseconds", () => {
        expect(toMs(1, "seconds")).toBe(1000);
        expect(toMs(5, "seconds")).toBe(5000);
        expect(toMs(60, "seconds")).toBe(60000);
      });

      it("floors decimal seconds", () => {
        expect(toMs(1.5, "seconds")).toBe(1500);
        expect(toMs(2.7, "seconds")).toBe(2700);
      });
    });

    describe("minutes unit", () => {
      it("converts minutes to milliseconds", () => {
        expect(toMs(1, "minutes")).toBe(60000);
        expect(toMs(5, "minutes")).toBe(300000);
        expect(toMs(60, "minutes")).toBe(3600000);
      });

      it("handles fractional minutes", () => {
        expect(toMs(1.5, "minutes")).toBe(90000);
      });
    });

    describe("hours unit", () => {
      it("converts hours to milliseconds", () => {
        expect(toMs(1, "hours")).toBe(3600000);
        expect(toMs(2, "hours")).toBe(7200000);
        expect(toMs(24, "hours")).toBe(86400000);
      });

      it("handles fractional hours", () => {
        expect(toMs(1.5, "hours")).toBe(5400000);
      });
    });

    describe("edge cases", () => {
      it("returns 0 for negative values", () => {
        expect(toMs(-1, "seconds")).toBe(0);
        expect(toMs(-100, "minutes")).toBe(0);
      });

      it("returns 0 for 0 input", () => {
        expect(toMs(0, "seconds")).toBe(0);
        expect(toMs(0, "minutes")).toBe(0);
        expect(toMs(0, "hours")).toBe(0);
      });
    });
  });

  describe("fromMs", () => {
    describe("to milliseconds", () => {
      it("returns same value", () => {
        expect(fromMs(1000, "ms")).toBe(1000);
      });
    });

    describe("to seconds", () => {
      it("converts milliseconds to seconds", () => {
        expect(fromMs(1000, "seconds")).toBe(1);
        expect(fromMs(5000, "seconds")).toBe(5);
        expect(fromMs(60000, "seconds")).toBe(60);
      });

      it("returns fractional seconds", () => {
        expect(fromMs(1500, "seconds")).toBe(1.5);
        expect(fromMs(2750, "seconds")).toBe(2.75);
      });
    });

    describe("to minutes", () => {
      it("converts milliseconds to minutes", () => {
        expect(fromMs(60000, "minutes")).toBe(1);
        expect(fromMs(300000, "minutes")).toBe(5);
      });

      it("returns fractional minutes", () => {
        expect(fromMs(90000, "minutes")).toBe(1.5);
      });
    });

    describe("to hours", () => {
      it("converts milliseconds to hours", () => {
        expect(fromMs(3600000, "hours")).toBe(1);
        expect(fromMs(7200000, "hours")).toBe(2);
      });

      it("returns fractional hours", () => {
        expect(fromMs(5400000, "hours")).toBe(1.5);
      });
    });

    describe("edge cases", () => {
      it("handles 0", () => {
        expect(fromMs(0, "seconds")).toBe(0);
        expect(fromMs(0, "minutes")).toBe(0);
        expect(fromMs(0, "hours")).toBe(0);
      });

      it("handles negative values", () => {
        expect(fromMs(-1000, "seconds")).toBe(-1);
      });
    });
  });

  describe("decompose", () => {
    it("decomposes 0ms correctly", () => {
      expect(decompose(0)).toEqual({
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      });
    });

    it("decomposes milliseconds only", () => {
      expect(decompose(500)).toEqual({
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 500,
      });
    });

    it("decomposes seconds correctly", () => {
      expect(decompose(5000)).toEqual({
        hours: 0,
        minutes: 0,
        seconds: 5,
        milliseconds: 0,
      });
    });

    it("decomposes seconds with milliseconds", () => {
      expect(decompose(5500)).toEqual({
        hours: 0,
        minutes: 0,
        seconds: 5,
        milliseconds: 500,
      });
    });

    it("decomposes minutes correctly", () => {
      expect(decompose(120000)).toEqual({
        hours: 0,
        minutes: 2,
        seconds: 0,
        milliseconds: 0,
      });
    });

    it("decomposes hours correctly", () => {
      expect(decompose(3600000)).toEqual({
        hours: 1,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      });
    });

    it("decomposes complex time correctly", () => {
      // 2h 30m 45s 123ms
      const ms = 2 * 3600000 + 30 * 60000 + 45 * 1000 + 123;
      expect(decompose(ms)).toEqual({
        hours: 2,
        minutes: 30,
        seconds: 45,
        milliseconds: 123,
      });
    });

    it("handles 59:59.999", () => {
      const ms = 59 * 60000 + 59 * 1000 + 999;
      expect(decompose(ms)).toEqual({
        hours: 0,
        minutes: 59,
        seconds: 59,
        milliseconds: 999,
      });
    });

    it("handles negative values by treating as 0", () => {
      expect(decompose(-1000)).toEqual({
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      });
    });

    it("floors milliseconds for fractional input", () => {
      expect(decompose(1500.7)).toEqual({
        hours: 0,
        minutes: 0,
        seconds: 1,
        milliseconds: 500,
      });
    });

    it("handles exactly 1 second boundary", () => {
      expect(decompose(1000)).toEqual({
        hours: 0,
        minutes: 0,
        seconds: 1,
        milliseconds: 0,
      });
    });

    it("handles 999ms correctly", () => {
      expect(decompose(999)).toEqual({
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 999,
      });
    });

    it("handles large values (100 hours)", () => {
      const ms = 100 * 3600000 + 30 * 60000 + 45 * 1000 + 678;
      expect(decompose(ms)).toEqual({
        hours: 100,
        minutes: 30,
        seconds: 45,
        milliseconds: 678,
      });
    });
  });
});

