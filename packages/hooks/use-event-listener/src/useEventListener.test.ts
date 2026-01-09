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

  describe("touch events", () => {
    it("should handle touchstart event", () => {
      const element = document.createElement("div");
      document.body.appendChild(element);
      const handler = vi.fn();

      renderHook(() => useEventListener("touchstart", handler, element));

      const touchEvent = new TouchEvent("touchstart", {
        bubbles: true,
        touches: [],
      });
      element.dispatchEvent(touchEvent);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(touchEvent);

      document.body.removeChild(element);
    });

    it("should handle touchmove event with passive option", () => {
      const element = document.createElement("div");
      const elementAddSpy = vi.spyOn(element, "addEventListener");
      const handler = vi.fn();

      renderHook(() =>
        useEventListener("touchmove", handler, element, { passive: true })
      );

      expect(elementAddSpy).toHaveBeenCalledWith(
        "touchmove",
        expect.any(Function),
        expect.objectContaining({ passive: true })
      );
    });

    it("should handle touchend event", () => {
      const element = document.createElement("div");
      document.body.appendChild(element);
      const handler = vi.fn();

      renderHook(() => useEventListener("touchend", handler, element));

      element.dispatchEvent(new TouchEvent("touchend", { bubbles: true }));

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(element);
    });
  });

  describe("pointer events", () => {
    it("should handle pointerdown event", () => {
      const element = document.createElement("div");
      document.body.appendChild(element);
      const handler = vi.fn();

      renderHook(() => useEventListener("pointerdown", handler, element));

      const pointerEvent = new PointerEvent("pointerdown", {
        bubbles: true,
        pointerId: 1,
        pointerType: "mouse",
      });
      element.dispatchEvent(pointerEvent);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(pointerEvent);

      document.body.removeChild(element);
    });

    it("should handle pointermove event", () => {
      const element = document.createElement("div");
      document.body.appendChild(element);
      const handler = vi.fn();

      renderHook(() => useEventListener("pointermove", handler, element));

      element.dispatchEvent(
        new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" })
      );

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(element);
    });

    it("should handle pointerup event", () => {
      const element = document.createElement("div");
      document.body.appendChild(element);
      const handler = vi.fn();

      renderHook(() => useEventListener("pointerup", handler, element));

      element.dispatchEvent(
        new PointerEvent("pointerup", { bubbles: true, pointerType: "touch" })
      );

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(element);
    });
  });

  describe("drag events", () => {
    it("should handle dragstart event", () => {
      const element = document.createElement("div");
      document.body.appendChild(element);
      const handler = vi.fn();

      renderHook(() => useEventListener("dragstart", handler, element));

      // jsdom doesn't support DragEvent, use Event as fallback
      const dragEvent = new Event("dragstart", { bubbles: true });
      element.dispatchEvent(dragEvent);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(dragEvent);

      document.body.removeChild(element);
    });

    it("should handle dragover event", () => {
      const element = document.createElement("div");
      document.body.appendChild(element);
      const handler = vi.fn();

      renderHook(() => useEventListener("dragover", handler, element));

      element.dispatchEvent(new Event("dragover", { bubbles: true }));

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(element);
    });

    it("should handle drop event", () => {
      const element = document.createElement("div");
      document.body.appendChild(element);
      const handler = vi.fn();

      renderHook(() => useEventListener("drop", handler, element));

      element.dispatchEvent(new Event("drop", { bubbles: true }));

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(element);
    });

    it("should handle dragend event", () => {
      const element = document.createElement("div");
      document.body.appendChild(element);
      const handler = vi.fn();

      renderHook(() => useEventListener("dragend", handler, element));

      element.dispatchEvent(new Event("dragend", { bubbles: true }));

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(element);
    });
  });

  describe("form events", () => {
    it("should handle input event", () => {
      const element = document.createElement("input");
      document.body.appendChild(element);
      const handler = vi.fn();

      renderHook(() => useEventListener("input", handler, element));

      const inputEvent = new InputEvent("input", { bubbles: true });
      element.dispatchEvent(inputEvent);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(inputEvent);

      document.body.removeChild(element);
    });

    it("should handle change event", () => {
      const element = document.createElement("input");
      document.body.appendChild(element);
      const handler = vi.fn();

      renderHook(() => useEventListener("change", handler, element));

      element.dispatchEvent(new Event("change", { bubbles: true }));

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(element);
    });

    it("should handle submit event", () => {
      const form = document.createElement("form");
      document.body.appendChild(form);
      const handler = vi.fn((e: Event) => e.preventDefault());

      renderHook(() => useEventListener("submit", handler, form));

      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(form);
    });
  });

  describe("clipboard events", () => {
    it("should handle copy event", () => {
      const handler = vi.fn();
      const documentAddSpy = vi.spyOn(document, "addEventListener");

      renderHook(() => useEventListener("copy", handler, document));

      expect(documentAddSpy).toHaveBeenCalledWith(
        "copy",
        expect.any(Function),
        expect.any(Object)
      );

      // jsdom doesn't support ClipboardEvent, use Event as fallback
      document.dispatchEvent(new Event("copy", { bubbles: true }));

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should handle paste event", () => {
      const element = document.createElement("input");
      document.body.appendChild(element);
      const handler = vi.fn();

      renderHook(() => useEventListener("paste", handler, element));

      element.dispatchEvent(new Event("paste", { bubbles: true }));

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(element);
    });

    it("should handle cut event", () => {
      const handler = vi.fn();

      renderHook(() => useEventListener("cut", handler, document));

      document.dispatchEvent(new Event("cut", { bubbles: true }));

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("visibility and focus events", () => {
    it("should handle visibilitychange event", () => {
      const handler = vi.fn();
      const documentAddSpy = vi.spyOn(document, "addEventListener");

      renderHook(() => useEventListener("visibilitychange", handler, document));

      expect(documentAddSpy).toHaveBeenCalledWith(
        "visibilitychange",
        expect.any(Function),
        expect.any(Object)
      );
    });

    it("should handle blur event on element", () => {
      const element = document.createElement("input");
      document.body.appendChild(element);
      const handler = vi.fn();

      renderHook(() => useEventListener("blur", handler, element));

      element.dispatchEvent(new FocusEvent("blur"));

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(element);
    });

    it("should handle focusin event (bubbles)", () => {
      const element = document.createElement("div");
      const input = document.createElement("input");
      element.appendChild(input);
      document.body.appendChild(element);
      const handler = vi.fn();

      renderHook(() => useEventListener("focusin", handler, element));

      input.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(element);
    });

    it("should handle focusout event (bubbles)", () => {
      const element = document.createElement("div");
      const input = document.createElement("input");
      element.appendChild(input);
      document.body.appendChild(element);
      const handler = vi.fn();

      renderHook(() => useEventListener("focusout", handler, element));

      input.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(element);
    });
  });

  describe("mouse events - advanced", () => {
    it("should handle dblclick event", () => {
      const element = document.createElement("div");
      document.body.appendChild(element);
      const handler = vi.fn();

      renderHook(() => useEventListener("dblclick", handler, element));

      element.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(element);
    });

    it("should handle contextmenu event", () => {
      const element = document.createElement("div");
      document.body.appendChild(element);
      const handler = vi.fn((e: Event) => e.preventDefault());

      renderHook(() => useEventListener("contextmenu", handler, element));

      element.dispatchEvent(
        new MouseEvent("contextmenu", { bubbles: true, cancelable: true })
      );

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(element);
    });

    it("should handle mouseenter event", () => {
      const element = document.createElement("div");
      document.body.appendChild(element);
      const handler = vi.fn();

      renderHook(() => useEventListener("mouseenter", handler, element));

      element.dispatchEvent(new MouseEvent("mouseenter"));

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(element);
    });

    it("should handle mouseleave event", () => {
      const element = document.createElement("div");
      document.body.appendChild(element);
      const handler = vi.fn();

      renderHook(() => useEventListener("mouseleave", handler, element));

      element.dispatchEvent(new MouseEvent("mouseleave"));

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(element);
    });

    it("should handle wheel event", () => {
      const element = document.createElement("div");
      document.body.appendChild(element);
      const handler = vi.fn();

      renderHook(() =>
        useEventListener("wheel", handler, element, { passive: true })
      );

      element.dispatchEvent(
        new WheelEvent("wheel", { bubbles: true, deltaY: 100 })
      );

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(element);
    });
  });

  describe("window events", () => {
    it("should handle beforeunload event", () => {
      const handler = vi.fn();

      renderHook(() => useEventListener("beforeunload", handler));

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "beforeunload",
        expect.any(Function),
        expect.any(Object)
      );
    });

    it("should handle hashchange event", () => {
      const handler = vi.fn();

      renderHook(() => useEventListener("hashchange", handler));

      window.dispatchEvent(new HashChangeEvent("hashchange"));

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should handle popstate event", () => {
      const handler = vi.fn();

      renderHook(() => useEventListener("popstate", handler));

      window.dispatchEvent(new PopStateEvent("popstate"));

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should handle storage event", () => {
      const handler = vi.fn();

      renderHook(() => useEventListener("storage", handler));

      window.dispatchEvent(new StorageEvent("storage"));

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("animation and transition events", () => {
    it("should handle animationstart event", () => {
      const element = document.createElement("div");
      document.body.appendChild(element);
      const handler = vi.fn();

      renderHook(() => useEventListener("animationstart", handler, element));

      // jsdom doesn't support AnimationEvent, use Event as fallback
      element.dispatchEvent(new Event("animationstart", { bubbles: true }));

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(element);
    });

    it("should handle animationend event", () => {
      const element = document.createElement("div");
      document.body.appendChild(element);
      const handler = vi.fn();

      renderHook(() => useEventListener("animationend", handler, element));

      element.dispatchEvent(new Event("animationend", { bubbles: true }));

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(element);
    });

    it("should handle transitionstart event", () => {
      const element = document.createElement("div");
      document.body.appendChild(element);
      const handler = vi.fn();

      renderHook(() => useEventListener("transitionstart", handler, element));

      element.dispatchEvent(
        new TransitionEvent("transitionstart", { propertyName: "opacity" })
      );

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(element);
    });

    it("should handle transitionend event", () => {
      const element = document.createElement("div");
      document.body.appendChild(element);
      const handler = vi.fn();

      renderHook(() => useEventListener("transitionend", handler, element));

      element.dispatchEvent(
        new TransitionEvent("transitionend", { propertyName: "opacity" })
      );

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(element);
    });
  });

  describe("custom events", () => {
    it("should handle custom events", () => {
      const element = document.createElement("div");
      document.body.appendChild(element);
      const handler = vi.fn();

      renderHook(() => useEventListener("myCustomEvent", handler, element));

      const customEvent = new CustomEvent("myCustomEvent", {
        bubbles: true,
        detail: { foo: "bar" },
      });
      element.dispatchEvent(customEvent);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(customEvent);

      document.body.removeChild(element);
    });

    it("should handle custom events on document", () => {
      const handler = vi.fn();

      renderHook(() => useEventListener("app:initialized", handler, document));

      const customEvent = new CustomEvent("app:initialized", {
        detail: { version: "1.0.0" },
      });
      document.dispatchEvent(customEvent);

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("media events", () => {
    it("should handle play event on video element", () => {
      const video = document.createElement("video");
      document.body.appendChild(video);
      const handler = vi.fn();

      renderHook(() => useEventListener("play", handler, video));

      video.dispatchEvent(new Event("play"));

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(video);
    });

    it("should handle pause event on audio element", () => {
      const audio = document.createElement("audio");
      document.body.appendChild(audio);
      const handler = vi.fn();

      renderHook(() => useEventListener("pause", handler, audio));

      audio.dispatchEvent(new Event("pause"));

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(audio);
    });

    it("should handle ended event", () => {
      const video = document.createElement("video");
      document.body.appendChild(video);
      const handler = vi.fn();

      renderHook(() => useEventListener("ended", handler, video));

      video.dispatchEvent(new Event("ended"));

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(video);
    });

    it("should handle loadeddata event", () => {
      const video = document.createElement("video");
      document.body.appendChild(video);
      const handler = vi.fn();

      renderHook(() => useEventListener("loadeddata", handler, video));

      video.dispatchEvent(new Event("loadeddata"));

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(video);
    });
  });

  describe("error events", () => {
    it("should handle error event on window", () => {
      const handler = vi.fn();

      renderHook(() => useEventListener("error", handler));

      window.dispatchEvent(new ErrorEvent("error", { message: "Test error" }));

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should handle error event on image element", () => {
      const img = document.createElement("img");
      document.body.appendChild(img);
      const handler = vi.fn();

      renderHook(() => useEventListener("error", handler, img));

      img.dispatchEvent(new Event("error"));

      expect(handler).toHaveBeenCalledTimes(1);

      document.body.removeChild(img);
    });
  });
});
