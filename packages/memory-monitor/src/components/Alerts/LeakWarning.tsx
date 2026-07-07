import React from "react";
import { clsx } from "clsx";
import type { Trend } from "../../types";
import styles from "./LeakWarning.module.scss";

export interface LeakWarningProps {
  /** Whether a memory leak is detected */
  isLeaking: boolean;
  /** Leak probability percentage (0-100) */
  probability: number;
  /** Current memory trend */
  trend: Trend;
  /** Recommendation text */
  recommendation?: string;
  /** Whether the alert can be dismissed */
  dismissible?: boolean;
  /** Callback when dismissed */
  onDismiss?: () => void;
  /** Compact display mode */
  compact?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Warning icon component
 */
function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/**
 * Close icon component
 */
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/**
 * Get severity level based on probability
 */
function getSeverityLevel(probability: number): "low" | "medium" | "high" {
  if (probability >= 70) return "high";
  if (probability >= 40) return "medium";
  return "low";
}

/**
 * Severity style mapping
 */
const severityStyles = {
  low: styles.severityLow,
  medium: styles.severityMedium,
  high: styles.severityHigh,
};

/**
 * Memory leak warning banner component
 */
export function LeakWarning({
  isLeaking,
  probability,
  trend,
  recommendation,
  dismissible = false,
  onDismiss,
  compact = false,
  className,
}: LeakWarningProps) {
  // Don't render if not leaking
  if (!isLeaking) return null;

  const severityLevel = getSeverityLevel(probability);
  const severityClass = severityStyles[severityLevel];

  if (compact) {
    return (
      <div className={clsx(styles.compact, severityClass, className)}>
        <WarningIcon className={styles.compactIcon} />
        <span className={styles.compactText}>
          Memory leak detected ({probability.toFixed(0)}% probability)
        </span>
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className={styles.compactDismiss}
            aria-label="Dismiss warning"
          >
            <CloseIcon className={styles.compactDismissIcon} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={clsx(styles.container, severityClass, className)}
      role="alert"
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <WarningIcon className={styles.headerIcon} />
        </div>

        <div className={styles.content}>
          <div className={styles.titleRow}>
            <h4 className={styles.title}>Potential Memory Leak Detected</h4>
            {dismissible && onDismiss && (
              <button
                onClick={onDismiss}
                className={styles.dismissButton}
                aria-label="Dismiss warning"
              >
                <CloseIcon className={styles.dismissIcon} />
              </button>
            )}
          </div>

          <p className={styles.description}>
            Memory usage is consistently {trend} with a{" "}
            <strong>{probability.toFixed(0)}%</strong> probability of a memory
            leak.
          </p>
        </div>
      </div>

      {/* Recommendation */}
      {recommendation && (
        <div className={styles.recommendation}>
          <p className={styles.recommendationText}>
            <strong>Recommendation:</strong> {recommendation}
          </p>
        </div>
      )}

      {/* Action hints */}
      <div className={styles.hints}>
        <div className={styles.hintsList}>
          <span className={styles.hint}>
            Check for unsubscribed subscriptions
          </span>
          <span className={styles.hint}>Review event listeners</span>
          <span className={styles.hint}>Check for stale closures</span>
        </div>
      </div>
    </div>
  );
}

LeakWarning.displayName = "LeakWarning";
