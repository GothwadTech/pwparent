/**
 * Firebase Auth — anonymous session used by the whole app.
 *
 * WHY ANONYMOUS AND NOT PHONE OTP
 * -------------------------------
 * Firebase Phone Auth (SMS) requires a linked Cloud Billing account (Blaze)
 * since 2024-09-01. On the free Spark plan it fails with
 * `auth/billing-not-enabled`. So this app does NOT send SMS.
 *
 * Instead we call `signInAnonymously()`, which is free up to 50,000 MAU and
 * — crucially — hands us a real, stable `uid`. That `uid` is what Firestore
 * security rules key on (`request.auth.uid`), so every parent's data stays
 * isolated even though the phone number itself is never verified.
 *
 * The phone number the user types is stored as a PROFILE FIELD at
 * `parents/{uid}.mobileNumber`, not as a credential. See docs/FIREBASE.md.
 *
 * Every export below is a safe no-op that throws a clear error when Firebase
 * is not configured, so the UI falls back to mock mode instead of crashing.
 */
import {
  type Auth,
  type User,
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signOut as fbSignOut,
} from 'firebase/auth';
import {firebaseApp, isFirebaseReady} from './app';

export class FirebaseNotConfiguredError extends Error {
  constructor(feature = 'Firebase Auth') {
    super(
      `${feature} is not configured. Add the VITE_FIREBASE_* variables and set ` +
        `VITE_BACKEND_MODE=firebase (see docs/FIREBASE.md).`,
    );
    this.name = 'FirebaseNotConfiguredError';
  }
}

let auth: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (!isFirebaseReady || !firebaseApp) throw new FirebaseNotConfiguredError();
  if (!auth) auth = getAuth(firebaseApp);
  return auth;
}

/**
 * Normalises "9000000000" / "+91 9000000000" / "+91-90000-00000" -> "+919000000000".
 * Used only to store a tidy value — it is not a credential.
 */
export function toE164(rawPhone: string, defaultCountryCode = '+91'): string {
  const digits = (rawPhone ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (rawPhone.trim().startsWith('+')) return `+${digits}`;
  if (digits.length === 10) return `${defaultCountryCode}${digits}`;
  return `+${digits}`;
}

/** Strips everything but digits and caps at 10 — what the login field collects. */
export function toLocalDigits(rawPhone: string): string {
  return (rawPhone ?? '').replace(/\D/g, '').slice(-10);
}

/**
 * Wait until Firebase Auth has finished restoring its persisted user.
 *
 * ── WHY ────────────────────────────────────────────────────────────────────
 * `getAuth().currentUser` is `null` for the first few hundred milliseconds
 * after a page load, even for a visitor who is signed in: Firebase reads the
 * session back from IndexedDB asynchronously and only then fires
 * `onAuthStateChanged`. Any boot logic that peeked at `currentUser` straight
 * away concluded "logged out" — and the next `signInAnonymously()` then minted
 * a DIFFERENT uid, which is an empty `parents/{uid}` subtree. That is the
 * refresh-logs-me-out bug, and this gate is what closes it.
 *
 * The first `onAuthStateChanged` emission is the signal that restoration is
 * done (it fires with the user, or with `null` when there genuinely is none).
 * A timeout resolves with whatever is current rather than hanging the boot
 * forever if the SDK never emits.
 */
let readyPromise: Promise<User | null> | null = null;

export function whenAuthReady(timeoutMs = 5_000): Promise<User | null> {
  if (readyPromise) return readyPromise;
  const instance = getFirebaseAuth();
  readyPromise = new Promise<User | null>((resolve) => {
    let settled = false;
    const finish = (user: User | null) => {
      if (settled) return;
      settled = true;
      unsubscribe();
      clearTimeout(timer);
      resolve(user);
    };
    const unsubscribe = onAuthStateChanged(instance, (user) => finish(user));
    const timer = setTimeout(() => finish(instance.currentUser), timeoutMs);
  });
  return readyPromise;
}

/** Test/edge helper — forget the cached readiness so the next call re-waits. */
export function resetAuthReadiness(): void {
  readyPromise = null;
}

/**
 * Return the current user, signing in anonymously if there isn't one yet.
 *
 * Anonymous sign-in is idempotent: Firebase persists the session in
 * IndexedDB/localStorage, so a returning visitor keeps the SAME uid and
 * therefore keeps their data — provided we WAIT for that persistence to load
 * first. Reading `currentUser` before `whenAuthReady()` resolved is what used
 * to hand every reload a brand-new uid.
 */
export async function ensureSession(): Promise<User> {
  const instance = getFirebaseAuth();
  const restored = await whenAuthReady();
  if (restored) return restored;
  if (instance.currentUser) return instance.currentUser;
  const credential = await signInAnonymously(instance);
  return credential.user;
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}

export async function signOut(): Promise<void> {
  await fbSignOut(getFirebaseAuth());
}

export function currentUserId(): string | null {
  if (!isFirebaseReady) return null;
  return getFirebaseAuth().currentUser?.uid ?? null;
}
