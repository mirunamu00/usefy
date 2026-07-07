import React from "react";
import clsx from "clsx";
import { TREND_COLORS } from "../../constants";
import type { Trend } from "../../types";
import styles from "./TrendIndicator.module.scss";

export interface TrendIndicatorProps {
  /** Current trend direction */
  trend: Trend;
  /** Leak probability (0-100) */
  leakProbability?: number;
  /** Number of history samples */
  sampleCount?: number;
  /** Compact display mode */
  compact?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Icon props with optional style
 */
interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Trend arrow icons
 */
const TrendIcons: Record<Trend, React.FC<IconProps>> = {
  increasing: ({ className, style }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="M7 17L17 7" />
      <path d="M7 7h10v10" />
    </svg>
  ),
  decreasing: ({ className, style }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="M7 7L17 17" />
      <path d="M17 7v10H7" />
    </svg>
  ),
  stable: ({ className, style }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  ),
};

/**
 * Trend labels
 */
const trendLabels: Record<Trend, string> = {
  increasing: "Increasing",
  decreasing: "Decreasing",
  stable: "Stable",
};

/**
 * Get leak probability badge level
 */
function getLeakLevel(probability: number): 'high' | 'medium' | 'low' {
  if (probability >= 70) return 'high';
  if (probability >= 40) return 'medium';
  return 'low';
}

/**
 * Trend indicator badge component
 */
export function TrendIndicator({
  trend,
  leakProbability,
  sampleCount,
  compact = false,
  className,
}: TrendIndicatorProps) {
  const Icon = TrendIcons[trend];
  const label = trendLabels[trend];
  const color = TREND_COLORS[trend];

  if (compact) {
    return (
      <div className={clsx(styles.compactContainer, className)}>
        <Icon className={styles.compactIcon} style={{ color }} />
        <span className={clsx(styles.compactLabel, styles[trend])}>
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className={clsx(styles.container, className)}>
      <div className={styles.header}>
        <div className={styles.trendInfo}>
          <div
            className={styles.iconWrapper}
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className={styles.icon} style={{ color }} />
          </div>
          <div className={styles.trendTextContainer}>
            <div className={styles.trendLabel}>Memory Trend</div>
            <div className={clsx(styles.trendValue, styles[trend])}>
              {label}
            </div>
          </div>
        </div>

        {/* Leak probability badge - only show if probability is meaningful (>= 30%) */}
        {leakProbability !== undefined && leakProbability >= 30 && (
          <div className={clsx(styles.leakBadge, styles[getLeakLevel(leakProbability)])}>
            {leakProbability.toFixed(0)}% risk
          </div>
        )}
      </div>

      {/* Sample count */}
      {sampleCount !== undefined && (
        <div className={styles.sampleCount}>
          Based on {sampleCount} samples
        </div>
      )}
    </div>
  );
}

TrendIndicator.displayName = "TrendIndicator";
