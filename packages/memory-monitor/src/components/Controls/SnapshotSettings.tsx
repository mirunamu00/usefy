import React, { useCallback, useId } from "react";
import clsx from "clsx";
import {
  SNAPSHOT_SCHEDULE_OPTIONS,
  DEFAULT_MAX_SNAPSHOTS,
  MIN_SNAPSHOTS_LIMIT,
  MAX_SNAPSHOTS_LIMIT,
} from "../../constants";
import type {
  SnapshotSettings as SnapshotSettingsType,
  SnapshotScheduleInterval,
} from "../../types";
import styles from "./SnapshotSettings.module.scss";

export interface SnapshotSettingsProps {
  /** Current snapshot settings */
  value: SnapshotSettingsType;
  /** Callback when settings change */
  onChange: (settings: SnapshotSettingsType) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Warning icon for alerts
 */
function WarningIcon({ className }: { className?: string }) {
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
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/**
 * Camera icon for snapshots
 */
function CameraIcon({ className }: { className?: string }) {
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
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

/**
 * Clock icon for schedule
 */
function ScheduleIcon({ className }: { className?: string }) {
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
 * Snapshot settings component for configuring snapshot behavior
 */
export function SnapshotSettings({
  value,
  onChange,
  disabled = false,
  className,
}: SnapshotSettingsProps) {
  const maxSnapshotsId = useId();
  const scheduleId = useId();
  const autoDeleteId = useId();

  // Check if auto-snapshot schedule is active
  const isAutoSnapshotActive = value.scheduleInterval !== "off";

  const handleMaxSnapshotsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Math.min(
        MAX_SNAPSHOTS_LIMIT,
        Math.max(
          MIN_SNAPSHOTS_LIMIT,
          Number(e.target.value) || DEFAULT_MAX_SNAPSHOTS
        )
      );
      onChange({ ...value, maxSnapshots: newValue });
    },
    [onChange, value]
  );

  const handleScheduleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange({
        ...value,
        scheduleInterval: e.target.value as SnapshotScheduleInterval,
      });
    },
    [onChange, value]
  );

  const handleAutoDeleteChange = useCallback(() => {
    onChange({ ...value, autoDeleteOldest: !value.autoDeleteOldest });
  }, [onChange, value]);

  return (
    <div className={clsx(styles.container, className)}>
      {/* Section header */}
      <div className={styles.sectionHeader}>
        <CameraIcon className={styles.sectionIcon} />
        <h4 className={styles.sectionTitle}>Snapshot Settings</h4>
      </div>

      {/* Max snapshots input */}
      <div className={styles.field}>
        <label
          htmlFor={maxSnapshotsId}
          className={clsx(
            styles.fieldLabel,
            (disabled || isAutoSnapshotActive) && styles.disabled
          )}
        >
          Maximum Snapshots
        </label>
        <div className={styles.inputWrapper}>
          <input
            id={maxSnapshotsId}
            type="number"
            min={MIN_SNAPSHOTS_LIMIT}
            max={MAX_SNAPSHOTS_LIMIT}
            value={value.maxSnapshots}
            onChange={handleMaxSnapshotsChange}
            disabled={disabled || isAutoSnapshotActive}
            className={styles.numberInput}
          />
          <span className={styles.inputSuffix}>(1-50)</span>
        </div>
        <p className={styles.fieldHelp}>Maximum number of snapshots to store</p>

        {/* Warning when auto-snapshot is active */}
        {isAutoSnapshotActive && (
          <div className={styles.warningAlert}>
            <WarningIcon className={styles.warningIcon} />
            <p className={styles.warningText}>
              Cannot modify while auto-snapshot is active. Turn off the schedule
              first.
            </p>
          </div>
        )}
      </div>

      {/* Schedule selector */}
      <div className={styles.field}>
        <label
          htmlFor={scheduleId}
          className={clsx(
            styles.fieldLabelWithIcon,
            disabled && styles.disabled
          )}
        >
          <ScheduleIcon className={styles.fieldIcon} />
          <span>Auto Snapshot Schedule</span>
        </label>
        <div className={styles.selectWrapper}>
          <select
            id={scheduleId}
            value={value.scheduleInterval}
            onChange={handleScheduleChange}
            disabled={disabled}
            className={clsx(styles.select, disabled && styles.disabled)}
          >
            {SNAPSHOT_SCHEDULE_OPTIONS.map((option) => (
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
        <p className={styles.fieldHelp}>
          Automatically capture snapshots at regular intervals
        </p>
      </div>

      {/* Auto-delete toggle */}
      <div className={styles.toggleRow}>
        <div className={styles.toggleContent}>
          <label
            htmlFor={autoDeleteId}
            className={clsx(styles.toggleLabel, disabled && styles.disabled)}
          >
            Auto-delete oldest
          </label>
          <p className={styles.toggleDescription}>
            Delete oldest snapshot when max is reached
          </p>
        </div>
        <button
          id={autoDeleteId}
          type="button"
          role="switch"
          aria-checked={value.autoDeleteOldest}
          onClick={handleAutoDeleteChange}
          disabled={disabled}
          className={clsx(
            styles.toggle,
            value.autoDeleteOldest && styles.toggleEnabled
          )}
        >
          <span
            className={clsx(
              styles.toggleThumb,
              value.autoDeleteOldest && styles.toggleThumbEnabled
            )}
          />
        </button>
      </div>
    </div>
  );
}

SnapshotSettings.displayName = "SnapshotSettings";
