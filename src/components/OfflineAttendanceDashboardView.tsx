/**
 * Offline / centre dashboard — now a thin composition of three sections.
 *
 * This file was 484 lines and about to cross the repo's 500-line ceiling once
 * real data props were threaded through, so each section moved to its own file:
 *
 *   AttendanceCalendarSection.tsx   day-wise calendar + legend + day banner
 *   DppSection.tsx                  Daily Practice Paper (still sample figures)
 *   CenterTestsSection.tsx          test summary card + timeline
 *
 * The pixel-matched markup is unchanged. What changed is the data: every prop
 * below is optional with a built-in fallback, so an unwired call site renders
 * exactly what it did before, while a configured build passes real documents
 * from `batches/{id}` (see src/hooks/useBatchView.ts).
 *
 * `CalendarDay` and `OfflineTestRow` stay EXPORTED FROM HERE even though the
 * calendar now lives elsewhere — useBatchView imports them from this module,
 * and moving them would churn three files for no gain.
 */
import React from 'react';
import { StudentProfile } from '../types';
import type { BatchSummary } from '../hooks/useBatchView';
import { AttendanceCalendarSection } from './AttendanceCalendarSection';
import { DppSection } from './DppSection';
import { CenterTestsSection } from './CenterTestsSection';

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
  date: string;
  mode: string;
  marks: string;
  /**
   * Empty when a rank cannot be computed honestly. Computing one needs every
   * student's marks on the paper, and the rules let a parent read only their
   * own child's result — so this is left blank and the UI shows a dash.
   */
  rank: string;
  status: string;
}

interface OfflineAttendanceDashboardViewProps {
  student: StudentProfile;
  batchName: string;
  onOpenSubjectDetails: (subjectArea: 'lectures' | 'dpp' | 'tests') => void;
  onViewAllTests: () => void;
  /**
   * Real day-wise marks from `batches/{id}/attendance/{studentId}`, mapped to
   * this component's cell shape. When omitted the sample week below renders.
   */
  calendarDays?: CalendarDay[];
  /** Real tests for the selected batch, joined with this student's marks. */
  offlineTests?: OfflineTestRow[];
  /** Week/month tabs above the calendar. Derived from `calendarDays` when omitted. */
  weeks?: { label: string; range: string }[];
  /** Attempted/total, best score and attendance — all derived, none typed. */
  summary?: BatchSummary;
}

// ── fallbacks: rendered ONLY when no real data is supplied ──────────────────
// A configured build always passes the props, so these never reach a parent who
// has been allotted to a batch. They exist so unwired call sites and the test
// suite keep rendering instead of crashing on an empty list.

const FALLBACK_WEEKS = [
  { label: '8 Jun - 14 Jun', range: 'Current Week' },
  { label: '1 Jun - 7 Jun', range: 'Previous Week' },
];

const FALLBACK_CALENDAR: CalendarDay[] = [
  { dayNum: 8, dayLabel: 'M', status: 'absent', dateStr: '8 June (Monday)', details: 'Absent • Offline Class marked absent' },
  { dayNum: 9, dayLabel: 'T', status: 'no_class', dateStr: '9 June (Tuesday)', details: 'No Class • Scheduled self-study day' },
  { dayNum: 10, dayLabel: 'W', status: 'present', dateStr: '10 June (Wednesday)', details: 'Present • Physics & Chemistry attended' },
  { dayNum: 11, dayLabel: 'T', status: 'present', dateStr: '11 June (Thursday)', details: 'Present • Mathematics & DPP discussion attended' },
  { dayNum: 12, dayLabel: 'F', status: 'present', dateStr: '12 June (Friday)', details: 'Present • Full day center attendance recorded' },
  { dayNum: 13, dayLabel: 'S', status: 'no_class', dateStr: '13 June (Saturday)', details: 'No Class • Weekend revision' },
  { dayNum: 14, dayLabel: 'S', status: 'no_class', dateStr: '14 June (Sunday)', details: 'No Class • Center weekly off' },
];

const FALLBACK_TESTS: OfflineTestRow[] = [
  { id: '1', name: 'Center Test 04 : Full Syllabus', date: '11-6-2026', mode: 'Center Offline', marks: '592/720', rank: 'AIR 142', status: 'ATTENDED' },
  { id: '2', name: 'Center Test 03 : Physics & Chem', date: '04-6-2026', mode: 'Center Offline', marks: '248/360', rank: 'AIR 198', status: 'ATTENDED' },
  { id: '3', name: 'Center Test 02 : Optics & Mechanics', date: '28-5-2026', mode: 'Center Offline', marks: '110/180', rank: 'AIR 220', status: 'ATTENDED' },
  { id: '4', name: 'Center Test 01 : Diagnostic Test', date: '14-5-2026', mode: 'Center Offline', marks: '0/720', rank: '--', status: 'MISSED' },
];

const FALLBACK_SUMMARY: BatchSummary = {
  testsAttempted: 3,
  testsTotal: 4,
  bestScore: '592/720',
  attendancePercent: '86%',
};

export const OfflineAttendanceDashboardView: React.FC<OfflineAttendanceDashboardViewProps> = ({
  student,
  onOpenSubjectDetails,
  onViewAllTests,
  calendarDays,
  offlineTests,
  weeks,
  summary,
}) => {
  return (
    <div className="flex-1 w-full px-4 pt-3 pb-8 overflow-y-auto space-y-6 select-none font-['Plus_Jakarta_Sans',sans-serif]">
      <AttendanceCalendarSection
        student={student}
        calendarDays={calendarDays ?? FALLBACK_CALENDAR}
        weeks={weeks ?? FALLBACK_WEEKS}
      />

      <DppSection onOpenSubjectDetails={onOpenSubjectDetails} />

      <CenterTestsSection
        offlineTests={offlineTests ?? FALLBACK_TESTS}
        summary={summary ?? FALLBACK_SUMMARY}
        onViewAllTests={onViewAllTests}
      />
    </div>
  );
};
