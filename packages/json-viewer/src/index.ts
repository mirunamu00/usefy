/**
 * `@usefy/json-viewer` — the React entry.
 *
 * This bundle carries the `"use client"` banner (applied per entry at build
 * time, never globally — SPEC.md decision #1). For the framework-free engine,
 * import `@usefy/json-viewer/headless` instead; that one is safe in a React
 * Server Component, a worker, or plain Node.
 */

export { JsonViewer } from "./JsonViewer";
export type { JsonViewerProps, JsonViewerController } from "./JsonViewer";
export { useJsonTree } from "./useJsonTree";
export type { UseJsonTreeOptions, UseJsonTreeReturn } from "./useJsonTree";
export {
  useRowWindow,
  computeWindow,
  probeMaxElementHeight,
  DEFAULT_OVERSCAN,
  ESTIMATED_VIEWPORT,
} from "./useRowWindow";
export type { RowWindow, UseRowWindowOptions, UseRowWindowReturn } from "./useRowWindow";

export * from "./headless";
