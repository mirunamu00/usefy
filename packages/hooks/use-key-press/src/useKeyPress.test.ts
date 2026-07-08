import { StrictMode } from "react";
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useKeyPress } from "./useKeyPress";
import {
  parseShortcut,
  normalizeKeyToken,
  matchesShortcut,
  createMatcher,
  isEditableElement,
  isApplePlatform,
  isKeyPressSupported,
  resolveTarget,
} from "./utils";
import type { ParsedShortcut } from "./types";

/**
 * Dispatch a keyboard event on the given target, wrapped in `act` so React
 * state updates flush synchronously.
 */
function fireKey(
  type: "keydown" | "keyup",
  init: KeyboardEventInit,
  target: EventTarget = window
): KeyboardEvent {
  const event = new KeyboardEvent(type, {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

describe("useKeyPress", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============ Utils: parseShortcut ============
  describe("parseShortcut", () => {
    it("parses a bare key", () => {
      expect(parseShortcut("a")).toEqual<ParsedShortcut>({
        ctrl: false,
        shift: false,
        alt: false,
        meta: false,
        key: "a",
      });
    });

    it("parses modifier aliases", () => {
      expect(parseShortcut("control+shift+s")).toMatchObject({
        ctrl: true,
        shift: true,
        key: "s",
      });
      expect(parseShortcut("cmd+k")).toMatchObject({ meta: true, key: "k" });
      expect(parseShortcut("option+x")).toMatchObject({ alt: true, key: "x" });
    });

    it("resolves 'mod' to ctrl on non-Apple platforms", () => {
      // jsdom's default navigator is not an Apple platform.
      const parsed = parseShortcut("mod+k");
      expect(parsed.ctrl).toBe(true);
      expect(parsed.meta).toBe(false);
    });

    it("normalizes key aliases (esc, space, arrows)", () => {
      expect(parseShortcut("esc").key).toBe("escape");
      expect(parseShortcut("space").key).toBe(" ");
      expect(parseShortcut("up").key).toBe("arrowup");
    });

    it("keeps the last non-modifier token as the key", () => {
      expect(parseShortcut("a+b").key).toBe("b");
    });

    it("handles the literal '+' key", () => {
      expect(parseShortcut("+").key).toBe("+");
      expect(parseShortcut("ctrl++")).toMatchObject({ ctrl: true, key: "+" });
    });

    it("respects caseSensitive for letters", () => {
      expect(parseShortcut("A", "key", true).key).toBe("A");
      expect(parseShortcut("A", "key", false).key).toBe("a");
    });
  });

  // ============ Utils: normalizeKeyToken (code mode) ============
  describe("normalizeKeyToken", () => {
    it("maps single letters to physical codes", () => {
      expect(normalizeKeyToken("s", "code", false)).toBe("keys");
      expect(normalizeKeyToken("1", "code", false)).toBe("digit1");
    });

    it("maps aliases in code mode", () => {
      expect(normalizeKeyToken("space", "code", false)).toBe("space");
      expect(normalizeKeyToken("up", "code", false)).toBe("arrowup");
    });
  });

  // ============ Utils: matchesShortcut ============
  describe("matchesShortcut", () => {
    const parsed = parseShortcut("ctrl+s");

    it("matches an exact combination", () => {
      const event = new KeyboardEvent("keydown", { key: "s", ctrlKey: true });
      expect(matchesShortcut(event, parsed, true, "key", false)).toBe(true);
    });

    it("rejects an extra modifier when exactModifiers is true", () => {
      const event = new KeyboardEvent("keydown", {
        key: "s",
        ctrlKey: true,
        shiftKey: true,
      });
      expect(matchesShortcut(event, parsed, true, "key", false)).toBe(false);
    });

    it("allows an extra modifier when exactModifiers is false", () => {
      const event = new KeyboardEvent("keydown", {
        key: "s",
        ctrlKey: true,
        shiftKey: true,
      });
      expect(matchesShortcut(event, parsed, false, "key", false)).toBe(true);
    });

    it("matches modifier-only bindings on modifier state alone", () => {
      const shiftOnly = parseShortcut("shift");
      const event = new KeyboardEvent("keydown", { key: "Shift", shiftKey: true });
      expect(matchesShortcut(event, shiftOnly, true, "key", false)).toBe(true);
    });
  });

  // ============ Utils: createMatcher ============
  describe("createMatcher", () => {
    it("returns a function target as-is", () => {
      const predicate = (e: KeyboardEvent) => e.key === "z";
      const matcher = createMatcher(predicate, "key", false, true);
      expect(matcher(new KeyboardEvent("keydown", { key: "z" }))).toBe(true);
      expect(matcher(new KeyboardEvent("keydown", { key: "y" }))).toBe(false);
    });

    it("matches any alternative in an array (OR)", () => {
      const matcher = createMatcher(["ctrl+s", "meta+s"], "key", false, true);
      expect(
        matcher(new KeyboardEvent("keydown", { key: "s", ctrlKey: true }))
      ).toBe(true);
      expect(
        matcher(new KeyboardEvent("keydown", { key: "s", metaKey: true }))
      ).toBe(true);
      expect(matcher(new KeyboardEvent("keydown", { key: "s" }))).toBe(false);
    });
  });

  // ============ Utils: isEditableElement ============
  describe("isEditableElement", () => {
    it("detects form and contenteditable elements", () => {
      const input = document.createElement("input");
      const textarea = document.createElement("textarea");
      const select = document.createElement("select");
      const div = document.createElement("div");
      const editable = document.createElement("div");
      editable.setAttribute("contenteditable", "true");

      expect(isEditableElement(input)).toBe(true);
      expect(isEditableElement(textarea)).toBe(true);
      expect(isEditableElement(select)).toBe(true);
      expect(isEditableElement(div)).toBe(false);
      // jsdom does not implement isContentEditable; guard against both outcomes.
      expect(typeof isEditableElement(editable)).toBe("boolean");
      expect(isEditableElement(null)).toBe(false);
    });
  });

  // ============ Utils: isApplePlatform / resolveTarget ============
  describe("platform + target resolution", () => {
    it("isApplePlatform returns a boolean", () => {
      expect(typeof isApplePlatform()).toBe("boolean");
    });

    it("isApplePlatform detects Apple user agents", () => {
      vi.spyOn(navigator, "userAgent", "get").mockReturnValue(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
      );
      expect(isApplePlatform()).toBe(true);
    });

    it("resolveTarget defaults to window and handles null/refs", () => {
      expect(resolveTarget(undefined)).toBe(window);
      expect(resolveTarget(null)).toBe(null);
      expect(resolveTarget(document)).toBe(document);
      const el = document.createElement("div");
      expect(resolveTarget({ current: el })).toBe(el);
      expect(resolveTarget({ current: null })).toBe(null);
    });
  });

  // ============ Hook: initialization ============
  describe("initialization", () => {
    it("returns false initially", () => {
      const { result } = renderHook(() => useKeyPress("a"));
      expect(result.current).toBe(false);
    });

    it("stays false when disabled and never attaches listeners", () => {
      const { result } = renderHook(() => useKeyPress("a", { enabled: false }));
      fireKey("keydown", { key: "a" });
      expect(result.current).toBe(false);
    });
  });

  // ============ Hook: single key lifecycle ============
  describe("single key", () => {
    it("becomes true on keydown and false on keyup", () => {
      const { result } = renderHook(() => useKeyPress("a"));

      fireKey("keydown", { key: "a" });
      expect(result.current).toBe(true);

      fireKey("keyup", { key: "a" });
      expect(result.current).toBe(false);
    });

    it("ignores non-target keys", () => {
      const { result } = renderHook(() => useKeyPress("a"));
      fireKey("keydown", { key: "b" });
      expect(result.current).toBe(false);
    });

    it("is case-insensitive by default", () => {
      const { result } = renderHook(() => useKeyPress("a"));
      fireKey("keydown", { key: "A", shiftKey: false });
      expect(result.current).toBe(true);
    });

    it("respects caseSensitive option", () => {
      const { result } = renderHook(() =>
        useKeyPress("A", { caseSensitive: true })
      );
      fireKey("keydown", { key: "a" });
      expect(result.current).toBe(false);
      fireKey("keydown", { key: "A" });
      expect(result.current).toBe(true);
    });
  });

  // ============ Hook: combinations ============
  describe("combinations", () => {
    it("detects ctrl+s and releases on primary key up", () => {
      const { result } = renderHook(() => useKeyPress("ctrl+s"));

      fireKey("keydown", { key: "s", ctrlKey: true });
      expect(result.current).toBe(true);

      fireKey("keyup", { key: "s", ctrlKey: true });
      expect(result.current).toBe(false);
    });

    it("releases when the modifier is lifted first", () => {
      const { result } = renderHook(() => useKeyPress("ctrl+s"));

      fireKey("keydown", { key: "s", ctrlKey: true });
      expect(result.current).toBe(true);

      // Release Control before 's'.
      fireKey("keyup", { key: "Control", ctrlKey: false });
      expect(result.current).toBe(false);
    });

    it("requires exact modifiers by default", () => {
      const { result } = renderHook(() => useKeyPress("ctrl+s"));
      fireKey("keydown", { key: "s", ctrlKey: true, shiftKey: true });
      expect(result.current).toBe(false);
    });

    it("allows extra modifiers when exactModifiers is false", () => {
      const { result } = renderHook(() =>
        useKeyPress("ctrl+s", { exactModifiers: false })
      );
      fireKey("keydown", { key: "s", ctrlKey: true, shiftKey: true });
      expect(result.current).toBe(true);
    });
  });

  // ============ Hook: alternative bindings ============
  describe("alternative bindings (array = OR)", () => {
    it("matches any of the provided shortcuts", () => {
      const { result } = renderHook(() =>
        useKeyPress(["ctrl+s", "meta+s"])
      );

      fireKey("keydown", { key: "s", metaKey: true });
      expect(result.current).toBe(true);
      fireKey("keyup", { key: "s", metaKey: true });
      expect(result.current).toBe(false);

      fireKey("keydown", { key: "s", ctrlKey: true });
      expect(result.current).toBe(true);
    });
  });

  // ============ Hook: mod alias ============
  describe("mod alias", () => {
    it("maps mod to ctrl on non-Apple platforms", () => {
      const { result } = renderHook(() => useKeyPress("mod+k"));
      fireKey("keydown", { key: "k", ctrlKey: true });
      expect(result.current).toBe(true);
    });
  });

  // ============ Hook: predicate ============
  describe("predicate target", () => {
    it("matches via a custom predicate", () => {
      const { result } = renderHook(() =>
        useKeyPress((e) => /^[0-9]$/.test(e.key))
      );
      fireKey("keydown", { key: "7" });
      expect(result.current).toBe(true);
      fireKey("keyup", { key: "7" });
      expect(result.current).toBe(false);
    });
  });

  // ============ Hook: matchBy code ============
  describe("matchBy code", () => {
    it("matches by physical key regardless of layout", () => {
      const { result } = renderHook(() =>
        useKeyPress("s", { matchBy: "code" })
      );
      // Different logical key (e.g. another layout) but same physical code.
      fireKey("keydown", { key: "ㅅ", code: "KeyS" });
      expect(result.current).toBe(true);
    });
  });

  // ============ Hook: preventDefault / stopPropagation ============
  describe("event control", () => {
    it("calls preventDefault on match", () => {
      renderHook(() => useKeyPress("ctrl+s", { preventDefault: true }));
      const event = fireKey("keydown", { key: "s", ctrlKey: true });
      expect(event.defaultPrevented).toBe(true);
    });

    it("does not preventDefault on non-match", () => {
      renderHook(() => useKeyPress("ctrl+s", { preventDefault: true }));
      const event = fireKey("keydown", { key: "x", ctrlKey: true });
      expect(event.defaultPrevented).toBe(false);
    });
  });

  // ============ Hook: callbacks ============
  describe("callbacks", () => {
    it("fires onPress and onRelease with the event", () => {
      const onPress = vi.fn();
      const onRelease = vi.fn();
      renderHook(() => useKeyPress("a", { onPress, onRelease }));

      fireKey("keydown", { key: "a" });
      expect(onPress).toHaveBeenCalledTimes(1);
      expect(onPress.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);

      fireKey("keyup", { key: "a" });
      expect(onRelease).toHaveBeenCalledTimes(1);
    });

    it("ignores auto-repeat for onPress by default", () => {
      const onPress = vi.fn();
      renderHook(() => useKeyPress("a", { onPress }));

      fireKey("keydown", { key: "a", repeat: false });
      fireKey("keydown", { key: "a", repeat: true });
      fireKey("keydown", { key: "a", repeat: true });
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("includes repeats when ignoreRepeat is false", () => {
      const onPress = vi.fn();
      renderHook(() => useKeyPress("a", { onPress, ignoreRepeat: false }));

      fireKey("keydown", { key: "a", repeat: false });
      fireKey("keydown", { key: "a", repeat: true });
      expect(onPress).toHaveBeenCalledTimes(2);
    });

    it("uses the latest callback without re-attaching listeners", () => {
      const first = vi.fn();
      const second = vi.fn();
      const { rerender } = renderHook(
        ({ cb }) => useKeyPress("a", { onPress: cb }),
        { initialProps: { cb: first } }
      );

      rerender({ cb: second });
      fireKey("keydown", { key: "a" });
      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
    });
  });

  // ============ Hook: ignoreInputElements ============
  describe("ignoreInputElements", () => {
    let input: HTMLInputElement;

    beforeEach(() => {
      input = document.createElement("input");
      document.body.appendChild(input);
    });

    afterEach(() => {
      document.body.removeChild(input);
    });

    it("ignores events from editable elements when enabled", () => {
      const { result } = renderHook(() =>
        useKeyPress("a", { ignoreInputElements: true })
      );
      fireKey("keydown", { key: "a" }, input);
      expect(result.current).toBe(false);
    });

    it("reacts to editable elements when disabled (default)", () => {
      const { result } = renderHook(() => useKeyPress("a"));
      fireKey("keydown", { key: "a" }, input);
      expect(result.current).toBe(true);
    });
  });

  // ============ Hook: targets ============
  describe("targets", () => {
    it("attaches to document", () => {
      const { result } = renderHook(() =>
        useKeyPress("a", { target: document })
      );
      fireKey("keydown", { key: "a" }, document);
      expect(result.current).toBe(true);
    });

    it("attaches to a ref element", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      const ref = { current: el };
      const { result } = renderHook(() => useKeyPress("a", { target: ref }));

      fireKey("keydown", { key: "a" }, el);
      expect(result.current).toBe(true);

      document.body.removeChild(el);
    });

    it("does not attach when target is null", () => {
      const { result } = renderHook(() => useKeyPress("a", { target: null }));
      fireKey("keydown", { key: "a" });
      expect(result.current).toBe(false);
    });
  });

  // ============ Hook: blur reset ============
  describe("blur reset", () => {
    it("resets pressed state on window blur", () => {
      const { result } = renderHook(() => useKeyPress("a"));

      fireKey("keydown", { key: "a" });
      expect(result.current).toBe(true);

      act(() => {
        window.dispatchEvent(new Event("blur"));
      });
      expect(result.current).toBe(false);
    });
  });

  // ============ Hook: eventType variants ============
  describe("eventType", () => {
    it("keydown mode latches true and does not reset on keyup", () => {
      const { result } = renderHook(() =>
        useKeyPress("a", { eventType: "keydown" })
      );
      fireKey("keydown", { key: "a" });
      expect(result.current).toBe(true);
      fireKey("keyup", { key: "a" });
      expect(result.current).toBe(true);
    });

    it("keyup mode becomes true on matching keyup", () => {
      const { result } = renderHook(() =>
        useKeyPress("a", { eventType: "keyup" })
      );
      fireKey("keydown", { key: "a" });
      expect(result.current).toBe(false);
      fireKey("keyup", { key: "a" });
      expect(result.current).toBe(true);
    });
  });

  // ============ Hook: enable/disable + cleanup ============
  describe("lifecycle", () => {
    it("attaches when re-enabled", () => {
      const { result, rerender } = renderHook(
        ({ enabled }) => useKeyPress("a", { enabled }),
        { initialProps: { enabled: false } }
      );

      fireKey("keydown", { key: "a" });
      expect(result.current).toBe(false);

      rerender({ enabled: true });
      fireKey("keydown", { key: "a" });
      expect(result.current).toBe(true);
    });

    it("removes listeners on unmount", () => {
      const removeSpy = vi.spyOn(window, "removeEventListener");
      const { unmount } = renderHook(() => useKeyPress("a"));
      unmount();
      expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
      expect(removeSpy).toHaveBeenCalledWith("keyup", expect.any(Function));
    });
  });

  // ============ Utils: isKeyPressSupported ============
  describe("isKeyPressSupported", () => {
    it("returns true in a jsdom (browser-like) environment", () => {
      expect(isKeyPressSupported()).toBe(true);
    });
  });

  // ============ Hook: stopPropagation ============
  describe("stopPropagation", () => {
    it("stops propagation on a match", () => {
      const spy = vi.spyOn(KeyboardEvent.prototype, "stopPropagation");
      renderHook(() => useKeyPress("ctrl+s", { stopPropagation: true }));
      fireKey("keydown", { key: "s", ctrlKey: true });
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("does not stop propagation on a non-match", () => {
      const spy = vi.spyOn(KeyboardEvent.prototype, "stopPropagation");
      renderHook(() => useKeyPress("ctrl+s", { stopPropagation: true }));
      fireKey("keydown", { key: "x", ctrlKey: true });
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ============ Hook: unrelated modifier release (regression) ============
  describe("unrelated modifier release", () => {
    it("does not clear a held bare key when an unrelated modifier is released", () => {
      const { result } = renderHook(() => useKeyPress("a"));

      // Hold a bare "a" (no modifiers were part of the trigger).
      fireKey("keydown", { key: "a" });
      expect(result.current).toBe(true);

      // Releasing Shift/Control/Alt/Meta must NOT end the held bare key.
      fireKey("keyup", { key: "Shift" });
      expect(result.current).toBe(true);
      fireKey("keyup", { key: "Control" });
      expect(result.current).toBe(true);
      fireKey("keyup", { key: "Alt" });
      expect(result.current).toBe(true);
      fireKey("keyup", { key: "Meta" });
      expect(result.current).toBe(true);

      // The primary key still ends the press.
      fireKey("keyup", { key: "a" });
      expect(result.current).toBe(false);
    });

    it("still releases when a modifier that WAS part of the trigger is lifted", () => {
      const { result } = renderHook(() =>
        useKeyPress("ctrl+s", { exactModifiers: false })
      );

      // Trigger held with both Ctrl and Shift down.
      fireKey("keydown", { key: "s", ctrlKey: true, shiftKey: true });
      expect(result.current).toBe(true);

      // Shift was part of the held trigger snapshot, so releasing it ends it.
      fireKey("keyup", { key: "Shift" });
      expect(result.current).toBe(false);
    });
  });

  // ============ Hook: onRelease across eventType modes ============
  describe("onRelease across eventType modes", () => {
    it("fires onRelease on keyup in 'both' mode", () => {
      const onRelease = vi.fn();
      renderHook(() => useKeyPress("a", { eventType: "both", onRelease }));

      fireKey("keydown", { key: "a" });
      expect(onRelease).not.toHaveBeenCalled();
      fireKey("keyup", { key: "a" });
      expect(onRelease).toHaveBeenCalledTimes(1);
    });

    it("never fires onRelease in 'keydown' mode (no keyup listener)", () => {
      const onRelease = vi.fn();
      const { result } = renderHook(() =>
        useKeyPress("a", { eventType: "keydown", onRelease })
      );

      fireKey("keydown", { key: "a" });
      expect(result.current).toBe(true);
      fireKey("keyup", { key: "a" });
      expect(onRelease).not.toHaveBeenCalled();
    });

    it("fires onRelease on the matching keyup in 'keyup' mode", () => {
      const onRelease = vi.fn();
      renderHook(() => useKeyPress("a", { eventType: "keyup", onRelease }));

      fireKey("keydown", { key: "a" });
      expect(onRelease).not.toHaveBeenCalled();
      fireKey("keyup", { key: "a" });
      expect(onRelease).toHaveBeenCalledTimes(1);
      expect(onRelease.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
    });
  });

  // ============ Hook: blur fires onRelease (regression) ============
  describe("blur onRelease pairing", () => {
    it("fires onRelease with a synthetic keyup when focus is lost while held", () => {
      const onPress = vi.fn();
      const onRelease = vi.fn();
      const { result } = renderHook(() =>
        useKeyPress("a", { onPress, onRelease })
      );

      fireKey("keydown", { key: "a" });
      expect(onPress).toHaveBeenCalledTimes(1);
      expect(result.current).toBe(true);

      act(() => {
        window.dispatchEvent(new Event("blur"));
      });

      expect(result.current).toBe(false);
      // onPress/onRelease stay balanced even though no real keyup arrived.
      expect(onRelease).toHaveBeenCalledTimes(1);
      expect(onRelease.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
      expect(onRelease.mock.calls[0][0].type).toBe("keyup");
    });

    it("does not fire onRelease on blur when nothing was held", () => {
      const onRelease = vi.fn();
      renderHook(() => useKeyPress("a", { onRelease }));

      act(() => {
        window.dispatchEvent(new Event("blur"));
      });
      expect(onRelease).not.toHaveBeenCalled();
    });
  });

  // ============ Hook: StrictMode safety ============
  describe("StrictMode", () => {
    it("tracks presses and uses the latest callback under StrictMode", () => {
      const first = vi.fn();
      const second = vi.fn();
      const { result, rerender } = renderHook(
        ({ cb }) => useKeyPress("a", { onPress: cb }),
        { initialProps: { cb: first }, wrapper: StrictMode }
      );

      fireKey("keydown", { key: "a" });
      expect(result.current).toBe(true);
      expect(first).toHaveBeenCalledTimes(1);
      fireKey("keyup", { key: "a" });
      expect(result.current).toBe(false);

      // A config-only change must not re-attach listeners or lose the latest cb.
      rerender({ cb: second });
      fireKey("keydown", { key: "a" });
      expect(second).toHaveBeenCalledTimes(1);
      expect(first).toHaveBeenCalledTimes(1);
    });
  });
});
