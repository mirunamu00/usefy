import React from "react";
import { clsx } from "clsx";
import type { Severity } from "../../types";
import { SEVERITY_COLORS } from "../../constants";
import styles from "./PanelHeader.module.scss";

export interface PanelHeaderProps {
  /** Panel title */
  title?: string;
  /** Current severity level */
  severity?: Severity;
  /** Whether monitoring is active */
  isMonitoring?: boolean;
  /** Close button handler */
  onClose: () => void;
  /** Minimize button handler */
  onMinimize?: () => void;
  /** Custom class name */
  className?: string;
}

/**
 * Close icon SVG
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
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

/**
 * Minimize icon SVG
 */
function MinimizeIcon({ className }: { className?: string }) {
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
      <path d="M8 3v3a2 2 0 0 1-2 2H3" />
      <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
      <path d="M3 16h3a2 2 0 0 1 2 2v3" />
      <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

/**
 * Panel header component with title and controls
 */
export function PanelHeader({
  title = "Memory Monitor",
  severity = "normal",
  isMonitoring = false,
  onClose,
  onMinimize,
  className,
}: PanelHeaderProps) {
  const severityColor = SEVERITY_COLORS[severity];

  return (
    <div className={clsx(styles.header, className)}>
      {/* Title and status */}
      <div className={styles.titleSection}>
        <h2 className={styles.title}>{title}</h2>

        {/* Monitoring status indicator */}
        <div className={styles.statusIndicator}>
          <span
            className={clsx(
              styles.statusDot,
              isMonitoring ? styles.active : styles.paused
            )}
            style={{
              backgroundColor: isMonitoring ? severityColor.accent : undefined,
            }}
          />
          <span className={styles.statusText}>
            {isMonitoring ? "Live" : "Paused"}
          </span>
        </div>
      </div>

      {/* Control buttons */}
      <div className={styles.controls}>
        {onMinimize && (
          <button
            type="button"
            onClick={onMinimize}
            aria-label="Minimize panel"
            className={styles.controlButton}
          >
            <MinimizeIcon className={styles.icon} />
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className={styles.controlButton}
        >
          <CloseIcon className={styles.icon} />
        </button>
      </div>
    </div>
  );
}

PanelHeader.displayName = "PanelHeader";
