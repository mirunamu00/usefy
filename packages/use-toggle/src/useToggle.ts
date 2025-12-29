import { useCallback, useState } from "react";

/**
 * useToggle return type
 */
export interface UseToggleReturn {
  /**
   * Current toggle state
   */
  value: boolean;
  /**
   * Toggle the current state
   */
  toggle: () => void;
  /**
   * Set state to true
   */
  setTrue: () => void;
  /**
   * Set state to false
   */
  setFalse: () => void;
  /**
   * Set state to a specific value
   */
  setValue: (value: boolean) => void;
}

/**
 * A hook for managing boolean state with helpful utilities
 *
 * @param initialValue - Initial boolean value (default: false)
 * @returns Object containing the current value and control functions
 *
 * @example
 * ```tsx
 * function Modal() {
 *   const { value: isOpen, toggle, setTrue, setFalse } = useToggle(false);
 *
 *   return (
 *     <>
 *       <button onClick={setTrue}>Open</button>
 *       <button onClick={toggle}>Toggle</button>
 *       {isOpen && <div>Modal Content</div>}
 *     </>
 *   );
 * }
 * ```
 */
export function useToggle(initialValue: boolean = false): UseToggleReturn {
  const [value, setValue] = useState<boolean>(initialValue);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  const setValueCallback = useCallback((newValue: boolean) => {
    setValue(newValue);
  }, []);

  return {
    value,
    toggle,
    setTrue,
    setFalse,
    setValue: setValueCallback,
  };
}
