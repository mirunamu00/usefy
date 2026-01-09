export { cn } from "./cn";
export {
  isBrowser,
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  safeGetJSON,
  safeSetJSON,
} from "./storage";
export {
  isSSR,
  isDevelopment,
  isProduction,
  getShouldRender,
  getShouldActivate,
} from "./environment";
export {
  generateMemoryReport,
  downloadReport,
  canGenerateReport,
  calculateStatistics,
  identifyLeakPatterns,
  assessMemoryHealth,
  MIN_SNAPSHOTS_FOR_REPORT,
  RECOMMENDED_SNAPSHOTS,
} from "./reportGenerator";
export type {
  ReportConfig,
  StatsSummary,
  OutlierInfo,
  ReportStatistics,
  LeakPattern,
  LeakPatternReport,
  HealthGrade,
  MemoryHealthAssessment,
} from "./reportGenerator";
