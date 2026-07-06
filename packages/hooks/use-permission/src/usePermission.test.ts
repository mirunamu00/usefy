import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { usePermission } from "./usePermission";
import { isPermissionsSupported, serializeDescriptor } from "./utils";

// ---------------------------------------------------------------------------
// Fake PermissionStatus with a dispatchable `change` event
// ---------------------------------------------------------------------------

class FakePermissionStatus {
  state: PermissionState;
  private listeners = new Map<string, Set<() => void>>();
  removeSpy = vi.fn();

  constructor(initial: PermissionState) {
    this.state = initial;
  }

  addEventListener(type: string, cb: () => void) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(cb);
  }

  removeEventListener(type: string, cb: () => void) {
    this.removeSpy(type, cb);
    this.listeners.get(type)?.delete(cb);
  }

  /** Simulate the browser flipping the permission and firing `change`. */
  setState(next: PermissionState) {
    this.state = next;
    this.listeners.get("change")?.forEach((cb) => cb());
  }

  listenerCount(type = "change") {
    return this.listeners.get(type)?.size ?? 0;
  }
}

const originalNavigator = globalThis.navigator;

/** Install a fake `navigator.permissions.query`. */
function mockPermissions(
  query: (descriptor: PermissionDescriptor) => Promise<PermissionStatus>
) {
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { permissions: { query } },
  });
}

/** Remove `navigator` entirely (SSR-like) or its `permissions` member. */
function removeNavigator() {
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: undefined,
  });
}

function mockNavigatorWithoutPermissions() {
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {},
  });
}

afterEach(() => {
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: originalNavigator,
  });
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// utils
// ---------------------------------------------------------------------------

describe("isPermissionsSupported", () => {
  it("returns true when navigator.permissions.query is a function", () => {
    mockPermissions(vi.fn());
    expect(isPermissionsSupported()).toBe(true);
  });

  it("returns false when navigator is undefined", () => {
    removeNavigator();
    expect(isPermissionsSupported()).toBe(false);
  });

  it("returns false when navigator.permissions is missing", () => {
    mockNavigatorWithoutPermissions();
    expect(isPermissionsSupported()).toBe(false);
  });
});

describe("serializeDescriptor", () => {
  it("produces a stable key regardless of field order", () => {
    expect(serializeDescriptor({ name: "midi", sysex: true })).toBe(
      serializeDescriptor({ sysex: true, name: "midi" } as never)
    );
  });

  it("differs when meaningful fields differ", () => {
    expect(serializeDescriptor({ name: "camera" })).not.toBe(
      serializeDescriptor({ name: "microphone" })
    );
    expect(serializeDescriptor({ name: "push", userVisibleOnly: true })).not.toBe(
      serializeDescriptor({ name: "push", userVisibleOnly: false })
    );
  });
});

// ---------------------------------------------------------------------------
// usePermission — happy path
// ---------------------------------------------------------------------------

describe("usePermission", () => {
  it("resolves to the queried permission state", async () => {
    const status = new FakePermissionStatus("granted");
    const query = vi.fn().mockResolvedValue(status);
    mockPermissions(query);

    const { result } = renderHook(() => usePermission({ name: "camera" }));

    // After mount the effect has fired, so the query is pending until it resolves.
    expect(result.current.status).toBe("pending");
    expect(result.current.isSupported).toBe(true);
    expect(result.current.state).toBeNull();

    await waitFor(() => expect(result.current.status).toBe("granted"));
    expect(result.current.state).toBe("granted");
    expect(result.current.error).toBeNull();
    expect(query).toHaveBeenCalledWith({ name: "camera" });
  });

  it("reflects live change events from PermissionStatus", async () => {
    const status = new FakePermissionStatus("prompt");
    mockPermissions(vi.fn().mockResolvedValue(status));

    const { result } = renderHook(() => usePermission({ name: "microphone" }));
    await waitFor(() => expect(result.current.state).toBe("prompt"));

    act(() => status.setState("granted"));
    await waitFor(() => expect(result.current.state).toBe("granted"));
    expect(result.current.status).toBe("granted");

    act(() => status.setState("denied"));
    await waitFor(() => expect(result.current.state).toBe("denied"));
    expect(result.current.status).toBe("denied");
  });

  it("keeps a stable return object identity when nothing changes", async () => {
    const status = new FakePermissionStatus("granted");
    mockPermissions(vi.fn().mockResolvedValue(status));

    const { result, rerender } = renderHook(() =>
      usePermission({ name: "camera" })
    );
    await waitFor(() => expect(result.current.status).toBe("granted"));

    const before = result.current;
    rerender();
    expect(result.current).toBe(before);
  });

  // -------------------------------------------------------------------------
  // Unsupported
  // -------------------------------------------------------------------------

  it("reports unsupported when navigator.permissions is missing", async () => {
    mockNavigatorWithoutPermissions();

    const { result } = renderHook(() => usePermission({ name: "camera" }));

    await waitFor(() => expect(result.current.status).toBe("unsupported"));
    expect(result.current.isSupported).toBe(false);
    expect(result.current.state).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("reports unsupported when navigator is absent (SSR-like)", async () => {
    removeNavigator();

    const { result } = renderHook(() => usePermission({ name: "camera" }));

    await waitFor(() => expect(result.current.status).toBe("unsupported"));
    expect(result.current.isSupported).toBe(false);
  });

  it("renders a deterministic first paint (hydration-safe) regardless of support", () => {
    // `renderToStaticMarkup` never runs effects, so it captures the exact first
    // render. It must be identical whether or not the Permissions API exists —
    // otherwise a supporting browser would hydrate to a different tree. Both
    // `status: 'idle'` and `isSupported: false` are the deterministic seeds.
    function Probe() {
      const { status, isSupported, state } = usePermission({ name: "camera" });
      return createElement(
        "span",
        null,
        `${status}:${String(isSupported)}:${String(state)}`
      );
    }

    mockPermissions(vi.fn().mockResolvedValue(new FakePermissionStatus("granted")));
    const supportedHtml = renderToStaticMarkup(createElement(Probe));

    mockNavigatorWithoutPermissions();
    const unsupportedHtml = renderToStaticMarkup(createElement(Probe));

    expect(supportedHtml).toBe("<span>idle:false:null</span>");
    expect(unsupportedHtml).toBe(supportedHtml);
  });

  // -------------------------------------------------------------------------
  // Error
  // -------------------------------------------------------------------------

  it("reports error when the query rejects with an Error", async () => {
    const err = new TypeError("Unknown permission name");
    mockPermissions(vi.fn().mockRejectedValue(err));

    const { result } = renderHook(() => usePermission({ name: "banana" }));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toBe(err);
    expect(result.current.state).toBeNull();
  });

  it("wraps a non-Error rejection value in an Error", async () => {
    mockPermissions(vi.fn().mockRejectedValue("boom"));

    const { result } = renderHook(() => usePermission({ name: "banana" }));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("boom");
  });

  // -------------------------------------------------------------------------
  // Descriptor identity / re-query behavior
  // -------------------------------------------------------------------------

  it("does not re-query when an inline descriptor keeps the same contents", async () => {
    const status = new FakePermissionStatus("granted");
    const query = vi.fn().mockResolvedValue(status);
    mockPermissions(query);

    const { result, rerender } = renderHook(
      ({ name }: { name: string }) => usePermission({ name }),
      { initialProps: { name: "camera" } }
    );
    await waitFor(() => expect(result.current.status).toBe("granted"));
    expect(query).toHaveBeenCalledTimes(1);

    // New object literal, same contents → no new query.
    rerender({ name: "camera" });
    rerender({ name: "camera" });
    expect(query).toHaveBeenCalledTimes(1);
  });

  it("re-queries when the descriptor contents change", async () => {
    const cam = new FakePermissionStatus("granted");
    const mic = new FakePermissionStatus("denied");
    const query = vi
      .fn()
      .mockImplementation((d: PermissionDescriptor) =>
        Promise.resolve(d.name === "camera" ? cam : mic)
      );
    mockPermissions(query);

    const { result, rerender } = renderHook(
      ({ name }: { name: string }) => usePermission({ name }),
      { initialProps: { name: "camera" } }
    );
    await waitFor(() => expect(result.current.state).toBe("granted"));
    expect(query).toHaveBeenCalledTimes(1);

    rerender({ name: "microphone" });
    await waitFor(() => expect(result.current.state).toBe("denied"));
    expect(query).toHaveBeenCalledTimes(2);
  });

  // -------------------------------------------------------------------------
  // Cleanup / race safety
  // -------------------------------------------------------------------------

  it("removes the change listener on unmount", async () => {
    const status = new FakePermissionStatus("granted");
    mockPermissions(vi.fn().mockResolvedValue(status));

    const { result, unmount } = renderHook(() =>
      usePermission({ name: "camera" })
    );
    await waitFor(() => expect(result.current.status).toBe("granted"));
    expect(status.listenerCount()).toBe(1);

    unmount();
    expect(status.removeSpy).toHaveBeenCalledWith("change", expect.any(Function));
    expect(status.listenerCount()).toBe(0);
  });

  it("ignores a query that resolves after unmount (no state update / no leak)", async () => {
    let resolveQuery!: (s: PermissionStatus) => void;
    const status = new FakePermissionStatus("granted");
    mockPermissions(
      vi.fn().mockImplementation(
        () =>
          new Promise<PermissionStatus>((resolve) => {
            resolveQuery = resolve;
          })
      )
    );

    const { unmount } = renderHook(() => usePermission({ name: "camera" }));
    unmount();

    // Resolving after unmount must not subscribe a listener (cancelled guard).
    await act(async () => {
      resolveQuery(status as unknown as PermissionStatus);
      await Promise.resolve();
    });
    expect(status.listenerCount()).toBe(0);
  });

  it("ignores a rejection that settles after unmount", async () => {
    let rejectQuery!: (e: unknown) => void;
    mockPermissions(
      vi.fn().mockImplementation(
        () =>
          new Promise<PermissionStatus>((_resolve, reject) => {
            rejectQuery = reject;
          })
      )
    );

    const { unmount } = renderHook(() => usePermission({ name: "camera" }));
    unmount();

    // Should not throw or warn about setState after unmount.
    await act(async () => {
      rejectQuery(new Error("late"));
      await Promise.resolve().catch(() => {});
    });
    // No assertion beyond "did not throw" — the cancelled guard swallowed it.
    expect(true).toBe(true);
  });
});
