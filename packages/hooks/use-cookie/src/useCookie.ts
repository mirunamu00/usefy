import { useCallback, useRef, useSyncExternalStore } from "react";
import { subscribe, notifyListeners } from "./store";
import {
  buildCookieString,
  buildRemovalCookieString,
  defaultDeserializer,
  defaultSerializer,
  isDocumentAvailable,
  readRawCookie,
  type CookieAttributes,
} from "./utils";

export type { CookieAttributes, SameSite } from "./utils";

/**
 * Type for the initial value that can be a value or a function returning a value
 * (lazy initialization).
 */
export type InitialValue<T> = T | (() => T);

/**
 * Options for the {@link useCookie} hook. Combines serialization/lifecycle
 * options (aligned with `@usefy/use-local-storage`) with the cookie-specific
 * write attributes from {@link CookieAttributes}.
 */
export interface UseCookieOptions<T> extends CookieAttributes {
  /**
   * Initial value used when the cookie is absent (or on the server). Supports a
   * lazy initializer function. This is also the value the state resets to when
   * {@link UseCookieReturn} `remove()` is called.
   */
  initialValue?: InitialValue<T>;
  /**
   * Custom serializer for converting the value to the stored cookie string.
   * @default JSON.stringify
   */
  serializer?: (value: T) => string;
  /**
   * Custom deserializer for parsing the stored cookie string back to a value.
   * The default tries `JSON.parse` and **falls back to the raw string** for
   * non-JSON cookies (so a plain `foo=bar` cookie never throws).
   * @default (value) => { try { return JSON.parse(value) } catch { return value } }
   */
  deserializer?: (value: string) => T;
  /** Callback invoked when a serialization/deserialization error occurs. */
  onError?: (error: Error) => void;
}

/**
 * Return type for {@link useCookie} — a tuple similar to `useState`.
 */
export type UseCookieReturn<T> = readonly [
  /** Current cookie value (`undefined` when the cookie is absent and no `initialValue` was given). */
  T | undefined,
  /** Update the cookie value. Accepts a value or a functional updater `(prev) => next`. */
  React.Dispatch<React.SetStateAction<T | undefined>>,
  /** Delete the cookie and reset state to `initialValue` (or `undefined`). */
  () => void
];

/**
 * Resolve an initial value, supporting a lazy initializer function.
 */
function resolveInitialValue<T>(
  initialValue: InitialValue<T> | undefined
): T | undefined {
  return typeof initialValue === "function"
    ? (initialValue as () => T)()
    : initialValue;
}

/**
 * A hook for reading and writing a browser **cookie** as React state — the
 * cookie sibling of `@usefy/use-local-storage` and `@usefy/use-session-storage`.
 * Works like `useState` but the value is persisted in `document.cookie`.
 *
 * Features:
 * - **`useState`-like tuple**: `[value, setValue, remove]`.
 * - **Same-document sync**: multiple `useCookie(key)` instances stay in sync.
 * - **SSR-safe**: guards all `document` access and returns `initialValue` on the
 *   server (uses `useSyncExternalStore`, identical to its storage siblings, to
 *   avoid hydration mismatches).
 * - **Cookie attributes**: `expires`, `maxAge`, `path`, `domain`, `secure`,
 *   `sameSite`.
 * - **Safe (de)serialization**: JSON by default, with a graceful fallback to the
 *   raw string for plain (non-JSON) cookies.
 *
 * > **Cross-tab note:** cookies have no `storage` event, so writes in *other*
 * > tabs are not observed without polling. Same-document instances always sync.
 *
 * @template T - The type of the stored value
 * @param key - The cookie name
 * @param options - Serialization, initial value, and cookie write attributes
 * @returns A tuple of `[value, setValue, remove]`
 *
 * @example
 * ```tsx
 * // Basic usage — a string cookie
 * function ThemeToggle() {
 *   const [theme, setTheme, removeTheme] = useCookie("theme", {
 *     initialValue: "light",
 *   });
 *
 *   return (
 *     <div>
 *       <p>Current theme: {theme}</p>
 *       <button onClick={() => setTheme("dark")}>Dark</button>
 *       <button onClick={removeTheme}>Reset</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With cookie attributes — persist for a week over HTTPS only
 * const [token, setToken] = useCookie<string>("token", {
 *   expires: 7, // days (or a Date)
 *   path: "/",
 *   secure: true,
 *   sameSite: "strict",
 * });
 * ```
 *
 * @example
 * ```tsx
 * // Object value with a functional update (JSON serialized)
 * interface Prefs { lang: string; compact: boolean }
 * const [prefs, setPrefs] = useCookie<Prefs>("prefs", {
 *   initialValue: { lang: "en", compact: false },
 * });
 * setPrefs((prev) => ({ ...prev!, compact: true }));
 * ```
 */
export function useCookie<T = string>(
  key: string,
  options: UseCookieOptions<T> = {}
): UseCookieReturn<T> {
  const {
    initialValue,
    serializer = defaultSerializer,
    deserializer = defaultDeserializer,
    onError,
    expires,
    maxAge,
    path,
    domain,
    secure,
    sameSite,
  } = options;

  // Store options in refs for stable references and access to the latest values.
  const serializerRef = useRef(serializer);
  const deserializerRef = useRef(deserializer);
  const onErrorRef = useRef(onError);
  const initialValueRef = useRef(initialValue);

  serializerRef.current = serializer;
  deserializerRef.current = deserializer;
  onErrorRef.current = onError;
  initialValueRef.current = initialValue;

  // Latest cookie write attributes, so setValue/remove stay stable across renders.
  const attributesRef = useRef<CookieAttributes>({});
  attributesRef.current = { expires, maxAge, path, domain, secure, sameSite };

  // Cache for getSnapshot so it returns a stable reference when the raw cookie
  // value is unchanged — required by useSyncExternalStore to avoid loops.
  const cacheRef = useRef<{
    rawValue: string | undefined;
    parsedValue: T | undefined;
  } | null>(null);

  const isClient = isDocumentAvailable();

  // Subscribe to same-document changes via the internal store.
  const subscribeToStore = useCallback(
    (onStoreChange: () => void) => {
      return subscribe(key, onStoreChange);
    },
    [key]
  );

  // getSnapshot: read the current value from document.cookie with caching.
  const getSnapshot = useCallback((): T | undefined => {
    if (!isClient) {
      return resolveInitialValue(initialValueRef.current);
    }

    try {
      const rawValue = readRawCookie(key);

      if (cacheRef.current && cacheRef.current.rawValue === rawValue) {
        return cacheRef.current.parsedValue;
      }

      let parsedValue: T | undefined;
      if (rawValue !== undefined) {
        parsedValue = deserializerRef.current(rawValue);
      } else {
        parsedValue = resolveInitialValue(initialValueRef.current);
      }

      cacheRef.current = { rawValue, parsedValue };
      return parsedValue;
    } catch (error) {
      onErrorRef.current?.(error as Error);
      const fallbackValue = resolveInitialValue(initialValueRef.current);
      cacheRef.current = { rawValue: undefined, parsedValue: fallbackValue };
      return fallbackValue;
    }
  }, [key, isClient]);

  // getServerSnapshot: return the initial value for SSR.
  const getServerSnapshot = useCallback((): T | undefined => {
    return resolveInitialValue(initialValueRef.current);
  }, []);

  const storedValue = useSyncExternalStore(
    subscribeToStore,
    getSnapshot,
    getServerSnapshot
  );

  // setValue — stable reference that writes the cookie and notifies listeners.
  const setValue = useCallback<React.Dispatch<React.SetStateAction<T | undefined>>>(
    (value) => {
      try {
        if (!isDocumentAvailable()) return;

        // Resolve the current value for functional updates.
        const currentValue = (() => {
          try {
            const raw = readRawCookie(key);
            if (raw !== undefined) {
              return deserializerRef.current(raw);
            }
            return resolveInitialValue(initialValueRef.current);
          } catch {
            return resolveInitialValue(initialValueRef.current);
          }
        })();

        const valueToStore =
          value instanceof Function ? value(currentValue) : value;

        const serialized = serializerRef.current(valueToStore as T);
        document.cookie = buildCookieString(
          key,
          serialized,
          attributesRef.current
        );

        // Invalidate cache so the next getSnapshot reads the fresh value.
        cacheRef.current = { rawValue: serialized, parsedValue: valueToStore };

        notifyListeners(key);
      } catch (error) {
        onErrorRef.current?.(error as Error);
      }
    },
    [key]
  );

  // remove — stable reference that deletes the cookie and resets to initial.
  const removeValue = useCallback(() => {
    try {
      if (!isDocumentAvailable()) return;

      document.cookie = buildRemovalCookieString(key, attributesRef.current);

      const initialVal = resolveInitialValue(initialValueRef.current);
      cacheRef.current = { rawValue: undefined, parsedValue: initialVal };

      notifyListeners(key);
    } catch (error) {
      onErrorRef.current?.(error as Error);
    }
  }, [key]);

  return [storedValue, setValue, removeValue] as const;
}
