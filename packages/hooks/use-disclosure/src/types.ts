/**
 * Optional lifecycle callbacks for {@link useDisclosure}.
 */
export interface UseDisclosureOptions {
  /**
   * Called when the state transitions from closed to **open** (via `open()`, or
   * `toggle()` while closed). Not called if it was already open.
   */
  onOpen?: () => void;

  /**
   * Called when the state transitions from open to **closed** (via `close()`, or
   * `toggle()` while open). Not called if it was already closed.
   */
  onClose?: () => void;
}

/**
 * The control handlers returned by {@link useDisclosure}. Each has a stable
 * identity across renders, so they are safe to pass as props or effect
 * dependencies.
 */
export interface UseDisclosureHandlers {
  /** Open (set to `true`). Fires `onOpen` only on a real closed → open change. */
  open: () => void;
  /** Close (set to `false`). Fires `onClose` only on a real open → closed change. */
  close: () => void;
  /** Flip the current state, firing the matching `onOpen` / `onClose`. */
  toggle: () => void;
}

/**
 * Return value of {@link useDisclosure}: a `[opened, handlers]` tuple.
 */
export type UseDisclosureReturn = readonly [boolean, UseDisclosureHandlers];
