import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useEventListener } from "./useEventListener";

describe("useEventListener", () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, "addEventListener");
    removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("basic functionality", () => {
    it("should add event listener to window by default", () => {
      const handler = vi.fn();

      renderHook(() => useEventListener("resize", handler));

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "resize",
        expect.any(Function),
        expect.objectContaining({ capture: false })
      );
    });

    it("should call handler when event fires on window", () => {
      const handler = vi.fn();

      renderHook(() => useEventListener("resize", handler));

      window.dispatchEvent(new Event("resize"));

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should pass event object to handler", () => {
      const handler = vi.fn();

      renderHook(() => useEventListener("resize", handler));

      const event = new Event("resize");
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledWith(event);
    });

    it("should add event listener to document", () => {
      const handler = vi.fn();
      const documentAddSpy = vi.spyOn(document, "addEventListener");

      renderHook(() => useEventListener("click", handler, document));

      expect(documentAddSpy).toHaveBeenCalledWith(
        "click",
        expect.any(Function),
        expect.any(Object)
      );
    });

    it("should call handler when event fires on document", () => {
      const handler = vi.fn();

      renderHook(() => useEventListener("click", handler, document));

      document.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should add event listener to HTMLElement", () => {
      const element = document.createElement("div");
      const elementAddSpy = vi.spyOn(element, "addEventListener");
      const handler = vi.fn();

      renderHook(() => useEventListener("click", handler, element));

      expect(elementAddSpy).toHaveBeenCalledWith(
        "click",
        expect.any(Function),
        expect.any(Object)
      );
    });

    it("should call handler when event fires on HTMLElement", () => {
      const element = document.createElement("div");
      document.body.appendChild(element);
      const handler = vi.fn();

      renderHook(() => useEventListener("click", handler, element));

      element.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(element);
    });

    it("should add event listener to RefObject", () => {
      const element = document.createElement("div");
      const elementAddSpy = vi.spyOn(element, "addEventListener");
      const ref = { current: element };
      const handler = vi.fn();

      renderHook(() => useEventListener("click", handler, ref));

      expect(elementAddSpy).toHaveBeenCalledWith(
        "click",
        expect.any(Function),
        expect.any(Object)
      );
    });

    it("should call handler when event fires on RefObject element", () => {
      const element = document.createElement("div");
      document.body.appendChild(element);
      const ref = { current: element };
      const handler = vi.fn();

      renderHook(() => useEventListener("click", handler, ref));

      element.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(element);
    });

    it("should handle multiple events", () => {
      const handler = vi.fn();

      renderHook(() => useEventListener("resize", handler));

      window.dispatchEvent(new Event("resize"));
      window.dispatchEvent(new Event("resize"));
      window.dispatchEvent(new Event("resize"));

      expect(handler).toHaveBeenCalledTimes(3);
    });
  });

  describe("enabled option", () => {
    it("should not add listener when enabled is false", () => {
      const handler = vi.fn();

      renderHook(() =>
        useEventListener("resize", handler, window, { enabled: false })
      );

      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });

    it("should not call handler when disabled", () => {
      const handler = vi.fn();

      renderHook(() =>
        useEventListener("resize", handler, window, { enabled: false })
      );

      window.dispatchEvent(new Event("resize"));

      expect(handler).not.toHaveBeenCalled();
    });

    it("should add listener when enabled changes to true", () => {
      const handler = vi.fn();

      const { rerender } = renderHook(
        ({ enabled }) =>
          useEventListener("resize", handler, window, { enabled }),
        { initialProps: { enabled: false } }
      );

      expect(addEventListenerSpy).not.toHaveBeenCalled();

      rerender({ enabled: true });

      expect(addEventListenerSpy).toHaveBeenCalledTimes(1);
    });

    it("should remove listener when enabled changes to false", () => {
      const handler = vi.fn();

      const { rerender } = renderHook(
        ({ enabled }) =>
          useEventListener("resize", handler, window, { enabled }),
        { initialProps: { enabled: true } }
      );

      expect(addEventListenerSpy).toHaveBeenCalledTimes(1);

      rerender({ enabled: false });

      expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);
    });

    it("should default enabled to true", () => {
      const handler = vi.fn();

      renderHook(() => useEventListener("resize", handler));

      expect(addEventListenerSpy).toHaveBeenCalled();
    });
  });

  describe("capture option", () => {
    it("should use capture phase when capture is true", () => {
      const handler = vi.fn();

      renderHook(() =>
        useEventListener("click", handler, window, { capture: true })
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "click",
        expect.any(Function),
        expect.objectContaining({ capture: true })
      );
    });

    it("should use bubble phase when capture is false", () => {
      const handler = vi.fn();

      renderHook(() =>
        useEventListener("click", handler, window, { capture: false })
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "click",
        expect.any(Function),
        expect.objectContaining({ capture: false })
      );
    });

    it("should default capture to false", () => {
      const handler = vi.fn();

      renderHook(() => useEventListener("click", handler));

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "click",
        expect.any(Function),
        expect.objectContaining({ capture: false })
      );
    });

    it("should re-register listener when capture changes", () => {
      const handler = vi.fn();

      const { rerender } = renderHook(
        ({ capture }) =>
          useEventListener("click", handler, window, { capture }),
        { initialProps: { capture: false } }
      );

      expect(addEventListenerSpy).toHaveBeenCalledTimes(1);

      rerender({ capture: true });

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "click",
        expect.any(Function),
        expect.objectContaining({ capture: false })
      );
      expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("passive option", () => {
    it("should pass passive: true to addEventListener", () => {
      const handler = vi.fn();

      renderHook(() =>
        useEventListener("scroll", handler, window, { passive: true })
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "scroll",
        expect.any(Function),
        expect.objectContaining({ passive: true })
      );
    });

    it("should pass passive: false to addEventListener", () => {
      const handler = vi.fn();

      renderHook(() =>
        useEventListener("scroll", handler, window, { passive: false })
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "scroll",
        expect.any(Function),
        expect.objectContaining({ passive: false })
      );
    });

    it("should not include passive when undefined (browser default)", () => {
      const handler = vi.fn();

      renderHook(() => useEventListener("scroll", handler));

      const options = addEventListenerSpy.mock.calls[0][2] as AddEventListenerOptions;
      expect(options.passive).toBeUndefined();
    });
  });

  describe("once option", () => {
    it("should pass once: true to addEventListener", () => {
      const handler = vi.fn();

      renderHook(() =>
        useEventListener("click", handler, window, { once: true })
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "click",
        expect.any(Function),
        expect.objectContaining({ once: true })
      );
    });

    it("should default once to false", () => {
      const handler = vi.fn();

      renderHook(() => useEventListener("click", handler));

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "click",
        expect.any(Function),
        expect.objectContaining({ once: false })
      );
    });
  });

  describe("handler stability", () => {
    it("should not re-register listener when handler changes", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const { rerender } = renderHook(
        ({ handler }) => useEventListener("resize", handler),
        { initialProps: { handler: handler1 } }
      );

      const initialCallCount = addEventListenerSpy.mock.calls.length;

      rerender({ handler: handler2 });

      // Should not add new listener
      expect(addEventListenerSpy.mock.calls.length).toBe(initialCallCount);
    });

    it("should call updated handler after change", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const { rerender } = renderHook(
        ({ handler }) => useEventListener("resize", handler),
        { initialProps: { handler: handler1 } }
      );

      rerender({ handler: handler2 });

      window.dispatchEvent(new Event("resize"));

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe("cleanup", () => {
    it("should remove event listener on unmount", () => {
      const handler = vi.fn();

      const { unmount } = renderHook(() => useEventListener("resize", handler));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "resize",
        expect.any(Function),
        expect.objectContaining({ capture: false })
      );
    });

    it("should not call handler after unmount", () => {
      const handler = vi.fn();

      const { unmount } = renderHook(() => useEventListener("resize", handler));

      unmount();

      window.dispatchEvent(new Event("resize"));

      expect(handler).not.toHaveBeenCalled();
    });

    it("should remove listener with correct capture option", () => {
      const handler = vi.fn();

      const { unmount } = renderHook(() =>
        useEventListener("click", handler, window, { capture: true })
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "click",
        expect.any(Function),
        expect.objectContaining({ capture: true })
      );
    });
  });

  describe("null element handling", () => {
    it("should not add listener when element is null", () => {
      const handler = vi.fn();
      const element: HTMLElement | null = null;

      renderHook(() => useEventListener("click", handler, element));

      // Should not call window.addEventListener since element is explicitly null
      // (different from undefined which defaults to window)
      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });

    it("should not add listener when RefObject.current is null", () => {
      const handler = vi.fn();
      const ref = { current: null };

      renderHook(() => useEventListener("click", handler, ref));

      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });
  });

  describe("multiple instances", () => {
    it("should work with multiple independent instances", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      renderHook(() => {
        useEventListener("resize", handler1);
        useEventListener("scroll", handler2);
      });

      window.dispatchEvent(new Event("resize"));
      window.dispatchEvent(new Event("scroll"));

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it("should handle same event on different elements", () => {
      const element1 = document.createElement("div");
      const element2 = document.createElement("div");
      document.body.appendChild(element1);
      document.body.appendChild(element2);

      const handler1 = vi.fn();
      const handler2 = vi.fn();

      renderHook(() => {
        useEventListener("click", handler1, element1);
        useEventListener("click", handler2, element2);
      });

      element1.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).not.toHaveBeenCalled();

      document.body.removeChild(element1);
      document.body.removeChild(element2);
    });
  });

  describe("event type inference", () => {
    it("should work with keyboard events", () => {
      const handler = vi.fn();
      const documentAddSpy = vi.spyOn(document, "addEventListener");

      renderHook(() => useEventListener("keydown", handler, document));

      expect(documentAddSpy).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function),
        expect.any(Object)
      );

      const keyEvent = new KeyboardEvent("keydown", { key: "Escape" });
      document.dispatchEvent(keyEvent);

      expect(handler).toHaveBeenCalledWith(keyEvent);
    });

    it("should work with mouse events", () => {
      const handler = vi.fn();

      renderHook(() => useEventListener("click", handler, document));

      const mouseEvent = new MouseEvent("click", {
        clientX: 100,
        clientY: 200,
      });
      document.dispatchEvent(mouseEvent);

      expect(handler).toHaveBeenCalledWith(mouseEvent);
    });

    it("should work with focus events", () => {
      const element = document.createElement("input");
      document.body.appendChild(element);
      const handler = vi.fn();

      renderHook(() => useEventListener("focus", handler, element));

      element.dispatchEvent(new FocusEvent("focus"));

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(element);
    });
  });

  describe("edge cases", () => {
    it("should handle rapid enable/disable toggling", () => {
      const handler = vi.fn();

      const { rerender } = renderHook(
        ({ enabled }) =>
          useEventListener("resize", handler, window, { enabled }),
        { initialProps: { enabled: true } }
      );

      rerender({ enabled: false });
      rerender({ enabled: true });
      rerender({ enabled: false });
      rerender({ enabled: true });

      window.dispatchEvent(new Event("resize"));

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should handle event name changes", () => {
      const handler = vi.fn();

      const { rerender } = renderHook(
        ({ eventName }: { eventName: keyof WindowEventMap }) =>
          useEventListener(eventName, handler),
        { initialProps: { eventName: "resize" as keyof WindowEventMap } }
      );

      window.dispatchEvent(new Event("resize"));
      expect(handler).toHaveBeenCalledTimes(1);

      rerender({ eventName: "scroll" as keyof WindowEventMap });

      window.dispatchEvent(new Event("resize"));
      expect(handler).toHaveBeenCalledTimes(1); // Still 1, resize no longer listened

      window.dispatchEvent(new Event("scroll"));
      expect(handler).toHaveBeenCalledTimes(2);
    });
  });
});
