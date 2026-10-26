import {beforeEach, describe, expect, it} from 'vitest';
import {getBackend} from '../lib/backend';
import {clearDemoStore} from '../lib/backend/demoStore';
import {
  clearStoredSession,
  hasStoredSession,
  readStoredSession,
  storedSessionPhone,
  writeStoredSession,
} from '../lib/sessionStore';
import {identityEmail, identityPassword} from '../lib/firebase/identity';
import {sanitizeForFirestore} from '../lib/firebase/firestore';

/**
 * "Refresh karte hi login hat jata hai" — the regression suite.
 *
 * Three layers are pinned here:
 *   1. the local session marker (what a reload resumes from),
 *   2. the identity derivation (what makes one number = one account on every
 *      device),
 *   3. the Firestore write sanitizer (what stops `setDoc` from dying on an
 *      `undefined` field, e.g. a syllabus topic with no weightage yet).
 */
describe('session marker: the record a reload resumes from', () => {
  beforeEach(() => {
    clearStoredSession();
  });

  it('round-trips uid, number and bound child', () => {
    writeStoredSession({uid: 'u1', phone: '9876543210', studentId: 'kid-1'});

    const stored = readStoredSession();
    expect(stored?.uid).toBe('u1');
    expect(stored?.phone).toBe('9876543210');
    expect(stored?.studentId).toBe('kid-1');
    expect(hasStoredSession()).toBe(true);
    expect(storedSessionPhone()).toBe('9876543210');
  });

  it('is absent before anything is written', () => {
    expect(readStoredSession()).toBeNull();
    expect(hasStoredSession()).toBe(false);
    expect(storedSessionPhone()).toBe('');
  });

  it('clearing it means a reload cannot auto-resume', () => {
    writeStoredSession({uid: 'u1', phone: '9876543210'});
    clearStoredSession();

    expect(readStoredSession()).toBeNull();
    expect(hasStoredSession()).toBe(false);
  });

  it('rejects garbage rather than trusting a corrupted marker', () => {
    localStorage.setItem('pwparent.session.v1', '{not json');
    expect(readStoredSession()).toBeNull();

    localStorage.setItem('pwparent.session.v1', JSON.stringify({phone: '9876543210'}));
    expect(readStoredSession()).toBeNull(); // no uid -> not a session

    localStorage.setItem('pwparent.session.v1', JSON.stringify({uid: 'u1', phone: '+91 98765-43210'}));
    expect(readStoredSession()?.phone).toBe('9876543210'); // normalised
  });

  it('a later write describes the LIVE session, not a stale one', () => {
    writeStoredSession({uid: 'u1', phone: '9876543210', studentId: 'kid-1'});
    writeStoredSession({uid: 'u2', phone: '9000000000'});

    const stored = readStoredSession();
    expect(stored?.uid).toBe('u2');
    expect(stored?.phone).toBe('9000000000');
  });
});

describe('mock backend: the marker follows sign-in and sign-out', () => {
  beforeEach(() => {
    clearDemoStore();
    clearStoredSession();
  });

  it('a login leaves a marker, so the next reload resumes instead of flashing login', async () => {
    const backend = await getBackend();
    const session = await backend.signInWithPhone('9876543210');

    const stored = readStoredSession();
    expect(stored?.uid).toBe(session.uid);
    expect(stored?.phone).toBe('9876543210');

    const restored = await backend.restoreSession();
    expect(restored?.uid).toBe(session.uid);
  });

  it('sign-out drops the marker — a signed-out device never auto-resumes', async () => {
    const backend = await getBackend();
    await backend.signInWithPhone('9876543210');
    await backend.signOut();

    expect(readStoredSession()).toBeNull();
    expect(await backend.restoreSession()).toBeNull();
  });
});

describe('identity derivation: one number + one code = one account everywhere', () => {
  it('builds a synthetic address from the 10-digit number', () => {
    expect(identityEmail('9876543210')).toBe('9876543210@pwparent.local');
    expect(identityEmail('+91 98765-43210')).toBe('9876543210@pwparent.local');
    expect(identityEmail('')).toBe('');
  });

  it('keeps the code as the password, padding short codes past Firebase\'s floor', () => {
    expect(identityPassword('314159')).toBe('314159');
    expect(identityPassword('1234').length).toBeGreaterThanOrEqual(6);
    expect(identityPassword('')).toBe('');
  });

  it('is deterministic, and a changed code changes the password', () => {
    expect(identityPassword('314159')).toBe(identityPassword('314159'));
    expect(identityPassword('314159')).not.toBe(identityPassword('654113'));
  });
});

describe('Firestore write sanitizer: undefined never reaches setDoc', () => {
  it('drops object keys holding undefined', () => {
    const clean = sanitizeForFirestore({
      title: 'Milestone 1',
      paperType: 'Objective',
      syllabus: [{subject: 'Physics', topic: 'Optics', weightage: undefined}],
    }) as {title: string; paperType: string; syllabus: {weightage?: number}[]};

    expect(clean.syllabus[0]).not.toHaveProperty('weightage');
    expect(JSON.stringify(clean)).not.toContain('undefined');
  });

  it('turns undefined ARRAY SLOTS into null (slots cannot just vanish)', () => {
    const clean = sanitizeForFirestore([1, undefined, 'x']) as (number | string | null)[];
    expect(clean).toEqual([1, null, 'x']);
  });

  it('recurses into nested payloads and keeps real values', () => {
    const clean = sanitizeForFirestore({
      a: {b: {c: undefined, d: 0, e: null, f: ''}},
    }) as {a: {b: Record<string, unknown>}};

    expect(clean.a.b).toEqual({d: 0, e: null, f: ''});
  });

  it('passes class instances (Timestamp, Date, sentinels) through untouched', () => {
    const when = new Date('2026-10-26T00:00:00Z');
    const clean = sanitizeForFirestore({when, n: 1}) as {when: Date; n: number};
    expect(clean.when).toBe(when);
    expect(clean.n).toBe(1);
  });
});
