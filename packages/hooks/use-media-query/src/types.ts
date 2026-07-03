/**
 * Options for the useMediaQuery hook.
 */
export interface UseMediaQueryOptions {
  /**
   * Value returned on the server and, when `initializeWithValue` is `false`,
   * on the first client render — before the media query can be evaluated.
   * Choose this to match your SSR output and avoid hydration mismatches.
   * @default false
   */
  defaultValue?: boolean;

  /**
   * Whether to read the real match synchronously on the first client render.
   * Set to `false` for SSR to guarantee the first client render matches the
   * server (`defaultValue`), then update in an effect.
   * @default true
   */
  initializeWithValue?: boolean;
}
