import React, { useCallback, useId } from "react";
import clsx from "clsx";
import styles from "./ThresholdSlider.module.scss";

export interface ThresholdSliderProps {
  /** Slider label */
  label: string;
  /** Current value (0-100) */
  value: number;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Accent color */
  color?: string;
  /** Show value badge */
  showValue?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Helper text */
  helperText?: string;
  /** Custom class name */
  className?: string;
  /** Value suffix (e.g., '%', 'samples') */
  suffix?: string;
}

/**
 * Threshold slider component for adjusting memory thresholds
 */
export function ThresholdSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  color = "#3b82f6",
  showValue = true,
  disabled = false,
  helperText,
  className,
  suffix = "%",
}: ThresholdSliderProps) {
  const id = useId();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    },
    [onChange]
  );

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={clsx(styles.container, className)}>
      {/* Label and value */}
      <div className={styles.header}>
        <label
          htmlFor={id}
          className={clsx(styles.label, disabled && styles.disabled)}
        >
          {label}
        </label>
        {showValue && (
          <span
            className={clsx(styles.valueBadge, disabled && styles.disabled)}
          >
            {value}
            {suffix}
          </span>
        )}
      </div>

      {/* Slider */}
      <div className={styles.sliderWrapper}>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={clsx(styles.slider, disabled && styles.disabled)}
          style={{
            background: disabled
              ? undefined
              : `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, transparent ${percentage}%, transparent 100%)`,
            // @ts-expect-error CSS custom property
            "--thumb-color": color,
          }}
        />
      </div>

      {/* Helper text */}
      {helperText && (
        <p className={clsx(styles.helperText, disabled && styles.disabled)}>
          {helperText}
        </p>
      )}
    </div>
  );
}

ThresholdSlider.displayName = "ThresholdSlider";
