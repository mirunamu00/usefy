export { useScrollLock } from "./useScrollLock";
export type { UseScrollLockOptions, UseScrollLockReturn } from "./types";
// Public helpers: the platform/environment checks callers may want when
// replicating the body-lock behavior. The module-level lock manager
// (lockBodyScroll / unlockBodyScroll / resetScrollLockState) stays internal —
// its shared mutable state should only ever be driven through the hook.
export { isIOS, getScrollbarWidth } from "./utils";
