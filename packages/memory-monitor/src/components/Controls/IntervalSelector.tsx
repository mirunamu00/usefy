import React, { useCallback, useId } from "react";
import clsx from "clsx";
import { INTERVAL_OPTIONS } from "../../constants";
import styles from "./IntervalSelector.module.scss";

export interface IntervalSelectorProps {
  /** Current interval in milliseconds */
  value: number;
  /** Callback when interval changes */
  onChange: (interval: number) => void;
  /** Custom interval options */
  options?: readonly { readonly value: number; readonly label: string }[];
  /** Disabled state */
  disabled?: boolean;
  /** Show label */
  showLabel?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Clock icon
 */
function ClockIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

/**
 * Interval selector component for polling interval configuration
 */
export function IntervalSelector({
  value,
  onChange,
  options = INTERVAL_OPTIONS,
  disabled = false,
  showLabel = true,
  className,
}: IntervalSelectorProps) {
  const id = useId();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange(Number(e.target.value));
    },
    [onChange]
  );

  return (
    <div className={clsx(styles.container, className)}>
      {showLabel && (
        <label
          htmlFor={id}
          className={clsx(styles.label, disabled && styles.disabled)}
        >
          <ClockIcon className={styles.labelIcon} />
          <span>Polling Interval</span>
        </label>
      )}

      <div className={styles.selectWrapper}>
        <select
          id={id}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={clsx(styles.select, disabled && styles.disabled)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Dropdown arrow */}
        <div className={styles.dropdownArrow}>
          <svg
            className={styles.arrowIcon}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      <p className={styles.helperText}>How often to poll for memory updates</p>
    </div>
  );
}

IntervalSelector.displayName = "IntervalSelector";
