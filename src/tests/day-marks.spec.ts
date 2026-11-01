import {beforeEach, describe, expect, it} from 'vitest';
import {
  attendancePercent,
  formatCampusTime,
  makeDayMark,
  markCodeOf,
  markTimesOf,
  summarizeAttendance,
  withDayMark,
  emptyAttendanceRecord,
} from '../lib/backend/batchTypes';
import type {AttendanceRecord, DayMarkDetail, MonthMarks} from '../types';
import {getBackend} from '../lib/backend';
import {clearDemoStore} from '../lib/backend/demoStore';

/**
 * Rich day marks: the P/A/L status PLUS campus gate times.
 *
 * Legacy documents store plain `'P'` strings; once an admin fills a day's
 * campus entry/exit the stored value becomes `{mark, entryAt, exitAt}`. Every
 * reader goes through markCodeOf/markTimesOf so both shapes behave identically
 * — that contract is what lets old attendance survive the feature.
 */
describe('mark helpers', () => {
  it('reads legacy string marks unchanged', () => {
    expect(markCodeOf('P')).toBe('P');
    expect(markCodeOf('A')).toBe('A');
    expect(markTimesOf('P')).toEqual({entryAt: null, exitAt: null});
    expect(markCodeOf(undefined)).toBeNull();
  });

  it('reads rich marks: code and gate times', () => {
    const rich: DayMarkDetail = {mark: 'P', entryAt: '15:46', exitAt: '19:28'};
    expect(markCodeOf(rich)).toBe('P');
    expect(markTimesOf(rich)).toEqual({entryAt: '15:46', exitAt: '19:28'});
  });

  it('stores a plain string while there are no times, an object once there are', () => {
    expect(makeDayMark('P', null, null)).toBe('P');
    expect(makeDayMark('P', '15:46', null)).toEqual({mark: 'P', entryAt: '15:46', exitAt: null});
    expect(makeDayMark(null, '15:46', '19:28')).toBeNull();
  });
});

describe('formatCampusTime', () => {
  it('prints 12-hour times like the parent callout', () => {
    expect(formatCampusTime('15:46')).toBe('3:46 PM');
    expect(formatCampusTime('07:05')).toBe('7:05 AM');
    expect(formatCampusTime('12:20')).toBe('12:20 PM');
    expect(formatCampusTime('00:10')).toBe('12:10 AM');
  });

  it('refuses junk instead of printing a wrong time', () => {
    expect(formatCampusTime('')).toBe('');
    expect(formatCampusTime(null)).toBe('');
    expect(formatCampusTime('25:00')).toBe('');
    expect(formatCampusTime('abc')).toBe('');
  });
});

describe('summaries count rich marks like plain ones', () => {
  const days: MonthMarks = {
    '2026-10-05': 'P',
    '2026-10-06': {mark: 'P', entryAt: '15:46', exitAt: '19:28'} as DayMarkDetail,
    '2026-10-07': 'A',
    '2026-10-08': {mark: 'L', exitAt: '19:31'} as DayMarkDetail,
  };

  it('percent treats a rich P as present', () => {
    expect(attendancePercent(days)).toBe(75);
  });

  it('summarize splits P / L / A across both shapes', () => {
    const summary = summarizeAttendance(days);
    expect(summary.present).toBe(2);
    expect(summary.late).toBe(1);
    expect(summary.absent).toBe(1);
    expect(summary.marked).toBe(4);
  });
});

describe('withDayMark stores and clears rich marks', () => {
  let record: AttendanceRecord;
  beforeEach(() => {
    record = emptyAttendanceRecord('b1', 's1');
  });

  it('round-trips a day with gate times', () => {
    const next = withDayMark(record, '2026-10-05', makeDayMark('P', '15:46', '19:28'));
    expect(next.months['2026-10']['2026-10-05']).toEqual({mark: 'P', entryAt: '15:46', exitAt: '19:28'});
  });

  it('clearing a day drops its times with it', () => {
    const marked = withDayMark(record, '2026-10-05', makeDayMark('P', '15:46', '19:28'));
    const cleared = withDayMark(marked, '2026-10-05', null);
    expect(cleared.months['2026-10']['2026-10-05']).toBeUndefined();
  });
});

describe('backend: setAttendanceDay with campus times', () => {
  beforeEach(() => {
    clearDemoStore();
  });

  it('saves gate times and keeps them when only the mark changes', async () => {
    const backend = await getBackend();
    const withTimes = await backend.setAttendanceDay('b1', 's1', '2026-10-05', 'P', {
      entryAt: '15:46',
      exitAt: '19:28',
    });
    expect(withTimes.months['2026-10']['2026-10-05']).toEqual({mark: 'P', entryAt: '15:46', exitAt: '19:28'});

    // A later write that omits `times` must NOT wipe them.
    const kept = await backend.setAttendanceDay('b1', 's1', '2026-10-05', 'L');
    expect(markCodeOf(kept.months['2026-10']['2026-10-05'])).toBe('L');
    expect(markTimesOf(kept.months['2026-10']['2026-10-05'])).toEqual({entryAt: '15:46', exitAt: '19:28'});
  });

  it('an explicit empty times object clears just the times', async () => {
    const backend = await getBackend();
    await backend.setAttendanceDay('b1', 's1', '2026-10-05', 'P', {entryAt: '15:46', exitAt: '19:28'});
    const cleared = await backend.setAttendanceDay('b1', 's1', '2026-10-05', 'P', {entryAt: null, exitAt: null});
    // No times left → the stored shape collapses back to the legacy string.
    expect(cleared.months['2026-10']['2026-10-05']).toBe('P');
  });
});
