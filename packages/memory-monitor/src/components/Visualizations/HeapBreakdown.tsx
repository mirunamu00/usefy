import React, { useMemo } from "react";
import clsx from "clsx";
import {
  CHART_COLORS,
  SEVERITY_COLORS,
  formatBytes,
  formatPercentage,
} from "../../constants";
import type { Severity } from "../../types";
import styles from "./HeapBreakdown.module.scss";

export interface HeapBreakdownProps {
  /** Heap used in bytes */
  heapUsed: number | null;
  /** Heap total in bytes */
  heapTotal: number | null;
  /** Heap limit in bytes */
  heapLimit: number | null;
  /** Current severity level */
  severity?: Severity;
  /** Warning threshold percentage */
  warningThreshold?: number;
  /** Critical threshold percentage */
  criticalThreshold?: number;
  /** Custom class name */
  className?: string;
}

interface BreakdownSegment {
  label: string;
  value: number;
  percentage: number;
  color: string;
  type: 'used' | 'available' | 'reserved';
}

/**
 * Visual breakdown of heap memory distribution
 */
export function HeapBreakdown({
  heapUsed,
  heapTotal,
  heapLimit,
  severity = "normal",
  warningThreshold = 70,
  criticalThreshold = 90,
  className,
}: HeapBreakdownProps) {
  // Calculate segments
  const segments = useMemo((): BreakdownSegment[] => {
    if (heapLimit === null || heapLimit === 0) return [];

    const used = heapUsed ?? 0;
    const total = heapTotal ?? 0;
    const available = Math.max(0, total - used);
    const reserved = Math.max(0, heapLimit - total);

    return [
      {
        label: "Used",
        value: used,
        percentage: (used / heapLimit) * 100,
        color: SEVERITY_COLORS[severity].accent,
        type: 'used',
      },
      {
        label: "Available",
        value: available,
        percentage: (available / heapLimit) * 100,
        color: CHART_COLORS.secondary,
        type: 'available',
      },
      {
        label: "Reserved",
        value: reserved,
        percentage: (reserved / heapLimit) * 100,
        color: CHART_COLORS.grayLight,
        type: 'reserved',
      },
    ];
  }, [heapUsed, heapTotal, heapLimit, severity]);

  // Calculate utilization percentage (used / total)
  const utilizationPercent = useMemo(() => {
    if (!heapUsed || !heapTotal || heapTotal === 0) return 0;
    return (heapUsed / heapTotal) * 100;
  }, [heapUsed, heapTotal]);

  // Calculate limit usage percentage (used / limit)
  const limitUsagePercent = useMemo(() => {
    if (!heapUsed || !heapLimit || heapLimit === 0) return 0;
    return (heapUsed / heapLimit) * 100;
  }, [heapUsed, heapLimit]);

  if (segments.length === 0) {
    return (
      <div className={clsx(styles.emptyState, className)}>
        No memory data available
      </div>
    );
  }

  return (
    <div className={clsx(styles.container, className)}>
      {/* Heap Utilization Bar */}
      <div>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Heap Utilization</span>
          <span className={clsx(styles.sectionValue, styles[severity])}>
            {formatPercentage(utilizationPercent)}
          </span>
        </div>
        <div className={styles.progressBarContainer}>
          <div
            className={styles.progressBar}
            style={{
              width: `${Math.min(utilizationPercent, 100)}%`,
              backgroundColor: SEVERITY_COLORS[severity].accent,
            }}
          />
        </div>
        <div className={styles.progressLabels}>
          <span>{formatBytes(heapUsed)} used</span>
          <span>{formatBytes(heapTotal)} allocated</span>
        </div>
      </div>

      {/* Limit Usage Bar */}
      <div>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Limit Usage</span>
          <span className={clsx(styles.sectionValue, styles[severity])}>
            {formatPercentage(limitUsagePercent)}
          </span>
        </div>
        <div className={clsx(styles.progressBarContainer, styles.progressBarContainerWithMarkers)}>
          {/* Threshold markers */}
          <div
            className={clsx(styles.thresholdMarker, styles.warning)}
            style={{ left: `${warningThreshold}%` }}
          />
          <div
            className={clsx(styles.thresholdMarker, styles.critical)}
            style={{ left: `${criticalThreshold}%` }}
          />
          {/* Progress bar */}
          <div
            className={styles.progressBar}
            style={{
              width: `${Math.max(Math.min(limitUsagePercent, 100), 1)}%`,
              backgroundColor: SEVERITY_COLORS[severity].accent,
            }}
          />
        </div>
        <div className={styles.progressLabels}>
          <span>{formatBytes(heapUsed)} used</span>
          <span>{formatBytes(heapLimit)} limit</span>
        </div>
      </div>

      {/* Memory Values Grid */}
      <div className={styles.segmentsGrid}>
        {segments.map((segment) => (
          <div key={segment.label} className={styles.segmentCard}>
            <div
              className={styles.segmentIndicator}
              style={{ backgroundColor: segment.color }}
            />
            <div className={styles.segmentLabel}>
              {segment.label}
            </div>
            <div
              className={clsx(styles.segmentValue, styles[segment.type])}
              style={segment.type === 'used' ? { color: segment.color } : undefined}
            >
              {formatBytes(segment.value)}
            </div>
            <div className={styles.segmentPercentage}>
              {formatPercentage(segment.percentage)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

HeapBreakdown.displayName = "HeapBreakdown";
