import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useHover } from "./useHover";
import * as utils from "./utils";
import { isHoverSupported, normalizeDelay, createNoopRef } from "./utils";

describe("useHover", () => {
  let container: HTMLDivElement;
  let targetElement: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    targetElement = document.createElement("div");
    targetElement.setAttribute("data-testid", "target");
    container.appendChild(targetElement);
    document.body.appendChild(container);
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ============ Initialization Tests ============
  describe("initialization", () => {
    it("should return ref and isHovered: false by default", () => {
      const { result } = renderHook(() => useHover());

      expect(result.current.ref).toBeInstanceOf(Function);
      expect(result.current.isHovered).toBe(false);
    });

    it("should return initial hover state when initialHovered is true", () => {
      const { result } = renderHook(() =>
        useHover({ initialHovered: true })
      );

      expect(result.current.isHovered).toBe(true);
    });

    it("should provide stable ref callback across renders", () => {
      const { result, rerender } = renderHook(() => useHover());

      const initialRef = result.current.ref;

      rerender();

      expect(result.current.ref).toBe(initialRef);
    });

    it("should handle undefined options", () => {
      const { result } = renderHook(() => useHover(undefined));

      expect(result.current.isHovered).toBe(false);
      expect(result.current.ref).toBeInstanceOf(Function);
    });

    it("should handle empty options object", () => {
      const { result } = renderHook(() => useHover({}));

      expect(result.current.isHovered).toBe(false);
      expect(result.current.ref).toBeInstanceOf(Function);
    });

    it("should support tuple destructuring", () => {
      const { result } = renderHook(() => useHover());

      const [ref, isHovered] = result.current;

      expect(ref).toBeInstanceOf(Function);
      expect(isHovered).toBe(false);
    });

    it("should support object destructuring", () => {
      const { result } = renderHook(() => useHover());

      const { ref, isHovered } = result.current;

      expect(ref).toBeInstanceOf(Function);
      expect(isHovered).toBe(false);
    });

    it("should return iterator that yields ref then isHovered", () => {
      const { result } = renderHook(() => useHover());

      const iterator = result.current[Symbol.iterator]();

      expect(iterator.next().value).toBe(result.current.ref);
      expect(iterator.next().value).toBe(result.current.isHovered);
      expect(iterator.next().done).toBe(true);
    });
  });

  // ============ Hover Detection Tests ============
  describe("hover detection", () => {
    it("should set isHovered to true on mouseenter", () => {
      const { result } = renderHook(() => useHover());

      act(() => {
        result.current.ref(targetElement);
      });

      expect(result.current.isHovered).toBe(false);

      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      expect(result.current.isHovered).toBe(true);
    });

    it("should set isHovered to false on mouseleave", () => {
      const { result } = renderHook(() => useHover());

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      expect(result.current.isHovered).toBe(true);

      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseleave", { bubbles: true })
        );
      });

      expect(result.current.isHovered).toBe(false);
    });

    it("should handle rapid mouseenter/mouseleave", () => {
      const { result } = renderHook(() => useHover());

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
        targetElement.dispatchEvent(
          new MouseEvent("mouseleave", { bubbles: true })
        );
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
        targetElement.dispatchEvent(
          new MouseEvent("mouseleave", { bubbles: true })
        );
      });

      expect(result.current.isHovered).toBe(false);
    });

    it("should call onChange callback with correct arguments", () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useHover({ onChange }));

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(true, expect.any(MouseEvent));

      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseleave", { bubbles: true })
        );
      });

      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange).toHaveBeenCalledWith(false, expect.any(MouseEvent));
    });

    it("should pass the event object to onChange", () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useHover({ onChange }));

      act(() => {
        result.current.ref(targetElement);
      });

      const enterEvent = new MouseEvent("mouseenter", {
        bubbles: true,
        clientX: 100,
        clientY: 200,
      });

      act(() => {
        targetElement.dispatchEvent(enterEvent);
      });

      const receivedEvent = onChange.mock.calls[0][1] as MouseEvent;
      expect(receivedEvent.clientX).toBe(100);
      expect(receivedEvent.clientY).toBe(200);
    });
  });

  // ============ Delay Tests ============
  describe("delay", () => {
    it("should delay hover state on mouseenter when enterDelay is set", () => {
      const { result } = renderHook(() =>
        useHover({ delay: { enter: 200 } })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      // Before delay
      expect(result.current.isHovered).toBe(false);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.isHovered).toBe(false);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.isHovered).toBe(true);
    });

    it("should delay hover state on mouseleave when leaveDelay is set", () => {
      const { result } = renderHook(() =>
        useHover({ delay: { leave: 200 } })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      expect(result.current.isHovered).toBe(true);

      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseleave", { bubbles: true })
        );
      });

      // Still true before delay completes
      expect(result.current.isHovered).toBe(true);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.isHovered).toBe(true);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.isHovered).toBe(false);
    });

    it("should handle same delay for enter and leave", () => {
      const { result } = renderHook(() => useHover({ delay: 300 }));

      act(() => {
        result.current.ref(targetElement);
      });

      // Test enter delay
      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      expect(result.current.isHovered).toBe(false);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.isHovered).toBe(true);

      // Test leave delay
      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseleave", { bubbles: true })
        );
      });

      expect(result.current.isHovered).toBe(true);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.isHovered).toBe(false);
    });

    it("should handle different delays for enter and leave", () => {
      const { result } = renderHook(() =>
        useHover({ delay: { enter: 100, leave: 500 } })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      // Enter with 100ms delay
      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.isHovered).toBe(true);

      // Leave with 500ms delay
      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseleave", { bubbles: true })
        );
      });

      act(() => {
        vi.advanceTimersByTime(400);
      });

      expect(result.current.isHovered).toBe(true); // Still true

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.isHovered).toBe(false);
    });

    it("should cancel pending delay on opposite event", () => {
      const { result } = renderHook(() =>
        useHover({ delay: { enter: 200 } })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      // Before delay completes, leave
      act(() => {
        vi.advanceTimersByTime(100);
        targetElement.dispatchEvent(
          new MouseEvent("mouseleave", { bubbles: true })
        );
      });

      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Should remain false because enter was cancelled
      expect(result.current.isHovered).toBe(false);
    });

    it("should cancel pending leave delay on mouseenter", () => {
      const { result } = renderHook(() =>
        useHover({ delay: { leave: 500 } })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      // Enter immediately
      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      expect(result.current.isHovered).toBe(true);

      // Start leaving
      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseleave", { bubbles: true })
        );
      });

      // Re-enter before leave delay completes
      act(() => {
        vi.advanceTimersByTime(200);
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      // Advance past original leave delay
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Should still be hovered because leave was cancelled
      expect(result.current.isHovered).toBe(true);
    });

    it("should handle zero delay (immediate)", () => {
      const { result } = renderHook(() => useHover({ delay: 0 }));

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      expect(result.current.isHovered).toBe(true);
    });

    it("should handle negative delay (treat as 0)", () => {
      const { result } = renderHook(() => useHover({ delay: -100 }));

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      expect(result.current.isHovered).toBe(true);
    });

    it("should call onChange after delay completes", () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useHover({ delay: 200, onChange })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      expect(onChange).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(onChange).toHaveBeenCalledWith(true, expect.any(MouseEvent));
    });
  });

  // ============ Enabled Option Tests ============
  describe("enabled option", () => {
    it("should not attach listeners when disabled", () => {
      const addEventListenerSpy = vi.spyOn(targetElement, "addEventListener");
      const { result } = renderHook(() => useHover({ enabled: false }));

      act(() => {
        result.current.ref(targetElement);
      });

      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });

    it("should not set isHovered when disabled", () => {
      const { result } = renderHook(() => useHover({ enabled: false }));

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      expect(result.current.isHovered).toBe(false);
    });

    it("should start listening when enabled changes to true", () => {
      const addEventListenerSpy = vi.spyOn(targetElement, "addEventListener");
      const { result, rerender } = renderHook(
        ({ enabled }) => useHover({ enabled }),
        { initialProps: { enabled: false } }
      );

      act(() => {
        result.current.ref(targetElement);
      });

      expect(addEventListenerSpy).not.toHaveBeenCalled();

      rerender({ enabled: true });

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "mouseenter",
        expect.any(Function)
      );
    });

    it("should stop listening when enabled changes to false", () => {
      const removeEventListenerSpy = vi.spyOn(
        targetElement,
        "removeEventListener"
      );
      const { result, rerender } = renderHook(
        ({ enabled }) => useHover({ enabled }),
        { initialProps: { enabled: true } }
      );

      act(() => {
        result.current.ref(targetElement);
      });

      rerender({ enabled: false });

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "mouseenter",
        expect.any(Function)
      );
    });

    it("should reset isHovered to false when disabled", () => {
      const { result, rerender } = renderHook(
        ({ enabled }) => useHover({ enabled }),
        { initialProps: { enabled: true } }
      );

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      expect(result.current.isHovered).toBe(true);

      rerender({ enabled: false });

      expect(result.current.isHovered).toBe(false);
    });

    it("should handle rapid enable/disable toggling", () => {
      const { result, rerender } = renderHook(
        ({ enabled }) => useHover({ enabled }),
        { initialProps: { enabled: true } }
      );

      act(() => {
        result.current.ref(targetElement);
      });

      rerender({ enabled: false });
      rerender({ enabled: true });
      rerender({ enabled: false });
      rerender({ enabled: true });

      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      expect(result.current.isHovered).toBe(true);
    });
  });

  // ============ Touch Events Tests ============
  describe("touch events", () => {
    it("should not detect touch by default", () => {
      const addEventListenerSpy = vi.spyOn(targetElement, "addEventListener");
      const { result } = renderHook(() => useHover());

      act(() => {
        result.current.ref(targetElement);
      });

      expect(addEventListenerSpy).not.toHaveBeenCalledWith(
        "touchstart",
        expect.any(Function),
        expect.any(Object)
      );
    });

    it("should detect touchstart as hover when detectTouch is true", () => {
      const { result } = renderHook(() => useHover({ detectTouch: true }));

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        targetElement.dispatchEvent(
          new TouchEvent("touchstart", { bubbles: true })
        );
      });

      expect(result.current.isHovered).toBe(true);
    });

    it("should detect touchend as unhover when detectTouch is true", () => {
      const { result } = renderHook(() => useHover({ detectTouch: true }));

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        targetElement.dispatchEvent(
          new TouchEvent("touchstart", { bubbles: true })
        );
      });

      expect(result.current.isHovered).toBe(true);

      act(() => {
        targetElement.dispatchEvent(
          new TouchEvent("touchend", { bubbles: true })
        );
      });

      expect(result.current.isHovered).toBe(false);
    });

    it("should handle combined mouse and touch events", () => {
      const { result } = renderHook(() => useHover({ detectTouch: true }));

      act(() => {
        result.current.ref(targetElement);
      });

      // Mouse enter
      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      expect(result.current.isHovered).toBe(true);

      // Mouse leave
      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseleave", { bubbles: true })
        );
      });

      expect(result.current.isHovered).toBe(false);

      // Touch start
      act(() => {
        targetElement.dispatchEvent(
          new TouchEvent("touchstart", { bubbles: true })
        );
      });

      expect(result.current.isHovered).toBe(true);
    });

    it("should fire onChange only once for a single hover transition on hybrid devices", () => {
      // Hybrid/touch devices dispatch a touch event AND a synthesized mouse
      // event for one physical interaction. onChange must fire per state
      // transition, not per DOM event.
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useHover({ detectTouch: true, onChange })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        targetElement.dispatchEvent(
          new TouchEvent("touchstart", { bubbles: true })
        );
        // The browser then synthesizes a mouseenter for the same tap.
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      expect(result.current.isHovered).toBe(true);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenNthCalledWith(1, true, expect.any(TouchEvent));

      // Likewise on leave: touchend + synthesized mouseleave = one transition.
      act(() => {
        targetElement.dispatchEvent(
          new TouchEvent("touchend", { bubbles: true })
        );
        targetElement.dispatchEvent(
          new MouseEvent("mouseleave", { bubbles: true })
        );
      });

      expect(result.current.isHovered).toBe(false);
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange).toHaveBeenNthCalledWith(2, false, expect.any(TouchEvent));
    });

    it("should not fire onChange again when already hovered", () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useHover({ onChange }));

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("should add touch listeners with passive option", () => {
      const addEventListenerSpy = vi.spyOn(targetElement, "addEventListener");
      const { result } = renderHook(() => useHover({ detectTouch: true }));

      act(() => {
        result.current.ref(targetElement);
      });

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "touchstart",
        expect.any(Function),
        { passive: true }
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "touchend",
        expect.any(Function),
        { passive: true }
      );
    });
  });

  // ============ Ref Management Tests ============
  describe("ref management", () => {
    it("should handle ref changes", () => {
      const { result } = renderHook(() => useHover());
      const newElement = document.createElement("div");
      container.appendChild(newElement);

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      expect(result.current.isHovered).toBe(true);

      // Change ref to new element
      act(() => {
        result.current.ref(newElement);
      });

      // Old element events should not affect new ref
      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseleave", { bubbles: true })
        );
      });

      // isHovered might still be true until we properly interact with newElement
      // Actually, the old element should have its listeners removed
    });

    it("should handle null ref gracefully", () => {
      const { result } = renderHook(() => useHover());

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      expect(result.current.isHovered).toBe(true);

      act(() => {
        result.current.ref(null);
      });

      // Should not throw
      expect(result.current.ref).toBeInstanceOf(Function);
    });

    it("should clean up listeners on ref change", () => {
      const removeEventListenerSpy = vi.spyOn(
        targetElement,
        "removeEventListener"
      );
      const { result } = renderHook(() => useHover());
      const newElement = document.createElement("div");
      container.appendChild(newElement);

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        result.current.ref(newElement);
      });

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "mouseenter",
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "mouseleave",
        expect.any(Function)
      );
    });

    it("should maintain ref stability", () => {
      const { result, rerender } = renderHook(() => useHover());

      const initialRef = result.current.ref;

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      rerender();

      expect(result.current.ref).toBe(initialRef);
    });
  });

  // ============ Cleanup Tests ============
  describe("cleanup", () => {
    it("should remove event listeners on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(
        targetElement,
        "removeEventListener"
      );
      const { result, unmount } = renderHook(() => useHover());

      act(() => {
        result.current.ref(targetElement);
      });

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "mouseenter",
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "mouseleave",
        expect.any(Function)
      );
    });

    it("should clear timeouts on unmount", () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
      const { result, unmount } = renderHook(() =>
        useHover({ delay: 1000 })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it("should not call onChange after unmount", () => {
      const onChange = vi.fn();
      const { result, unmount } = renderHook(() =>
        useHover({ delay: 200, onChange })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      unmount();

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(onChange).not.toHaveBeenCalled();
    });

    it("should handle multiple mount/unmount cycles", () => {
      const { result: result1, unmount: unmount1 } = renderHook(() =>
        useHover()
      );

      act(() => {
        result1.current.ref(targetElement);
      });

      unmount1();

      const { result: result2 } = renderHook(() => useHover());

      act(() => {
        result2.current.ref(targetElement);
      });

      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      expect(result2.current.isHovered).toBe(true);
    });
  });

  // ============ Edge Cases ============
  describe("edge cases", () => {
    it("should handle SVG elements", () => {
      const svgElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      container.appendChild(svgElement);

      const { result } = renderHook(() =>
        useHover<SVGSVGElement>()
      );

      act(() => {
        result.current.ref(svgElement as unknown as SVGSVGElement);
      });

      act(() => {
        svgElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      expect(result.current.isHovered).toBe(true);
    });

    it("should handle elements with zero dimensions", () => {
      targetElement.style.width = "0";
      targetElement.style.height = "0";

      const { result } = renderHook(() => useHover());

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      expect(result.current.isHovered).toBe(true);
    });

    it("should handle hidden elements", () => {
      targetElement.style.display = "none";

      const { result } = renderHook(() => useHover());

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      expect(result.current.isHovered).toBe(true);
    });

    it("should handle very large delay values", () => {
      const { result } = renderHook(() =>
        useHover({ delay: 999999 })
      );

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      expect(result.current.isHovered).toBe(false);

      act(() => {
        vi.advanceTimersByTime(999999);
      });

      expect(result.current.isHovered).toBe(true);
    });
  });

  // ============ Multiple Instances ============
  describe("multiple instances", () => {
    it("should maintain separate state for multiple hooks", () => {
      const element1 = document.createElement("div");
      const element2 = document.createElement("div");
      container.appendChild(element1);
      container.appendChild(element2);

      const { result: result1 } = renderHook(() => useHover());
      const { result: result2 } = renderHook(() => useHover());

      act(() => {
        result1.current.ref(element1);
        result2.current.ref(element2);
      });

      act(() => {
        element1.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      expect(result1.current.isHovered).toBe(true);
      expect(result2.current.isHovered).toBe(false);

      act(() => {
        element2.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      expect(result1.current.isHovered).toBe(true);
      expect(result2.current.isHovered).toBe(true);
    });

    it("should handle different options independently", () => {
      const element1 = document.createElement("div");
      const element2 = document.createElement("div");
      container.appendChild(element1);
      container.appendChild(element2);

      const { result: result1 } = renderHook(() =>
        useHover({ delay: 100 })
      );
      const { result: result2 } = renderHook(() =>
        useHover({ delay: 500 })
      );

      act(() => {
        result1.current.ref(element1);
        result2.current.ref(element2);
      });

      act(() => {
        element1.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
        element2.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result1.current.isHovered).toBe(true);
      expect(result2.current.isHovered).toBe(false);

      act(() => {
        vi.advanceTimersByTime(400);
      });

      expect(result1.current.isHovered).toBe(true);
      expect(result2.current.isHovered).toBe(true);
    });
  });

  // ============ Function Reference Stability ============
  describe("function reference stability", () => {
    it("should maintain stable ref callback", () => {
      const { result, rerender } = renderHook(() => useHover());

      const initialRef = result.current.ref;

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      rerender();

      expect(result.current.ref).toBe(initialRef);
    });

    it("should not re-register on onChange change", () => {
      const addEventListenerSpy = vi.spyOn(targetElement, "addEventListener");
      const onChange1 = vi.fn();
      const onChange2 = vi.fn();

      const { result, rerender } = renderHook(
        ({ onChange }) => useHover({ onChange }),
        { initialProps: { onChange: onChange1 } }
      );

      act(() => {
        result.current.ref(targetElement);
      });

      const initialCallCount = addEventListenerSpy.mock.calls.length;

      rerender({ onChange: onChange2 });

      // Should not have added more listeners
      expect(addEventListenerSpy.mock.calls.length).toBe(initialCallCount);
    });

    it("should call updated onChange after change", () => {
      const onChange1 = vi.fn();
      const onChange2 = vi.fn();

      const { result, rerender } = renderHook(
        ({ onChange }) => useHover({ onChange }),
        { initialProps: { onChange: onChange1 } }
      );

      act(() => {
        result.current.ref(targetElement);
      });

      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });

      expect(onChange1).toHaveBeenCalledTimes(1);
      expect(onChange2).not.toHaveBeenCalled();

      rerender({ onChange: onChange2 });

      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseleave", { bubbles: true })
        );
      });

      expect(onChange1).toHaveBeenCalledTimes(1);
      expect(onChange2).toHaveBeenCalledTimes(1);
    });
  });

  // ============ SSR / Unsupported Environment ============
  describe("SSR / unsupported environment", () => {
    it("returns the initial state and a no-op ref when hover is unsupported", () => {
      vi.spyOn(utils, "isHoverSupported").mockReturnValue(false);

      const { result } = renderHook(() =>
        useHover({ initialHovered: true })
      );

      // Falls back to the provided initial state (avoids hydration mismatch).
      expect(result.current.isHovered).toBe(true);

      // ref is a callable no-op that does not throw or attach listeners.
      expect(result.current.ref).toBeInstanceOf(Function);
      const addEventListenerSpy = vi.spyOn(targetElement, "addEventListener");
      expect(() => {
        act(() => {
          result.current.ref(targetElement);
        });
      }).not.toThrow();
      expect(addEventListenerSpy).not.toHaveBeenCalled();

      // Dispatching events has no effect.
      act(() => {
        targetElement.dispatchEvent(
          new MouseEvent("mouseenter", { bubbles: true })
        );
      });
      expect(result.current.isHovered).toBe(true);
    });

    it("supports tuple destructuring in an unsupported environment", () => {
      vi.spyOn(utils, "isHoverSupported").mockReturnValue(false);

      const { result } = renderHook(() => useHover({ initialHovered: true }));

      const [r, h] = result.current;
      expect(r).toBeInstanceOf(Function);
      expect(h).toBe(true);
    });
  });
});

// ============ Utils Tests ============
describe("utils", () => {
  describe("isHoverSupported", () => {
    it("should return true in browser environment", () => {
      expect(isHoverSupported()).toBe(true);
    });
  });

  describe("createNoopRef", () => {
    it("returns a callable no-op that ignores its argument", () => {
      const noop = createNoopRef<HTMLDivElement>();

      expect(noop).toBeInstanceOf(Function);
      expect(noop(document.createElement("div"))).toBeUndefined();
      expect(noop(null)).toBeUndefined();
      expect(() => noop(document.createElement("div"))).not.toThrow();
    });
  });

  describe("normalizeDelay", () => {
    it("should handle number input", () => {
      const result = normalizeDelay(200);

      expect(result.enterDelay).toBe(200);
      expect(result.leaveDelay).toBe(200);
    });

    it("should handle object input with both values", () => {
      const result = normalizeDelay({ enter: 100, leave: 500 });

      expect(result.enterDelay).toBe(100);
      expect(result.leaveDelay).toBe(500);
    });

    it("should handle object input with only enter", () => {
      const result = normalizeDelay({ enter: 100 });

      expect(result.enterDelay).toBe(100);
      expect(result.leaveDelay).toBe(0);
    });

    it("should handle object input with only leave", () => {
      const result = normalizeDelay({ leave: 500 });

      expect(result.enterDelay).toBe(0);
      expect(result.leaveDelay).toBe(500);
    });

    it("should handle negative values", () => {
      const result = normalizeDelay(-100);

      expect(result.enterDelay).toBe(0);
      expect(result.leaveDelay).toBe(0);
    });

    it("should handle zero values", () => {
      const result = normalizeDelay(0);

      expect(result.enterDelay).toBe(0);
      expect(result.leaveDelay).toBe(0);
    });

    it("should handle undefined input", () => {
      const result = normalizeDelay(undefined);

      expect(result.enterDelay).toBe(0);
      expect(result.leaveDelay).toBe(0);
    });

    it("should handle empty object", () => {
      const result = normalizeDelay({});

      expect(result.enterDelay).toBe(0);
      expect(result.leaveDelay).toBe(0);
    });

    it("should handle negative values in object", () => {
      const result = normalizeDelay({ enter: -100, leave: -200 });

      expect(result.enterDelay).toBe(0);
      expect(result.leaveDelay).toBe(0);
    });
  });
});
