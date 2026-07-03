/**
 * The size of the browser window.
 */
export interface WindowSize {
  /**
   * The width of the window in pixels.
   */
  width: number;
  /**
   * The height of the window in pixels.
   */
  height: number;
}

/**
 * Callback fired whenever the tracked window size changes.
 *
 * @param size - The new window size
 */
export type OnWindowSizeChange = (size: WindowSize) => void;

/**
 * Options for configuring the useWindowSize hook.
 */
export interface UseWindowSizeOptions {
  /**
   * Width returned before the window can be measured (SSR / first server render).
   * @default 0
   */
  initialWidth?: number;

  /**
   * Height returned before the window can be measured (SSR / first server render).
   * @default 0
   */
  initialHeight?: number;

  /**
   * Debounce resize updates by this many milliseconds.
   * Only the last resize within the window is applied. Mutually exclusive with
   * `throttleMs` — if both are set, `debounceMs` takes precedence.
   * @default 0
   */
  debounceMs?: number;

  /**
   * Throttle resize updates to at most once per this many milliseconds.
   * Ignored when `debounceMs` is set.
   * @default 0
   */
  throttleMs?: number;

  /**
   * Whether to include the scrollbar in the measured size.
   * When `true`, uses `window.innerWidth`/`innerHeight` (includes scrollbar).
   * When `false`, uses `document.documentElement.clientWidth`/`clientHeight`
   * (excludes scrollbar).
   * @default true
   */
  includeScrollbar?: boolean;

  /**
   * Whether size tracking is enabled.
   * When `false`, no resize listener is attached and the last known size is kept.
   * @default true
   */
  enabled?: boolean;

  /**
   * Callback fired whenever the window size changes.
   *
   * @example
   * ```tsx
   * useWindowSize({
   *   onChange: ({ width }) => {
   *     if (width < 768) closeSidebar();
   *   },
   * });
   * ```
   */
  onChange?: OnWindowSizeChange;
}

/**
 * Return value of the useWindowSize hook: the current window size.
 */
export type UseWindowSizeReturn = WindowSize;
