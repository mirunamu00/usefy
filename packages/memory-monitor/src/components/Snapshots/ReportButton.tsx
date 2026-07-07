import React, { useCallback, useState } from "react";
import clsx from "clsx";
import {
  generateMemoryReport,
  downloadReport,
  canGenerateReport,
  MIN_SNAPSHOTS_FOR_REPORT,
} from "../../utils/reportGenerator";
import type { PanelSnapshot } from "../../types";
import styles from "./ReportButton.module.scss";

export interface ReportButtonProps {
  /** Array of snapshots to generate report from */
  snapshots: PanelSnapshot[];
  /** Minimum number of snapshots required (default: 5) */
  minSnapshots?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
  /** Application name for report header */
  appName?: string;
}

/**
 * Document icon SVG
 */
function DocumentIcon({ className }: { className?: string }) {
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

/**
 * Loading spinner icon
 */
function SpinnerIcon({ className }: { className?: string }) {
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
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

/**
 * Button to generate and download memory diagnostic report
 */
export function ReportButton({
  snapshots,
  minSnapshots = MIN_SNAPSHOTS_FOR_REPORT,
  disabled = false,
  className,
  appName,
}: ReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const canGenerate = canGenerateReport(snapshots, minSnapshots);
  const isDisabled = disabled || !canGenerate || isGenerating;
  const remaining = Math.max(0, minSnapshots - snapshots.length);

  const handleGenerateReport = useCallback(async () => {
    if (!canGenerate || isGenerating) return;

    setIsGenerating(true);

    try {
      // Use setTimeout to allow UI to update before heavy computation
      await new Promise((resolve) => setTimeout(resolve, 50));

      const html = generateMemoryReport(snapshots, {
        minSnapshots,
        appName,
        includeLeakAnalysis: true,
        includeDOMAnalysis: true,
      });

      downloadReport(html);
    } catch (error) {
      console.error("Failed to generate report:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [snapshots, minSnapshots, appName, canGenerate, isGenerating]);

  const getTooltip = () => {
    if (isGenerating) {
      return "Generating report...";
    }
    if (!canGenerate) {
      return `${remaining} more snapshot${remaining !== 1 ? "s" : ""} needed`;
    }
    return "Generate memory diagnostic report";
  };

  return (
    <button
      type="button"
      onClick={handleGenerateReport}
      disabled={isDisabled}
      title={getTooltip()}
      className={clsx(
        styles.button,
        canGenerate ? styles.buttonEnabled : styles.buttonDisabled,
        className
      )}
    >
      {isGenerating ? (
        <SpinnerIcon className={clsx(styles.icon, styles.spinner)} />
      ) : (
        <DocumentIcon className={styles.icon} />
      )}
      <span>
        {isGenerating
          ? "Generating..."
          : canGenerate
          ? "Generate Report"
          : `Generate Report (${snapshots.length}/${minSnapshots})`}
      </span>
    </button>
  );
}

ReportButton.displayName = "ReportButton";
