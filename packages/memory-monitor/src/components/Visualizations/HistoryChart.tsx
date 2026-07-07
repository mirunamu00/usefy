import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import clsx from "clsx";
import { CHART_COLORS, SEVERITY_COLORS, formatTime } from "../../constants";
import type { MemoryInfo } from "../../types";
import styles from "./HistoryChart.module.scss";

export interface HistoryChartProps {
  /** Memory history data */
  history: MemoryInfo[];
  /** Warning threshold percentage */
  warningThreshold?: number;
  /** Critical threshold percentage */
  criticalThreshold?: number;
  /** Heap limit for percentage calculation */
  heapLimit?: number | null;
  /** Show threshold reference lines */
  showThresholds?: boolean;
  /** Height of the chart */
  height?: number;
  /** Custom class name */
  className?: string;
}

interface ChartDataPoint {
  time: string;
  timestamp: number;
  heapUsedMB: number;
  heapTotalMB: number;
  usagePercent: number;
}

/**
 * Area chart showing memory history over time
 */
export function HistoryChart({
  history,
  warningThreshold = 70,
  criticalThreshold = 90,
  heapLimit,
  showThresholds = true,
  height = 200,
  className,
}: HistoryChartProps) {
  // Transform data for chart
  const chartData = useMemo((): ChartDataPoint[] => {
    return history.map((item) => ({
      time: formatTime(item.timestamp),
      timestamp: item.timestamp,
      heapUsedMB: Math.round((item.heapUsed || 0) / 1024 / 1024),
      heapTotalMB: Math.round((item.heapTotal || 0) / 1024 / 1024),
      usagePercent: heapLimit && item.heapUsed
        ? (item.heapUsed / heapLimit) * 100
        : 0,
    }));
  }, [history, heapLimit]);

  // Calculate Y-axis domain
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100];
    const maxValue = Math.max(
      ...chartData.map((d) => d.heapUsedMB),
      ...chartData.map((d) => d.heapTotalMB)
    );
    return [0, Math.ceil(maxValue * 1.1)];
  }, [chartData]);

  // Threshold lines in MB (if heapLimit is available)
  const warningLineMB = heapLimit
    ? Math.round((heapLimit * warningThreshold) / 100 / 1024 / 1024)
    : null;
  const criticalLineMB = heapLimit
    ? Math.round((heapLimit * criticalThreshold) / 100 / 1024 / 1024)
    : null;

  if (chartData.length === 0) {
    return (
      <div
        className={clsx(styles.emptyState, className)}
        style={{ height }}
      >
        Collecting data...
      </div>
    );
  }

  return (
    <div className={clsx(styles.container, className)}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="heapUsedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8} />
              <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="heapTotalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.4} />
              <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={{ stroke: "#e5e7eb" }}
            interval="preserveStartEnd"
          />

          <YAxis
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={{ stroke: "#e5e7eb" }}
            tickFormatter={(value: number) => `${value}MB`}
            domain={yDomain}
            width={50}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
              fontSize: "12px",
            }}
            formatter={(value: number, name: string) => {
              const label = name === "Used" ? "Used" : "Allocated";
              return [`${value} MB`, label];
            }}
            labelFormatter={(label: string) => `Time: ${label}`}
          />

          {/* Threshold reference lines */}
          {showThresholds && warningLineMB && warningLineMB < yDomain[1] && (
            <ReferenceLine
              y={warningLineMB}
              stroke={SEVERITY_COLORS.warning.accent}
              strokeDasharray="5 5"
              strokeOpacity={0.7}
            />
          )}
          {showThresholds && criticalLineMB && criticalLineMB < yDomain[1] && (
            <ReferenceLine
              y={criticalLineMB}
              stroke={SEVERITY_COLORS.critical.accent}
              strokeDasharray="5 5"
              strokeOpacity={0.7}
            />
          )}

          {/* Total heap area (behind) */}
          <Area
            type="monotone"
            dataKey="heapTotalMB"
            stroke={CHART_COLORS.secondary}
            strokeOpacity={0.5}
            fillOpacity={1}
            fill="url(#heapTotalGradient)"
            name="Total"
          />

          {/* Used heap area (front) */}
          <Area
            type="monotone"
            dataKey="heapUsedMB"
            stroke={CHART_COLORS.primary}
            fillOpacity={1}
            fill="url(#heapUsedGradient)"
            name="Used"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

HistoryChart.displayName = "HistoryChart";
