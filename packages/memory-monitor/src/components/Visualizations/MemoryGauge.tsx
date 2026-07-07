import React, { useMemo } from "react";
import clsx from "clsx";
import { SEVERITY_COLORS, formatPercentage } from "../../constants";
import type { Severity } from "../../types";
import styles from "./MemoryGauge.module.scss";

export interface MemoryGaugeProps {
  /** Usage percentage (0-100) */
  usagePercentage: number | null;
  /** Current severity level */
  severity: Severity;
  /** Formatted heap used string */
  heapUsed?: string;
  /** Formatted heap limit string */
  heapLimit?: string;
  /** Warning threshold */
  warningThreshold?: number;
  /** Critical threshold */
  criticalThreshold?: number;
  /** Custom class name */
  className?: string;
}

/**
 * Custom SVG arc path generator
 */
function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
  ].join(" ");
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleInDegrees: number
) {
  const angleInRadians = ((angleInDegrees - 180) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

/**
 * Radial gauge chart showing memory usage percentage
 * Uses custom SVG for precise control over appearance
 */
export function MemoryGauge({
  usagePercentage,
  severity,
  heapUsed,
  heapLimit,
  warningThreshold = 70,
  criticalThreshold = 90,
  className,
}: MemoryGaugeProps) {
  const percentage = usagePercentage ?? 0;
  const color = SEVERITY_COLORS[severity].accent;

  // SVG dimensions
  const width = 280;
  const height = 160;
  const cx = width / 2;
  const cy = height - 20;
  const radius = 100;
  const strokeWidth = 24;

  // Arc angles (180° arc from left to right)
  const startAngle = 0;
  const endAngle = 180;
  const progressAngle = (percentage / 100) * 180;

  // Generate arc paths
  const backgroundArc = useMemo(
    () => describeArc(cx, cy, radius, startAngle, endAngle),
    [cx, cy, radius]
  );

  const progressArc = useMemo(
    () =>
      percentage > 0
        ? describeArc(cx, cy, radius, startAngle, Math.min(progressAngle, 180))
        : "",
    [cx, cy, radius, percentage, progressAngle]
  );

  return (
    <div className={clsx(styles.container, className)}>
      {/* SVG Gauge */}
      <div className={styles.svgWrapper}>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className={styles.svg}
        >
          {/* Background arc */}
          <path
            d={backgroundArc}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className={styles.backgroundArc}
          />

          {/* Progress arc */}
          {percentage > 0 && (
            <path
              d={progressArc}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              style={{
                transition: "stroke-dashoffset 0.5s ease-out",
              }}
            />
          )}
        </svg>

        {/* Center content - positioned over the SVG */}
        <div className={styles.centerContent}>
          <div
            className={clsx(
              styles.percentageValue,
              severity === "critical" && styles.critical,
              severity === "warning" && styles.warning
            )}
          >
            {formatPercentage(usagePercentage)}
          </div>
          {heapUsed && heapLimit && (
            <div className={styles.heapInfo}>
              {heapUsed} / {heapLimit}
            </div>
          )}
        </div>
      </div>

      {/* Threshold markers */}
      <div
        className={styles.thresholdMarkers}
        style={{ width: width - 20 }}
      >
        <span>0%</span>
        <span className={styles.warningMarker}>{warningThreshold}%</span>
        <span className={styles.criticalMarker}>{criticalThreshold}%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

MemoryGauge.displayName = "MemoryGauge";
