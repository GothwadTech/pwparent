/**
 * Backend facade.
 *
 * The UI should import from here (`@/src/lib/backend`) and never from
 * `firebase/*` directly. That keeps every screen working in MOCK mode while
 * you set up Firebase, and flipping `VITE_BACKEND_MODE=firebase` switches the
 * data source without touching components.
 *
 * Wiring guide: docs/FIREBASE.md
 */
import type {AnnouncementItem, ParentProfileData, PurchaseItem, StudentProfile} from '../../types';
import {backendMode, isFirebaseEnabled} from '../config';
import {
  MOCK_OTP,
  mockAnnouncements,
  mockParentProfile,
  mockPurchases,
  mockStudents,
} from './mockData';

export interface SendOtpResult {
  mode: 'mock' | 'firebase';
  /** Present only in firebase mode; needed by verifyOtp(). */
  confirmation?: unknown;
  /** Hint shown in dev when running on mock data. */
  mockHint?: string;
}

export interface Backend {
  readonly mode: 'mock' | 'firebase';
  getLinkedStudents(parentUid?: string | null): Promise<StudentProfile[]>;
  getAnnouncements(): Promise<AnnouncementItem[]>;
  getPurchases(parentUid?: string | null): Promise<PurchaseItem[]>;
  getParentProfile(parentUid?: string | null): Promise<ParentProfileData>;
  saveParentProfile(data: ParentProfileData, parentUid?: string | null): Promise<void>;
  sendOtp(phone: string): Promise<SendOtpResult>;
  verifyOtp(code: string, sendResult?: SendOtpResult): Promise<{ok: boolean; uid?: string | null; error?: string}>;
  signOut(): Promise<void>;
}

/** Small delay so loading states are visible in mock mode. */
const delay = (ms = 250) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const mockBackend: Backend = {
  mode: 'mock',

  async getLinkedStudents() {
    await delay();
    return mockStudents;
  },

  async getAnnouncements() {
    await delay();
    return mockAnnouncements;
  },

  async getPurchases() {
    await delay();
    return mockPurchases;
  },

  async getParentProfile() {
    await delay();
    return mockParentProfile;
  },

  async saveParentProfile(data) {
    await delay();
    // Mock mode is stateless: callers keep this in React state.
    return void data;
  },

  async sendOtp(phone) {
    await delay(400);
    return {
      mode: 'mock',
      mockHint: `Mock mode: OTP is ${MOCK_OTP} for ${phone}. Set VITE_BACKEND_MODE=firebase for real SMS.`,
    };
  },

  async verifyOtp(code) {
    await delay(400);
    if (code.trim() === MOCK_OTP) return {ok: true, uid: 'mock-parent'};
    return {ok: false, error: `Invalid OTP. Use ${MOCK_OTP} in mock mode.`};
  },

  async signOut() {
    await delay(100);
  },
};

/**
 * Firebase-backed implementation. Imported lazily so the Firebase SDK stays out
 * of the main bundle while you are running in mock mode.
 */
async function firebaseBackend(): Promise<Backend> {
  const [{paths, readCollection, readDoc, writeDoc}, auth] = await Promise.all([
    import('../firebase/firestore'),
    import('../firebase/auth'),
  ]);

  const uid = () => auth.currentUserId();

  return {
    mode: 'firebase',

    async getLinkedStudents(parentUid) {
      const id = parentUid ?? uid();
      if (!id) return [];
      return readCollection<StudentProfile>(paths.children(id));
    },

    async getAnnouncements() {
      return readCollection<AnnouncementItem>(paths.announcements());
    },

    async getPurchases(parentUid) {
      const id = parentUid ?? uid();
      if (!id) return [];
      return readCollection<PurchaseItem>(paths.purchases(id));
    },

    async getParentProfile(parentUid) {
      const id = parentUid ?? uid();
      if (!id) return mockParentProfile;
      const stored = await readDoc<ParentProfileData>(paths.parent(id));
      return stored ?? {...mockParentProfile, name: 'Parent'};
    },

    async saveParentProfile(data, parentUid) {
      const id = parentUid ?? uid();
      if (!id) throw new Error('Not signed in');
      await writeDoc(paths.parent(id), {...data} as unknown as Record<string, unknown>);
    },

    async sendOtp(phone) {
      const confirmation = await auth.sendPhoneOtp(auth.toE164(phone));
      return {mode: 'firebase', confirmation};
    },

    async verifyOtp(code, sendResult) {
      const confirmation = sendResult?.confirmation as never;
      if (!confirmation) return {ok: false, error: 'Call sendOtp() first.'};
      try {
        const user = await auth.confirmPhoneOtp(confirmation, code);
        return {ok: true, uid: user.uid};
      } catch (error) {
        return {ok: false, error: error instanceof Error ? error.message : 'OTP verification failed'};
      }
    },

    async signOut() {
      await auth.signOut();
    },
  };
}

let cached: Backend | null = null;

/** Resolve the active backend (mock by default, Firebase when enabled). */
export async function getBackend(): Promise<Backend> {
  if (cached) return cached;
  cached = isFirebaseEnabled ? await firebaseBackend() : mockBackend;
  return cached;
}

/** Sync accessor for components that just need the mode badge. */
export const activeBackendMode = backendMode;
export const usingMockData = !isFirebaseEnabled;

export {MOCK_OTP, mockStudents, mockParentProfile, mockAnnouncements, mockPurchases};
