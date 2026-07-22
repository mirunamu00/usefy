// "./headless" — the hook, the pure positioning engine, and all public types.
// No styles, no CSS side effects.

export { useSpotlightTour, resetTour } from "./useSpotlightTour";

export {
  getSpotlightRect,
  computeTooltipPosition,
  resolveTarget,
  type ComputeTooltipPositionInput,
  type TooltipPosition,
  type ResolvedPlacement,
} from "./engine";

export { useTargetRect } from "./hooks/useTargetRect";

export type {
  UseSpotlightTourOptions,
  UseSpotlightTourReturn,
  SpotlightGeometry,
  TourStep,
  TourTarget,
  TourPlacement,
  MissingTargetPolicy,
  Rect,
} from "./types";
