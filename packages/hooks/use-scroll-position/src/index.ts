export { useScrollPosition } from "./useScrollPosition";
export type {
  ScrollPosition,
  ScrollPositionTarget,
  UseScrollPositionOptions,
  UseScrollPositionReturn,
} from "./types";
// Public sentinel: the frozen zero offset used as the initial / SSR value.
// `resolveScrollTarget`, `getScrollPosition`, `isWindow`, `isBrowser`, and
// `arePositionsEqual` stay internal — generic names that shouldn't leak into the
// @usefy/hooks umbrella.
export { ZERO_SCROLL_POSITION } from "./utils";
