import {describe, expect, it} from 'vitest';
import {streakDisplay} from '../lib/attendanceTotals';

/**
 * Admin-controlled streak: a manual base plus attendance-driven growth whose
 * step the admin picks per student (every day / every two days / never).
 * Untouched students keep the old behaviour: base 0, +1 per present day.
 */
describe('streakDisplay', () => {
  it('defaults to the old behaviour: one per consecutive present day', () => {
    expect(streakDisplay(5)).toBe(5);
    expect(streakDisplay(0)).toBe(0);
  });

  it('adds the admin-typed base on top of the run', () => {
    expect(streakDisplay(3, 10)).toBe(13);
    expect(streakDisplay(0, 16)).toBe(16);
  });

  it('step 2 grows one per TWO present days', () => {
    expect(streakDisplay(5, 0, 2)).toBe(2);
    expect(streakDisplay(4, 10, 2)).toBe(12);
  });

  it('step 0 never grows — the manual base is the whole streak', () => {
    expect(streakDisplay(9, 7, 0)).toBe(7);
    expect(streakDisplay(9, undefined, 0)).toBe(0);
  });

  it('never goes negative on junk input', () => {
    expect(streakDisplay(-4, -3, 1)).toBe(0);
  });
});
