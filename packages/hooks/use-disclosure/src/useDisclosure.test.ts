import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useDisclosure } from "./useDisclosure";

describe("useDisclosure", () => {
  describe("state", () => {
    it("defaults to closed", () => {
      const { result } = renderHook(() => useDisclosure());
      expect(result.current[0]).toBe(false);
    });

    it("respects the initial state", () => {
      const { result } = renderHook(() => useDisclosure(true));
      expect(result.current[0]).toBe(true);
    });

    it("open() opens and close() closes", () => {
      const { result } = renderHook(() => useDisclosure(false));

      act(() => result.current[1].open());
      expect(result.current[0]).toBe(true);

      act(() => result.current[1].close());
      expect(result.current[0]).toBe(false);
    });

    it("toggle() flips the state", () => {
      const { result } = renderHook(() => useDisclosure(false));

      act(() => result.current[1].toggle());
      expect(result.current[0]).toBe(true);

      act(() => result.current[1].toggle());
      expect(result.current[0]).toBe(false);
    });

    it("open() while open and close() while closed are no-ops", () => {
      const { result } = renderHook(() => useDisclosure(true));

      act(() => result.current[1].open());
      expect(result.current[0]).toBe(true);

      act(() => result.current[1].close());
      act(() => result.current[1].close());
      expect(result.current[0]).toBe(false);
    });
  });

  describe("callbacks", () => {
    it("fires onOpen only on a closed → open transition", () => {
      const onOpen = vi.fn();
      const { result } = renderHook(() => useDisclosure(false, { onOpen }));

      act(() => result.current[1].open());
      expect(onOpen).toHaveBeenCalledTimes(1);

      // Already open — no second call.
      act(() => result.current[1].open());
      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it("fires onClose only on an open → closed transition", () => {
      const onClose = vi.fn();
      const { result } = renderHook(() => useDisclosure(true, { onClose }));

      act(() => result.current[1].close());
      expect(onClose).toHaveBeenCalledTimes(1);

      act(() => result.current[1].close());
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not fire callbacks on mount", () => {
      const onOpen = vi.fn();
      const onClose = vi.fn();
      renderHook(() => useDisclosure(true, { onOpen, onClose }));
      expect(onOpen).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });

    it("toggle() fires the matching callback", () => {
      const onOpen = vi.fn();
      const onClose = vi.fn();
      const { result } = renderHook(() =>
        useDisclosure(false, { onOpen, onClose })
      );

      act(() => result.current[1].toggle());
      expect(onOpen).toHaveBeenCalledTimes(1);
      expect(onClose).not.toHaveBeenCalled();

      act(() => result.current[1].toggle());
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it("uses the latest callbacks without stale closures", () => {
      const first = vi.fn();
      const second = vi.fn();
      const { result, rerender } = renderHook(
        ({ onOpen }) => useDisclosure(false, { onOpen }),
        { initialProps: { onOpen: first } }
      );

      rerender({ onOpen: second });
      act(() => result.current[1].open());

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
    });

    it("works without any callbacks", () => {
      const { result } = renderHook(() => useDisclosure(false));
      expect(() => {
        act(() => result.current[1].open());
        act(() => result.current[1].toggle());
        act(() => result.current[1].close());
      }).not.toThrow();
    });
  });

  describe("stability", () => {
    it("keeps stable handler identities across renders", () => {
      const { result, rerender } = renderHook(() => useDisclosure(false));
      const handlers = result.current[1];
      const { open, close, toggle } = handlers;

      rerender();
      expect(result.current[1]).toBe(handlers);
      expect(result.current[1].open).toBe(open);
      expect(result.current[1].close).toBe(close);
      expect(result.current[1].toggle).toBe(toggle);
    });

    it("keeps stable handler identities across state changes", () => {
      const { result } = renderHook(() => useDisclosure(false));
      const handlers = result.current[1];

      act(() => result.current[1].open());
      expect(result.current[1]).toBe(handlers);
    });
  });
});
