import { describe, it, expect } from "vitest";
import {
  linearRegression,
  calculateTrend,
  calculateAverageGrowth,
  analyzeLeakProbability,
  isMemoryGrowing,
  generateRecommendation,
} from "./leakDetection";
import type { MemoryInfo } from "../types";

// Helper to create memory samples
function createMemorySamples(
  heapValues: number[],
  baseTimestamp = Date.now()
): MemoryInfo[] {
  return heapValues.map((heapUsed, index) => ({
    heapUsed,
    heapTotal: heapUsed * 2,
    heapLimit: 2 * 1024 * 1024 * 1024, // 2GB
    timestamp: baseTimestamp + index * 5000,
  }));
}

describe("linearRegression", () => {
  describe("basic regression", () => {
    it("should calculate slope for perfectly linear data", () => {
      const points: [number, number][] = [
        [0, 0],
        [1, 10],
        [2, 20],
        [3, 30],
        [4, 40],
      ];

      const result = linearRegression(points);

      expect(result.slope).toBe(10);
      expect(result.intercept).toBe(0);
      expect(result.rSquared).toBeCloseTo(1, 5);
    });

    it("should calculate slope for increasing data", () => {
      const points: [number, number][] = [
        [0, 100],
        [1, 150],
        [2, 180],
        [3, 220],
        [4, 270],
      ];

      const result = linearRegression(points);

      expect(result.slope).toBeGreaterThan(0);
      expect(result.rSquared).toBeGreaterThan(0.9);
    });

    it("should calculate negative slope for decreasing data", () => {
      const points: [number, number][] = [
        [0, 100],
        [1, 80],
        [2, 60],
        [3, 40],
        [4, 20],
      ];

      const result = linearRegression(points);

      expect(result.slope).toBe(-20);
      expect(result.rSquared).toBeCloseTo(1, 5);
    });

    it("should return zero slope for constant data", () => {
      const points: [number, number][] = [
        [0, 50],
        [1, 50],
        [2, 50],
        [3, 50],
        [4, 50],
      ];

      const result = linearRegression(points);

      expect(result.slope).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("should handle single point", () => {
      const points: [number, number][] = [[0, 100]];

      const result = linearRegression(points);

      expect(result.slope).toBe(0);
      expect(result.rSquared).toBe(0);
    });

    it("should handle empty array", () => {
      const points: [number, number][] = [];

      const result = linearRegression(points);

      expect(result.slope).toBe(0);
      expect(result.rSquared).toBe(0);
    });

    it("should handle two points", () => {
      const points: [number, number][] = [
        [0, 0],
        [1, 100],
      ];

      const result = linearRegression(points);

      expect(result.slope).toBe(100);
      expect(result.intercept).toBe(0);
    });

    it("should handle noisy data", () => {
      const points: [number, number][] = [
        [0, 100],
        [1, 150],
        [2, 120],
        [3, 180],
        [4, 200],
      ];

      const result = linearRegression(points);

      expect(result.slope).toBeGreaterThan(0);
      expect(result.rSquared).toBeGreaterThan(0.5);
      expect(result.rSquared).toBeLessThan(1);
    });
  });
});

describe("calculateTrend", () => {
  it("should detect increasing trend", () => {
    const samples = createMemorySamples([
      1000000, 1100000, 1200000, 1300000, 1400000,
    ]);

    expect(calculateTrend(samples)).toBe("increasing");
  });

  it("should detect decreasing trend", () => {
    const samples = createMemorySamples([
      1400000, 1300000, 1200000, 1100000, 1000000,
    ]);

    expect(calculateTrend(samples)).toBe("decreasing");
  });

  it("should detect stable trend", () => {
    const samples = createMemorySamples([
      1000000, 1000100, 999900, 1000050, 999950,
    ]);

    expect(calculateTrend(samples)).toBe("stable");
  });

  it("should return stable for insufficient samples", () => {
    const samples = createMemorySamples([1000000]);

    expect(calculateTrend(samples)).toBe("stable");
  });

  it("should return stable for empty array", () => {
    expect(calculateTrend([])).toBe("stable");
  });
});

describe("calculateAverageGrowth", () => {
  it("should calculate positive growth rate", () => {
    const samples = createMemorySamples([
      1000000, 1100000, 1200000, 1300000, 1400000,
    ]);

    const growth = calculateAverageGrowth(samples);

    expect(growth).toBeCloseTo(100000, -2);
  });

  it("should calculate negative growth rate", () => {
    const samples = createMemorySamples([
      1400000, 1300000, 1200000, 1100000, 1000000,
    ]);

    const growth = calculateAverageGrowth(samples);

    expect(growth).toBeCloseTo(-100000, -2);
  });

  it("should return zero for constant values", () => {
    const samples = createMemorySamples([
      1000000, 1000000, 1000000, 1000000, 1000000,
    ]);

    const growth = calculateAverageGrowth(samples);

    expect(growth).toBe(0);
  });

  it("should return zero for insufficient samples", () => {
    const samples = createMemorySamples([1000000]);

    expect(calculateAverageGrowth(samples)).toBe(0);
  });
});

describe("analyzeLeakProbability", () => {
  describe("with insufficient samples", () => {
    it("should return isLeaking: false with less than 5 samples", () => {
      const samples = createMemorySamples([1000000, 1100000, 1200000]);

      const analysis = analyzeLeakProbability(samples);

      expect(analysis.isLeaking).toBe(false);
      expect(analysis.probability).toBe(0);
    });
  });

  describe("with clearly increasing memory", () => {
    it("should detect high leak probability", () => {
      // Create samples with significant, consistent growth
      const samples = createMemorySamples([
        50 * 1024 * 1024, // 50MB
        55 * 1024 * 1024, // 55MB
        60 * 1024 * 1024, // 60MB
        65 * 1024 * 1024, // 65MB
        70 * 1024 * 1024, // 70MB
        75 * 1024 * 1024, // 75MB
        80 * 1024 * 1024, // 80MB
        85 * 1024 * 1024, // 85MB
        90 * 1024 * 1024, // 90MB
        95 * 1024 * 1024, // 95MB
      ]);

      const analysis = analyzeLeakProbability(samples, "high");

      expect(analysis.trend).toBe("increasing");
      expect(analysis.rSquared).toBeGreaterThan(0.9);
      expect(analysis.averageGrowth).toBeGreaterThan(0);
    });
  });

  describe("with stable memory", () => {
    it("should return low leak probability", () => {
      const samples = createMemorySamples([
        50 * 1024 * 1024,
        50 * 1024 * 1024,
        50 * 1024 * 1024,
        50 * 1024 * 1024,
        50 * 1024 * 1024,
      ]);

      const analysis = analyzeLeakProbability(samples);

      expect(analysis.isLeaking).toBe(false);
      expect(analysis.probability).toBeLessThan(30);
      expect(analysis.trend).toBe("stable");
    });
  });

  describe("with decreasing memory", () => {
    it("should return isLeaking: false", () => {
      const samples = createMemorySamples([
        100 * 1024 * 1024,
        90 * 1024 * 1024,
        80 * 1024 * 1024,
        70 * 1024 * 1024,
        60 * 1024 * 1024,
      ]);

      const analysis = analyzeLeakProbability(samples);

      expect(analysis.isLeaking).toBe(false);
      expect(analysis.trend).toBe("decreasing");
    });
  });

  describe("sensitivity levels", () => {
    it("should be more sensitive with 'high' setting", () => {
      const samples = createMemorySamples([
        50 * 1024 * 1024,
        51 * 1024 * 1024,
        52 * 1024 * 1024,
        53 * 1024 * 1024,
        54 * 1024 * 1024,
        55 * 1024 * 1024,
      ]);

      const highAnalysis = analyzeLeakProbability(samples, "high");
      const lowAnalysis = analyzeLeakProbability(samples, "low");

      expect(highAnalysis.probability).toBeGreaterThanOrEqual(lowAnalysis.probability);
    });
  });

  describe("custom threshold", () => {
    it("should use custom threshold when provided", () => {
      const samples = createMemorySamples([
        50 * 1024 * 1024,
        51 * 1024 * 1024,
        52 * 1024 * 1024,
        53 * 1024 * 1024,
        54 * 1024 * 1024,
        55 * 1024 * 1024,
      ]);

      const withLowThreshold = analyzeLeakProbability(samples, "medium", 1000);
      const withHighThreshold = analyzeLeakProbability(
        samples,
        "medium",
        10000000
      );

      expect(withLowThreshold.probability).toBeGreaterThan(
        withHighThreshold.probability
      );
    });
  });
});

describe("isMemoryGrowing", () => {
  it("should return true for growing memory", () => {
    const samples = createMemorySamples([
      1000000, 1200000, 1400000, 1600000, 1800000,
    ]);

    expect(isMemoryGrowing(samples)).toBe(true);
  });

  it("should return false for stable memory", () => {
    const samples = createMemorySamples([
      1000000, 1000100, 999900, 1000050, 999950,
    ]);

    expect(isMemoryGrowing(samples)).toBe(false);
  });

  it("should return false for decreasing memory", () => {
    const samples = createMemorySamples([
      2000000, 1800000, 1600000, 1400000, 1200000,
    ]);

    expect(isMemoryGrowing(samples)).toBe(false);
  });

  it("should return false for insufficient samples", () => {
    const samples = createMemorySamples([1000000, 1100000]);

    expect(isMemoryGrowing(samples)).toBe(false);
  });
});

describe("generateRecommendation", () => {
  it("should return undefined for low probability", () => {
    expect(generateRecommendation(20, "stable", 1000)).toBeUndefined();
  });

  it("should return warning for medium probability", () => {
    const rec = generateRecommendation(60, "increasing", 50000);

    expect(rec).toBeDefined();
    expect(rec).toContain("Warning");
  });

  it("should return critical message for high probability", () => {
    const rec = generateRecommendation(85, "increasing", 1024 * 1024);

    expect(rec).toBeDefined();
    expect(rec).toContain("Critical");
    expect(rec).toContain("DevTools");
  });

  it("should return note for borderline case with increasing trend", () => {
    const rec = generateRecommendation(35, "increasing", 10000);

    expect(rec).toBeDefined();
    expect(rec).toContain("Note");
  });
});
