import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHotkeys } from "./useHotkeys";
import type { UseHotkeysOptions } from "./types";

/**
 * Dispatches a keyboard event and flushes React work inside `act`.
 */
function press(
  key: string,
  init: KeyboardEventInit = {},
  target: EventTarget = document,
  type: "keydown" | "keyup" = "keydown"
): boolean {
  let notCancelled = true;
  act(() => {
    notCancelled = target.dispatchEvent(
      new KeyboardEvent(type, {
        key,
        bubbles: true,
        cancelable: true,
        ...init,
      })
    );
  });
  return notCancelled;
}

describe("useHotkeys", () => {
  describe("single combos", () => {
    it("fires the handler on a matching combo (mod = ctrl on non-Apple)", () => {
      const handler = vi.fn();
      renderHook(() => useHotkeys("mod+k", handler, { mac: false }));

      press("k", { ctrlKey: true });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("passes the KeyboardEvent and match details to the handler", () => {
      const handler = vi.fn();
      renderHook(() => useHotkeys("mod+k", handler, { mac: false }));

      press("k", { ctrlKey: true });
      const [event, match] = handler.mock.calls[0];
      expect(event).toBeInstanceOf(KeyboardEvent);
      expect(match).toEqual({ hotkey: "mod+k", index: 0, sequence: false });
    });

    it("does not fire on a plain key when a modifier is required", () => {
      const handler = vi.fn();
      renderHook(() => useHotkeys("ctrl+a", handler));

      press("a");
      expect(handler).not.toHaveBeenCalled();
    });

    it("requires an exact modifier match: 'a' does not fire on Ctrl+A", () => {
      const handler = vi.fn();
      renderHook(() => useHotkeys("a", handler));

      press("a", { ctrlKey: true });
      expect(handler).not.toHaveBeenCalled();

      press("a");
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("matches keys case-insensitively", () => {
      const handler = vi.fn();
      renderHook(() => useHotkeys("Escape", handler));

      press("Escape");
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("ignores auto-repeat (held) keydown events", () => {
      const handler = vi.fn();
      renderHook(() => useHotkeys("a", handler));

      press("a", { repeat: true });
      expect(handler).not.toHaveBeenCalled();

      press("a");
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("mod alias platform resolution", () => {
    it("resolves mod to meta when mac is true", () => {
      const handler = vi.fn();
      renderHook(() => useHotkeys("mod+k", handler, { mac: true }));

      press("k", { ctrlKey: true });
      expect(handler).not.toHaveBeenCalled();

      press("k", { metaKey: true });
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("multiple bindings", () => {
    it("fires on any of several bindings and reports the matched index", () => {
      const handler = vi.fn();
      renderHook(() =>
        useHotkeys(["mod+k", "ctrl+p"], handler, { mac: false })
      );

      press("k", { ctrlKey: true });
      expect(handler.mock.calls[0][1]).toMatchObject({
        hotkey: "mod+k",
        index: 0,
      });

      press("p", { ctrlKey: true });
      expect(handler.mock.calls[1][1]).toMatchObject({
        hotkey: "ctrl+p",
        index: 1,
      });
    });
  });

  describe("enabled option", () => {
    it("does not fire when disabled", () => {
      const handler = vi.fn();
      renderHook(() => useHotkeys("a", handler, { enabled: false }));

      press("a");
      expect(handler).not.toHaveBeenCalled();
    });

    it("attaches and detaches as enabled toggles", () => {
      const handler = vi.fn();
      const { rerender } = renderHook(
        ({ enabled }: { enabled: boolean }) =>
          useHotkeys("a", handler, { enabled }),
        { initialProps: { enabled: false } }
      );

      press("a");
      expect(handler).not.toHaveBeenCalled();

      rerender({ enabled: true });
      press("a");
      expect(handler).toHaveBeenCalledTimes(1);

      rerender({ enabled: false });
      press("a");
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("input-field guard", () => {
    let input: HTMLInputElement;

    beforeEach(() => {
      input = document.createElement("input");
      document.body.appendChild(input);
    });

    afterEach(() => {
      input.remove();
    });

    it("does not fire while typing in a form field by default", () => {
      const handler = vi.fn();
      renderHook(() => useHotkeys("a", handler));

      press("a", {}, input);
      expect(handler).not.toHaveBeenCalled();
    });

    it("fires inside form fields when enableOnFormTags is true", () => {
      const handler = vi.fn();
      renderHook(() => useHotkeys("a", handler, { enableOnFormTags: true }));

      press("a", {}, input);
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("preventDefault option", () => {
    it("does not prevent default by default", () => {
      const handler = vi.fn();
      renderHook(() => useHotkeys("mod+s", handler, { mac: false }));

      const notCancelled = press("s", { ctrlKey: true });
      expect(handler).toHaveBeenCalledTimes(1);
      expect(notCancelled).toBe(true);
    });

    it("prevents default on a match when enabled", () => {
      const handler = vi.fn();
      renderHook(() =>
        useHotkeys("mod+s", handler, { mac: false, preventDefault: true })
      );

      const notCancelled = press("s", { ctrlKey: true });
      expect(handler).toHaveBeenCalledTimes(1);
      expect(notCancelled).toBe(false);
    });
  });

  describe("eventType option", () => {
    it("can match on keyup instead of keydown", () => {
      const handler = vi.fn();
      renderHook(() => useHotkeys("a", handler, { eventType: "keyup" }));

      press("a", {}, document, "keydown");
      expect(handler).not.toHaveBeenCalled();

      press("a", {}, document, "keyup");
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("custom target", () => {
    it("binds to a specific element via a ref", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      const ref = { current: el };
      const handler = vi.fn();

      renderHook(() => useHotkeys("a", handler, { target: ref }));

      // Dispatched on the bound element.
      press("a", {}, el);
      expect(handler).toHaveBeenCalledTimes(1);

      el.remove();
    });

    it("attaches nothing when target is null", () => {
      const handler = vi.fn();
      renderHook(() => useHotkeys("a", handler, { target: null }));

      press("a");
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("latest handler ref", () => {
    it("always calls the newest handler without re-subscribing", () => {
      const first = vi.fn();
      const second = vi.fn();
      const { rerender } = renderHook(
        ({ handler }: { handler: () => void }) => useHotkeys("a", handler),
        { initialProps: { handler: first } }
      );

      press("a");
      expect(first).toHaveBeenCalledTimes(1);

      rerender({ handler: second });
      press("a");
      expect(first).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledTimes(1);
    });
  });

  describe("sequences", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    });

    it("fires after the combos are pressed in order", () => {
      const handler = vi.fn();
      renderHook(() => useHotkeys("g i", handler));

      press("g");
      expect(handler).not.toHaveBeenCalled();
      press("i");
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][1]).toEqual({
        hotkey: "g i",
        index: 0,
        sequence: true,
      });
    });

    it("supports a repeated-key sequence like 'g g'", () => {
      const handler = vi.fn();
      renderHook(() => useHotkeys("g g", handler));

      press("g");
      press("g");
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("resets the buffer after the sequence timeout elapses", () => {
      const handler = vi.fn();
      renderHook(() => useHotkeys("g i", handler, { sequenceTimeoutMs: 500 }));

      press("g");
      act(() => {
        vi.advanceTimersByTime(600);
      });
      press("i");
      expect(handler).not.toHaveBeenCalled();
    });

    it("is not broken by a lone modifier press between combos", () => {
      const handler = vi.fn();
      renderHook(() => useHotkeys("g i", handler));

      press("g");
      press("Shift", { shiftKey: true });
      press("i");
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("ignores an unrelated key without dropping a later match", () => {
      const handler = vi.fn();
      renderHook(() => useHotkeys("g i", handler));

      press("x");
      press("g");
      press("i");
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("cleanup", () => {
    it("removes the listener on unmount", () => {
      const handler = vi.fn();
      const { unmount } = renderHook(() => useHotkeys("a", handler));

      unmount();
      press("a");
      expect(handler).not.toHaveBeenCalled();
    });

    it("clears a pending sequence timer on unmount", () => {
      vi.useFakeTimers();
      const handler = vi.fn();
      const { unmount } = renderHook(() => useHotkeys("g i", handler));

      press("g");
      unmount();
      // No lingering timer should keep the buffer alive or throw.
      act(() => {
        vi.runOnlyPendingTimers();
      });
      expect(vi.getTimerCount()).toBe(0);
      vi.useRealTimers();
    });
  });

  describe("StrictMode-like double mount", () => {
    it("does not register duplicate listeners", () => {
      const handler = vi.fn();
      const options: UseHotkeysOptions = { mac: false };
      const { rerender } = renderHook(() =>
        useHotkeys("mod+k", handler, options)
      );
      rerender();

      press("k", { ctrlKey: true });
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});
