/**
 * Firebase Auth — phone/OTP flow used by LoginScreen + OtpScreen.
 *
 * Web phone auth needs a reCAPTCHA verifier. Two options:
 *   1. `RecaptchaVerifier` (visible/invisible widget) — used below.
 *   2. App Check with reCAPTCHA Enterprise — see docs/FIREBASE.md.
 *
 * Everything here is a no-op that throws a clear error when Firebase is not
 * configured, so the UI can fall back to mock mode.
 */
import {
  type ConfirmationResult,
  getAuth,
  onAuthStateChanged,
  signInWithPhoneNumber,
  signOut as fbSignOut,
  RecaptchaVerifier,
  type Auth,
  type User,
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
let verifier: RecaptchaVerifier | null = null;

export function getFirebaseAuth(): Auth {
  if (!isFirebaseReady || !firebaseApp) throw new FirebaseNotConfiguredError();
  if (!auth) auth = getAuth(firebaseApp);
  return auth;
}

/** Normalises "9335010032" / "+91 9335010032" -> "+919335010032". */
export function toE164(rawPhone: string, defaultCountryCode = '+91'): string {
  const digits = (rawPhone ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (rawPhone.trim().startsWith('+')) return `+${digits}`;
  if (digits.length === 10) return `${defaultCountryCode}${digits}`;
  return `+${digits}`;
}

function getVerifier(): RecaptchaVerifier {
  if (!isFirebaseReady) throw new FirebaseNotConfiguredError();
  if (!verifier) {
    verifier = new RecaptchaVerifier(getFirebaseAuth(), 'recaptcha-container', {
      size: 'invisible',
    });
  }
  return verifier;
}

/** Step 1 — send the OTP. Returns a ConfirmationResult for step 2. */
export async function sendPhoneOtp(phoneE164: string): Promise<ConfirmationResult> {
  const authInstance = getFirebaseAuth();
  return signInWithPhoneNumber(authInstance, phoneE164, getVerifier());
}

/** Step 2 — verify the 6-digit OTP. */
export async function confirmPhoneOtp(
  confirmation: ConfirmationResult,
  code: string,
): Promise<User> {
  const result = await confirmation.confirm(code.trim());
  return result.user;
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
