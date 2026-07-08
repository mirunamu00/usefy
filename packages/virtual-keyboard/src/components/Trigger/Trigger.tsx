import { forwardRef, type ReactNode } from "react";
import { clsx } from "clsx";
import styles from "./Trigger.module.scss";

export interface TriggerProps {
  /**
   * The visual affordance (an icon, text, or any **non-interactive** node — it is
   * wrapped in a `<button>`, so it must not itself be a button/link/input).
   */
  children: ReactNode;
  /** Current open state — reflected as `aria-expanded`. */
  open: boolean;
  /** The id of the keyboard element this trigger controls (`aria-controls`). */
  controls: string;
  /** Toggle the keyboard open/closed. */
  onToggle: () => void;
  /**
   * Explicit accessible name. Leave `undefined` when the trigger has visible text
   * (its content becomes the name); set it for an icon-only trigger.
   */
  label?: string;
  /** Extra class on the trigger button. */
  className?: string;
}

/**
 * The "keyboard icon" affordance. Wraps arbitrary **non-interactive** content in
 * a real `<button>` so it is keyboard-operable (Enter/Space), and wires the ARIA
 * relationship to the keyboard it toggles: `aria-expanded` reflects the open
 * state and `aria-controls` points at the keyboard's id.
 *
 * The accessible name comes from the visible content by default; pass `label`
 * only for an icon-only trigger (it becomes `aria-label`). It never forces an
 * `aria-label` over visible text — that would break voice control (WCAG 2.5.3).
 *
 * @example
 * ```tsx
 * <Trigger open={open} controls={id} onToggle={toggle} label="Open keyboard">
 *   <KeyboardIcon />
 * </Trigger>
 * ```
 */
export const Trigger = forwardRef<HTMLButtonElement, TriggerProps>(
  function Trigger(
    { children, open, controls, onToggle, label, className },
    ref
  ) {
    return (
      <button
        ref={ref}
        type="button"
        aria-expanded={open}
        aria-controls={controls}
        aria-label={label}
        onClick={onToggle}
        className={clsx(styles.trigger, className)}
      >
        {children}
      </button>
    );
  }
);

Trigger.displayName = "Trigger";
