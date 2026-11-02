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
 * Plus the header shape: the circular sync button was REMOVED on the owner's
 * instruction — the spec locks that it never comes back.
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

describe('header: no sync button (owner instruction, 2026-11-02)', () => {
  it('renders selector + profile only — the refresh icon is gone', () => {
    render(
      <MainTopBar
        selectedBatchName="Vidyapeeth 16"
        onOpenBatchSelector={vi.fn()}
        activeStudent={student}
        onOpenProfile={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText('Refresh data')).toBeNull();
    expect(screen.getByTitle('Open Profile')).toBeTruthy();
    expect(screen.getByTitle('Select Batch')).toBeTruthy();
  });
});

describe('boot: a remembered session never shows a login frame', () => {
  beforeEach(async () => {
    clearDemoStore();
    clearStoredSession();
    markOnboarded();
    await getBackend();
  });

  it('opens on the DASHBOARD (skeleton) even when nothing is remembered', async () => {
    const {result} = renderHook(() => useAppData());

    // Never a login first-paint: the dashboard skeleton holds the screen…
    expect(result.current.screen).toBe('dashboard');
    expect(result.current.booting).toBe(true);
    expect(result.current.hydrating).toBe(true);

    // …and an unrestorable device is walked to login FROM the dashboard.
    await waitFor(() => expect(result.current.screen).toBe('login'));
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
