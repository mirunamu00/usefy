/**
 * Script to generate mock memory diagnostic report with memory leak patterns
 * Run with: npx tsx scripts/generate-mock-report.ts
 */

import { writeFileSync } from "fs";
import { join } from "path";

// Import types and generator
import type { PanelSnapshot, SnapshotAnalysisContext } from "../src/types";
import { generateMemoryReport } from "../src/utils/reportGenerator";

/**
 * Generate mock snapshots simulating a memory leak scenario
 */
function generateLeakScenarioSnapshots(): PanelSnapshot[] {
  const snapshots: PanelSnapshot[] = [];
  const baseTimestamp = Date.now() - 30 * 60 * 1000; // 30 minutes ago
  const intervalMs = 60 * 1000; // 1 minute intervals

  // Simulating a gradual memory leak
  // Starting at ~100MB, growing to ~250MB over 30 minutes
  const baseHeapUsed = 100 * 1024 * 1024; // 100 MB
  const heapLimit = 4 * 1024 * 1024 * 1024; // 4 GB
  const leakRatePerSnapshot = 5 * 1024 * 1024; // ~5MB leak per snapshot

  for (let i = 0; i < 30; i++) {
    const timestamp = baseTimestamp + i * intervalMs;

    // Simulate gradual leak with some noise
    const noise = (Math.random() - 0.5) * 2 * 1024 * 1024; // ±1MB noise
    const heapUsed = baseHeapUsed + (i * leakRatePerSnapshot) + noise;

    // Heap total grows occasionally
    const heapTotal = Math.max(heapUsed * 1.2, 150 * 1024 * 1024 + (Math.floor(i / 5) * 20 * 1024 * 1024));

    // DOM nodes also growing (leak symptom)
    const baseDomNodes = 200;
    const domNodes = baseDomNodes + Math.floor(i * 3) + Math.floor(Math.random() * 5);

    // Event listeners accumulating (common leak pattern)
    const baseListeners = 25;
    const eventListeners = baseListeners + Math.floor(i * 2) + Math.floor(Math.random() * 3);

    // Determine severity based on usage
    const usagePercentage = (heapUsed / heapLimit) * 100;
    let severity: "normal" | "warning" | "critical" = "normal";
    if (usagePercentage > 5) severity = "warning";
    if (usagePercentage > 7) severity = "critical";

    // Leak probability increases over time
    const leakProbability = Math.min(95, 20 + i * 2.5);

    const analysisContext: SnapshotAnalysisContext = {
      trend: i > 2 ? "increasing" : "stable",
      leakProbability,
      severity,
      usagePercentage,
    };

    snapshots.push({
      id: `snapshot-${i + 1}`,
      label: `Auto ${i + 1}`,
      timestamp,
      heapUsed: Math.round(heapUsed),
      heapTotal: Math.round(heapTotal),
      heapLimit,
      domNodes,
      eventListeners,
      isAuto: true,
      analysisContext,
    });
  }

  return snapshots;
}

/**
 * Generate mock snapshots simulating a sudden spike scenario
 */
function generateSpikeScenarioSnapshots(): PanelSnapshot[] {
  const snapshots: PanelSnapshot[] = [];
  const baseTimestamp = Date.now() - 20 * 60 * 1000; // 20 minutes ago
  const intervalMs = 60 * 1000;

  const heapLimit = 4 * 1024 * 1024 * 1024; // 4 GB

  for (let i = 0; i < 20; i++) {
    const timestamp = baseTimestamp + i * intervalMs;

    // Normal usage with sudden spikes at specific points
    let heapUsed = 80 * 1024 * 1024; // 80 MB base

    // Spike events
    if (i >= 8 && i <= 10) {
      heapUsed = 350 * 1024 * 1024 + (Math.random() * 50 * 1024 * 1024); // Spike to ~350-400MB
    } else if (i >= 15 && i <= 17) {
      heapUsed = 500 * 1024 * 1024 + (Math.random() * 100 * 1024 * 1024); // Second spike ~500-600MB
    } else {
      heapUsed += Math.random() * 20 * 1024 * 1024; // Normal variance
    }

    const heapTotal = Math.max(heapUsed * 1.1, 120 * 1024 * 1024);

    const domNodes = 150 + Math.floor(Math.random() * 30);
    const eventListeners = 20 + Math.floor(Math.random() * 10);

    const usagePercentage = (heapUsed / heapLimit) * 100;
    let severity: "normal" | "warning" | "critical" = "normal";
    if (usagePercentage > 8) severity = "warning";
    if (usagePercentage > 12) severity = "critical";

    const analysisContext: SnapshotAnalysisContext = {
      trend: (i >= 8 && i <= 10) || (i >= 15 && i <= 17) ? "increasing" : "stable",
      leakProbability: (i >= 8 && i <= 10) || (i >= 15 && i <= 17) ? 65 : 15,
      severity,
      usagePercentage,
    };

    snapshots.push({
      id: `snapshot-spike-${i + 1}`,
      label: `Auto ${i + 1}`,
      timestamp,
      heapUsed: Math.round(heapUsed),
      heapTotal: Math.round(heapTotal),
      heapLimit,
      domNodes,
      eventListeners,
      isAuto: true,
      analysisContext,
    });
  }

  return snapshots;
}

/**
 * Generate mock snapshots simulating a healthy/normal memory pattern
 */
function generateHealthyScenarioSnapshots(): PanelSnapshot[] {
  const snapshots: PanelSnapshot[] = [];
  const baseTimestamp = Date.now() - 25 * 60 * 1000; // 25 minutes ago
  const intervalMs = 60 * 1000;

  const heapLimit = 4 * 1024 * 1024 * 1024; // 4 GB
  const baseHeapUsed = 120 * 1024 * 1024; // 120 MB base

  for (let i = 0; i < 25; i++) {
    const timestamp = baseTimestamp + i * intervalMs;

    // Stable memory usage with natural fluctuations (GC cycles simulated)
    // Oscillates around base with occasional drops (GC)
    const gcCycle = Math.sin(i * 0.5) * 15 * 1024 * 1024; // ±15MB oscillation
    const noise = (Math.random() - 0.5) * 10 * 1024 * 1024; // ±5MB noise

    // Simulate occasional GC drops
    const gcDrop = (i % 7 === 0) ? -20 * 1024 * 1024 : 0;

    const heapUsed = Math.max(
      80 * 1024 * 1024, // minimum 80MB
      baseHeapUsed + gcCycle + noise + gcDrop
    );

    const heapTotal = Math.max(heapUsed * 1.3, 180 * 1024 * 1024);

    // Stable DOM nodes (small fluctuation)
    const domNodes = 180 + Math.floor(Math.sin(i * 0.3) * 10) + Math.floor(Math.random() * 5);

    // Stable event listeners
    const eventListeners = 30 + Math.floor(Math.random() * 5);

    const usagePercentage = (heapUsed / heapLimit) * 100;

    const analysisContext: SnapshotAnalysisContext = {
      trend: "stable",
      leakProbability: 5 + Math.floor(Math.random() * 10), // Low probability (5-15%)
      severity: "normal",
      usagePercentage,
    };

    snapshots.push({
      id: `snapshot-healthy-${i + 1}`,
      label: `Auto ${i + 1}`,
      timestamp,
      heapUsed: Math.round(heapUsed),
      heapTotal: Math.round(heapTotal),
      heapLimit,
      domNodes,
      eventListeners,
      isAuto: true,
      analysisContext,
    });
  }

  return snapshots;
}

/**
 * Generate mock snapshots simulating critical memory pressure
 */
function generateCriticalScenarioSnapshots(): PanelSnapshot[] {
  const snapshots: PanelSnapshot[] = [];
  const baseTimestamp = Date.now() - 15 * 60 * 1000;
  const intervalMs = 60 * 1000;

  const heapLimit = 2 * 1024 * 1024 * 1024; // 2 GB (lower limit for dramatic effect)

  for (let i = 0; i < 15; i++) {
    const timestamp = baseTimestamp + i * intervalMs;

    // Starting high and growing rapidly
    const baseHeapUsed = 1.2 * 1024 * 1024 * 1024; // Start at 1.2GB
    const growthRate = 50 * 1024 * 1024; // 50MB per snapshot
    const heapUsed = baseHeapUsed + (i * growthRate) + (Math.random() * 20 * 1024 * 1024);

    const heapTotal = Math.min(heapUsed * 1.05, heapLimit * 0.98);

    // DOM and listeners also high
    const domNodes = 800 + i * 50 + Math.floor(Math.random() * 30);
    const eventListeners = 150 + i * 15 + Math.floor(Math.random() * 10);

    const usagePercentage = (heapUsed / heapLimit) * 100;
    let severity: "normal" | "warning" | "critical" = "normal";
    if (usagePercentage > 70) severity = "warning";
    if (usagePercentage > 85) severity = "critical";

    const analysisContext: SnapshotAnalysisContext = {
      trend: "increasing",
      leakProbability: Math.min(98, 70 + i * 2),
      severity,
      usagePercentage,
    };

    snapshots.push({
      id: `snapshot-critical-${i + 1}`,
      label: `Auto ${i + 1}`,
      timestamp,
      heapUsed: Math.round(heapUsed),
      heapTotal: Math.round(heapTotal),
      heapLimit,
      domNodes,
      eventListeners,
      isAuto: true,
      analysisContext,
    });
  }

  return snapshots;
}

// Main execution
async function main() {
  const outputDir = join(__dirname, "..", "mock-reports");

  // Create output directory
  const { mkdirSync } = await import("fs");
  try {
    mkdirSync(outputDir, { recursive: true });
  } catch {
    // Directory might already exist
  }

  console.log("Generating mock memory diagnostic reports...\n");

  // 0. Healthy/Normal Scenario
  const healthySnapshots = generateHealthyScenarioSnapshots();
  const healthyReport = generateMemoryReport(healthySnapshots, {
    appName: "Demo App - Healthy Memory Pattern",
    includeLeakAnalysis: true,
  });
  const healthyReportPath = join(outputDir, "memory-healthy-report.html");
  writeFileSync(healthyReportPath, healthyReport, "utf-8");
  console.log(`✓ Generated: ${healthyReportPath}`);
  console.log(`  - ${healthySnapshots.length} snapshots`);
  console.log(`  - Healthy/stable memory pattern`);
  console.log(`  - Heap: ~${Math.round(healthySnapshots[0].heapUsed / 1024 / 1024)}MB (stable)\n`);

  // 1. Gradual Leak Scenario
  const leakSnapshots = generateLeakScenarioSnapshots();
  const leakReport = generateMemoryReport(leakSnapshots, {
    appName: "Demo App - Memory Leak Scenario",
    includeLeakAnalysis: true,
  });
  const leakReportPath = join(outputDir, "memory-leak-report.html");
  writeFileSync(leakReportPath, leakReport, "utf-8");
  console.log(`✓ Generated: ${leakReportPath}`);
  console.log(`  - ${leakSnapshots.length} snapshots`);
  console.log(`  - Gradual memory leak pattern`);
  console.log(`  - Heap: ${Math.round(leakSnapshots[0].heapUsed / 1024 / 1024)}MB → ${Math.round(leakSnapshots[leakSnapshots.length - 1].heapUsed / 1024 / 1024)}MB\n`);

  // 2. Spike Scenario
  const spikeSnapshots = generateSpikeScenarioSnapshots();
  const spikeReport = generateMemoryReport(spikeSnapshots, {
    appName: "Demo App - Sudden Spike Scenario",
    includeLeakAnalysis: true,
  });
  const spikeReportPath = join(outputDir, "memory-spike-report.html");
  writeFileSync(spikeReportPath, spikeReport, "utf-8");
  console.log(`✓ Generated: ${spikeReportPath}`);
  console.log(`  - ${spikeSnapshots.length} snapshots`);
  console.log(`  - Sudden spike pattern\n`);

  // 3. Critical Scenario
  const criticalSnapshots = generateCriticalScenarioSnapshots();
  const criticalReport = generateMemoryReport(criticalSnapshots, {
    appName: "Demo App - Critical Memory Pressure",
    includeLeakAnalysis: true,
  });
  const criticalReportPath = join(outputDir, "memory-critical-report.html");
  writeFileSync(criticalReportPath, criticalReport, "utf-8");
  console.log(`✓ Generated: ${criticalReportPath}`);
  console.log(`  - ${criticalSnapshots.length} snapshots`);
  console.log(`  - Critical memory pressure scenario`);
  console.log(`  - Usage: ${Math.round((criticalSnapshots[0].heapUsed / criticalSnapshots[0].heapLimit) * 100)}% → ${Math.round((criticalSnapshots[criticalSnapshots.length - 1].heapUsed / criticalSnapshots[criticalSnapshots.length - 1].heapLimit) * 100)}%\n`);

  console.log("Done! Open the HTML files in a browser to view the reports.");
}

main().catch(console.error);
