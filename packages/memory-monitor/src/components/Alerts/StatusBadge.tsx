import React from "react";
import { clsx } from "clsx";
import { SEVERITY_COLORS } from "../../constants";
import type { Severity } from "../../types";
import styles from "./StatusBadge.module.scss";

export interface StatusBadgeProps {
  /** Current severity level */
  severity: Severity;
  /** Show pulse animation for warning/critical */
  pulse?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Custom class name */
  className?: string;
}

/**
 * Severity labels
 */
const severityLabels: Record<Severity, string> = {
  normal: "Normal",
  warning: "Warning",
  critical: "Critical",
};

/**
 * Severity style mapping
 */
const severityStyles: Record<Severity, string> = {
  normal: styles.severityNormal,
  warning: styles.severityWarning,
  critical: styles.severityCritical,
};

/**
 * Size style mapping
 */
const sizeStyles: Record<"sm" | "md" | "lg", string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
};

/**
 * Dot size style mapping
 */
const dotSizeStyles: Record<"sm" | "md" | "lg", string> = {
  sm: styles.dotSizeSm,
  md: styles.dotSizeMd,
  lg: styles.dotSizeLg,
};

/**
 * Status badge component showing current memory severity
 */
export function StatusBadge({
  severity,
  pulse = true,
  size = "md",
  className,
}: StatusBadgeProps) {
  const colors = SEVERITY_COLORS[severity];
  const label = severityLabels[severity];
  const shouldPulse = pulse && severity !== "normal";

  return (
    <div
      className={clsx(
        styles.badge,
        sizeStyles[size],
        severityStyles[severity],
        className
      )}
    >
      {/* Status dot */}
      <span className={styles.dotWrapper}>
        <span
          className={clsx(styles.dot, dotSizeStyles[size])}
          style={{ backgroundColor: colors.accent }}
        />
        {shouldPulse && (
          <span
            className={clsx(styles.dotPing, dotSizeStyles[size])}
            style={{ backgroundColor: colors.accent }}
          />
        )}
      </span>

      {/* Label */}
      <span>{label}</span>
    </div>
  );
}

StatusBadge.displayName = "StatusBadge";
