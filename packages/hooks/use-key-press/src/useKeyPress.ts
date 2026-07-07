import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { KeyPressTarget, UseKeyPressOptions } from "./types";
import {
  createMatcher,
  isEditableElement,
  isKeyPressSupported,
  resolveTarget,
} from "./utils";

// SSR-safe layout effect: sync refs before paint on the client, fall back to
// useEffect on the server (mirrors the house useEventListener pattern).
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** The four modifier flags tracked for a held trigger. */
type ModifierFlag = "ctrl" | "shift" | "alt" | "meta";

/**
 * Maps a modifier key's `event.key` value to the {@link ModifierFlag} it toggles.
 * Used on key-up to decide whether the released modifier was actually part of
 * the held trigger (releasing an unrelated modifier must not end the press).
 */
const MODIFIER_KEY_TO_FLAG: Record<string, ModifierFlag> = {
  Control: "ctrl",
  Shift: "shift",
  Alt: "alt",
  Meta: "meta",
};

/**
 * A React hook for detecting keyboard key presses, shortcuts, and combinations.
 *
 * Supports single keys (`"Escape"`), modifier combinations (`"mod+k"`,
 * `"ctrl+shift+s"`), multiple alternative bindings (`["ctrl+s", "meta+s"]`),
 * and custom predicates. The returned boolean reflects whether the target is
 * currently pressed (with `eventType: "both"`, the default).
 *
 * Features:
 * - Cross-platform `"mod"` alias (Ctrl on Windows/Linux, Cmd on macOS)
 * - Exact or loose modifier matching
 * - Match by logical key (`event.key`) or physical key (`event.code`)
 * - `onPress` / `onRelease` callbacks with the raw event (for `preventDefault`)
 * - Ignores auto-repeat and typing inside form fields (opt-in)
 * - Resets on window blur to avoid stuck-key state
 * - SSR compatible, with automatic listener cleanup
 *
 * @param target - The key(s) or predicate to detect. See {@link KeyPressTarget}.
 * @param options - Configuration options. See {@link UseKeyPressOptions}.
 * @returns `true` while the target key/combination is pressed.
 *
 * @example
 * ```tsx
 * // Single key state
 * function Modal({ onClose }: { onClose: () => void }) {
 *   const escapePressed = useKeyPress("Escape");
 *   useEffect(() => {
 *     if (escapePressed) onClose();
 *   }, [escapePressed, onClose]);
 *   return <div>Press Escape to close</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Cross-platform save shortcut with preventDefault
 * function Editor({ onSave }: { onSave: () => void }) {
 *   useKeyPress(["ctrl+s", "meta+s"], {
 *     preventDefault: true,
 *     onPress: () => onSave(),
 *   });
 *   return <textarea />;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Command palette (mod = Ctrl on Win/Linux, Cmd on Mac)
 * function App() {
 *   const [open, setOpen] = useState(false);
 *   useKeyPress("mod+k", {
 *     preventDefault: true,
 *     onPress: () => setOpen((prev) => !prev),
 *   });
 *   return open ? <CommandPalette /> : null;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Physical keys for game controls (layout-independent)
 * function Game() {
 *   const forward = useKeyPress("w", { matchBy: "code" });
 *   const left = useKeyPress("a", { matchBy: "code" });
 *   return <Player moving={forward} turningLeft={left} />;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Predicate + scoped target
 * function NumericField() {
 *   const ref = useRef<HTMLInputElement>(null);
 *   const digitPressed = useKeyPress((e) => /^[0-9]$/.test(e.key), {
 *     target: ref,
 *   });
 *   return <input ref={ref} data-active={digitPressed} />;
 * }
 * ```
 */
export function useKeyPress(
  target: KeyPressTarget,
  options: UseKeyPressOptions = {}
): boolean {
  const {
    target: eventTarget,
    eventType = "both",
    enabled = true,
    preventDefault = false,
    stopPropagation = false,
    ignoreRepeat = true,
    ignoreInputElements = false,
    caseSensitive = false,
    matchBy = "key",
    exactModifiers = true,
    onPress,
    onRelease,
  } = options;

  const [pressed, setPressed] = useState(false);

  // Mirror of `pressed` for synchronous reads inside event handlers.
  const pressedRef = useRef(false);
  // The lower-cased `event.key` that established the current pressed state.
  const triggerKeyRef = useRef<string | null>(null);
  // Snapshot of the modifier state at the moment the trigger keydown matched.
  // Only modifiers that were held here should end the press when released.
  const triggerModifiersRef = useRef<Record<ModifierFlag, boolean> | null>(null);

  // Build the matcher once per distinct configuration. String/array targets are
  // parsed here; function targets are used as-is.
  const targetKey = typeof target === "function" ? target : JSON.stringify(target);
  const matcher = useMemo(
    () => createMatcher(target, matchBy, caseSensitive, exactModifiers),
    // `targetKey` captures the serialized/string-or-function identity of `target`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [targetKey, matchBy, caseSensitive, exactModifiers]
  );

  // Keep the latest reactive config in a ref so the attached listeners never go
  // stale and never need to be re-registered when only callbacks/flags change.
  const configRef = useRef({
    matcher,
    eventType,
    preventDefault,
    stopPropagation,
    ignoreRepeat,
    ignoreInputElements,
    onPress,
    onRelease,
  });
  // Sync the latest config in a layout effect (not during render) so we never
  // mutate a ref while rendering — a render may be thrown away under concurrent
  // rendering / StrictMode. Listeners read `configRef.current` at event time.
  useIsomorphicLayoutEffect(() => {
    configRef.current = {
      matcher,
      eventType,
      preventDefault,
      stopPropagation,
      ignoreRepeat,
      ignoreInputElements,
      onPress,
      onRelease,
    };
  }, [
    matcher,
    eventType,
    preventDefault,
    stopPropagation,
    ignoreRepeat,
    ignoreInputElements,
    onPress,
    onRelease,
  ]);

  const setPressedState = useCallback((next: boolean) => {
    pressedRef.current = next;
    setPressed((prev) => (prev === next ? prev : next));
  }, []);

  // Clears any held state. When `releaseEvent` is supplied (window blur), fires
  // `onRelease` so onPress/onRelease stay balanced; when omitted (disable /
  // unsupported / unmount) it silently resets — see the onRelease JSDoc.
  const resetPressed = useCallback(
    (releaseEvent?: KeyboardEvent) => {
      triggerKeyRef.current = null;
      triggerModifiersRef.current = null;
      if (pressedRef.current) {
        setPressedState(false);
        if (releaseEvent) {
          configRef.current.onRelease?.(releaseEvent);
        }
      }
    },
    [setPressedState]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const config = configRef.current;
      if (config.ignoreInputElements && isEditableElement(event.target)) {
        return;
      }
      if (!config.matcher(event)) {
        return;
      }
      if (config.preventDefault) {
        event.preventDefault();
      }
      if (config.stopPropagation) {
        event.stopPropagation();
      }

      const isSuppressedRepeat = event.repeat && config.ignoreRepeat;
      if (!isSuppressedRepeat) {
        config.onPress?.(event);
      }

      // In keyup-only mode the pressed state is driven by key releases.
      if (config.eventType !== "keyup") {
        triggerKeyRef.current = event.key.toLowerCase();
        // Capture which modifiers were actually held when the trigger matched,
        // so key-up can tell a bare-key press from a modifier combination.
        triggerModifiersRef.current = {
          ctrl: event.ctrlKey,
          shift: event.shiftKey,
          alt: event.altKey,
          meta: event.metaKey,
        };
        setPressedState(true);
      }
    },
    [setPressedState]
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      const config = configRef.current;
      if (config.ignoreInputElements && isEditableElement(event.target)) {
        return;
      }

      // keyup-only mode: a matching release latches the pressed state.
      if (config.eventType === "keyup") {
        if (!config.matcher(event)) {
          return;
        }
        if (config.preventDefault) {
          event.preventDefault();
        }
        if (config.stopPropagation) {
          event.stopPropagation();
        }
        config.onRelease?.(event);
        setPressedState(true);
        return;
      }

      // "both" mode: release the held state when the primary key, or a modifier
      // that was actually part of the held trigger, is released. Releasing an
      // unrelated modifier (e.g. Shift while holding a bare "a") must NOT reset.
      if (!pressedRef.current) {
        return;
      }
      const released = event.key.toLowerCase();
      const modifierFlag = MODIFIER_KEY_TO_FLAG[event.key];
      const isTriggerModifierRelease =
        modifierFlag !== undefined &&
        triggerModifiersRef.current?.[modifierFlag] === true;
      if (released === triggerKeyRef.current || isTriggerModifierRelease) {
        triggerKeyRef.current = null;
        triggerModifiersRef.current = null;
        setPressedState(false);
        config.onRelease?.(event);
      }
    },
    [setPressedState]
  );

  // Focus left the window while a key was held: keyup will never arrive, so
  // reset. Fire onRelease with a synthetic keyup so onPress/onRelease stay
  // balanced instead of leaking a dangling press. Registered directly on the
  // blur event, so it must NOT be `resetPressed` (which would receive the raw
  // blur Event and mistake it for a KeyboardEvent).
  const handleBlur = useCallback(() => {
    if (!pressedRef.current) {
      return;
    }
    const synthetic =
      typeof KeyboardEvent !== "undefined"
        ? new KeyboardEvent("keyup")
        : undefined;
    resetPressed(synthetic);
  }, [resetPressed]);

  useEffect(() => {
    if (!isKeyPressSupported() || !enabled) {
      // Reset any lingering pressed state when disabled or unsupported.
      resetPressed();
      return;
    }

    const element = resolveTarget(eventTarget);
    if (!element) {
      return;
    }

    const listenDown = eventType === "both" || eventType === "keydown";
    const listenUp = eventType === "both" || eventType === "keyup";

    if (listenDown) {
      element.addEventListener("keydown", handleKeyDown as EventListener);
    }
    if (listenUp) {
      element.addEventListener("keyup", handleKeyUp as EventListener);
    }

    // Reset on blur so a key held while focus leaves the window/tab does not
    // remain "pressed" forever (keyup is never delivered in that case).
    const win = typeof window !== "undefined" ? window : null;
    win?.addEventListener("blur", handleBlur);

    return () => {
      if (listenDown) {
        element.removeEventListener("keydown", handleKeyDown as EventListener);
      }
      if (listenUp) {
        element.removeEventListener("keyup", handleKeyUp as EventListener);
      }
      win?.removeEventListener("blur", handleBlur);
    };
  }, [
    enabled,
    eventTarget,
    eventType,
    handleKeyDown,
    handleKeyUp,
    handleBlur,
    resetPressed,
  ]);

  return pressed;
}
