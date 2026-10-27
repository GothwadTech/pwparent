/**
 * Offline / centre dashboard — a thin composition of three sections separated by
 * thick neutral bands, matched to the reference look.
 *
 *   AttendanceCalendarSection   donut + day counts + weekly strip + legend
 *   DppSection                  lavender roll-up + monthly assigned/attempted bars
 *   CenterTestsSection          lavender roll-up + recent-tests timeline
 *
 * There is NO fallback or sample data in here. Every figure is a prop supplied
 * from `useBatchView` / `useDppView`; when a batch has nothing entered yet the
 * sections render honest zeros and empty states. The old built-in "sample week"
 * and hardcoded scores were demo data and are gone.
 *
 * `CalendarDay` and `OfflineTestRow` stay EXPORTED FROM HERE because useBatchView
 * and ChildDashboardScreen import them from this module.
 */
import React, { useMemo } from 'react';
import { StudentProfile } from '../types';
import type { BatchSummary } from '../hooks/useBatchView';
import type { DppSummary } from '../hooks/useDppView';
import { AttendanceCalendarSection } from './AttendanceCalendarSection';
import { DppSection } from './DppSection';
import { CenterTestsSection } from './CenterTestsSection';
import { SECTION_BAND } from '../lib/uiTheme';

/** One day cell in the attendance calendar. */
export interface CalendarDay {
  dayNum: number;
  dayLabel: string;
  status: 'present' | 'absent' | 'no_class';
  dateStr: string;
  details: string;
}

/** One row in the offline/centre test list. */
export interface OfflineTestRow {
  id: string;
  name: string;
  /** Display date, e.g. "13-9-2026". */
  date: string;
  mode: string;
  /** "230/720". Empty when not attempted. */
  marks: string;
  /** "32%". Empty when not attempted. */
  scorePercent: string;
  /** Class rank as entered by the admin. Empty when unknown. */
  rank: string;
  status: 'ATTEMPTED' | 'MISSED' | 'RESULT_AWAITING';
  /** Which list of the All Tests screen this test belongs to. */
  paperType: 'Objective' | 'Subjective';
}

interface OfflineAttendanceDashboardViewProps {
  student: StudentProfile;
  summary: BatchSummary;
  dpp: DppSummary;
  calendarDays: CalendarDay[];
  offlineTests: OfflineTestRow[];
  onOpenSubjectDetails: (subjectArea: 'lectures' | 'dpp' | 'tests') => void;
  onViewAllTests: () => void;
  onOpenTest: (testId: string) => void;
}

/** Split an ordered day list into weeks of seven for the weekly pager. */
function chunkWeeks(days: CalendarDay[]): CalendarDay[][] {
  const out: CalendarDay[][] = [];
  for (let i = 0; i < days.length; i += 7) out.push(days.slice(i, i + 7));
  return out;
}

/** "26 Oct - 1 Nov" from a week slice, reading the month word out of dateStr. */
function weekLabel(week: CalendarDay[]): string {
  const monthOf = (d: CalendarDay) => (d.dateStr.match(/([A-Za-z]+)\s*\(/)?.[1] ?? '').slice(0, 3);
  if (week.length === 0) return '';
  const first = week[0];
  const last = week[week.length - 1];
  const fm = monthOf(first);
  const lm = monthOf(last);
  return fm === lm ? `${first.dayNum} - ${last.dayNum} ${lm}` : `${first.dayNum} ${fm} - ${last.dayNum} ${lm}`;
}

export const OfflineAttendanceDashboardView: React.FC<OfflineAttendanceDashboardViewProps> = ({
  student,
  summary,
  dpp,
  calendarDays,
  offlineTests,
  onOpenSubjectDetails,
  onViewAllTests,
  onOpenTest,
}) => {
  // Day-wise marks are only kept for the week in progress, so the strip shows
  // exactly that week — the one containing today, else the latest stored one.
  const weeks = useMemo(() => chunkWeeks(calendarDays), [calendarDays]);
  const todayIdx = calendarDays.findIndex((d) => d.dayNum === new Date().getDate());
  const currentIdx = todayIdx >= 0 ? Math.floor(todayIdx / 7) : weeks.length - 1;
  const currentWeek = weeks[Math.max(0, currentIdx)] ?? [];

  const band = <div className="h-3 w-full" style={{ background: SECTION_BAND }} />;

  return (
    <div className="flex-1 w-full pb-4 overflow-y-auto select-none font-['Plus_Jakarta_Sans',sans-serif]">
      <AttendanceCalendarSection
        summary={summary}
        days={currentWeek}
        weekLabel={weekLabel(currentWeek)}
      />

      {band}
      <DppSection summary={dpp} onOpenSubjectDetails={() => onOpenSubjectDetails('dpp')} />

      {band}
      <CenterTestsSection
        offlineTests={offlineTests}
        summary={summary}
        onViewAllTests={onViewAllTests}
        onOpenTest={onOpenTest}
        onOpenSubjectDetails={() => onOpenSubjectDetails('tests')}
      />
    </div>
  );
};
