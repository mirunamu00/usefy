import { useCallback, useEffect, useMemo, useRef } from "react";
import { useEventListener } from "@usefy/use-event-listener";
import { useLatest } from "@usefy/use-latest";
import type {
  Hotkey,
  HotkeyHandler,
  HotkeyTarget,
  ParsedChord,
  ParsedHotkey,
  UseHotkeysOptions,
} from "./types";
import {
  MODIFIER_KEY_NAMES,
  chordMatches,
  eventToChord,
  isEditableTarget,
  isMacPlatform,
  parseHotkey,
} from "./utils";

/**
 * A React hook for high-level keyboard shortcuts, built on top of a single
 * managed keyboard listener (via `@usefy/use-event-listener`).
 *
 * It is a purpose-built handler API rather than a thin wrapper over
 * `@usefy/use-key-press`: that sibling hook returns the *held* state of a key
 * as a boolean and has no notion of chord sequences, so `useHotkeys` owns its
 * own listener plus a sequence buffer to deliver a callback-style API with
 * multi-combo sequences, a cross-platform `mod` alias, scoping, and an
 * input-field guard.
 *
 * Features:
 * - **Combos** — `"mod+k"`, `"ctrl+shift+p"`, `"shift+?"`, `"Escape"`, `"ArrowUp"`.
 * - **Sequences** — space-separated combos such as `"g i"` or `"g g"`, with a
 *   configurable reset timeout ({@link UseHotkeysOptions.sequenceTimeoutMs}).
 * - **Multiple bindings** — pass an array to bind several hotkeys to one handler.
 * - **`mod` alias** — Cmd on macOS, Ctrl on Windows/Linux (SSR-safe detection,
 *   overridable via {@link UseHotkeysOptions.mac}).
 * - **Exact modifiers** — `"a"` does not fire on `Ctrl+A`; `"ctrl+a"` does not
 *   fire on a plain `a`.
 * - **Input-field guard** — ignores editable targets by default
 *   ({@link UseHotkeysOptions.enableOnFormTags} opts out).
 * - **Scoping** — bind to `document` (default), `window`, an element, or a ref.
 * - **SSR-safe & StrictMode-safe** — no listeners on the server, no duplicate
 *   listeners or leaked sequence timers, full cleanup on unmount and on
 *   `enabled`/`target`/`keys` change.
 *
 * The `handler` is stored in a ref, so it never needs to be memoized by the
 * caller and the listener is not re-subscribed when only the handler changes.
 *
 * @param keys - A hotkey string or an array of hotkey strings (all bound to `handler`).
 * @param handler - Called with the {@link KeyboardEvent} and match details when a hotkey fires.
 * @param options - Configuration. See {@link UseHotkeysOptions}.
 *
 * @example
 * ```tsx
 * // Command palette (mod = Ctrl on Win/Linux, Cmd on macOS)
 * function App() {
 *   const [open, setOpen] = useState(false);
 *   useHotkeys("mod+k", () => setOpen((o) => !o), { preventDefault: true });
 *   return open ? <CommandPalette /> : null;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Multiple bindings for one handler
 * useHotkeys(["mod+s", "ctrl+p"], (event) => {
 *   event.preventDefault();
 *   save();
 * });
 * ```
 *
 * @example
 * ```tsx
 * // A sequence: press "g" then "i" to go to the inbox
 * useHotkeys("g i", () => navigate("/inbox"));
 * ```
 *
 * @example
 * ```tsx
 * // Scoped to an element, allowed inside form fields, only while enabled
 * const ref = useRef<HTMLDivElement>(null);
 * useHotkeys("Escape", close, {
 *   target: ref,
 *   enableOnFormTags: true,
 *   enabled: isOpen,
 * });
 * ```
 */
export function useHotkeys(
  keys: Hotkey | Hotkey[],
  handler: HotkeyHandler,
  options: UseHotkeysOptions = {}
): void {
  const {
    enabled = true,
    target,
    eventType = "keydown",
    enableOnFormTags = false,
    preventDefault = false,
    sequenceTimeoutMs = 1000,
    mac,
  } = options;

  // Keep the latest handler in a ref so callers don't need to memoize it and
  // the listener is never re-subscribed when only the handler changes.
  const handlerRef = useLatest(handler);

  // Serialized identity of the bindings, used as a stable memo/effect key.
  const keysKey = Array.isArray(keys) ? keys.join("␟") : keys;
  const isMac = mac ?? isMacPlatform();

  const bindings = useMemo<ParsedHotkey[]>(() => {
    const list = Array.isArray(keys) ? keys : [keys];
    return list.map((binding) => parseHotkey(binding, { mac: isMac }));
    // `keysKey` captures the serialized identity of `keys`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keysKey, isMac]);

  // Longest sequence — the sequence buffer never needs to hold more than this.
  const maxChords = useMemo(
    () => bindings.reduce((max, binding) => Math.max(max, binding.chords.length), 1),
    [bindings]
  );

  // Rolling buffer of recently pressed chords (for sequence matching), plus the
  // reset timer. Both live in refs so the stable listener can read/mutate them.
  const bufferRef = useRef<ParsedChord[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Latest reactive config, mirrored into a ref so the stable listener never
  // goes stale and never needs re-registering when only options change.
  const configRef = useRef({
    bindings,
    maxChords,
    enableOnFormTags,
    preventDefault,
    sequenceTimeoutMs,
  });
  configRef.current = {
    bindings,
    maxChords,
    enableOnFormTags,
    preventDefault,
    sequenceTimeoutMs,
  };

  const clearSequence = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    bufferRef.current = [];
  }, []);

  const listener = useCallback((event: Event) => {
    const kbd = event as KeyboardEvent;
    const config = configRef.current;

    // Do not fire while the user is typing in a form field, unless opted in.
    if (!config.enableOnFormTags && isEditableTarget(kbd.target)) {
      return;
    }
    // A lone modifier press neither starts a combo nor breaks a sequence.
    if (MODIFIER_KEY_NAMES.has(kbd.key)) {
      return;
    }
    // Ignore auto-repeat (held keys) so a held combo fires once and does not
    // flood the sequence buffer. (keyup events never repeat.)
    if (kbd.repeat) {
      return;
    }

    // Append the current chord to the rolling buffer, capped to the longest
    // sequence so single-combo bindings never accumulate history.
    const buffer = bufferRef.current;
    buffer.push(eventToChord(kbd));
    if (buffer.length > config.maxChords) {
      buffer.splice(0, buffer.length - config.maxChords);
    }

    // (Re)start the sequence reset timer.
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      bufferRef.current = [];
      timerRef.current = null;
    }, config.sequenceTimeoutMs);

    // Match against each binding: the last N buffered chords must equal the
    // binding's N combos in order. First binding wins.
    for (let i = 0; i < config.bindings.length; i++) {
      const binding = config.bindings[i];
      const n = binding.chords.length;
      if (n === 0 || buffer.length < n) {
        continue;
      }
      let matched = true;
      for (let j = 0; j < n; j++) {
        if (!chordMatches(buffer[buffer.length - n + j], binding.chords[j])) {
          matched = false;
          break;
        }
      }
      if (matched) {
        if (config.preventDefault) {
          kbd.preventDefault();
        }
        // Consume the buffer so a completed hotkey does not retrigger or bleed
        // into the next one.
        bufferRef.current = [];
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        handlerRef.current(kbd, {
          hotkey: binding.raw,
          index: i,
          sequence: n > 1,
        });
        return;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Default to `document`; pass refs/elements straight through so
  // `useEventListener` resolves them (including `.current`) inside its effect.
  const listenerTarget: HotkeyTarget =
    target !== undefined
      ? target
      : typeof document !== "undefined"
        ? document
        : null;

  useEventListener(eventType, listener, listenerTarget, { enabled });

  // Reset sequence tracking whenever the matching config changes, and always
  // clear the pending timer on unmount (StrictMode-safe).
  useEffect(() => {
    return () => {
      clearSequence();
    };
  }, [
    clearSequence,
    enabled,
    eventType,
    keysKey,
    listenerTarget,
    sequenceTimeoutMs,
  ]);
}
