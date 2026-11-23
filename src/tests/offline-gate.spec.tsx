import {act, render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it} from 'vitest';
import {OfflineGate} from '../components/OfflineGate';

/**
 * "Bina internet ke na chale" — the owner's instruction, 2026-11-23.
 *
 * The app used to keep painting a stale dashboard behind a thin strip. Now an
 * opaque gate covers everything and says, in plain words, that the app needs a
 * network. These tests drive `navigator.onLine` and the online/offline events.
 */
const setOnline = (online: boolean) => {
  Object.defineProperty(window.navigator, 'onLine', {value: online, configurable: true});
};

afterEach(() => setOnline(true));

describe('OfflineGate', () => {
  it('renders nothing while the device is online', () => {
    setOnline(true);
    render(<OfflineGate />);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('covers the app with a clear message when the device is offline', () => {
    setOnline(false);
    render(<OfflineGate />);

    const gate = screen.getByRole('alertdialog');
    expect(gate).toBeTruthy();
    expect(screen.getByText(/Internet connection nahi hai/i)).toBeTruthy();
    expect(screen.getByRole('button', {name: /retry/i})).toBeTruthy();
  });

  it('disappears the moment the network comes back', () => {
    setOnline(false);
    render(<OfflineGate />);
    expect(screen.queryByRole('alertdialog')).toBeTruthy();

    setOnline(true);
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('appears when the network drops while the app is open', () => {
    setOnline(true);
    render(<OfflineGate />);
    expect(screen.queryByRole('alertdialog')).toBeNull();

    setOnline(false);
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.queryByRole('alertdialog')).toBeTruthy();
  });
});
