import {render, screen} from '@testing-library/react';
import {beforeEach, describe, expect, it} from 'vitest';
import App from '../App';
import {clearDemoStore} from '../lib/backend/demoStore';
import {clearStoredSession, writeStoredSession} from '../lib/sessionStore';
import {clearOnboarded, markOnboarded} from '../lib/firstVisit';

/**
 * What the FIRST frame is allowed to be.
 *
 * The bug this pins: a device that was already logged in but had never tapped
 * through the intro showed "Get Started" for the whole 3-4 s the boot takes to
 * restore the session, then jumped to the dashboard. The intro is for a first
 * visit, not a welcome-back.
 */
describe('first paint', () => {
  beforeEach(() => {
    clearDemoStore();
    clearStoredSession();
    clearOnboarded();
  });

  it('a remembered session opens on the dashboard, never on the intro', () => {
    writeStoredSession({uid: 'u-1', phone: '9876543210', studentId: 'kid-1'});

    render(<App />);

    // The intro's only CTA — its presence means the wrong screen painted.
    expect(screen.queryByText('Get Started')).toBeNull();
  });

  it('a genuinely first visit still gets the intro', () => {
    render(<App />);

    expect(screen.getByText('Get Started')).toBeTruthy();
  });

  it('a device that finished the intro but logged out does not see it again', () => {
    markOnboarded();

    render(<App />);

    expect(screen.queryByText('Get Started')).toBeNull();
  });
});
