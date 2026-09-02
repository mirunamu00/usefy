/**
 * Story design system.
 *
 * The rules every token here follows, so demos read as one deliberate surface
 * instead of a pile of defaults:
 *
 * - **One accent.** The brand violet, always flat. The indigo→violet gradient
 *   belongs to the logo; in the UI it is a single solid fill on the primary
 *   action and nothing else. Colour is never used to decorate.
 * - **Hairlines, not shadows.** Separation comes from a 1px zinc border. The
 *   only shadow token is `elevated`, for things that genuinely float.
 * - **One radius.** 6px (`rounded-md`) on every surface, 4px inside it.
 * - **Hierarchy from scale and space**, never from colouring or bolding words.
 * - **Motion is feedback, not personality.** Colour transitions at 150ms. No
 *   lift on hover, no springs.
 * - **Mono is for code and for numbers that change**, so digits stop jittering.
 */

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

// Sized to sit alongside the buttons the stories hand-roll, so a demo mixing
// both still reads as one control set.
const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 px-5 py-3 text-base font-medium rounded-md cursor-pointer transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed " +
  FOCUS;

export const storyTheme = {
  // Containers
  container: "p-8 max-w-[600px] font-sans mx-auto text-zinc-900",
  containerCentered:
    "p-8 text-center font-sans max-w-[500px] mx-auto text-zinc-900",
  containerWide: "p-8 max-w-[880px] font-sans mx-auto text-zinc-900",

  // Titles — solid ink, scale does the work
  title: "text-2xl font-semibold tracking-tight text-zinc-900 mb-1.5",
  titleLarge: "text-2xl font-semibold tracking-tight text-zinc-900 mb-6",
  subtitle: "text-sm text-zinc-500 leading-relaxed mb-6",
  sectionTitle:
    "text-sm font-semibold text-zinc-900 mb-3 pb-2 border-b border-zinc-200",

  // Input fields
  input:
    "w-full px-3 py-2 text-sm text-zinc-900 bg-white border border-zinc-300 rounded-md outline-none transition-colors duration-150 placeholder:text-zinc-400 focus:border-violet-600 focus:ring-1 focus:ring-violet-600 disabled:bg-zinc-50 disabled:text-zinc-400",
  textarea:
    "w-full px-3 py-2 text-sm text-zinc-900 bg-white border border-zinc-300 rounded-md outline-none transition-colors duration-150 resize-y placeholder:text-zinc-400 focus:border-violet-600 focus:ring-1 focus:ring-violet-600",
  textareaMono:
    "w-full px-3 py-2 text-xs font-mono text-zinc-900 bg-white border border-zinc-300 rounded-md outline-none transition-colors duration-150 resize-y placeholder:text-zinc-400 focus:border-violet-600 focus:ring-1 focus:ring-violet-600",
  select:
    "px-3 py-2 text-sm text-zinc-900 bg-white border border-zinc-300 rounded-md outline-none transition-colors duration-150 focus:border-violet-600 focus:ring-1 focus:ring-violet-600",

  // Labels
  label: "block mb-1.5 text-sm font-medium text-zinc-700",

  // Cards / boxes — one flat surface, hairline edge
  card: "p-4 bg-white border border-zinc-200 rounded-md",
  cardMuted: "p-4 bg-zinc-50 border border-zinc-200 rounded-md",
  cardInfo: "p-4 bg-zinc-50 border border-zinc-200 rounded-md text-zinc-700",
  cardSuccess:
    "p-4 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-900",
  cardWarning:
    "p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-900",
  cardError: "p-4 bg-red-50 border border-red-200 rounded-md text-red-900",

  // Dark panel — the one place a demo shouts, for a single headline value
  panel: "bg-zinc-900 text-white rounded-md p-6",
  /** @deprecated Kept for existing call sites; renders the solid dark panel. */
  gradientBox: "bg-zinc-900 text-white rounded-md p-6",

  // Buttons — accent for the primary action, neutrals for everything else
  buttonPrimary:
    BUTTON_BASE + " text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800",
  buttonSecondary:
    BUTTON_BASE + " text-zinc-900 bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300",
  buttonNeutral:
    BUTTON_BASE +
    " text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100",
  buttonSuccess:
    BUTTON_BASE + " text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800",
  buttonDanger:
    BUTTON_BASE + " text-white bg-red-600 hover:bg-red-700 active:bg-red-800",
  buttonGhost:
    BUTTON_BASE + " text-zinc-600 bg-transparent hover:bg-zinc-100 hover:text-zinc-900",
  buttonFull:
    BUTTON_BASE +
    " w-full text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800",

  // Button groups
  buttonGroup: "flex flex-wrap gap-2",
  buttonGroupFull: "flex flex-wrap gap-2 mb-5",

  // Info boxes — neutral surface; the sentence carries the meaning
  infoBox: "p-3.5 bg-zinc-50 border border-zinc-200 rounded-md",
  infoText: "m-0 text-sm text-zinc-600 leading-relaxed",

  // Inline result messages
  messageSuccess:
    "text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 mt-3",
  messageError:
    "text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 mt-3",
  messageInfo:
    "text-sm text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2 mt-3",

  // List items
  listItem:
    "flex items-center justify-between px-3.5 py-2.5 bg-white border border-zinc-200 rounded-md mb-2 text-sm transition-colors duration-150 hover:bg-zinc-50",
  listItemStatic:
    "flex items-center justify-between px-3.5 py-2.5 bg-white border border-zinc-200 rounded-md mb-2 text-sm",

  // Statistics / readouts
  statBox: "p-4 bg-zinc-50 border border-zinc-200 rounded-md",
  statLabel: "text-xs font-medium text-zinc-500 mb-1",
  statValue: "text-lg font-semibold text-zinc-900 font-mono tabular-nums",
  statValueLarge:
    "text-3xl font-semibold tracking-tight text-zinc-900 font-mono tabular-nums",
  statText: "text-sm text-zinc-700",
  statTextSecondary: "text-sm text-zinc-500",

  // Code
  code: "font-mono text-xs bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded",
  codeBlock:
    "font-mono text-xs leading-relaxed bg-zinc-950 text-zinc-100 p-3.5 rounded-md overflow-auto",

  // Badges — only for real status
  badge:
    "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-zinc-100 text-zinc-700",
  badgeAccent:
    "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-violet-50 text-violet-700",
  badgeSuccess:
    "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-emerald-50 text-emerald-700",
  badgeWarning:
    "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-amber-50 text-amber-700",
  badgeDanger:
    "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-red-50 text-red-700",

  // Flat status dots — always paired with a word, never haloed
  dot: "inline-block w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0",
  dotActive: "inline-block w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0",
  dotIdle: "inline-block w-1.5 h-1.5 rounded-full bg-zinc-300 shrink-0",
  dotDanger: "inline-block w-1.5 h-1.5 rounded-full bg-red-600 shrink-0",

  // Layout helpers
  grid2: "grid grid-cols-2 gap-3",
  grid3: "grid grid-cols-3 gap-3",
  stack: "flex flex-col gap-3",
  row: "flex items-center gap-2",

  // The one shadow, for things that actually float
  elevated:
    "bg-white border border-zinc-200 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.08)]",

  // Divider
  divider: "mt-4 pt-4 border-t border-zinc-200",
  hairline: "border-t border-zinc-200",

  // Focus ring, for hand-rolled interactive elements
  focusRing: FOCUS,
};
