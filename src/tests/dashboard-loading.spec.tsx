import {render, renderHook, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it} from 'vitest';
import App from '../App';
import {useBatchView} from '../hooks/useBatchView';
import {getBackend} from '../lib/backend';
import {clearDemoStore} from '../lib/backend/demoStore';
import {markOnboarded} from '../lib/firstVisit';
import {writeStoredSession} from '../lib/sessionStore';

/**
 * "0 / 0 for a few milliseconds" — the report this pins.
 *
 * The dashboard's own `loading` gate only covered the batch LIST. Tests,
 * results and attendance land in two later reads, so for a beat the app drew a
 * real child with real zeros: 0/0 tests, an empty calendar. Zeros are not a slow
 * answer, they are a wrong one — the skeleton must hold until `dataReady`.
 */
describe('dashboard loading gate', () => {
  beforeEach(() => {
    clearDemoStore();
    markOnboarded();
    writeStoredSession({uid: 'u-1', phone: '9876543210', studentId: 'kid-1'});
  });

  it('first paint is the shimmer skeleton — never a 0/0 dashboard', () => {
    render(<App />);

    expect(screen.getByLabelText('Loading dashboard')).toBeTruthy();
    expect(screen.queryByText('0/0')).toBeNull();
  });

  it('drops the skeleton once the batch data has landed', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.queryByLabelText('Loading dashboard')).toBeNull();
    });
  });
});

describe('useBatchView.dataReady', () => {
  beforeEach(() => {
    clearDemoStore();
  });

  it('is false until the batches, tests and attendance for this child are in', async () => {
    const backend = await getBackend();
    const [student] = await backend.getLinkedStudents();

    // A signed-in parent: with no uid there is nothing to load and the hook is
    // "ready" by definition (the dashboard then says "no batch allotted").
    const {result} = renderHook(() => useBatchView(backend, student, backend.currentUid() ?? 'parent-1'));

    expect(result.current.dataReady).toBe(false);

    await waitFor(() => {
      expect(result.current.dataReady).toBe(true);
    });
  });

  it('needs a backend to be ready at all — no crash without one', () => {
    const {result} = renderHook(() => useBatchView(null, null, null));
    expect(result.current.dataReady).toBe(true); // nothing to load, nothing to wait for
  });
});
