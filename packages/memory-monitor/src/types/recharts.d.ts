/**
 * Recharts type overrides for React 19 compatibility
 *
 * Recharts (2.x) is not yet fully compatible with React 19's stricter JSX types.
 * This declaration file provides type overrides to suppress the compatibility errors.
 *
 * See: https://github.com/recharts/recharts/issues/3615
 */

import type { ComponentType } from "react";

declare module "recharts" {
  // Re-export with any props to bypass React 19 JSX type checks
  export const ResponsiveContainer: ComponentType<any>;
  export const AreaChart: ComponentType<any>;
  export const Area: ComponentType<any>;
  export const XAxis: ComponentType<any>;
  export const YAxis: ComponentType<any>;
  export const CartesianGrid: ComponentType<any>;
  export const Tooltip: ComponentType<any>;
  export const ReferenceLine: ComponentType<any>;
  export const RadialBarChart: ComponentType<any>;
  export const RadialBar: ComponentType<any>;
  export const PolarAngleAxis: ComponentType<any>;
}
