import { StrictMode } from "react";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useScrollLock } from "./useScrollLock";
import {
  getScrollLockCount,
  resetScrollLockState,
} from "./scrollLockManager";

beforeEach(() => {
  resetScrollLockState();
  document.body.style.cssText = "";
});

describe("useScrollLock — imperative", () => {
  it("is unlocked with stable callbacks initially", () => {
    const { result, rerender } = renderHook(() => useScrollLock());

    expect(result.current.isLocked).toBe(false);
    expect(getScrollLockCount()).toBe(0);
    expect(document.body.style.overflow).toBe("");

    const first = result.current;
    rerender();
    expect(result.current.lock).toBe(first.lock);
    expect(result.current.unlock).toBe(first.unlock);
  });

  it("locks and unlocks the body imperatively", () => {
    const { result } = renderHook(() => useScrollLock());

    act(() => result.current.lock());
    expect(result.current.isLocked).toBe(true);
    expect(getScrollLockCount()).toBe(1);
    expect(document.body.style.overflow).toBe("hidden");

    act(() => result.current.unlock());
    expect(result.current.isLocked).toBe(false);
    expect(getScrollLockCount()).toBe(0);
    expect(document.body.style.overflow).toBe("");
  });

  it("is idempotent — locking twice on one instance counts once", () => {
    const { result } = renderHook(() => useScrollLock());

    act(() => {
      result.current.lock();
      result.current.lock();
    });
    expect(getScrollLockCount()).toBe(1);

    // A single unlock fully releases it.
    act(() => result.current.unlock());
    expect(getScrollLockCount()).toBe(0);
    expect(document.body.style.overflow).toBe("");
  });

  it("ignores unlock when this instance is not locked", () => {
    const { result } = renderHook(() => useScrollLock());

    act(() => result.current.unlock());
    expect(result.current.isLocked).toBe(false);
    expect(getScrollLockCount()).toBe(0);
  });
});

describe("useScrollLock — nested locks across instances", () => {
  it("keeps the body locked until the last instance unlocks", () => {
    const a = renderHook(() => useScrollLock());
    const b = renderHook(() => useScrollLock());

    act(() => a.result.current.lock());
    act(() => b.result.current.lock());

    expect(getScrollLockCount()).toBe(2);
    expect(document.body.style.overflow).toBe("hidden");
    expect(a.result.current.isLocked).toBe(true);
    expect(b.result.current.isLocked).toBe(true);

    // Releasing one leaves the body locked by the other.
    act(() => a.result.current.unlock());
    expect(getScrollLockCount()).toBe(1);
    expect(document.body.style.overflow).toBe("hidden");
    expect(a.result.current.isLocked).toBe(false);
    expect(b.result.current.isLocked).toBe(true);

    // The last release restores the body.
    act(() => b.result.current.unlock());
    expect(getScrollLockCount()).toBe(0);
    expect(document.body.style.overflow).toBe("");
  });

  it("reflects the per-instance lock state, not the global one", () => {
    const a = renderHook(() => useScrollLock());
    const b = renderHook(() => useScrollLock());

    act(() => a.result.current.lock());

    // The body is locked, but instance B never acquired a lock.
    expect(document.body.style.overflow).toBe("hidden");
    expect(a.result.current.isLocked).toBe(true);
    expect(b.result.current.isLocked).toBe(false);
  });
});

describe("useScrollLock — unmount cleanup", () => {
  it("releases a held lock on unmount", () => {
    const { result, unmount } = renderHook(() => useScrollLock());

    act(() => result.current.lock());
    expect(getScrollLockCount()).toBe(1);

    unmount();
    expect(getScrollLockCount()).toBe(0);
    expect(document.body.style.overflow).toBe("");
  });

  it("does nothing on unmount when no lock was held", () => {
    const { unmount } = renderHook(() => useScrollLock());
    unmount();
    expect(getScrollLockCount()).toBe(0);
  });

  it("restores the body when one of two mounted instances unmounts last", () => {
    const a = renderHook(() => useScrollLock());
    const b = renderHook(() => useScrollLock());

    act(() => a.result.current.lock());
    act(() => b.result.current.lock());
    expect(getScrollLockCount()).toBe(2);

    a.unmount();
    expect(getScrollLockCount()).toBe(1);
    expect(document.body.style.overflow).toBe("hidden");

    b.unmount();
    expect(getScrollLockCount()).toBe(0);
    expect(document.body.style.overflow).toBe("");
  });
});

describe("useScrollLock — enabled option", () => {
  it("locks on mount and unlocks on unmount when enabled", () => {
    const { result, unmount } = renderHook(() =>
      useScrollLock({ enabled: true })
    );

    expect(result.current.isLocked).toBe(true);
    expect(getScrollLockCount()).toBe(1);
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(getScrollLockCount()).toBe(0);
    expect(document.body.style.overflow).toBe("");
  });

  it("toggles the lock as `enabled` flips", () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useScrollLock({ enabled }),
      { initialProps: { enabled: false } }
    );

    expect(result.current.isLocked).toBe(false);
    expect(getScrollLockCount()).toBe(0);

    rerender({ enabled: true });
    expect(result.current.isLocked).toBe(true);
    expect(getScrollLockCount()).toBe(1);

    rerender({ enabled: false });
    expect(result.current.isLocked).toBe(false);
    expect(getScrollLockCount()).toBe(0);
    expect(document.body.style.overflow).toBe("");
  });
});

describe("useScrollLock — StrictMode safety", () => {
  it("does not leak a lock across StrictMode double-mount (enabled)", () => {
    const { unmount } = renderHook(() => useScrollLock({ enabled: true }), {
      wrapper: StrictMode,
    });

    // Double invoke of effects must net to a single lock.
    expect(getScrollLockCount()).toBe(1);
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(getScrollLockCount()).toBe(0);
    expect(document.body.style.overflow).toBe("");
  });

  it("does not double-count an imperative lock under StrictMode", () => {
    const { result, unmount } = renderHook(() => useScrollLock(), {
      wrapper: StrictMode,
    });

    act(() => result.current.lock());
    expect(getScrollLockCount()).toBe(1);

    unmount();
    expect(getScrollLockCount()).toBe(0);
  });
});
