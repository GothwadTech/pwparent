/**
 * Backend facade — the ONLY module UI code should import for data.
 *
 *     import {getBackend} from './lib/backend';
 *
 * Resolution:
 *
 *   VITE_BACKEND_MODE=firebase + complete config  -> Firestore (production path)
 *   VITE_BACKEND_MODE=firebase + incomplete config -> UNCONFIGURED (empty + a
 *                                                   visible setup error, never
 *                                                   invented data)
 *   VITE_BACKEND_MODE=mock                       -> localStorage (dev + tests)
 *
 * The third state matters: this app has no demo dataset, so a half-filled env
 * must say "Firebase is not configured" rather than quietly rendering fake
 * marks. `backendConfigError` carries that message to the UI.
 */
import type {AnnouncementItem, ParentProfileData, PurchaseItem, StudentProfile} from '../../types';
import {isFirebaseEnabled, isMisconfiguredFirebase, missingFirebaseKeys, FIREBASE_ENV_NAMES} from '../config';
import type {Backend, BackendMode, LoginCodeInfo, SendOtpResult, Session} from './types';
import {emptyProfile} from './types';
import {mockBackend} from './mockBackend';
import {cacheStats, resetCache} from './readCache';

export type {Backend, BackendMode, LoginCodeInfo, SendOtpResult, Session};
export {emptyProfile};
export {cacheStats, resetCache};

/** Non-null when Firebase was requested but the env is incomplete. */
export const backendConfigError: string | null = isMisconfiguredFirebase
  ? `Firebase is not configured. Missing: ${missingFirebaseKeys()
      .map((k) => FIREBASE_ENV_NAMES[k] ?? k)
      .join(', ')}. Add them in Cloudflare Pages → Settings → Environment variables, then retry the deployment.`
  : null;

/**
 * Returned when the env asked for Firebase but cannot deliver it.
 *
 * Every read resolves empty and every write fails loudly, so the UI shows
 * empty states + the setup banner instead of pretending to work.
 */
const unconfiguredBackend: Backend = {
  mode: 'mock',

  async signInWithPhone(): Promise<Session> {
    throw new Error(backendConfigError ?? 'Firebase is not configured.');
  },
  async restoreSession(): Promise<Session | null> {
    return null;
  },
  async signOut() {},
  currentUid: () => null,

  async sendOtp(): Promise<SendOtpResult> {
    return {mode: 'mock', phone: '', registered: false, notice: backendConfigError ?? undefined};
  },
  async verifyOtp() {
    return {ok: false, error: backendConfigError ?? 'Firebase is not configured.'};
  },

  async setLoginCode() {
    throw new Error(backendConfigError ?? 'Firebase is not configured.');
  },
  async deleteLoginCode() {
    throw new Error(backendConfigError ?? 'Firebase is not configured.');
  },
  async listLoginCodes(): Promise<LoginCodeInfo[]> {
    return [];
  },

  async getParentProfile(): Promise<ParentProfileData> {
    return emptyProfile();
  },
  async saveParentProfile() {
    throw new Error(backendConfigError ?? 'Firebase is not configured.');
  },

  async getLinkedStudents(): Promise<StudentProfile[]> {
    return [];
  },
  async saveStudent() {
    throw new Error(backendConfigError ?? 'Firebase is not configured.');
  },
  async deleteStudent() {
    throw new Error(backendConfigError ?? 'Firebase is not configured.');
  },

  async getAnnouncements(): Promise<AnnouncementItem[]> {
    return [];
  },
  async saveAnnouncement() {
    throw new Error(backendConfigError ?? 'Firebase is not configured.');
  },
  async deleteAnnouncement() {
    throw new Error(backendConfigError ?? 'Firebase is not configured.');
  },

  async getPurchases(): Promise<PurchaseItem[]> {
    return [];
  },
  async savePurchase() {
    throw new Error(backendConfigError ?? 'Firebase is not configured.');
  },

  clearCache() {
    resetCache();
  },
};

let cached: Backend | null = null;

/**
 * Resolve the active backend.
 *
 * The Firebase implementation is imported lazily so its ~450 kB chunk stays out
 * of the bundle path until it is actually needed.
 */
export async function getBackend(): Promise<Backend> {
  if (cached) return cached;

  if (isMisconfiguredFirebase) {
    cached = unconfiguredBackend;
  } else if (isFirebaseEnabled) {
    const {createFirebaseBackend} = await import('./firebaseBackend');
    cached = createFirebaseBackend();
  } else {
    cached = mockBackend;
  }

  return cached;
}

/** Which mode the app resolved to — for the Settings sheet badge. */
export const activeBackendMode: BackendMode = isMisconfiguredFirebase
  ? 'mock'
  : isFirebaseEnabled
    ? 'firebase'
    : 'mock';

export const usingMockData = !isFirebaseEnabled;

// Re-exported so existing imports (`from '../lib/backend'`) keep working.
export {MOCK_OTP, CODE_LENGTH, mockStudents, mockParentProfile, mockAnnouncements, mockPurchases} from './mockData';
