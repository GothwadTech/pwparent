/**
 * The local session marker — the reason a refresh must never log anyone out.
 *
 * ── THE BUG THIS FIXES ─────────────────────────────────────────────────────
 * Firebase Auth restores its user from IndexedDB **asynchronously**. On the
 * first tick after a reload `auth.currentUser` is still `null`, so a boot that
 * asked "who am I?" immediately got "nobody", showed the login screen and then
 * — worse — minted a BRAND NEW anonymous uid on the next sign-in, which points
 * at an empty `parents/{uid}` subtree. The session was never lost; it was read
 * before it had finished loading. That is exactly "refresh karte hi login hat
 * jata hai".
 *
 * Two changes fix it, and this file is the second one:
 *   1. `whenAuthReady()` (src/lib/firebase/auth.ts) — boot now WAITS for
 *      Firebase to finish restoring its user before deciding anything.
 *   2. This marker — a tiny record of the session this device last held, so a
 *      reload resumes instantly, the login field comes back prefilled, and a
 *      restore still works when the `parents/{uid}` profile read is slow,
 *      empty or denied.
 *
 * ── WHAT IT IS *NOT* ───────────────────────────────────────────────────────
 * Not a credential, and never trusted on its own. `restoreSession()` still
 * needs a real Firebase user (the security rules key on `request.auth.uid`, so
 * without one nothing is readable) and still re-reads the one-number-one-child
 * binding from `credentials/{phone}`. A marker whose uid does not match the
 * live auth user is discarded — it is never used to fake a login.
 *
 * Every access is wrapped: Safari private mode, a blocked cookie jar and
 * server-side rendering all throw on `window.localStorage`, and losing a
 * convenience cache must not take the app down with it.
 */

/** What one device remembers about the session it last held. */
export interface StoredSession {
  /** The Firebase uid that owns `parents/{uid}` for this login. */
  uid: string;
  /** Normalised 10-digit number — a profile field, not a credential. */
  phone: string;
  /** The single child this number is bound to. Null on legacy codes. */
  studentId: string | null;
  /** ISO timestamp of the last successful sign-in or restore. */
  at: string;
}

const KEY = 'pwparent.session.v1';

function store(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Reads and validates the marker. Anything malformed is treated as absent. */
export function readStoredSession(): StoredSession | null {
  const memory = store();
  if (!memory) return null;
  try {
    const raw = memory.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    const uid = typeof parsed.uid === 'string' ? parsed.uid.trim() : '';
    const phone = typeof parsed.phone === 'string' ? parsed.phone.replace(/\D/g, '').slice(-10) : '';
    if (!uid) return null;
    return {
      uid,
      phone,
      studentId: typeof parsed.studentId === 'string' && parsed.studentId ? parsed.studentId : null,
      at: typeof parsed.at === 'string' ? parsed.at : '',
    };
  } catch {
    return null;
  }
}

/**
 * Records the session this device now holds.
 *
 * Called after EVERY successful sign-in and after a successful restore, so the
 * marker always describes the live session rather than a stale one. Passing a
 * null uid keeps the previous uid (a restore that could not read the profile
 * still knows who it is).
 */
export function writeStoredSession(session: {
  uid?: string | null;
  phone?: string | null;
  studentId?: string | null;
}): void {
  const memory = store();
  if (!memory) return;
  const previous = readStoredSession();
  const uid = (session.uid ?? previous?.uid ?? '').trim();
  const phone = (session.phone ?? previous?.phone ?? '').replace(/\D/g, '').slice(-10);
  if (!uid && !phone) return;
  const next: StoredSession = {
    uid,
    phone,
    studentId: session.studentId ?? previous?.studentId ?? null,
    at: new Date().toISOString(),
  };
  try {
    memory.setItem(KEY, JSON.stringify(next));
  } catch {
    // Quota or a locked store: the marker is a convenience, not a requirement.
  }
}

/** Drops the marker. Called on sign-out, profile deletion and number switch. */
export function clearStoredSession(): void {
  const memory = store();
  if (!memory) return;
  try {
    memory.removeItem(KEY);
  } catch {
    // Nothing to do — an unreadable store holds no marker to clear.
  }
}

/**
 * True when this device believes it has a session.
 *
 * Used for one thing only: holding the first paint instead of flashing the
 * login form while Firebase finishes restoring the user. It never decides
 * whether anyone is actually signed in.
 */
export function hasStoredSession(): boolean {
  return readStoredSession() !== null;
}

/** The remembered number, for prefilling the login field. '' when unknown. */
export function storedSessionPhone(): string {
  return readStoredSession()?.phone ?? '';
}
