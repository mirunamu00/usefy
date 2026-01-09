/**
 * Memory Diagnostic Report Generator
 *
 * Generates comprehensive HTML reports from snapshot data
 * with statistical analysis, leak detection, and recommendations.
 */

import type { PanelSnapshot } from "../types";
import { formatBytes } from "../constants";

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration for report generation
 */
export interface ReportConfig {
  /** Minimum snapshots required for report generation */
  minSnapshots: number;
  /** Application name for report header */
  appName?: string;
  /** Include detailed leak analysis section */
  includeLeakAnalysis: boolean;
  /** Include DOM/Event listener analysis section */
  includeDOMAnalysis: boolean;
}

/**
 * Statistical summary for a metric
 */
export interface StatsSummary {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  outliers: OutlierInfo[];
}

/**
 * Outlier detection result
 */
export interface OutlierInfo {
  snapshotLabel: string;
  snapshotId: string;
  value: number;
  deviation: number;
  timestamp: number;
}

/**
 * Complete statistics for all metrics
 */
export interface ReportStatistics {
  heapUsed: StatsSummary;
  heapTotal: StatsSummary;
  usagePercentage: StatsSummary;
  domNodes?: StatsSummary;
  eventListeners?: StatsSummary;
}

/**
 * Leak pattern classification
 */
export type LeakPattern = "gradual" | "sudden" | "intermittent" | "none";

/**
 * Leak pattern analysis report
 */
export interface LeakPatternReport {
  detected: boolean;
  confidence: number;
  pattern: LeakPattern;
  growthRate: number;
  suspectedCauses: string[];
  investigationGuidance: string[];
}

/**
 * Memory health grade
 */
export type HealthGrade = "A" | "B" | "C" | "D" | "F";

/**
 * Memory health assessment result
 */
export interface MemoryHealthAssessment {
  score: number;
  grade: HealthGrade;
  summary: string;
  recommendations: string[];
}

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_REPORT_CONFIG: ReportConfig = {
  minSnapshots: 5,
  includeLeakAnalysis: true,
  includeDOMAnalysis: true,
};

export const MIN_SNAPSHOTS_FOR_REPORT = 5;
export const RECOMMENDED_SNAPSHOTS = 10;

// Outlier threshold (standard deviations from mean)
const OUTLIER_THRESHOLD = 2;

// Leak pattern thresholds
const GRADUAL_LEAK_SLOPE_THRESHOLD = 1000; // bytes per second
const SPIKE_THRESHOLD = 0.3; // 30% increase between consecutive snapshots

// ============================================================================
// Statistical Functions
// ============================================================================

/**
 * Calculate statistical summary for a set of values
 */
export function calculateStatsSummary(
  values: number[],
  labels: string[],
  ids: string[],
  timestamps: number[]
): StatsSummary {
  if (values.length === 0) {
    return {
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      outliers: [],
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  // Min, Max
  const min = sorted[0];
  const max = sorted[n - 1];

  // Mean
  const sum = values.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;

  // Median
  const median =
    n % 2 === 0
      ? (sorted[Math.floor(n / 2) - 1] + sorted[Math.floor(n / 2)]) / 2
      : sorted[Math.floor(n / 2)];

  // Standard Deviation
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((acc, v) => acc + v, 0) / n;
  const stdDev = Math.sqrt(variance);

  // Outliers (beyond 2 standard deviations)
  const outliers: OutlierInfo[] = [];
  values.forEach((v, i) => {
    const deviation = Math.abs(v - mean);
    if (deviation > OUTLIER_THRESHOLD * stdDev && stdDev > 0) {
      outliers.push({
        snapshotLabel: labels[i],
        snapshotId: ids[i],
        value: v,
        deviation: deviation / stdDev,
        timestamp: timestamps[i],
      });
    }
  });

  return { min, max, mean, median, stdDev, outliers };
}

/**
 * Calculate statistics for all metrics from snapshots
 */
export function calculateStatistics(
  snapshots: PanelSnapshot[]
): ReportStatistics {
  const labels = snapshots.map((s) => s.label);
  const ids = snapshots.map((s) => s.id);
  const timestamps = snapshots.map((s) => s.timestamp);

  const heapUsedValues = snapshots.map((s) => s.heapUsed);
  const heapTotalValues = snapshots.map((s) => s.heapTotal);
  const usageValues = snapshots.map(
    (s) => (s.heapUsed / s.heapLimit) * 100
  );

  const stats: ReportStatistics = {
    heapUsed: calculateStatsSummary(heapUsedValues, labels, ids, timestamps),
    heapTotal: calculateStatsSummary(heapTotalValues, labels, ids, timestamps),
    usagePercentage: calculateStatsSummary(usageValues, labels, ids, timestamps),
  };

  // DOM Nodes (if available)
  const domNodesValues = snapshots
    .filter((s) => s.domNodes !== undefined)
    .map((s) => s.domNodes!);
  if (domNodesValues.length > 0) {
    const domLabels = snapshots
      .filter((s) => s.domNodes !== undefined)
      .map((s) => s.label);
    const domIds = snapshots
      .filter((s) => s.domNodes !== undefined)
      .map((s) => s.id);
    const domTimestamps = snapshots
      .filter((s) => s.domNodes !== undefined)
      .map((s) => s.timestamp);
    stats.domNodes = calculateStatsSummary(
      domNodesValues,
      domLabels,
      domIds,
      domTimestamps
    );
  }

  // Event Listeners (if available)
  const listenersValues = snapshots
    .filter((s) => s.eventListeners !== undefined)
    .map((s) => s.eventListeners!);
  if (listenersValues.length > 0) {
    const listenerLabels = snapshots
      .filter((s) => s.eventListeners !== undefined)
      .map((s) => s.label);
    const listenerIds = snapshots
      .filter((s) => s.eventListeners !== undefined)
      .map((s) => s.id);
    const listenerTimestamps = snapshots
      .filter((s) => s.eventListeners !== undefined)
      .map((s) => s.timestamp);
    stats.eventListeners = calculateStatsSummary(
      listenersValues,
      listenerLabels,
      listenerIds,
      listenerTimestamps
    );
  }

  return stats;
}

// ============================================================================
// Leak Pattern Analysis
// ============================================================================

/**
 * Calculate linear regression slope
 */
function linearRegressionSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;

  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += Math.pow(i - xMean, 2);
  }

  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Detect sudden spikes in memory usage
 */
function detectSpikes(values: number[]): boolean {
  for (let i = 1; i < values.length; i++) {
    const increase = (values[i] - values[i - 1]) / values[i - 1];
    if (increase > SPIKE_THRESHOLD) {
      return true;
    }
  }
  return false;
}

/**
 * Detect oscillation pattern (increase followed by decrease)
 */
function detectOscillation(values: number[]): boolean {
  if (values.length < 4) return false;

  let increasingCount = 0;
  let decreasingCount = 0;

  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[i - 1]) {
      increasingCount++;
    } else if (values[i] < values[i - 1]) {
      decreasingCount++;
    }
  }

  // Oscillation: roughly equal increases and decreases
  const total = values.length - 1;
  const ratio = Math.min(increasingCount, decreasingCount) / total;
  return ratio > 0.3; // At least 30% in both directions
}

/**
 * Classify leak pattern from snapshot data
 */
function classifyLeakPattern(snapshots: PanelSnapshot[]): LeakPattern {
  if (snapshots.length < 3) return "none";

  const heapValues = snapshots.map((s) => s.heapUsed);
  const slope = linearRegressionSlope(heapValues);

  // Calculate time-normalized slope (bytes per second)
  const timeSpan =
    (snapshots[snapshots.length - 1].timestamp - snapshots[0].timestamp) / 1000;
  const normalizedSlope = timeSpan > 0 ? (slope * snapshots.length) / timeSpan : 0;

  // Check for spikes
  if (detectSpikes(heapValues)) {
    return "sudden";
  }

  // Check for oscillation
  if (detectOscillation(heapValues)) {
    return "intermittent";
  }

  // Check for gradual increase
  if (normalizedSlope > GRADUAL_LEAK_SLOPE_THRESHOLD) {
    return "gradual";
  }

  return "none";
}

/**
 * Generate suspected causes based on pattern
 */
function generateSuspectedCauses(pattern: LeakPattern): string[] {
  switch (pattern) {
    case "gradual":
      return [
        "Event listeners not being removed",
        "Closures retaining references to large objects",
        "Timers/intervals not being cleared",
        "Accumulating cache without size limits",
        "DOM nodes being added without removal",
      ];
    case "sudden":
      return [
        "Large data structure allocation",
        "Bulk DOM manipulation",
        "Image/media loading without cleanup",
        "Memory-intensive computation",
        "Third-party library initialization",
      ];
    case "intermittent":
      return [
        "Periodic data fetching without cleanup",
        "Component mount/unmount cycles",
        "Temporary cache buildup",
        "Event handler accumulation on re-renders",
      ];
    default:
      return [];
  }
}

/**
 * Generate investigation guidance based on pattern
 */
function generateInvestigationGuidance(pattern: LeakPattern): string[] {
  const common = [
    "Use Chrome DevTools Memory tab to take heap snapshots",
    "Compare heap snapshots before and after suspected operations",
    "Use Performance Monitor to track JS heap size in real-time",
  ];

  switch (pattern) {
    case "gradual":
      return [
        ...common,
        "Check useEffect cleanup functions in React components",
        "Verify addEventListener has matching removeEventListener",
        "Ensure setInterval/setTimeout are cleared on unmount",
        "Look for growing arrays or objects in component state",
        "Check for subscriptions (RxJS, event emitters) not being unsubscribed",
      ];
    case "sudden":
      return [
        ...common,
        "Profile the specific operation that causes the spike",
        "Check for unnecessary deep cloning of large objects",
        "Verify image/media resources are properly disposed",
        "Look for synchronous operations loading large datasets",
      ];
    case "intermittent":
      return [
        ...common,
        "Monitor component lifecycle methods",
        "Check for memory accumulation across navigation",
        "Verify cached data is being properly invalidated",
        "Look for duplicate event handler registration",
      ];
    default:
      return common;
  }
}

/**
 * Identify leak patterns from snapshots
 */
export function identifyLeakPatterns(
  snapshots: PanelSnapshot[]
): LeakPatternReport {
  if (snapshots.length < MIN_SNAPSHOTS_FOR_REPORT) {
    return {
      detected: false,
      confidence: 0,
      pattern: "none",
      growthRate: 0,
      suspectedCauses: [],
      investigationGuidance: [],
    };
  }

  const pattern = classifyLeakPattern(snapshots);
  const heapValues = snapshots.map((s) => s.heapUsed);
  const slope = linearRegressionSlope(heapValues);

  // Calculate growth rate in bytes per second
  const timeSpan =
    (snapshots[snapshots.length - 1].timestamp - snapshots[0].timestamp) / 1000;
  const growthRate = timeSpan > 0 ? (slope * snapshots.length) / timeSpan : 0;

  // Calculate confidence from analysis context if available
  let confidence = 0;
  const contextSnapshots = snapshots.filter((s) => s.analysisContext);
  if (contextSnapshots.length > 0) {
    const avgLeakProb =
      contextSnapshots.reduce(
        (sum, s) => sum + (s.analysisContext?.leakProbability ?? 0),
        0
      ) / contextSnapshots.length;
    confidence = avgLeakProb;
  } else {
    // Estimate confidence based on pattern strength
    if (pattern === "gradual") {
      confidence = Math.min(80, Math.abs(growthRate) / 100);
    } else if (pattern === "sudden") {
      confidence = 60;
    } else if (pattern === "intermittent") {
      confidence = 40;
    }
  }

  const detected = pattern !== "none" && confidence > 30;

  return {
    detected,
    confidence,
    pattern,
    growthRate,
    suspectedCauses: generateSuspectedCauses(pattern),
    investigationGuidance: generateInvestigationGuidance(pattern),
  };
}

// ============================================================================
// Health Assessment
// ============================================================================

/**
 * Convert score to grade
 */
function scoreToGrade(score: number): HealthGrade {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

/**
 * Generate summary based on assessment
 */
function generateSummary(
  score: number,
  stats: ReportStatistics,
  leakReport: LeakPatternReport
): string {
  const grade = scoreToGrade(score);
  const avgUsage = stats.usagePercentage.mean.toFixed(1);
  const maxUsage = stats.usagePercentage.max.toFixed(1);

  if (grade === "A") {
    return `Excellent memory health. Average usage at ${avgUsage}% with stable patterns. No significant issues detected.`;
  } else if (grade === "B") {
    return `Good memory health. Average usage at ${avgUsage}% (max ${maxUsage}%). Minor optimization opportunities may exist.`;
  } else if (grade === "C") {
    return `Moderate memory health concerns. Average usage at ${avgUsage}% (max ${maxUsage}%). ${
      leakReport.detected ? `${leakReport.pattern} leak pattern detected.` : ""
    } Review recommended.`;
  } else if (grade === "D") {
    return `Memory health issues detected. Average usage at ${avgUsage}% (max ${maxUsage}%). ${
      leakReport.detected
        ? `${leakReport.pattern} leak pattern with ${leakReport.confidence.toFixed(0)}% confidence.`
        : ""
    } Investigation required.`;
  } else {
    return `Critical memory health issues. Average usage at ${avgUsage}% (max ${maxUsage}%). ${
      leakReport.detected
        ? `Significant ${leakReport.pattern} leak pattern detected.`
        : "High memory pressure observed."
    } Immediate attention required.`;
  }
}

/**
 * Generate recommendations based on assessment
 */
function generateRecommendations(
  stats: ReportStatistics,
  leakReport: LeakPatternReport
): string[] {
  const recommendations: string[] = [];

  // High usage recommendations
  if (stats.usagePercentage.max > 90) {
    recommendations.push(
      "CRITICAL: Maximum memory usage exceeds 90%. Implement immediate memory optimization."
    );
  } else if (stats.usagePercentage.max > 70) {
    recommendations.push(
      "WARNING: Maximum memory usage exceeds 70%. Monitor closely and consider optimization."
    );
  }

  // Leak-related recommendations
  if (leakReport.detected) {
    recommendations.push(
      `Investigate ${leakReport.pattern} memory leak pattern (${leakReport.confidence.toFixed(0)}% confidence).`
    );
    if (leakReport.growthRate > 0) {
      recommendations.push(
        `Memory growing at approximately ${formatBytes(leakReport.growthRate)}/second.`
      );
    }
  }

  // Outlier recommendations
  if (stats.heapUsed.outliers.length > 0) {
    recommendations.push(
      `${stats.heapUsed.outliers.length} outlier snapshot(s) detected. Review specific operations at those times.`
    );
  }

  // Variability recommendations
  const cv = stats.heapUsed.stdDev / stats.heapUsed.mean;
  if (cv > 0.5) {
    recommendations.push(
      "High memory variability detected. Implement more consistent memory management."
    );
  } else if (cv > 0.3) {
    recommendations.push(
      "Moderate memory variability observed. Consider stabilizing memory usage patterns."
    );
  }

  // DOM-related recommendations
  if (stats.domNodes && stats.domNodes.max > 10000) {
    recommendations.push(
      "High DOM node count detected. Consider virtualization or lazy loading for large lists."
    );
  }

  // Event listener recommendations
  if (stats.eventListeners && stats.eventListeners.max > 500) {
    recommendations.push(
      "High event listener count detected. Verify listeners are properly removed on cleanup."
    );
  }

  // General recommendations if no specific issues
  if (recommendations.length === 0) {
    recommendations.push(
      "Memory usage appears healthy. Continue monitoring for long-term trends."
    );
  }

  return recommendations;
}

/**
 * Assess overall memory health
 */
export function assessMemoryHealth(
  snapshots: PanelSnapshot[],
  stats: ReportStatistics,
  leakReport: LeakPatternReport
): MemoryHealthAssessment {
  let score = 100;

  // Deduct for high usage
  if (stats.usagePercentage.max > 90) {
    score -= 30;
  } else if (stats.usagePercentage.max > 70) {
    score -= 15;
  }

  // Deduct for leak probability
  score -= leakReport.confidence * 0.3;

  // Deduct for variability (coefficient of variation)
  const cv = stats.heapUsed.mean > 0
    ? stats.heapUsed.stdDev / stats.heapUsed.mean
    : 0;
  if (cv > 0.5) {
    score -= 20;
  } else if (cv > 0.3) {
    score -= 10;
  }

  // Deduct for outliers
  score -= Math.min(20, stats.heapUsed.outliers.length * 5);

  // Deduct for increasing trend in analysis context
  const increasingSnapshots = snapshots.filter(
    (s) => s.analysisContext?.trend === "increasing"
  );
  if (increasingSnapshots.length > snapshots.length * 0.5) {
    score -= 10;
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  const grade = scoreToGrade(score);
  const summary = generateSummary(score, stats, leakReport);
  const recommendations = generateRecommendations(stats, leakReport);

  return { score, grade, summary, recommendations };
}

// ============================================================================
// HTML Report Generation
// ============================================================================

/**
 * Format timestamp to locale string
 */
function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Get grade color
 */
function getGradeColor(grade: HealthGrade): string {
  switch (grade) {
    case "A":
      return "#22c55e";
    case "B":
      return "#84cc16";
    case "C":
      return "#f59e0b";
    case "D":
      return "#f97316";
    case "F":
      return "#ef4444";
  }
}

/**
 * Get pattern description
 */
function getPatternDescription(pattern: LeakPattern): string {
  switch (pattern) {
    case "gradual":
      return "Gradual Increase";
    case "sudden":
      return "Sudden Spike";
    case "intermittent":
      return "Intermittent Fluctuation";
    case "none":
      return "No Pattern Detected";
  }
}

/**
 * Generate the complete HTML report
 */
export function generateMemoryReport(
  snapshots: PanelSnapshot[],
  config: Partial<ReportConfig> = {}
): string {
  const fullConfig: ReportConfig = { ...DEFAULT_REPORT_CONFIG, ...config };

  if (snapshots.length < fullConfig.minSnapshots) {
    throw new Error(
      `Insufficient snapshots. Required: ${fullConfig.minSnapshots}, Got: ${snapshots.length}`
    );
  }

  // Sort snapshots by timestamp
  const sortedSnapshots = [...snapshots].sort(
    (a, b) => a.timestamp - b.timestamp
  );

  // Calculate all analysis data
  const stats = calculateStatistics(sortedSnapshots);
  const leakReport = identifyLeakPatterns(sortedSnapshots);
  const health = assessMemoryHealth(sortedSnapshots, stats, leakReport);

  // Time range
  const firstTimestamp = sortedSnapshots[0].timestamp;
  const lastTimestamp = sortedSnapshots[sortedSnapshots.length - 1].timestamp;
  const duration = lastTimestamp - firstTimestamp;

  // Prepare chart data
  const chartLabels = sortedSnapshots.map((s) =>
    new Date(s.timestamp).toLocaleTimeString()
  );
  const heapUsedData = sortedSnapshots.map((s) => s.heapUsed / (1024 * 1024)); // MB
  const heapTotalData = sortedSnapshots.map((s) => s.heapTotal / (1024 * 1024)); // MB
  const usageData = sortedSnapshots.map(
    (s) => (s.heapUsed / s.heapLimit) * 100
  );

  // DOM and Event Listener data for charts
  const hasDOMData = sortedSnapshots.some((s) => s.domNodes !== undefined);
  const hasListenerData = sortedSnapshots.some((s) => s.eventListeners !== undefined);
  const domNodesData = sortedSnapshots.map((s) => s.domNodes ?? 0);
  const listenersData = sortedSnapshots.map((s) => s.eventListeners ?? 0);

  // Trend distribution for pie chart
  const trendCounts = {
    stable: sortedSnapshots.filter((s) => s.analysisContext?.trend === "stable").length,
    increasing: sortedSnapshots.filter((s) => s.analysisContext?.trend === "increasing").length,
    decreasing: sortedSnapshots.filter((s) => s.analysisContext?.trend === "decreasing").length,
    unknown: sortedSnapshots.filter((s) => !s.analysisContext?.trend).length,
  };

  // Severity distribution
  const severityCounts = {
    normal: sortedSnapshots.filter((s) => s.analysisContext?.severity === "normal").length,
    warning: sortedSnapshots.filter((s) => s.analysisContext?.severity === "warning").length,
    critical: sortedSnapshots.filter((s) => s.analysisContext?.severity === "critical").length,
    unknown: sortedSnapshots.filter((s) => !s.analysisContext?.severity).length,
  };

  // Calculate coefficient of variation for stability metric
  const cv = stats.heapUsed.mean > 0 ? (stats.heapUsed.stdDev / stats.heapUsed.mean) * 100 : 0;
  const stabilityScore = Math.max(0, 100 - cv * 2);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Memory Diagnostic Report${fullConfig.appName ? ` - ${fullConfig.appName}` : ""}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <style>
    :root {
      --color-success: #10b981;
      --color-success-light: #d1fae5;
      --color-warning: #f59e0b;
      --color-warning-light: #fef3c7;
      --color-critical: #ef4444;
      --color-critical-light: #fee2e2;
      --color-primary: #6366f1;
      --color-primary-light: #e0e7ff;
      --color-secondary: #8b5cf6;
      --color-accent: #06b6d4;
      --color-accent-light: #cffafe;
      --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      --gradient-success: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      --gradient-warning: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      --gradient-info: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
      --bg-primary: #ffffff;
      --bg-secondary: #f8fafc;
      --bg-tertiary: #f1f5f9;
      --bg-card: #ffffff;
      --text-primary: #0f172a;
      --text-secondary: #475569;
      --text-muted: #94a3b8;
      --border-color: #e2e8f0;
      --border-radius: 16px;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg-primary: #0f172a;
        --bg-secondary: #1e293b;
        --bg-tertiary: #334155;
        --bg-card: #1e293b;
        --text-primary: #f8fafc;
        --text-secondary: #cbd5e1;
        --text-muted: #64748b;
        --border-color: #334155;
        --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
        --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
        --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.4);
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: var(--bg-secondary);
      color: var(--text-primary);
      line-height: 1.6;
      min-height: 100vh;
    }

    .report-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }

    /* Header Styles */
    .report-header {
      background: var(--gradient-primary);
      color: white;
      padding: 3rem 2rem;
      border-radius: var(--border-radius);
      margin-bottom: 2rem;
      box-shadow: var(--shadow-xl);
      position: relative;
      overflow: hidden;
    }

    .report-header::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      transform: translate(30%, -30%);
    }

    .report-header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .report-header h1 svg {
      width: 48px;
      height: 48px;
    }

    .header-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 2rem;
      margin-top: 1.5rem;
      font-size: 0.9rem;
      opacity: 0.9;
    }

    .header-meta-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .header-meta-item svg {
      width: 16px;
      height: 16px;
    }

    /* Section Styles */
    .section {
      margin-bottom: 2rem;
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .section-title svg {
      width: 24px;
      height: 24px;
      color: var(--color-primary);
    }

    /* Dashboard Grid */
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 1.5rem;
    }

    .col-12 { grid-column: span 12; }
    .col-8 { grid-column: span 8; }
    .col-6 { grid-column: span 6; }
    .col-4 { grid-column: span 4; }
    .col-3 { grid-column: span 3; }

    @media (max-width: 1200px) {
      .col-8, .col-6 { grid-column: span 12; }
      .col-4 { grid-column: span 6; }
      .col-3 { grid-column: span 6; }
    }

    @media (max-width: 768px) {
      .col-4, .col-3 { grid-column: span 12; }
      .report-container { padding: 1rem; }
      .report-header { padding: 2rem 1.5rem; }
      .report-header h1 { font-size: 1.75rem; }
    }

    /* Card Styles */
    .card {
      background: var(--bg-card);
      border-radius: var(--border-radius);
      padding: 1.5rem;
      box-shadow: var(--shadow-md);
      border: 1px solid var(--border-color);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .card-title {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
    }

    /* Health Score Card */
    .health-card {
      background: var(--bg-card);
      border-radius: var(--border-radius);
      padding: 2rem;
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .health-score-ring {
      position: relative;
      width: 160px;
      height: 160px;
      flex-shrink: 0;
    }

    .health-score-ring svg {
      transform: rotate(-90deg);
    }

    .health-score-ring .ring-bg {
      fill: none;
      stroke: var(--bg-tertiary);
      stroke-width: 12;
    }

    .health-score-ring .ring-progress {
      fill: none;
      stroke-width: 12;
      stroke-linecap: round;
      transition: stroke-dashoffset 1s ease-out;
    }

    .health-score-value {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }

    .health-score-number {
      font-size: 2.5rem;
      font-weight: 700;
      line-height: 1;
    }

    .health-score-label {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    .health-grade {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
      margin-bottom: 1rem;
    }

    .health-info {
      flex: 1;
    }

    .health-info h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .health-info p {
      color: var(--text-secondary);
      line-height: 1.6;
    }

    /* Metric Cards */
    .metric-card {
      text-align: center;
      padding: 1.5rem;
    }

    .metric-icon {
      width: 48px;
      height: 48px;
      margin: 0 auto 1rem;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .metric-icon svg {
      width: 24px;
      height: 24px;
      color: white;
    }

    .metric-icon.primary { background: var(--gradient-primary); }
    .metric-icon.success { background: var(--gradient-success); }
    .metric-icon.warning { background: var(--gradient-warning); }
    .metric-icon.info { background: var(--gradient-info); }

    .metric-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .metric-label {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-top: 0.5rem;
    }

    .metric-change {
      font-size: 0.75rem;
      margin-top: 0.5rem;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      display: inline-block;
    }

    .metric-change.positive {
      background: var(--color-success-light);
      color: var(--color-success);
    }

    .metric-change.negative {
      background: var(--color-critical-light);
      color: var(--color-critical);
    }

    /* Chart Container */
    .chart-card {
      padding: 1.5rem;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .chart-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .chart-wrapper {
      position: relative;
      height: 300px;
    }

    .chart-wrapper.small {
      height: 200px;
    }

    /* Gauge Chart */
    .gauge-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    .gauge-wrapper {
      position: relative;
      width: 180px;
      height: 100px;
    }

    .gauge-value {
      font-size: 1.75rem;
      font-weight: 700;
      text-align: center;
      margin-top: 0.5rem;
    }

    .gauge-label {
      font-size: 0.875rem;
      color: var(--text-muted);
      text-align: center;
    }

    /* Progress Bar */
    .progress-bar-container {
      margin: 1rem 0;
    }

    .progress-bar-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .progress-bar-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .progress-bar-value {
      font-size: 0.875rem;
      font-weight: 600;
    }

    .progress-bar {
      height: 8px;
      background: var(--bg-tertiary);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s ease-out;
    }

    /* Table Styles */
    .table-container {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    th, td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    th {
      background: var(--bg-tertiary);
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
    }

    th:first-child { border-radius: 8px 0 0 0; }
    th:last-child { border-radius: 0 8px 0 0; }

    tr:hover td {
      background: var(--bg-secondary);
    }

    /* Badge Styles */
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .badge-success {
      background: var(--color-success-light);
      color: #059669;
    }

    .badge-warning {
      background: var(--color-warning-light);
      color: #d97706;
    }

    .badge-critical {
      background: var(--color-critical-light);
      color: #dc2626;
    }

    .badge-info {
      background: var(--color-primary-light);
      color: var(--color-primary);
    }

    /* Leak Pattern Card */
    .leak-pattern-card {
      display: flex;
      gap: 2rem;
      align-items: flex-start;
    }

    .leak-chart-container {
      width: 200px;
      flex-shrink: 0;
    }

    .leak-details {
      flex: 1;
    }

    .leak-pattern-badge {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .pattern-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .pattern-gradual { background: var(--color-critical); }
    .pattern-sudden { background: var(--color-warning); }
    .pattern-intermittent { background: var(--color-primary); }
    .pattern-none { background: var(--color-success); }

    /* Recommendations */
    .recommendations-grid {
      display: grid;
      gap: 1rem;
    }

    .recommendation-item {
      display: flex;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: var(--bg-secondary);
      border-radius: 12px;
      border-left: 4px solid var(--color-primary);
      transition: transform 0.2s;
    }

    .recommendation-item:hover {
      transform: translateX(4px);
    }

    .recommendation-item.critical {
      border-left-color: var(--color-critical);
      background: var(--color-critical-light);
    }

    .recommendation-item.warning {
      border-left-color: var(--color-warning);
      background: var(--color-warning-light);
    }

    .recommendation-icon {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }

    .recommendation-text {
      flex: 1;
      color: var(--text-secondary);
    }

    /* Guidance List */
    .guidance-section {
      margin-top: 1.5rem;
    }

    .guidance-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .guidance-list {
      list-style: none;
      padding: 0;
    }

    .guidance-list li {
      padding: 0.5rem 0;
      padding-left: 1.5rem;
      position: relative;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .guidance-list li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0.9rem;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-primary);
    }

    /* Collapsible */
    .collapsible-header {
      cursor: pointer;
      user-select: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 0;
    }

    .collapsible-header svg {
      width: 20px;
      height: 20px;
      transition: transform 0.2s;
    }

    .collapsible-header.open svg {
      transform: rotate(180deg);
    }

    .collapsible-content {
      display: none;
      padding-top: 1rem;
    }

    .collapsible-content.show {
      display: block;
    }

    /* Footer */
    .report-footer {
      margin-top: 3rem;
      padding: 2rem;
      background: var(--bg-card);
      border-radius: var(--border-radius);
      text-align: center;
      border: 1px solid var(--border-color);
    }

    .footer-brand {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }

    .footer-info {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    /* Mini Charts Grid */
    .mini-charts-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .mini-chart-item {
      background: var(--bg-secondary);
      border-radius: 12px;
      padding: 1rem;
    }

    .mini-chart-label {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-muted);
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }

    /* Stat Comparison */
    .stat-comparison {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border-color);
    }

    .stat-comparison:last-child {
      border-bottom: none;
    }

    .stat-comparison-label {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .stat-comparison-value {
      font-weight: 600;
      font-size: 0.875rem;
    }

    /* Animations */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .animate-in {
      animation: fadeIn 0.5s ease-out forwards;
    }

    /* Print Styles */
    @media print {
      body { background: white; }
      .report-container { padding: 0; }
      .card:hover { transform: none; box-shadow: var(--shadow-md); }
      .no-print { display: none !important; }
      .chart-card { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <!-- Header -->
    <header class="report-header">
      <h1>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" x2="12" y1="19" y2="22"/>
        </svg>
        Memory Diagnostic Report
      </h1>
      <div class="header-meta">
        ${fullConfig.appName ? `
        <div class="header-meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
          <span>${fullConfig.appName}</span>
        </div>
        ` : ""}
        <div class="header-meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>${formatTimestamp(firstTimestamp)} - ${formatTimestamp(lastTimestamp)}</span>
        </div>
        <div class="header-meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          <span>${sortedSnapshots.length} Snapshots (${formatDuration(duration)})</span>
        </div>
        <div class="header-meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>Generated: ${formatTimestamp(Date.now())}</span>
        </div>
      </div>
    </header>

    <!-- Executive Summary Section -->
    <section class="section">
      <h2 class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
        Executive Summary
      </h2>

      <div class="dashboard-grid">
        <!-- Health Score -->
        <div class="col-8">
          <div class="health-card">
            <div class="health-score-ring">
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle class="ring-bg" cx="80" cy="80" r="70"/>
                <circle class="ring-progress" cx="80" cy="80" r="70"
                  stroke="${getGradeColor(health.grade)}"
                  stroke-dasharray="${2 * Math.PI * 70}"
                  stroke-dashoffset="${2 * Math.PI * 70 * (1 - health.score / 100)}"/>
              </svg>
              <div class="health-score-value">
                <div class="health-score-number" style="color: ${getGradeColor(health.grade)}">${health.score.toFixed(0)}</div>
                <div class="health-score-label">Health Score</div>
              </div>
            </div>
            <div class="health-info">
              <div class="health-grade" style="background: ${getGradeColor(health.grade)}">${health.grade}</div>
              <h3>Memory Health Assessment</h3>
              <p>${health.summary}</p>
            </div>
          </div>
        </div>

        <!-- Leak Probability Gauge -->
        <div class="col-4">
          <div class="card chart-card">
            <div class="chart-header">
              <span class="chart-title">Leak Probability</span>
            </div>
            <div class="chart-wrapper small">
              <canvas id="leakGauge"></canvas>
            </div>
          </div>
        </div>

        <!-- Key Metrics -->
        <div class="col-3">
          <div class="card metric-card">
            <div class="metric-icon primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <div class="metric-value">${stats.usagePercentage.mean.toFixed(1)}%</div>
            <div class="metric-label">Average Usage</div>
          </div>
        </div>

        <div class="col-3">
          <div class="card metric-card">
            <div class="metric-icon warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div class="metric-value">${stats.usagePercentage.max.toFixed(1)}%</div>
            <div class="metric-label">Peak Usage</div>
            ${stats.usagePercentage.max > 80 ? `<div class="metric-change negative">High Risk</div>` : stats.usagePercentage.max > 60 ? `<div class="metric-change" style="background: var(--color-warning-light); color: var(--color-warning);">Moderate</div>` : `<div class="metric-change positive">Normal</div>`}
          </div>
        </div>

        <div class="col-3">
          <div class="card metric-card">
            <div class="metric-icon success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div class="metric-value">${formatBytes(stats.heapUsed.mean)}</div>
            <div class="metric-label">Average Heap</div>
          </div>
        </div>

        <div class="col-3">
          <div class="card metric-card">
            <div class="metric-icon info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div class="metric-value">${stabilityScore.toFixed(0)}%</div>
            <div class="metric-label">Stability Score</div>
            <div class="metric-change ${stabilityScore >= 80 ? 'positive' : stabilityScore >= 60 ? '' : 'negative'}" ${stabilityScore >= 60 && stabilityScore < 80 ? 'style="background: var(--color-warning-light); color: var(--color-warning);"' : ''}>${stabilityScore >= 80 ? 'Stable' : stabilityScore >= 60 ? 'Moderate' : 'Unstable'}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Memory Trends Section -->
    <section class="section">
      <h2 class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
        Memory Trends
      </h2>

      <div class="dashboard-grid">
        <!-- Main Memory Chart -->
        <div class="col-8">
          <div class="card chart-card">
            <div class="chart-header">
              <span class="chart-title">Heap Memory Over Time</span>
            </div>
            <div class="chart-wrapper">
              <canvas id="memoryChart"></canvas>
            </div>
          </div>
        </div>

        <!-- Usage Distribution -->
        <div class="col-4">
          <div class="card chart-card">
            <div class="chart-header">
              <span class="chart-title">Usage Distribution</span>
            </div>
            <div class="chart-wrapper">
              <canvas id="usageDistribution"></canvas>
            </div>
          </div>
        </div>

        <!-- Memory Usage % Chart -->
        <div class="col-6">
          <div class="card chart-card">
            <div class="chart-header">
              <span class="chart-title">Memory Usage Percentage</span>
            </div>
            <div class="chart-wrapper">
              <canvas id="usageChart"></canvas>
            </div>
          </div>
        </div>

        <!-- Trend Distribution -->
        <div class="col-3">
          <div class="card chart-card">
            <div class="chart-header">
              <span class="chart-title">Trend Analysis</span>
            </div>
            <div class="chart-wrapper small">
              <canvas id="trendChart"></canvas>
            </div>
          </div>
        </div>

        <!-- Severity Distribution -->
        <div class="col-3">
          <div class="card chart-card">
            <div class="chart-header">
              <span class="chart-title">Severity Distribution</span>
            </div>
            <div class="chart-wrapper small">
              <canvas id="severityChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    </section>

    ${hasDOMData || hasListenerData ? `
    <!-- DOM & Events Section -->
    <section class="section">
      <h2 class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
        DOM & Event Listeners
      </h2>

      <div class="dashboard-grid">
        <div class="col-12">
          <div class="card chart-card">
            <div class="chart-header">
              <span class="chart-title">DOM Nodes & Event Listeners Over Time</span>
            </div>
            <div class="chart-wrapper">
              <canvas id="domChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    </section>
    ` : ""}

    <!-- Statistical Analysis Section -->
    <section class="section">
      <h2 class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
        Statistical Analysis
      </h2>

      <div class="dashboard-grid">
        <div class="col-12">
          <div class="card">
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Minimum</th>
                    <th>Maximum</th>
                    <th>Mean</th>
                    <th>Median</th>
                    <th>Std Dev</th>
                    <th>Outliers</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Heap Used</strong></td>
                    <td>${formatBytes(stats.heapUsed.min)}</td>
                    <td>${formatBytes(stats.heapUsed.max)}</td>
                    <td>${formatBytes(stats.heapUsed.mean)}</td>
                    <td>${formatBytes(stats.heapUsed.median)}</td>
                    <td>${formatBytes(stats.heapUsed.stdDev)}</td>
                    <td><span class="badge ${stats.heapUsed.outliers.length > 0 ? 'badge-warning' : 'badge-success'}">${stats.heapUsed.outliers.length}</span></td>
                  </tr>
                  <tr>
                    <td><strong>Heap Total</strong></td>
                    <td>${formatBytes(stats.heapTotal.min)}</td>
                    <td>${formatBytes(stats.heapTotal.max)}</td>
                    <td>${formatBytes(stats.heapTotal.mean)}</td>
                    <td>${formatBytes(stats.heapTotal.median)}</td>
                    <td>${formatBytes(stats.heapTotal.stdDev)}</td>
                    <td><span class="badge ${stats.heapTotal.outliers.length > 0 ? 'badge-warning' : 'badge-success'}">${stats.heapTotal.outliers.length}</span></td>
                  </tr>
                  <tr>
                    <td><strong>Usage %</strong></td>
                    <td>${stats.usagePercentage.min.toFixed(1)}%</td>
                    <td>${stats.usagePercentage.max.toFixed(1)}%</td>
                    <td>${stats.usagePercentage.mean.toFixed(1)}%</td>
                    <td>${stats.usagePercentage.median.toFixed(1)}%</td>
                    <td>${stats.usagePercentage.stdDev.toFixed(1)}%</td>
                    <td><span class="badge ${stats.usagePercentage.outliers.length > 0 ? 'badge-warning' : 'badge-success'}">${stats.usagePercentage.outliers.length}</span></td>
                  </tr>
                  ${stats.domNodes ? `
                  <tr>
                    <td><strong>DOM Nodes</strong></td>
                    <td>${stats.domNodes.min.toLocaleString()}</td>
                    <td>${stats.domNodes.max.toLocaleString()}</td>
                    <td>${stats.domNodes.mean.toFixed(0)}</td>
                    <td>${stats.domNodes.median.toFixed(0)}</td>
                    <td>${stats.domNodes.stdDev.toFixed(0)}</td>
                    <td><span class="badge ${stats.domNodes.outliers.length > 0 ? 'badge-warning' : 'badge-success'}">${stats.domNodes.outliers.length}</span></td>
                  </tr>
                  ` : ""}
                  ${stats.eventListeners ? `
                  <tr>
                    <td><strong>Event Listeners</strong></td>
                    <td>${stats.eventListeners.min.toLocaleString()}</td>
                    <td>${stats.eventListeners.max.toLocaleString()}</td>
                    <td>${stats.eventListeners.mean.toFixed(0)}</td>
                    <td>${stats.eventListeners.median.toFixed(0)}</td>
                    <td>${stats.eventListeners.stdDev.toFixed(0)}</td>
                    <td><span class="badge ${stats.eventListeners.outliers.length > 0 ? 'badge-warning' : 'badge-success'}">${stats.eventListeners.outliers.length}</span></td>
                  </tr>
                  ` : ""}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        ${stats.heapUsed.outliers.length > 0 ? `
        <div class="col-12">
          <div class="card">
            <h3 class="card-title">Outlier Snapshots</h3>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Snapshot</th>
                    <th>Value</th>
                    <th>Deviation</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  ${stats.heapUsed.outliers.map((o) => `
                  <tr>
                    <td><strong>${o.snapshotLabel}</strong></td>
                    <td>${formatBytes(o.value)}</td>
                    <td><span class="badge badge-warning">${o.deviation.toFixed(1)}σ</span></td>
                    <td>${formatTimestamp(o.timestamp)}</td>
                  </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        ` : ""}
      </div>
    </section>

    ${fullConfig.includeLeakAnalysis ? `
    <!-- Leak Analysis Section -->
    <section class="section">
      <h2 class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Leak Pattern Analysis
      </h2>

      <div class="dashboard-grid">
        <div class="col-12">
          <div class="card">
            <div class="leak-pattern-card">
              <div class="leak-chart-container">
                <canvas id="leakPatternChart"></canvas>
              </div>
              <div class="leak-details">
                <div class="leak-pattern-badge">
                  <span class="pattern-indicator pattern-${leakReport.pattern}"></span>
                  ${getPatternDescription(leakReport.pattern)}
                </div>

                <div class="mini-charts-grid">
                  <div class="mini-chart-item">
                    <div class="mini-chart-label">Confidence</div>
                    <div class="progress-bar-container">
                      <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: ${leakReport.confidence}%; background: ${leakReport.confidence > 60 ? 'var(--color-critical)' : leakReport.confidence > 30 ? 'var(--color-warning)' : 'var(--color-success)'}"></div>
                      </div>
                    </div>
                    <div style="font-size: 1.5rem; font-weight: 700; margin-top: 0.5rem;">${leakReport.confidence.toFixed(0)}%</div>
                  </div>
                  <div class="mini-chart-item">
                    <div class="mini-chart-label">Growth Rate</div>
                    <div style="font-size: 1.5rem; font-weight: 700; margin-top: 0.5rem;">${leakReport.growthRate > 0 ? formatBytes(leakReport.growthRate) + '/s' : 'N/A'}</div>
                  </div>
                </div>

                ${leakReport.detected ? `
                <div class="guidance-section">
                  <div class="guidance-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    Suspected Causes
                  </div>
                  <ul class="guidance-list">
                    ${leakReport.suspectedCauses.slice(0, 4).map((cause) => `<li>${cause}</li>`).join("")}
                  </ul>
                </div>
                ` : `
                <div style="padding: 1rem; background: var(--color-success-light); border-radius: 8px; margin-top: 1rem;">
                  <div style="display: flex; align-items: center; gap: 0.5rem; color: #059669;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <strong>No significant memory leak patterns detected</strong>
                  </div>
                </div>
                `}
              </div>
            </div>

            ${leakReport.detected ? `
            <div class="guidance-section" style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
              <div class="guidance-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                Investigation Guide
              </div>
              <ul class="guidance-list">
                ${leakReport.investigationGuidance.map((guide) => `<li>${guide}</li>`).join("")}
              </ul>
            </div>
            ` : ""}
          </div>
        </div>
      </div>
    </section>
    ` : ""}

    <!-- Recommendations Section -->
    <section class="section">
      <h2 class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4"/><path d="m6.8 14-3.5 2"/><path d="m20.7 16-3.5-2"/><path d="M6.8 10 3.3 8"/><path d="m20.7 8-3.5 2"/><circle cx="12" cy="12" r="5"/></svg>
        Recommendations
      </h2>

      <div class="dashboard-grid">
        <div class="col-12">
          <div class="card">
            <div class="recommendations-grid">
              ${health.recommendations.map((rec) => {
                const isCritical = rec.toLowerCase().includes("critical");
                const isWarning = rec.toLowerCase().includes("warning");
                return `
                <div class="recommendation-item ${isCritical ? "critical" : isWarning ? "warning" : ""}">
                  <svg class="recommendation-icon" viewBox="0 0 24 24" fill="none" stroke="${isCritical ? '#dc2626' : isWarning ? '#d97706' : 'var(--color-primary)'}" stroke-width="2">
                    ${isCritical ? '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' : isWarning ? '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>' : '<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/>'}
                  </svg>
                  <span class="recommendation-text">${rec}</span>
                </div>
                `;
              }).join("")}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Snapshot Details Section -->
    <section class="section">
      <div class="card">
        <div class="collapsible-header" onclick="toggleCollapsible(this)">
          <h2 class="section-title" style="margin: 0; border: none; padding: 0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            Snapshot Details
          </h2>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="collapsible-content">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Timestamp</th>
                  <th>Heap Used</th>
                  <th>Usage %</th>
                  <th>Trend</th>
                  <th>Severity</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                ${sortedSnapshots.map((s) => `
                <tr>
                  <td><strong>${s.label}</strong></td>
                  <td>${formatTimestamp(s.timestamp)}</td>
                  <td>${formatBytes(s.heapUsed)}</td>
                  <td>${((s.heapUsed / s.heapLimit) * 100).toFixed(1)}%</td>
                  <td><span class="badge ${s.analysisContext?.trend === 'increasing' ? 'badge-warning' : s.analysisContext?.trend === 'decreasing' ? 'badge-success' : 'badge-info'}">${s.analysisContext?.trend ?? "N/A"}</span></td>
                  <td><span class="badge ${s.analysisContext?.severity === 'critical' ? 'badge-critical' : s.analysisContext?.severity === 'warning' ? 'badge-warning' : 'badge-success'}">${s.analysisContext?.severity ?? "N/A"}</span></td>
                  <td><span class="badge badge-info">${s.isAuto ? "Auto" : "Manual"}</span></td>
                </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="report-footer">
      <div class="footer-brand">@usefy/memory-monitor-panel</div>
      <div class="footer-info">
        Memory Diagnostic Report | Generated on ${formatTimestamp(Date.now())}
      </div>
    </footer>
  </div>

  <script>
    // Toggle collapsible sections
    function toggleCollapsible(element) {
      element.classList.toggle('open');
      const content = element.nextElementSibling;
      content.classList.toggle('show');
    }

    // Dark mode detection
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
    const gridColor = isDarkMode ? '#334155' : '#e2e8f0';
    const mutedColor = isDarkMode ? '#64748b' : '#94a3b8';

    // Chart.js global defaults
    Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    Chart.defaults.color = textColor;

    // Main Memory Chart
    new Chart(document.getElementById('memoryChart'), {
      type: 'line',
      data: {
        labels: ${JSON.stringify(chartLabels)},
        datasets: [
          {
            label: 'Heap Used (MB)',
            data: ${JSON.stringify(heapUsedData)},
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'Heap Total (MB)',
            data: ${JSON.stringify(heapTotalData)},
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.05)',
            fill: true,
            borderDash: [5, 5],
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
            titleColor: textColor,
            bodyColor: textColor,
            borderColor: gridColor,
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
          }
        },
        scales: {
          x: {
            grid: { color: gridColor, drawBorder: false },
            ticks: { color: mutedColor }
          },
          y: {
            grid: { color: gridColor, drawBorder: false },
            ticks: { color: mutedColor, callback: v => v + ' MB' }
          }
        }
      }
    });

    // Usage Chart
    new Chart(document.getElementById('usageChart'), {
      type: 'line',
      data: {
        labels: ${JSON.stringify(chartLabels)},
        datasets: [{
          label: 'Usage %',
          data: ${JSON.stringify(usageData)},
          borderColor: '#06b6d4',
          backgroundColor: (ctx) => {
            const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
            gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
            return gradient;
          },
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
            titleColor: textColor,
            bodyColor: textColor,
            borderColor: gridColor,
            borderWidth: 1,
            callbacks: { label: (ctx) => ctx.parsed.y.toFixed(1) + '%' }
          }
        },
        scales: {
          x: { grid: { color: gridColor, drawBorder: false }, ticks: { color: mutedColor } },
          y: {
            min: 0,
            max: 100,
            grid: { color: gridColor, drawBorder: false },
            ticks: { color: mutedColor, callback: v => v + '%' }
          }
        }
      }
    });

    // Leak Gauge
    new Chart(document.getElementById('leakGauge'), {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [${leakReport.confidence}, ${100 - leakReport.confidence}],
          backgroundColor: [
            ${leakReport.confidence > 60 ? "'#ef4444'" : leakReport.confidence > 30 ? "'#f59e0b'" : "'#10b981'"},
            isDarkMode ? '#334155' : '#e2e8f0'
          ],
          borderWidth: 0,
          circumference: 180,
          rotation: 270,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      },
      plugins: [{
        id: 'gaugeText',
        afterDraw: (chart) => {
          const { ctx, chartArea } = chart;
          const centerX = (chartArea.left + chartArea.right) / 2;
          const centerY = chartArea.bottom - 20;
          ctx.save();
          ctx.font = 'bold 28px Inter, sans-serif';
          ctx.fillStyle = textColor;
          ctx.textAlign = 'center';
          ctx.fillText('${leakReport.confidence.toFixed(0)}%', centerX, centerY);
          ctx.font = '12px Inter, sans-serif';
          ctx.fillStyle = mutedColor;
          ctx.fillText('Leak Risk', centerX, centerY + 20);
          ctx.restore();
        }
      }]
    });

    // Usage Distribution (Box-like visualization)
    new Chart(document.getElementById('usageDistribution'), {
      type: 'bar',
      data: {
        labels: ['Min', 'Q1', 'Median', 'Q3', 'Max'],
        datasets: [{
          label: 'Usage %',
          data: [
            ${stats.usagePercentage.min.toFixed(1)},
            ${(stats.usagePercentage.mean - stats.usagePercentage.stdDev).toFixed(1)},
            ${stats.usagePercentage.median.toFixed(1)},
            ${(stats.usagePercentage.mean + stats.usagePercentage.stdDev).toFixed(1)},
            ${stats.usagePercentage.max.toFixed(1)}
          ],
          backgroundColor: [
            '#10b981',
            '#06b6d4',
            '#6366f1',
            '#8b5cf6',
            '#f59e0b'
          ],
          borderRadius: 8,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (ctx) => ctx.parsed.y.toFixed(1) + '%' }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: mutedColor } },
          y: {
            min: 0,
            grid: { color: gridColor, drawBorder: false },
            ticks: { color: mutedColor, callback: v => v + '%' }
          }
        }
      }
    });

    // Trend Distribution
    new Chart(document.getElementById('trendChart'), {
      type: 'doughnut',
      data: {
        labels: ['Stable', 'Increasing', 'Decreasing', 'Unknown'],
        datasets: [{
          data: [${trendCounts.stable}, ${trendCounts.increasing}, ${trendCounts.decreasing}, ${trendCounts.unknown}],
          backgroundColor: ['#10b981', '#f59e0b', '#06b6d4', '#94a3b8'],
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 8 } }
        }
      }
    });

    // Severity Distribution
    new Chart(document.getElementById('severityChart'), {
      type: 'doughnut',
      data: {
        labels: ['Normal', 'Warning', 'Critical', 'Unknown'],
        datasets: [{
          data: [${severityCounts.normal}, ${severityCounts.warning}, ${severityCounts.critical}, ${severityCounts.unknown}],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#94a3b8'],
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 8 } }
        }
      }
    });

    ${hasDOMData || hasListenerData ? `
    // DOM & Event Listeners Chart
    new Chart(document.getElementById('domChart'), {
      type: 'line',
      data: {
        labels: ${JSON.stringify(chartLabels)},
        datasets: [
          ${hasDOMData ? `{
            label: 'DOM Nodes',
            data: ${JSON.stringify(domNodesData)},
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            fill: true,
            tension: 0.4,
            yAxisID: 'y',
          },` : ''}
          ${hasListenerData ? `{
            label: 'Event Listeners',
            data: ${JSON.stringify(listenersData)},
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            fill: true,
            tension: 0.4,
            yAxisID: 'y1',
          }` : ''}
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'top' } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: mutedColor } },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            grid: { color: gridColor },
            ticks: { color: mutedColor },
            title: { display: true, text: 'DOM Nodes', color: mutedColor }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { color: mutedColor },
            title: { display: true, text: 'Event Listeners', color: mutedColor }
          }
        }
      }
    });
    ` : ''}

    // Leak Pattern Chart
    new Chart(document.getElementById('leakPatternChart'), {
      type: 'radar',
      data: {
        labels: ['Gradual', 'Sudden', 'Intermittent', 'Stability', 'GC Efficiency'],
        datasets: [{
          label: 'Pattern Analysis',
          data: [
            ${leakReport.pattern === 'gradual' ? leakReport.confidence : 10},
            ${leakReport.pattern === 'sudden' ? leakReport.confidence : 10},
            ${leakReport.pattern === 'intermittent' ? leakReport.confidence : 10},
            ${stabilityScore},
            ${100 - leakReport.confidence}
          ],
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderColor: '#6366f1',
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#6366f1'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          r: {
            angleLines: { color: gridColor },
            grid: { color: gridColor },
            pointLabels: { color: textColor, font: { size: 10 } },
            ticks: { display: false },
            suggestedMin: 0,
            suggestedMax: 100
          }
        }
      }
    });
  </script>
</body>
</html>
`;

  return html;
}

/**
 * Download HTML report as a file
 */
export function downloadReport(
  htmlContent: string,
  filename?: string
): void {
  const defaultFilename = `memory-report-${new Date().toISOString().slice(0, 10)}.html`;
  const finalFilename = filename ?? defaultFilename;

  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = finalFilename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Check if report can be generated
 */
export function canGenerateReport(
  snapshots: PanelSnapshot[],
  minSnapshots: number = MIN_SNAPSHOTS_FOR_REPORT
): boolean {
  return snapshots.length >= minSnapshots;
}
