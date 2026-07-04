/**
 * Options for {@link useScrollLock}.
 */
export interface UseScrollLockOptions {
  /**
   * When `true`, this hook instance holds a scroll lock automatically for as
   * long as the value stays `true` — it locks on mount (or when the value flips
   * to `true`) and releases on unmount (or when it flips back to `false`).
   *
   * This is a convenience for the common "lock while the modal/drawer is open"
   * case. Leave it out (or pass `false`) to control locking imperatively via the
   * returned `lock()` / `unlock()`.
   *
   * When you use `enabled`, let it own the lock — don't also call `lock()` /
   * `unlock()` on the same instance, or the two owners will fight over the
   * shared lock counter.
   *
   * @default false
   */
  enabled?: boolean;
}

/**
 * Return value of {@link useScrollLock}.
 */
export interface UseScrollLockReturn {
  /**
   * Acquire a scroll lock for this hook instance. Idempotent — calling it again
   * while this instance already holds a lock is a no-op (it never double-counts
   * against the shared lock counter).
   */
  lock: () => void;

  /**
   * Release this instance's scroll lock. Idempotent — a no-op if this instance
   * does not currently hold a lock. The body is only restored once the **last**
   * outstanding lock (across all hook instances) is released.
   */
  unlock: () => void;

  /**
   * Whether **this** hook instance currently holds a lock. Note that the body
   * may still be locked by another instance even after this one unlocks; this
   * flag only reflects the current instance.
   */
  isLocked: boolean;
}
