import { getScrollbarWidth, isBrowser, isIOS } from "./utils";

/**
 * The subset of inline `document.body` styles this manager mutates while a lock
 * is active. Saved verbatim when the first lock is acquired and written back
 * exactly when the last lock is released, so any pre-existing inline styles the
 * app had set are preserved.
 */
interface SavedBodyStyles {
  overflow: string;
  paddingRight: string;
  position: string;
  top: string;
  left: string;
  right: string;
  width: string;
}

// ---------------------------------------------------------------------------
// Module-level state — shared across every useScrollLock instance in the app.
// This is what makes nested locks (e.g. two stacked modals) collapse into a
// single set of body styles, applied once and restored only when the count
// returns to zero.
// ---------------------------------------------------------------------------

let lockCount = 0;
let savedStyles: SavedBodyStyles | null = null;
let savedScrollX = 0;
let savedScrollY = 0;
let appliedIOSFix = false;

/**
 * Save the current scroll position + inline body styles and apply the styles
 * that prevent the body from scrolling. Called once, when the lock counter goes
 * from 0 → 1.
 */
function applyBodyLock(): void {
  if (!isBrowser()) return;

  const body = document.body;

  savedScrollX = window.scrollX;
  savedScrollY = window.scrollY;
  savedStyles = {
    overflow: body.style.overflow,
    paddingRight: body.style.paddingRight,
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
  };

  appliedIOSFix = isIOS();

  if (appliedIOSFix) {
    // On iOS/Safari `overflow: hidden` does not stop touch scrolling, so pin the
    // body in place with `position: fixed` offset by the current scroll. The
    // offset is undone (and the scroll restored) in restoreBodyLock().
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${savedScrollY}px`;
    body.style.left = `-${savedScrollX}px`;
    body.style.right = "0";
    body.style.width = "100%";
  } else {
    // Everywhere else `overflow: hidden` is enough. Compensate for the vanished
    // scrollbar with matching padding so the content doesn't jump sideways.
    const scrollbarWidth = getScrollbarWidth();
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }
}

/**
 * Restore the saved inline body styles (and, on iOS, the scroll position).
 * Called once, when the lock counter goes from 1 → 0.
 */
function restoreBodyLock(): void {
  if (!isBrowser()) return;

  const body = document.body;

  if (savedStyles) {
    body.style.overflow = savedStyles.overflow;
    body.style.paddingRight = savedStyles.paddingRight;
    body.style.position = savedStyles.position;
    body.style.top = savedStyles.top;
    body.style.left = savedStyles.left;
    body.style.right = savedStyles.right;
    body.style.width = savedStyles.width;
    savedStyles = null;
  }

  if (appliedIOSFix) {
    // Undo the `position: fixed` jump by scrolling back to where we were.
    window.scrollTo(savedScrollX, savedScrollY);
    appliedIOSFix = false;
  }
}

/**
 * Increment the shared lock counter, applying the body-lock styles the first
 * time the count leaves zero.
 */
export function lockBodyScroll(): void {
  if (lockCount === 0) {
    applyBodyLock();
  }
  lockCount += 1;
}

/**
 * Decrement the shared lock counter, restoring the body once the last lock is
 * released. Guards against dropping below zero so a stray unlock can never
 * corrupt the counter.
 */
export function unlockBodyScroll(): void {
  if (lockCount === 0) return;
  lockCount -= 1;
  if (lockCount === 0) {
    restoreBodyLock();
  }
}

/**
 * The number of outstanding locks across all hook instances. Exposed for tests;
 * intentionally **not** re-exported from the package's public entry point.
 */
export function getScrollLockCount(): number {
  return lockCount;
}

/**
 * Reset all module-level lock state. Test-only escape hatch — intentionally
 * **not** re-exported from the package's public entry point.
 */
export function resetScrollLockState(): void {
  lockCount = 0;
  savedStyles = null;
  savedScrollX = 0;
  savedScrollY = 0;
  appliedIOSFix = false;
}
