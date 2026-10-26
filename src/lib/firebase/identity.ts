/**
 * A PERMANENT identity for a login number — so one account works on every
 * device and survives every refresh.
 *
 * ── THE PROBLEM WITH ANONYMOUS-ONLY ────────────────────────────────────────
 * `signInAnonymously()` gives a real uid, but that uid belongs to a BROWSER
 * PROFILE, not to the parent. Consequences the users actually hit:
 *   • another phone / another laptop = another uid = another empty
 *     `parents/{uid}`, so the profile and purchases never follow the parent;
 *   • clearing site data (or an IndexedDB eviction) mints a fresh uid and the
 *     account looks wiped.
 * The child's academic data is unaffected either way — attendance, DPP and
 * tests live under `batches/…/{studentId}` and the studentId comes from the
 * login code. But the parent's own subtree did not travel.
 *
 * ── THE FIX ────────────────────────────────────────────────────────────────
 * Firebase's standard anonymous-upgrade path, keyed on the credential the app
 * already has: the phone number is the username and the admin-issued login code
 * is the password. On a verified login we `linkWithCredential()` the anonymous
 * user to a synthetic Email/Password identity derived from that pair.
 *
 *   • the uid does NOT change when you link — the anonymous account simply
 *     becomes permanent, so nothing already written is orphaned;
 *   • the SAME pair on a second device resolves to the SAME uid, because
 *     `signInWithCredential()` returns the account that owns it. One account,
 *     every device, shared `parents/{uid}`;
 *   • Email/Password costs nothing on Spark and sends no mail — the address is
 *     synthetic (`<number>@pwparent.local`) and the domain does not exist.
 *     No SMS, no billing, no new provider for the parent to remember.
 *
 * ── IF THE PROVIDER IS OFF ─────────────────────────────────────────────────
 * Should Email/Password be disabled in the console, every attempt fails with
 * `auth/operation-not-allowed`. That must not lock anyone out, so we degrade to
 * the plain anonymous session (the previous behaviour) and record why in
 * src/lib/identityStatus.ts for the settings panel to show.
 *
 * ── IF AN ADMIN RESETS THE CODE ────────────────────────────────────────────
 * The password is derived from the code, so a reset changes it. A device that
 * still holds the session does not need the password at all (the email matches,
 * so it is reused as-is) and re-syncs the password on that login — which is what
 * keeps other devices working. Only a device with NO live session, logging in
 * between the reset and that re-sync, falls back to anonymous; it still sees the
 * right child, and the note says the profile restarted.
 */
import {
  EmailAuthProvider,
  linkWithCredential,
  signInAnonymously,
  signInWithCredential,
  signOut as fbSignOut,
  updatePassword,
  type Auth,
  type User,
} from 'firebase/auth';
import {ensureSession, getFirebaseAuth, toLocalDigits, whenAuthReady} from './auth';
import {setIdentityNote} from '../identityStatus';

/** Synthetic domain. Never receives mail; it only has to be a valid address. */
export const IDENTITY_DOMAIN = 'pwparent.local';

/** Firebase requires at least 6 characters; login codes are 6 digits. */
const MIN_PASSWORD = 6;

const PROVIDER_OFF = 'This browser is holding the login on its own — the Email/Password provider is switched ' +
  'off in Firebase, so the same number on another device starts a separate profile.';
const CODE_CHANGED = 'The login code for this number was changed after the account was created, so this device ' +
  'started a fresh profile. Your child\'s records are untouched.';

/** Provider is disabled in the console — degrade, never lock the parent out. */
const DISABLED = new Set(['auth/operation-not-allowed', 'auth/configuration-not-found']);
/** The identity already exists (created on another device) — sign into it. */
const IN_USE = new Set([
  'auth/credential-already-in-use',
  'auth/email-already-in-use',
  'auth/account-exists-with-different-credential',
]);
/** The code no longer matches the stored password. */
const WRONG = new Set(['auth/wrong-password', 'auth/invalid-credential', 'auth/invalid-login-credentials']);
/** No account owns this identity yet — it has to be created by linking. */
const NOT_FOUND = new Set(['auth/user-not-found']);

/** How the session ended up held. Surfaced in the settings panel. */
export type IdentityState = 'linked' | 'anonymous';

export interface ClaimedIdentity {
  user: User;
  /** `linked` = permanent, same uid on every device. `anonymous` = this browser only. */
  state: IdentityState;
}

/** `<10 digits>@pwparent.local` — the username half of the credential. */
export function identityEmail(phone: string): string {
  const digits = toLocalDigits(phone);
  return digits ? `${digits}@${IDENTITY_DOMAIN}` : '';
}

/**
 * The password half: the admin-issued login code, padded deterministically when
 * an admin ever sets something shorter than Firebase's 6-character floor.
 *
 * Derived, never stored — knowing the code is what already grants access, so
 * this adds no new secret to leak and no new place to keep one.
 */
export function identityPassword(code: string): string {
  const trimmed = (code ?? '').trim();
  if (!trimmed) return '';
  return trimmed.length >= MIN_PASSWORD ? trimmed : `${trimmed}-${IDENTITY_DOMAIN}`;
}

function errorCode(error: unknown): string {
  return typeof (error as {code?: unknown})?.code === 'string' ? ((error as {code: string}).code) : '';
}

/** True when this auth user already IS the identity for that number. */
export function isIdentityFor(user: User | null, phone: string): boolean {
  const email = identityEmail(phone);
  return Boolean(user && email && !user.isAnonymous && user.email === email);
}

let resyncedFor: string | null = null;

/**
 * Re-derive the stored password from the code the parent just proved they know.
 *
 * Best effort and once per page load: it is what makes an admin's code reset
 * self-healing, because the next login on any device that still holds the
 * session pushes the new password up to Firebase Auth, so other devices can use
 * the new code too. `auth/requires-recent-login` (and "already that password")
 * are both harmless here.
 */
async function resyncPassword(user: User, password: string): Promise<void> {
  if (!password || resyncedFor === user.uid) return;
  resyncedFor = user.uid;
  try {
    await updatePassword(user, password);
  } catch {
    // Not recent enough to change a password, or nothing to change. Either way
    // the session we already have is valid — never fail a login over this.
  }
}

/** Keep the anonymous session and explain why it could not be made permanent. */
async function degrade(user: User, note: string): Promise<ClaimedIdentity> {
  setIdentityNote(note);
  return {user, state: 'anonymous'};
}

/** Drop whoever is signed in and open a plain anonymous session. */
async function freshAnonymous(instance: Auth, note: string): Promise<ClaimedIdentity> {
  setIdentityNote(note);
  await fbSignOut(instance).catch(() => undefined);
  const credential = await signInAnonymously(instance);
  return {user: credential.user, state: 'anonymous'};
}

/**
 * Resolve the permanent identity for one verified (number, code) login.
 *
 * Called AFTER the code has been checked against `credentials/{phone}` — the
 * code is the password here, so nothing about it is trusted before that.
 */
export async function claimIdentity(phone: string, code: string): Promise<ClaimedIdentity> {
  const instance = getFirebaseAuth();
  await whenAuthReady();

  const digits = toLocalDigits(phone);
  const password = identityPassword(code);
  if (!digits || !password) {
    // No credential to derive from: fall back to the anonymous-only behaviour.
    return {user: await ensureSession(), state: 'anonymous'};
  }
  const email = identityEmail(digits);
  const credential = () => EmailAuthProvider.credential(email, password);

  let user = instance.currentUser ?? (await ensureSession());

  // Already signed in as this number (the common refresh case): reuse it.
  if (isIdentityFor(user, digits)) {
    setIdentityNote(null);
    void resyncPassword(user, password);
    return {user, state: 'linked'};
  }

  // ── anonymous → make it permanent, keeping the same uid ──────────────────
  if (user.isAnonymous) {
    try {
      const linked = await linkWithCredential(user, credential());
      setIdentityNote(null);
      return {user: linked.user, state: 'linked'};
    } catch (error) {
      const reason = errorCode(error);
      if (!IN_USE.has(reason)) {
        if (DISABLED.has(reason)) return degrade(user, PROVIDER_OFF);
        if (WRONG.has(reason)) return degrade(user, CODE_CHANGED);
        throw error;
      }
      // Created on another device: sign into THAT account so both devices share
      // one uid and one `parents/{uid}`.
    }
  }

  // ── identity exists (or this browser holds a different number) ───────────
  try {
    const signed = await signInWithCredential(instance, credential());
    setIdentityNote(null);
    void resyncPassword(signed.user, password);
    return {user: signed.user, state: 'linked'};
  } catch (error) {
    const reason = errorCode(error);
    if (NOT_FOUND.has(reason)) {
      // First login for this number while the browser is signed in as someone
      // else: drop that session, mint an anonymous one, then link it.
      await fbSignOut(instance).catch(() => undefined);
      const anon = (await signInAnonymously(instance)).user;
      try {
        const linked = await linkWithCredential(anon, credential());
        setIdentityNote(null);
        return {user: linked.user, state: 'linked'};
      } catch (inner) {
        const innerReason = errorCode(inner);
        if (DISABLED.has(innerReason)) return degrade(anon, PROVIDER_OFF);
        if (WRONG.has(innerReason) || IN_USE.has(innerReason)) return degrade(anon, CODE_CHANGED);
        throw inner;
      }
    }
    if (DISABLED.has(reason)) {
      return user.isAnonymous ? degrade(user, PROVIDER_OFF) : freshAnonymous(instance, PROVIDER_OFF);
    }
    if (WRONG.has(reason)) {
      return user.isAnonymous ? degrade(user, CODE_CHANGED) : freshAnonymous(instance, CODE_CHANGED);
    }
    throw error;
  }
}
