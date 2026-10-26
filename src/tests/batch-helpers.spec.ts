import {describe, expect, it} from 'vitest';
import {
  attendancePercent,
  daysInMonth,
  emptyAttendanceRecord,
  monthDays,
  monthKey,
  monthMarksOf,
  overallAttendancePercent,
  scorePercentOf,
  summarizeAttendance,
  syllabusWeightTotal,
  todayKey,
  withDayMark,
} from '../lib/backend/batchTypes';
import type {AttendanceRecord} from '../types';

/**
 * The PURE half of the batch model: date keys, attendance maths and marks
 * maths. No backend, no storage, no async — these are the functions both the
 * mock and Firestore implementations share, so a bug here would be wrong in
 * both places at once.
 *
 * The storage-backed behaviour lives in `./batches.spec.ts`.
 *
 * Split out of that file because it crossed the repo's 500-line ceiling.
 */

describe('batch helpers: date keys', () => {
  it('monthKey/todayKey produce the shapes the storage keys depend on', () => {
    expect(monthKey(new Date(2026, 9, 5))).toBe('2026-10');
    expect(todayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('daysInMonth handles a leap February', () => {
    expect(daysInMonth('2026-02')).toBe(28);
    expect(daysInMonth('2024-02')).toBe(29);
    expect(daysInMonth('2026-04')).toBe(30);
    expect(daysInMonth('2026-10')).toBe(31);
  });

  it('monthDays returns every day of the month, zero-padded and in order', () => {
    const days = monthDays('2026-10');
    expect(days).toHaveLength(31);
    expect(days[0]).toBe('2026-10-01');
    expect(days[30]).toBe('2026-10-31');
  });
});

describe('batch helpers: attendance maths', () => {
  it('late counts as present', () => {
    expect(attendancePercent({'2026-10-01': 'P', '2026-10-02': 'L'})).toBe(100);
    expect(attendancePercent({'2026-10-01': 'P', '2026-10-02': 'A'})).toBe(50);
  });

  it('UNMARKED days are excluded from the denominator', () => {
    // A month in progress must not read as a string of absences. This is the
    // single most important property of the percentage: marking 3 of 31 days
    // present is 100%, not 10%.
    const days = {'2026-10-01': 'P' as const, '2026-10-02': 'P' as const, '2026-10-03': 'A' as const};
    expect(attendancePercent(days)).toBe(67);
  });

  it('an untouched month is 0%, not NaN', () => {
    expect(attendancePercent({})).toBe(0);
    expect(attendancePercent(undefined)).toBe(0);
    expect(summarizeAttendance(undefined).marked).toBe(0);
  });

  it('summarizeAttendance counts each mark separately', () => {
    const summary = summarizeAttendance({
      '2026-10-01': 'P',
      '2026-10-02': 'P',
      '2026-10-03': 'L',
      '2026-10-04': 'A',
    });
    expect(summary).toMatchObject({present: 2, late: 1, absent: 1, marked: 4, percent: 75});
  });

  it('overallAttendancePercent spans every month in a record', () => {
    const record: AttendanceRecord = {
      ...emptyAttendanceRecord('b1', 's1'),
      months: {
        '2026-09': {'2026-09-01': 'P', '2026-09-02': 'A'},
        '2026-10': {'2026-10-01': 'P', '2026-10-02': 'P'},
      },
    };
    expect(overallAttendancePercent(record)).toBe(75);
    expect(overallAttendancePercent(null)).toBe(0);
  });

  it('withDayMark is pure and returns a NEW record', () => {
    const original = emptyAttendanceRecord('b1', 's1');
    const next = withDayMark(original, '2026-10-05', 'P');

    expect(original.months).toEqual({});           // untouched
    expect(next.months['2026-10']).toEqual({'2026-10-05': 'P'});
    expect(next).not.toBe(original);
  });

  it('withDayMark(null) clears a day — how an admin undoes a wrong entry', () => {
    const marked = withDayMark(emptyAttendanceRecord('b1', 's1'), '2026-10-05', 'A');
    expect(marked.months['2026-10']['2026-10-05']).toBe('A');

    const cleared = withDayMark(marked, '2026-10-05', null);
    expect(cleared.months['2026-10']['2026-10-05']).toBeUndefined();
    expect(Object.keys(cleared.months['2026-10'])).toHaveLength(0);
  });

  it('withDayMark keeps other months intact', () => {
    let record = withDayMark(emptyAttendanceRecord('b1', 's1'), '2026-09-05', 'P');
    record = withDayMark(record, '2026-10-05', 'A');

    expect(monthMarksOf(record, '2026-09')).toEqual({'2026-09-05': 'P'});
    expect(monthMarksOf(record, '2026-10')).toEqual({'2026-10-05': 'A'});
    expect(monthMarksOf(record, '2026-11')).toEqual({});
  });
});

describe('batch helpers: marks maths', () => {
  it('scorePercentOf derives from raw marks', () => {
    expect(scorePercentOf(592, 720)).toBe(82);
    expect(scorePercentOf(360, 720)).toBe(50);
    expect(scorePercentOf(0, 720)).toBe(0);
  });

  it('scorePercentOf is safe on missing or zero totals', () => {
    expect(scorePercentOf(undefined, 720)).toBe(0);
    expect(scorePercentOf(100, undefined)).toBe(0);
    expect(scorePercentOf(100, 0)).toBe(0);   // no divide-by-zero
  });

  it('syllabusWeightTotal adds up the weightages', () => {
    expect(
      syllabusWeightTotal([
        {subject: 'Physics', topic: 'Optics', weightage: 40},
        {subject: 'Chemistry', topic: 'Organic', weightage: 60},
      ]),
    ).toBe(100);
    expect(syllabusWeightTotal([{subject: 'Physics', topic: 'Optics'}])).toBe(0);
    expect(syllabusWeightTotal(undefined)).toBe(0);
  });
});
