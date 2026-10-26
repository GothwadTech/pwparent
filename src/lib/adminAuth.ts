/**
 * Admin account — username + password, created exactly once, forever.
 *
 * ── THE MODEL ──────────────────────────────────────────────────────────────
 * The FIRST person to register becomes the one and only admin. Registration
 * then closes permanently: a singleton document at `adminConfig/singleton`
 * records that an admin exists, and `firestore.rules` refuses any further
 * `create` on both that document and `admins/{uid}` once it is present.
 *
 * Nobody can re-register, and the app cannot promote itself.
 *
 * ── WHERE THE PASSWORD ACTUALLY LIVES ──────────────────────────────────────
 * In **Firebase Auth (Email/Password)**, NOT in Firestore. We never store a
 * password — not even hashed — in a database the browser can read. Firebase
 * Auth does the hashing, the verification and the session handling.
 *
 * The username is mapped to a synthetic address:
 *     "ayush" -> "ayush@admin.pwparent.local"
 * The domain is local-only; no mail is ever sent to it.
 *
 * Firestore stores just the ROLE marker: `admins/{uid} = {username, role, createdAt}`.
 * That is what `isAdmin()` in the rules checks.
 *
 * ── REQUIREMENT ────────────────────────────────────────────────────────────
 * Firebase console -> Authentication -> Sign-in method ->
 *   BOTH "Anonymous" AND "Email/Password" must be Enabled.
 *
 * ⚠️ Register immediately after your first deploy. Whoever reaches the panel
 * first while `adminConfig/singleton` is absent becomes the admin, and that
 * cannot be undone from the app — only from the Firebase console.
 */
import {
  type User,
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  linkWithCredential,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {firebaseApp, isFirebaseReady} from './firebase/app';
import {FirebaseNotConfiguredError, getFirebaseAuth, signOut as authSignOut} from './firebase/auth';
import {getDb, paths} from './firebase/firestore';
import {doc, getDoc, setDoc, writeBatch} from 'firebase/firestore';

/** Synthetic domain for admin usernames. Never receives mail. */
const ADMIN_DOMAIN = 'admin.pwparent.local';

const USERNAME_RE = /^[a-z0-9._-]{3,30}$/;

export interface AdminIdentity {
  uid: string;
  username: string;
}

export class AdminAuthError extends Error {
  constructor(
    message: string,
    /** Firebase error code, when there was one. */
    readonly code?: string,
  ) {
    super(message);
    this.name = 'AdminAuthError';
  }
}

export function emailForUsername(username: string): string {
  return `${username.trim().toLowerCase()}@${ADMIN_DOMAIN}`;
}

export function usernameFromEmail(email: string): string {
  return email.split('@')[0] ?? email;
}

/** Throws a readable message instead of leaking raw Firebase error codes. */
function translate(error: unknown): never {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as {code: unknown}).code) : undefined;

  const map: Record<string, string> = {
    'auth/operation-not-allowed':
      'Email/Password sign-in is disabled. Firebase console → Authentication → Sign-in method → Email/Password → Enable.',
    'auth/invalid-email': 'That username cannot be used — it must be 3-30 characters: a-z, 0-9, dot, dash, underscore.',
    'auth/email-already-in-use': 'That username is already taken.',
    'auth/weak-password': 'Password must be at least 8 characters.',
    'auth/invalid-credential': 'Incorrect username or password.',
    'auth/wrong-password': 'Incorrect username or password.',
    'auth/user-not-found': 'Incorrect username or password.',
    'auth/too-many-requests': 'Too many attempts. Firebase has rate-limited this — wait a few minutes.',
    'auth/network-request-failed': 'Network error. Check the connection and try again.',
    'permission-denied': 'Firestore rules rejected the write. Publish firestore.rules (see docs/FIREBASE.md).',
  };

  throw new AdminAuthError(map[code ?? ''] ?? `Admin auth failed (${code ?? 'unknown error'}).`, code);
}

function requireFirebase() {
  if (!isFirebaseReady || !firebaseApp) throw new FirebaseNotConfiguredError('Admin Auth');
}

// ── registration state ─────────────────────────────────────────────────────

/**
 * Is the one-and-only admin slot still open?
 *
 * Reads the singleton marker. A missing document (or a denied read) means
 * "open" — the rules allow `create` only while the document does not exist,
 * so the worst case here is a registration attempt that Firestore rejects.
 */
export async function isRegistrationOpen(): Promise<boolean> {
  requireFirebase();
  try {
    const snap = await getDoc(doc(getDb(), paths.adminConfig()));
    return !snap.exists();
  } catch {
    // Unreadable (rules not published, DB missing). Let the attempt proceed and
    // surface the real error from the write.
    return true;
  }
}

export function validateUsername(username: string): string | null {
  const value = username.trim().toLowerCase();
  if (!value) return 'Username is required.';
  if (!USERNAME_RE.test(value)) return 'Use 3-30 characters: a-z, 0-9, dot, dash or underscore.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return 'Password must contain at least one letter and one number.';
  }
  return null;
}

// ── register / login ───────────────────────────────────────────────────────

/** Writes the role marker and closes registration, atomically. */
async function claimAdminSlot(user: User, username: string): Promise<void> {
  const db = getDb();
  const batch = writeBatch(db);

  batch.set(doc(db, paths.admin(user.uid)), {
    username,
    role: 'owner',
    createdAt: new Date().toISOString(),
  });
  // Deliberately stores NO username and NO secret — only the fact that the
  // slot is taken. This document is world-readable (rules: `allow read: if true`)
  // because the login screen must know whether to offer registration.
  batch.set(doc(db, paths.adminConfig()), {
    closedAt: new Date().toISOString(),
    reason: 'admin-registered',
  });

  await batch.commit();
}

/**
 * Create the one-and-only admin.
 *
 * If an anonymous session already exists it is UPGRADED via `linkWithCredential`
 * so the uid — and therefore any `parents/{uid}` data already written — is
 * preserved. Otherwise a fresh email/password account is created.
 */
export async function registerAdmin(username: string, password: string): Promise<AdminIdentity> {
  requireFirebase();

  const nameError = validateUsername(username);
  if (nameError) throw new AdminAuthError(nameError);
  const passError = validatePassword(password);
  if (passError) throw new AdminAuthError(passError);

  if (!(await isRegistrationOpen())) {
    throw new AdminAuthError(
      'Registration is closed — an admin already exists. Use the login form. ' +
        'Resetting requires the Firebase console (Authentication → Users).',
    );
  }

  const name = username.trim().toLowerCase();
  const email = emailForUsername(name);
  const auth = getFirebaseAuth();

  let user: User;
  try {
    if (auth.currentUser && auth.currentUser.isAnonymous) {
      // Upgrade in place: same uid, data preserved.
      const credential = EmailAuthProvider.credential(email, password);
      user = (await linkWithCredential(auth.currentUser, credential)).user;
    } else {
      user = (await createUserWithEmailAndPassword(auth, email, password)).user;
    }
  } catch (error) {
    translate(error);
  }

  try {
    await claimAdminSlot(user, name);
  } catch (error) {
    // The account exists but the role marker failed — sign back out so the
    // caller is not left in a half-admin state, then surface the real cause.
    await authSignOut().catch(() => undefined);
    translate(error);
  }

  return {uid: user.uid, username: name};
}

/** Sign in as the existing admin and confirm the role marker is present. */
export async function loginAdmin(username: string, password: string): Promise<AdminIdentity> {
  requireFirebase();

  const name = username.trim().toLowerCase();
  if (!name) throw new AdminAuthError('Username is required.');
  if (!password) throw new AdminAuthError('Password is required.');

  const auth = getFirebaseAuth();
  let user: User;
  try {
    user = (await signInWithEmailAndPassword(auth, emailForUsername(name), password)).user;
  } catch (error) {
    translate(error);
  }

  // Password correct, but is this uid actually an admin? Stops a regular
  // email/password user (if one is ever created) from reaching the panel.
  try {
    const roleDoc = await getDoc(doc(getDb(), paths.admin(user.uid)));
    if (!roleDoc.exists()) {
      await authSignOut().catch(() => undefined);
      throw new AdminAuthError(
        'This account is not an admin. The admins/{uid} role document is missing.',
      );
    }
    const stored = roleDoc.data() as {username?: string};
    return {uid: user.uid, username: stored?.username ?? name};
  } catch (error) {
    if (error instanceof AdminAuthError) throw error;
    translate(error);
  }
}

/** Sign the admin out and drop back to an anonymous session for the parent flow. */
export async function logoutAdmin(): Promise<void> {
  requireFirebase();
  await authSignOut();
}

/** Who is signed in right now, if it is an admin. */
export function currentAdmin(): AdminIdentity | null {
  if (!isFirebaseReady) return null;
  const user = getFirebaseAuth().currentUser;
  if (!user || user.isAnonymous || !user.email?.endsWith(`@${ADMIN_DOMAIN}`)) return null;
  return {uid: user.uid, username: usernameFromEmail(user.email)};
}

/** Convenience for the UI: is anyone signed in at all (admin or anonymous)? */
export function hasSession(): boolean {
  if (!isFirebaseReady) return false;
  return getFirebaseAuth().currentUser !== null;
}

/**
 * Writes a fresh document without merge — used for the role marker so a stale
 * field can never survive. Exported for tests.
 */
export async function overwriteDoc(path: string, data: Record<string, unknown>): Promise<void> {
  await setDoc(doc(getDb(), path), data, {merge: false});
}
