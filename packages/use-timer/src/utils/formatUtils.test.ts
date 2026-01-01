import { describe, it, expect } from "vitest";
import { formatTime } from "./formatUtils";

describe("formatUtils", () => {
  describe("formatTime", () => {
    describe("HH:MM:SS format", () => {
      it("formats 0ms correctly", () => {
        expect(formatTime(0, "HH:MM:SS")).toBe("00:00:00");
      });

      it("formats 1 hour correctly", () => {
        expect(formatTime(3600000, "HH:MM:SS")).toBe("01:00:00");
      });

      it("formats complex time correctly", () => {
        // 2h 30m 45s
        const ms = 2 * 3600000 + 30 * 60000 + 45 * 1000;
        expect(formatTime(ms, "HH:MM:SS")).toBe("02:30:45");
      });

      it("handles large hours", () => {
        // 99 hours
        expect(formatTime(99 * 3600000, "HH:MM:SS")).toBe("99:00:00");
      });
    });

    describe("MM:SS format", () => {
      it("formats 0ms correctly", () => {
        expect(formatTime(0, "MM:SS")).toBe("00:00");
      });

      it("formats 1 minute correctly", () => {
        expect(formatTime(60000, "MM:SS")).toBe("01:00");
      });

      it("formats 5 minutes 30 seconds correctly", () => {
        expect(formatTime(330000, "MM:SS")).toBe("05:30");
      });

      it("converts hours to minutes", () => {
        // 1h 30m = 90 minutes
        expect(formatTime(5400000, "MM:SS")).toBe("90:00");
      });
    });

    describe("SS format", () => {
      it("formats 0ms correctly", () => {
        expect(formatTime(0, "SS")).toBe("0");
      });

      it("formats 1 second correctly", () => {
        expect(formatTime(1000, "SS")).toBe("1");
      });

      it("formats 90 seconds correctly", () => {
        expect(formatTime(90000, "SS")).toBe("90");
      });

      it("converts hours and minutes to seconds", () => {
        // 1h 1m 1s = 3661 seconds
        const ms = 3600000 + 60000 + 1000;
        expect(formatTime(ms, "SS")).toBe("3661");
      });
    });

    describe("mm:ss.SSS format", () => {
      it("formats 0ms correctly", () => {
        expect(formatTime(0, "mm:ss.SSS")).toBe("00:00.000");
      });

      it("formats 1.5 seconds correctly", () => {
        expect(formatTime(1500, "mm:ss.SSS")).toBe("00:01.500");
      });

      it("formats complex time with milliseconds", () => {
        // 2m 5s 123ms
        const ms = 2 * 60000 + 5 * 1000 + 123;
        expect(formatTime(ms, "mm:ss.SSS")).toBe("02:05.123");
      });

      it("converts hours to minutes", () => {
        // 1h 30m 45s 678ms
        const ms = 3600000 + 30 * 60000 + 45 * 1000 + 678;
        expect(formatTime(ms, "mm:ss.SSS")).toBe("90:45.678");
      });
    });

    describe("HH:MM:SS.SSS format", () => {
      it("formats 0ms correctly", () => {
        expect(formatTime(0, "HH:MM:SS.SSS")).toBe("00:00:00.000");
      });

      it("formats complex time with milliseconds", () => {
        // 2h 30m 45s 123ms
        const ms = 2 * 3600000 + 30 * 60000 + 45 * 1000 + 123;
        expect(formatTime(ms, "HH:MM:SS.SSS")).toBe("02:30:45.123");
      });

      it("formats 1ms correctly", () => {
        expect(formatTime(1, "HH:MM:SS.SSS")).toBe("00:00:00.001");
      });

      it("formats 999ms correctly", () => {
        expect(formatTime(999, "HH:MM:SS.SSS")).toBe("00:00:00.999");
      });
    });

    describe("default format (fallback)", () => {
      it("falls back to MM:SS for unknown format", () => {
        // @ts-expect-error Testing invalid format
        expect(formatTime(90000, "INVALID")).toBe("01:30");
      });
    });

    describe("edge cases", () => {
      it("handles negative values by treating as 0", () => {
        expect(formatTime(-1000, "MM:SS")).toBe("00:00");
        expect(formatTime(-1000, "HH:MM:SS")).toBe("00:00:00");
      });

      it("handles very large values", () => {
        // 100 hours
        const ms = 100 * 3600000;
        expect(formatTime(ms, "HH:MM:SS")).toBe("100:00:00");
      });

      it("handles fractional milliseconds by flooring", () => {
        expect(formatTime(1500.7, "mm:ss.SSS")).toBe("00:01.500");
      });
    });
  });
});

