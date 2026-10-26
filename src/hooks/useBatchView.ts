/**
 * useBatchView — turns the raw batch model into the shapes the existing
 * dashboard components already render.
 *
 * The components were written against hardcoded sample data. Rather than
 * rewriting 480 lines of pixel-matched UI, this hook produces the SAME shapes
 * from real Firestore documents and passes them in as optional props. The UI is
 * untouched; only its data source changed.
 *
 * ── WHAT IS DERIVED, AND FROM WHERE ────────────────────────────────────────
 *   batches        batches/{id} where members/{parentUid} exists
 *   calendarDays   batches/{id}/attendance/{studentId}  → current month
 *   allTests       batches/{id}/tests
 *   offlineTests   same, joined with this student's result
 *   summary        counted from those results
 *   subjects       batches/{id}/tests[].syllabus grouped by subject, with
 *                  accuracy derived from this student's results
 *
 * ── READ BUDGET ────────────────────────────────────────────────────────────
 * Results are read one at a time with `getResult()` (a targeted `get()`), never
 * with `listResults()`: the rules let a parent read their OWN child's result but
 * deliberately deny listing the class. Every read is cached, so switching
 * between the batch's tests costs nothing after the first pass.
 *
 * ── WHAT THIS CANNOT SHOW ──────────────────────────────────────────────────
 * Rank. Computing a rank needs every student's marks, which a parent is not
 * allowed to read. `rank` is therefore left empty and the UI hides the column —
 * inventing a rank would be worse than omitting it.
 */
import {useCallback, useEffect, useMemo, useState} from 'react';
import type {BatchOption, BatchTest, MonthMarks, StudentProfile, TestResult} from '../types';
import type {Backend} from '../lib/backend';
import {monthDays, monthKey} from '../lib/backend';
import type {AllTestsRow} from '../components/AllTestsModal';
import type {CalendarDay, OfflineTestRow} from '../components/OfflineAttendanceDashboardView';
import type {SubjectProgress} from '../components/SubjectDetailsModal';

export interface BatchSummary {
  /** "3/4" style: attempted over total. */
  testsAttempted: number;
  testsTotal: number;
  /** Highest marks string, e.g. "592/720". Empty when nothing is entered. */
  bestScore: string;
  /** Overall attendance percentage across every month. Empty when unmarked. */
  attendancePercent: string;
}

export interface BatchView {
  batches: BatchOption[];
  selectedBatchId: string | null;
  selectBatch: (batch: BatchOption) => void;
  loading: boolean;
  calendarDays: CalendarDay[];
  weeks: {label: string; range: string}[];
  allTests: AllTestsRow[];
  offlineTests: OfflineTestRow[];
  subjects: SubjectProgress[];
  summary: BatchSummary;
  /** Refresh after returning from the Admin Panel. */
  reload: () => void;
}

const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** `2026-10-05` → `5-10-2026`, matching the sample strings the UI was built for. */
const displayDate = (iso: string): string => {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${Number(d)}-${Number(m)}-${y}`;
};

/** `2026-10-05` → `5 October (Monday)` */
const longDate = (iso: string): string => {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.getDate()} ${date.toLocaleDateString('en-IN', {month: 'long'})} (${WEEKDAY_LONG[date.getDay()]})`;
};

const MONTH_LABEL = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', {month: 'short', year: 'numeric'});
};

/** Colour classes reused from the component's own sample rows. */
const SUBJECT_COLORS = [
  'from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-400',
  'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
  'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
  'from-purple-500/20 to-violet-500/10 border-purple-500/30 text-purple-400',
];

interface TestWithResult extends BatchTest {
  result: TestResult | null;
}

export function useBatchView(
  backend: Backend | null,
  student: StudentProfile | null,
  parentUid: string | null,
): BatchView {
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [tests, setTests] = useState<TestWithResult[]>([]);
  const [attendanceMonths, setAttendanceMonths] = useState<Record<string, Record<string, 'P' | 'A' | 'L'>>>({});
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const studentId = student?.id ?? null;

  // ── 1. which batches is this student in? ─────────────────────────────────
  useEffect(() => {
    if (!backend || !parentUid) {
      setBatches([]);
      setLoading(false);
      return;
    }
    let cancelled = false;

    void (async () => {
      setLoading(true);
      try {
        const list = await backend.listBatches(parentUid);
        if (cancelled) return;
        const options = list.map<BatchOption>((b) => ({
          id: b.id,
          name: b.name,
          batchType: b.batchType,
        }));
        setBatches(options);
        // Keep the current selection if it is still valid; otherwise take the
        // first. Deriving rather than defaulting matters because this list
        // arrives after first render.
        setSelectedBatchId((prev) =>
          prev && options.some((o) => o.id === prev) ? prev : options[0]?.id ?? null,
        );
      } catch (error) {
        console.warn('[batchView] listBatches failed:', error);
        if (!cancelled) setBatches([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [backend, parentUid, studentId, nonce]);

  // ── 2. tests for the selected batch + THIS student's result on each ──────
  useEffect(() => {
    if (!backend || !selectedBatchId || !studentId) {
      setTests([]);
      return;
    }
    let cancelled = false;

    void (async () => {
      try {
        const list = await backend.listTests(selectedBatchId);
        // Targeted get() per test — a parent may not list the class's results.
        const results = await Promise.all(
          list.map((t) => backend.getResult(selectedBatchId, t.id, studentId).catch(() => null)),
        );
        if (cancelled) return;
        setTests(
          list
            .map((t, i) => ({...t, result: results[i]}))
            // Newest first, matching how the sample lists were ordered.
            .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
        );
      } catch (error) {
        console.warn('[batchView] listTests failed:', error);
        if (!cancelled) setTests([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [backend, selectedBatchId, studentId, nonce]);

  // ── 3. attendance for this student in this batch (one read, all months) ──
  useEffect(() => {
    if (!backend || !selectedBatchId || !studentId) {
      setAttendanceMonths({});
      return;
    }
    let cancelled = false;

    void (async () => {
      try {
        const record = await backend.getAttendance(selectedBatchId, studentId);
        if (!cancelled) setAttendanceMonths(record.months ?? {});
      } catch (error) {
        console.warn('[batchView] getAttendance failed:', error);
        if (!cancelled) setAttendanceMonths({});
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [backend, selectedBatchId, studentId, nonce]);

  const selectBatch = useCallback((batch: BatchOption) => setSelectedBatchId(batch.id), []);
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  const month = monthKey();

  // ── derive the component shapes ──────────────────────────────────────────

  const calendarDays = useMemo<CalendarDay[]>(() => {
    // attendanceMonths is already keyed by `YYYY-MM`, so this is a direct lookup.
    const marks: MonthMarks = attendanceMonths[month] ?? {};
    const today = new Date().toISOString().slice(0, 10);

    return monthDays(month).map((day) => {
      const mark = marks[day];
      const date = new Date(`${day}T00:00:00`);
      const dayLabel = Number.isNaN(date.getTime()) ? '' : WEEKDAY[date.getDay()];
      const dayNum = Number(day.slice(-2));

      // `no_class` is the neutral grey state — used for days nobody has marked,
      // which is the honest reading of an absent mark.
      const status: CalendarDay['status'] = mark === 'P' || mark === 'L' ? 'present' : mark === 'A' ? 'absent' : 'no_class';
      const details =
        mark === 'P'
          ? 'Present • Marked by the batch administrator'
          : mark === 'L'
            ? 'Late • Counted as present'
            : mark === 'A'
              ? 'Absent • Marked by the batch administrator'
              : day > today
                ? 'Upcoming • Not conducted yet'
                : 'Not marked yet';

      return {dayNum, dayLabel, status, dateStr: longDate(day), details};
    });
  }, [attendanceMonths, month]);

  const weeks = useMemo(
    () => [{label: MONTH_LABEL(month), range: 'Current Month'}],
    [month],
  );

  const allTests = useMemo<AllTestsRow[]>(
    () =>
      tests.map((t) => ({
        id: t.id,
        name: t.title,
        date: displayDate(t.date),
        mode: t.mode,
        // No result row yet means the admin has not entered marks — that is
        // different from the student missing the test.
        status: t.result ? t.result.status : t.status === 'scheduled' ? 'UPCOMING' : 'NOT ENTERED',
      })),
    [tests],
  );

  const offlineTests = useMemo<OfflineTestRow[]>(
    () =>
      tests.map((t) => ({
        id: t.id,
        name: t.title,
        date: displayDate(t.date),
        mode: t.mode === 'Offline' ? 'Center Offline' : 'Online',
        marks:
          t.result && typeof t.result.marksObtained === 'number'
            ? `${t.result.marksObtained}/${t.marksTotal}`
            : `--/${t.marksTotal}`,
        // Rank needs the whole class's marks, which a parent may not read.
        // Empty string hides the column rather than inventing a number.
        rank: '',
        status: t.result ? t.result.status : t.status === 'scheduled' ? 'UPCOMING' : 'NOT ENTERED',
      })),
    [tests],
  );

  const summary = useMemo<BatchSummary>(() => {
    const entered = tests.filter((t) => t.result);
    const attempted = entered.filter((t) => t.result?.status === 'ATTEMPTED');
    const best = attempted.reduce(
      (max, t) => Math.max(max, t.result?.marksObtained ?? 0),
      0,
    );
    const bestTest = attempted.find((t) => (t.result?.marksObtained ?? 0) === best && best > 0);

    // Flatten every month into one pseudo-month so the shared summariser can
    // compute an all-time percentage. The keys are meaningless here; only the
    // marks are read.
    const allMarks = Object.values(attendanceMonths).flatMap((m) => Object.values(m));
    const percent = allMarks.length
      ? Math.round(
          (allMarks.filter((m) => m === 'P' || m === 'L').length / allMarks.length) * 100,
        )
      : 0;

    return {
      testsAttempted: attempted.length,
      testsTotal: tests.length,
      bestScore: bestTest && best > 0 ? `${best}/${bestTest.marksTotal}` : '',
      attendancePercent: allMarks.length > 0 ? `${percent}%` : '',
    };
  }, [tests, attendanceMonths]);

  const subjects = useMemo<SubjectProgress[]>(() => {
    // Group every syllabus line across the batch's tests by subject, then attach
    // accuracy derived from this student's real results.
    const bySubject = new Map<string, {topics: number; tests: BatchTest[]}>();
    for (const test of tests) {
      for (const topic of test.syllabus ?? []) {
        const key = topic.subject?.trim() || 'General';
        const entry = bySubject.get(key) ?? {topics: 0, tests: []};
        entry.topics += 1;
        if (!entry.tests.includes(test)) entry.tests.push(test);
        bySubject.set(key, entry);
      }
    }

    return [...bySubject.entries()].map(([name, entry], index) => {
      const results = entry.tests.map((t) => tests.find((x) => x.id === t.id)?.result).filter(Boolean) as TestResult[];
      const accuracies = results
        .map((r) => r.accuracyPercent)
        .filter((v): v is number => typeof v === 'number');
      const accuracy = accuracies.length
        ? `${(accuracies.reduce((a, b) => a + b, 0) / accuracies.length).toFixed(1)}%`
        : '—';

      return {
        name,
        // We do not model teachers, so this stays empty rather than showing an
        // invented name (the sample data had "Rajwant Sir" and friends).
        teacher: '',
        // Lectures and DPPs are not part of the batch model — shown as 0 with
        // the real syllabus topic count carried in totalLectures is misleading,
        // so both stay 0 and the UI renders an honest empty bar.
        lecturesCompleted: 0,
        totalLectures: 0,
        dppsDone: 0,
        totalDpps: 0,
        accuracy,
        color: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
      };
    });
  }, [tests]);

  return {
    batches,
    selectedBatchId,
    selectBatch,
    loading,
    calendarDays,
    weeks,
    allTests,
    offlineTests,
    subjects,
    summary,
    reload,
  };
}
