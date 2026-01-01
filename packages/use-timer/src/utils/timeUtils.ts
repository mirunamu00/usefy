/**
 * Supported time units for utility functions
 */
export type TimeUnit = "ms" | "seconds" | "minutes" | "hours";

/**
 * Millisecond multipliers for each time unit
 */
const MS_MULTIPLIERS: Record<TimeUnit, number> = {
  ms: 1,
  seconds: 1000,
  minutes: 60 * 1000,
  hours: 60 * 60 * 1000,
};

/**
 * Convert a time value to milliseconds
 * @param time - The time value to convert
 * @param unit - The unit of the time value
 * @returns Time in milliseconds (minimum 0)
 */
export function toMs(time: number, unit: TimeUnit): number {
  return Math.max(0, Math.floor(time * MS_MULTIPLIERS[unit]));
}

/**
 * Convert milliseconds to a specific time unit
 * @param ms - Time in milliseconds
 * @param unit - Target time unit
 * @returns Time in the specified unit
 */
export function fromMs(ms: number, unit: TimeUnit): number {
  return ms / MS_MULTIPLIERS[unit];
}

/**
 * Decomposed time object
 */
export interface DecomposedTime {
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}

/**
 * Decompose milliseconds into hours, minutes, seconds, and milliseconds
 * @param ms - Time in milliseconds
 * @returns Decomposed time object
 */
export function decompose(ms: number): DecomposedTime {
  const safeMs = Math.max(0, ms);

  // Use floor for consistent calculation across all components
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  // Milliseconds are the fractional part
  const milliseconds = Math.floor(safeMs % 1000);

  return { hours, minutes, seconds, milliseconds };
}
