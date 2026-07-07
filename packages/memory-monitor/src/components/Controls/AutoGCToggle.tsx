import React, { useCallback, useId } from "react";
import clsx from "clsx";
import styles from "./AutoGCToggle.module.scss";

export interface AutoGCToggleProps {
  /** Whether auto-GC is enabled */
  enabled: boolean;
  /** Callback when toggle changes */
  onToggle: (enabled: boolean) => void;
  /** Current threshold value (0-100) */
  threshold: number | null;
  /** Callback when threshold changes */
  onThresholdChange: (threshold: number | null) => void;
  /** Whether the feature is supported */
  isSupported?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Recycle icon component
 */
function RecycleIcon({ className }: { className?: string }) {
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
      <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
      <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
      <path d="m14 16-3 3 3 3" />
      <path d="M8.293 13.596 7.196 9.5 3.1 10.598" />
      <path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843" />
      <path d="m13.378 9.633 4.096 1.098 1.097-4.096" />
    </svg>
  );
}

/**
 * Auto-GC toggle component with threshold configuration
 */
export function AutoGCToggle({
  enabled,
  onToggle,
  threshold,
  onThresholdChange,
  isSupported = true,
  disabled = false,
  className,
}: AutoGCToggleProps) {
  const toggleId = useId();
  const thresholdId = useId();

  const handleToggle = useCallback(() => {
    onToggle(!enabled);
  }, [enabled, onToggle]);

  const handleThresholdChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      onThresholdChange(value === "" ? null : Number(value));
    },
    [onThresholdChange]
  );

  const isDisabled = disabled || !isSupported;

  return (
    <div className={clsx(styles.container, className)}>
      {/* Header with toggle */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div
            className={clsx(
              styles.iconWrapper,
              enabled && styles.iconWrapperEnabled
            )}
          >
            <RecycleIcon
              className={clsx(styles.icon, enabled && styles.iconEnabled)}
            />
          </div>
          <div className={styles.labelWrapper}>
            <label
              htmlFor={toggleId}
              className={clsx(styles.label, isDisabled && styles.disabled)}
            >
              Auto Garbage Collection
            </label>
            <p className={styles.description}>
              {isSupported
                ? "Automatically request GC when threshold is exceeded"
                : "GC hints not supported in this browser"}
            </p>
          </div>
        </div>

        {/* Toggle switch */}
        <button
          id={toggleId}
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={handleToggle}
          disabled={isDisabled}
          className={clsx(styles.toggle, enabled && styles.toggleEnabled)}
        >
          <span
            className={clsx(
              styles.toggleThumb,
              enabled && styles.toggleThumbEnabled
            )}
          />
        </button>
      </div>

      {/* Threshold configuration (shown when enabled) */}
      {enabled && (
        <div className={styles.thresholdSection}>
          <label htmlFor={thresholdId} className={styles.thresholdLabel}>
            Trigger Threshold
          </label>
          <div className={styles.thresholdInputWrapper}>
            <input
              id={thresholdId}
              type="number"
              min={50}
              max={100}
              step={5}
              value={threshold ?? ""}
              onChange={handleThresholdChange}
              placeholder="85"
              disabled={isDisabled}
              className={styles.thresholdInput}
            />
            <span className={styles.thresholdSuffix}>% memory usage</span>
          </div>
          <p className={styles.thresholdHelp}>
            GC will be requested when memory usage exceeds this threshold (with
            10s cooldown)
          </p>
        </div>
      )}
    </div>
  );
}

AutoGCToggle.displayName = "AutoGCToggle";
