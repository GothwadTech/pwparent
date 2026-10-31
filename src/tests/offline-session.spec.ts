import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

/**
 * Airplane-mode session survival.
 *
 * THE REPORT THIS LOCKS DOWN: "net off karte hi login screen aa jati hai, net
 * on karte hi wapas login ho jata hai." Root cause: `restoreSession()`
 * re-resolved the bound family uid through Firestore on every boot; offline
 * those reads came back empty, the raw device uid no longer matched the
 * marker, and the restore concluded "nobody is logged in".
 *
 * The fix has two layers, both tested here:
 *   1. Firestore persistent cache (src/lib/firebase/firestore.ts) — reads
 *      resolve from IndexedDB offline (integration-level, covered by the
 *      manual WebView check).
 *   2. Marker trust while offline — `restoreSession()` and the boot fall back
 *      to the stored session, but ONLY when `navigator.onLine === false`.
 */

vi.mock('../lib/firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/firebase/firestore')>();
  return {...actual, readDoc: vi.fn(), readCollection: vi.fn()};
});

vi.mock('../lib/firebase/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/firebase/auth')>();
  return {...actual, whenAuthReady: vi.fn(), currentUserId: vi.fn()};
});

import {readDoc} from '../lib/firebase/firestore';
import * as auth from '../lib/firebase/auth';
import {createFirebaseBackend} from '../lib/backend/firebaseBackend';
import {resetCache} from '../lib/backend/readCache';
import {clearStoredSession, offlineSessionFromMarker, writeStoredSession} from '../lib/sessionStore';

const unavailable = () => Object.assign(new Error('offline'), {code: 'unavailable'});

function setOnLine(value: boolean) {
  Object.defineProperty(navigator, 'onLine', {value, configurable: true});
}

function mockAuthUser(uid: string | null) {
  vi.mocked(auth.whenAuthReady).mockResolvedValue(uid ? ({uid} as never) : null);
  vi.mocked(auth.currentUserId).mockReturnValue(uid);
}

beforeEach(() => {
  resetCache();
  clearStoredSession();
  vi.mocked(readDoc).mockRejectedValue(unavailable());
});

afterEach(() => {
  setOnLine(true);
  vi.clearAllMocks();
});

describe('offlineSessionFromMarker', () => {
  it('returns null while online — the live restore stays the only authority', () => {
    setOnLine(true);
    writeStoredSession({uid: 'family-uid', phone: '9876543210', studentId: 'stu-1'});
    expect(offlineSessionFromMarker()).toBeNull();
  });

  it('promotes the marker to a session when the device is offline', () => {
    setOnLine(false);
    writeStoredSession({uid: 'family-uid', phone: '9876543210', studentId: 'stu-1'});
    expect(offlineSessionFromMarker()).toEqual({uid: 'family-uid', phone: '9876543210', studentId: 'stu-1'});
  });

  it('returns null offline when this device never held a session', () => {
    setOnLine(false);
    expect(offlineSessionFromMarker()).toBeNull();
  });
});

describe('firebase backend: restoreSession in airplane mode', () => {
  it('trusts the marker uid when every Firestore read fails offline', async () => {
    setOnLine(false);
    // The bound family uid differs from this device's anonymous uid — exactly
    // the binding case that used to collapse to the login screen offline.
    writeStoredSession({uid: 'family-uid', phone: '9876543210', studentId: 'stu-1'});
    mockAuthUser('device-uid');

    const session = await createFirebaseBackend().restoreSession();

    expect(session).not.toBeNull();
    expect(session?.uid).toBe('family-uid');
    expect(session?.phone).toBe('9876543210');
    expect(session?.studentId).toBe('stu-1');
    expect(session?.isNewUser).toBe(false);
  });

  it('resumes from the marker even when the auth SDK hands back nothing offline', async () => {
    setOnLine(false);
    writeStoredSession({uid: 'family-uid', phone: '9876543210', studentId: 'stu-1'});
    mockAuthUser(null);

    const session = await createFirebaseBackend().restoreSession();

    expect(session?.uid).toBe('family-uid');
    expect(session?.phone).toBe('9876543210');
  });

  it('does NOT invent a session online just because a marker exists', async () => {
    setOnLine(true);
    writeStoredSession({uid: 'family-uid', phone: '9876543210', studentId: 'stu-1'});
    mockAuthUser('device-uid');

    // Online, reads failing with the marker uid ≠ live resolution means the
    // binding cannot be confirmed — the login screen is correct here.
    const session = await createFirebaseBackend().restoreSession();
    expect(session).toBeNull();
  });

  it('returns null offline for a device with no marker and no auth user', async () => {
    setOnLine(false);
    mockAuthUser(null);

    const session = await createFirebaseBackend().restoreSession();
    expect(session).toBeNull();
  });
});
