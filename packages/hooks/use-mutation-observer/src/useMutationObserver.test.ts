import { renderHook, act, render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StrictMode, createElement } from "react";
import { useMutationObserver } from "./useMutationObserver";
import {
  mockObserverInstances,
  simulateMutation,
  createMockMutationRecord,
  getLatestObserver,
  isElementObserved,
  getObserveOptions,
} from "../vitest.setup";

describe("useMutationObserver", () => {
  let targetElement: HTMLDivElement;
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    targetElement = document.createElement("div");
    targetElement.setAttribute("data-testid", "target");
    container.appendChild(targetElement);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  // ============ Initialization ============
  describe("initialization", () => {
    it("returns empty records before any mutation", () => {
      const { result } = renderHook(() => useMutationObserver());
      expect(result.current.records).toEqual([]);
    });

    it("reports isSupported as true in the browser", () => {
      const { result } = renderHook(() => useMutationObserver());
      expect(result.current.isSupported).toBe(true);
    });

    it("reports isObserving as false initially", () => {
      const { result } = renderHook(() => useMutationObserver());
      expect(result.current.isObserving).toBe(false);
    });

    it("provides a stable ref callback across renders", () => {
      const { result, rerender } = renderHook(() => useMutationObserver());
      const first = result.current.ref;
      rerender();
      expect(result.current.ref).toBe(first);
    });

    it("provides stable control methods across renders", () => {
      const { result, rerender } = renderHook(() => useMutationObserver());
      const { observe, disconnect, takeRecords } = result.current;
      rerender();
      expect(result.current.observe).toBe(observe);
      expect(result.current.disconnect).toBe(disconnect);
      expect(result.current.takeRecords).toBe(takeRecords);
    });

    it("handles undefined options", () => {
      const { result } = renderHook(() => useMutationObserver());
      expect(typeof result.current.ref).toBe("function");
    });

    it("handles an empty options object", () => {
      const { result } = renderHook(() => useMutationObserver({}));
      expect(typeof result.current.ref).toBe("function");
    });

    it("creates an observer on mount", () => {
      renderHook(() => useMutationObserver());
      expect(mockObserverInstances.length).toBeGreaterThan(0);
    });
  });

  // ============ Observation ============
  describe("observation", () => {
    it("observes the element when the ref is attached", () => {
      const { result } = renderHook(() => useMutationObserver());
      act(() => {
        result.current.ref(targetElement);
      });
      expect(isElementObserved(targetElement)).toBe(true);
      expect(result.current.isObserving).toBe(true);
    });

    it("defaults to childList: true when nothing is specified", () => {
      const { result } = renderHook(() => useMutationObserver());
      act(() => {
        result.current.ref(targetElement);
      });
      expect(getObserveOptions(targetElement)).toEqual({ childList: true });
    });

    it("passes attributes + subtree config through to observe", () => {
      const { result } = renderHook(() =>
        useMutationObserver({ attributes: true, subtree: true })
      );
      act(() => {
        result.current.ref(targetElement);
      });
      expect(getObserveOptions(targetElement)).toEqual({
        attributes: true,
        subtree: true,
      });
    });

    it("passes attributeFilter through (implying attributes)", () => {
      const { result } = renderHook(() =>
        useMutationObserver({ attributeFilter: ["class"] })
      );
      act(() => {
        result.current.ref(targetElement);
      });
      expect(getObserveOptions(targetElement)).toEqual({
        attributes: true,
        attributeFilter: ["class"],
      });
    });

    it("fires onMutation with records and the observer", () => {
      const onMutation = vi.fn();
      const { result } = renderHook(() => useMutationObserver({ onMutation }));
      act(() => {
        result.current.ref(targetElement);
      });
      const records = [createMockMutationRecord(targetElement)];
      act(() => {
        simulateMutation(targetElement, records);
      });
      expect(onMutation).toHaveBeenCalledTimes(1);
      expect(onMutation).toHaveBeenCalledWith(records, expect.anything());
    });

    it("updates records state on mutation", () => {
      const { result } = renderHook(() => useMutationObserver());
      act(() => {
        result.current.ref(targetElement);
      });
      const records = [
        createMockMutationRecord(targetElement, { type: "attributes" }),
      ];
      act(() => {
        simulateMutation(targetElement, records);
      });
      expect(result.current.records).toBe(records);
      expect(result.current.records[0]?.type).toBe("attributes");
    });

    it("handles multiple mutation batches, keeping the latest", () => {
      const { result } = renderHook(() => useMutationObserver());
      act(() => {
        result.current.ref(targetElement);
      });
      const first = [createMockMutationRecord(targetElement)];
      const second = [
        createMockMutationRecord(targetElement),
        createMockMutationRecord(targetElement),
      ];
      act(() => {
        simulateMutation(targetElement, first);
      });
      act(() => {
        simulateMutation(targetElement, second);
      });
      expect(result.current.records).toBe(second);
      expect(result.current.records).toHaveLength(2);
    });

    it("ignores an empty mutation batch for state", () => {
      const { result } = renderHook(() => useMutationObserver());
      act(() => {
        result.current.ref(targetElement);
      });
      const before = result.current.records;
      act(() => {
        simulateMutation(targetElement, []);
      });
      expect(result.current.records).toBe(before);
    });
  });

  // ============ updateState option ============
  describe("updateState option", () => {
    it("does not update records when updateState is false", () => {
      const { result } = renderHook(() =>
        useMutationObserver({ updateState: false })
      );
      act(() => {
        result.current.ref(targetElement);
      });
      act(() => {
        simulateMutation(targetElement);
      });
      expect(result.current.records).toEqual([]);
    });

    it("still fires onMutation when updateState is false", () => {
      const onMutation = vi.fn();
      const { result } = renderHook(() =>
        useMutationObserver({ updateState: false, onMutation })
      );
      act(() => {
        result.current.ref(targetElement);
      });
      act(() => {
        simulateMutation(targetElement);
      });
      expect(onMutation).toHaveBeenCalledTimes(1);
    });
  });

  // ============ Stable callback (no re-registration) ============
  describe("callback identity", () => {
    it("does not re-create the observer when onMutation identity changes", () => {
      const { result, rerender } = renderHook(
        ({ cb }) => useMutationObserver({ onMutation: cb }),
        { initialProps: { cb: vi.fn() } }
      );
      act(() => {
        result.current.ref(targetElement);
      });
      const observerCount = mockObserverInstances.length;
      const observer = getLatestObserver();

      const newCb = vi.fn();
      rerender({ cb: newCb });

      // No new observer, still observing the same element.
      expect(mockObserverInstances.length).toBe(observerCount);
      expect(getLatestObserver()).toBe(observer);
      expect(isElementObserved(targetElement)).toBe(true);

      // The latest callback is the one that fires.
      act(() => {
        simulateMutation(targetElement);
      });
      expect(newCb).toHaveBeenCalledTimes(1);
    });

    it("re-observes with a new config when the config changes", () => {
      const { result, rerender } = renderHook(
        ({ attributes }) => useMutationObserver({ attributes }),
        { initialProps: { attributes: false } }
      );
      act(() => {
        result.current.ref(targetElement);
      });
      const observerCount = mockObserverInstances.length;
      expect(getObserveOptions(targetElement)).toEqual({ childList: true });

      rerender({ attributes: true });

      // Same observer instance, re-observed with the new config.
      expect(mockObserverInstances.length).toBe(observerCount);
      expect(getObserveOptions(targetElement)).toEqual({ attributes: true });
    });
  });

  // ============ enabled option ============
  describe("enabled option", () => {
    it("does not observe when disabled", () => {
      const { result } = renderHook(() =>
        useMutationObserver({ enabled: false })
      );
      act(() => {
        result.current.ref(targetElement);
      });
      expect(result.current.isObserving).toBe(false);
      expect(isElementObserved(targetElement)).toBe(false);
    });

    it("starts observing when enabled flips to true", () => {
      const { result, rerender } = renderHook(
        ({ enabled }) => useMutationObserver({ enabled }),
        { initialProps: { enabled: false } }
      );
      act(() => {
        result.current.ref(targetElement);
      });
      expect(result.current.isObserving).toBe(false);

      rerender({ enabled: true });
      expect(result.current.isObserving).toBe(true);
      expect(isElementObserved(targetElement)).toBe(true);
    });

    it("stops observing when enabled flips to false", () => {
      const { result, rerender } = renderHook(
        ({ enabled }) => useMutationObserver({ enabled }),
        { initialProps: { enabled: true } }
      );
      act(() => {
        result.current.ref(targetElement);
      });
      expect(result.current.isObserving).toBe(true);

      rerender({ enabled: false });
      expect(result.current.isObserving).toBe(false);
      expect(isElementObserved(targetElement)).toBe(false);
    });

    it("preserves the last records when disabled", () => {
      const { result, rerender } = renderHook(
        ({ enabled }) => useMutationObserver({ enabled }),
        { initialProps: { enabled: true } }
      );
      act(() => {
        result.current.ref(targetElement);
      });
      const records = [createMockMutationRecord(targetElement)];
      act(() => {
        simulateMutation(targetElement, records);
      });
      expect(result.current.records).toBe(records);

      rerender({ enabled: false });
      expect(result.current.records).toBe(records);
    });
  });

  // ============ Manual control ============
  describe("manual control", () => {
    it("manually observes an element", () => {
      const { result } = renderHook(() => useMutationObserver());
      act(() => {
        result.current.observe(targetElement);
      });
      expect(result.current.isObserving).toBe(true);
      expect(isElementObserved(targetElement)).toBe(true);
    });

    it("disconnects observation", () => {
      const { result } = renderHook(() => useMutationObserver());
      act(() => {
        result.current.ref(targetElement);
      });
      expect(result.current.isObserving).toBe(true);
      act(() => {
        result.current.disconnect();
      });
      expect(result.current.isObserving).toBe(false);
    });

    it("disconnects the current target before a manual observe(newElement)", () => {
      const { result } = renderHook(() => useMutationObserver());
      const elementB = document.createElement("div");
      container.appendChild(elementB);

      act(() => {
        result.current.ref(targetElement); // observing A
      });
      expect(isElementObserved(targetElement)).toBe(true);

      act(() => {
        result.current.observe(elementB); // switch to B
      });

      // The single observer must no longer watch A (no double-observe leak).
      expect(isElementObserved(targetElement)).toBe(false);
      expect(isElementObserved(elementB)).toBe(true);
    });

    it("does not observe on manual observe() while disabled", () => {
      const { result, rerender } = renderHook(
        ({ enabled }) => useMutationObserver({ enabled }),
        { initialProps: { enabled: false } }
      );
      act(() => {
        result.current.observe(targetElement);
      });
      expect(result.current.isObserving).toBe(false);
      expect(isElementObserved(targetElement)).toBe(false);

      // Flipping enabled on reconciles and observes the recorded target.
      rerender({ enabled: true });
      expect(result.current.isObserving).toBe(true);
      expect(isElementObserved(targetElement)).toBe(true);
    });

    it("re-creates the observer when observing after a disconnect", () => {
      const onMutation = vi.fn();
      const { result } = renderHook(() => useMutationObserver({ onMutation }));
      act(() => {
        result.current.ref(targetElement);
      });
      act(() => {
        result.current.disconnect();
      });
      const countAfterDisconnect = mockObserverInstances.length;

      act(() => {
        result.current.observe(targetElement);
      });
      expect(mockObserverInstances.length).toBe(countAfterDisconnect + 1);
      expect(result.current.isObserving).toBe(true);
      expect(isElementObserved(targetElement)).toBe(true);

      // The re-created observer routes mutations through the same callback.
      const records = [createMockMutationRecord(targetElement)];
      act(() => {
        simulateMutation(targetElement, records);
      });
      expect(onMutation).toHaveBeenCalledWith(records, expect.anything());
      expect(result.current.records).toBe(records);
    });

    it("stops a manually-observed element when enabled flips to false", () => {
      const { result, rerender } = renderHook(
        ({ enabled }) => useMutationObserver({ enabled }),
        { initialProps: { enabled: true } }
      );
      act(() => {
        result.current.observe(targetElement);
      });
      expect(result.current.isObserving).toBe(true);

      rerender({ enabled: false });
      expect(result.current.isObserving).toBe(false);
      expect(isElementObserved(targetElement)).toBe(false);
    });

    it("disconnects the re-created observer on unmount (no leak)", () => {
      const { result, unmount } = renderHook(() => useMutationObserver());
      act(() => {
        result.current.ref(targetElement);
      });
      act(() => {
        result.current.disconnect();
      });
      act(() => {
        result.current.observe(targetElement);
      });
      expect(isElementObserved(targetElement)).toBe(true);

      unmount();
      // The observer created by the manual observe() must also be disconnected.
      expect(isElementObserved(targetElement)).toBe(false);
    });

    it("disconnect is a no-op when nothing is observed", () => {
      const { result } = renderHook(() => useMutationObserver());
      act(() => {
        result.current.disconnect();
      });
      expect(() => result.current.disconnect()).not.toThrow();
      expect(result.current.isObserving).toBe(false);
    });

    it("takeRecords flushes queued records", () => {
      const { result } = renderHook(() => useMutationObserver());
      act(() => {
        result.current.ref(targetElement);
      });
      const observer = getLatestObserver();
      const queued = [createMockMutationRecord(targetElement)];
      observer!.queue = [...queued];

      let flushed: MutationRecord[] = [];
      act(() => {
        flushed = result.current.takeRecords();
      });
      expect(flushed).toEqual(queued);
      // Queue is drained afterwards.
      act(() => {
        flushed = result.current.takeRecords();
      });
      expect(flushed).toEqual([]);
    });

    it("takeRecords returns [] after the observer is disconnected", () => {
      const { result } = renderHook(() => useMutationObserver());
      act(() => {
        result.current.ref(targetElement);
      });
      act(() => {
        result.current.disconnect();
      });
      expect(result.current.takeRecords()).toEqual([]);
    });
  });

  // ============ Ref patterns ============
  describe("ref patterns", () => {
    it("stops observing when the ref is set to null", () => {
      const { result } = renderHook(() => useMutationObserver());
      act(() => {
        result.current.ref(targetElement);
      });
      expect(result.current.isObserving).toBe(true);
      act(() => {
        result.current.ref(null);
      });
      expect(result.current.isObserving).toBe(false);
      expect(isElementObserved(targetElement)).toBe(false);
    });

    it("moves observation when the ref points at a new element", () => {
      const { result } = renderHook(() => useMutationObserver());
      act(() => {
        result.current.ref(targetElement);
      });
      const newElement = document.createElement("div");
      container.appendChild(newElement);

      act(() => {
        result.current.ref(newElement);
      });
      expect(isElementObserved(newElement)).toBe(true);
      expect(isElementObserved(targetElement)).toBe(false);
    });

    it("is a no-op when the same element is re-attached", () => {
      const { result } = renderHook(() => useMutationObserver());
      act(() => {
        result.current.ref(targetElement);
      });
      act(() => {
        result.current.ref(targetElement);
      });
      expect(result.current.isObserving).toBe(true);
      expect(isElementObserved(targetElement)).toBe(true);
    });
  });

  // ============ Real-DOM mount (ref attached before effects) ============
  describe("real DOM mount", () => {
    function Probe() {
      const { ref } = useMutationObserver<HTMLDivElement>({ childList: true });
      return createElement("div", { ref, "data-testid": "probe" });
    }

    it("observes a target already attached at mount time", () => {
      const { getByTestId } = render(createElement(Probe));
      const el = getByTestId("probe");
      expect(isElementObserved(el)).toBe(true);
      expect(getObserveOptions(el)).toEqual({ childList: true });
    });
  });

  // ============ Cleanup ============
  describe("cleanup", () => {
    it("disconnects on unmount", () => {
      const { result, unmount } = renderHook(() => useMutationObserver());
      act(() => {
        result.current.ref(targetElement);
      });
      const observer = getLatestObserver();
      expect(observer!.observedElements.size).toBeGreaterThan(0);

      unmount();
      expect(observer!.observedElements.size).toBe(0);
    });

    it("does not fire onMutation after unmount", () => {
      const onMutation = vi.fn();
      const { result, unmount } = renderHook(() =>
        useMutationObserver({ onMutation })
      );
      act(() => {
        result.current.ref(targetElement);
      });
      unmount();
      expect(onMutation).not.toHaveBeenCalled();
    });
  });

  // ============ StrictMode ============
  describe("StrictMode", () => {
    it("observes cleanly under StrictMode double-invocation", () => {
      const { result } = renderHook(() => useMutationObserver(), {
        wrapper: StrictMode,
      });
      act(() => {
        result.current.ref(targetElement);
      });
      expect(result.current.isObserving).toBe(true);
      expect(isElementObserved(targetElement)).toBe(true);
    });

    it("disconnects the active observer on unmount under StrictMode", () => {
      const { result, unmount } = renderHook(() => useMutationObserver(), {
        wrapper: StrictMode,
      });
      act(() => {
        result.current.ref(targetElement);
      });
      unmount();
      // No observer instance is left observing the element.
      expect(isElementObserved(targetElement)).toBe(false);
    });
  });

  // ============ Unsupported environment ============
  describe("unsupported environment", () => {
    beforeEach(() => {
      vi.stubGlobal("MutationObserver", undefined);
    });
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("returns an inert result when MutationObserver is unavailable", () => {
      const { result } = renderHook(() => useMutationObserver());
      expect(result.current.isSupported).toBe(false);
      expect(result.current.isObserving).toBe(false);
      expect(result.current.records).toEqual([]);
    });

    it("provides no-op methods that do not throw", () => {
      const { result } = renderHook(() => useMutationObserver());
      expect(() => result.current.ref(targetElement)).not.toThrow();
      expect(() => result.current.ref(null)).not.toThrow();
      expect(() => result.current.observe(targetElement)).not.toThrow();
      expect(() => result.current.disconnect()).not.toThrow();
      expect(result.current.takeRecords()).toEqual([]);
    });
  });
});
