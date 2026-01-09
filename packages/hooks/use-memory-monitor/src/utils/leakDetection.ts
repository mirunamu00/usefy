import type {
  LeakAnalysis,
  LeakSensitivity,
  MemoryInfo,
  Trend,
} from "../types";
import {
  LEAK_SENSITIVITY_CONFIG,
  MIN_LEAK_DETECTION_SAMPLES,
  TREND_THRESHOLDS,
} from "../constants";

/**
 * Result of linear regression analysis
 */
export interface RegressionResult {
  /** Slope of the regression line (bytes per sample) */
  slope: number;
  /** Y-intercept of the regression line */
  intercept: number;
  /** R-squared value (coefficient of determination, 0-1) */
  rSquared: number;
}

/**
 * Perform simple linear regression on a set of points.
 * Uses the least squares method.
 *
 * @param points - Array of [x, y] coordinate pairs
 * @returns Regression result with slope, intercept, and R-squared
 */
export function linearRegression(points: [number, number][]): RegressionResult {
  const n = points.length;

  if (n < 2) {
    return { slope: 0, intercept: 0, rSquared: 0 };
  }

  // Calculate sums
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (const [x, y] of points) {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  // Calculate slope and intercept
  const denominator = n * sumX2 - sumX * sumX;

  if (denominator === 0) {
    return { slope: 0, intercept: sumY / n, rSquared: 0 };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared (coefficient of determination)
  const meanY = sumY / n;
  let ssTotal = 0; // Total sum of squares
  let ssResidual = 0; // Residual sum of squares

  for (const [x, y] of points) {
    const predicted = slope * x + intercept;
    ssTotal += Math.pow(y - meanY, 2);
    ssResidual += Math.pow(y - predicted, 2);
  }

  const rSquared = ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal;

  return {
    slope,
    intercept,
    rSquared: Math.max(0, Math.min(1, rSquared)), // Clamp to [0, 1]
  };
}

/**
 * Calculate the memory trend from samples.
 *
 * @param samples - Array of memory info samples
 * @returns Trend direction
 */
export function calculateTrend(samples: MemoryInfo[]): Trend {
  if (samples.length < 2) {
    return "stable";
  }

  // Convert samples to [index, heapUsed] points
  const points: [number, number][] = samples.map((s, i) => [i, s.heapUsed]);
  const { slope } = linearRegression(points);

  // Normalize slope by average heap size for relative comparison
  const avgHeap = samples.reduce((sum, s) => sum + s.heapUsed, 0) / samples.length;
  const normalizedSlope = avgHeap > 0 ? slope / avgHeap : 0;

  if (normalizedSlope > TREND_THRESHOLDS.increasing) {
    return "increasing";
  }

  if (normalizedSlope < TREND_THRESHOLDS.decreasing) {
    return "decreasing";
  }

  return "stable";
}

/**
 * Calculate average growth rate (bytes per sample).
 *
 * @param samples - Array of memory info samples
 * @returns Average growth rate in bytes per sample
 */
export function calculateAverageGrowth(samples: MemoryInfo[]): number {
  if (samples.length < 2) {
    return 0;
  }

  const points: [number, number][] = samples.map((s, i) => [i, s.heapUsed]);
  const { slope } = linearRegression(points);

  return slope;
}

/**
 * Generate a human-readable recommendation based on leak analysis.
 *
 * @param probability - Leak probability (0-100)
 * @param trend - Memory trend
 * @param averageGrowth - Average growth rate in bytes
 * @returns Recommendation string
 */
export function generateRecommendation(
  probability: number,
  trend: Trend,
  averageGrowth: number
): string | undefined {
  if (probability < 30) {
    return undefined;
  }

  if (probability >= 80) {
    return `Critical: High probability of memory leak detected. Memory is growing at ${formatGrowthRate(averageGrowth)} per sample. Consider profiling with browser DevTools.`;
  }

  if (probability >= 60) {
    return `Warning: Possible memory leak detected. Memory trend is ${trend}. Monitor closely and check for retained references.`;
  }

  if (probability >= 30 && trend === "increasing") {
    return `Note: Memory usage is trending upward. This may be normal for your application, but consider monitoring.`;
  }

  return undefined;
}

/**
 * Format growth rate for display.
 *
 * @param bytesPerSample - Growth rate in bytes per sample
 * @returns Formatted string
 */
function formatGrowthRate(bytesPerSample: number): string {
  const absBytes = Math.abs(bytesPerSample);

  if (absBytes >= 1024 * 1024) {
    return `${(bytesPerSample / (1024 * 1024)).toFixed(2)} MB`;
  }

  if (absBytes >= 1024) {
    return `${(bytesPerSample / 1024).toFixed(2)} KB`;
  }

  return `${bytesPerSample.toFixed(0)} bytes`;
}

/**
 * Analyze memory samples for potential leaks.
 *
 * @param samples - Array of memory info samples (minimum 5 recommended)
 * @param sensitivity - Detection sensitivity level
 * @param customThreshold - Optional custom growth threshold (bytes/sample)
 * @returns Leak analysis result
 */
export function analyzeLeakProbability(
  samples: MemoryInfo[],
  sensitivity: LeakSensitivity = "medium",
  customThreshold?: number
): LeakAnalysis {
  // Not enough samples for reliable analysis
  if (samples.length < MIN_LEAK_DETECTION_SAMPLES) {
    return {
      isLeaking: false,
      probability: 0,
      trend: calculateTrend(samples),
      averageGrowth: calculateAverageGrowth(samples),
      rSquared: 0,
      samples,
      recommendation: undefined,
    };
  }

  const config = LEAK_SENSITIVITY_CONFIG[sensitivity];
  const threshold = customThreshold ?? config.minSlope;

  // Convert samples to points for regression
  const points: [number, number][] = samples.map((s, i) => [i, s.heapUsed]);
  const { slope, rSquared } = linearRegression(points);

  // Calculate probability based on slope and fit quality
  let probability = 0;

  if (slope > 0 && rSquared >= config.minR2) {
    // Base probability from slope exceeding threshold
    const slopeRatio = slope / threshold;
    probability = Math.min(100, slopeRatio * 50 * rSquared * config.probabilityMultiplier);
  }

  const trend = calculateTrend(samples);
  const averageGrowth = slope;

  // Boost probability if trend is clearly increasing and R² is good
  if (trend === "increasing" && rSquared > 0.7 && probability < 60) {
    probability = Math.max(probability, 40);
  }

  // Cap probability
  probability = Math.min(100, Math.max(0, probability));

  const isLeaking = probability > 50;

  return {
    isLeaking,
    probability: Math.round(probability),
    trend,
    averageGrowth,
    rSquared,
    samples,
    recommendation: generateRecommendation(probability, trend, averageGrowth),
  };
}

/**
 * Quick check if memory is trending upward (without full analysis).
 *
 * @param samples - Array of memory info samples
 * @returns True if memory appears to be growing
 */
export function isMemoryGrowing(samples: MemoryInfo[]): boolean {
  if (samples.length < 3) {
    return false;
  }

  const trend = calculateTrend(samples);
  return trend === "increasing";
}
