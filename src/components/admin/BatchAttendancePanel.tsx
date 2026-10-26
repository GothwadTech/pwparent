/**
 * Batch → Attendance panel: day-wise P / A / L for every allotted student.
 *
 * ── WHY THIS SHAPE ─────────────────────────────────────────────────────────
 * A 31-column × N-student grid does not fit a phone-width shell, and the whole
 * point of this build is that the desktop layout is the SAME phone UI scaled
 * up. So the month is shown as a per-student summary list, and tapping a
 * student opens that student's calendar. One write per tap, one read per
 * student per month.
 *
 * Storage is one document per student holding every month
 * (`batches/{id}/attendance/{studentId}` → `months: {'2026-10': {…}}`), which
 * is what lets the rules gate it on "is this caller the parent of this
 * student?" without parsing a composite document id.
 *
 * Tapping a day cycles: unmarked → P → A → L → unmarked. Clearing is how an
 * admin undoes a wrong entry, so it is a first-class state, not an afterthought.
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ArrowLeft, CalendarDays, Check, ChevronLeft, ChevronRight, Minus, Moon} from 'lucide-react';
import type {AttendanceMark, AttendanceRecord, Batch} from '../../types';
import type {Backend} from '../../lib/backend';
import {monthDays, monthKey, monthMarksOf, summarizeAttendance, todayKey} from '../../lib/backend';
import {btnGhost, btnPrimary, cardCls, labelCls, Note} from './ui';

interface BatchAttendancePanelProps {
  backend: Backend;
  batch: Batch;
  flash: (message: string) => void;
}

/** The tap cycle. `null` is "clear", which returns the cell to unmarked. */
const CYCLE: (AttendanceMark | null)[] = [null, 'P', 'A', 'L'];

const nextMark = (current: AttendanceMark | undefined): AttendanceMark | null => {
  const index = CYCLE.findIndex((m) => m === current);
  return CYCLE[(index + 1) % CYCLE.length];
};

const MARK_STYLE: Record<AttendanceMark, {bg: string; label: string}> = {
  P: {bg: 'bg-[#D8F0DE] border-[#A7D9B4] text-[#8ff0b0]', label: 'Present'},
  A: {bg: 'bg-[#FBE0E5] border-[#E8AEB8] text-[#ff9b9b]', label: 'Absent'},
  L: {bg: 'bg-[#FBF1D7] border-[#E4CE93] text-[#f0dc8f]', label: 'Late'},
};

/** Shift a `YYYY-MM` key by n months, clamped to a sane range. */
function shiftMonth(month: string, delta: number): string {
  const [year, mon] = month.split('-').map(Number);
  const date = new Date(year, mon - 1 + delta, 1);
  return monthKey(date);
}

const monthLabel = (month: string) => {
  const [year, mon] = month.split('-').map(Number);
  return new Date(year, mon - 1, 1).toLocaleDateString('en-IN', {month: 'long', year: 'numeric'});
};

const StudentCalendar: React.FC<{
  studentName: string;
  month: string;
  record: AttendanceRecord;
  onBack: () => void;
  onMark: (day: string, mark: AttendanceMark | null) => void;
  busy: boolean;
}> = ({studentName, month, record, onBack, onMark, busy}) => {
  const days = useMemo(() => monthDays(month), [month]);
  const marks = monthMarksOf(record, month);
  const summary = summarizeAttendance(marks);
  const today = todayKey();

  return (
    <>
      <button type="button" className={btnGhost} onClick={onBack}>
        <ArrowLeft size={12} /> All students
      </button>

      <div className={cardCls}>
        <p className={labelCls}>{studentName}</p>
        <p className="text-lg font-bold">{summary.percent}%</p>
        <p className="text-[11px] text-neutral-500 mt-0.5">
          {summary.present} present · {summary.late} late · {summary.absent} absent
          {summary.marked > 0 && ` · ${summary.marked} marked`}
        </p>
      </div>

      {/* Tap a day to cycle P → A → L → clear. */}
      <div className="grid grid-cols-7 gap-1.5">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={i} className="text-center text-[10px] font-semibold text-neutral-600 py-1">
            {d}
          </span>
        ))}

        {/* Leading blanks so day 1 lands under the right weekday. */}
        {Array.from({length: (new Date(`${month}-01`).getDay() + 6) % 7}, (_, i) => (
          <span key={`pad-${i}`} />
        ))}

        {days.map((day) => {
          const mark = marks[day];
          const style = mark ? MARK_STYLE[mark] : null;
          const isToday = day === today;
          return (
            <button
              key={day}
              type="button"
              disabled={busy}
              onClick={() => onMark(day, nextMark(mark))}
              title={`${day}${mark ? ` — ${style?.label}` : ' — unmarked'}`}
              aria-label={`${day}${mark ? `, ${style?.label}` : ', unmarked'}`}
              className={`aspect-square rounded-lg border text-[11px] font-bold flex items-center justify-center transition-colors disabled:opacity-50 ${
                style?.bg ?? 'bg-[#FFFFFF] border-[#E4E6EB] text-neutral-600 hover:border-[#E4E6EB]'
              } ${isToday ? 'ring-1 ring-[#8E75FF]' : ''}`}
            >
              {Number(day.slice(-2))}
            </button>
          );
        })}
      </div>

      <Note>
        Tap a day to cycle Present → Absent → Late → clear. Unmarked days are excluded from the percentage, so a month
        in progress does not read as a string of absences. Late counts as present.
      </Note>
    </>
  );
};

export const BatchAttendancePanel: React.FC<BatchAttendancePanelProps> = ({backend, batch, flash}) => {
  const [month, setMonth] = useState(monthKey());
  const [students, setStudents] = useState<{id: string; name: string}[]>([]);
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [openStudent, setOpenStudent] = useState<string | null>(null);

  const load = useCallback(
    async (targetMonth: string) => {
      setLoading(true);
      setError('');
      try {
        const [batchStudents, allRecords] = await Promise.all([
          backend.listBatchStudents(batch.id),
          backend.listBatchAttendance(batch.id),
        ]);
        setStudents(batchStudents.map((s) => ({id: s.id, name: s.name})));

        // One record per student holds EVERY month, so a single query covers the
        // whole batch. Keyed by studentId for O(1) lookup while marking.
        const byId: Record<string, AttendanceRecord> = {};
        for (const record of allRecords) byId[record.studentId] = record;
        setRecords(byId);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load attendance.');
      } finally {
        setLoading(false);
      }
    },
    [backend, batch.id],
  );

  useEffect(() => {
    void load(month);
    // `month` is intentionally not a dependency: every student's record already
    // contains all months, so switching month must NOT cost another read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const mark = async (studentId: string, day: string, value: AttendanceMark | null) => {
    setBusy(true);
    try {
      const next = await backend.setAttendanceDay(batch.id, studentId, day, value);
      setRecords((prev) => ({...prev, [studentId]: next}));
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : 'Could not save attendance.');
    } finally {
      setBusy(false);
    }
  };

  /** Mark every allotted student present on one day — the common daily action. */
  const markAllPresent = async (day: string) => {
    setBusy(true);
    try {
      const updated = await Promise.all(students.map((s) => backend.setAttendanceDay(batch.id, s.id, day, 'P')));
      setRecords((prev) => {
        const next = {...prev};
        updated.forEach((r) => {
          next[r.studentId] = r;
        });
        return next;
      });
      flash(`Marked ${students.length} student${students.length === 1 ? '' : 's'} present on ${day}.`);
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : 'Could not mark attendance.');
    } finally {
      setBusy(false);
    }
  };

  const opened = openStudent ? students.find((s) => s.id === openStudent) : null;

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <button type="button" className={btnGhost} onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month">
          <ChevronLeft size={13} />
        </button>
        <span className="text-sm font-bold flex items-center gap-1.5">
          <CalendarDays size={14} className="text-[#5747D6]" />
          {monthLabel(month)}
        </span>
        <button type="button" className={btnGhost} onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month">
          <ChevronRight size={13} />
        </button>
      </div>

      {error && (
        <p className="text-xs text-[#ff9bb3] leading-relaxed px-3 py-2.5 rounded-lg bg-[#FBE0E5] border border-[#F3C1CB]">
          {error}
        </p>
      )}

      {loading && <p className="text-xs text-neutral-500 text-center py-6">Loading…</p>}

      {!loading && students.length === 0 && (
        <Note>
          Nobody is allotted to this batch, so there is no attendance to mark. Go to the <strong className="text-neutral-700">Students</strong>{' '}
          panel and allot someone first.
        </Note>
      )}

      {!loading && students.length > 0 && opened && (
        <StudentCalendar
          studentName={opened.name || '(unnamed)'}
          month={month}
          record={records[opened.id] ?? {id: opened.id, batchId: batch.id, studentId: opened.id, months: {}}}
          onBack={() => setOpenStudent(null)}
          onMark={(day, value) => void mark(opened.id, day, value)}
          busy={busy}
        />
      )}

      {!loading && students.length > 0 && !opened && (
        <>
          <button
            type="button"
            className={`${btnPrimary} w-full py-2.5`}
            disabled={busy}
            onClick={() => void markAllPresent(todayKey())}
          >
            <Check size={13} /> Mark everyone present today
          </button>

          <span className={labelCls}>Students in {monthLabel(month)}</span>

          {students.map((student) => {
            const summary = summarizeAttendance(monthMarksOf(records[student.id], month));
            return (
              <button
                key={student.id}
                type="button"
                onClick={() => setOpenStudent(student.id)}
                className={`${cardCls} w-full flex items-center gap-3 text-left hover:border-[#E4E6EB] transition-colors`}
              >
                <div className="w-9 h-9 rounded-lg bg-[#5747D6]/15 border border-[#5747D6]/30 flex items-center justify-center shrink-0">
                  {summary.marked === 0 ? (
                    <Minus size={14} className="text-neutral-500" />
                  ) : summary.percent >= 75 ? (
                    <Check size={14} className="text-[#8ff0b0]" />
                  ) : (
                    <Moon size={14} className="text-[#ff9b9b]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{student.name || '(unnamed)'}</p>
                  <p className="text-[11px] text-neutral-500 truncate">
                    {summary.marked === 0
                      ? 'Nothing marked yet'
                      : `${summary.present}P · ${summary.late}L · ${summary.absent}A`}
                  </p>
                </div>
                <span
                  className={`text-sm font-bold shrink-0 ${
                    summary.marked === 0 ? 'text-neutral-600' : summary.percent >= 75 ? 'text-[#8ff0b0]' : 'text-[#f0dc8f]'
                  }`}
                >
                  {summary.marked === 0 ? '—' : `${summary.percent}%`}
                </span>
              </button>
            );
          })}
        </>
      )}
    </>
  );
};
