import React from "react";
import clsx from "clsx";
import { formatBytes } from "../../constants";
import type { PanelSnapshot } from "../../types";
import styles from "./SnapshotCompare.module.scss";

export interface SnapshotCompareProps {
  /** First snapshot (baseline) */
  baseline: PanelSnapshot;
  /** Second snapshot (current) */
  current: PanelSnapshot;
  /** Custom class name */
  className?: string;
}

/**
 * Arrow up icon
 */
function ArrowUpIcon({ className }: { className?: string }) {
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
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

/**
 * Arrow down icon
 */
function ArrowDownIcon({ className }: { className?: string }) {
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
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  );
}

/**
 * Check if a value is valid for comparison
 */
function isValidNumber(value: number | undefined | null): value is number {
  return value != null && !Number.isNaN(value) && Number.isFinite(value);
}

/**
 * Calculate difference between two values
 */
function calculateDiff(
  baseline: number | undefined | null,
  current: number | undefined | null
): { diff: number; percentage: number; direction: "up" | "down" | "same"; isValid: boolean } {
  // Handle invalid values
  if (!isValidNumber(baseline) || !isValidNumber(current)) {
    return { diff: 0, percentage: 0, direction: "same", isValid: false };
  }

  const diff = current - baseline;
  const percentage = baseline > 0 ? (diff / baseline) * 100 : 0;
  const direction = diff > 0 ? "up" : diff < 0 ? "down" : "same";
  return { diff, percentage, direction, isValid: true };
}

/**
 * Diff badge component
 */
interface DiffBadgeProps {
  diff: number;
  percentage: number;
  direction: "up" | "down" | "same";
  format?: (value: number) => string;
  isValid?: boolean;
}

function DiffBadge({
  diff,
  percentage,
  direction,
  format = formatBytes,
  isValid = true,
}: DiffBadgeProps) {
  // Handle invalid/unavailable data
  if (!isValid) {
    return (
      <span className={styles.diffNA}>
        N/A
      </span>
    );
  }

  if (direction === "same") {
    return (
      <span className={styles.diffNoChange}>
        No change
      </span>
    );
  }

  const isIncrease = direction === "up";
  const Icon = isIncrease ? ArrowUpIcon : ArrowDownIcon;

  // Use absolute value for formatting (formatBytes doesn't handle negative numbers)
  const formattedValue = format(Math.abs(diff));
  const formattedPercentage = Math.abs(percentage).toFixed(1);

  return (
    <div
      className={clsx(
        styles.diffBadge,
        isIncrease ? styles.diffBadgeIncrease : styles.diffBadgeDecrease
      )}
    >
      <Icon className={styles.icon} />
      <span>
        {isIncrease ? "+" : "-"}
        {formattedValue} ({formattedPercentage}%)
      </span>
    </div>
  );
}

/**
 * Safely format a value, returning "N/A" for invalid values
 */
function safeFormat(
  value: number | undefined | null,
  format: (value: number) => string
): string {
  if (!isValidNumber(value)) {
    return "N/A";
  }
  return format(value);
}

/**
 * Comparison row component
 */
interface CompareRowProps {
  label: string;
  baseline: number | undefined | null;
  current: number | undefined | null;
  format?: (value: number) => string;
}

function CompareRow({
  label,
  baseline,
  current,
  format = formatBytes,
}: CompareRowProps) {
  const { diff, percentage, direction, isValid } = calculateDiff(baseline, current);

  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>
        {label}
      </span>
      <span className={styles.rowBaseline}>
        {safeFormat(baseline, format)}
      </span>
      <span className={styles.rowCurrent}>
        {safeFormat(current, format)}
      </span>
      <div className={styles.rowChange}>
        <DiffBadge
          diff={diff}
          percentage={percentage}
          direction={direction}
          format={format}
          isValid={isValid}
        />
      </div>
    </div>
  );
}

/**
 * Snapshot comparison component
 */
export function SnapshotCompare({
  baseline,
  current,
  className,
}: SnapshotCompareProps) {
  const heapDiff = calculateDiff(baseline.heapUsed, current.heapUsed);
  const timeDiff = current.timestamp - baseline.timestamp;
  const timeDiffSeconds = Math.round(timeDiff / 1000);

  return (
    <div className={clsx(styles.container, className)}>
      {/* Header */}
      <div className={styles.header}>
        <h4 className={styles.headerTitle}>
          Snapshot Comparison
        </h4>
        <p className={styles.headerSubtitle}>
          {baseline.label} → {current.label} ({timeDiffSeconds}s apart)
        </p>
      </div>

      {/* Summary */}
      <div className={styles.summary}>
        <div className={styles.summaryContent}>
          <span className={styles.summaryLabel}>
            Overall Memory Change
          </span>
          <DiffBadge
            diff={heapDiff.diff}
            percentage={heapDiff.percentage}
            direction={heapDiff.direction}
            isValid={heapDiff.isValid}
          />
        </div>
      </div>

      {/* Comparison table */}
      <div className={styles.table}>
        {/* Column headers */}
        <div className={styles.tableHeader}>
          <span>Metric</span>
          <span className={styles.tableHeaderCenter}>Baseline</span>
          <span className={styles.tableHeaderCenter}>Current</span>
          <span className={styles.tableHeaderRight}>Change</span>
        </div>

        {/* Rows */}
        <CompareRow
          label="Heap Used"
          baseline={baseline.heapUsed}
          current={current.heapUsed}
        />
        <CompareRow
          label="Heap Total"
          baseline={baseline.heapTotal}
          current={current.heapTotal}
        />
        <CompareRow
          label="Heap Limit"
          baseline={baseline.heapLimit}
          current={current.heapLimit}
        />
        {baseline.domNodes !== undefined && current.domNodes !== undefined && (
          <CompareRow
            label="DOM Nodes"
            baseline={baseline.domNodes}
            current={current.domNodes}
            format={(v) => v.toLocaleString()}
          />
        )}
        {baseline.eventListeners !== undefined &&
          current.eventListeners !== undefined && (
            <CompareRow
              label="Listeners"
              baseline={baseline.eventListeners}
              current={current.eventListeners}
              format={(v) => v.toLocaleString()}
            />
          )}
      </div>

      {/* Analysis */}
      {heapDiff.isValid && heapDiff.direction !== "same" && (
        <div
          className={clsx(
            styles.analysis,
            heapDiff.direction === "up"
              ? styles.analysisIncrease
              : styles.analysisDecrease
          )}
        >
          <p
            className={clsx(
              styles.analysisText,
              heapDiff.direction === "up"
                ? styles.analysisTextIncrease
                : styles.analysisTextDecrease
            )}
          >
            {heapDiff.direction === "up" ? (
              <>
                Memory increased by{" "}
                <strong>{formatBytes(heapDiff.diff)}</strong> (
                {heapDiff.percentage.toFixed(1)}%). Consider checking for memory
                leaks if this pattern continues.
              </>
            ) : (
              <>
                Memory decreased by{" "}
                <strong>{formatBytes(Math.abs(heapDiff.diff))}</strong> (
                {Math.abs(heapDiff.percentage).toFixed(1)}%). Memory is being
                released as expected.
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

SnapshotCompare.displayName = "SnapshotCompare";
