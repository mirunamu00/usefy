import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { useOnClickOutside } from "./useOnClickOutside";

describe("useOnClickOutside", () => {
  let container: HTMLDivElement;
  let targetElement: HTMLDivElement;
  let outsideElement: HTMLDivElement;

  beforeEach(() => {
    // Create DOM elements for testing
    container = document.createElement("div");
    targetElement = document.createElement("div");
    targetElement.setAttribute("data-testid", "target");
    outsideElement = document.createElement("div");
    outsideElement.setAttribute("data-testid", "outside");

    container.appendChild(targetElement);
    container.appendChild(outsideElement);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("should register event listeners with default options", () => {
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");
      const handler = vi.fn();
      const ref = { current: targetElement };

      renderHook(() => useOnClickOutside(ref, handler));

      // Should register mousedown and touchstart with capture: true
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "mousedown",
        expect.any(Function),
        { capture: true }
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "touchstart",
        expect.any(Function),
        { capture: true }
      );
    });

    it("should not register listeners when enabled is false", () => {
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");
      const handler = vi.fn();
      const ref = { current: targetElement };

      renderHook(() => useOnClickOutside(ref, handler, { enabled: false }));

      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });
  });

  describe("outside click detection", () => {
    it("should call handler when clicking outside the target element", () => {
      const handler = vi.fn();
      const ref = { current: targetElement };

      renderHook(() => useOnClickOutside(ref, handler));

      // Dispatch mousedown on outside element
      const event = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
      });
      outsideElement.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(event);
    });

    it("should not call handler when clicking inside the target element", () => {
      const handler = vi.fn();
      const ref = { current: targetElement };

      renderHook(() => useOnClickOutside(ref, handler));

      const event = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
      });
      targetElement.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();
    });

    it("should not call handler when clicking on nested element inside target", () => {
      const handler = vi.fn();
      const nestedElement = document.createElement("span");
      targetElement.appendChild(nestedElement);
      const ref = { current: targetElement };

      renderHook(() => useOnClickOutside(ref, handler));

      const event = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
      });
      nestedElement.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();
    });

    it("should pass the event object to the handler", () => {
      const handler = vi.fn();
      const ref = { current: targetElement };

      renderHook(() => useOnClickOutside(ref, handler));

      const event = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 200,
      });
      outsideElement.dispatchEvent(event);

      const receivedEvent = handler.mock.calls[0][0] as MouseEvent;
      expect(receivedEvent.clientX).toBe(100);
      expect(receivedEvent.clientY).toBe(200);
    });
  });

  describe("multiple refs support", () => {
    it("should not trigger handler when clicking inside any of the refs", () => {
      const handler = vi.fn();
      const anotherElement = document.createElement("div");
      container.appendChild(anotherElement);

      const ref1 = { current: targetElement };
      const ref2 = { current: anotherElement };

      renderHook(() => useOnClickOutside([ref1, ref2], handler));

      // Click on first ref
      targetElement.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );
      expect(handler).not.toHaveBeenCalled();

      // Click on second ref
      anotherElement.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it("should trigger handler when clicking outside all refs", () => {
      const handler = vi.fn();
      const anotherElement = document.createElement("div");
      container.appendChild(anotherElement);

      const ref1 = { current: targetElement };
      const ref2 = { current: anotherElement };

      renderHook(() => useOnClickOutside([ref1, ref2], handler));

      outsideElement.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should handle empty array of refs", () => {
      const handler = vi.fn();

      renderHook(() => useOnClickOutside([], handler));

      outsideElement.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("exclude refs", () => {
    it("should not call handler when clicking on excluded element", () => {
      const handler = vi.fn();
      const excludedElement = document.createElement("button");
      container.appendChild(excludedElement);

      const ref = { current: targetElement };
      const excludeRef = { current: excludedElement };

      renderHook(() =>
        useOnClickOutside(ref, handler, { excludeRefs: [excludeRef] })
      );

      excludedElement.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it("should call handler when clicking outside target and excluded elements", () => {
      const handler = vi.fn();
      const excludedElement = document.createElement("button");
      container.appendChild(excludedElement);

      const ref = { current: targetElement };
      const excludeRef = { current: excludedElement };

      renderHook(() =>
        useOnClickOutside(ref, handler, { excludeRefs: [excludeRef] })
      );

      outsideElement.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple exclude refs", () => {
      const handler = vi.fn();
      const excludedElement1 = document.createElement("button");
      const excludedElement2 = document.createElement("button");
      container.appendChild(excludedElement1);
      container.appendChild(excludedElement2);

      const ref = { current: targetElement };
      const excludeRef1 = { current: excludedElement1 };
      const excludeRef2 = { current: excludedElement2 };

      renderHook(() =>
        useOnClickOutside(ref, handler, {
          excludeRefs: [excludeRef1, excludeRef2],
        })
      );

      excludedElement1.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );
      excludedElement2.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("shouldExclude function", () => {
    it("should not call handler when shouldExclude returns true", () => {
      const handler = vi.fn();
      const ref = { current: targetElement };

      renderHook(() =>
        useOnClickOutside(ref, handler, {
          shouldExclude: (target) =>
            (target as Element).getAttribute("data-testid") === "outside",
        })
      );

      outsideElement.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it("should call handler when shouldExclude returns false", () => {
      const handler = vi.fn();
      const ref = { current: targetElement };

      renderHook(() =>
        useOnClickOutside(ref, handler, {
          shouldExclude: () => false,
        })
      );

      outsideElement.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should work with closest selector in shouldExclude", () => {
      const handler = vi.fn();
      outsideElement.classList.add("ignore-click");
      const ref = { current: targetElement };

      renderHook(() =>
        useOnClickOutside(ref, handler, {
          shouldExclude: (target) =>
            (target as Element).closest?.(".ignore-click") !== null,
        })
      );

      outsideElement.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );
      expect(handler).not.toHaveBeenCalled();

      outsideElement.classList.remove("ignore-click");
    });
  });

  describe("enabled option", () => {
    it("should not call handler when enabled is false", () => {
      const handler = vi.fn();
      const ref = { current: targetElement };

      renderHook(() => useOnClickOutside(ref, handler, { enabled: false }));

      outsideElement.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it("should add listener when enabled changes from false to true", () => {
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");
      const handler = vi.fn();
      const ref = { current: targetElement };

      const { rerender } = renderHook(
        ({ enabled }) => useOnClickOutside(ref, handler, { enabled }),
        { initialProps: { enabled: false } }
      );

      expect(addEventListenerSpy).not.toHaveBeenCalled();

      rerender({ enabled: true });

      expect(addEventListenerSpy).toHaveBeenCalled();
    });

    it("should remove listener when enabled changes from true to false", () => {
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
      const handler = vi.fn();
      const ref = { current: targetElement };

      const { rerender } = renderHook(
        ({ enabled }) => useOnClickOutside(ref, handler, { enabled }),
        { initialProps: { enabled: true } }
      );

      rerender({ enabled: false });

      expect(removeEventListenerSpy).toHaveBeenCalled();
    });
  });

  describe("event type options", () => {
    it("should use custom mouse event type", () => {
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");
      const handler = vi.fn();
      const ref = { current: targetElement };

      renderHook(() =>
        useOnClickOutside(ref, handler, { eventType: "click" })
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "click",
        expect.any(Function),
        { capture: true }
      );
    });

    it("should use custom touch event type", () => {
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");
      const handler = vi.fn();
      const ref = { current: targetElement };

      renderHook(() =>
        useOnClickOutside(ref, handler, { touchEventType: "touchend" })
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "touchend",
        expect.any(Function),
        { capture: true }
      );
    });

    it("should not register touch listener when detectTouch is false", () => {
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");
      const handler = vi.fn();
      const ref = { current: targetElement };

      renderHook(() =>
        useOnClickOutside(ref, handler, { detectTouch: false })
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "mousedown",
        expect.any(Function),
        { capture: true }
      );
      expect(addEventListenerSpy).not.toHaveBeenCalledWith(
        "touchstart",
        expect.any(Function),
        expect.any(Object)
      );
    });

    it("should respond to touch events when detectTouch is true", () => {
      const handler = vi.fn();
      const ref = { current: targetElement };

      renderHook(() => useOnClickOutside(ref, handler, { detectTouch: true }));

      const touchEvent = new TouchEvent("touchstart", {
        bubbles: true,
        cancelable: true,
      });
      outsideElement.dispatchEvent(touchEvent);

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("capture option", () => {
    it("should use capture phase by default", () => {
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");
      const handler = vi.fn();
      const ref = { current: targetElement };

      renderHook(() => useOnClickOutside(ref, handler));

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "mousedown",
        expect.any(Function),
        { capture: true }
      );
    });

    it("should use bubbling phase when capture is false", () => {
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");
      const handler = vi.fn();
      const ref = { current: targetElement };

      renderHook(() => useOnClickOutside(ref, handler, { capture: false }));

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "mousedown",
        expect.any(Function),
        { capture: false }
      );
    });

    it("should remove listener with correct capture option", () => {
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
      const handler = vi.fn();
      const ref = { current: targetElement };

      const { unmount } = renderHook(() =>
        useOnClickOutside(ref, handler, { capture: true })
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "mousedown",
        expect.any(Function),
        { capture: true }
      );
    });
  });

  describe("cleanup", () => {
    it("should remove all event listeners on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
      const handler = vi.fn();
      const ref = { current: targetElement };

      const { unmount } = renderHook(() => useOnClickOutside(ref, handler));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "mousedown",
        expect.any(Function),
        { capture: true }
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "touchstart",
        expect.any(Function),
        { capture: true }
      );
    });

    it("should not call handler after unmount", () => {
      const handler = vi.fn();
      const ref = { current: targetElement };

      const { unmount } = renderHook(() => useOnClickOutside(ref, handler));

      unmount();

      outsideElement.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("handler stability", () => {
    it("should not re-register listeners when handler changes", () => {
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const ref = { current: targetElement };

      const { rerender } = renderHook(
        ({ handler }) => useOnClickOutside(ref, handler),
        { initialProps: { handler: handler1 } }
      );

      const initialCallCount = addEventListenerSpy.mock.calls.length;

      rerender({ handler: handler2 });

      // Handler change should not trigger re-registration
      expect(addEventListenerSpy.mock.calls.length).toBe(initialCallCount);
    });

    it("should call the latest handler after update", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const ref = { current: targetElement };

      const { rerender } = renderHook(
        ({ handler }) => useOnClickOutside(ref, handler),
        { initialProps: { handler: handler1 } }
      );

      // First click
      outsideElement.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).not.toHaveBeenCalled();

      // Update handler
      rerender({ handler: handler2 });

      // Second click - should call new handler
      outsideElement.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );
      expect(handler1).toHaveBeenCalledTimes(1); // Still 1
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe("multiple instances", () => {
    it("should work independently with multiple hook instances", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const element1 = document.createElement("div");
      const element2 = document.createElement("div");
      container.appendChild(element1);
      container.appendChild(element2);

      const ref1 = { current: element1 };
      const ref2 = { current: element2 };

      renderHook(() => useOnClickOutside(ref1, handler1));
      renderHook(() => useOnClickOutside(ref2, handler2));

      // Click on element1 - should only trigger handler2
      element1.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);

      // Click on outsideElement - should trigger both handlers
      outsideElement.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(2);
    });

    it("should handle different options independently", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const ref1 = { current: targetElement };
      const ref2 = { current: outsideElement };

      renderHook(() => useOnClickOutside(ref1, handler1, { enabled: true }));
      renderHook(() => useOnClickOutside(ref2, handler2, { enabled: false }));

      document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe("options changes", () => {
    it("should re-register listener when capture changes", () => {
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
      const handler = vi.fn();
      const ref = { current: targetElement };

      const { rerender } = renderHook(
        ({ capture }) => useOnClickOutside(ref, handler, { capture }),
        { initialProps: { capture: true } }
      );

      const initialAddCalls = addEventListenerSpy.mock.calls.length;

      rerender({ capture: false });

      expect(removeEventListenerSpy).toHaveBeenCalled();
      expect(addEventListenerSpy.mock.calls.length).toBeGreaterThan(
        initialAddCalls
      );
    });

    it("should re-register listener when eventType changes", () => {
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");
      const handler = vi.fn();
      const ref = { current: targetElement };

      type EventType = "mousedown" | "click";

      const { rerender } = renderHook(
        ({ eventType }: { eventType: EventType }) =>
          useOnClickOutside(ref, handler, { eventType }),
        { initialProps: { eventType: "mousedown" as EventType } }
      );

      rerender({ eventType: "click" });

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "click",
        expect.any(Function),
        { capture: true }
      );
    });
  });

  describe("edge cases", () => {
    it("should handle null ref gracefully", () => {
      const handler = vi.fn();
      const ref: React.RefObject<HTMLDivElement | null> = { current: null };

      renderHook(() => useOnClickOutside(ref, handler));

      // Should trigger handler when ref is null (everything is "outside")
      outsideElement.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should handle rapid option toggles", () => {
      const handler = vi.fn();
      const ref = { current: targetElement };

      const { rerender } = renderHook(
        ({ enabled }) => useOnClickOutside(ref, handler, { enabled }),
        { initialProps: { enabled: true } }
      );

      rerender({ enabled: false });
      rerender({ enabled: true });
      rerender({ enabled: false });
      rerender({ enabled: true });

      outsideElement.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should not trigger on disconnected elements", () => {
      const handler = vi.fn();
      const ref = { current: targetElement };

      renderHook(() => useOnClickOutside(ref, handler));

      const disconnectedElement = document.createElement("div");
      // This element is not connected to the DOM

      const event = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, "target", {
        value: disconnectedElement,
        writable: false,
      });
      document.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();
    });

    it("should handle multiple clicks correctly", () => {
      const handler = vi.fn();
      const ref = { current: targetElement };

      renderHook(() => useOnClickOutside(ref, handler));

      outsideElement.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );
      outsideElement.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );
      outsideElement.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      );

      expect(handler).toHaveBeenCalledTimes(3);
    });
  });

  describe("custom eventTarget", () => {
    it("should use custom event target when provided", () => {
      const handler = vi.fn();
      const ref = { current: targetElement };
      const customTarget = document.createElement("div");
      const customTargetAddSpy = vi.spyOn(customTarget, "addEventListener");

      renderHook(() =>
        useOnClickOutside(ref, handler, { eventTarget: customTarget })
      );

      expect(customTargetAddSpy).toHaveBeenCalledWith(
        "mousedown",
        expect.any(Function),
        { capture: true }
      );
    });
  });
});
