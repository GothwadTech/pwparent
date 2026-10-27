import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

/**
 * These tests guard the thing that most often breaks a Cloudflare Pages deploy:
 * a missing/half-filled env must degrade to MOCK mode, never to a crash.
 */

const REQUIRED: Record<string, string> = {
  VITE_FIREBASE_API_KEY: 'AIzaSyTestTestTestTestTestTestTestTestTest',
  VITE_FIREBASE_AUTH_DOMAIN: 'pwparent-test.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'pwparent-test',
  VITE_FIREBASE_STORAGE_BUCKET: 'pwparent-test.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '1234567890',
  VITE_FIREBASE_APP_ID: '1:1234567890:web:abcdef',
};

beforeEach(() => {
  for (const key of Object.keys(REQUIRED)) {
    vi.stubEnv(key, '');
    vi.stubEnv(key.replace(/^VITE_/, ''), '');
  }
  vi.stubEnv('VITE_BACKEND_MODE', '');
  vi.stubEnv('BACKEND_MODE', '');
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('src/lib/config', () => {
  it('defaults to mock mode when no Firebase env is set (CI default)', async () => {
    const config = await import('../lib/config');

    expect(config.backendMode).toBe('mock');
    expect(config.isFirebaseEnabled).toBe(false);
    expect(config.isFirebaseConfigured).toBe(false);
    expect(config.missingFirebaseKeys().length).toBe(6);
    expect(config.APP_ENV).toBeTruthy();
  });

  it('treats .env.example placeholders (MY_*) as "not set"', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'MY_FIREBASE_API_KEY');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'MY_PROJECT_ID');
    vi.resetModules();

    const config = await import('../lib/config');
    expect(config.isFirebaseConfigured).toBe(false);
    expect(config.firebaseConfig.apiKey).toBeUndefined();
  });

  it('never enables firebase mode on a partial config', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', REQUIRED.VITE_FIREBASE_API_KEY);
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', REQUIRED.VITE_FIREBASE_PROJECT_ID);
    vi.stubEnv('VITE_BACKEND_MODE', 'firebase');
    vi.resetModules();

    const config = await import('../lib/config');
    expect(config.isFirebaseConfigured).toBe(false);
    // Requested firebase, but incomplete -> safely falls back to mock.
    expect(config.backendMode).toBe('mock');
    expect(config.isFirebaseEnabled).toBe(false);
  });

  it('enables firebase mode when all 6 required vars are present', async () => {
    for (const [key, value] of Object.entries(REQUIRED)) vi.stubEnv(key, value);
    vi.stubEnv('VITE_BACKEND_MODE', 'firebase');
    vi.resetModules();

    const config = await import('../lib/config');
    expect(config.missingFirebaseKeys()).toEqual([]);
    expect(config.isFirebaseConfigured).toBe(true);
    expect(config.backendMode).toBe('firebase');
    expect(config.isFirebaseEnabled).toBe(true);
  });

  it('accepts unprefixed FIREBASE_* names as a fallback', async () => {
    for (const [key, value] of Object.entries(REQUIRED)) {
      vi.stubEnv(key.replace(/^VITE_/, ''), value);
    }
    // Blank the VITE_-prefixed name: read() checks VITE_<KEY> first and treats
    // an empty string as unset, so this is what actually exercises the
    // unprefixed fallback (vitest.config.ts pins VITE_BACKEND_MODE=mock).
    vi.stubEnv('VITE_BACKEND_MODE', '');
    vi.stubEnv('BACKEND_MODE', 'firebase');
    vi.resetModules();

    const config = await import('../lib/config');
    expect(config.isFirebaseConfigured).toBe(true);
    expect(config.backendMode).toBe('firebase');
  });
});
