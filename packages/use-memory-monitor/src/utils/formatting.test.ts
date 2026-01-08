import { describe, it, expect } from "vitest";
import {
  formatBytes,
  formatPercentage,
  formatNumber,
  formatDuration,
  calculateUsagePercentage,
  createFormattedMemory,
} from "./formatting";

describe("formatBytes", () => {
  describe("basic formatting", () => {
    it("should format 0 bytes", () => {
      expect(formatBytes(0)).toBe("0 B");
    });

    it("should format bytes", () => {
      expect(formatBytes(500)).toBe("500 B");
    });

    it("should format kilobytes", () => {
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(1536)).toBe("1.5 KB");
    });

    it("should format megabytes", () => {
      expect(formatBytes(1024 * 1024)).toBe("1 MB");
      expect(formatBytes(1024 * 1024 * 50)).toBe("50 MB");
    });

    it("should format gigabytes", () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe("1 GB");
      expect(formatBytes(1024 * 1024 * 1024 * 2)).toBe("2 GB");
    });

    it("should format terabytes", () => {
      expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe("1 TB");
    });
  });

  describe("decimal precision", () => {
    it("should use default 2 decimal places", () => {
      expect(formatBytes(1536)).toBe("1.5 KB");
    });

    it("should respect custom decimal places", () => {
      expect(formatBytes(1536, 0)).toBe("2 KB");
      expect(formatBytes(1536, 1)).toBe("1.5 KB");
      expect(formatBytes(1536, 3)).toBe("1.5 KB");
    });

    it("should trim trailing zeros", () => {
      expect(formatBytes(1024, 3)).toBe("1 KB");
      expect(formatBytes(1024 * 1024, 2)).toBe("1 MB");
    });
  });

  describe("edge cases", () => {
    it("should handle null", () => {
      expect(formatBytes(null)).toBe("N/A");
    });

    it("should handle undefined", () => {
      expect(formatBytes(undefined)).toBe("N/A");
    });

    it("should handle negative values", () => {
      expect(formatBytes(-1024)).toBe("-1 KB");
      expect(formatBytes(-1024 * 1024)).toBe("-1 MB");
    });

    it("should handle very large values", () => {
      const result = formatBytes(1024 * 1024 * 1024 * 1024 * 100);
      expect(result).toContain("TB");
    });

    it("should handle very small values", () => {
      expect(formatBytes(1)).toBe("1 B");
      expect(formatBytes(0.5)).toBe("0.5 B");
    });
  });
});

describe("formatPercentage", () => {
  it("should format percentage with default precision", () => {
    expect(formatPercentage(50)).toBe("50.0%");
    expect(formatPercentage(75.5)).toBe("75.5%");
  });

  it("should respect custom decimal places", () => {
    expect(formatPercentage(75.555, 2)).toBe("75.56%");
    expect(formatPercentage(75.555, 0)).toBe("76%");
  });

  it("should handle null", () => {
    expect(formatPercentage(null)).toBe("N/A");
  });

  it("should handle undefined", () => {
    expect(formatPercentage(undefined)).toBe("N/A");
  });

  it("should handle edge values", () => {
    expect(formatPercentage(0)).toBe("0.0%");
    expect(formatPercentage(100)).toBe("100.0%");
  });
});

describe("formatNumber", () => {
  it("should format numbers with thousand separators", () => {
    expect(formatNumber(1000)).toMatch(/1[,.]000/);
    expect(formatNumber(1000000)).toMatch(/1[,.]000[,.]000/);
  });

  it("should handle null", () => {
    expect(formatNumber(null)).toBe("N/A");
  });

  it("should handle undefined", () => {
    expect(formatNumber(undefined)).toBe("N/A");
  });

  it("should handle small numbers", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(999)).toBe("999");
  });
});

describe("formatDuration", () => {
  it("should format milliseconds", () => {
    expect(formatDuration(500)).toBe("500ms");
    expect(formatDuration(999)).toBe("999ms");
  });

  it("should format seconds", () => {
    expect(formatDuration(1000)).toBe("1.0s");
    expect(formatDuration(5500)).toBe("5.5s");
  });

  it("should format minutes", () => {
    expect(formatDuration(60000)).toBe("1.0m");
    expect(formatDuration(150000)).toBe("2.5m");
  });

  it("should format hours", () => {
    expect(formatDuration(3600000)).toBe("1.0h");
    expect(formatDuration(5400000)).toBe("1.5h");
  });
});

describe("calculateUsagePercentage", () => {
  it("should calculate percentage correctly", () => {
    expect(calculateUsagePercentage(50, 100)).toBe(50);
    expect(calculateUsagePercentage(75, 100)).toBe(75);
    expect(calculateUsagePercentage(1024, 2048)).toBe(50);
  });

  it("should clamp to 0-100 range", () => {
    expect(calculateUsagePercentage(150, 100)).toBe(100);
    expect(calculateUsagePercentage(-10, 100)).toBe(0);
  });

  it("should handle null values", () => {
    expect(calculateUsagePercentage(null, 100)).toBe(null);
    expect(calculateUsagePercentage(50, null)).toBe(null);
    expect(calculateUsagePercentage(null, null)).toBe(null);
  });

  it("should handle undefined values", () => {
    expect(calculateUsagePercentage(undefined, 100)).toBe(null);
    expect(calculateUsagePercentage(50, undefined)).toBe(null);
  });

  it("should handle zero limit", () => {
    expect(calculateUsagePercentage(50, 0)).toBe(null);
  });

  it("should handle negative limit", () => {
    expect(calculateUsagePercentage(50, -100)).toBe(null);
  });
});

describe("createFormattedMemory", () => {
  it("should create formatted memory object from memory info", () => {
    const memory = {
      heapUsed: 50 * 1024 * 1024,
      heapTotal: 100 * 1024 * 1024,
      heapLimit: 2 * 1024 * 1024 * 1024,
      timestamp: Date.now(),
    };

    const formatted = createFormattedMemory(memory);

    expect(formatted.heapUsed).toBe("50 MB");
    expect(formatted.heapTotal).toBe("100 MB");
    expect(formatted.heapLimit).toBe("2 GB");
    expect(formatted.domNodes).toBeUndefined();
    expect(formatted.eventListeners).toBeUndefined();
  });

  it("should include DOM nodes when provided", () => {
    const memory = {
      heapUsed: 50 * 1024 * 1024,
      heapTotal: 100 * 1024 * 1024,
      heapLimit: 2 * 1024 * 1024 * 1024,
      timestamp: Date.now(),
    };

    const formatted = createFormattedMemory(memory, 1500);

    expect(formatted.domNodes).toMatch(/1[,.]500/);
  });

  it("should include event listeners when provided", () => {
    const memory = {
      heapUsed: 50 * 1024 * 1024,
      heapTotal: 100 * 1024 * 1024,
      heapLimit: 2 * 1024 * 1024 * 1024,
      timestamp: Date.now(),
    };

    const formatted = createFormattedMemory(memory, null, 250);

    expect(formatted.eventListeners).toBe("250");
  });

  it("should handle null memory", () => {
    const formatted = createFormattedMemory(null);

    expect(formatted.heapUsed).toBe("N/A");
    expect(formatted.heapTotal).toBe("N/A");
    expect(formatted.heapLimit).toBe("N/A");
  });
});
