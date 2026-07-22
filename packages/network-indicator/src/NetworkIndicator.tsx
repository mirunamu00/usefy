import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useEventCallback } from "@usefy/use-event-callback";
import { useNetworkState } from "@usefy/use-network-state";
import { useTimeout } from "@usefy/use-timeout";

/** Which screen edge the fixed banner is pinned to. */
export type NetworkIndicatorPosition = "top" | "bottom";

/**
 * The connectivity state handed to the {@link NetworkIndicatorProps.render}
 * escape hatch.
 */
export interface NetworkIndicatorState {
  /** Current connectivity, from `navigator.onLine` (`true` on the server). */
  online: boolean;
  /**
   * `true` during the brief "back online" confirmation window that follows an
   * observed offline → online transition. Never `true` on first mount.
   */
  reconnected: boolean;
}

/** Props for {@link NetworkIndicator}. */
export interface NetworkIndicatorProps {
  /**
   * Which screen edge the fixed banner is pinned to.
   * @default "top"
   */
  position?: NetworkIndicatorPosition;
  /**
   * Content of the offline banner.
   * @default "You're offline. Some features may not work."
   */
  offlineMessage?: ReactNode;
  /**
   * Content of the "back online" confirmation.
   * @default "Back online"
   */
  onlineMessage?: ReactNode;
  /**
   * How long (ms) the "back online" confirmation stays visible before
   * auto-dismissing. `0` or a negative value disables the confirmation
   * entirely — reconnecting goes straight back to rendering nothing.
   * Changing the value while the confirmation is visible restarts the
   * dismiss timer from zero with the new duration.
   * @default 3000
   */
  onlineDuration?: number;
  /**
   * Escape hatch: fully own the UI while keeping the state machine. When
   * provided, the default banner is never rendered and `render` is called on
   * every render (including steady-state online) with the current
   * {@link NetworkIndicatorState}; return `null` to render nothing.
   */
  render?: (state: NetworkIndicatorState) => ReactNode;
  /**
   * Called after each online/offline transition (never on mount) with the new
   * connectivity. Dispatched from a post-commit effect, so it is StrictMode-
   * and concurrent-rendering-safe.
   */
  onStatusChange?: (online: boolean) => void;
  /** Class name applied to the default banner element. */
  className?: string;
  /** Inline styles merged over the default banner styles (yours win). */
  style?: CSSProperties;
}

/** Default offline banner content. */
export const DEFAULT_OFFLINE_MESSAGE =
  "You're offline. Some features may not work.";

/** Default "back online" confirmation content. */
export const DEFAULT_ONLINE_MESSAGE = "Back online";

/** Default duration (ms) of the "back online" confirmation. */
export const DEFAULT_ONLINE_DURATION = 3000;

const BASE_STYLE: CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  zIndex: 9999,
  padding: "10px 16px",
  textAlign: "center",
  fontFamily:
    "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
  fontSize: 14,
  fontWeight: 500,
  lineHeight: 1.4,
  color: "#ffffff",
  // Non-interactive by default: never steal clicks from the app underneath.
  pointerEvents: "none",
};

const OFFLINE_BACKGROUND = "#b91c1c";
const RECONNECTED_BACKGROUND = "#15803d";

/**
 * A drop-in online/offline status banner.
 *
 * Renders nothing while online; shows a fixed offline banner when connectivity
 * is lost; swaps to a brief auto-dismissing "back online" confirmation when it
 * returns. The confirmation never flashes on first mount — it only ever follows
 * an observed offline → online transition. Mounting while already offline shows
 * the offline banner immediately.
 *
 * Built on `@usefy/use-network-state` (SSR-safe, tear-free connectivity) with
 * `@usefy/use-timeout` handling the auto-dismiss (cleaned up on unmount).
 *
 * Accessibility: the banner is non-interactive and `aria-atomic`. The offline
 * banner is a `role="alert"` live region (assertive; reliably announced even
 * when inserted already populated); the reconnected confirmation is a polite
 * `role="status"` (screen readers may skip announcing it when the element is
 * inserted pre-populated — it is a nicety, not critical information).
 *
 * @example
 * ```tsx
 * import { NetworkIndicator } from "@usefy/network-indicator";
 *
 * function App() {
 *   return (
 *     <>
 *       <YourApp />
 *       <NetworkIndicator position="top" onlineDuration={3000} />
 *     </>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Fully custom UI via the render escape hatch
 * <NetworkIndicator
 *   render={({ online, reconnected }) => {
 *     if (online && !reconnected) return null;
 *     return <MyToast tone={online ? "success" : "danger"} />;
 *   }}
 * />
 * ```
 */
export function NetworkIndicator({
  position = "top",
  offlineMessage = DEFAULT_OFFLINE_MESSAGE,
  onlineMessage = DEFAULT_ONLINE_MESSAGE,
  onlineDuration = DEFAULT_ONLINE_DURATION,
  render,
  onStatusChange,
  className,
  style,
}: NetworkIndicatorProps): ReactNode {
  const { online } = useNetworkState();
  const [reconnected, setReconnected] = useState(false);

  // Previous committed connectivity. `undefined` until the first commit so the
  // mount effect (and StrictMode's double invocation of it) can never register
  // a transition — no callback and no "back online" flash on first mount.
  const prevOnlineRef = useRef<boolean | undefined>(undefined);

  const emitStatusChange = useEventCallback((next: boolean) => {
    onStatusChange?.(next);
  });

  useEffect(() => {
    const prev = prevOnlineRef.current;
    prevOnlineRef.current = online;
    if (prev === undefined || prev === online) {
      return;
    }
    // A real transition: notify post-commit (never from a setState updater).
    emitStatusChange(online);
    setReconnected(online && onlineDuration > 0);
  }, [online, onlineDuration, emitStatusChange]);

  // Auto-dismiss the confirmation. `null` disables (and clears) the timer, and
  // useTimeout cleans up on unmount. If `onlineDuration` drops to <= 0 while
  // the confirmation is visible, the clamped 0ms timeout dismisses it at once.
  useTimeout(
    () => setReconnected(false),
    reconnected ? Math.max(0, onlineDuration) : null
  );

  if (render) {
    return <>{render({ online, reconnected })}</>;
  }

  const offline = !online;
  if (!offline && !reconnected) {
    return null;
  }

  return (
    <div
      // Offline uses role="alert" — the canonical assertive live region, and the
      // one role screen readers reliably announce even when the element is
      // inserted already populated. The reconnected confirmation is a polite
      // role="status". The implicit aria-live of each role applies.
      role={offline ? "alert" : "status"}
      aria-atomic="true"
      data-status={offline ? "offline" : "reconnected"}
      data-position={position}
      className={className}
      style={{
        ...BASE_STYLE,
        ...(position === "bottom" ? { bottom: 0 } : { top: 0 }),
        backgroundColor: offline ? OFFLINE_BACKGROUND : RECONNECTED_BACKGROUND,
        ...style,
      }}
    >
      {offline ? offlineMessage : onlineMessage}
    </div>
  );
}
