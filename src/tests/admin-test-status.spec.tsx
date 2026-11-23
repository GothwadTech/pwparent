import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {BatchTestsPanel} from '../components/admin/BatchTestsPanel';
import {getBackend, newBatchId} from '../lib/backend';
import {clearDemoStore} from '../lib/backend/demoStore';
import type {Backend} from '../lib/backend';
import type {Batch, BatchTest} from '../types';

const batch = (): Batch => ({
  id: newBatchId(),
  name: 'MISSION 30 NEET 2026',
  batchType: 'offline',
});

const optionsOf = (select: HTMLSelectElement) => [...select.options].map((o) => [o.value, o.textContent]);

/**
 * The admin's Status control.
 *
 * The bug this pins: only `Scheduled` and `Completed` could be chosen, so there
 * was no way to say "upcoming" — and a test saved as `scheduled` before this
 * change must still open as Upcoming, not as a value the dropdown cannot show.
 */
describe('admin: test status control', () => {
  let backend: Backend;

  beforeEach(async () => {
    clearDemoStore();
    backend = await getBackend();
  });

  it('offers Upcoming, Completed and Cancelled — and defaults a new test to Upcoming', async () => {
    const b = batch();
    await backend.saveBatch(b);

    render(<BatchTestsPanel backend={backend} batch={b} flash={vi.fn()} />);
    await userEvent.click(await screen.findByRole('button', {name: /create test/i}));

    const select = screen.getByLabelText(/status/i) as HTMLSelectElement;
    expect(optionsOf(select)).toEqual([
      ['upcoming', 'Upcoming'],
      ['completed', 'Completed'],
      ['cancelled', 'Cancelled'],
    ]);
    expect(select.value).toBe('upcoming');
  });

  it('opens a legacy `scheduled` test as Upcoming and shows the chip in the list', async () => {
    const b = batch();
    await backend.saveBatch(b);
    const legacy: BatchTest = {
      id: 'legacy-1',
      batchId: b.id,
      title: 'Major Test 1',
      date: '2026-10-05',
      mode: 'Offline',
      marksTotal: 720,
      status: 'scheduled',
      syllabus: [],
    };
    await backend.saveTest(b.id, legacy);

    render(<BatchTestsPanel backend={backend} batch={b} flash={vi.fn()} />);

    // The list used to print the raw lowercase value; now it is a chip.
    expect(await screen.findByText('Upcoming')).toBeTruthy();
    expect(screen.queryByText(/· scheduled/)).toBeNull();

    await userEvent.click(screen.getByRole('button', {name: /edit/i}));
    await waitFor(() => {
      const select = screen.getByLabelText(/status/i) as HTMLSelectElement;
      expect(select.value).toBe('upcoming');
    });
  });

  it('saves a cancelled test as cancelled', async () => {
    const b = batch();
    await backend.saveBatch(b);

    render(<BatchTestsPanel backend={backend} batch={b} flash={vi.fn()} />);
    await userEvent.click(await screen.findByRole('button', {name: /create test/i}));

    await userEvent.type(screen.getByLabelText(/title/i), 'Major Test 9');
    await userEvent.selectOptions(screen.getByLabelText(/status/i), 'cancelled');
    await userEvent.click(screen.getByRole('button', {name: /save test/i}));

    await waitFor(async () => {
      const saved = await backend.listTests(b.id);
      expect(saved).toHaveLength(1);
      expect(saved[0].status).toBe('cancelled');
      expect(saved[0].title).toBe('Major Test 9');
    });
  });
});
