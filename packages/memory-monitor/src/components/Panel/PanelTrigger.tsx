import React, { forwardRef } from "react";
import { clsx } from "clsx";
import type { TriggerPosition, Severity } from "../../types";
import {
  DEFAULT_TRIGGER_POSITION,
  Z_INDEX,
} from "../../constants";
import styles from "./PanelTrigger.module.scss";

export interface PanelTriggerProps {
  /** Click handler */
  onClick: () => void;
  /** Position of the trigger button */
  position?: TriggerPosition;
  /** Z-index for the trigger */
  zIndex?: number;
  /** Current severity level */
  severity?: Severity;
  /** Custom content */
  children?: React.ReactNode;
  /** Custom class name */
  className?: string;
  /** Dark mode */
  isDark?: boolean;
  /** Accessible label */
  "aria-label"?: string;
}

/**
 * Memory icon SVG
 */
function MemoryIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
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
      style={style}
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3" />
      <path d="M15 1v3" />
      <path d="M9 20v3" />
      <path d="M15 20v3" />
      <path d="M20 9h3" />
      <path d="M20 14h3" />
      <path d="M1 9h3" />
      <path d="M1 14h3" />
    </svg>
  );
}

/**
 * Floating trigger button to open the panel
 */
export const PanelTrigger = forwardRef<HTMLButtonElement, PanelTriggerProps>(
  (
    {
      onClick,
      position = DEFAULT_TRIGGER_POSITION,
      zIndex = Z_INDEX.trigger,
      severity = "normal",
      children,
      className,
      isDark = false,
      "aria-label": ariaLabel = "Open Memory Monitor",
    },
    ref
  ) => {
    // Build position style
    const positionStyle: React.CSSProperties = {
      zIndex,
    };
    if (position.top !== undefined) positionStyle.top = position.top;
    if (position.bottom !== undefined) positionStyle.bottom = position.bottom;
    if (position.left !== undefined) positionStyle.left = position.left;
    if (position.right !== undefined) positionStyle.right = position.right;

    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={clsx(
          styles.trigger,
          severity === "warning" && styles.warning,
          severity === "critical" && styles.critical,
          isDark && "dark",
          className
        )}
        style={positionStyle}
      >
        {children || <MemoryIcon className={styles.icon} />}
      </button>
    );
  }
);

PanelTrigger.displayName = "PanelTrigger";
