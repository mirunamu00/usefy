import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNetworkState } from "./useNetworkState";
import {
  SERVER_NETWORK_STATE,
  areNetworkStatesEqual,
  getConnection,
  getNetworkState,
  isNavigatorAvailable,
  isNetworkInformationSupported,
} from "./utils";
import type {
  ConnectionType,
  EffectiveConnectionType,
  NetworkState,
} from "./types";

/**
 * Minimal, real EventTarget-backed mock of `navigator.connection` so `change`
 * events dispatch to registered listeners exactly like the browser.
 */
class MockConnection extends EventTarget {
  downlink?: number;
  downlinkMax?: number;
  effectiveType?: EffectiveConnectionType;
  rtt?: number;
  saveData?: boolean;
  type?: ConnectionType;

  constructor(init: Partial<MockConnection> = {}) {
    super();
    Object.assign(this, init);
  }

  /** Update fields and fire a `change` event, as a real connection would. */
  emitChange(updates: Partial<MockConnection>): void {
    Object.assign(this, updates);
    this.dispatchEvent(new Event("change"));
  }
}

function setOnline(value: boolean): void {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    writable: true,
    value,
  });
}

function setConnection(
  connection: unknown,
  prop: "connection" | "mozConnection" | "webkitConnection" = "connection"
): void {
  Object.defineProperty(navigator, prop, {
    configurable: true,
    writable: true,
    value: connection,
  });
}

function clearConnections(): void {
  for (const prop of [
    "connection",
    "mozConnection",
    "webkitConnection",
  ] as const) {
    if (prop in navigator) {
      delete (navigator as unknown as Record<string, unknown>)[prop];
    }
  }
}

beforeEach(() => {
  setOnline(true);
  clearConnections();
});

afterEach(() => {
  // Restore any stubbed globals (e.g. navigator) BEFORE touching navigator.
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  clearConnections();
  setOnline(true);
});

describe("utils", () => {
  describe("SERVER_NETWORK_STATE", () => {
    it("is online:true with no Network Information fields", () => {
      expect(SERVER_NETWORK_STATE.online).toBe(true);
      expect(SERVER_NETWORK_STATE.since).toBeUndefined();
      expect(SERVER_NETWORK_STATE.effectiveType).toBeUndefined();
    });

    it("is frozen (stable identity for the server snapshot)", () => {
      expect(Object.isFrozen(SERVER_NETWORK_STATE)).toBe(true);
    });
  });

  describe("isNavigatorAvailable", () => {
    it("returns true in a browser-like (jsdom) environment", () => {
      expect(isNavigatorAvailable()).toBe(true);
    });

    it("returns false when navigator is undefined (SSR)", () => {
      vi.stubGlobal("navigator", undefined);
      expect(isNavigatorAvailable()).toBe(false);
    });
  });

  describe("getConnection", () => {
    it("returns undefined when no connection is present", () => {
      expect(getConnection()).toBeUndefined();
    });

    it("returns navigator.connection when present", () => {
      const conn = new MockConnection({ effectiveType: "4g" });
      setConnection(conn);
      expect(getConnection()).toBe(conn);
    });

    it("falls back to mozConnection", () => {
      const conn = new MockConnection({ effectiveType: "3g" });
      setConnection(conn, "mozConnection");
      expect(getConnection()).toBe(conn);
    });

    it("falls back to webkitConnection", () => {
      const conn = new MockConnection({ effectiveType: "2g" });
      setConnection(conn, "webkitConnection");
      expect(getConnection()).toBe(conn);
    });

    it("returns undefined under SSR", () => {
      vi.stubGlobal("navigator", undefined);
      expect(getConnection()).toBeUndefined();
    });
  });

  describe("isNetworkInformationSupported", () => {
    it("reflects presence of the connection object", () => {
      expect(isNetworkInformationSupported()).toBe(false);
      setConnection(new MockConnection());
      expect(isNetworkInformationSupported()).toBe(true);
    });
  });

  describe("getNetworkState", () => {
    it("returns the inert server state under SSR", () => {
      vi.stubGlobal("navigator", undefined);
      expect(getNetworkState()).toBe(SERVER_NETWORK_STATE);
    });

    it("reads navigator.onLine with undefined NI fields when unsupported", () => {
      setOnline(false);
      const state = getNetworkState();
      expect(state.online).toBe(false);
      expect(state.downlink).toBeUndefined();
      expect(state.effectiveType).toBeUndefined();
      expect(state.saveData).toBeUndefined();
      expect(state.type).toBeUndefined();
    });

    it("merges Network Information fields when supported", () => {
      setConnection(
        new MockConnection({
          downlink: 10,
          downlinkMax: 100,
          effectiveType: "4g",
          rtt: 50,
          saveData: true,
          type: "wifi",
        })
      );
      const state = getNetworkState();
      expect(state).toMatchObject({
        online: true,
        downlink: 10,
        downlinkMax: 100,
        effectiveType: "4g",
        rtt: 50,
        saveData: true,
        type: "wifi",
      });
    });

    it("carries the provided since timestamp through", () => {
      const since = new Date();
      expect(getNetworkState(since).since).toBe(since);
    });
  });

  describe("areNetworkStatesEqual", () => {
    const base: NetworkState = {
      online: true,
      since: undefined,
      downlink: 10,
      downlinkMax: 100,
      effectiveType: "4g",
      rtt: 50,
      saveData: false,
      type: "wifi",
    };

    it("returns true for field-equal snapshots", () => {
      expect(areNetworkStatesEqual(base, { ...base })).toBe(true);
    });

    it.each([
      ["online", { online: false }],
      ["downlink", { downlink: 5 }],
      ["downlinkMax", { downlinkMax: 50 }],
      ["effectiveType", { effectiveType: "3g" as const }],
      ["rtt", { rtt: 100 }],
      ["saveData", { saveData: true }],
      ["type", { type: "cellular" as const }],
    ])("returns false when %s differs", (_label, diff) => {
      expect(areNetworkStatesEqual(base, { ...base, ...diff })).toBe(false);
    });

    it("compares since by reference", () => {
      const d1 = new Date(0);
      const d2 = new Date(0);
      expect(areNetworkStatesEqual({ ...base, since: d1 }, { ...base, since: d1 })).toBe(true);
      expect(areNetworkStatesEqual({ ...base, since: d1 }, { ...base, since: d2 })).toBe(false);
    });
  });
});

describe("useNetworkState", () => {
  it("reports the initial online status with no since", () => {
    setOnline(true);
    const { result } = renderHook(() => useNetworkState());
    expect(result.current.online).toBe(true);
    expect(result.current.since).toBeUndefined();
  });

  it("reflects navigator.onLine === false on mount", () => {
    setOnline(false);
    const { result } = renderHook(() => useNetworkState());
    expect(result.current.online).toBe(false);
  });

  it("exposes Network Information fields when supported", () => {
    setConnection(
      new MockConnection({ effectiveType: "4g", downlink: 10, saveData: false, type: "wifi" })
    );
    const { result } = renderHook(() => useNetworkState());
    expect(result.current.effectiveType).toBe("4g");
    expect(result.current.downlink).toBe(10);
    expect(result.current.type).toBe("wifi");
  });

  it("leaves Network Information fields undefined when unsupported", () => {
    const { result } = renderHook(() => useNetworkState());
    expect(result.current.online).toBe(true);
    expect(result.current.effectiveType).toBeUndefined();
    expect(result.current.downlink).toBeUndefined();
    expect(result.current.saveData).toBeUndefined();
  });

  it("updates on offline then online events and stamps since", () => {
    setOnline(true);
    const { result } = renderHook(() => useNetworkState());

    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current.online).toBe(false);
    expect(result.current.since).toBeInstanceOf(Date);

    const offlineSince = result.current.since;

    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current.online).toBe(true);
    expect(result.current.since).toBeInstanceOf(Date);
    // A new transition stamps a new (>=) timestamp reference.
    expect(result.current.since).not.toBe(offlineSince);
  });

  it("updates when the connection change event fires", () => {
    const conn = new MockConnection({ effectiveType: "4g", downlink: 10 });
    setConnection(conn);
    const { result } = renderHook(() => useNetworkState());
    expect(result.current.effectiveType).toBe("4g");

    act(() => {
      conn.emitChange({ effectiveType: "2g", downlink: 0.25, rtt: 300 });
    });
    expect(result.current.effectiveType).toBe("2g");
    expect(result.current.downlink).toBe(0.25);
    expect(result.current.rtt).toBe(300);
  });

  it("keeps a stable snapshot reference across a no-op change event", () => {
    const conn = new MockConnection({ effectiveType: "4g", downlink: 10 });
    setConnection(conn);
    let renders = 0;
    const { result } = renderHook(() => {
      renders += 1;
      return useNetworkState();
    });

    const before = result.current;
    const rendersBefore = renders;

    act(() => {
      // Fire change with identical values -> no observable difference.
      conn.emitChange({ effectiveType: "4g", downlink: 10 });
    });

    expect(result.current).toBe(before);
    expect(renders).toBe(rendersBefore);
  });

  it("produces a new snapshot reference on a real change", () => {
    const conn = new MockConnection({ effectiveType: "4g" });
    setConnection(conn);
    const { result } = renderHook(() => useNetworkState());

    const before = result.current;
    act(() => {
      conn.emitChange({ effectiveType: "3g" });
    });
    expect(result.current).not.toBe(before);
  });

  it("removes window and connection listeners on unmount", () => {
    const conn = new MockConnection({ effectiveType: "4g" });
    const connRemove = vi.spyOn(conn, "removeEventListener");
    setConnection(conn);
    const windowRemove = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useNetworkState());
    unmount();

    expect(windowRemove).toHaveBeenCalledWith("online", expect.any(Function));
    expect(windowRemove).toHaveBeenCalledWith("offline", expect.any(Function));
    expect(connRemove).toHaveBeenCalledWith("change", expect.any(Function));
  });

  it("does not throw and does not attach a change listener without a connection", () => {
    const { result, unmount } = renderHook(() => useNetworkState());
    // No connection: offline transition still tracked.
    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current.online).toBe(false);
    expect(() => unmount()).not.toThrow();
  });

  it("is StrictMode-safe: survives double subscribe/unsubscribe", () => {
    const conn = new MockConnection({ effectiveType: "4g" });
    setConnection(conn);
    const { result, rerender, unmount } = renderHook(() => useNetworkState());
    rerender();
    act(() => {
      conn.emitChange({ effectiveType: "3g" });
    });
    expect(result.current.effectiveType).toBe("3g");
    expect(() => unmount()).not.toThrow();
  });
});
