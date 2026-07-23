/** Cross-component signal for starting the landing tour without coupling
 * every trigger to the SpotlightTour chunk. */
export const TOUR_START_EVENT = "usefy:start-tour";

export function startSiteTour() {
  window.dispatchEvent(new CustomEvent(TOUR_START_EVENT));
}
