import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useOnClickOutside } from "@usefy/use-on-click-outside";
import styles from "./VariantsPopup.module.scss";

export interface VariantsPopupProps {
  /** Glyphs to choose from — the base key first, then its variants. */
  glyphs: string[];
  /** Insert the chosen glyph. */
  onSelect: (glyph: string) => void;
  /** Close the popup without selecting (Escape / click-outside). */
  onClose: () => void;
  /** Left offset (px) relative to the keyboard container. */
  left: number;
  /** Top offset (px) relative to the keyboard container. */
  top: number;
  /** Accessible label for the menu. */
  label?: string;
}

/**
 * The accent-variants chooser: a small popup **menu** of alternate glyphs
 * (`role="menu"` / `role="menuitem"`, per WAI-ARIA APG) opened by long-pressing
 * or right-clicking a key that has `variants`.
 *
 * Focus moves to the first item on open; Arrow keys (and Home/End) move between
 * items; Enter/Space (native `<button>`) select; Escape closes the popup only
 * (it `stopPropagation`s so the keyboard itself stays open); a click outside
 * closes it. Returning focus to the originating key is handled by the parent.
 */
export function VariantsPopup({
  glyphs,
  onSelect,
  onClose,
  left,
  top,
  label = "Character variants",
}: VariantsPopupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const [active, setActive] = useState(0);

  useOnClickOutside(ref, onClose);

  // Move focus into the popup on open.
  useEffect(() => {
    itemsRef.current[0]?.focus();
  }, []);

  const focusItem = (index: number) => {
    const next = (index + glyphs.length) % glyphs.length;
    setActive(next);
    itemsRef.current[next]?.focus();
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        // Handle here and stop it bubbling to the keyboard's roving nav.
        event.preventDefault();
        event.stopPropagation();
        focusItem(active + 1);
        return;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        event.stopPropagation();
        focusItem(active - 1);
        return;
      case "Home":
        event.preventDefault();
        event.stopPropagation();
        focusItem(0);
        return;
      case "End":
        event.preventDefault();
        event.stopPropagation();
        focusItem(glyphs.length - 1);
        return;
      case "Escape":
        // Close the popup only — don't let Escape bubble to the keyboard.
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      default:
        return;
    }
  };

  return (
    <div
      ref={ref}
      role="menu"
      aria-label={label}
      className={styles.popup}
      style={{ left, top }}
      onKeyDown={onKeyDown}
    >
      {glyphs.map((glyph, index) => (
        <button
          key={`${glyph}-${index}`}
          ref={(el) => {
            itemsRef.current[index] = el;
          }}
          type="button"
          role="menuitem"
          tabIndex={index === active ? 0 : -1}
          className={styles.item}
          onClick={() => onSelect(glyph)}
        >
          {glyph}
        </button>
      ))}
    </div>
  );
}

VariantsPopup.displayName = "VariantsPopup";
