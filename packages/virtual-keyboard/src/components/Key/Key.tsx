import React, { useRef, type MouseEvent as ReactMouseEvent } from "react";
import { clsx } from "clsx";
import { useLongPress } from "@usefy/use-long-press";
import { getKeyButtonProps } from "../../keyProps";
import { isRepeatableAction, LONG_PRESS_MS } from "../../constants";
import { useKeyRepeat } from "../../hooks/useKeyRepeat";
import type { ResolvedKey } from "../../types";
import styles from "./Key.module.scss";

/** Per-part class overrides forwarded from {@link VirtualKeyboard}. */
export interface KeyClassNames {
  key?: string;
  keyActive?: string;
}

export interface KeyProps {
  /** The resolved key to render. */
  resolvedKey: ResolvedKey;
  /** Called on a real tap/click (runs any built-in sound/haptics feedback). */
  onPress: (key: ResolvedKey) => void;
  /**
   * Called on each auto-repeat tick. Defaults to `onPress` if omitted, but the
   * component passes the RAW press here so a hold does not fire feedback every
   * ~50ms (a hold is one physical interaction — feedback rides the click only).
   */
  onRepeatPress?: (key: ResolvedKey) => void;
  /** Per-part class overrides. */
  classNames?: KeyClassNames;
  /** Enable the accent-variants popup for keys that declare `variants`. */
  enableVariants?: boolean;
  /** Enable auto-repeat while a repeatable action key is held. */
  enableKeyRepeat?: boolean;
  /** Open the variants popup for this key, anchored to its button element. */
  onOpenVariants?: (key: ResolvedKey, anchor: HTMLButtonElement) => void;
}

/**
 * A single keyboard key rendered as a real `<button>` with an accessible name,
 * `aria-pressed` for active modifiers, and pointer/touch press feedback.
 *
 * Gestures (mutually exclusive per key):
 * - Keys with `variants` (and `enableVariants`) show a corner dot and open the
 *   accent-variants popup on **long-press** or **right-click / secondary-tap**;
 *   a short click still inserts the base glyph.
 * - Repeatable action keys (Backspace) with `enableKeyRepeat` **auto-repeat**
 *   while held.
 *
 * Memoized on its props, so keystrokes that only change the value do not
 * re-render every key.
 */
function KeyImpl({
  resolvedKey,
  onPress,
  onRepeatPress,
  classNames,
  enableVariants = false,
  enableKeyRepeat = false,
  onOpenVariants,
}: KeyProps) {
  const width = resolvedKey.width ?? 1;
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Set true by a completed long-press so the trailing click doesn't also insert
  // the base glyph.
  const longPressFired = useRef(false);

  const hasVariants =
    enableVariants && (resolvedKey.variants?.length ?? 0) > 0;
  // Variants take precedence over auto-repeat, so the two never fight on one key.
  const canRepeat =
    !hasVariants && enableKeyRepeat && isRepeatableAction(resolvedKey.action);

  const openVariants = () => {
    if (buttonRef.current && onOpenVariants) {
      onOpenVariants(resolvedKey, buttonRef.current);
    }
  };

  const longPress = useLongPress<HTMLButtonElement>(
    () => {
      longPressFired.current = true;
      openVariants();
    },
    { threshold: LONG_PRESS_MS, disabled: !hasVariants }
  );

  // Auto-repeat ticks fire the RAW press (no per-tick feedback); the trailing
  // click still runs `onPress` (with feedback).
  const repeatPress = onRepeatPress ?? onPress;
  const repeat = useKeyRepeat(canRepeat, () => repeatPress(resolvedKey));

  const base = getKeyButtonProps(resolvedKey, onPress);

  // Compose onClick: a long-press that already opened the popup swallows the
  // trailing click; otherwise the base press runs.
  const handleClick = () => {
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    onPress(resolvedKey);
  };

  // Compose onMouseDown: reset the stale long-press-suppression flag from any
  // PRIOR gesture (a drag-away-then-select or a held right-click never produced
  // the trailing click that would have cleared it), prevent the focus steal
  // (keeps a bound input focused), then start the active gesture.
  const handleMouseDown = (event: ReactMouseEvent<HTMLButtonElement>) => {
    longPressFired.current = false;
    event.preventDefault();
    if (hasVariants) longPress.onMouseDown(event);
    else if (canRepeat) repeat.onMouseDown();
  };

  const gestureHandlers = hasVariants
    ? {
        onMouseUp: longPress.onMouseUp,
        onMouseLeave: longPress.onMouseLeave,
        onMouseMove: longPress.onMouseMove,
        onTouchStart: (event: React.TouchEvent<HTMLButtonElement>) => {
          // Same stale-flag reset as onMouseDown, for the touch gesture.
          longPressFired.current = false;
          longPress.onTouchStart(event);
        },
        onTouchEnd: longPress.onTouchEnd,
        onTouchMove: longPress.onTouchMove,
        onContextMenu: (event: ReactMouseEvent<HTMLButtonElement>) => {
          event.preventDefault();
          openVariants();
        },
      }
    : canRepeat
      ? {
          onMouseUp: repeat.onMouseUp,
          onMouseLeave: repeat.onMouseLeave,
          onTouchStart: repeat.onTouchStart,
          onTouchEnd: repeat.onTouchEnd,
          onTouchCancel: repeat.onTouchCancel,
          onBlur: repeat.onBlur,
        }
      : undefined;

  return (
    <button
      {...base}
      {...gestureHandlers}
      ref={buttonRef}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      style={{ flexGrow: width }}
      className={clsx(
        styles.key,
        resolvedKey.type === "modifier" && styles.modifier,
        resolvedKey.type === "action" && styles.action,
        resolvedKey.active && styles.active,
        hasVariants && styles.hasVariants,
        classNames?.key,
        resolvedKey.active && classNames?.keyActive
      )}
    >
      <span className={styles.label}>{resolvedKey.displayLabel}</span>
      {hasVariants && <span className={styles.variantDot} aria-hidden="true" />}
    </button>
  );
}

export const Key = React.memo(KeyImpl);
Key.displayName = "Key";
