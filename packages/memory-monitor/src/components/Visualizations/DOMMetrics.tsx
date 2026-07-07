import React from "react";
import clsx from "clsx";
import { formatNumber } from "../../constants";
import styles from "./DOMMetrics.module.scss";

export interface DOMMetricsProps {
  /** Number of DOM nodes */
  domNodes: number | null;
  /** Estimated number of event listeners */
  eventListeners: number | null;
  /** Custom class name */
  className?: string;
}

/**
 * DOM tree icon
 */
function DOMIcon({ className }: { className?: string }) {
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
      <path d="M12 3v6" />
      <circle cx="12" cy="10" r="1" />
      <path d="M12 11v3" />
      <path d="M8 14h8" />
      <path d="M8 14v4" />
      <path d="M16 14v4" />
      <circle cx="8" cy="19" r="1" />
      <circle cx="16" cy="19" r="1" />
    </svg>
  );
}

/**
 * Event listener icon (lightning bolt)
 */
function ListenerIcon({ className }: { className?: string }) {
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
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

/**
 * Display component for DOM metrics (nodes and event listeners)
 */
export function DOMMetrics({
  domNodes,
  eventListeners,
  className,
}: DOMMetricsProps) {
  return (
    <div className={clsx(styles.container, className)}>
      {/* DOM Nodes */}
      <div className={styles.metricCard}>
        <div className={clsx(styles.iconWrapper, styles.dom)}>
          <DOMIcon className={clsx(styles.icon, styles.dom)} />
        </div>
        <div className={styles.metricContent}>
          <div className={styles.metricLabel}>DOM Nodes</div>
          <div className={styles.metricValue}>{formatNumber(domNodes)}</div>
        </div>
      </div>

      {/* Event Listeners */}
      <div className={styles.metricCard}>
        <div className={clsx(styles.iconWrapper, styles.listener)}>
          <ListenerIcon className={clsx(styles.icon, styles.listener)} />
        </div>
        <div className={styles.metricContent}>
          <div className={styles.metricLabel}>Listeners</div>
          <div className={styles.metricValue}>{formatNumber(eventListeners)}</div>
        </div>
      </div>
    </div>
  );
}

DOMMetrics.displayName = "DOMMetrics";
