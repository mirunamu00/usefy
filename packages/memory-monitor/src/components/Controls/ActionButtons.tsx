import React, { useCallback, useState } from "react";
import clsx from "clsx";
import styles from "./ActionButtons.module.scss";

export interface ActionButtonsProps {
  /** Request garbage collection callback */
  onRequestGC: () => void;
  /** Take snapshot callback */
  onTakeSnapshot?: () => void;
  /** Export data callback */
  onExport?: () => void;
  /** Reset history callback */
  onResetHistory?: () => void;
  /** Whether GC is supported */
  gcSupported?: boolean;
  /** Whether snapshot feature is enabled */
  snapshotEnabled?: boolean;
  /** Whether export feature is enabled */
  exportEnabled?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Trash/GC icon
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
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

/**
 * Camera/Snapshot icon
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
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

/**
 * Download/Export icon
 */
function DownloadIcon({ className }: { className?: string }) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

/**
 * Refresh/Reset icon
 */
function RefreshIcon({ className }: { className?: string }) {
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
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

/**
 * Check icon for success state
 */
function CheckIcon({ className }: { className?: string }) {
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
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * Action button component
 */
interface ActionButtonProps {
  icon: React.FC<{ className?: string }>;
  label: string;
  onClick: () => void;
  variant?: "default" | "primary" | "danger";
  disabled?: boolean;
  showSuccessState?: boolean;
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  variant = "default",
  disabled = false,
  showSuccessState = false,
}: ActionButtonProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleClick = useCallback(() => {
    onClick();
    if (showSuccessState) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    }
  }, [onClick, showSuccessState]);

  const variantClassMap = {
    default: styles.variantDefault,
    primary: styles.variantPrimary,
    danger: styles.variantDanger,
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || showSuccess}
      className={clsx(
        styles.button,
        showSuccess ? styles.variantSuccess : variantClassMap[variant]
      )}
    >
      {showSuccess ? (
        <CheckIcon className={styles.icon} />
      ) : (
        <Icon className={styles.icon} />
      )}
      <span>{showSuccess ? "Done" : label}</span>
    </button>
  );
}

/**
 * Action buttons component for memory monitoring controls
 */
export function ActionButtons({
  onRequestGC,
  onTakeSnapshot,
  onExport,
  onResetHistory,
  gcSupported = true,
  snapshotEnabled = true,
  exportEnabled = true,
  className,
}: ActionButtonsProps) {
  return (
    <div className={clsx(styles.container, className)}>
      {/* Request GC */}
      <ActionButton
        icon={TrashIcon}
        label="Request GC"
        onClick={onRequestGC}
        variant="primary"
        disabled={!gcSupported}
        showSuccessState
      />

      {/* Take Snapshot */}
      {snapshotEnabled && onTakeSnapshot && (
        <ActionButton
          icon={CameraIcon}
          label="Snapshot"
          onClick={onTakeSnapshot}
          showSuccessState
        />
      )}

      {/* Export Data */}
      {exportEnabled && onExport && (
        <ActionButton
          icon={DownloadIcon}
          label="Export"
          onClick={onExport}
          showSuccessState
        />
      )}

      {/* Reset History */}
      {onResetHistory && (
        <ActionButton
          icon={RefreshIcon}
          label="Reset"
          onClick={onResetHistory}
          variant="danger"
        />
      )}
    </div>
  );
}

ActionButtons.displayName = "ActionButtons";
