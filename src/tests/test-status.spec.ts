import {describe, expect, it} from 'vitest';
import {
  adminStatusLabel,
  countsTowardsTotal,
  isResultlessImportStatus,
  isUpcomingStatus,
  normalizeStatusInput,
  testDisplayStatus,
} from '../lib/testStatus';
import type {BatchTestStatus} from '../types';

const TODAY = '2026-11-23';

const test = (status: BatchTestStatus, date: string) => ({status, date});

/**
 * The single derivation every test card goes through.
 *
 * The bug this pins: a paper dated in the future used to render as
 * "RESULT_AWAITING" — the parent was told a result was pending for a test that
 * had not been held yet.
 */
describe('testDisplayStatus', () => {
  it('a future paper with no result is UPCOMING, not result-awaited', () => {
    expect(testDisplayStatus(test('upcoming', '2026-11-30'), null, TODAY)).toBe('UPCOMING');
  });

  it('today counts as Upcoming — the paper is still to come', () => {
    expect(testDisplayStatus(test('upcoming', TODAY), null, TODAY)).toBe('UPCOMING');
  });

  it('the same paper the day after it was held is RESULT_AWAITING', () => {
    expect(testDisplayStatus(test('upcoming', '2026-11-22'), null, TODAY)).toBe('RESULT_AWAITING');
  });

  it('the legacy `scheduled` value behaves exactly like `upcoming`', () => {
    expect(testDisplayStatus(test('scheduled', '2026-11-30'), null, TODAY)).toBe('UPCOMING');
    expect(testDisplayStatus(test('scheduled', '2026-11-01'), null, TODAY)).toBe('RESULT_AWAITING');
  });

  it('a completed paper with no marks is RESULT_AWAITING', () => {
    expect(testDisplayStatus(test('completed', '2026-11-01'), null, TODAY)).toBe('RESULT_AWAITING');
  });

  it('cancelled wins over the date, and over a missing result', () => {
    expect(testDisplayStatus(test('cancelled', '2026-11-30'), null, TODAY)).toBe('CANCELLED');
    expect(testDisplayStatus(test('cancelled', '2026-11-01'), null, TODAY)).toBe('CANCELLED');
  });

  it('a stored result always wins over the derived label', () => {
    expect(testDisplayStatus(test('completed', '2026-11-01'), {status: 'ATTEMPTED'}, TODAY)).toBe('ATTEMPTED');
    expect(testDisplayStatus(test('completed', '2026-11-01'), {status: 'MISSED'}, TODAY)).toBe('MISSED');
    // Marks entered early on a paper still marked upcoming: show the marks.
    expect(testDisplayStatus(test('upcoming', '2026-12-01'), {status: 'ATTEMPTED'}, TODAY)).toBe('ATTEMPTED');
  });
});

describe('countsTowardsTotal', () => {
  it('leaves upcoming and cancelled papers out of the denominator', () => {
    expect(countsTowardsTotal(test('upcoming', '2026-11-30'), TODAY)).toBe(false);
    expect(countsTowardsTotal(test('cancelled', '2026-11-01'), TODAY)).toBe(false);
    expect(countsTowardsTotal(test('completed', '2026-11-01'), TODAY)).toBe(true);
    // Held yesterday but not yet marked completed — it still counts.
    expect(countsTowardsTotal(test('upcoming', '2026-11-22'), TODAY)).toBe(true);
  });
});

describe('status helpers', () => {
  it('treats scheduled as upcoming', () => {
    expect(isUpcomingStatus('scheduled')).toBe(true);
    expect(isUpcomingStatus('upcoming')).toBe(true);
    expect(isUpcomingStatus('completed')).toBe(false);
    expect(isUpcomingStatus(undefined)).toBe(false);
  });

  it('labels every stored value for the admin list', () => {
    expect(adminStatusLabel('scheduled')).toBe('Upcoming');
    expect(adminStatusLabel('upcoming')).toBe('Upcoming');
    expect(adminStatusLabel('completed')).toBe('Completed');
    expect(adminStatusLabel('cancelled')).toBe('Cancelled');
  });

  it('normalises imported values and refuses an unknown one', () => {
    expect(normalizeStatusInput('UPCOMING', 't')).toBe('upcoming');
    expect(normalizeStatusInput('Scheduled', 't')).toBe('upcoming');
    expect(normalizeStatusInput('DONE', 't')).toBe('completed');
    expect(normalizeStatusInput('canceled', 't')).toBe('cancelled');
    expect(normalizeStatusInput('', 't')).toBe('completed');
    expect(normalizeStatusInput(undefined, 't')).toBe('completed');
    expect(() => normalizeStatusInput('POSTPONED', 'Major Test 4')).toThrow(/Major Test 4/);
  });

  it('knows which imported papers carry no marks', () => {
    expect(isResultlessImportStatus('UPCOMING')).toBe(true);
    expect(isResultlessImportStatus('scheduled')).toBe(true);
    expect(isResultlessImportStatus('CANCELLED')).toBe(true);
    expect(isResultlessImportStatus('COMPLETED')).toBe(false);
    expect(isResultlessImportStatus(undefined)).toBe(false);
  });
});
