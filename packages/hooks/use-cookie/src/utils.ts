/**
 * Pure, framework-agnostic helpers for reading and writing `document.cookie`.
 * These are unit-tested in isolation and used by {@link useCookie}.
 */

/**
 * The `SameSite` cookie attribute values.
 *
 * - `"strict"` — cookie is sent only for same-site requests.
 * - `"lax"` — cookie is sent on same-site requests and top-level navigations.
 * - `"none"` — cookie is sent on all requests; **requires `secure: true`**.
 */
export type SameSite = "strict" | "lax" | "none";

/**
 * Cookie write attributes, mirroring the standard `Set-Cookie` directives.
 * These control how the cookie is persisted by the browser.
 */
export interface CookieAttributes {
  /**
   * Expiry of the cookie. Either an absolute `Date`, or a number of **days**
   * from now (e.g. `7` = expires in a week). Omit for a session cookie.
   */
  expires?: Date | number;
  /**
   * `Max-Age` in **seconds** from now. Takes precedence over `expires` in
   * browsers that support it. Use `0` or a negative number to expire immediately.
   */
  maxAge?: number;
  /**
   * The URL path the cookie is scoped to.
   * @default "/"
   */
  path?: string;
  /** The domain the cookie is scoped to (e.g. `.example.com`). */
  domain?: string;
  /** When `true`, the cookie is only sent over HTTPS. */
  secure?: boolean;
  /** The `SameSite` policy. `"none"` requires `secure: true`. */
  sameSite?: SameSite;
}

/** `true` when running in an environment that exposes `document`. */
export function isDocumentAvailable(): boolean {
  return typeof document !== "undefined";
}

/** Capitalize the first letter (e.g. `"lax"` → `"Lax"`) for the `SameSite` directive. */
function capitalizeSameSite(value: SameSite): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Default serializer — JSON-encodes any value.
 * @default JSON.stringify
 */
export function defaultSerializer<T>(value: T): string {
  return JSON.stringify(value);
}

/**
 * Default deserializer — tries `JSON.parse`, and **falls back to the raw
 * string** if the value is not valid JSON. Cookies are very often plain,
 * non-JSON strings (set by a server or another library), so this never throws
 * on a legacy/plain value: `"bar"` stays `"bar"`, while `'{"a":1}'` becomes
 * `{ a: 1 }`.
 */
export function defaultDeserializer<T>(value: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as unknown as T;
  }
}

/**
 * Parse a raw `document.cookie` string and return the **decoded** value for
 * `key`, or `undefined` when the key is absent. Pure — does not touch
 * `document`, so it is trivially testable.
 *
 * @param cookieString - The raw `document.cookie` value (e.g. `"a=1; b=2"`).
 * @param key - The (un-encoded) cookie name to look up.
 */
export function parseCookie(
  cookieString: string,
  key: string
): string | undefined {
  if (!cookieString) return undefined;

  const pairs = cookieString.split("; ");
  for (const pair of pairs) {
    const eqIndex = pair.indexOf("=");
    const rawName = eqIndex > -1 ? pair.slice(0, eqIndex) : pair;

    let name: string;
    try {
      name = decodeURIComponent(rawName);
    } catch {
      name = rawName;
    }

    if (name === key) {
      const rawValue = eqIndex > -1 ? pair.slice(eqIndex + 1) : "";
      try {
        return decodeURIComponent(rawValue);
      } catch {
        return rawValue;
      }
    }
  }

  return undefined;
}

/**
 * Read the decoded value of a cookie from `document.cookie`, guarding for SSR.
 * Returns `undefined` on the server or when the cookie is absent.
 */
export function readRawCookie(key: string): string | undefined {
  if (!isDocumentAvailable()) return undefined;
  return parseCookie(document.cookie, key);
}

/**
 * Build a `document.cookie` assignment string for a cookie, encoding the name
 * and value and appending the standard attributes. Pure and testable.
 *
 * @example
 * buildCookieString("theme", "dark", { path: "/", maxAge: 3600 })
 * // => "theme=dark; Path=/; Max-Age=3600"
 */
export function buildCookieString(
  name: string,
  value: string,
  attributes: CookieAttributes = {}
): string {
  const { expires, maxAge, path = "/", domain, secure, sameSite } = attributes;

  let str = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (expires !== undefined) {
    const date =
      typeof expires === "number"
        ? new Date(Date.now() + expires * 864e5)
        : expires;
    str += `; Expires=${date.toUTCString()}`;
  }

  if (maxAge !== undefined) {
    str += `; Max-Age=${maxAge}`;
  }

  if (path) {
    str += `; Path=${path}`;
  }

  if (domain) {
    str += `; Domain=${domain}`;
  }

  if (secure) {
    str += "; Secure";
  }

  if (sameSite) {
    str += `; SameSite=${capitalizeSameSite(sameSite)}`;
  }

  return str;
}

/**
 * Build the `document.cookie` assignment string that **deletes** a cookie. The
 * value is emptied and the cookie is expired in the past (`Max-Age=-1` plus an
 * epoch `Expires`). The same `path`/`domain` used to write it must be provided,
 * otherwise the browser treats it as a different cookie and deletion is a no-op.
 */
export function buildRemovalCookieString(
  name: string,
  attributes: Pick<CookieAttributes, "path" | "domain"> = {}
): string {
  const { path = "/", domain } = attributes;

  let str = `${encodeURIComponent(name)}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=-1`;

  if (path) {
    str += `; Path=${path}`;
  }

  if (domain) {
    str += `; Domain=${domain}`;
  }

  return str;
}
