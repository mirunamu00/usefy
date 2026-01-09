import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useClickAnyWhere } from "./useClickAnyWhere";

describe("useClickAnyWhere", () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(document, "addEventListener");
    removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("basic functionality", () => {
    it("should call handler when document is clicked", () => {
      const handler = vi.fn();
      renderHook(() => useClickAnyWhere(handler));

      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        clientX: 100,
        clientY: 200,
      });
      document.dispatchEvent(clickEvent);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(clickEvent);
    });

    it("should pass MouseEvent with correct properties", () => {
      const handler = vi.fn();
      renderHook(() => useClickAnyWhere(handler));

      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        clientX: 150,
        clientY: 250,
        button: 0,
      });
      document.dispatchEvent(clickEvent);

      const receivedEvent = handler.mock.calls[0][0] as MouseEvent;
      expect(receivedEvent.clientX).toBe(150);
      expect(receivedEvent.clientY).toBe(250);
      expect(receivedEvent.button).toBe(0);
    });

    it("should handle multiple clicks", () => {
      const handler = vi.fn();
      renderHook(() => useClickAnyWhere(handler));

      document.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      document.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      document.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(handler).toHaveBeenCalledTimes(3);
    });

    it("should register event listener on mount", () => {
      const handler = vi.fn();
      renderHook(() => useClickAnyWhere(handler));

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "click",
        expect.any(Function),
        { capture: false, passive: true }
      );
    });
  });

  describe("enabled option", () => {
    it("should not call handler when enabled is false", () => {
      const handler = vi.fn();
      renderHook(() => useClickAnyWhere(handler, { enabled: false }));

      document.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(handler).not.toHaveBeenCalled();
    });

    it("should not register event listener when enabled is false", () => {
      const handler = vi.fn();
      renderHook(() => useClickAnyWhere(handler, { enabled: false }));

      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });

    it("should toggle listener when enabled changes", () => {
      const handler = vi.fn();
      const { rerender } = renderHook(
        ({ enabled }) => useClickAnyWhere(handler, { enabled }),
        { initialProps: { enabled: false } }
      );

      // Initially disabled - no listener
      expect(addEventListenerSpy).not.toHaveBeenCalled();

      // Enable - should add listener
      rerender({ enabled: true });
      expect(addEventListenerSpy).toHaveBeenCalledTimes(1);

      // Test it works
      document.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(handler).toHaveBeenCalledTimes(1);

      // Disable - should remove listener
      rerender({ enabled: false });
      expect(removeEventListenerSpy).toHaveBeenCalled();

      // Click should not trigger handler
      document.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(handler).toHaveBeenCalledTimes(1); // Still 1
    });

    it("should default enabled to true", () => {
      const handler = vi.fn();
      renderHook(() => useClickAnyWhere(handler));

      document.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(handler).toHaveBeenCalled();
    });
  });

  describe("capture option", () => {
    it("should register with capture phase when capture is true", () => {
      const handler = vi.fn();
      renderHook(() => useClickAnyWhere(handler, { capture: true }));

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "click",
        expect.any(Function),
        { capture: true, passive: true }
      );
    });

    it("should register without capture phase by default", () => {
      const handler = vi.fn();
      renderHook(() => useClickAnyWhere(handler));

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "click",
        expect.any(Function),
        { capture: false, passive: true }
      );
    });

    it("should remove listener with correct capture option", () => {
      const handler = vi.fn();
      const { unmount } = renderHook(() =>
        useClickAnyWhere(handler, { capture: true })
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "click",
        expect.any(Function),
        { capture: true }
      );
    });
  });

  describe("passive option", () => {
    it("should register with passive true by default", () => {
      const handler = vi.fn();
      renderHook(() => useClickAnyWhere(handler));

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "click",
        expect.any(Function),
        { capture: false, passive: true }
      );
    });

    it("should register with passive false when specified", () => {
      const handler = vi.fn();
      renderHook(() => useClickAnyWhere(handler, { passive: false }));

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "click",
        expect.any(Function),
        { capture: false, passive: false }
      );
    });
  });

  describe("cleanup", () => {
    it("should remove event listener on unmount", () => {
      const handler = vi.fn();
      const { unmount } = renderHook(() => useClickAnyWhere(handler));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "click",
        expect.any(Function),
        { capture: false }
      );
    });

    it("should not call handler after unmount", () => {
      const handler = vi.fn();
      const { unmount } = renderHook(() => useClickAnyWhere(handler));

      unmount();
      document.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("handler stability", () => {
    it("should not re-register listener when handler changes", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const { rerender } = renderHook(
        ({ handler }) => useClickAnyWhere(handler),
        { initialProps: { handler: handler1 } }
      );

      expect(addEventListenerSpy).toHaveBeenCalledTimes(1);

      rerender({ handler: handler2 });

      // Should still be 1 - no re-registration
      expect(addEventListenerSpy).toHaveBeenCalledTimes(1);
    });

    it("should call the latest handler after update", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const { rerender } = renderHook(
        ({ handler }) => useClickAnyWhere(handler),
        { initialProps: { handler: handler1 } }
      );

      // First click
      document.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).not.toHaveBeenCalled();

      // Update handler
      rerender({ handler: handler2 });

      // Second click - should call new handler
      document.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(handler1).toHaveBeenCalledTimes(1); // Still 1
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe("multiple instances", () => {
    it("should work independently with multiple instances", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      renderHook(() => useClickAnyWhere(handler1));
      renderHook(() => useClickAnyWhere(handler2));

      document.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it("should handle different options independently", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      renderHook(() => useClickAnyWhere(handler1, { enabled: true }));
      renderHook(() => useClickAnyWhere(handler2, { enabled: false }));

      document.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe("options changes", () => {
    it("should re-register listener when capture changes", () => {
      const handler = vi.fn();
      const { rerender } = renderHook(
        ({ capture }) => useClickAnyWhere(handler, { capture }),
        { initialProps: { capture: false } }
      );

      expect(addEventListenerSpy).toHaveBeenCalledTimes(1);

      rerender({ capture: true });

      // Should remove old and add new
      expect(removeEventListenerSpy).toHaveBeenCalled();
      expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
    });

    it("should re-register listener when passive changes", () => {
      const handler = vi.fn();
      const { rerender } = renderHook(
        ({ passive }) => useClickAnyWhere(handler, { passive }),
        { initialProps: { passive: true } }
      );

      expect(addEventListenerSpy).toHaveBeenCalledTimes(1);

      rerender({ passive: false });

      // Should remove old and add new
      expect(removeEventListenerSpy).toHaveBeenCalled();
      expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("edge cases", () => {
    it("should handle rapid option toggles", () => {
      const handler = vi.fn();
      const { rerender } = renderHook(
        ({ enabled }) => useClickAnyWhere(handler, { enabled }),
        { initialProps: { enabled: true } }
      );

      rerender({ enabled: false });
      rerender({ enabled: true });
      rerender({ enabled: false });
      rerender({ enabled: true });

      document.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should work with click on specific element", () => {
      const handler = vi.fn();
      renderHook(() => useClickAnyWhere(handler));

      const button = document.createElement("button");
      document.body.appendChild(button);

      button.click();

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(button);
    });
  });
});
