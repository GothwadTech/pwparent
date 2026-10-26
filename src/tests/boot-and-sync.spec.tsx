import {fireEvent, render, renderHook, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {MainTopBar} from '../components/MainTopBar';
import {useAppData} from '../hooks/useAppData';
import {getBackend} from '../lib/backend';
import {clearDemoStore} from '../lib/backend/demoStore';
import {clearStoredSession} from '../lib/sessionStore';
import {markOnboarded} from '../lib/firstVisit';
import type {StudentProfile} from '../types';

/**
 * The two boot guarantees behind "refresh pe login blink / white screen":
 *
 *   • a device that remembers a session opens ON THE DASHBOARD — the login
 *     screen is never shown for even one frame while the restore lands;
 *   • when the remembered session cannot be restored the app falls back to
 *     login honestly (prefilled number), instead of holding a blank paint.
 *
 * Plus the header's circular sync button: left of the avatar, spins while the
 * cache-bypassing re-read runs, and gone entirely without a handler.
 */
const student: StudentProfile = {
  id: 'kid-1',
  name: 'Test Child',
  batch: 'NEET',
  course: 'Yakeen NEET Batch',
  attendance: '95%',
  testsCompleted: 3,
  dppsDone: 10,
  videoWatchRate: '70%',
  tests: [],
};

describe('header sync button', () => {
  it('sits to the LEFT of the profile avatar and fires the refresh', async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const onRefreshData = vi.fn(() => pending);

    const {container} = render(
      <MainTopBar
        selectedBatchName="Vidyapeeth 16"
        onOpenBatchSelector={vi.fn()}
        activeStudent={student}
        onOpenProfile={vi.fn()}
        onRefreshData={onRefreshData}
      />,
    );

    const sync = screen.getByLabelText('Refresh data');
    const profile = screen.getByTitle('Open Profile');
    expect(sync.parentElement).toBe(profile.parentElement);
    expect(
      sync.compareDocumentPosition(profile) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    fireEvent.click(sync);
    expect(onRefreshData).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(container.innerHTML).toContain('animate-spin'));

    release();
    await waitFor(() => expect(container.innerHTML).not.toContain('animate-spin'));
  });

  it('does not render at all when the owner offers no refresh', () => {
    render(
      <MainTopBar
        selectedBatchName="B"
        onOpenBatchSelector={vi.fn()}
        activeStudent={student}
        onOpenProfile={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText('Refresh data')).toBeNull();
  });
});

describe('boot: a remembered session never shows a login frame', () => {
  beforeEach(async () => {
    clearDemoStore();
    clearStoredSession();
    markOnboarded();
    await getBackend();
  });

  it('opens on login when nothing is remembered', () => {
    const {result} = renderHook(() => useAppData());

    expect(result.current.screen).toBe('login');
    expect(result.current.booting).toBe(false);
  });

  it('opens on the dashboard (paint held) when a session is remembered', async () => {
    const backend = await getBackend();
    await backend.signInWithPhone('9876543210');

    const {result} = renderHook(() => useAppData());

    // FIRST PAINT is already the dashboard — no login blink, ever.
    expect(result.current.screen).toBe('dashboard');
    expect(result.current.booting).toBe(true);

    await waitFor(() => expect(result.current.booting).toBe(false));
    expect(result.current.screen).toBe('dashboard');
    expect(result.current.uid).toBeTruthy();
  });

  it('falls back to login, prefilled, when the session cannot be restored', async () => {
    const backend = await getBackend();
    await backend.signInWithPhone('9876543210');
    clearDemoStore(); // marker survives, the session behind it does not

    const {result} = renderHook(() => useAppData());
    expect(result.current.screen).toBe('dashboard'); // optimistic open…

    await waitFor(() => expect(result.current.screen).toBe('login')); // …honest fallback
    await waitFor(() => expect(result.current.booting).toBe(false));
    expect(result.current.phoneNumber).toBe('9876543210');
  });
});
