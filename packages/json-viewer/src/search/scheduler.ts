/**
 * Yielding primitives for the chunked scan (SPEC.md §4.4).
 *
 * Searching 4.5 M nodes takes about a second of pure work. Doing it in one go
 * blocks input, animation and paint for that whole second; doing it in slices
 * costs a few percent more total work and keeps the tab alive. These two
 * helpers are what makes the difference, and they are module-level functions
 * precisely so the tests can stub them.
 */

/** Monotonic-ish clock, with a fallback for environments without `performance`. */
export function now(): number {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

interface SchedulerLike {
  postTask?: (
    callback: () => void,
    options?: { priority?: string },
  ) => Promise<unknown>;
}

/**
 * Hand control back to the browser, then resume.
 *
 * The ladder is deliberate: `scheduler.postTask` at background priority is the
 * only one that lets the browser run input and rendering *first* and come back
 * when it is genuinely idle; `requestIdleCallback` is the older approximation;
 * `setTimeout(0)` is the floor that exists everywhere, including Node and
 * jsdom. Resolution is per call rather than cached at module load so a test
 * can stub any rung.
 */
export function scheduleYield(): Promise<void> {
  const scheduler = (globalThis as { scheduler?: SchedulerLike }).scheduler;
  if (scheduler && typeof scheduler.postTask === "function") {
    return scheduler
      .postTask(() => undefined, { priority: "background" })
      .then(() => undefined)
      // A postTask promise rejects if the task is aborted; falling through to
      // resolved keeps the scan alive rather than failing the whole search.
      .catch(() => undefined);
  }

  const idle = (globalThis as { requestIdleCallback?: (cb: () => void) => number })
    .requestIdleCallback;
  if (typeof idle === "function") {
    return new Promise((resolve) => idle(() => resolve()));
  }

  return new Promise((resolve) => setTimeout(resolve, 0));
}
