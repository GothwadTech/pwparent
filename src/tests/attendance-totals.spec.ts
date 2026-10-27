import {describe, expect, it} from 'vitest';
import {attendanceTotals} from '../lib/attendanceTotals';

/**
 * The dashboard's lifetime attendance figures = admin-seeded history + the
 * running week's live marks. Day-wise records only exist for the week in
 * progress, so without the seed the all-time numbers could never be right.
 */
describe('attendanceTotals: seeded history + running week', () => {
  it('adds the week\'s marks on top of the seeded history', () => {
    const totals = attendanceTotals(120, 114, 11, 11);
    expect(totals.studyDays).toBe(131);
    expect(totals.presentDays).toBe(125);
    expect(totals.percent).toBe(Math.round((125 / 131) * 100));
  });

  it('every marked day is a study day; only P/L days are present days', () => {
    const totals = attendanceTotals(0, 0, 6, 4); // 6 marked, 4 present/late
    expect(totals.studyDays).toBe(6);
    expect(totals.presentDays).toBe(4);
    expect(totals.percent).toBe(67);
  });

  it('reads zero, not NaN, when nothing exists yet', () => {
    const totals = attendanceTotals(undefined, undefined, 0, 0);
    expect(totals).toEqual({studyDays: 0, presentDays: 0, percent: 0});
  });

  it('a seed typo can never push the donut past 100%', () => {
    const totals = attendanceTotals(10, 40, 0, 0);
    expect(totals.presentDays).toBe(10);
    expect(totals.percent).toBe(100);
  });

  it('ignores negative seeds and negative mark counts', () => {
    const totals = attendanceTotals(-5, -9, 3, 2);
    expect(totals.studyDays).toBe(3);
    expect(totals.presentDays).toBe(2);
  });
});
