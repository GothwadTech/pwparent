import {describe, expect, it, vi} from 'vitest';
import {installServiceWorkerUpdates, shouldReloadOnControllerChange} from '../lib/swUpdate';
import {BUILD_VERSION, buildStamp} from '../lib/buildInfo';

/**
 * A deploy must reach an app that is already installed — without an APK update.
 *
 * The old generated registration was a bare `register('/sw.js')`: it never
 * reloaded on a new worker, so the first launch after a deploy kept painting the
 * old bundle. These pin the two pieces that make the new build land.
 */
describe('service worker updates', () => {
  it('reloads when a NEW worker takes over an already-controlled page', () => {
    expect(shouldReloadOnControllerChange(true)).toBe(true);
  });

  it('never reloads on the very first install (no controller yet)', () => {
    expect(shouldReloadOnControllerChange(false)).toBe(false);
  });

  it('is a safe no-op where service workers do not exist', () => {
    // jsdom has no navigator.serviceWorker — this must not throw.
    expect(() => installServiceWorkerUpdates()).not.toThrow();
  });
});

describe('build stamp', () => {
  it('always produces something readable for the settings row', () => {
    const stamp = buildStamp();
    expect(stamp.length).toBeGreaterThan(0);
    expect(stamp.startsWith(BUILD_VERSION)).toBe(true);
  });
});
