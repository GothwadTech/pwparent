import {afterEach, describe, expect, it} from 'vitest';
import type {StudentProfile} from '../types';
import {
  averageAccuracy,
  averageScore,
  clampPercent,
  isAdminUnlocked,
  lockAdmin,
  marksToPercent,
  newTestId,
  normalizePercentText,
  recomputeStudent,
  unlockAdmin,
} from '../lib/admin';

const student = (overrides: Partial<StudentProfile> = {}): StudentProfile => ({
  id: 's1',
  name: 'Test Student',
  batch: 'Career Pass',
  course: 'Lakshya Batch 2026',
  attendance: '0%',
  testsCompleted: 0,
  dppsDone: 0,
  videoWatchRate: '0%',
  tests: [],
  ...overrides,
});

afterEach(() => {
  lockAdmin();
});

describe('admin passcode gate', () => {
  it('rejects a wrong passcode and leaves the panel locked', () => {
    expect(unlockAdmin('definitely-wrong')).toBe(false);
    expect(isAdminUnlocked()).toBe(false);
  });

  it('unlocks with the configured default passcode and locks again on demand', () => {
    expect(unlockAdmin('pw-admin-demo')).toBe(true);
    expect(isAdminUnlocked()).toBe(true);

    lockAdmin();
    expect(isAdminUnlocked()).toBe(false);
  });

  it('trims surrounding whitespace but is not case-insensitive', () => {
    expect(unlockAdmin('  pw-admin-demo  ')).toBe(true);
    lockAdmin();
    expect(unlockAdmin('PW-ADMIN-DEMO')).toBe(false);
  });

  it('rejects a prefix of the real passcode (no accidental partial match)', () => {
    expect(unlockAdmin('pw-admin')).toBe(false);
    expect(unlockAdmin('')).toBe(false);
  });
});

describe('marks maths', () => {
  it('converts raw marks to a clamped percentage', () => {
    expect(marksToPercent(234, 300)).toBe(78);
    expect(marksToPercent(300, 300)).toBe(100);
    expect(marksToPercent(400, 300)).toBe(100); // never exceeds 100
    expect(marksToPercent(-5, 300)).toBe(0); // never below 0
  });

  it('returns undefined when the total is missing or zero (no NaN in the UI)', () => {
    expect(marksToPercent(120, 0)).toBeUndefined();
    expect(marksToPercent(120, undefined)).toBeUndefined();
    expect(marksToPercent(undefined, 300)).toBeUndefined();
  });

  it('clamps percentages to 0-100 and rounds', () => {
    expect(clampPercent(104.6)).toBe(100);
    expect(clampPercent(-3)).toBe(0);
    expect(clampPercent(66.4)).toBe(66);
    expect(clampPercent(66.5)).toBe(67);
  });

  it('normalises whatever an admin types into the "96%" display format', () => {
    expect(normalizePercentText('96')).toBe('96%');
    expect(normalizePercentText('96%')).toBe('96%');
    expect(normalizePercentText('  9 6 ')).toBe('96%');
    expect(normalizePercentText('abc')).toBe('0%');
    expect(normalizePercentText('250')).toBe('100%');
  });
});

describe('averaging ignores missed tests', () => {
  it('averages only ATTEMPTED tests, so a MISSED one cannot drag the score down', () => {
    const tests = [
      {id: 't1', title: 'Test 1', date: '01-01-2026', mode: 'Online' as const, status: 'ATTEMPTED' as const, scorePercent: 80, accuracyPercent: 90},
      {id: 't2', title: 'Test 2', date: '02-01-2026', mode: 'Online' as const, status: 'MISSED' as const},
      {id: 't3', title: 'Test 3', date: '03-01-2026', mode: 'Offline' as const, status: 'ATTEMPTED' as const, scorePercent: 60, accuracyPercent: 70},
    ];

    expect(averageScore(tests)).toBe(70); // (80 + 60) / 2, not / 3
    expect(averageAccuracy(tests)).toBe(80);
  });

  it('returns 0 rather than NaN for an empty test list', () => {
    expect(averageScore([])).toBe(0);
    expect(averageAccuracy([])).toBe(0);
  });
});

describe('recomputeStudent keeps the scorecard self-consistent', () => {
  it('derives testsCompleted, averages and per-test score from raw marks', () => {
    const result = recomputeStudent(
      student({
        testsTotal: 4,
        tests: [
          {id: 't1', title: 'Test 1', date: '01-01-2026', mode: 'Online', status: 'ATTEMPTED', marksObtained: 240, marksTotal: 300, accuracyPercent: 85},
          {id: 't2', title: 'Test 2', date: '02-01-2026', mode: 'Online', status: 'MISSED', marksTotal: 300},
          {id: 't3', title: 'Test 3', date: '03-01-2026', mode: 'Offline', status: 'ATTEMPTED', marksObtained: 150, marksTotal: 300, accuracyPercent: 65},
        ],
      }),
    );

    expect(result.testsCompleted).toBe(2); // attempted only
    expect(result.testsTotal).toBe(4); // admin-set denominator is respected
    expect(result.avgScorePercent).toBe(65); // (80 + 50) / 2
    expect(result.accuracyPercent).toBe(75); // (85 + 65) / 2
    expect(result.tests?.[0].scorePercent).toBe(80);
    expect(result.tests?.[1].scorePercent).toBeUndefined(); // missed, no marks
    expect(result.tests?.[2].scorePercent).toBe(50);
  });

  it('does not mutate the input object', () => {
    const original = student({testsCompleted: 99});
    const result = recomputeStudent(original);

    expect(result).not.toBe(original);
    expect(original.testsCompleted).toBe(99);
    expect(result.testsCompleted).toBe(0);
  });

  it('infers testsTotal from the list when the admin never set it', () => {
    const result = recomputeStudent(
      student({
        tests: [
          {id: 't1', title: 'Test 1', date: '01-01-2026', mode: 'Online', status: 'ATTEMPTED', marksObtained: 100, marksTotal: 100},
          {id: 't2', title: 'Test 2', date: '02-01-2026', mode: 'Online', status: 'MISSED'},
        ],
      }),
    );

    expect(result.testsTotal).toBe(2);
    expect(result.testsCompleted).toBe(1);
  });
});

describe('newTestId', () => {
  it('increments past the highest existing numeric suffix', () => {
    expect(newTestId([])).toBe('t1');
    expect(newTestId([{id: 't3', title: 'x', date: 'y', mode: 'Online', status: 'MISSED'}])).toBe('t4');
  });

  it('ignores ids with no numeric suffix instead of producing NaN', () => {
    expect(newTestId([{id: 'abc', title: 'x', date: 'y', mode: 'Online', status: 'MISSED'}])).toBe('t1');
  });
});
