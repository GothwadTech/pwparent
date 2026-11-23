/**
 * One place that decides what a test card says — for the parent app and for the
 * admin panel.
 *
 * ── WHY THIS FILE EXISTS ───────────────────────────────────────────────────
 * A test used to carry only `scheduled | completed`, and the parent app invented
 * its own labels on top: `UPCOMING` in one list, `RESULT_AWAITING` in another.
 * The two lists disagreed about the same test, and a test dated NEXT WEEK was
 * shown to parents as "Result has not been announced yet".
 *
 * Now the stored status is explicit (`upcoming | completed | cancelled`) and the
 * label a parent sees is derived in ONE function, from the status, the test's
 * own date and the child's result row.
 *
 * ── PRODUCTION DATA ────────────────────────────────────────────────────────
 * Every document written before this change says `scheduled`. That value is
 * still read and treated exactly like `upcoming` — no migration rewrites it, and
 * nothing here mutates a stored test. `scheduled` simply stops being written.
 */
import type {BatchTestStatus, TestResult} from '../types';

/**
 * The chip a parent sees on a test card.
 *
 * `RESULT_AWAITING` covers both "the paper was held and marks are not entered"
 * and "the admin marked it completed but nobody has typed a score yet" — from a
 * parent's side those are the same thing: no result to show, and none claimed.
 */
export type TestDisplayStatus =
  | 'UPCOMING'
  | 'RESULT_AWAITING'
  | 'ATTEMPTED'
  | 'MISSED'
  | 'CANCELLED';

/** `scheduled` is the pre-existing spelling of `upcoming` — read, never written. */
export const isUpcomingStatus = (status: BatchTestStatus | undefined): boolean =>
  status === 'upcoming' || status === 'scheduled';

/**
 * The one derivation. Order matters:
 *
 *   1. A cancelled test is cancelled, whatever else is true of it.
 *   2. A result row wins: if marks exist, the parent sees ATTEMPTED or MISSED.
 *   3. No result + a date that has not arrived yet (or arrives today) → UPCOMING.
 *   4. No result, everything else → RESULT_AWAITING.
 *
 * `today` is an ISO `YYYY-MM-DD` string, so plain string comparison is a date
 * comparison — no timezone drift, no Date parsing.
 */
export const testDisplayStatus = (
  test: Pick<{status: BatchTestStatus; date: string}, 'status' | 'date'>,
  result: Pick<TestResult, 'status'> | null,
  today: string,
): TestDisplayStatus => {
  if (test.status === 'cancelled') return 'CANCELLED';
  if (result) return result.status === 'ATTEMPTED' ? 'ATTEMPTED' : 'MISSED';
  if (isUpcomingStatus(test.status) && test.date >= today) return 'UPCOMING';
  return 'RESULT_AWAITING';
};

/**
 * Does this test belong in the parent's "attempted / total" counter?
 *
 * A test that has not happened yet, or that was called off, must not sit in the
 * denominator: 2 of 7 reads like failure when five papers are still ahead.
 */
export const countsTowardsTotal = (
  test: Pick<{status: BatchTestStatus; date: string}, 'status' | 'date'>,
  today: string,
): boolean => {
  if (test.status === 'cancelled') return false;
  return !(isUpcomingStatus(test.status) && test.date >= today);
};

/** The three choices the admin picks from, and the label shown beside them. */
export const TEST_STATUS_OPTIONS: {value: BatchTestStatus; label: string}[] = [
  {value: 'upcoming', label: 'Upcoming'},
  {value: 'completed', label: 'Completed'},
  {value: 'cancelled', label: 'Cancelled'},
];

/** Admin list label. `scheduled` reads as Upcoming, because that is what it means. */
export const adminStatusLabel = (status: BatchTestStatus | undefined): string => {
  if (isUpcomingStatus(status)) return 'Upcoming';
  if (status === 'cancelled') return 'Cancelled';
  return 'Completed';
};

/**
 * Normalise a status typed into an imported JSON payload.
 *
 * An empty/missing status keeps the old default (`completed`) so existing
 * payloads import exactly as before, and the per-result spellings (`ATTEMPTED`,
 * `MISSED`) still mean a paper was held. A status that is present but unknown is
 * an ERROR: silently turning `POSTPONED` or a typo into "completed" hides a
 * mistake in a bulk import that nobody can see afterwards.
 */
export const normalizeStatusInput = (raw: string | undefined, title: string): BatchTestStatus => {
  const value = (raw ?? '').trim().toUpperCase();
  if (!value) return 'completed';
  if (value === 'UPCOMING' || value === 'SCHEDULED') return 'upcoming';
  // `ATTEMPTED` / `MISSED` are result statuses, and a payload that carries one
  // for a test is describing a paper that was held — so the test is Completed.
  if (value === 'COMPLETED' || value === 'DONE' || value === 'ATTEMPTED' || value === 'MISSED') {
    return 'completed';
  }
  if (value === 'CANCELLED' || value === 'CANCELED') return 'cancelled';
  throw new Error(
    `"${title}" ka status "${raw}" samajh nahi aaya. Upcoming, Completed ya Cancelled — inme se ek likhiye.`,
  );
};

/** An import line that carries no marks for the student: Upcoming or Cancelled. */
export const isResultlessImportStatus = (raw: string | undefined): boolean => {
  const value = (raw ?? '').trim().toUpperCase();
  return (
    value === 'UPCOMING' ||
    value === 'SCHEDULED' ||
    value === 'CANCELLED' ||
    value === 'CANCELED'
  );
};
