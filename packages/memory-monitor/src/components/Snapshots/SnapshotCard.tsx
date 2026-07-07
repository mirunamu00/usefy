import React from "react";
import clsx from "clsx";
import { formatBytes, formatTime } from "../../constants";
import type { PanelSnapshot } from "../../types";
import styles from "./SnapshotCard.module.scss";

export interface SnapshotCardProps {
  /** Snapshot data */
  snapshot: PanelSnapshot;
  /** Whether this snapshot is selected */
  selected?: boolean;
  /** Selection role for comparison (baseline = older, current = newer) */
  selectionRole?: "baseline" | "current" | null;
  /** Click callback */
  onClick?: () => void;
  /** Delete callback */
  onDelete?: () => void;
  /** Compact display mode */
  compact?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Trash icon
 */
function TrashIcon({ className }: { className?: string }) {
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
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

/**
 * Role badge label mapping
 */
const ROLE_LABELS = {
  baseline: "Baseline",
  current: "Current",
} as const;

/**
 * Snapshot card component displaying individual snapshot data
 */
export function SnapshotCard({
  snapshot,
  selected = false,
  selectionRole,
  onClick,
  onDelete,
  compact = false,
  className,
}: SnapshotCardProps) {
  const usagePercentage = (snapshot.heapUsed / snapshot.heapLimit) * 100;

  /**
   * Get card style class based on selection role or selected state
   */
  const getCardStyleClass = (isCompact: boolean) => {
    if (selectionRole === "baseline") {
      return isCompact ? styles.compactCardBaseline : styles.cardBaseline;
    }
    if (selectionRole === "current") {
      return isCompact ? styles.compactCardCurrent : styles.cardCurrent;
    }
    if (selected) {
      return isCompact ? styles.compactCardSelected : styles.cardSelected;
    }
    return isCompact ? styles.compactCardDefault : styles.cardDefault;
  };

  /**
   * Get role badge style class
   */
  const getRoleBadgeClass = (isCompact: boolean) => {
    const baseClass = isCompact ? styles.roleBadgeCompact : styles.roleBadge;
    if (selectionRole === "baseline") {
      return clsx(baseClass, styles.baselineBadge);
    }
    if (selectionRole === "current") {
      return clsx(baseClass, styles.currentBadge);
    }
    return baseClass;
  };

  /**
   * Get usage bar fill class based on percentage
   */
  const getUsageBarClass = () => {
    if (usagePercentage >= 90) {
      return styles.usageBarCritical;
    }
    if (usagePercentage >= 70) {
      return styles.usageBarWarning;
    }
    return styles.usageBarNormal;
  };

  if (compact) {
    return (
      <div
        className={clsx(
          styles.compactCard,
          getCardStyleClass(true),
          className
        )}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      >
        <div className={styles.compactContent}>
          {selectionRole && (
            <span className={getRoleBadgeClass(true)}>
              {ROLE_LABELS[selectionRole]}
            </span>
          )}
          <span className={styles.compactLabel}>
            {snapshot.label}
          </span>
          {snapshot.isAuto && (
            <span className={styles.autoBadge}>
              Auto
            </span>
          )}
          <span className={styles.compactTime}>
            {formatTime(snapshot.timestamp)}
          </span>
        </div>
        <div className={styles.compactActions}>
          <span className={styles.compactHeap}>
            {formatBytes(snapshot.heapUsed)}
          </span>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className={styles.deleteButton}
              aria-label="Delete snapshot"
            >
              <TrashIcon className={styles.iconSmall} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        styles.card,
        getCardStyleClass(false),
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerTitle}>
            {selectionRole && (
              <span className={getRoleBadgeClass(false)}>
                {ROLE_LABELS[selectionRole]}
              </span>
            )}
            <h4 className={styles.title}>
              {snapshot.label}
            </h4>
            {snapshot.isAuto && (
              <span className={styles.autoBadge}>
                Auto
              </span>
            )}
          </div>
          <p className={styles.timestamp}>
            {formatTime(snapshot.timestamp)}
          </p>
        </div>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className={styles.deleteButtonLarge}
            aria-label="Delete snapshot"
          >
            <TrashIcon className={styles.iconMedium} />
          </button>
        )}
      </div>

      {/* Memory stats */}
      <div className={styles.body}>
        {/* Usage bar */}
        <div className={styles.usageSection}>
          <div className={styles.usageHeader}>
            <span className={styles.usageLabel}>
              Heap Usage
            </span>
            <span className={styles.usageValue}>
              {usagePercentage.toFixed(1)}%
            </span>
          </div>
          <div className={styles.usageBarTrack}>
            <div
              className={clsx(styles.usageBarFill, getUsageBarClass())}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>
              Used
            </span>
            <p className={styles.statValue}>
              {formatBytes(snapshot.heapUsed)}
            </p>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>
              Total
            </span>
            <p className={styles.statValue}>
              {formatBytes(snapshot.heapTotal)}
            </p>
          </div>
        </div>

        {/* Notes */}
        {snapshot.notes && (
          <p className={styles.notes}>
            {snapshot.notes}
          </p>
        )}
      </div>
    </div>
  );
}

SnapshotCard.displayName = "SnapshotCard";
