/**
 * Lifetime attendance figures = admin-seeded history + the running week.
 *
 * Day-wise P/A/L marks are only stored for the week in progress, so the
 * all-time "Total Study Days" / "Total Present Days" numbers on the dashboard
 * cannot be derived from marks alone. An administrator seeds the history on the
 * batch (`baseStudyDays` / `basePresentDays`); every mark entered for the
 * running week then increases both figures automatically — a marked day is a
 * study day, a P/L day is a present day. The donut percentage is present over
 * study across that combined lifetime, exactly as the reference computes it.
 */

export interface AttendanceTotals {
  studyDays: number;
  presentDays: number;
  /** 0-100, rounded; 0 when nothing has been counted yet. */
  percent: number;
}

export function attendanceTotals(
  baseStudyDays: number | undefined,
  basePresentDays: number | undefined,
  markedDays: number,
  presentMarkedDays: number,
): AttendanceTotals {
  const study = Math.max(0, Math.round(baseStudyDays ?? 0)) + Math.max(0, markedDays);
  const present = Math.max(0, Math.round(basePresentDays ?? 0)) + Math.max(0, presentMarkedDays);
  const capped = Math.min(present, study); // a seed typo must never show >100%
  return {
    studyDays: study,
    presentDays: capped,
    percent: study > 0 ? Math.round((capped / study) * 100) : 0,
  };
}
