export { useMeasure } from "./useMeasure";
export type { Bounds, UseMeasureRef, UseMeasureReturn } from "./types";
// `EMPTY_BOUNDS` is the public SSR/initial sentinel; `rectToBounds` and
// `areBoundsEqual` stay internal (imported directly from ./utils) — they are
// implementation details, so the package's public surface matches the
// @usefy/hooks umbrella re-export exactly.
export { EMPTY_BOUNDS } from "./utils";
