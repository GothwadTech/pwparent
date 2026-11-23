import {render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {AllTestsScreen} from '../components/AllTestsScreen';
import type {OfflineTestRow} from '../components/OfflineAttendanceDashboardView';
import {PILL_CANCELLED_BG, PILL_UPCOMING_BG} from '../lib/uiTheme';

const row = (id: string, name: string, status: OfflineTestRow['status']): OfflineTestRow => ({
  id,
  name,
  date: '30-11-2026',
  mode: 'Online',
  marks: '',
  scorePercent: '',
  rank: '',
  status,
  paperType: 'Objective',
});

/**
 * What the parent's phone actually paints for each status.
 *
 * The bug this pins: an upcoming paper rendered the indigo "Result has not been
 * announced yet" line, so a parent was told a result was pending for a test that
 * had not happened yet.
 */
describe('All Tests card — status rendering', () => {
  const renderScreen = (rows: OfflineTestRow[]) =>
    render(<AllTestsScreen tests={rows} onBack={vi.fn()} onOpenTest={vi.fn()} />);

  it('an UPCOMING paper shows the lavender chip and no "result awaited" line', () => {
    renderScreen([row('t1', 'Major Test 4', 'UPCOMING')]);

    const chip = screen.getByText('UPCOMING');
    expect(chip).toBeTruthy();
    expect(chip.getAttribute('style')).toContain(`background: ${PILL_UPCOMING_BG}`);

    expect(screen.queryByText('Result has not been announced yet')).toBeNull();
  });

  it('a RESULT_AWAITING paper keeps the awaiting line and hides score tiles', () => {
    renderScreen([row('t2', 'Major Test 3', 'RESULT_AWAITING')]);

    expect(screen.getByText('RESULT_AWAITING')).toBeTruthy();
    expect(screen.getByText('Result has not been announced yet')).toBeTruthy();
    expect(screen.queryByText('Score')).toBeNull();
  });

  it('a CANCELLED paper is neutral — no awaiting line, no score', () => {
    renderScreen([row('t3', 'Major Test 2', 'CANCELLED')]);

    const chip = screen.getByText('CANCELLED');
    expect(chip.getAttribute('style')).toContain(`background: ${PILL_CANCELLED_BG}`);
    expect(screen.queryByText('Result has not been announced yet')).toBeNull();
    expect(screen.queryByText('Score')).toBeNull();
  });

  it('an ATTEMPTED paper still shows score tiles and View Details', () => {
    renderScreen([
      {...row('t4', 'Major Test 1', 'ATTEMPTED'), marks: '156/720', scorePercent: '22%', rank: '2720'},
    ]);

    expect(screen.getByText('ATTEMPTED')).toBeTruthy();
    expect(screen.getByText('Score')).toBeTruthy();
    expect(screen.getByText('Rank')).toBeTruthy();
    expect(screen.getByText('View Details')).toBeTruthy();
  });
});
