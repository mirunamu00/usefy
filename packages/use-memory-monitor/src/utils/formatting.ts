import { BYTE_UNITS, BYTES_PER_UNIT } from "../constants";
import type { FormattedMemory, MemoryInfo } from "../types";

/**
 * Format bytes to human-readable string (e.g., "45.2 MB")
 *
 * @param bytes - Number of bytes to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with unit
 */
export function formatBytes(bytes: number | null | undefined, decimals: number = 2): string {
  if (bytes === null || bytes === undefined) {
    return "N/A";
  }

  if (bytes === 0) {
    return "0 B";
  }

  if (bytes < 0) {
    return `-${formatBytes(Math.abs(bytes), decimals)}`;
  }

  const unitIndex = Math.max(
    0,
    Math.min(
      Math.floor(Math.log(bytes) / Math.log(BYTES_PER_UNIT)),
      BYTE_UNITS.length - 1
    )
  );

  const value = bytes / Math.pow(BYTES_PER_UNIT, unitIndex);
  const unit = BYTE_UNITS[unitIndex];

  // Remove unnecessary trailing zeros
  const formatted = value.toFixed(decimals);
  const trimmed = parseFloat(formatted).toString();

  return `${trimmed} ${unit}`;
}

/**
 * Format a percentage value
 *
 * @param percentage - Percentage value (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export function formatPercentage(
  percentage: number | null | undefined,
  decimals: number = 1
): string {
  if (percentage === null || percentage === undefined) {
    return "N/A";
  }

  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Format a number with thousand separators
 *
 * @param value - Number to format
 * @returns Formatted string with thousand separators
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "N/A";
  }

  return value.toLocaleString();
}

/**
 * Create formatted memory object for display
 *
 * @param memory - Memory info object
 * @param domNodes - DOM node count (optional)
 * @param eventListeners - Event listener count (optional)
 * @returns FormattedMemory object with human-readable strings
 */
export function createFormattedMemory(
  memory: MemoryInfo | null,
  domNodes?: number | null,
  eventListeners?: number | null
): FormattedMemory {
  return {
    heapUsed: formatBytes(memory?.heapUsed),
    heapTotal: formatBytes(memory?.heapTotal),
    heapLimit: formatBytes(memory?.heapLimit),
    domNodes: domNodes != null ? formatNumber(domNodes) : undefined,
    eventListeners: eventListeners != null ? formatNumber(eventListeners) : undefined,
  };
}

/**
 * Calculate usage percentage from memory info
 *
 * @param heapUsed - Used heap size in bytes
 * @param heapLimit - Heap limit in bytes
 * @returns Usage percentage (0-100) or null if invalid
 */
export function calculateUsagePercentage(
  heapUsed: number | null | undefined,
  heapLimit: number | null | undefined
): number | null {
  if (heapUsed == null || heapLimit == null || heapLimit <= 0) {
    return null;
  }

  const percentage = (heapUsed / heapLimit) * 100;
  return Math.min(100, Math.max(0, percentage));
}

/**
 * Format time duration in milliseconds to human-readable string
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }

  if (ms < 3600000) {
    return `${(ms / 60000).toFixed(1)}m`;
  }

  return `${(ms / 3600000).toFixed(1)}h`;
}
