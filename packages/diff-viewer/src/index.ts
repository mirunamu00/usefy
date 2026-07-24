/**
 * `@usefy/diff-viewer` — the main entry point.
 *
 * Exports the React layer *and* re-exports the entire framework-free surface
 * of `@usefy/diff-viewer/headless`, so a consumer can import the component
 * and the model from one place:
 *
 * @example
 * ```tsx
 * import { DiffViewer, computeDiff } from "@usefy/diff-viewer";
 * import "@usefy/diff-viewer/styles.css";
 *
 * <DiffViewer oldText={before} newText={after} view="split" />
 * ```
 *
 * Consumers who only want the engine (a Node script, a Web Worker, a
 * non-React app) should import `@usefy/diff-viewer/headless` instead — that
 * entry is guaranteed to pull in no React and no CSS.
 */

// React layer
export { DiffViewer } from "./DiffViewer";
export type { DiffViewerClassNames, DiffViewerLabels, DiffViewerProps } from "./DiffViewer";
export type { RenderContent } from "./components/Row";

// Pure view models (SPEC §4.3) — shared by both views, usable on their own
export { alignRows, toSplitRows, toUnifiedRows } from "./view/rows";
export type { SplitRow } from "./view/rows";

// The whole headless surface
export * from "./headless";
