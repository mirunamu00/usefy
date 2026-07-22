// "." — the styled SpotlightTour component plus everything from "./headless".
// Importing this entry injects the component CSS at runtime (build-time
// injection, virtual-keyboard parity); "./headless" stays style-free.

export { SpotlightTour, type SpotlightTourProps } from "./SpotlightTour";
export {
  SpotlightBeacon,
  type SpotlightBeaconProps,
} from "./components/Beacon/Beacon";
export type {
  TourController,
  TourLabels,
  SpotlightTourClassNames,
  RenderStepContext,
} from "./types";

export * from "./headless";
