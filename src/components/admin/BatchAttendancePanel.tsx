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
import type {AttendanceMark, AttendanceRecord, Batch, DayMarkValue} from '../../types';
import type {Backend} from '../../lib/backend';
import {monthDays, monthKey, monthMarksOf, summarizeAttendance, todayKey} from '../../lib/backend';
import {markCodeOf, markTimesOf} from '../../lib/backend/batchTypes';
import {btnGhost, btnPrimary, cardCls, inputCls, labelCls, Note} from './ui';

interface BatchAttendancePanelProps {
  backend: Backend;
  batch: Batch;
  flash: (message: string) => void;
}

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

/**
 * One day's editor: status segment + the campus gate times the parent app
 * shows under its week strip ("Campus entry at 3:46 PM"). Keyed by day so
 * switching days resets the draft instead of leaking it across the month.
 */
const DayEditor: React.FC<{
  day: string;
  value: DayMarkValue | undefined;
  busy: boolean;
  onSave: (mark: AttendanceMark | null, times: {entryAt: string | null; exitAt: string | null}) => void;
}> = ({day, value, busy, onSave}) => {
  const [code, setCode] = useState<AttendanceMark | null>(markCodeOf(value));
  const times = markTimesOf(value);
  const [entry, setEntry] = useState(times.entryAt ?? '');
  const [exit, setExit] = useState(times.exitAt ?? '');

  const seg = (m: AttendanceMark, label: string) => (
    <button
      type="button"
      disabled={busy}
      onClick={() => setCode(m)}
      className={`py-2 rounded-lg border text-[11px] font-bold transition-colors ${
        code === m ? MARK_STYLE[m].bg : 'bg-white border-[#E4E6EB] text-neutral-600'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className={`${cardCls} space-y-2.5`}>
      <p className={labelCls}>
        {day} — status & campus times
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {seg('P', 'Present')}
        {seg('A', 'Absent')}
        {seg('L', 'Late')}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="block text-[11px] font-semibold text-neutral-600 mb-1">Campus entry</span>
          <input type="time" value={entry} onChange={(e) => setEntry(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className="block text-[11px] font-semibold text-neutral-600 mb-1">Campus exit</span>
          <input type="time" value={exit} onChange={(e) => setExit(e.target.value)} className={inputCls} />
        </label>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className={`${btnPrimary} flex-1 py-2`}
          disabled={busy || !code}
          onClick={() => onSave(code, {entryAt: entry || null, exitAt: exit || null})}
        >
          <Check size={12} /> Save day
        </button>
        <button
          type="button"
          className={`${btnGhost} py-2`}
          disabled={busy}
          onClick={() => onSave(null, {entryAt: null, exitAt: null})}
        >
          Clear day
        </button>
      </div>
      <Note>
        Gate times are optional — parents see them under the selected day as &ldquo;Campus entry at 3:46 PM&rdquo;.
        Clearing a day removes its mark AND its times.
      </Note>
    </div>
  );
};

const StudentCalendar: React.FC<{
  studentName: string;
  month: string;
  record: AttendanceRecord;
  onBack: () => void;
  onMark: (
    day: string,
    mark: AttendanceMark | null,
    times?: {entryAt?: string | null; exitAt?: string | null} | null,
  ) => void;
  busy: boolean;
}> = ({studentName, month, record, onBack, onMark, busy}) => {
  const days = useMemo(() => monthDays(month), [month]);
  const marks = monthMarksOf(record, month);
  const summary = summarizeAttendance(marks);
  const today = todayKey();
  /** Tap a day to open its editor below the grid. */
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

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

      {/* Tap a day to edit its status and campus gate times. */}
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
          const code = markCodeOf(marks[day]);
          const style = code ? MARK_STYLE[code] : null;
          const isToday = day === today;
          const isSelected = day === selectedDay;
          return (
            <button
              key={day}
              type="button"
              disabled={busy}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              title={`${day}${code ? ` — ${style?.label}` : ' — unmarked'}`}
              aria-label={`${day}${code ? `, ${style?.label}` : ', unmarked'}${isSelected ? ', editing' : ''}`}
              aria-pressed={isSelected}
              className={`aspect-square rounded-lg border text-[11px] font-bold flex items-center justify-center transition-colors disabled:opacity-50 ${
                style?.bg ?? 'bg-[#FFFFFF] border-[#E4E6EB] text-neutral-600 hover:border-[#E4E6EB]'
              } ${isSelected ? 'ring-2 ring-[#5A4BDA]' : isToday ? 'ring-1 ring-[#8E75FF]' : ''}`}
            >
              {Number(day.slice(-2))}
            </button>
          );
        })}
      </div>

      {selectedDay ? (
        <DayEditor
          key={selectedDay}
          day={selectedDay}
          value={marks[selectedDay]}
          busy={busy}
          onSave={(markValue, times) => onMark(selectedDay, markValue, times)}
        />
      ) : (
        <Note>
          Tap a day to set Present / Absent / Late and, optionally, that day&apos;s campus entry and exit times —
          the parent dashboard shows them under the week strip. Unmarked days are excluded from the percentage, so a
          month in progress does not read as a string of absences. Late counts as present.
        </Note>
      )}
    </>
  );
};

export const BatchAttendancePanel: React.FC<BatchAttendancePanelProps> = ({backend, batch, flash}) => {
  const [month, setMonth] = useState(monthKey());
  /**
   * Lifetime attendance history, seeded by the admin. Day-wise marks are only
   * kept for the running week, so the parent dashboard's all-time "Total Study
   * Days / Total Present Days" come from here — and every mark entered for the
   * running week increases both figures on top of these bases.
   */
  const [baseStudy, setBaseStudy] = useState(String(batch.baseStudyDays ?? 0));
  const [basePresent, setBasePresent] = useState(String(batch.basePresentDays ?? 0));
  const [savingBase, setSavingBase] = useState(false);

  const saveBase = async () => {
    setSavingBase(true);
    try {
      const study = Math.max(0, Math.round(Number(baseStudy) || 0));
      const present = Math.min(study, Math.max(0, Math.round(Number(basePresent) || 0)));
      await backend.saveBatch({...batch, baseStudyDays: study, basePresentDays: present});
      flash('Attendance history saved.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save the history.');
    } finally {
      setSavingBase(false);
    }
  };
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

  const mark = async (
    studentId: string,
    day: string,
    value: AttendanceMark | null,
    times?: {entryAt?: string | null; exitAt?: string | null} | null,
  ) => {
    setBusy(true);
    try {
      const next = await backend.setAttendanceDay(batch.id, studentId, day, value, times);
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
      {/* All-time totals — the part day-wise marks cannot remember */}
      <div className={`${cardCls} space-y-2.5`}>
        <p className={labelCls}>Attendance history (all-time)</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="block text-[11px] font-semibold text-neutral-600 mb-1">Total study days</span>
            <input
              type="number"
              min={0}
              value={baseStudy}
              onChange={(e) => setBaseStudy(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="block text-[11px] font-semibold text-neutral-600 mb-1">Total present days</span>
            <input
              type="number"
              min={0}
              value={basePresent}
              onChange={(e) => setBasePresent(e.target.value)}
              className={inputCls}
            />
          </label>
        </div>
        <button type="button" className={btnPrimary} onClick={() => void saveBase()} disabled={savingBase}>
          Save history
        </button>
        <Note>
          Day-wise marks are only stored for the running week. Seed the past here — the week&apos;s marks add on
          top of these two numbers automatically, and the parent&apos;s attendance donut follows them.
        </Note>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button type="button" className={btnGhost} onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month">
          <ChevronLeft size={13} />
        </button>
        <span className="text-sm font-bold flex items-center gap-1.5">
          <CalendarDays size={14} className="text-[#5A4BDA]" />
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
                <div className="w-9 h-9 rounded-lg bg-[#5A4BDA]/15 border border-[#5A4BDA]/30 flex items-center justify-center shrink-0">
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
