import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIsomorphicLayoutEffect } from "@usefy/use-isomorphic-layout-effect";
import { lockBodyScroll, unlockBodyScroll } from "./scrollLockManager";
import type { UseScrollLockOptions, UseScrollLockReturn } from "./types";

/**
 * Lock and unlock the page (`document.body`) scroll — the reliable way to keep
 * the background from scrolling behind a modal, drawer, or menu.
 *
 * Locking sets `overflow: hidden` on the body and adds `padding-right` equal to
 * the scrollbar width so the content never jumps sideways when the scrollbar
 * disappears. On iOS/Safari — where `overflow: hidden` does not stop touch
 * scrolling — it instead pins the body with `position: fixed` and restores the
 * scroll position with `window.scrollTo` on unlock.
 *
 * Behaviour notes:
 * - **Nested / reference-counted**: a single module-level counter is shared by
 *   every `useScrollLock` instance, so N stacked locks apply the body styles
 *   once and only restore the body when the **last** lock is released. The
 *   original inline body styles (and scroll position) are captured on `0 → 1`
 *   and written back exactly on `1 → 0`.
 * - **Idempotent per instance**: calling `lock()` twice on the same instance
 *   (or `unlock()` when it isn't locked) is a no-op, so an instance can never
 *   double-count against the shared counter.
 * - **StrictMode / concurrent-safe**: an unmount always releases any lock this
 *   instance still holds, so React 18's double mount→unmount→mount never leaks
 *   a lock or leaves the body stuck.
 * - **SSR-safe**: no `window`/`document` access on the server — `isLocked` is
 *   `false` and `lock`/`unlock` are no-ops until it runs on the client.
 *
 * @param options - Optional `enabled` flag to lock automatically for as long as
 *   it is `true` (locks on mount, releases on unmount). Omit it to lock
 *   imperatively via the returned `lock` / `unlock`.
 * @returns `{ lock, unlock, isLocked }` — stable `lock`/`unlock` callbacks and a
 *   boolean reflecting whether **this** instance currently holds a lock.
 *
 * @example
 * ```tsx
 * // Imperative — lock while a modal is open.
 * import { useScrollLock } from "@usefy/use-scroll-lock";
 *
 * function Modal({ open, onClose }: { open: boolean; onClose: () => void }) {
 *   const { lock, unlock } = useScrollLock();
 *
 *   useEffect(() => {
 *     if (open) lock();
 *     else unlock();
 *   }, [open, lock, unlock]);
 *
 *   if (!open) return null;
 *   return <div role="dialog">…</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Declarative — let `enabled` own the lock for the drawer's lifetime.
 * import { useScrollLock } from "@usefy/use-scroll-lock";
 *
 * function Drawer({ open }: { open: boolean }) {
 *   useScrollLock({ enabled: open });
 *   return open ? <aside>…</aside> : null;
 * }
 * ```
 */
export function useScrollLock(
  options: UseScrollLockOptions = {}
): UseScrollLockReturn {
  const { enabled = false } = options;

  const [isLocked, setIsLocked] = useState(false);
  // Mirror of `isLocked` that updates synchronously and survives into cleanup,
  // so idempotency checks and the unmount safety net don't depend on a stale
  // render's state.
  const lockedRef = useRef(false);

  const lock = useCallback(() => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    lockBodyScroll();
    setIsLocked(true);
  }, []);

  const unlock = useCallback(() => {
    if (!lockedRef.current) return;
    lockedRef.current = false;
    unlockBodyScroll();
    setIsLocked(false);
  }, []);

  // `enabled` convenience: hold a lock for as long as it is true. A layout
  // effect so the lock lands before paint. `lock`/`unlock` are stable, so this
  // only re-runs when `enabled` itself changes.
  useIsomorphicLayoutEffect(() => {
    if (!enabled) return;
    lock();
    return () => {
      unlock();
    };
  }, [enabled, lock, unlock]);

  // Unmount safety net: if this instance is still holding a lock (e.g. an
  // imperative `lock()` that was never paired with `unlock()`), release it so
  // the shared counter and the body can't leak. Decrement directly rather than
  // calling `unlock()` to avoid a needless state update on an unmounting tree.
  useEffect(() => {
    return () => {
      if (lockedRef.current) {
        lockedRef.current = false;
        unlockBodyScroll();
      }
    };
  }, []);

  return useMemo<UseScrollLockReturn>(
    () => ({ lock, unlock, isLocked }),
    [lock, unlock, isLocked]
  );
}
