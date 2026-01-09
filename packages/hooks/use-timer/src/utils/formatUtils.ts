import type { TimeFormat } from "../types";
import { decompose } from "./timeUtils";

/**
 * Pad a number with leading zeros
 * @param num - Number to pad
 * @param length - Desired string length
 * @returns Padded string
 */
function padNumber(num: number, length: number): string {
  return num.toString().padStart(length, "0");
}

/**
 * Format milliseconds into a time string
 * @param ms - Time in milliseconds
 * @param format - Desired format
 * @returns Formatted time string
 */
export function formatTime(ms: number, format: TimeFormat): string {
  const { hours, minutes, seconds, milliseconds } = decompose(Math.max(0, ms));

  switch (format) {
    case "HH:MM:SS":
      return `${padNumber(hours, 2)}:${padNumber(minutes, 2)}:${padNumber(seconds, 2)}`;

    case "MM:SS": {
      const totalMinutes = hours * 60 + minutes;
      return `${padNumber(totalMinutes, 2)}:${padNumber(seconds, 2)}`;
    }

    case "SS": {
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      return totalSeconds.toString();
    }

    case "mm:ss.SSS": {
      const totalMins = hours * 60 + minutes;
      return `${padNumber(totalMins, 2)}:${padNumber(seconds, 2)}.${padNumber(milliseconds, 3)}`;
    }

    case "HH:MM:SS.SSS":
      return `${padNumber(hours, 2)}:${padNumber(minutes, 2)}:${padNumber(seconds, 2)}.${padNumber(milliseconds, 3)}`;

    default:
      // Default to MM:SS format
      const defaultTotalMinutes = hours * 60 + minutes;
      return `${padNumber(defaultTotalMinutes, 2)}:${padNumber(seconds, 2)}`;
  }
}
