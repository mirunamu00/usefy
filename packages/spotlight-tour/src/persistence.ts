/**
 * Guarded localStorage helpers for `tourId` persistence.
 *
 * Deliberately plain functions rather than `@usefy/use-local-storage`: the
 * tour writes imperatively on finish/skip events and reads once per
 * open-attempt — there is no reactive state to subscribe to, and cross-tab
 * sync is explicitly out of scope. All access is try/catch-guarded (privacy
 * mode, disabled storage, SSR) and silently no-ops on failure.
 */

/** localStorage key prefix for persisted tours (`usefy-tour:<tourId>`). */
export const TOUR_STORAGE_PREFIX = "usefy-tour:";

/**
 * The versioned value stored under `usefy-tour:<tourId>` when a tour is
 * finished or skipped. `v` allows future formats to migrate.
 */
export interface PersistedTourState {
  /** Format version. */
  v: 1;
  /** How the tour ended. */
  status: "finished" | "skipped";
  /** ISO timestamp of when it ended. */
  at: string;
}

/**
 * Whether a completion flag exists for `tourId` — the check that suppresses
 * *automatic* opens (`defaultOpen`).
 *
 * Presence-based on purpose: the key is only ever written on finish/skip, so
 * any value there (including a corrupt or legacy-format one) means "this user
 * already completed/dismissed the tour" — re-showing the tour because a value
 * failed to parse would be the worse failure mode. `resetTour` removes the
 * key regardless of its shape.
 */
export function isTourDone(tourId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(TOUR_STORAGE_PREFIX + tourId) !== null;
  } catch {
    return false;
  }
}

/**
 * Read the persisted state for `tourId`, or `null` when absent or not in a
 * known format (corrupt/legacy values are tolerated — see {@link isTourDone}
 * for why they still count as "done").
 */
export function readTourState(tourId: string): PersistedTourState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TOUR_STORAGE_PREFIX + tourId);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      (parsed as { v?: unknown }).v === 1 &&
      ((parsed as { status?: unknown }).status === "finished" ||
        (parsed as { status?: unknown }).status === "skipped")
    ) {
      return parsed as PersistedTourState;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Persist that `tourId` ended with `status`. Silently no-ops when storage is
 * unavailable.
 */
export function writeTourState(
  tourId: string,
  status: PersistedTourState["status"]
): void {
  if (typeof window === "undefined") return;
  try {
    const state: PersistedTourState = {
      v: 1,
      status,
      at: new Date().toISOString(),
    };
    window.localStorage.setItem(
      TOUR_STORAGE_PREFIX + tourId,
      JSON.stringify(state)
    );
  } catch {
    // Storage can throw (quota, privacy mode) — the tour still closes.
  }
}
