/**
 * The ONE light theme of the app.
 *
 * The app used to be dark (`#0a0b10` pages, `#11121c` cards) while the support
 * screen was already light — two visual languages in one product. The reference
 * the app is matched to is the real parent-app look: a near-white page, white
 * cards, lavender stat tiles and a single indigo accent. Every screen pulls its
 * colours from here so a future change is one edit, not fifty.
 *
 * There is deliberately NO dark variant and no toggle. One theme, always.
 */

/** Page background — the canvas everything sits on. */
export const PAGE_BG = '#F4F5F7';

/** Slightly lighter band used for sticky headers and the top bar. */
export const HEADER_BG = '#F7F8FA';

/** Card surface. */
export const CARD_BG = '#FFFFFF';

/** Hairline border around cards and inputs. */
export const CARD_BORDER = '#E4E6EB';

/** Lavender tile behind a label/value pair (Score, Rank, …). */
export const TILE_BG = '#EAEEF9';

/** Bigger lavender summary card (Test / DPP roll-ups). */
export const SUMMARY_BG = '#EBEAF9';

/** Inset neutral surface (empty states, week strip container). */
export const INSET_BG = '#F1F2F4';

/** Primary text. */
export const TEXT_PRIMARY = '#17181C';

/** Secondary text — dates, captions. */
export const TEXT_SECONDARY = '#6B7280';

/** Tertiary text — disabled, hints. */
export const TEXT_TERTIARY = '#9AA0A8';

/** The single brand accent — ring, timeline, active tab, links. */
export const ACCENT = '#5747D6';

/** Deep indigo used for figures (scores, ranks, percentages). */
export const FIGURE = '#2E2A87';

/** Thick band separating dashboard sections. */
export const SECTION_BAND = '#DCDEE3';

/** Charcoal fill for the active segment of a tab control. */
export const SEGMENT_ACTIVE = '#3E4147';

/* ── status pills ─────────────────────────────────────────────────────────── */
export const PILL_ATTEMPTED_BG = '#D8F0DE';
export const PILL_ATTEMPTED_TEXT = '#1E7E43';
export const PILL_MISSED_BG = '#FBE0E5';
export const PILL_MISSED_TEXT = '#B02A43';
export const PILL_AWAITING_BG = '#FBF1D7';
export const PILL_AWAITING_TEXT = '#B7791F';

/* ── attendance calendar ──────────────────────────────────────────────────── */
export const CAL_TODAY_COL_BG = '#E8F1FB';
export const CAL_TODAY_COL_BORDER = '#7FB3E8';
export const CAL_TODAY_CHIP_BG = '#EFEBFC';
export const CAL_TODAY_CHIP_BORDER = '#8B7BE8';
export const LEGEND_TODAY = '#6C5CE7';
export const LEGEND_NO_CLASS = '#B9BEC7';
export const LEGEND_PRESENT = '#3E9C63';
export const LEGEND_ABSENT = '#C0392B';

/* ── charts ───────────────────────────────────────────────────────────────── */
export const BAR_ASSIGNED = '#A8CFEA';
export const BAR_ATTEMPTED = ACCENT;
export const PROGRESS_TRACK = '#DCDEE3';
export const PROGRESS_FILL = '#F0A32F';

/* ── streak pill ──────────────────────────────────────────────────────────── */
export const STREAK_BG = '#FDF3D8';
export const STREAK_BORDER = '#F2DFA8';
export const STREAK_TEXT = '#8A6D1A';

/**
 * Composed class strings for the primitives that repeat on every screen.
 * Components use these instead of re-typing hexes, which is what let the old
 * dark palette drift into fifty slightly different values.
 */
export const cls = {
  card: 'bg-white border border-[#E4E6EB] rounded-xl',
  tile: 'bg-[#EAEEF9] rounded-lg px-3 py-2.5',
  pillBase: 'text-[10px] font-extrabold tracking-wide px-2.5 py-1 rounded-md',
  sectionTitle: 'text-[17px] font-extrabold text-[#17181C] tracking-tight',
} as const;

/**
 * Status → pill colours. One place so a new status cannot silently render
 * unstyled.
 */
export function statusPillClasses(status: string): { bg: string; text: string } {
  switch (status) {
    case 'ATTEMPTED':
    case 'ATTENDED':
      return { bg: PILL_ATTEMPTED_BG, text: PILL_ATTEMPTED_TEXT };
    case 'MISSED':
      return { bg: PILL_MISSED_BG, text: PILL_MISSED_TEXT };
    case 'RESULT_AWAITING':
      return { bg: PILL_AWAITING_BG, text: PILL_AWAITING_TEXT };
    default:
      return { bg: INSET_BG, text: TEXT_SECONDARY };
  }
}
